import { findEmployeeById, getActiveDepartmentAssignmentsByEmployeeIds, getActiveLocationAssignmentsForEmployee, getDepartmentMetadataByIds, getLocationMetadataByIds } from '../model/admin/user.model.js'
import {
  createDesignationRecord,
  createResponsibilityRecord,
  deleteDesignationRecord,
  deleteResponsibilityRecord,
  findDesignationByCompanyLocationAndDepartmentAndName,
  findDesignationById,
  findLocationById,
  findLocationDepartmentByCompanyLocationAndDepartment,
  findResponsibilityById,
  listDepartmentsByCompanyAndLocation,
  listDesignationsByCompany,
  listLocationsByCompany,
  listResponsibilitiesByCompany,
  updateDesignationRecord,
  updateResponsibilityRecord,
} from '../model/admin/org.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getActorContext = async ({ actorId }) => {
  const { data: actor, error: actorError } = await findEmployeeById(actorId)

  if (actorError) {
    throw createHttpError(actorError.message, 500)
  }

  if (!actor || !actor.company_id) {
    throw createHttpError('Authenticated user company not found.', 401)
  }

  const [locationResult, departmentResult] = await Promise.all([
    getActiveLocationAssignmentsForEmployee(actorId),
    getActiveDepartmentAssignmentsByEmployeeIds([actorId]),
  ])

  if (locationResult.error) {
    throw createHttpError(locationResult.error.message, 500)
  }

  if (departmentResult.error) {
    throw createHttpError(departmentResult.error.message, 500)
  }

  return {
    actor,
    locationScope: (locationResult.data || []).map((row) => row.plant_office_id),
    departmentScope: (departmentResult.data || []).map((row) => row.department_id),
  }
}

const hasDesignationScopeAccess = ({ actor, locationScope, departmentScope }, designation) => {
  if (!designation) {
    return false
  }

  if (actor.role === 'admin') {
    return true
  }

  const locationMatches = !designation.plant_office_id || locationScope.includes(designation.plant_office_id)
  const departmentMatches = !designation.department_id || departmentScope.includes(designation.department_id)

  if (actor.role === 'hr') {
    return locationMatches
  }

  if (actor.role === 'manager') {
    return locationMatches && departmentMatches
  }

  return false
}

const normalizeDesignation = (row) => ({
  id: row.id,
  company_id: row.company_id,
  plant_office_id: row.plant_office_id,
  department_id: row.department_id,
  name: row.name,
  code: row.code,
  description: row.description,
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
  location: row.location
    ? {
        id: row.location.id,
        name: row.location.name,
        code: row.location.code,
        location: row.location.location,
      }
    : null,
  department: row.department
    ? {
        id: row.department.id,
        name: row.department.name,
        code: row.department.code,
        description: row.department.description,
      }
    : null,
})

const normalizeResponsibility = (row) => ({
  id: row.id,
  company_id: row.company_id,
  designation_id: row.designation_id,
  title: row.title,
  description: row.description,
  is_active: row.is_active,
  created_by_employee_id: row.created_by_employee_id,
  created_by_role: row.created_by_role,
  created_at: row.created_at,
  updated_at: row.updated_at,
  designation: row.designation ? normalizeDesignation(row.designation) : null,
})

const enrichDesignations = async (designations) => {
  const locationIds = [...new Set(designations.map((row) => row.plant_office_id).filter(Boolean))]
  const departmentIds = [...new Set(designations.map((row) => row.department_id).filter(Boolean))]

  const [locationResult, departmentResult] = await Promise.all([
    getLocationMetadataByIds(locationIds),
    getDepartmentMetadataByIds(departmentIds),
  ])

  if (locationResult.error) {
    throw createHttpError(locationResult.error.message, 500)
  }

  if (departmentResult.error) {
    throw createHttpError(departmentResult.error.message, 500)
  }

  const locationMap = new Map((locationResult.data || []).map((row) => [row.id, row]))
  const departmentMap = new Map((departmentResult.data || []).map((row) => [row.id, row]))

  return designations.map((row) => ({
    ...row,
    location: row.plant_office_id ? locationMap.get(row.plant_office_id) || null : null,
    department: row.department_id ? departmentMap.get(row.department_id) || null : null,
  }))
}

