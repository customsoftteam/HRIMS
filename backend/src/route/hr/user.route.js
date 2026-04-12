import { Router } from 'express'
import {
	createHrEmployee,
	deleteHrEmployee,
	getHrEmployees,
	transferHrEmployee,
	updateHrEmployee,
} from '../../controller/hr/user.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/employees', requireAuth, requireRole('hr'), getHrEmployees)
router.post('/employees', requireAuth, requireRole('hr'), createHrEmployee)
router.put('/employees/:id', requireAuth, requireRole('hr'), updateHrEmployee)
router.put('/employees/:id/transfer', requireAuth, requireRole('hr'), transferHrEmployee)
router.delete('/employees/:id', requireAuth, requireRole('hr'), deleteHrEmployee)

export default router
