import {
  createLeaveBalance,
  createLeaveRequestRecord,
  createLeaveTypeRecord,
  createPublicHoliday,
  findEmployeeById,
  findLeaveBalance,
  findLeaveBalanceById,
  findLeaveRequestById,
  findLeaveTypeById,
  listCompanyEmployees,
  listDirectReportEmployees,
  listLeaveBalances,
  listLeaveRequests,
  listLeaveTypesByCompany,
  listPublicHolidays,
  revokeLeaveBalance,
  updateLeaveBalance,
  updateLeaveRequestStatus,
} from '../model/common/leave.model.js'
import Holidays from 'date-holidays'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const toTwo = (value) => Number(Number(value || 0).toFixed(2))

const normalizeYear = (value) => {
  const year = Number(value)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createHttpError('Invalid leave year.', 400)
  }
  return year
}

const getDaysInclusive = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createHttpError('Invalid leave dates.', 400)
  }

  if (end < start) {
    throw createHttpError('End date must be on or after start date.', 400)
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return toTwo(diffDays)
}

const ensureActor = async (actorId) => {
  const { data: actor, error } = await findEmployeeById(actorId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!actor) {
    throw createHttpError('Authenticated user not found.', 401)
  }

  if (!actor.company_id) {
    throw createHttpError('Authenticated user company not found.', 400)
  }

  return actor
}

const ensureLeaveTypeInCompany = async ({ leaveTypeId, companyId }) => {
  const { data: leaveType, error } = await findLeaveTypeById(leaveTypeId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!leaveType || leaveType.company_id !== companyId || !leaveType.is_active) {
    throw createHttpError('Leave type not found for this company.', 404)
  }

  return leaveType
}

const ensureEmployeeInCompany = async ({ employeeId, companyId }) => {
  const { data: employee, error } = await findEmployeeById(employeeId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!employee || employee.company_id !== companyId) {
    throw createHttpError('Employee not found in your company.', 404)
  }

  return employee
}

const getBalanceRemaining = (balance) => {
  if (balance?.is_revoked) {
    return 0
  }

  const allocated = toTwo(balance?.allocated_days)
  const used = toTwo(balance?.used_days)
  const carried = toTwo(balance?.carried_forward_days)
  const adjustment = toTwo(balance?.adjustment_days)
  return toTwo(allocated + carried + adjustment - used)
}

const enrichWithMaps = async ({ actor, rows, includeBalances = false }) => {
  const leaveTypesResult = await listLeaveTypesByCompany(actor.company_id)
  if (leaveTypesResult.error) {
    throw createHttpError(leaveTypesResult.error.message, 500)
  }

  const employeesResult = await listCompanyEmployees(actor.company_id)
  if (employeesResult.error) {
    throw createHttpError(employeesResult.error.message, 500)
  }

  const leaveTypeMap = new Map((leaveTypesResult.data || []).map((row) => [row.id, row]))
  const employeeMap = new Map((employeesResult.data || []).map((row) => [row.id, row]))

  if (!includeBalances) {
    return rows.map((row) => ({
      ...row,
      employee: employeeMap.get(row.employee_id) || null,
      approver: row.approved_by_employee_id ? employeeMap.get(row.approved_by_employee_id) || null : null,
      leave_type: leaveTypeMap.get(row.leave_type_id) || null,
    }))
  }

  return rows.map((row) => ({
    ...row,
    remaining_days: getBalanceRemaining(row),
    employee: employeeMap.get(row.employee_id) || null,
    leave_type: leaveTypeMap.get(row.leave_type_id) || null,
  }))
}

const canManageCompanyLeaves = (role) => role === 'admin' || role === 'hr'
const canApproveLeaves = (role) => role === 'admin' || role === 'hr' || role === 'manager'
const AUTO_HOLIDAY_COUNTRY = 'IN'

