import { Router } from 'express'
import {
	createAdminUser,
	deleteAdminUser,
	getAdminUsers,
	transferAdminUser,
	updateAdminUser,
} from '../../controller/admin/user.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/users', requireAuth, requireRole('admin'), getAdminUsers)
router.post('/users', requireAuth, requireRole('admin'), createAdminUser)
router.put('/users/:id', requireAuth, requireRole('admin'), updateAdminUser)
router.put('/users/:id/transfer', requireAuth, requireRole('admin'), transferAdminUser)
router.delete('/users/:id', requireAuth, requireRole('admin'), deleteAdminUser)

export default router
