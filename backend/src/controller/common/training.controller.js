import {
  assignTraining,
  completeTraining,
  createTrainingProgram,
  getAssignableEmployees,
  getCompanyTrainingAssignments,
  getEmployeeCertificates,
  getMyTrainingAssignments,
  getTrainingPrograms,
  getTrainingReports,
} from '../../services/training.service.js'

export const getTrainingProgramsController = async (req, res) => {
  try {
    const data = await getTrainingPrograms({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch training programs.' })
  }
}

export const createTrainingProgramController = async (req, res) => {
  try {
    const data = await createTrainingProgram({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to create training program.' })
  }
}

export const assignTrainingController = async (req, res) => {
  try {
    const data = await assignTraining({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to assign training.' })
  }
}

export const getAssignableEmployeesController = async (req, res) => {
  try {
    const data = await getAssignableEmployees({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch assignable employees.' })
  }
}

export const getMyTrainingController = async (req, res) => {
  try {
    const data = await getMyTrainingAssignments({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch your training assignments.' })
  }
}

export const completeTrainingController = async (req, res) => {
  try {
    const data = await completeTraining({ actorId: req.user.sub, assignmentId: req.params.assignmentId })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to complete training.' })
  }
}

export const getCompanyTrainingController = async (req, res) => {
  try {
    const data = await getCompanyTrainingAssignments({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch company training assignments.' })
  }
}

export const getEmployeeCertificatesController = async (req, res) => {
  try {
    const data = await getEmployeeCertificates({ actorId: req.user.sub, employeeId: req.params.employeeId })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch certificates.' })
  }
}

export const getTrainingReportsController = async (req, res) => {
  try {
    const data = await getTrainingReports({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch training reports.' })
  }
}
