import { supabase } from '../../config/supabase.js'

export const findEmployeeByEmail = async (email) => {
  return supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name, email, role, status, password_hash, company_id, designation_id, created_at, updated_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
}

export const findEmployeeById = async (id) => {
  return supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name, email, role, status, phone, password_hash, company_id, designation_id, manager_employee_id, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
}

export const createEmployeeRecord = async (payload) => {
  return supabase.from('employees').insert(payload).select('*').single()
}

export const updateEmployeeRecord = async (id, payload) => {
  return supabase.from('employees').update(payload).eq('id', id).select('*').single()
}

export const deleteEmployeeRecord = async (id) => {
  return supabase
    .from('employees')
    .delete()
    .eq('id', id)
    .select('id, role')
    .single()
}

export const listEmployeeRecords = async ({ role } = {}) => {
  let query = supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name, email, role, status, phone, company_id, designation_id, manager_employee_id, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (role) {
    query = query.eq('role', role)
  }

  return query
}

export const listEmployeeRecordsByCompany = async ({ companyId, role } = {}) => {
  let query = supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name, email, role, status, phone, company_id, designation_id, manager_employee_id, created_at, updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (role) {
    query = query.eq('role', role)
  }

  return query
}

export const getActiveLocationAssignmentsByEmployeeIds = async (employeeIds = []) => {
  if (!employeeIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('user_location_assignments')
    .select('id, employee_id, company_id, plant_office_id, is_primary, assignment_role, start_date, end_date, status')
    .in('employee_id', employeeIds)
    .is('end_date', null)
    .eq('is_primary', true)
    .eq('status', 'active')
}

export const getActiveDepartmentAssignmentsByEmployeeIds = async (employeeIds = []) => {
  if (!employeeIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('employee_department_assignments')
    .select('id, employee_id, company_id, plant_office_id, department_id, is_primary, start_date, end_date, status')
    .in('employee_id', employeeIds)
    .is('end_date', null)
    .eq('is_primary', true)
    .eq('status', 'active')
}

export const getLocationMetadataByIds = async (ids = []) => {
  if (!ids.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('plants_offices')
    .select('id, company_id, name, code, location')
    .in('id', ids)
}

export const getDepartmentMetadataByIds = async (ids = []) => {
  if (!ids.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('departments')
    .select('id, company_id, name, code')
    .in('id', ids)
}

export const getDesignationMetadataByIds = async (ids = []) => {
  if (!ids.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('designations')
    .select('id, name')
    .in('id', ids)
}

export const getProfileDetailsByEmployeeIds = async (employeeIds = []) => {
  if (!employeeIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('employee_profiles')
    .select('employee_id, personal_details')
    .in('employee_id', employeeIds)
}

export const createLocationAssignmentRecord = async (payload) => {
  return supabase.from('user_location_assignments').insert(payload).select('*').single()
}

export const closeActivePrimaryLocationAssignment = async ({ employeeId, endDate }) => {
  return supabase
    .from('user_location_assignments')
    .update({
      end_date: endDate,
      is_primary: false,
      status: 'inactive',
    })
    .eq('employee_id', employeeId)
    .is('end_date', null)
    .eq('is_primary', true)
    .select('id')
}

export const createDepartmentAssignmentRecord = async (payload) => {
  return supabase.from('employee_department_assignments').insert(payload).select('*').single()
}

export const closeActivePrimaryDepartmentAssignment = async ({ employeeId, endDate }) => {
  return supabase
    .from('employee_department_assignments')
    .update({
      end_date: endDate,
      is_primary: false,
      status: 'inactive',
    })
    .eq('employee_id', employeeId)
    .is('end_date', null)
    .eq('is_primary', true)
    .select('id')
}

export const getActiveLocationAssignmentsForEmployee = async (employeeId) => {
  return supabase
    .from('user_location_assignments')
    .select('id, employee_id, company_id, plant_office_id, is_primary, assignment_role, start_date, end_date, status')
    .eq('employee_id', employeeId)
    .is('end_date', null)
    .eq('status', 'active')
}
