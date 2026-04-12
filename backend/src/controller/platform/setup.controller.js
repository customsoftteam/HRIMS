import { createCompanyWithAdmin } from '../../service/platform/setup.service.js'

export const createCompanyAndAdmin = async (req, res) => {
  try {
    const data = await createCompanyWithAdmin(req.body)

    return res.status(201).json({
      success: true,
      message: 'Company and admin created successfully.',
      data,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create company and admin.',
    })
  }
}