const getAutomaticPublicHolidays = (year) => {
  const holidayCalendar = new Holidays(AUTO_HOLIDAY_COUNTRY)
  const rows = holidayCalendar.getHolidays(year) || []

  return rows
    .filter((row) => row.type === 'public')
    .map((row) => ({
      id: `auto-${AUTO_HOLIDAY_COUNTRY}-${row.date}`,
      company_id: null,
      name: row.name,
      holiday_date: String(row.date).slice(0, 10),
      description: row.note || null,
      is_optional: false,
      created_by_employee_id: null,
      created_at: null,
      updated_at: null,
      source: 'auto',
    }))
}

const mergeHolidayRows = (automaticRows = [], manualRows = []) => {
  const map = new Map()

  ;[...automaticRows, ...manualRows].forEach((row) => {
    const key = `${row.holiday_date}-${row.name}`
    if (!map.has(key)) {
      map.set(key, row)
      return
    }

    const existing = map.get(key)
    map.set(key, {
      ...existing,
      ...row,
      source: existing.source === 'manual' || row.source === 'manual' ? 'manual' : 'auto',
    })
  })

  return [...map.values()].sort((left, right) => String(left.holiday_date).localeCompare(String(right.holiday_date)))
}

const isAllocationAllowed = ({ actorRole, targetRole, targetEmployeeId, actorEmployeeId }) => {
  if (targetEmployeeId === actorEmployeeId) {
    return false
  }

  if (actorRole === 'admin') {
    return ['hr', 'manager'].includes(targetRole)
  }

  if (actorRole === 'hr') {
    return targetRole === 'employee'
  }

  return false
}

const isDirectReport = async ({ managerEmployeeId, employeeId }) => {
  const { data: reports, error } = await listDirectReportEmployees(managerEmployeeId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return (reports || []).some((row) => row.id === employeeId)
}

export const listLeaveTypes = async ({ actorId }) => {
  const actor = await ensureActor(actorId)

  const { data, error } = await listLeaveTypesByCompany(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data || []
}

export const createLeaveType = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)

  if (!canManageCompanyLeaves(actor.role)) {
    throw createHttpError('Only admin or HR can create leave types.', 403)
  }

  const name = String(payload?.name || '').trim()
  const code = String(payload?.code || '').trim().toUpperCase()

  if (!name || !code) {
    throw createHttpError('name and code are required.', 400)
  }

  const { data, error } = await createLeaveTypeRecord({
    company_id: actor.company_id,
    name,
    code,
    is_active: true,
    created_by_employee_id: actor.id,
  })

  if (error) {
    const codeHint = String(error.message || '').includes('uq_leave_types_company_code')
    if (codeHint) {
      throw createHttpError('Leave code already exists in your company.', 409)
    }
    throw createHttpError(error.message, 500)
  }

  return data
}

export const listAllocationEmployees = async ({ actorId }) => {
  const actor = await ensureActor(actorId)

  if (canManageCompanyLeaves(actor.role)) {
    const { data, error } = await listCompanyEmployees(actor.company_id)
    if (error) {
      throw createHttpError(error.message, 500)
    }

    const allowedRoles = actor.role === 'admin' ? ['hr', 'manager'] : ['employee']
    return (data || []).filter((employee) => employee.id !== actor.id && allowedRoles.includes(employee.role))
  }

  return []
}

