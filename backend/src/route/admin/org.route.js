import { Router } from 'express'
import {
  createAdminDepartment,
  createAdminLocation,
  listAdminDepartments,
  listAdminLocations,
  listAdminManagersByLocation,
} from '../../controller/admin/org.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/locations', requireAuth, requireRole('admin', 'hr'), listAdminLocations)
router.post('/locations', requireAuth, requireRole('admin'), createAdminLocation)
router.get('/departments', requireAuth, requireRole('admin', 'hr'), listAdminDepartments)
router.post('/departments', requireAuth, requireRole('admin'), createAdminDepartment)
router.get('/managers', requireAuth, requireRole('admin', 'hr'), listAdminManagersByLocation)

export default router
