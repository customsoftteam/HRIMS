import { getEmployeeDashboardSummary } from '../../services/dashboard.service.js'
import { getEmployeeProjects } from '../../services/employee-projects.service.js'

export const getEmployeeDashboard = async (req, res) => {
  try {
    const data = await getEmployeeDashboardSummary({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Employee dashboard fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee dashboard.',
    })
  }
}

export const getEmployeeProjectsController = async (req, res) => {
  try {
    const data = await getEmployeeProjects({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Employee projects fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employee projects.',
    })
  }
}
