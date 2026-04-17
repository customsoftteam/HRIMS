import {
  createCertificateRecord,
  createTrainingAssignmentRecord,
  createTrainingProgramRecord,
  findCertificateByAssignment,
  findEmployeeById,
  findTrainingAssignmentById,
  findTrainingProgramById,
  listCompanyEmployees,
  listCompanyTrainingAssignments,
  listEmployeeCertificates,
  listTrainingAssignments,
  listTrainingPrograms,
  updateTrainingAssignmentStatus,
} from '../model/common/training.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
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

const ensureIsHROrAdmin = (actor) => {
  if (actor.role !== 'admin' && actor.role !== 'hr') {
    throw createHttpError('Only HR and Admin can manage training.', 403)
  }
}

const ensureCanViewTraining = (actor) => {
  if (actor.role !== 'admin' && actor.role !== 'hr' && actor.role !== 'manager') {
    throw createHttpError('Only HR, Admin, or Manager can view training allocations.', 403)
  }
}

const ensureCanAssignTraining = (actor) => {
  if (actor.role !== 'admin' && actor.role !== 'hr' && actor.role !== 'manager') {
    throw createHttpError('Only Admin, HR, or Manager can assign training.', 403)
  }
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

const ensureTrainingProgramInCompany = async ({ programId, companyId }) => {
  const { data: program, error } = await findTrainingProgramById(programId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!program || program.company_id !== companyId) {
    throw createHttpError('Training program not found for this company.', 404)
  }

  return program
}

const generateCertificateNumber = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CERT-${timestamp}-${random}`
}

// Service functions
export const getTrainingPrograms = async ({ actorId }) => {
  const actor = await ensureActor(actorId)
  ensureCanViewTraining(actor)

  const { data: programs, error } = await listTrainingPrograms(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return programs || []
}

export const createTrainingProgram = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)
  ensureIsHROrAdmin(actor)

  const { name, description, category, is_mandatory } = payload

  if (!name || !name.trim()) {
    throw createHttpError('Training program name is required.', 400)
  }

  if (!category || !['mandatory', 'skill-development', 'optional'].includes(category)) {
    throw createHttpError('Valid category is required (mandatory, skill-development, optional).', 400)
  }

  const { data: program, error } = await createTrainingProgramRecord({
    company_id: actor.company_id,
    name: name.trim(),
    description: description?.trim() || null,
    category,
    is_mandatory: is_mandatory || false,
    created_by_employee_id: actor.id,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return program
}

export const assignTraining = async ({ actorId, payload }) => {
  const actor = await ensureActor(actorId)
  ensureCanAssignTraining(actor)

  const { employee_id, training_program_id, due_date } = payload

  if (!employee_id) {
    throw createHttpError('Employee ID is required.', 400)
  }

  if (!training_program_id) {
    throw createHttpError('Training program ID is required.', 400)
  }

  const assignee = await ensureEmployeeInCompany({ employeeId: employee_id, companyId: actor.company_id })
  await ensureTrainingProgramInCompany({ programId: training_program_id, companyId: actor.company_id })

  if (actor.role === 'admin') {
    if (!['hr', 'manager', 'employee'].includes(assignee.role)) {
      throw createHttpError('Admin can assign training only to HR, Manager, or Employee.', 403)
    }
  }

  if (actor.role === 'hr') {
    if (assignee.role !== 'employee') {
      throw createHttpError('HR can assign training only to employees.', 403)
    }
  }

  if (actor.role === 'manager') {
    if (assignee.role !== 'employee') {
      throw createHttpError('Manager can assign training only to employees.', 403)
    }

    if (assignee.manager_employee_id !== actor.id) {
      throw createHttpError('Manager can assign training only to direct-report employees.', 403)
    }
  }

  if (due_date && new Date(due_date) < new Date()) {
    throw createHttpError('Due date must be in the future.', 400)
  }

  const { data: assignment, error } = await createTrainingAssignmentRecord({
    employee_id,
    training_program_id,
    assigned_at: new Date().toISOString(),
    due_date: due_date || null,
    completion_status: 'pending',
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return assignment
}

export const getMyTrainingAssignments = async ({ actorId }) => {
  const actor = await ensureActor(actorId)

  const { data: assignments, error } = await listTrainingAssignments({ employeeId: actor.id })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  // Separate pending and completed
  const pending = (assignments || []).filter((a) => a.completion_status === 'pending')
  const completed = (assignments || []).filter((a) => a.completion_status === 'completed')

  return { pending, completed }
}

export const completeTraining = async ({ actorId, assignmentId }) => {
  const actor = await ensureActor(actorId)

  const { data: assignment, error: assignmentError } = await findTrainingAssignmentById(assignmentId)

  if (assignmentError) {
    throw createHttpError(assignmentError.message, 500)
  }

  if (!assignment) {
    throw createHttpError('Training assignment not found.', 404)
  }

  if (assignment.employee_id !== actor.id) {
    throw createHttpError('You can only complete your own training assignments.', 403)
  }

  if (assignment.completion_status === 'completed') {
    throw createHttpError('This training is already marked as completed.', 400)
  }

  // Update assignment status
  const { data: updatedAssignment, error: updateError } = await updateTrainingAssignmentStatus(
    assignmentId,
    {
      completion_status: 'completed',
      completed_at: new Date().toISOString(),
    }
  )

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  // Create certificate
  const { data: certificate, error: certError } = await createCertificateRecord({
    assignment_id: assignmentId,
    employee_id: actor.id,
    training_program_id: assignment.training_program_id,
    issued_date: new Date().toISOString(),
    certificate_number: generateCertificateNumber(),
  })

  if (certError) {
    throw createHttpError(certError.message, 500)
  }

  return { assignment: updatedAssignment, certificate }
}

export const getCompanyTrainingAssignments = async ({ actorId }) => {
  const actor = await ensureActor(actorId)
  ensureCanViewTraining(actor)

  const { data: assignments, error } = await listCompanyTrainingAssignments(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const visibleAssignments = actor.role === 'manager'
    ? (assignments || []).filter(
      (a) => a.employee_id === actor.id || a.employees?.manager_employee_id === actor.id
    )
    : (assignments || [])

  // Separate by status
  const pending = visibleAssignments.filter((a) => a.completion_status === 'pending')
  const completed = visibleAssignments.filter((a) => a.completion_status === 'completed')

  return { pending, completed }
}

export const getEmployeeCertificates = async ({ actorId, employeeId }) => {
  const actor = await ensureActor(actorId)

  // Employees can only see their own certificates
  // HR/Admin can see any employee's certificates
  if (actor.role !== 'admin' && actor.role !== 'hr' && actor.id !== employeeId) {
    throw createHttpError('You can only view your own certificates.', 403)
  }

  await ensureEmployeeInCompany({ employeeId, companyId: actor.company_id })

  const { data: certificates, error } = await listEmployeeCertificates(employeeId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return certificates || []
}

export const getTrainingReports = async ({ actorId }) => {
  const actor = await ensureActor(actorId)
  ensureCanViewTraining(actor)

  const { data: assignments, error } = await listCompanyTrainingAssignments(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const ALL_assignments = actor.role === 'manager'
    ? (assignments || []).filter(
      (a) => a.employee_id === actor.id || a.employees?.manager_employee_id === actor.id
    )
    : (assignments || [])

  // Count statistics
  const totalAssignments = ALL_assignments.length
  const completedCount = ALL_assignments.filter((a) => a.completion_status === 'completed').length
  const pendingCount = ALL_assignments.filter((a) => a.completion_status === 'pending').length
  const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0

  // Group by training program
  const byProgram = {}
  ALL_assignments.forEach((a) => {
    const programId = a.training_program_id
    if (!byProgram[programId]) {
      byProgram[programId] = {
        program_id: programId,
        program_name: a.training_programs?.name || 'Unknown',
        total: 0,
        completed: 0,
      }
    }
    byProgram[programId].total += 1
    if (a.completion_status === 'completed') {
      byProgram[programId].completed += 1
    }
  })

  return {
    summary: {
      total_assignments: totalAssignments,
      completed: completedCount,
      pending: pendingCount,
      completion_rate: completionRate,
    },
    by_program: Object.values(byProgram),
    assignments: ALL_assignments,
  }
}

export const getAssignableEmployees = async ({ actorId }) => {
  const actor = await ensureActor(actorId)
  ensureCanAssignTraining(actor)

  const { data: employees, error } = await listCompanyEmployees(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const rows = employees || []

  if (actor.role === 'admin') {
    return rows.filter((employee) => ['hr', 'manager', 'employee'].includes(employee.role))
  }

  if (actor.role === 'hr') {
    return rows.filter((employee) => employee.role === 'employee')
  }

  return rows.filter(
    (employee) => employee.role === 'employee' && employee.manager_employee_id === actor.id
  )
}
