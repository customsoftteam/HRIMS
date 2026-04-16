import { Router } from 'express'
import { getAdminDashboard } from '../../controller/admin/admin.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/dashboard', requireAuth, requireRole('admin'), getAdminDashboard)

export default router
