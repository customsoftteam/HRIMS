import { Router } from 'express'
import {
  addLeaveAllocation,
  addLeaveRequest,
  addLeaveType,
  addPublicHolidayController,
  cancelOwnLeaveRequestController,
  decideLeaveRequestController,
  getAllocationEmployees,
  getLeaveBalancesController,
  getHolidayCalendarController,
  getPublicHolidaysController,
  getLeaveRequestsController,
  getLeaveTypes,
  revokeLeaveAllocationController,
} from '../../controller/common/leave.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/types', requireAuth, getLeaveTypes)
router.post('/types', requireAuth, addLeaveType)
router.get('/employees', requireAuth, getAllocationEmployees)
router.post('/allocations', requireAuth, addLeaveAllocation)
router.post('/allocations/:balanceId/revoke', requireAuth, revokeLeaveAllocationController)
router.get('/balances', requireAuth, getLeaveBalancesController)
router.get('/requests', requireAuth, getLeaveRequestsController)
router.post('/requests', requireAuth, addLeaveRequest)
router.post('/requests/:requestId/decision', requireAuth, decideLeaveRequestController)
router.post('/requests/:requestId/cancel', requireAuth, cancelOwnLeaveRequestController)
router.get('/holidays', requireAuth, getPublicHolidaysController)
router.post('/holidays', requireAuth, addPublicHolidayController)
router.get('/calendar', requireAuth, getHolidayCalendarController)

export default router
