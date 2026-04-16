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

export const updateLocationRecord = async (id, payload) => {
  return supabase.from('plants_offices').update(payload).eq('id', id).select('*').single()
}

export const deleteLocationRecord = async (id) => {
  return supabase
    .from('plants_offices')
    .update({ is_active: false })
    .eq('id', id)
    .select('id, is_active')
    .single()
}

export const listDepartmentsByCompanyAndLocation = async ({ companyId, plantOfficeId }) => {
  let query = supabase
    .from('location_departments')
    .select('id, company_id, plant_office_id, is_active, department:department_id(id, name, code, description)')
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

export const findDesignationByCompanyAndName = async ({ companyId, name }) => {
  return supabase
    .from('designations')
    .select('id, company_id, plant_office_id, department_id, name, code, description, is_active')
    .eq('company_id', companyId)
    .ilike('name', name)
    .maybeSingle()
}

export const findDesignationByCompanyLocationAndDepartmentAndName = async ({ companyId, plantOfficeId, departmentId, name }) => {
  let query = supabase
    .from('designations')
    .select('id, company_id, plant_office_id, department_id, name, code, description, is_active')
    .eq('company_id', companyId)
    .ilike('name', name)

  if (plantOfficeId === null) {
    query = query.is('plant_office_id', null)
  } else if (plantOfficeId) {
    query = query.eq('plant_office_id', plantOfficeId)
  }

  if (departmentId === null) {
    query = query.is('department_id', null)
  } else if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  return query.maybeSingle()
}

export const createDepartmentRecord = async (payload) => {
  return supabase.from('departments').insert(payload).select('*').single()
}

export const createDesignationRecord = async (payload) => {
  return supabase.from('designations').insert(payload).select('*').single()
}

export const listDesignationsByCompany = async (companyId) => {
  return supabase
    .from('designations')
    .select('id, company_id, plant_office_id, department_id, name, code, description, is_active, created_at, updated_at')
    .eq('company_id', companyId)
    .order('name', { ascending: true })
}

export const findDesignationById = async (id) => {
  return supabase
    .from('designations')
    .select('id, company_id, plant_office_id, department_id, name, code, description, is_active, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
}

export const updateDesignationRecord = async (id, payload) => {
  return supabase.from('designations').update(payload).eq('id', id).select('*').single()
}

export const deleteDesignationRecord = async (id) => {
  return supabase
    .from('designations')
    .update({ is_active: false })
    .eq('id', id)
    .select('id, is_active')
    .single()
}

export const findLocationDepartmentByCompanyLocationAndDepartment = async ({ companyId, plantOfficeId, departmentId }) => {
  return supabase
    .from('location_departments')
    .select('id, company_id, plant_office_id, department_id, is_active, department:department_id(id, name, code, description)')
    .eq('company_id', companyId)
    .eq('plant_office_id', plantOfficeId)
    .eq('department_id', departmentId)
    .maybeSingle()
}

export const listResponsibilitiesByCompany = async (companyId) => {
  return supabase
    .from('designation_responsibilities')
    .select('id, company_id, designation_id, title, description, is_active, created_by_employee_id, created_by_role, created_at, updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
}

export const findResponsibilityById = async (id) => {
  return supabase
    .from('designation_responsibilities')
    .select('id, company_id, designation_id, title, description, is_active, created_by_employee_id, created_by_role, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
}

export const createResponsibilityRecord = async (payload) => {
  return supabase.from('designation_responsibilities').insert(payload).select('*').single()
}

export const updateResponsibilityRecord = async (id, payload) => {
  return supabase.from('designation_responsibilities').update(payload).eq('id', id).select('*').single()
}

export const deleteResponsibilityRecord = async (id) => {
  return supabase
    .from('designation_responsibilities')
    .update({ is_active: false })
    .eq('id', id)
    .select('id, is_active')
    .single()
}

export const updateDepartmentRecord = async (id, payload) => {
  return supabase.from('departments').update(payload).eq('id', id).select('*').single()
}

export const deleteDepartmentRecord = async (id) => {
  return supabase
    .from('departments')
    .update({ is_active: false })
    .eq('id', id)
    .select('id, is_active')
    .single()
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

export const findLocationDepartmentById = async (id) => {
  return supabase
    .from('location_departments')
    .select('id, company_id, plant_office_id, department_id, is_active, department:department_id(id, name, code, description)')
    .eq('id', id)
    .maybeSingle()
}

export const updateLocationDepartmentRecord = async (id, payload) => {
  return supabase.from('location_departments').update(payload).eq('id', id).select('*').single()
}

export const deleteLocationDepartmentRecord = async (id) => {
  return supabase
    .from('location_departments')
    .update({ is_active: false })
    .eq('id', id)
    .select('id, is_active')
    .single()
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