export const allocateLeaveBalance = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)

  if (!canManageCompanyLeaves(actor.role)) {
    throw createHttpError('Only admin or HR can allocate leave.', 403)
  }

  const employeeId = payload?.employee_id
  const leaveTypeId = payload?.leave_type_id
  const year = normalizeYear(payload?.year || new Date().getUTCFullYear())
  const allocatedDays = toTwo(payload?.allocated_days)
  const adjustmentDays = toTwo(payload?.adjustment_days)

  if (!employeeId || !leaveTypeId) {
    throw createHttpError('employee_id and leave_type_id are required.', 400)
  }

  if (allocatedDays < 0) {
    throw createHttpError('allocated_days must be zero or positive.', 400)
  }

  const targetEmployee = await ensureEmployeeInCompany({ employeeId, companyId: actor.company_id })
  await ensureLeaveTypeInCompany({ leaveTypeId, companyId: actor.company_id })

  if (!isAllocationAllowed({
    actorRole: actor.role,
    targetRole: targetEmployee.role,
    targetEmployeeId: targetEmployee.id,
    actorEmployeeId: actor.id,
  })) {
    throw createHttpError('You are not allowed to allocate leave to this employee.', 403)
  }

  const previousYear = year - 1
  const { data: previousYearBalance, error: previousYearBalanceError } = await findLeaveBalance({
    employeeId,
    leaveTypeId,
    year: previousYear,
  })

  if (previousYearBalanceError) {
    throw createHttpError(previousYearBalanceError.message, 500)
  }

  const carriedForwardDays = toTwo(Math.max(getBalanceRemaining(previousYearBalance), 0))

  const { data: existing, error: existingError } = await findLeaveBalance({
    employeeId,
    leaveTypeId,
    year,
  })

  if (existingError) {
    throw createHttpError(existingError.message, 500)
  }

  if (!existing) {
    const { data: created, error: createError } = await createLeaveBalance({
      company_id: actor.company_id,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      allocated_days: allocatedDays,
      used_days: 0,
      carried_forward_days: carriedForwardDays,
      adjustment_days: adjustmentDays,
      is_revoked: false,
      revoked_at: null,
      revoked_by_employee_id: null,
      revocation_reason: null,
      created_by_employee_id: actor.id,
    })

    if (createError) {
      throw createHttpError(createError.message, 500)
    }

    return {
      ...created,
      remaining_days: getBalanceRemaining(created),
    }
  }

  const { data: updated, error: updateError } = await updateLeaveBalance(existing.id, {
    allocated_days: allocatedDays,
    carried_forward_days: carriedForwardDays,
    adjustment_days: adjustmentDays,
    is_revoked: false,
    revoked_at: null,
    revoked_by_employee_id: null,
    revocation_reason: null,
    updated_at: new Date().toISOString(),
  })

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  return {
    ...updated,
    remaining_days: getBalanceRemaining(updated),
  }
}


