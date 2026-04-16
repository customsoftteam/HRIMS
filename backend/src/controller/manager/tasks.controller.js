import {
  getManagerTaskProjects,
  getManagerTasks,
  createManagerTask,
  updateManagerTask,
  deleteManagerTask,
  getTaskUpdatesForManager,
  addTaskUpdateForManager,
  deleteTaskUpdateForManager,
} from '../../services/tasks.service.js'

export const getManagerProjectsForTasks = async (req, res) => {
  try {
    const data = await getManagerTaskProjects({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

export const getManagerTasksList = async (req, res) => {
  try {
    const data = await getManagerTasks({
      actorId: req.user.sub,
      projectId: req.query.project_id,
      status: req.query.status,
      assignedTo: req.query.assigned_to,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

export const addManagerTask = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Manager task mutations are disabled. Employees can update tasks from the employee portal.' })
}

export const editManagerTask = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Manager task mutations are disabled. Employees can update tasks from the employee portal.' })
}

export const removeManagerTask = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Manager task mutations are disabled. Employees can update tasks from the employee portal.' })
}

export const getManagerTaskUpdates = async (req, res) => {
  try {
    const data = await getTaskUpdatesForManager({ actorId: req.user.sub, taskId: req.params.taskId })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

export const addManagerTaskUpdate = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Manager task mutations are disabled. Employees can update tasks from the employee portal.' })
}

export const removeManagerTaskUpdate = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Manager task mutations are disabled. Employees can update tasks from the employee portal.' })
}
