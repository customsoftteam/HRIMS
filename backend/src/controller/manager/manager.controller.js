import { getManagerDashboardSummary } from '../../services/dashboard.service.js'

export const getManagerDashboard = async (req, res) => {
  try {
    const data = await getManagerDashboardSummary({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Manager dashboard fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch manager dashboard.',
    })
  }
}
