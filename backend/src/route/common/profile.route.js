import { Router } from 'express'
import {
	createMyProfile,
	deleteMyProfile,
	getMyProfile,
	updateMyProfile,
} from '../../controller/common/profile.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/me', requireAuth, getMyProfile)
router.post('/me', requireAuth, createMyProfile)
router.put('/me', requireAuth, updateMyProfile)
router.delete('/me', requireAuth, deleteMyProfile)

export default router
