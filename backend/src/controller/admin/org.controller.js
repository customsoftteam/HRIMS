import {
  createDepartmentForLocation,
  createLocation,
  deleteDepartmentForLocation,
  deleteLocation,
  getDepartments,
  getLocations,
  getManagersByLocation,
  updateDepartmentForLocation,
  updateLocation,
} from '../../services/org.service.js'

export const listAdminLocations = async (req, res) => {
  try {
    const data = await getLocations({ actorId: req.user.sub })

    return res.json({
      success: true,
      message: 'Locations fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch locations.',
    })
  }
}

export const createAdminLocation = async (req, res) => {
  try {
    const data = await createLocation({ actorId: req.user.sub, payload: req.body })

    return res.status(201).json({
      success: true,
      message: 'Location created successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create location.',
    })
  }
}

export const updateAdminLocation = async (req, res) => {
  try {
    const data = await updateLocation({
      actorId: req.user.sub,
      locationId: req.params.id,
      payload: req.body,
    })

    return res.json({
      success: true,
      message: 'Location updated successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update location.',
    })
  }
}

export const deleteAdminLocation = async (req, res) => {
  try {
    const data = await deleteLocation({
      actorId: req.user.sub,
      locationId: req.params.id,
    })

    return res.json({
      success: true,
      message: 'Location removed successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove location.',
    })
  }
}

export const listAdminDepartments = async (req, res) => {
  try {
    const data = await getDepartments({
      actorId: req.user.sub,
      plantOfficeId: req.query.plant_office_id,
    })

    return res.json({
      success: true,
      message: 'Departments fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch departments.',
    })
  }
}

export const createAdminDepartment = async (req, res) => {
  try {
    const data = await createDepartmentForLocation({
      actorId: req.user.sub,
      payload: req.body,
    })

    return res.status(201).json({
      success: true,
      message: 'Department added to location successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add department.',
    })
  }
}

export const updateAdminDepartment = async (req, res) => {
  try {
    const data = await updateDepartmentForLocation({
      actorId: req.user.sub,
      mappingId: req.params.id,
      payload: req.body,
    })

    return res.json({
      success: true,
      message: 'Department updated successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update department.',
    })
  }
}

export const deleteAdminDepartment = async (req, res) => {
  try {
    const data = await deleteDepartmentForLocation({
      actorId: req.user.sub,
      mappingId: req.params.id,
    })

    return res.json({
      success: true,
      message: 'Department removed successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove department.',
    })
  }
}

export const listAdminManagersByLocation = async (req, res) => {
  try {
    const data = await getManagersByLocation({
      actorId: req.user.sub,
      plantOfficeId: req.query.plant_office_id,
    })

    return res.json({
      success: true,
      message: 'Managers fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch managers.',
    })
  }
}