export const revokeLeaveAllocation = async ({ actorId, balanceId, payload }) => {
  const actor = await ensureActor(actorId)

  if (!canManageCompanyLeaves(actor.role)) {
    throw createHttpError('Only admin or HR can revoke leave allocations.', 403)
  }

  const revocationReason = String(payload?.reason || '').trim()
  if (!revocationReason) {
    throw createHttpError('Revocation reason is required.', 400)
  }

  const { data: balance, error: balanceError } = await findLeaveBalanceById(balanceId)

  if (balanceError) {
    throw createHttpError(balanceError.message, 500)
  }

  const currentBalance = balance

  if (!currentBalance || currentBalance.company_id !== actor.company_id) {
    throw createHttpError('Leave allocation not found.', 404)
  }

  const { data: targetEmployee, error: targetEmployeeError } = await findEmployeeById(currentBalance.employee_id)

  if (targetEmployeeError) {
    throw createHttpError(targetEmployeeError.message, 500)
  }

  if (!targetEmployee || targetEmployee.company_id !== actor.company_id) {
    throw createHttpError('Leave allocation not found.', 404)
  }

  if (!isAllocationAllowed({
    actorRole: actor.role,
    targetRole: targetEmployee.role,
    targetEmployeeId: targetEmployee.id,
    actorEmployeeId: actor.id,
  })) {
    throw createHttpError('You are not allowed to revoke this leave allocation.', 403)
  }

  if (currentBalance.is_revoked) {
    throw createHttpError('This leave allocation is already revoked.', 409)
  }

  if (toTwo(currentBalance.used_days) > 0) {
    throw createHttpError('Cannot revoke an allocation after leave has already been used.', 400)
  }

  const { data, error } = await revokeLeaveBalance({
    balanceId,
    payload: {
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by_employee_id: actor.id,
      revocation_reason: revocationReason,
      updated_at: new Date().toISOString(),
    },
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return {
    ...data,
    remaining_days: getBalanceRemaining(data),
  }
}
export const getLeaveBalances = async ({ actorId, employeeId, year }) => {
  const actor = await ensureActor(actorId)

  const normalizedYear = year ? normalizeYear(year) : null
  let effectiveEmployeeId = actor.id

  if (employeeId && employeeId !== actor.id) {
    if (canManageCompanyLeaves(actor.role)) {
      await ensureEmployeeInCompany({ employeeId, companyId: actor.company_id })
      effectiveEmployeeId = employeeId
    } else if (actor.role === 'manager') {
      const allowed = await isDirectReport({ managerEmployeeId: actor.id, employeeId })
      if (!allowed) {
        throw createHttpError('You can view balances only for your direct reports.', 403)
      }
      effectiveEmployeeId = employeeId
    } else {
      throw createHttpError('You can only view your own leave balances.', 403)
    }
  }

  const { data, error } = await listLeaveBalances({
    companyId: actor.company_id,
    employeeId: effectiveEmployeeId,
    year: normalizedYear,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return enrichWithMaps({ actor, rows: data || [], includeBalances: true })
}

export const createLeaveRequest = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)

  const leaveTypeId = payload?.leave_type_id
  const startDate = payload?.start_date
  const endDate = payload?.end_date
  const reason = String(payload?.reason || '').trim()

  if (!leaveTypeId || !startDate || !endDate || !reason) {
    throw createHttpError('leave_type_id, start_date, end_date and reason are required.', 400)
  }

  await ensureLeaveTypeInCompany({ leaveTypeId, companyId: actor.company_id })

  const year = normalizeYear(new Date(`${startDate}T00:00:00.000Z`).getUTCFullYear())
  const totalDays = getDaysInclusive(startDate, endDate)

  const { data: balance, error: balanceError } = await findLeaveBalance({
    employeeId: actor.id,
    leaveTypeId,
    year,
  })

  if (balanceError) {
    throw createHttpError(balanceError.message, 500)
  }

  const remaining = getBalanceRemaining(balance)

  if (!balance || balance.is_revoked || remaining < totalDays) {
    throw createHttpError(`Insufficient leave balance. Remaining days: ${remaining}.`, 400)
  }

  const { data, error } = await createLeaveRequestRecord({
    company_id: actor.company_id,
    employee_id: actor.id,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    total_days: totalDays,
    reason,
    status: 'pending',
    applied_at: new Date().toISOString(),
    approved_by_employee_id: null,
    approved_at: null,
    rejection_reason: null,
    approver_comment: null,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const listLeaveRequestsByScope = async ({ actorId, scope = 'my', status }) => {
  const actor = await ensureActor(actorId)
  const normalizedScope = String(scope || 'my')

  if (!['my', 'team', 'company'].includes(normalizedScope)) {
    throw createHttpError('Invalid leave request scope.', 400)
  }

  let employeeIds = []

  if (normalizedScope === 'my') {
    employeeIds = [actor.id]
  } else if (normalizedScope === 'team') {
    if (actor.role !== 'manager') {
      throw createHttpError('Only managers can list team leave requests.', 403)
    }

    const { data: reports, error: reportsError } = await listDirectReportEmployees(actor.id)

    if (reportsError) {
      throw createHttpError(reportsError.message, 500)
    }

    employeeIds = (reports || []).map((row) => row.id)
  } else {
    if (!canManageCompanyLeaves(actor.role)) {
      throw createHttpError('Only admin or HR can list company leave requests.', 403)
    }
    employeeIds = null
  }

  const requestPromises = []

  if (employeeIds === null) {
    requestPromises.push(
      listLeaveRequests({
        companyId: actor.company_id,
        status,
      })
    )
  } else if (!employeeIds.length) {
    return []
  } else {
    employeeIds.forEach((employeeId) => {
      requestPromises.push(
        listLeaveRequests({
          companyId: actor.company_id,
          employeeId,
          status,
        })
      )
    })
  }

  const results = await Promise.all(requestPromises)

  results.forEach((result) => {
    if (result.error) {
      throw createHttpError(result.error.message, 500)
    }
  })

  const rows = results.flatMap((result) => result.data || [])
  return enrichWithMaps({ actor, rows })
}

export const decideLeaveRequest = async ({ actorId, requestId, payload }) => {
  const actor = await ensureActor(actorId)

  if (!canApproveLeaves(actor.role)) {
    throw createHttpError('You do not have access to approve/reject leave requests.', 403)
  }

  const decision = String(payload?.decision || '').toLowerCase()
  const comment = String(payload?.comment || '').trim() || null

  if (!['approve', 'reject'].includes(decision)) {
    throw createHttpError('decision must be approve or reject.', 400)
  }

  if (decision === 'reject' && !String(payload?.rejection_reason || '').trim()) {
    throw createHttpError('rejection_reason is required when rejecting.', 400)
  }

  const { data: request, error: requestError } = await findLeaveRequestById(requestId)

  if (requestError) {
    throw createHttpError(requestError.message, 500)
  }

  if (!request || request.company_id !== actor.company_id) {
    throw createHttpError('Leave request not found.', 404)
  }

  if (request.employee_id === actor.id) {
    throw createHttpError('You cannot decide your own leave request.', 400)
  }

  if (actor.role === 'manager') {
    const allowed = await isDirectReport({ managerEmployeeId: actor.id, employeeId: request.employee_id })
    if (!allowed) {
      throw createHttpError('Managers can only approve direct report leaves.', 403)
    }
  }

  if (decision === 'approve') {
    const year = normalizeYear(new Date(`${request.start_date}T00:00:00.000Z`).getUTCFullYear())
    const { data: balance, error: balanceError } = await findLeaveBalance({
      employeeId: request.employee_id,
      leaveTypeId: request.leave_type_id,
      year,
    })

    if (balanceError) {
      throw createHttpError(balanceError.message, 500)
    }

    const remaining = getBalanceRemaining(balance)
    if (!balance || remaining < Number(request.total_days)) {
      throw createHttpError('Cannot approve. Employee has insufficient leave balance.', 400)
    }

    const { data: requestUpdate, error: requestUpdateError } = await updateLeaveRequestStatus({
      requestId,
      currentStatus: 'pending',
      payload: {
        status: 'approved',
        approved_by_employee_id: actor.id,
        approved_at: new Date().toISOString(),
        approver_comment: comment,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      },
    })

    if (requestUpdateError) {
      throw createHttpError(requestUpdateError.message, 500)
    }

    if (!requestUpdate) {
      throw createHttpError('Leave request is already decided.', 409)
    }

    const { data: balanceUpdate, error: balanceUpdateError } = await updateLeaveBalance(balance.id, {
      used_days: toTwo(Number(balance.used_days || 0) + Number(request.total_days || 0)),
      updated_at: new Date().toISOString(),
    })

    if (balanceUpdateError) {
      throw createHttpError(balanceUpdateError.message, 500)
    }

    return {
      request: requestUpdate,
      balance: {
        ...balanceUpdate,
        remaining_days: getBalanceRemaining(balanceUpdate),
      },
    }
  }

  const { data: requestUpdate, error: requestUpdateError } = await updateLeaveRequestStatus({
    requestId,
    currentStatus: 'pending',
    payload: {
      status: 'rejected',
      approved_by_employee_id: actor.id,
      approved_at: new Date().toISOString(),
      approver_comment: comment,
      rejection_reason: String(payload?.rejection_reason || '').trim(),
      updated_at: new Date().toISOString(),
    },
  })

  if (requestUpdateError) {
    throw createHttpError(requestUpdateError.message, 500)
  }

  if (!requestUpdate) {
    throw createHttpError('Leave request is already decided.', 409)
  }

  return {
    request: requestUpdate,
    balance: null,
  }
}

export const cancelOwnLeaveRequest = async ({ actorId, requestId }) => {
  const actor = await ensureActor(actorId)

  const { data: request, error: requestError } = await findLeaveRequestById(requestId)

  if (requestError) {
    throw createHttpError(requestError.message, 500)
  }

  if (!request || request.company_id !== actor.company_id || request.employee_id !== actor.id) {
    throw createHttpError('Leave request not found.', 404)
  }

  const { data, error } = await updateLeaveRequestStatus({
    requestId,
    currentStatus: 'pending',
    payload: {
      status: 'cancelled',
      approver_comment: 'Cancelled by employee.',
      updated_at: new Date().toISOString(),
    },
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!data) {
    throw createHttpError('Only pending leave requests can be cancelled.', 409)
  }

  return data
}

export const addPublicHoliday = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)

  if (!canManageCompanyLeaves(actor.role)) {
    throw createHttpError('Only admin or HR can add public holidays.', 403)
  }

  const name = String(payload?.name || '').trim()
  const holidayDate = String(payload?.holiday_date || '').trim()
  const description = String(payload?.description || '').trim() || null
  const isOptional = Boolean(payload?.is_optional)

  if (!name || !holidayDate) {
    throw createHttpError('name and holiday_date are required.', 400)
  }

  const parsedDate = new Date(`${holidayDate}T00:00:00.000Z`)
  if (Number.isNaN(parsedDate.getTime())) {
    throw createHttpError('Invalid holiday_date.', 400)
  }

  const { data, error } = await createPublicHoliday({
    company_id: actor.company_id,
    name,
    holiday_date: holidayDate,
    description,
    is_optional: isOptional,
    created_by_employee_id: actor.id,
  })

  if (error) {
    const uniqueHint = String(error.message || '').includes('uq_public_holidays_company_date_name')
    if (uniqueHint) {
      throw createHttpError('Holiday already exists for this date.', 409)
    }
    throw createHttpError(error.message, 500)
  }

  return data
}

export const getPublicHolidays = async ({ actorId, year }) => {
  const actor = await ensureActor(actorId)

  const normalizedYear = year ? normalizeYear(year) : null
  const autoHolidays = getAutomaticPublicHolidays(normalizedYear || new Date().getUTCFullYear())
  const { data, error } = await listPublicHolidays({
    companyId: actor.company_id,
    year: normalizedYear,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return mergeHolidayRows(
    autoHolidays,
    (data || []).map((row) => ({
      ...row,
      source: 'manual',
    }))
  )
}

export const getHolidayCalendarData = async ({ actorId, year, month }) => {
  const actor = await ensureActor(actorId)

  const today = new Date()
  const normalizedYear = year ? normalizeYear(year) : today.getUTCFullYear()
  const monthNumber = Number(month || today.getUTCMonth() + 1)

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw createHttpError('Invalid calendar month.', 400)
  }

  const monthStart = `${normalizedYear}-${String(monthNumber).padStart(2, '0')}-01`
  const monthEndDate = new Date(Date.UTC(normalizedYear, monthNumber, 0)).getUTCDate()
  const monthEnd = `${normalizedYear}-${String(monthNumber).padStart(2, '0')}-${String(monthEndDate).padStart(2, '0')}`

  const [holidaysResult, leavesResult] = await Promise.all([
    listPublicHolidays({
      companyId: actor.company_id,
      fromDate: monthStart,
      toDate: monthEnd,
    }),
    listLeaveRequests({
      companyId: actor.company_id,
      employeeId: actor.id,
      fromDate: monthStart,
      toDate: monthEnd,
    }),
  ])

  if (holidaysResult.error) {
    throw createHttpError(holidaysResult.error.message, 500)
  }

  if (leavesResult.error) {
    throw createHttpError(leavesResult.error.message, 500)
  }

  const autoHolidays = getAutomaticPublicHolidays(normalizedYear).filter((holiday) => holiday.holiday_date >= monthStart && holiday.holiday_date <= monthEnd)

  const leaves = await enrichWithMaps({
    actor,
    rows: (leavesResult.data || []).filter((row) => row.status !== 'cancelled'),
  })

  return {
    year: normalizedYear,
    month: monthNumber,
    holidays: mergeHolidayRows(
      autoHolidays,
      (holidaysResult.data || []).map((row) => ({
        ...row,
        source: 'manual',
      }))
    ),
    leaves,
  }
}
