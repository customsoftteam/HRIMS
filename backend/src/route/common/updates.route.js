import { Router } from 'express'
import { getUpdatesController, publishUpdateController } from '../../controller/common/updates.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, getUpdatesController)
router.post('/', requireAuth, publishUpdateController)

export default router