const enrichResponsibilities = async (responsibilities) => {
  const designationIds = [...new Set(responsibilities.map((row) => row.designation_id).filter(Boolean))]

  if (!designationIds.length) {
    return responsibilities.map((row) => ({ ...row, designation: null }))
  }

  const { data, error } = await listDesignationsByCompany(responsibilities[0]?.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const designationMap = new Map((await enrichDesignations((data || []).filter((row) => designationIds.includes(row.id)))).map((row) => [row.id, row]))

  return responsibilities.map((row) => ({
    ...row,
    designation: designationMap.get(row.designation_id) || null,
  }))
}

export const getCatalogLocations = async ({ actorId }) => {
  const { actor, locationScope } = await getActorContext({ actorId })
  const { data, error } = await listLocationsByCompany(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (actor.role === 'admin') {
    return data || []
  }

  return (data || []).filter((row) => locationScope.includes(row.id))
}

export const getCatalogDepartments = async ({ actorId, plantOfficeId }) => {
  const { actor } = await getActorContext({ actorId })
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

export const getCatalogDesignations = async ({ actorId, plantOfficeId, departmentId }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })
  const { data, error } = await listDesignationsByCompany(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const enriched = await enrichDesignations(data || [])

  return enriched
    .map(normalizeDesignation)
    .filter((designation) => {
      if (!designation.is_active) {
        return false
      }

      if (!hasDesignationScopeAccess({ actor, locationScope, departmentScope }, designation)) {
        return false
      }

      const locationMatches = !plantOfficeId || !designation.plant_office_id || designation.plant_office_id === plantOfficeId
      const departmentMatches = !departmentId || !designation.department_id || designation.department_id === departmentId

      return locationMatches && departmentMatches
    })
}

export const createCatalogDesignation = async ({ actorId, payload }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })

  if (!payload?.name?.trim()) {
    throw createHttpError('Designation name is required.', 400)
  }

  if (!payload?.plant_office_id || !payload?.department_id) {
    throw createHttpError('Location and department are required.', 400)
  }

  const { data: location, error: locationError } = await findLocationById(payload.plant_office_id)

  if (locationError) {
    throw createHttpError(locationError.message, 500)
  }

  if (!location || location.company_id !== actor.company_id) {
    throw createHttpError('Invalid location for this company.', 403)
  }

  const { data: mapping, error: mappingError } = await findLocationDepartmentByCompanyLocationAndDepartment({
    companyId: actor.company_id,
    plantOfficeId: payload.plant_office_id,
    departmentId: payload.department_id,
  })

  if (mappingError) {
    throw createHttpError(mappingError.message, 500)
  }

  if (!mapping || !mapping.is_active) {
    throw createHttpError('Selected department is not mapped to this location.', 400)
  }

  if (actor.role === 'hr' && !locationScope.includes(payload.plant_office_id)) {
    throw createHttpError('HR can only create designations in assigned locations.', 403)
  }

  if (actor.role === 'manager') {
    if (!locationScope.includes(payload.plant_office_id)) {
      throw createHttpError('Manager can only create designations in assigned locations.', 403)
    }

    if (!departmentScope.includes(payload.department_id)) {
      throw createHttpError('Manager can only create designations in assigned departments.', 403)
    }
  }

  const normalizedName = payload.name.trim()
  const { data: existingDesignation, error: existingDesignationError } = await findDesignationByCompanyLocationAndDepartmentAndName({
    companyId: actor.company_id,
    plantOfficeId: payload.plant_office_id,
    departmentId: payload.department_id,
    name: normalizedName,
  })

  if (existingDesignationError) {
    throw createHttpError(existingDesignationError.message, 500)
  }

  if (existingDesignation) {
    throw createHttpError('This designation already exists for the selected location and department.', 409)
  }

  const { data, error } = await createDesignationRecord({
    company_id: actor.company_id,
    plant_office_id: payload.plant_office_id,
    department_id: payload.department_id,
    name: normalizedName,
    code: payload.code?.trim() || null,
    description: payload.description?.trim() || null,
    is_active: true,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const { data: createdDesignation, error: createdDesignationError } = await findDesignationById(data.id)

  if (createdDesignationError) {
    throw createHttpError(createdDesignationError.message, 500)
  }

  const [enrichedDesignation] = await enrichDesignations([createdDesignation])
  return normalizeDesignation(enrichedDesignation)
}

export const updateCatalogDesignation = async ({ actorId, designationId, payload }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })
  const { data: designation, error: designationError } = await findDesignationById(designationId)

  if (designationError) {
    throw createHttpError(designationError.message, 500)
  }

  if (!designation || designation.company_id !== actor.company_id) {
    throw createHttpError('Designation not found.', 404)
  }

  const nextPlantOfficeId = payload.plant_office_id ?? designation.plant_office_id
  const nextDepartmentId = payload.department_id ?? designation.department_id

  if (actor.role === 'hr' && nextPlantOfficeId && !locationScope.includes(nextPlantOfficeId)) {
    throw createHttpError('HR can only update designations in assigned locations.', 403)
  }

  if (actor.role === 'manager') {
    if (nextPlantOfficeId && !locationScope.includes(nextPlantOfficeId)) {
      throw createHttpError('Manager can only update designations in assigned locations.', 403)
    }

    if (nextDepartmentId && !departmentScope.includes(nextDepartmentId)) {
      throw createHttpError('Manager can only update designations in assigned departments.', 403)
    }
  }

  if (nextPlantOfficeId && nextDepartmentId) {
    const { data: mapping, error: mappingError } = await findLocationDepartmentByCompanyLocationAndDepartment({
      companyId: actor.company_id,
      plantOfficeId: nextPlantOfficeId,
      departmentId: nextDepartmentId,
    })

    if (mappingError) {
      throw createHttpError(mappingError.message, 500)
    }

    if (!mapping || !mapping.is_active) {
      throw createHttpError('Selected department is not mapped to this location.', 400)
    }
  }

  const updatePayload = {
    name: payload.name?.trim() || designation.name,
    code: payload.code === undefined ? designation.code : payload.code.trim() || null,
    description: payload.description === undefined ? designation.description : payload.description.trim() || null,
    plant_office_id: payload.plant_office_id === undefined ? designation.plant_office_id : payload.plant_office_id,
    department_id: payload.department_id === undefined ? designation.department_id : payload.department_id,
    is_active: payload.is_active ?? designation.is_active,
  }

  const { data, error } = await updateDesignationRecord(designationId, updatePayload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const { data: updatedDesignation, error: updatedDesignationError } = await findDesignationById(data.id)

  if (updatedDesignationError) {
    throw createHttpError(updatedDesignationError.message, 500)
  }

  const [enrichedDesignation] = await enrichDesignations([updatedDesignation])
  return normalizeDesignation(enrichedDesignation)
}

export const deleteCatalogDesignation = async ({ actorId, designationId }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })
  const { data: designation, error: designationError } = await findDesignationById(designationId)

  if (designationError) {
    throw createHttpError(designationError.message, 500)
  }

  if (!designation || designation.company_id !== actor.company_id) {
    throw createHttpError('Designation not found.', 404)
  }

  if (actor.role === 'hr' && designation.plant_office_id && !locationScope.includes(designation.plant_office_id)) {
    throw createHttpError('HR can only delete designations in assigned locations.', 403)
  }

  if (actor.role === 'manager') {
    if (designation.plant_office_id && !locationScope.includes(designation.plant_office_id)) {
      throw createHttpError('Manager can only delete designations in assigned locations.', 403)
    }

    if (designation.department_id && !departmentScope.includes(designation.department_id)) {
      throw createHttpError('Manager can only delete designations in assigned departments.', 403)
    }
  }

  const { data, error } = await deleteDesignationRecord(designationId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const getCatalogResponsibilities = async ({ actorId, designationId }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })
  const { data, error } = await listResponsibilitiesByCompany(actor.company_id)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const responsibilities = data || []
  const designations = await enrichDesignations(
    (
      await listDesignationsByCompany(actor.company_id)
    ).data || []
  )
  const designationMap = new Map(designations.map((row) => [row.id, row]))

  return responsibilities
    .map((row) => ({
      ...row,
      designation: designationMap.get(row.designation_id) || null,
    }))
    .map(normalizeResponsibility)
    .filter((responsibility) => {
      if (!responsibility.is_active || !responsibility.designation || !responsibility.designation.is_active) {
        return false
      }

      if (designationId && responsibility.designation_id !== designationId) {
        return false
      }

      return hasDesignationScopeAccess({ actor, locationScope, departmentScope }, responsibility.designation)
    })
}

