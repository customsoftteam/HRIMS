import { supabase } from '../../config/supabase.js'

export const findEmployeeById = async (employeeId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id, manager_employee_id')
    .eq('id', employeeId)
    .maybeSingle()
}

export const listCompanyEmployees = async (companyId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id, manager_employee_id')
    .eq('company_id', companyId)
    .order('first_name', { ascending: true })
}

export const listDirectReportEmployees = async (managerEmployeeId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id, manager_employee_id')
    .eq('manager_employee_id', managerEmployeeId)
    .order('first_name', { ascending: true })
}

export const listLeaveTypesByCompany = async (companyId) => {
  return supabase
    .from('leave_types')
    .select('id, company_id, name, code, is_active, created_by_employee_id, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name', { ascending: true })
}

export const createLeaveTypeRecord = async (payload) => {
  return supabase
    .from('leave_types')
    .insert(payload)
    .select('id, company_id, name, code, is_active, created_by_employee_id, created_at, updated_at')
    .single()
}

export const findLeaveTypeById = async (leaveTypeId) => {
  return supabase
    .from('leave_types')
    .select('id, company_id, name, code, is_active, created_by_employee_id, created_at, updated_at')
    .eq('id', leaveTypeId)
    .maybeSingle()
}

export const findLeaveBalance = async ({ employeeId, leaveTypeId, year }) => {
  return supabase
    .from('leave_balances')
    .select('id, company_id, employee_id, leave_type_id, year, allocated_days, used_days, carried_forward_days, adjustment_days, is_revoked, revoked_at, revoked_by_employee_id, revocation_reason, created_by_employee_id, created_at, updated_at')
    .eq('employee_id', employeeId)
    .eq('leave_type_id', leaveTypeId)
    .eq('year', year)
    .maybeSingle()
}

export const findLeaveBalanceById = async (balanceId) => {
  return supabase
    .from('leave_balances')
    .select('id, company_id, employee_id, leave_type_id, year, allocated_days, used_days, carried_forward_days, adjustment_days, is_revoked, revoked_at, revoked_by_employee_id, revocation_reason, created_by_employee_id, created_at, updated_at')
    .eq('id', balanceId)
    .maybeSingle()
}

export const createLeaveBalance = async (payload) => {
  return supabase
    .from('leave_balances')
    .insert(payload)
    .select('id, company_id, employee_id, leave_type_id, year, allocated_days, used_days, carried_forward_days, adjustment_days, is_revoked, revoked_at, revoked_by_employee_id, revocation_reason, created_by_employee_id, created_at, updated_at')
    .single()
}

export const updateLeaveBalance = async (balanceId, payload) => {
  return supabase
    .from('leave_balances')
    .update(payload)
    .eq('id', balanceId)
    .select('id, company_id, employee_id, leave_type_id, year, allocated_days, used_days, carried_forward_days, adjustment_days, is_revoked, revoked_at, revoked_by_employee_id, revocation_reason, created_by_employee_id, created_at, updated_at')
    .single()
}

export const listLeaveBalances = async ({ companyId, employeeId, year }) => {
  let query = supabase
    .from('leave_balances')
    .select('id, company_id, employee_id, leave_type_id, year, allocated_days, used_days, carried_forward_days, adjustment_days, is_revoked, revoked_at, revoked_by_employee_id, revocation_reason, created_by_employee_id, created_at, updated_at')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  if (year) {
    query = query.eq('year', year)
  }

  return query
}

export const revokeLeaveBalance = async ({ balanceId, payload }) => {
  return supabase
    .from('leave_balances')
    .update(payload)
    .eq('id', balanceId)
    .select('id, company_id, employee_id, leave_type_id, year, allocated_days, used_days, carried_forward_days, adjustment_days, is_revoked, revoked_at, revoked_by_employee_id, revocation_reason, created_by_employee_id, created_at, updated_at')
    .maybeSingle()
}

export const createLeaveRequestRecord = async (payload) => {
  return supabase
    .from('leave_requests')
    .insert(payload)
    .select('id, company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, applied_at, approved_by_employee_id, approved_at, rejection_reason, approver_comment, created_at, updated_at')
    .single()
}

export const findLeaveRequestById = async (requestId) => {
  return supabase
    .from('leave_requests')
    .select('id, company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, applied_at, approved_by_employee_id, approved_at, rejection_reason, approver_comment, created_at, updated_at')
    .eq('id', requestId)
    .maybeSingle()
}

export const listLeaveRequests = async ({ companyId, employeeId, status, leaveTypeId, fromDate, toDate }) => {
  let query = supabase
    .from('leave_requests')
    .select('id, company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, applied_at, approved_by_employee_id, approved_at, rejection_reason, approver_comment, created_at, updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (leaveTypeId) {
    query = query.eq('leave_type_id', leaveTypeId)
  }

  if (fromDate) {
    query = query.gte('start_date', fromDate)
  }

  if (toDate) {
    query = query.lte('end_date', toDate)
  }

  return query
}

export const updateLeaveRequestStatus = async ({ requestId, currentStatus, payload }) => {
  return supabase
    .from('leave_requests')
    .update(payload)
    .eq('id', requestId)
    .eq('status', currentStatus)
    .select('id, company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, applied_at, approved_by_employee_id, approved_at, rejection_reason, approver_comment, created_at, updated_at')
    .maybeSingle()
}

export const createPublicHoliday = async (payload) => {
  return supabase
    .from('public_holidays')
    .insert(payload)
    .select('id, company_id, name, holiday_date, description, is_optional, created_by_employee_id, created_at, updated_at')
    .single()
}

export const listPublicHolidays = async ({ companyId, fromDate, toDate, year }) => {
  let query = supabase
    .from('public_holidays')
    .select('id, company_id, name, holiday_date, description, is_optional, created_by_employee_id, created_at, updated_at')
    .or(`company_id.eq.${companyId},company_id.is.null`)
    .order('holiday_date', { ascending: true })

  if (fromDate) {
    query = query.gte('holiday_date', fromDate)
  }

  if (toDate) {
    query = query.lte('holiday_date', toDate)
  }

  if (year) {
    query = query.gte('holiday_date', `${year}-01-01`).lte('holiday_date', `${year}-12-31`)
  }

  return query
}
