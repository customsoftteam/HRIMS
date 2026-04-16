import { findEmployeeById } from '../model/admin/user.model.js'
import {
  listProjectsByManagerForTasks,
  listProjectsByIdsForTasks,
  findProjectByIdForTasks,
  findProjectMemberByProjectAndEmployee,
  listTasksByProjectIds,
  listTasksAssignedToEmployee,
  findTaskById,
  createTaskRecord,
  updateTaskRecord,
  deleteTaskRecord,
  listTaskUpdatesByTaskId,
  createTaskUpdateRecord,
  deleteTaskUpdateRecord,
  findTaskUpdateById,
} from '../model/manager/tasks.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const enrichTasks = async (tasks = []) => {
  const projectIds = [...new Set(tasks.map((task) => task.project_id).filter(Boolean))]
  const { data: projects, error: projectsError } = await listProjectsByIdsForTasks(projectIds)

  if (projectsError) {
    throw createHttpError(projectsError.message, 500)
  }

  const projectMap = new Map((projects || []).map((project) => [project.id, project]))

  const employeeIds = [...new Set(tasks.flatMap((task) => [task.assigned_to, task.assigned_by]).filter(Boolean))]

  const employeeMap = new Map()
  await Promise.all(
    employeeIds.map(async (id) => {
      const { data, error } = await findEmployeeById(id)
      if (!error && data) {
        employeeMap.set(id, {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          employee_code: data.employee_code,
          email: data.email,
        })
      }
    })
  )

  return tasks.map((task) => ({
    ...task,
    project: task.project_id ? projectMap.get(task.project_id) || null : null,
    assigned_to_employee: task.assigned_to ? employeeMap.get(task.assigned_to) || null : null,
    assigned_by_employee: task.assigned_by ? employeeMap.get(task.assigned_by) || null : null,
  }))
}

