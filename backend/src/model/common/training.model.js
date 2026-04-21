import { supabase } from '../../config/supabase.js'

// Training Programs CRUD
export const listTrainingPrograms = async (companyId) => {
  return supabase
    .from('training_programs')
    .select('id, company_id, name, description, category, is_mandatory, modules, quiz_questions, passing_score, created_by_employee_id, created_at, updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
}

export const createTrainingProgramRecord = async (payload) => {
  return supabase
    .from('training_programs')
    .insert(payload)
    .select('id, company_id, name, description, category, is_mandatory, modules, quiz_questions, passing_score, created_by_employee_id, created_at, updated_at')
    .single()
}

export const updateTrainingProgramRecord = async ({ programId, payload }) => {
  return supabase
    .from('training_programs')
    .update(payload)
    .eq('id', programId)
    .select('id, company_id, name, description, category, is_mandatory, modules, quiz_questions, passing_score, created_by_employee_id, created_at, updated_at')
    .single()
}

export const findTrainingProgramById = async (programId) => {
  return supabase
    .from('training_programs')
    .select('id, company_id, name, description, category, is_mandatory, modules, quiz_questions, passing_score, created_by_employee_id, created_at, updated_at')
    .eq('id', programId)
    .maybeSingle()
}

// Training Assignments
export const listTrainingAssignments = async ({ employeeId, companyId }) => {
  return supabase
    .from('training_assignments')
    .select(`
      id,
      employee_id,
      training_program_id,
      assigned_at,
      due_date,
      completed_at,
      completion_status,
      quiz_answers,
      quiz_score,
      quiz_passed,
      quiz_submitted_at,
      training_programs!inner(id, name, description, category, is_mandatory, modules, quiz_questions, passing_score)
    `)
    .eq('employee_id', employeeId)
    .order('assigned_at', { ascending: false })
}

export const listCompanyTrainingAssignments = async (companyId) => {
  return supabase
    .from('training_assignments')
    .select(`
      id,
      employee_id,
      training_program_id,
      assigned_at,
      due_date,
      completed_at,
      completion_status,
      quiz_answers,
      quiz_score,
      quiz_passed,
      quiz_submitted_at,
      employees!inner(id, first_name, last_name, email, manager_employee_id),
      training_programs!inner(id, name, description, category, is_mandatory, modules, quiz_questions, passing_score)
    `)
    .eq('employees.company_id', companyId)
    .order('assigned_at', { ascending: false })
}

export const createTrainingAssignmentRecord = async (payload) => {
  return supabase
    .from('training_assignments')
    .insert(payload)
    .select('id, employee_id, training_program_id, assigned_at, due_date, completed_at, completion_status, quiz_answers, quiz_score, quiz_passed, quiz_submitted_at')
    .single()
}

export const findTrainingAssignmentById = async (assignmentId) => {
  return supabase
    .from('training_assignments')
    .select('id, employee_id, training_program_id, assigned_at, due_date, completed_at, completion_status, quiz_answers, quiz_score, quiz_passed, quiz_submitted_at')
    .eq('id', assignmentId)
    .maybeSingle()
}

export const updateTrainingAssignmentStatus = async (assignmentId, payload) => {
  return supabase
    .from('training_assignments')
    .update(payload)
    .eq('id', assignmentId)
    .select('id, employee_id, training_program_id, assigned_at, due_date, completed_at, completion_status, quiz_answers, quiz_score, quiz_passed, quiz_submitted_at')
    .single()
}

// Certificates
export const createCertificateRecord = async (payload) => {
  return supabase
    .from('training_certificates')
    .insert(payload)
    .select('id, assignment_id, employee_id, training_program_id, issued_date, certificate_number')
    .single()
}

export const findCertificateByAssignment = async (assignmentId) => {
  return supabase
    .from('training_certificates')
    .select('id, assignment_id, employee_id, training_program_id, issued_date, certificate_number')
    .eq('assignment_id', assignmentId)
    .maybeSingle()
}

export const listEmployeeCertificates = async (employeeId) => {
  return supabase
    .from('training_certificates')
    .select(`
      id,
      assignment_id,
      employee_id,
      training_program_id,
      issued_date,
      certificate_number,
      training_programs!inner(id, name, category)
    `)
    .eq('employee_id', employeeId)
    .order('issued_date', { ascending: false })
}

// Helper: Find employee
export const findEmployeeById = async (employeeId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id, manager_employee_id')
    .eq('id', employeeId)
    .maybeSingle()
}

// Helper: List company employees
export const listCompanyEmployees = async (companyId) => {
  return supabase
    .from('employees')
    .select('id, first_name, last_name, email, role, company_id, manager_employee_id')
    .eq('company_id', companyId)
    .order('first_name', { ascending: true })
}
