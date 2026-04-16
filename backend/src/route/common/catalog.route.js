import { Router } from 'express'
import {
  createCatalogDesignationHandler,
  createCatalogResponsibilityHandler,
  deleteCatalogDesignationHandler,
  deleteCatalogResponsibilityHandler,
  listCatalogDepartments,
  listCatalogDesignations,
  listCatalogLocations,
  listCatalogResponsibilitiesHandler,
  updateCatalogDesignationHandler,
  updateCatalogResponsibilityHandler,
} from '../../controller/common/catalog.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/locations', requireAuth, requireRole('admin', 'hr', 'manager'), listCatalogLocations)
router.get('/departments', requireAuth, requireRole('admin', 'hr', 'manager'), listCatalogDepartments)
router.get('/designations', requireAuth, requireRole('admin', 'hr', 'manager'), listCatalogDesignations)
router.post('/designations', requireAuth, requireRole('admin', 'hr', 'manager'), createCatalogDesignationHandler)
router.put('/designations/:id', requireAuth, requireRole('admin', 'hr', 'manager'), updateCatalogDesignationHandler)
router.delete('/designations/:id', requireAuth, requireRole('admin', 'hr', 'manager'), deleteCatalogDesignationHandler)
router.get('/responsibilities', requireAuth, requireRole('admin', 'hr', 'manager'), listCatalogResponsibilitiesHandler)
router.post('/responsibilities', requireAuth, requireRole('admin', 'hr', 'manager'), createCatalogResponsibilityHandler)
router.put('/responsibilities/:id', requireAuth, requireRole('admin', 'hr', 'manager'), updateCatalogResponsibilityHandler)
router.delete('/responsibilities/:id', requireAuth, requireRole('admin', 'hr', 'manager'), deleteCatalogResponsibilityHandler)

export default router