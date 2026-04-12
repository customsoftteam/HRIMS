import { supabase } from '../../config/supabase.js'

export const findCompanyByName = async (name) => {
  return supabase
    .from('companies')
    .select('id, name, code')
    .eq('name', name)
    .maybeSingle()
}

export const createCompanyRecord = async (payload) => {
  return supabase.from('companies').insert(payload).select('*').single()
}

export const createCompanyAdminRecord = async (payload) => {
  return supabase.from('employees').insert(payload).select('*').single()
}
