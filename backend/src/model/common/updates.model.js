import { supabase } from '../../config/supabase.js'

export const findEmployeeById = async (employeeId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id')
    .eq('id', employeeId)
    .maybeSingle()
}

export const createCompanyUpdate = async (payload) => {
  return supabase
    .from('company_updates')
    .insert(payload)
    .select('id, company_id, category, title, content, event_date, is_pinned, published_by_employee_id, created_at, updated_at')
    .single()
}

export const listCompanyUpdates = async ({ companyId, category, limit = 50 }) => {
  let query = supabase
    .from('company_updates')
    .select('id, company_id, category, title, content, event_date, is_pinned, published_by_employee_id, created_at, updated_at')
    .eq('company_id', companyId)
    .order('is_pinned', { ascending: false })
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  return query
}
