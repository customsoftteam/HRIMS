import { Router } from 'express'
import multer from 'multer'
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
  updateTrainingProgramController,
  uploadTrainingModuleVideoController,
} from '../../controller/common/training.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

// Training Programs (HR/Admin only)
router.get('/programs', requireAuth, getTrainingProgramsController)
router.post('/programs', requireAuth, createTrainingProgramController)
router.patch('/programs/:programId', requireAuth, updateTrainingProgramController)
router.post('/modules/upload-video', requireAuth, upload.single('video'), uploadTrainingModuleVideoController)

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
