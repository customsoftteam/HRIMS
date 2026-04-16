import { supabase } from '../config/supabase.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getActor = async (actorId) => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, company_id, role, status, phone, email, designation_id, manager_employee_id')
    .eq('id', actorId)
    .maybeSingle()

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!data) {
    throw createHttpError('Authenticated user not found.', 401)
  }

  return data
}

const getActorLocationScope = async (actorId) => {
  const { data, error } = await supabase
    .from('user_location_assignments')
    .select('plant_office_id')
    .eq('employee_id', actorId)
    .eq('status', 'active')
    .is('end_date', null)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return [...new Set((data || []).map((row) => row.plant_office_id))]
}

export const getAdminDashboardSummary = async ({ actorId }) => {
  const actor = await getActor(actorId)

  if (!actor.company_id) {
    throw createHttpError('Authenticated user is not linked to a company.', 400)
  }

  const [{ count: totalEmployees, error: totalEmployeesError }, { count: activeLocations, error: activeLocationsError }, { count: activeDepartmentMappings, error: activeDepartmentMappingsError }, { count: activeHrUsers, error: activeHrUsersError }] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', actor.company_id),
    supabase.from('plants_offices').select('*', { count: 'exact', head: true }).eq('company_id', actor.company_id).eq('is_active', true),
    supabase.from('location_departments').select('*', { count: 'exact', head: true }).eq('company_id', actor.company_id).eq('is_active', true),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', actor.company_id).eq('role', 'hr').eq('status', 'active'),
  ])

  const error = totalEmployeesError || activeLocationsError || activeDepartmentMappingsError || activeHrUsersError
  if (error) {
    throw createHttpError(error.message, 500)
  }

  return {
    stats: [
      { label: 'Total Employees', value: String(totalEmployees || 0) },
      { label: 'Active Locations', value: String(activeLocations || 0) },
      { label: 'Department Mappings', value: String(activeDepartmentMappings || 0) },
      { label: 'Active HR Users', value: String(activeHrUsers || 0) },
    ],
    highlights: [
      `Organization has ${totalEmployees || 0} employees mapped under the active company.`,
      `${activeLocations || 0} locations are currently active for operations.`,
      `${activeDepartmentMappings || 0} location-department mappings are active in the org structure.`,
      `${activeHrUsers || 0} HR users are currently active and can manage workforce records.`,
    ],
  }
}

export const getHrDashboardSummary = async ({ actorId }) => {
  const actor = await getActor(actorId)
  const scopeLocationIds = await getActorLocationScope(actorId)

  if (!actor.company_id) {
    throw createHttpError('Authenticated user is not linked to a company.', 400)
  }

  if (!scopeLocationIds.length) {
    return {
      stats: [
        { label: 'Employees In Scope', value: '0' },
        { label: 'Managers In Scope', value: '0' },
        { label: 'Locations In Scope', value: '0' },
        { label: 'Departments Covered', value: '0' },
      ],
      highlights: [
        'No active location assignment found for this HR user.',
        'Assign at least one location to start managing people records.',
        'Department coverage and employee numbers will appear once scope is configured.',
        'Use admin people and organization modules to set up assignments.',
      ],
    }
  }

  const [{ data: locationAssignments, error: locationAssignmentsError }, { data: departmentAssignments, error: departmentAssignmentsError }] = await Promise.all([
    supabase
      .from('user_location_assignments')
      .select('employee_id')
      .eq('company_id', actor.company_id)
      .in('plant_office_id', scopeLocationIds)
      .eq('status', 'active')
      .is('end_date', null),
    supabase
      .from('employee_department_assignments')
      .select('department_id')
      .eq('company_id', actor.company_id)
      .in('plant_office_id', scopeLocationIds)
      .eq('status', 'active')
      .is('end_date', null),
  ])

  if (locationAssignmentsError || departmentAssignmentsError) {
    throw createHttpError((locationAssignmentsError || departmentAssignmentsError).message, 500)
  }

  const scopedEmployeeIds = [...new Set((locationAssignments || []).map((row) => row.employee_id))]
  const scopedDepartmentIds = [...new Set((departmentAssignments || []).map((row) => row.department_id))]

  if (!scopedEmployeeIds.length) {
    return {
      stats: [
        { label: 'Employees In Scope', value: '0' },
        { label: 'Managers In Scope', value: '0' },
        { label: 'Locations In Scope', value: String(scopeLocationIds.length) },
        { label: 'Departments Covered', value: String(scopedDepartmentIds.length) },
      ],
      highlights: [
        'No employees are currently mapped to your active location scope.',
        'Create employees from the People module to populate this dashboard.',
        `You are assigned to ${scopeLocationIds.length} location(s).`,
        `Current department coverage in scope is ${scopedDepartmentIds.length}.`,
      ],
    }
  }

  const { data: scopedEmployees, error: scopedEmployeesError } = await supabase
    .from('employees')
    .select('id, role')
    .eq('company_id', actor.company_id)
    .in('id', scopedEmployeeIds)

  if (scopedEmployeesError) {
    throw createHttpError(scopedEmployeesError.message, 500)
  }

  const employeesInScope = (scopedEmployees || []).filter((row) => row.role === 'employee').length
  const managersInScope = (scopedEmployees || []).filter((row) => row.role === 'manager').length

  return {
    stats: [
      { label: 'Employees In Scope', value: String(employeesInScope) },
      { label: 'Managers In Scope', value: String(managersInScope) },
      { label: 'Locations In Scope', value: String(scopeLocationIds.length) },
      { label: 'Departments Covered', value: String(scopedDepartmentIds.length) },
    ],
    highlights: [
      `You currently manage ${employeesInScope} employee record(s) in your location scope.`,
      `${managersInScope} manager profile(s) are available in your scoped locations.`,
      `HR scope includes ${scopeLocationIds.length} active location(s).`,
      `${scopedDepartmentIds.length} department(s) are currently covered by active assignments.`,
    ],
  }
}

