import { getHrDashboardSummary } from '../../services/dashboard.service.js'

export const getHrDashboard = async (req, res) => {
  try {
    const data = await getHrDashboardSummary({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'HR dashboard fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch HR dashboard.',
    })
  }
}
