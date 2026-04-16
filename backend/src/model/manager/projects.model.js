import { supabase } from '../../config/supabase.js'

// ============================================================================
// PROJECTS queries
// ============================================================================

export const listProjectsByManager = async (managerEmployeeId) => {
  return supabase
    .from('projects')
    .select('id, code, name, description, manager_employee_id, status, start_date, end_date, created_at, updated_at')
    .eq('manager_employee_id', managerEmployeeId)
    .order('created_at', { ascending: false })
}

export const listAllProjects = async () => {
  return supabase
    .from('projects')
    .select('id, code, name, description, manager_employee_id, status, start_date, end_date, created_at, updated_at')
    .order('created_at', { ascending: false })
}

export const findProjectById = async (projectId) => {
  return supabase
    .from('projects')
    .select('id, code, name, description, manager_employee_id, status, start_date, end_date, created_at, updated_at')
    .eq('id', projectId)
    .single()
}

export const createProjectRecord = async (payload) => {
  return supabase
    .from('projects')
    .insert(payload)
    .select('id, code, name, description, manager_employee_id, status, start_date, end_date, created_at, updated_at')
    .single()
}

export const updateProjectRecord = async (projectId, payload) => {
  return supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .select('id, code, name, description, manager_employee_id, status, start_date, end_date, created_at, updated_at')
    .single()
}

export const deleteProjectRecord = async (projectId) => {
  return supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
}

// ============================================================================
// PROJECT TEAMS queries
// ============================================================================

export const listTeamsByProject = async (projectId) => {
  return supabase
    .from('project_teams')
    .select('id, project_id, name, description, created_by_id, created_at, updated_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
}

export const findTeamById = async (teamId) => {
  return supabase
    .from('project_teams')
    .select('id, project_id, name, description, created_by_id, created_at, updated_at')
    .eq('id', teamId)
    .single()
}

export const createTeamRecord = async (payload) => {
  return supabase
    .from('project_teams')
    .insert(payload)
    .select('id, project_id, name, description, created_by_id, created_at, updated_at')
    .single()
}

export const updateTeamRecord = async (teamId, payload) => {
  return supabase
    .from('project_teams')
    .update(payload)
    .eq('id', teamId)
    .select('id, project_id, name, description, created_by_id, created_at, updated_at')
    .single()
}

export const deleteTeamRecord = async (teamId) => {
  return supabase
    .from('project_teams')
    .delete()
    .eq('id', teamId)
}

// ============================================================================
// PROJECT TEAM MEMBERS queries
// ============================================================================

export const listTeamMembers = async (teamId) => {
  return supabase
    .from('project_team_members')
    .select('id, team_id, employee_id, role, assigned_at, updated_at')
    .eq('team_id', teamId)
    .order('assigned_at', { ascending: true })
}

export const findTeamMemberById = async (memberId) => {
  return supabase
    .from('project_team_members')
    .select('id, team_id, employee_id, role, assigned_at, updated_at')
    .eq('id', memberId)
    .single()
}

export const findTeamMemberByTeamAndEmployee = async (teamId, employeeId) => {
  return supabase
    .from('project_team_members')
    .select('id, team_id, employee_id, role, assigned_at, updated_at')
    .eq('team_id', teamId)
    .eq('employee_id', employeeId)
    .maybeSingle()
}

export const createTeamMemberRecord = async (payload) => {
  return supabase
    .from('project_team_members')
    .insert(payload)
    .select('id, team_id, employee_id, role, assigned_at, updated_at')
    .single()
}

export const updateTeamMemberRecord = async (memberId, payload) => {
  return supabase
    .from('project_team_members')
    .update(payload)
    .eq('id', memberId)
    .select('id, team_id, employee_id, role, assigned_at, updated_at')
    .single()
}

export const deleteTeamMemberRecord = async (memberId) => {
  return supabase
    .from('project_team_members')
    .delete()
    .eq('id', memberId)
}

// ============================================================================
// PROJECT MEMBERS queries (existing code)
// ============================================================================

export const listProjectMembers = async (projectId) => {
  return supabase
    .from('project_members')
    .select('id, project_id, employee_id, member_role, joined_on, created_at, updated_at')
    .eq('project_id', projectId)
    .order('joined_on', { ascending: true })
}

export const findProjectMemberByProjectAndEmployee = async (projectId, employeeId) => {
  return supabase
    .from('project_members')
    .select('id, project_id, employee_id, member_role, joined_on, created_at, updated_at')
    .eq('project_id', projectId)
    .eq('employee_id', employeeId)
    .maybeSingle()
}

export const findProjectMemberById = async (memberId) => {
  return supabase
    .from('project_members')
    .select('id, project_id, employee_id, member_role, joined_on, created_at, updated_at')
    .eq('id', memberId)
    .single()
}

export const createProjectMemberRecord = async (payload) => {
  return supabase
    .from('project_members')
    .insert(payload)
    .select('id, project_id, employee_id, member_role, joined_on, created_at, updated_at')
    .single()
}

export const deleteProjectMemberRecord = async (memberId) => {
  return supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)
}
