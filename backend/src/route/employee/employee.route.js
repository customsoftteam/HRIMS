import { Router } from 'express'
import { getEmployeeDashboard, getEmployeeProjectsController } from '../../controller/employee/employee.controller.js'
import {
	getEmployeeTasksList,
	editEmployeeTask,
	getEmployeeTaskUpdates,
	addEmployeeTaskUpdate,
} from '../../controller/employee/tasks.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/dashboard', requireAuth, requireRole('employee'), getEmployeeDashboard)
router.get('/projects', requireAuth, requireRole('employee'), getEmployeeProjectsController)
router.get('/tasks', requireAuth, requireRole('employee'), getEmployeeTasksList)
router.put('/tasks/:taskId', requireAuth, requireRole('employee'), editEmployeeTask)
router.get('/tasks/:taskId/updates', requireAuth, requireRole('employee'), getEmployeeTaskUpdates)
router.post('/tasks/:taskId/updates', requireAuth, requireRole('employee'), addEmployeeTaskUpdate)

export default router
