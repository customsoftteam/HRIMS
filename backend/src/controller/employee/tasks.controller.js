import {
  getEmployeeTasks,
  updateEmployeeTask,
  getTaskUpdatesForEmployee,
  addTaskUpdateForEmployee,
} from '../../services/tasks.service.js'

export const getEmployeeTasksList = async (req, res) => {
  try {
    const data = await getEmployeeTasks({ actorId: req.user.sub, status: req.query.status })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

export const editEmployeeTask = async (req, res) => {
  try {
    const data = await updateEmployeeTask({ actorId: req.user.sub, taskId: req.params.taskId, payload: req.body })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

export const getEmployeeTaskUpdates = async (req, res) => {
  try {
    const data = await getTaskUpdatesForEmployee({ actorId: req.user.sub, taskId: req.params.taskId })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

export const addEmployeeTaskUpdate = async (req, res) => {
  try {
    const data = await addTaskUpdateForEmployee({ actorId: req.user.sub, taskId: req.params.taskId, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}
