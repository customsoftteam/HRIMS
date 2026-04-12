import { createUser, deleteUser, listUsers, transferUserAssignment, updateUser } from '../../services/user.service.js'

const ALLOWED_HR_ROLES = ['employee']

export const createHrEmployee = async (req, res) => {
  try {
    const user = await createUser({
      ...req.body,
      role: 'employee',
      allowedRoles: ALLOWED_HR_ROLES,
      actor_id: req.user.sub,
      actor_role: req.user.role,
    })

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create employee.',
    })
  }
}

export const getHrEmployees = async (_req, res) => {
  try {
    const users = await listUsers({
      role: 'employee',
      plant_office_id: req.query.plant_office_id,
      actor_id: req.user.sub,
      actor_role: req.user.role,
    })

    return res.json({
      success: true,
      message: 'Employees fetched successfully.',
      data: users,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch employees.',
    })
  }
}

export const updateHrEmployee = async (req, res) => {
  try {
    const user = await updateUser({
      id: req.params.id,
      payload: {
        ...req.body,
        actor_id: req.user.sub,
        actor_role: req.user.role,
      },
      allowedRoles: ALLOWED_HR_ROLES,
    })

    return res.json({
      success: true,
      message: 'Employee updated successfully.',
      data: user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee.',
    })
  }
}

export const deleteHrEmployee = async (req, res) => {
  try {
    await deleteUser({
      id: req.params.id,
      allowedRoles: ALLOWED_HR_ROLES,
      actor_id: req.user.sub,
      actor_role: req.user.role,
    })

    return res.json({
      success: true,
      message: 'Employee deleted successfully.',
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete employee.',
    })
  }
}

export const transferHrEmployee = async (req, res) => {
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
      message: 'Employee transferred successfully.',
      data: user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to transfer employee.',
    })
  }
}
