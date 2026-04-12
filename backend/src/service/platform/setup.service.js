import { randomUUID } from 'crypto'
import { findEmployeeByEmail } from '../../model/admin/user.model.js'
import {
  createCompanyAdminRecord,
  createCompanyRecord,
  findCompanyByName,
} from '../../model/platform/setup.model.js'
import { hashPassword } from '../../utils/password.js'
import { sanitizeEmployee } from '../../utils/user.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const requireSetupKey = (setupKey) => {
  const expectedSetupKey = process.env.PLATFORM_SETUP_KEY

  if (!expectedSetupKey) {
    throw createHttpError('PLATFORM_SETUP_KEY is not configured on server.', 503)
  }

  if (!setupKey || setupKey !== expectedSetupKey) {
    throw createHttpError('Invalid setup key.', 403)
  }
}

export const createCompanyWithAdmin = async (payload) => {
  const {
    setup_key,
    company_name,
    company_code = null,
    admin_first_name,
    admin_last_name = null,
    admin_email,
    admin_password,
    admin_phone = null,
  } = payload

  requireSetupKey(setup_key)

  if (!company_name || !admin_first_name || !admin_email || !admin_password) {
    throw createHttpError(
      'company_name, admin_first_name, admin_email, and admin_password are required.',
      400
    )
  }

  const normalizedCompanyName = company_name.trim()
  const normalizedAdminEmail = admin_email.trim().toLowerCase()

  const { data: existingCompany, error: existingCompanyError } = await findCompanyByName(normalizedCompanyName)

  if (existingCompanyError) {
    throw createHttpError(existingCompanyError.message, 500)
  }

  if (existingCompany) {
    throw createHttpError('Company already exists.', 409)
  }

  const { data: existingAdmin, error: existingAdminError } = await findEmployeeByEmail(normalizedAdminEmail)

  if (existingAdminError) {
    throw createHttpError(existingAdminError.message, 500)
  }

  if (existingAdmin) {
    throw createHttpError('A user with this admin email already exists.', 409)
  }

  const { data: company, error: companyError } = await createCompanyRecord({
    name: normalizedCompanyName,
    code: company_code?.trim() || null,
  })

  if (companyError) {
    throw createHttpError(companyError.message, 500)
  }

  const password_hash = await hashPassword(admin_password)

  const { data: admin, error: adminError } = await createCompanyAdminRecord({
    employee_code: `ADM-${randomUUID().slice(0, 8).toUpperCase()}`,
    role: 'admin',
    status: 'active',
    first_name: admin_first_name.trim(),
    last_name: admin_last_name?.trim() || null,
    email: normalizedAdminEmail,
    phone: admin_phone?.trim() || null,
    password_hash,
    company_id: company.id,
  })

  if (adminError) {
    throw createHttpError(adminError.message, 500)
  }

  return {
    company,
    admin: sanitizeEmployee(admin),
  }
}