const ensureManagerProjectAccess = async (actorId, projectId) => {
  const { data: project, error } = await findProjectByIdForTasks(projectId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (project.manager_employee_id !== actorId) {
    throw createHttpError('You do not have access to this project', 403)
  }

  return project
}

export const getManagerTaskProjects = async ({ actorId }) => {
  const { data, error } = await listProjectsByManagerForTasks(actorId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data || []
}

export const getManagerTasks = async ({ actorId, projectId, status, assignedTo }) => {
  const { data: projects, error: projectsError } = await listProjectsByManagerForTasks(actorId)

  if (projectsError) {
    throw createHttpError(projectsError.message, 500)
  }

  const projectIds = (projects || []).map((project) => project.id)

  if (projectId && !projectIds.includes(projectId)) {
    throw createHttpError('You do not have access to this project', 403)
  }

  const { data: tasks, error } = await listTasksByProjectIds({ projectIds, projectId, status, assignedTo })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return enrichTasks(tasks || [])
}

export const createManagerTask = async ({ actorId, payload }) => {
  const { project_id: projectId, assigned_to: assignedTo, title, description, priority, due_date: dueDate } = payload

  if (!projectId || !assignedTo || !title?.trim()) {
    throw createHttpError('project_id, assigned_to, and title are required.', 400)
  }

  await ensureManagerProjectAccess(actorId, projectId)

  const { data: membership, error: membershipError } = await findProjectMemberByProjectAndEmployee(projectId, assignedTo)

  if (membershipError) {
    throw createHttpError(membershipError.message, 500)
  }

  if (!membership) {
    throw createHttpError('Assignee is not a member of this project.', 400)
  }

  const { data: created, error } = await createTaskRecord({
    project_id: projectId,
    title: title.trim(),
    description: description || null,
    status: 'todo',
    priority: priority || 'medium',
    progress_percent: 0,
    assigned_to: assignedTo,
    assigned_by: actorId,
    due_date: dueDate || null,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const [enriched] = await enrichTasks([created])
  return enriched
}

export const updateManagerTask = async ({ actorId, taskId, payload }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task) {
    throw createHttpError('Task not found', 404)
  }

  await ensureManagerProjectAccess(actorId, task.project_id)

  if (payload.assigned_to) {
    const { data: membership, error: membershipError } = await findProjectMemberByProjectAndEmployee(task.project_id, payload.assigned_to)
    if (membershipError) {
      throw createHttpError(membershipError.message, 500)
    }
    if (!membership) {
      throw createHttpError('Assignee is not a member of this project.', 400)
    }
  }

  const updatePayload = {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.priority !== undefined && { priority: payload.priority }),
    ...(payload.status !== undefined && { status: payload.status }),
    ...(payload.progress_percent !== undefined && { progress_percent: payload.progress_percent }),
    ...(payload.assigned_to !== undefined && { assigned_to: payload.assigned_to }),
    ...(payload.due_date !== undefined && { due_date: payload.due_date }),
    ...(payload.completed_at !== undefined && { completed_at: payload.completed_at }),
  }

  const { data: updated, error } = await updateTaskRecord(taskId, updatePayload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const [enriched] = await enrichTasks([updated])
  return enriched
}

export const deleteManagerTask = async ({ actorId, taskId }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task) {
    throw createHttpError('Task not found', 404)
  }

  await ensureManagerProjectAccess(actorId, task.project_id)

  const { error } = await deleteTaskRecord(taskId)
  if (error) {
    throw createHttpError(error.message, 500)
  }

  return { success: true, id: taskId }
}

export const getTaskUpdatesForManager = async ({ actorId, taskId }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task) {
    throw createHttpError('Task not found', 404)
  }

  await ensureManagerProjectAccess(actorId, task.project_id)

  const { data: updates, error } = await listTaskUpdatesByTaskId(taskId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return updates || []
}

export const addTaskUpdateForManager = async ({ actorId, taskId, payload }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task) {
    throw createHttpError('Task not found', 404)
  }

  await ensureManagerProjectAccess(actorId, task.project_id)

  const { note, media_url: mediaUrl, media_type: mediaType } = payload

  if (!note && !mediaUrl) {
    throw createHttpError('Either note or media_url is required.', 400)
  }

  const { data, error } = await createTaskUpdateRecord({
    task_id: taskId,
    updated_by: actorId,
    note: note || null,
    media_url: mediaUrl || null,
    media_type: mediaType || null,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const deleteTaskUpdateForManager = async ({ actorId, updateId }) => {
  const { data: update, error: updateError } = await findTaskUpdateById(updateId)

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  if (!update) {
    throw createHttpError('Task update not found', 404)
  }

  const { data: task, error: taskError } = await findTaskById(update.task_id)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task) {
    throw createHttpError('Task not found', 404)
  }

  await ensureManagerProjectAccess(actorId, task.project_id)

  const { error } = await deleteTaskUpdateRecord(updateId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return { success: true, id: updateId }
}

export const getEmployeeTasks = async ({ actorId, status }) => {
  const { data: tasks, error } = await listTasksAssignedToEmployee({ employeeId: actorId, status })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return enrichTasks(tasks || [])
}

export const updateEmployeeTask = async ({ actorId, taskId, payload }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task || task.assigned_to !== actorId) {
    throw createHttpError('Task not found or not assigned to you.', 404)
  }

  const updatePayload = {
    ...(payload.status !== undefined && { status: payload.status }),
    ...(payload.progress_percent !== undefined && { progress_percent: payload.progress_percent }),
    ...(payload.completed_at !== undefined && { completed_at: payload.completed_at }),
  }

  const { data: updated, error } = await updateTaskRecord(taskId, updatePayload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const [enriched] = await enrichTasks([updated])
  return enriched
}

export const getTaskUpdatesForEmployee = async ({ actorId, taskId }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task || task.assigned_to !== actorId) {
    throw createHttpError('Task not found or not assigned to you.', 404)
  }

  const { data: updates, error } = await listTaskUpdatesByTaskId(taskId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return updates || []
}

export const addTaskUpdateForEmployee = async ({ actorId, taskId, payload }) => {
  const { data: task, error: taskError } = await findTaskById(taskId)

  if (taskError) {
    throw createHttpError(taskError.message, 500)
  }

  if (!task || task.assigned_to !== actorId) {
    throw createHttpError('Task not found or not assigned to you.', 404)
  }

  const { note, media_url: mediaUrl, media_type: mediaType } = payload

  if (!note && !mediaUrl) {
    throw createHttpError('Either note or media_url is required.', 400)
  }

  const { data, error } = await createTaskUpdateRecord({
    task_id: taskId,
    updated_by: actorId,
    note: note || null,
    media_url: mediaUrl || null,
    media_type: mediaType || null,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}
