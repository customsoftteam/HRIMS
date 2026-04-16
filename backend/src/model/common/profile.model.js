import { supabase } from '../../config/supabase.js'

export const findEmployeeById = async (id) => {
	return supabase
		.from('employees')
		.select('id, first_name, last_name, email, role, company_id')
		.eq('id', id)
		.maybeSingle()
}

export const findProfileByEmployeeId = async (employeeId) => {
	return supabase
		.from('employee_profiles')
		.select('id, employee_id, company_id, personal_details, family_details, academic_details, professional_details, health_details, created_at, updated_at')
		.eq('employee_id', employeeId)
		.maybeSingle()
}

export const createProfileRecord = async (payload) => {
	return supabase.from('employee_profiles').insert(payload).select('*').single()
}

export const updateProfileRecordByEmployeeId = async (employeeId, payload) => {
	return supabase
		.from('employee_profiles')
		.update(payload)
		.eq('employee_id', employeeId)
		.select('*')
		.single()
}

export const deleteProfileRecordByEmployeeId = async (employeeId) => {
	return supabase
		.from('employee_profiles')
		.delete()
		.eq('employee_id', employeeId)
		.select('id, employee_id')
		.maybeSingle()
}
