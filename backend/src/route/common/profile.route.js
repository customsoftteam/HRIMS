import { Router } from 'express'
import multer from 'multer'
import {
	createMyProfile,
	deleteMyProfile,
	getMyProfile,
	uploadProfileAvatar,
	updateMyProfile,
} from '../../controller/common/profile.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
})

router.get('/me', requireAuth, getMyProfile)
router.post('/me', requireAuth, createMyProfile)
router.put('/me', requireAuth, updateMyProfile)
router.delete('/me', requireAuth, deleteMyProfile)
router.post('/me/avatar', requireAuth, upload.single('avatar'), uploadProfileAvatar)

export default router
