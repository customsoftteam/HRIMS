import { randomUUID } from 'crypto'
import {
  closeActivePrimaryDepartmentAssignment,
  closeActivePrimaryLocationAssignment,
  createDepartmentAssignmentRecord,
  createEmployeeRecord,
  createLocationAssignmentRecord,
  deleteEmployeeRecord,
  findEmployeeByEmail,
  findEmployeeById,
  getActiveDepartmentAssignmentsByEmployeeIds,
  getActiveLocationAssignmentsByEmployeeIds,
  getActiveLocationAssignmentsForEmployee,
  getDepartmentMetadataByIds,
  getLocationMetadataByIds,
  listEmployeeRecords,
  listEmployeeRecordsByCompany,
  updateEmployeeRecord,
} from '../model/admin/user.model.js'
import { hashPassword } from '../utils/password.js'
import { sanitizeEmployee } from '../utils/user.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getActorContext = async ({ actorId }) => {
  const { data: actor, error: actorError } = await findEmployeeById(actorId)

  if (actorError) {
    throw createHttpError(actorError.message, 500)
  }

  if (!actor) {
    throw createHttpError('Authenticated user not found.', 401)
  }

  const { data: assignments, error: assignmentError } = await getActiveLocationAssignmentsForEmployee(actorId)

  if (assignmentError) {
    throw createHttpError(assignmentError.message, 500)
  }

  return {
    actor,
    locationScope: (assignments || []).map((row) => row.plant_office_id),
  }
}

const enrichUsersWithAssignments = async (users) => {
  const employeeIds = users.map((row) => row.id)

  const [locationResult, departmentResult] = await Promise.all([
    getActiveLocationAssignmentsByEmployeeIds(employeeIds),
    getActiveDepartmentAssignmentsByEmployeeIds(employeeIds),
  ])

  if (locationResult.error) {
    throw createHttpError(locationResult.error.message, 500)
  }

  if (departmentResult.error) {
    throw createHttpError(departmentResult.error.message, 500)
  }

  const locationAssignments = locationResult.data || []
  const departmentAssignments = departmentResult.data || []

  const locationIds = [...new Set(locationAssignments.map((row) => row.plant_office_id))]
  const departmentIds = [...new Set(departmentAssignments.map((row) => row.department_id))]

  const [locationsResult, departmentsResult] = await Promise.all([
    getLocationMetadataByIds(locationIds),
    getDepartmentMetadataByIds(departmentIds),
  ])

  if (locationsResult.error) {
    throw createHttpError(locationsResult.error.message, 500)
  }

  if (departmentsResult.error) {
    throw createHttpError(departmentsResult.error.message, 500)
  }

  const locationMap = new Map((locationsResult.data || []).map((row) => [row.id, row]))
  const departmentMap = new Map((departmentsResult.data || []).map((row) => [row.id, row]))
  const locationAssignmentMap = new Map(locationAssignments.map((row) => [row.employee_id, row]))
  const departmentAssignmentMap = new Map(departmentAssignments.map((row) => [row.employee_id, row]))

  return users.map((user) => {
    const safeUser = sanitizeEmployee(user)
    const locationAssignment = locationAssignmentMap.get(user.id) || null
    const departmentAssignment = departmentAssignmentMap.get(user.id) || null

    return {
      ...safeUser,
      assignment: {
        location: locationAssignment
          ? {
              ...locationAssignment,
              metadata: locationMap.get(locationAssignment.plant_office_id) || null,
            }
          : null,
        department: departmentAssignment
          ? {
              ...departmentAssignment,
              metadata: departmentMap.get(departmentAssignment.department_id) || null,
            }
          : null,
      },
    }
  })
}

