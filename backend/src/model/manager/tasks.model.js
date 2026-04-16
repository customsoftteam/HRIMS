import { supabase } from '../../config/supabase.js'

export const listProjectsByManagerForTasks = async (managerEmployeeId) => {
  return supabase
    .from('projects')
    .select('id, code, name, status')
    .eq('manager_employee_id', managerEmployeeId)
    .order('created_at', { ascending: false })
}

export const findProjectByIdForTasks = async (projectId) => {
  return supabase
    .from('projects')
    .select('id, code, name, manager_employee_id, status')
    .eq('id', projectId)
    .maybeSingle()
}

export const listProjectsByIdsForTasks = async (projectIds = []) => {
  if (!projectIds.length) {
    return { data: [], error: null }
  }

  return supabase
    .from('projects')
    .select('id, code, name, status, manager_employee_id')
    .in('id', projectIds)
}

export const findProjectMemberByProjectAndEmployee = async (projectId, employeeId) => {
  return supabase
    .from('project_members')
    .select('id, project_id, employee_id, member_role')
    .eq('project_id', projectId)
    .eq('employee_id', employeeId)
    .maybeSingle()
}

export const listTasksByProjectIds = async ({ projectIds = [], projectId, status, assignedTo }) => {
  if (!projectIds.length) {
    return { data: [], error: null }
  }

  let query = supabase
    .from('tasks')
    .select('id, project_id, title, description, status, priority, progress_percent, assigned_to, assigned_by, due_date, completed_at, created_at, updated_at')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo)
  }

  return query
}

export const listTasksAssignedToEmployee = async ({ employeeId, status }) => {
  let query = supabase
    .from('tasks')
    .select('id, project_id, title, description, status, priority, progress_percent, assigned_to, assigned_by, due_date, completed_at, created_at, updated_at')
    .eq('assigned_to', employeeId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  return query
}

export const findTaskById = async (taskId) => {
  return supabase
    .from('tasks')
    .select('id, project_id, title, description, status, priority, progress_percent, assigned_to, assigned_by, due_date, completed_at, created_at, updated_at')
    .eq('id', taskId)
    .maybeSingle()
}

export const createTaskRecord = async (payload) => {
  return supabase
    .from('tasks')
    .insert(payload)
    .select('id, project_id, title, description, status, priority, progress_percent, assigned_to, assigned_by, due_date, completed_at, created_at, updated_at')
    .single()
}

export const updateTaskRecord = async (taskId, payload) => {
  return supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('id, project_id, title, description, status, priority, progress_percent, assigned_to, assigned_by, due_date, completed_at, created_at, updated_at')
    .single()
}

export const deleteTaskRecord = async (taskId) => {
  return supabase.from('tasks').delete().eq('id', taskId)
}

export const listTaskUpdatesByTaskId = async (taskId) => {
  return supabase
    .from('task_updates')
    .select('id, task_id, updated_by, note, media_url, media_type, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
}

export const createTaskUpdateRecord = async (payload) => {
  return supabase
    .from('task_updates')
    .insert(payload)
    .select('id, task_id, updated_by, note, media_url, media_type, created_at')
    .single()
}

export const deleteTaskUpdateRecord = async (updateId) => {
  return supabase.from('task_updates').delete().eq('id', updateId)
}

export const findTaskUpdateById = async (updateId) => {
  return supabase
    .from('task_updates')
    .select('id, task_id, updated_by, note, media_url, media_type, created_at')
    .eq('id', updateId)
    .maybeSingle()
}