export const createCatalogResponsibility = async ({ actorId, payload }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })

  if (!payload?.designation_id) {
    throw createHttpError('Designation is required.', 400)
  }

  if (!payload?.title?.trim()) {
    throw createHttpError('Responsibility title is required.', 400)
  }

  const { data: designation, error: designationError } = await findDesignationById(payload.designation_id)

  if (designationError) {
    throw createHttpError(designationError.message, 500)
  }

  if (!designation || designation.company_id !== actor.company_id || !designation.is_active) {
    throw createHttpError('Designation not found.', 404)
  }

  if (!hasDesignationScopeAccess({ actor, locationScope, departmentScope }, designation)) {
    throw createHttpError('You cannot manage responsibilities for this designation.', 403)
  }

  const { data: existingResponsibility, error: existingResponsibilityError } = await listResponsibilitiesByCompany(actor.company_id)

  if (existingResponsibilityError) {
    throw createHttpError(existingResponsibilityError.message, 500)
  }

  const duplicate = (existingResponsibility || []).some((row) => row.designation_id === payload.designation_id && row.title?.trim().toLowerCase() === payload.title.trim().toLowerCase() && row.is_active)

  if (duplicate) {
    throw createHttpError('This responsibility already exists for the selected designation.', 409)
  }

  const { data, error } = await createResponsibilityRecord({
    company_id: actor.company_id,
    designation_id: payload.designation_id,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    is_active: true,
    created_by_employee_id: actorId,
    created_by_role: actor.role,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const { data: createdResponsibility, error: createdResponsibilityError } = await findResponsibilityById(data.id)

  if (createdResponsibilityError) {
    throw createHttpError(createdResponsibilityError.message, 500)
  }

  const responsibilityList = [createdResponsibility]
  const designations = await enrichDesignations(
    (
      await listDesignationsByCompany(actor.company_id)
    ).data || []
  )
  const designationMap = new Map(designations.map((row) => [row.id, row]))
  return normalizeResponsibility({ ...createdResponsibility, designation: designationMap.get(createdResponsibility.designation_id) || null })
}

export const updateCatalogResponsibility = async ({ actorId, responsibilityId, payload }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })
  const { data: responsibility, error: responsibilityError } = await findResponsibilityById(responsibilityId)

  if (responsibilityError) {
    throw createHttpError(responsibilityError.message, 500)
  }

  if (!responsibility || responsibility.company_id !== actor.company_id) {
    throw createHttpError('Responsibility not found.', 404)
  }

  const nextDesignationId = payload.designation_id || responsibility.designation_id
  const { data: designation, error: designationError } = await findDesignationById(nextDesignationId)

  if (designationError) {
    throw createHttpError(designationError.message, 500)
  }

  if (!designation || designation.company_id !== actor.company_id || !designation.is_active) {
    throw createHttpError('Designation not found.', 404)
  }

  if (!hasDesignationScopeAccess({ actor, locationScope, departmentScope }, designation)) {
    throw createHttpError('You cannot manage responsibilities for this designation.', 403)
  }

  const updatePayload = {
    title: payload.title?.trim() || responsibility.title,
    description: payload.description === undefined ? responsibility.description : payload.description.trim() || null,
    designation_id: nextDesignationId,
    is_active: payload.is_active ?? responsibility.is_active,
  }

  const { data, error } = await updateResponsibilityRecord(responsibilityId, updatePayload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const { data: updatedResponsibility, error: updatedResponsibilityError } = await findResponsibilityById(data.id)

  if (updatedResponsibilityError) {
    throw createHttpError(updatedResponsibilityError.message, 500)
  }

  const designations = await enrichDesignations(
    (
      await listDesignationsByCompany(actor.company_id)
    ).data || []
  )
  const designationMap = new Map(designations.map((row) => [row.id, row]))
  return normalizeResponsibility({ ...updatedResponsibility, designation: designationMap.get(updatedResponsibility.designation_id) || null })
}

export const deleteCatalogResponsibility = async ({ actorId, responsibilityId }) => {
  const { actor, locationScope, departmentScope } = await getActorContext({ actorId })
  const { data: responsibility, error: responsibilityError } = await findResponsibilityById(responsibilityId)

  if (responsibilityError) {
    throw createHttpError(responsibilityError.message, 500)
  }

  if (!responsibility || responsibility.company_id !== actor.company_id) {
    throw createHttpError('Responsibility not found.', 404)
  }

  const designations = await enrichDesignations(
    (
      await listDesignationsByCompany(actor.company_id)
    ).data || []
  )
  const designationMap = new Map(designations.map((row) => [row.id, row]))
  const responsibilityWithDesignation = {
    ...responsibility,
    designation: designationMap.get(responsibility.designation_id) || null,
  }

  if (!hasDesignationScopeAccess({ actor, locationScope, departmentScope }, responsibilityWithDesignation.designation)) {
    throw createHttpError('You cannot manage responsibilities for this designation.', 403)
  }

  const { data, error } = await deleteResponsibilityRecord(responsibilityId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}