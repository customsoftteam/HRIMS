import { Router } from 'express'
import {
  assignTrainingController,
  completeTrainingController,
  createTrainingProgramController,
  getAssignableEmployeesController,
  getCompanyTrainingController,
  getEmployeeCertificatesController,
  getMyTrainingController,
  getTrainingProgramsController,
  getTrainingReportsController,
} from '../../controller/common/training.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()

// Training Programs (HR/Admin only)
router.get('/programs', requireAuth, getTrainingProgramsController)
router.post('/programs', requireAuth, createTrainingProgramController)

// Training Assignments (HR/Admin manage, employees view their own)
router.post('/assignments', requireAuth, assignTrainingController)
router.get('/assignees', requireAuth, getAssignableEmployeesController)
router.get('/my-assignments', requireAuth, getMyTrainingController)
router.post('/assignments/:assignmentId/complete', requireAuth, completeTrainingController)

// Company-level (HR/Admin only)
router.get('/company-assignments', requireAuth, getCompanyTrainingController)
router.get('/reports', requireAuth, getTrainingReportsController)

// Certificates
router.get('/certificates/:employeeId', requireAuth, getEmployeeCertificatesController)

export default router
