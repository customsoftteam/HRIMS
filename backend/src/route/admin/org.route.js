import { Router } from 'express'
import {
  createAdminDepartment,
  createAdminLocation,
  deleteAdminDepartment,
  deleteAdminLocation,
  listAdminDepartments,
  listAdminLocations,
  listAdminManagersByLocation,
  updateAdminDepartment,
  updateAdminLocation,
} from '../../controller/admin/org.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/locations', requireAuth, requireRole('admin', 'hr'), listAdminLocations)
router.post('/locations', requireAuth, requireRole('admin'), createAdminLocation)
router.put('/locations/:id', requireAuth, requireRole('admin'), updateAdminLocation)
router.delete('/locations/:id', requireAuth, requireRole('admin'), deleteAdminLocation)
router.get('/departments', requireAuth, requireRole('admin', 'hr'), listAdminDepartments)
router.post('/departments', requireAuth, requireRole('admin'), createAdminDepartment)
router.put('/departments/:id', requireAuth, requireRole('admin'), updateAdminDepartment)
router.delete('/departments/:id', requireAuth, requireRole('admin'), deleteAdminDepartment)
router.get('/managers', requireAuth, requireRole('admin', 'hr'), listAdminManagersByLocation)

export default router
