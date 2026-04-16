import {
  createDepartmentRecord,
  createLocationDepartmentRecord,
  createLocationRecord,
  deleteDepartmentRecord,
  deleteLocationDepartmentRecord,
  deleteLocationRecord,
  findDepartmentByCompanyAndName,
  findLocationDepartmentById,
  findLocationById,
  updateDepartmentRecord,
  updateLocationDepartmentRecord,
  updateLocationRecord,
  listDepartmentsByCompanyAndLocation,
  listLocationsByCompany,
  listManagersByCompanyAndLocation,
} from '../model/admin/org.model.js'
import { findEmployeeById } from '../model/admin/user.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getActor = async (actorId) => {
  const { data: actor, error } = await findEmployeeById(actorId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!actor || !actor.company_id) {
    throw createHttpError('Authenticated user company not found.', 401)
  }

  return actor
}

export const getLocations = async ({ actorId }) => {
  const actor = await getActor(actorId)
  const { data, error } = await listLocationsByCompany(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data || []
}

export const createLocation = async ({ actorId, payload }) => {
  const actor = await getActor(actorId)

  if (!payload?.name?.trim()) {
    throw createHttpError('Location name is required.', 400)
  }

  const { data, error } = await createLocationRecord({
    company_id: actor.company_id,
    name: payload.name.trim(),
    code: payload.code?.trim() || null,
    location: payload.location?.trim() || null,
    address: payload.address?.trim() || null,
    timezone: payload.timezone?.trim() || null,
    is_active: true,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const updateLocation = async ({ actorId, locationId, payload }) => {
  const actor = await getActor(actorId)
  const { data: location, error: locationError } = await findLocationById(locationId)

  if (locationError) {
    throw createHttpError(locationError.message, 500)
  }

  if (!location || location.company_id !== actor.company_id) {
    throw createHttpError('Location not found.', 404)
  }

  const { data, error } = await updateLocationRecord(locationId, {
    name: payload.name?.trim() || location.name,
    code: payload.code?.trim() || null,
    location: payload.location?.trim() || null,
    address: payload.address?.trim() || null,
    timezone: payload.timezone?.trim() || null,
    is_active: payload.is_active ?? location.is_active,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const deleteLocation = async ({ actorId, locationId }) => {
  const actor = await getActor(actorId)
  const { data: location, error: locationError } = await findLocationById(locationId)

  if (locationError) {
    throw createHttpError(locationError.message, 500)
  }

  if (!location || location.company_id !== actor.company_id) {
    throw createHttpError('Location not found.', 404)
  }

  const { data, error } = await deleteLocationRecord(locationId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const getDepartments = async ({ actorId, plantOfficeId }) => {
  const actor = await getActor(actorId)
  const { data, error } = await listDepartmentsByCompanyAndLocation({
    companyId: actor.company_id,
    plantOfficeId: plantOfficeId || null,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return (data || []).map((row) => ({
    id: row.id,
    company_id: row.company_id,
    plant_office_id: row.plant_office_id,
    is_active: row.is_active,
    department_id: row.department?.id || null,
    department_name: row.department?.name || null,
    department_code: row.department?.code || null,
    department_description: row.department?.description || null,
  }))
}

export const createDepartmentForLocation = async ({ actorId, payload }) => {
  const actor = await getActor(actorId)

  if (!payload?.plant_office_id || !payload?.department_name?.trim()) {
    throw createHttpError('Location and department name are required.', 400)
  }

  const { data: location, error: locationError } = await findLocationById(payload.plant_office_id)

  if (locationError) {
    throw createHttpError(locationError.message, 500)
  }

  if (!location || location.company_id !== actor.company_id) {
    throw createHttpError('Invalid location for this company.', 403)
  }

  const departmentName = payload.department_name.trim()
  const { data: existingDepartment, error: existingDepartmentError } = await findDepartmentByCompanyAndName({
    companyId: actor.company_id,
    name: departmentName,
  })

  if (existingDepartmentError) {
    throw createHttpError(existingDepartmentError.message, 500)
  }

  let department = existingDepartment

  if (!department) {
    const { data: newDepartment, error: createDepartmentError } = await createDepartmentRecord({
      company_id: actor.company_id,
      name: departmentName,
      code: payload.department_code?.trim() || null,
      description: payload.department_description?.trim() || null,
      is_active: true,
    })

    if (createDepartmentError) {
      throw createHttpError(createDepartmentError.message, 500)
    }

    department = newDepartment
  }

  const { data: mapping, error: mappingError } = await createLocationDepartmentRecord({
    company_id: actor.company_id,
    plant_office_id: payload.plant_office_id,
    department_id: department.id,
    is_active: true,
  })

  if (mappingError) {
    throw createHttpError(mappingError.message, 500)
  }

  return {
    ...mapping,
    department,
  }
}

export const updateDepartmentForLocation = async ({ actorId, mappingId, payload }) => {
  const actor = await getActor(actorId)
  const { data: mapping, error: mappingError } = await findLocationDepartmentById(mappingId)

  if (mappingError) {
    throw createHttpError(mappingError.message, 500)
  }

  if (!mapping || mapping.company_id !== actor.company_id) {
    throw createHttpError('Department mapping not found.', 404)
  }

  const { data: location, error: locationError } = await findLocationById(payload.plant_office_id || mapping.plant_office_id)

  if (locationError) {
    throw createHttpError(locationError.message, 500)
  }

  if (!location || location.company_id !== actor.company_id) {
    throw createHttpError('Invalid location for this company.', 403)
  }

  const currentDepartmentName = payload.department_name?.trim() || mapping.department?.name || null
  const { data: department, error: departmentError } = await updateDepartmentRecord(mapping.department_id, {
    name: currentDepartmentName,
    code: payload.department_code?.trim() || null,
    description: payload.department_description?.trim() || null,
    is_active: payload.is_active ?? mapping.is_active,
  })

  if (departmentError) {
    throw createHttpError(departmentError.message, 500)
  }

  const { data: updatedMapping, error: updatedMappingError } = await updateLocationDepartmentRecord(mappingId, {
    plant_office_id: payload.plant_office_id || mapping.plant_office_id,
    is_active: payload.is_active ?? mapping.is_active,
  })

  if (updatedMappingError) {
    throw createHttpError(updatedMappingError.message, 500)
  }

  return {
    ...updatedMapping,
    department,
  }
}

export const deleteDepartmentForLocation = async ({ actorId, mappingId }) => {
  const actor = await getActor(actorId)
  const { data: mapping, error: mappingError } = await findLocationDepartmentById(mappingId)

  if (mappingError) {
    throw createHttpError(mappingError.message, 500)
  }

  if (!mapping || mapping.company_id !== actor.company_id) {
    throw createHttpError('Department mapping not found.', 404)
  }

  const { data, error } = await deleteLocationDepartmentRecord(mappingId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const getManagersByLocation = async ({ actorId, plantOfficeId }) => {
  const actor = await getActor(actorId)

  if (!plantOfficeId) {
    throw createHttpError('plant_office_id is required.', 400)
  }

  const { data, error } = await listManagersByCompanyAndLocation({
    companyId: actor.company_id,
    plantOfficeId,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data || []
}
