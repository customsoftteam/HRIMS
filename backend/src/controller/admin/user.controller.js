import { createUser, deleteUser, listUsers, transferUserAssignment, updateUser } from '../../services/user.service.js'

const ALLOWED_ADMIN_ROLES = ['hr', 'manager', 'employee']

export const createAdminUser = async (req, res) => {
  try {
    if (!ALLOWED_ADMIN_ROLES.includes(req.body?.role)) {
      return res.status(400).json({
        success: false,
        message: 'Admin can only create HR or Manager users.',
      })
    }

    const user = await createUser({
      ...req.body,
      allowedRoles: ALLOWED_ADMIN_ROLES,
      actor_id: req.user.sub,
      actor_role: req.user.role,
    })

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create user.',
    })
  }
}

export const updateAdminUser = async (req, res) => {
  try {
    const user = await updateUser({
      id: req.params.id,
      payload: {
        ...req.body,
        actor_id: req.user.sub,
        actor_role: req.user.role,
      },
      allowedRoles: ALLOWED_ADMIN_ROLES,
    })

    return res.json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update user.',
    })
  }
}

export const deleteAdminUser = async (req, res) => {
  try {
    await deleteUser({
      id: req.params.id,
      allowedRoles: ALLOWED_ADMIN_ROLES,
      actor_id: req.user.sub,
      actor_role: req.user.role,
    })

    return res.json({
      success: true,
      message: 'User deleted successfully.',
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete user.',
    })
  }
}

export const getAdminUsers = async (req, res) => {
  try {
    const users = await listUsers({
      role: req.query.role,
      plant_office_id: req.query.plant_office_id,
      actor_id: req.user.sub,
      actor_role: req.user.role,
    })

    return res.json({
      success: true,
      message: 'Users fetched successfully.',
      data: users,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch users.',
    })
  }
}

export const transferAdminUser = async (req, res) => {
  try {
    const user = await transferUserAssignment({
      id: req.params.id,
      actor_id: req.user.sub,
      actor_role: req.user.role,
      plant_office_id: req.body?.plant_office_id,
      department_id: req.body?.department_id,
      effective_date: req.body?.effective_date,
    })

    return res.json({
      success: true,
      message: 'User transferred successfully.',
      data: user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to transfer user.',
    })
  }
}