export const getManagerDashboardSummary = async ({ actorId }) => {
  const actor = await getActor(actorId)

  if (!actor.company_id) {
    throw createHttpError('Authenticated user is not linked to a company.', 400)
  }

  const [{ data: directReports, error: directReportsError }, { data: managerAssignments, error: managerAssignmentsError }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, status')
      .eq('company_id', actor.company_id)
      .eq('manager_employee_id', actorId)
      .eq('role', 'employee'),
    supabase
      .from('user_location_assignments')
      .select('plant_office_id')
      .eq('employee_id', actorId)
      .eq('status', 'active')
      .is('end_date', null),
  ])

  if (directReportsError || managerAssignmentsError) {
    throw createHttpError((directReportsError || managerAssignmentsError).message, 500)
  }

  const directReportIds = (directReports || []).map((row) => row.id)
  let teamDepartmentCount = 0

  if (directReportIds.length) {
    const { data: departmentAssignments, error: departmentAssignmentsError } = await supabase
      .from('employee_department_assignments')
      .select('department_id')
      .in('employee_id', directReportIds)
      .eq('status', 'active')
      .is('end_date', null)

    if (departmentAssignmentsError) {
      throw createHttpError(departmentAssignmentsError.message, 500)
    }

    teamDepartmentCount = [...new Set((departmentAssignments || []).map((row) => row.department_id))].length
  }

  const activeDirectReports = (directReports || []).filter((row) => row.status === 'active').length
  const managerLocationCount = [...new Set((managerAssignments || []).map((row) => row.plant_office_id))].length

  return {
    stats: [
      { label: 'Direct Reports', value: String((directReports || []).length) },
      { label: 'Active Team Members', value: String(activeDirectReports) },
      { label: 'My Locations', value: String(managerLocationCount) },
      { label: 'Team Departments', value: String(teamDepartmentCount) },
    ],
    highlights: [
      `You have ${(directReports || []).length} direct report(s) assigned.`,
      `${activeDirectReports} direct report(s) are currently active.`,
      `Your active assignment scope spans ${managerLocationCount} location(s).`,
      `Your team contributes across ${teamDepartmentCount} department(s).`,
    ],
  }
}

export const getEmployeeDashboardSummary = async ({ actorId }) => {
  const actor = await getActor(actorId)

  const [{ count: locationCount, error: locationError }, { count: departmentCount, error: departmentError }] = await Promise.all([
    supabase
      .from('user_location_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', actorId)
      .eq('status', 'active')
      .is('end_date', null),
    supabase
      .from('employee_department_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', actorId)
      .eq('status', 'active')
      .is('end_date', null),
  ])

  if (locationError || departmentError) {
    throw createHttpError((locationError || departmentError).message, 500)
  }

  const profileFields = [actor.first_name, actor.last_name, actor.email, actor.phone, actor.designation_id, actor.manager_employee_id]
  const completedFields = profileFields.filter(Boolean).length
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100)

  return {
    stats: [
      { label: 'Profile Completion', value: `${profileCompletion}%` },
      { label: 'Active Locations', value: String(locationCount || 0) },
      { label: 'Department Assignments', value: String(departmentCount || 0) },
      { label: 'Reporting Manager', value: actor.manager_employee_id ? 'Assigned' : 'Not Set' },
    ],
    highlights: [
      `Your profile is ${profileCompletion}% complete based on key employee fields.`,
      `You currently have ${locationCount || 0} active location assignment(s).`,
      `You are mapped to ${departmentCount || 0} active department assignment(s).`,
      actor.manager_employee_id
        ? 'Your reporting manager is configured in the system.'
        : 'No reporting manager is configured yet. Contact HR if this is incorrect.',
    ],
  }
}