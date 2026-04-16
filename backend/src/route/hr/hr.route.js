import { Router } from 'express'
import { getHrDashboard } from '../../controller/hr/hr.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/dashboard', requireAuth, requireRole('hr'), getHrDashboard)

export default router
