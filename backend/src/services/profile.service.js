import {
  createProfileRecord,
  deleteProfileRecordByEmployeeId,
  findEmployeeById,
  findProfileByEmployeeId,
  updateProfileRecordByEmployeeId,
} from '../model/common/profile.model.js'
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const SECTION_KEYS = ['personal_details', 'family_details', 'academic_details', 'professional_details', 'health_details']

const REQUIRED_FIELDS = {
  personal_details: ['date_of_birth', 'gender', 'mobile_number', 'address_line_1', 'city', 'country'],
  family_details: ['father_name', 'mother_name', 'marital_status'],
  academic_details: ['highest_qualification', 'institution_name', 'year_of_passing'],
  professional_details: ['employee_type', 'joining_date', 'total_experience_years'],
  health_details: ['blood_group', 'allergies', 'emergency_contact_name', 'emergency_contact_phone'],
}

const ensurePlainObject = (value, sectionName) => {
  if (value === undefined || value === null) {
    return {}
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw createHttpError(`${sectionName} must be an object.`, 400)
  }

  return value
}

const uploadBufferToCloudinary = async ({ buffer, employeeId }) => {
  if (!isCloudinaryConfigured()) {
    throw createHttpError('Cloudinary is not configured on server.', 500)
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'hrims/profile_pictures',
        public_id: `employee_${employeeId}_${Date.now()}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(createHttpError(error.message || 'Failed to upload avatar image.', 500))
          return
        }
        resolve(result)
      }
    )

    stream.end(buffer)
  })
}

const buildProfileResponse = ({ employee, profile }) => {
  const sectionStatus = {}
  let completedSections = 0

  SECTION_KEYS.forEach((section) => {
    const values = profile?.[section] || {}
    const required = REQUIRED_FIELDS[section]
    const isFilled = required.every((key) => {
      const value = values[key]
      if (typeof value === 'number') return true
      return Boolean(String(value || '').trim())
    })

    sectionStatus[section] = isFilled
    if (isFilled) {
      completedSections += 1
    }
  })

  const missingSections = SECTION_KEYS.filter((section) => !sectionStatus[section])
  const completionPercent = Math.round((completedSections / SECTION_KEYS.length) * 100)

  return {
    employee: {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      company_id: employee.company_id,
    },
    profile: profile
      ? {
          id: profile.id,
          employee_id: profile.employee_id,
          company_id: profile.company_id,
          personal_details: profile.personal_details || {},
          family_details: profile.family_details || {},
          academic_details: profile.academic_details || {},
          professional_details: profile.professional_details || {},
          health_details: profile.health_details || {},
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }
      : null,
    completion: {
      section_status: sectionStatus,
      missing_sections: missingSections,
      percent: completionPercent,
      is_complete: missingSections.length === 0,
    },
  }
}

const getActorAndProfile = async (actorId) => {
  const [{ data: employee, error: employeeError }, { data: profile, error: profileError }] = await Promise.all([
    findEmployeeById(actorId),
    findProfileByEmployeeId(actorId),
  ])

  if (employeeError) {
    throw createHttpError(employeeError.message, 500)
  }

  if (!employee) {
    throw createHttpError('Authenticated user not found.', 401)
  }

  if (profileError) {
    throw createHttpError(profileError.message, 500)
  }

  return { employee, profile }
}

export const getMyProfileDetails = async ({ actorId }) => {
  const { employee, profile } = await getActorAndProfile(actorId)
  return buildProfileResponse({ employee, profile })
}

export const createMyProfileDetails = async ({ actorId, payload }) => {
  const { employee, profile: existingProfile } = await getActorAndProfile(actorId)

  if (existingProfile) {
    throw createHttpError('Profile already exists. Use update instead.', 409)
  }

  const personalDetails = ensurePlainObject(payload.personal_details, 'personal_details')
  const familyDetails = ensurePlainObject(payload.family_details, 'family_details')
  const academicDetails = ensurePlainObject(payload.academic_details, 'academic_details')
  const professionalDetails = ensurePlainObject(payload.professional_details, 'professional_details')
  const healthDetails = ensurePlainObject(payload.health_details, 'health_details')

  const { data, error } = await createProfileRecord({
    employee_id: actorId,
    company_id: employee.company_id || null,
    personal_details: personalDetails,
    family_details: familyDetails,
    academic_details: academicDetails,
    professional_details: professionalDetails,
    health_details: healthDetails,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return buildProfileResponse({ employee, profile: data })
}

export const updateMyProfileDetails = async ({ actorId, payload }) => {
  const { employee, profile: existingProfile } = await getActorAndProfile(actorId)

  if (!existingProfile) {
    throw createHttpError('Profile not found. Create profile first.', 404)
  }

  const personalDetails = ensurePlainObject(payload.personal_details, 'personal_details')
  const familyDetails = ensurePlainObject(payload.family_details, 'family_details')
  const academicDetails = ensurePlainObject(payload.academic_details, 'academic_details')
  const professionalDetails = ensurePlainObject(payload.professional_details, 'professional_details')
  const healthDetails = ensurePlainObject(payload.health_details, 'health_details')

  const { data, error } = await updateProfileRecordByEmployeeId(actorId, {
    personal_details: personalDetails,
    family_details: familyDetails,
    academic_details: academicDetails,
    professional_details: professionalDetails,
    health_details: healthDetails,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return buildProfileResponse({ employee, profile: data })
}

export const deleteMyProfileDetails = async ({ actorId }) => {
  const { data, error } = await deleteProfileRecordByEmployeeId(actorId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!data) {
    throw createHttpError('Profile not found.', 404)
  }

  return {
    employee_id: actorId,
  }
}

export const uploadMyProfileAvatar = async ({ actorId, file }) => {
  if (!file) {
    throw createHttpError('Profile picture file is required.', 400)
  }

  if (!file.mimetype?.startsWith('image/')) {
    throw createHttpError('Only image files are allowed for profile picture.', 400)
  }

  if (file.size > 5 * 1024 * 1024) {
    throw createHttpError('Profile picture must be up to 5MB.', 400)
  }

  const { employee, profile: existingProfile } = await getActorAndProfile(actorId)
  const uploaded = await uploadBufferToCloudinary({
    buffer: file.buffer,
    employeeId: actorId,
  })

  const avatarUrl = uploaded?.secure_url || uploaded?.url

  if (!avatarUrl) {
    throw createHttpError('Failed to get uploaded profile picture URL.', 500)
  }

  let profileRecord = existingProfile

  if (!profileRecord) {
    const { data: createdProfile, error: createError } = await createProfileRecord({
      employee_id: actorId,
      company_id: employee.company_id || null,
      personal_details: {
        profile_picture_url: avatarUrl,
      },
      family_details: {},
      academic_details: {},
      professional_details: {},
      health_details: {},
    })

    if (createError) {
      throw createHttpError(createError.message, 500)
    }

    profileRecord = createdProfile
  } else {
    const nextPersonalDetails = {
      ...(existingProfile.personal_details || {}),
      profile_picture_url: avatarUrl,
    }

    const { data: updatedProfile, error: updateError } = await updateProfileRecordByEmployeeId(actorId, {
      personal_details: nextPersonalDetails,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      throw createHttpError(updateError.message, 500)
    }

    profileRecord = {
      ...profileRecord,
      ...updatedProfile,
      family_details: updatedProfile.family_details ?? profileRecord.family_details,
      academic_details: updatedProfile.academic_details ?? profileRecord.academic_details,
      professional_details: updatedProfile.professional_details ?? profileRecord.professional_details,
      health_details: updatedProfile.health_details ?? profileRecord.health_details,
    }
  }

  return {
    avatar_url: avatarUrl,
    profile: buildProfileResponse({
      employee,
      profile: profileRecord,
    }),
  }
}