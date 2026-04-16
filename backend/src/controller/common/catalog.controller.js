import {
  createCatalogDesignation,
  createCatalogResponsibility,
  deleteCatalogDesignation,
  deleteCatalogResponsibility,
  getCatalogDepartments,
  getCatalogDesignations,
  getCatalogLocations,
  getCatalogResponsibilities,
  updateCatalogDesignation,
  updateCatalogResponsibility,
} from '../../services/catalog.service.js'

export const listCatalogLocations = async (req, res) => {
  try {
    const data = await getCatalogLocations({ actorId: req.user.sub })

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

export const listCatalogDepartments = async (req, res) => {
  try {
    const data = await getCatalogDepartments({
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

export const listCatalogDesignations = async (req, res) => {
  try {
    const data = await getCatalogDesignations({
      actorId: req.user.sub,
      plantOfficeId: req.query.plant_office_id,
      departmentId: req.query.department_id,
    })

    return res.json({
      success: true,
      message: 'Designations fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch designations.',
    })
  }
}

export const createCatalogDesignationHandler = async (req, res) => {
  try {
    const data = await createCatalogDesignation({
      actorId: req.user.sub,
      payload: req.body || {},
    })

    return res.status(201).json({
      success: true,
      message: 'Designation created successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create designation.',
    })
  }
}

export const updateCatalogDesignationHandler = async (req, res) => {
  try {
    const data = await updateCatalogDesignation({
      actorId: req.user.sub,
      designationId: req.params.id,
      payload: req.body || {},
    })

    return res.json({
      success: true,
      message: 'Designation updated successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update designation.',
    })
  }
}

export const deleteCatalogDesignationHandler = async (req, res) => {
  try {
    const data = await deleteCatalogDesignation({
      actorId: req.user.sub,
      designationId: req.params.id,
    })

    return res.json({
      success: true,
      message: 'Designation removed successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove designation.',
    })
  }
}

export const listCatalogResponsibilitiesHandler = async (req, res) => {
  try {
    const data = await getCatalogResponsibilities({
      actorId: req.user.sub,
      designationId: req.query.designation_id,
    })

    return res.json({
      success: true,
      message: 'Responsibilities fetched successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch responsibilities.',
    })
  }
}

export const createCatalogResponsibilityHandler = async (req, res) => {
  try {
    const data = await createCatalogResponsibility({
      actorId: req.user.sub,
      payload: req.body || {},
    })

    return res.status(201).json({
      success: true,
      message: 'Responsibility created successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create responsibility.',
    })
  }
}

export const updateCatalogResponsibilityHandler = async (req, res) => {
  try {
    const data = await updateCatalogResponsibility({
      actorId: req.user.sub,
      responsibilityId: req.params.id,
      payload: req.body || {},
    })

    return res.json({
      success: true,
      message: 'Responsibility updated successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update responsibility.',
    })
  }
}

export const deleteCatalogResponsibilityHandler = async (req, res) => {
  try {
    const data = await deleteCatalogResponsibility({
      actorId: req.user.sub,
      responsibilityId: req.params.id,
    })

    return res.json({
      success: true,
      message: 'Responsibility removed successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove responsibility.',
    })
  }
}