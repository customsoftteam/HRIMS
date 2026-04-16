import { getAdminDashboardSummary } from '../../services/dashboard.service.js'

export const getAdminDashboard = async (req, res) => {
  try {
    const data = await getAdminDashboardSummary({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Admin dashboard fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch admin dashboard.',
    })
  }
}
