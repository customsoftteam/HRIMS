import { Router } from 'express'
import { createCompanyAndAdmin } from '../../controller/platform/setup.controller.js'

const router = Router()

router.post('/company-admin', createCompanyAndAdmin)

export default router