export const createUser = async (payload) => {
  const {
    first_name,
    last_name = null,
    email,
    password,
    role = 'employee',
    phone = null,
    employee_code = null,
    status = 'active',
    allowedRoles,
    company_id,
    plant_office_id,
    department_id,
    manager_employee_id = null,
    actor_id,
    actor_role,
  } = payload

  if (!first_name || !email || !password) {
    throw createHttpError('First name, email, and password are required.', 400)
  }

  if (!plant_office_id || !department_id) {
    throw createHttpError('Location and department are required.', 400)
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    throw createHttpError('You cannot create this user role.', 403)
  }

  const { data: existingUser, error: existingUserError } = await findEmployeeByEmail(normalizedEmail)

  if (existingUserError) {
    throw createHttpError(existingUserError.message, 500)
  }

  if (existingUser) {
    throw createHttpError('A user with this email already exists.', 409)
  }

  let companyId = company_id || null

  if (!companyId || actor_role === 'hr') {
    const { actor, locationScope } = await getActorContext({ actorId: actor_id })
    companyId = actor.company_id

    if (!companyId) {
      throw createHttpError('Authenticated user is not linked to a company.', 400)
    }

    if (actor_role === 'hr' && !locationScope.includes(plant_office_id)) {
      throw createHttpError('HR can only create users in assigned locations.', 403)
    }
  }

  const password_hash = await hashPassword(password)

  const employeePayload = {
    employee_code: employee_code || `EMP-${randomUUID().slice(0, 8).toUpperCase()}`,
    role,
    status,
    first_name,
    last_name,
    email: normalizedEmail,
    phone,
    password_hash,
    company_id: companyId,
    manager_employee_id,
  }

  const { data, error } = await createEmployeeRecord(employeePayload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const { error: locationAssignmentError } = await createLocationAssignmentRecord({
    employee_id: data.id,
    company_id: companyId,
    plant_office_id,
    is_primary: true,
    assignment_role: role,
    status: 'active',
  })

  if (locationAssignmentError) {
    throw createHttpError(locationAssignmentError.message, 500)
  }

  const { error: departmentAssignmentError } = await createDepartmentAssignmentRecord({
    employee_id: data.id,
    company_id: companyId,
    plant_office_id,
    department_id,
    is_primary: true,
    status: 'active',
    assigned_by: actor_id || null,
  })

  if (departmentAssignmentError) {
    throw createHttpError(departmentAssignmentError.message, 500)
  }

  const enriched = await enrichUsersWithAssignments([data])
  return enriched[0]
}

export const listUsers = async (filters = {}) => {
  const {
    role,
    actor_id,
    actor_role,
    plant_office_id,
  } = filters

  let recordsResult

  if (actor_role === 'admin' || actor_role === 'hr') {
    const { actor, locationScope } = await getActorContext({ actorId: actor_id })

    recordsResult = await listEmployeeRecordsByCompany({
      companyId: actor.company_id,
      role,
    })

    if (recordsResult.error) {
      throw createHttpError(recordsResult.error.message, 500)
    }

    let users = recordsResult.data ?? []
    users = await enrichUsersWithAssignments(users)

    if (actor_role === 'hr') {
      users = users.filter((user) => locationScope.includes(user.assignment?.location?.plant_office_id))
    }

    if (plant_office_id) {
      users = users.filter((user) => user.assignment?.location?.plant_office_id === plant_office_id)
    }

    return users
  }

  recordsResult = await listEmployeeRecords({ role })
  const { data, error } = recordsResult

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return enrichUsersWithAssignments(data ?? [])
}

export const updateUser = async ({ id, payload, allowedRoles }) => {
  const { actor_id, actor_role } = payload
  const { data: existingUser, error: existingUserError } = await findEmployeeById(id)

  if (existingUserError) {
    throw createHttpError(existingUserError.message, 500)
  }

  if (!existingUser) {
    throw createHttpError('User not found.', 404)
  }

  if (allowedRoles?.length && !allowedRoles.includes(existingUser.role)) {
    throw createHttpError('You cannot update this user role.', 403)
  }

  const { locationScope } = await getActorContext({ actorId: actor_id })

  if (actor_role === 'hr') {
    const { data: userAssignments, error: userAssignmentsError } = await getActiveLocationAssignmentsForEmployee(id)
    if (userAssignmentsError) {
      throw createHttpError(userAssignmentsError.message, 500)
    }
    const userLocationIds = (userAssignments || []).map((row) => row.plant_office_id)
    if (!userLocationIds.some((locationId) => locationScope.includes(locationId))) {
      throw createHttpError('HR can only update users in assigned locations.', 403)
    }
  }

  const updatePayload = {}

  if (payload.first_name !== undefined) updatePayload.first_name = payload.first_name
  if (payload.last_name !== undefined) updatePayload.last_name = payload.last_name
  if (payload.phone !== undefined) updatePayload.phone = payload.phone
  if (payload.status !== undefined) updatePayload.status = payload.status

  if (payload.role !== undefined) {
    if (allowedRoles?.length && !allowedRoles.includes(payload.role)) {
      throw createHttpError('You cannot assign this user role.', 403)
    }

    updatePayload.role = payload.role
  }

  if (payload.email !== undefined) {
    const normalizedEmail = payload.email.trim().toLowerCase()
    if (normalizedEmail !== existingUser.email) {
      const { data: duplicateUser, error: duplicateError } = await findEmployeeByEmail(normalizedEmail)
      if (duplicateError) {
        throw createHttpError(duplicateError.message, 500)
      }
      if (duplicateUser) {
        throw createHttpError('A user with this email already exists.', 409)
      }
      updatePayload.email = normalizedEmail
    }
  }

  if (payload.password) {
    updatePayload.password_hash = await hashPassword(payload.password)
  }

  if (payload.manager_employee_id !== undefined) {
    updatePayload.manager_employee_id = payload.manager_employee_id
  }

  const { data, error } = await updateEmployeeRecord(id, updatePayload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const enriched = await enrichUsersWithAssignments([data])
  return enriched[0]
}

export const deleteUser = async ({ id, allowedRoles, actor_id, actor_role }) => {
  const { data: existingUser, error: existingUserError } = await findEmployeeById(id)

  if (existingUserError) {
    throw createHttpError(existingUserError.message, 500)
  }

  if (!existingUser) {
    throw createHttpError('User not found.', 404)
  }

  if (allowedRoles?.length && !allowedRoles.includes(existingUser.role)) {
    throw createHttpError('You cannot delete this user role.', 403)
  }

  if (actor_role === 'hr') {
    const { locationScope } = await getActorContext({ actorId: actor_id })
    const { data: userAssignments, error: userAssignmentsError } = await getActiveLocationAssignmentsForEmployee(id)

    if (userAssignmentsError) {
      throw createHttpError(userAssignmentsError.message, 500)
    }

    const userLocationIds = (userAssignments || []).map((row) => row.plant_office_id)
    if (!userLocationIds.some((locationId) => locationScope.includes(locationId))) {
      throw createHttpError('HR can only delete users in assigned locations.', 403)
    }
  }

  const { data, error } = await deleteEmployeeRecord(id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const transferUserAssignment = async ({
  id,
  actor_id,
  actor_role,
  plant_office_id,
  department_id,
  effective_date,
}) => {
  if (!plant_office_id || !department_id) {
    throw createHttpError('Location and department are required for transfer.', 400)
  }

  const { data: existingUser, error: existingUserError } = await findEmployeeById(id)

  if (existingUserError) {
    throw createHttpError(existingUserError.message, 500)
  }

  if (!existingUser) {
    throw createHttpError('User not found.', 404)
  }

  const transferDate = effective_date || new Date().toISOString().slice(0, 10)
  const endDate = new Date(new Date(transferDate).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { actor, locationScope } = await getActorContext({ actorId: actor_id })

  if (actor_role === 'hr' && !locationScope.includes(plant_office_id)) {
    throw createHttpError('HR can only transfer users into assigned locations.', 403)
  }

  const companyId = actor.company_id || existingUser.company_id

  const { error: closeLocationError } = await closeActivePrimaryLocationAssignment({
    employeeId: id,
    endDate,
  })

  if (closeLocationError) {
    throw createHttpError(closeLocationError.message, 500)
  }

  const { error: closeDepartmentError } = await closeActivePrimaryDepartmentAssignment({
    employeeId: id,
    endDate,
  })

  if (closeDepartmentError) {
    throw createHttpError(closeDepartmentError.message, 500)
  }

  const { error: newLocationError } = await createLocationAssignmentRecord({
    employee_id: id,
    company_id: companyId,
    plant_office_id,
    is_primary: true,
    assignment_role: existingUser.role,
    start_date: transferDate,
    status: 'active',
  })

  if (newLocationError) {
    throw createHttpError(newLocationError.message, 500)
  }

  const { error: newDepartmentError } = await createDepartmentAssignmentRecord({
    employee_id: id,
    company_id: companyId,
    plant_office_id,
    department_id,
    is_primary: true,
    start_date: transferDate,
    status: 'active',
    assigned_by: actor_id,
  })

  if (newDepartmentError) {
    throw createHttpError(newDepartmentError.message, 500)
  }

  const { data: updatedUser, error: updatedUserError } = await findEmployeeById(id)

  if (updatedUserError) {
    throw createHttpError(updatedUserError.message, 500)
  }

  const enriched = await enrichUsersWithAssignments([updatedUser])
  return enriched[0]
}
