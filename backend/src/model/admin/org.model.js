import { supabase } from '../../config/supabase.js'

export const listLocationsByCompany = async (companyId) => {
  return supabase
    .from('plants_offices')
    .select('id, company_id, code, name, location, address, timezone, is_active, created_at, updated_at')
    .eq('company_id', companyId)
    .order('name', { ascending: true })
}

export const createLocationRecord = async (payload) => {
  return supabase.from('plants_offices').insert(payload).select('*').single()
}

export const listDepartmentsByCompanyAndLocation = async ({ companyId, plantOfficeId }) => {
  let query = supabase
    .from('location_departments')
    .select('id, company_id, plant_office_id, is_active, department:department_id(id, name, code)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (plantOfficeId) {
    query = query.eq('plant_office_id', plantOfficeId)
  }

  return query
}

export const findDepartmentByCompanyAndName = async ({ companyId, name }) => {
  return supabase
    .from('departments')
    .select('id, company_id, name, code')
    .eq('company_id', companyId)
    .ilike('name', name)
    .maybeSingle()
}

export const createDepartmentRecord = async (payload) => {
  return supabase.from('departments').insert(payload).select('*').single()
}

export const findLocationById = async (id) => {
  return supabase
    .from('plants_offices')
    .select('id, company_id, name, code, location, is_active')
    .eq('id', id)
    .maybeSingle()
}

export const createLocationDepartmentRecord = async (payload) => {
  return supabase.from('location_departments').insert(payload).select('*').single()
}

export const listManagersByCompanyAndLocation = async ({ companyId, plantOfficeId }) => {
  const { data: assignments, error: assignmentError } = await supabase
    .from('user_location_assignments')
    .select('employee_id')
    .eq('company_id', companyId)
    .eq('plant_office_id', plantOfficeId)
    .is('end_date', null)
    .eq('status', 'active')

  if (assignmentError) {
    return { data: null, error: assignmentError }
  }

  const employeeIds = (assignments || []).map((row) => row.employee_id)

  if (!employeeIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, status')
    .eq('company_id', companyId)
    .eq('role', 'manager')
    .in('id', employeeIds)
    .order('first_name', { ascending: true })
}
