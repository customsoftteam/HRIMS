import { listUsers } from '../../services/user.service.js'

export const getManagerScopedEmployees = async (req, res) => {
  try {
    const users = await listUsers({
      role: 'employee',
      actor_id: req.user.sub,
      actor_role: req.user.role,
      plant_office_id: req.query.plant_office_id,
    })

    return res.json({
      success: true,
      message: 'Manager scoped employees fetched successfully.',
      data: users,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employees.',
    })
  }
}
