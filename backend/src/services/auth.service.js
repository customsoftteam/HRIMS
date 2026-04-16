import { findEmployeeByEmail } from '../model/common/auth.model.js'
import { findProfileByEmployeeId } from '../model/common/profile.model.js'
import { comparePassword } from '../utils/password.js'
import { signAuthToken } from '../utils/jwt.js'
import { sanitizeEmployee } from '../utils/user.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export const loginWithPassword = async ({ email, password }) => {
  if (!email || !password) {
    throw createHttpError('Email and password are required.', 400)
  }

  const normalizedEmail = email.trim().toLowerCase()
  const { data: employee, error } = await findEmployeeByEmail(normalizedEmail)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  if (!employee) {
    throw createHttpError('Invalid email or password.', 401)
  }

  const isPasswordValid = await comparePassword(password, employee.password_hash)

  if (!isPasswordValid) {
    throw createHttpError('Invalid email or password.', 401)
  }

  const token = signAuthToken({
    sub: employee.id,
    email: employee.email,
    role: employee.role,
    company_id: employee.company_id,
  })

  const { data: profile } = await findProfileByEmployeeId(employee.id)
  const safeEmployee = sanitizeEmployee(employee)

  return {
    token,
    user: {
      ...safeEmployee,
      profile_picture_url: profile?.personal_details?.profile_picture_url || null,
    },
  }
}
