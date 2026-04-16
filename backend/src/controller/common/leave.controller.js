import {
  addPublicHoliday,
  allocateLeaveBalance,
  cancelOwnLeaveRequest,
  createLeaveRequest,
  createLeaveType,
  decideLeaveRequest,
  getLeaveBalances,
  getHolidayCalendarData,
  getPublicHolidays,
  listAllocationEmployees,
  listLeaveRequestsByScope,
  listLeaveTypes,
  revokeLeaveAllocation,
} from '../../services/leave.service.js'

export const getLeaveTypes = async (req, res) => {
  try {
    const data = await listLeaveTypes({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch leave types.' })
  }
}

export const addLeaveType = async (req, res) => {
  try {
    const data = await createLeaveType({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to create leave type.' })
  }
}

export const getAllocationEmployees = async (req, res) => {
  try {
    const data = await listAllocationEmployees({ actorId: req.user.sub })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch employees.' })
  }
}

export const addLeaveAllocation = async (req, res) => {
  try {
    const data = await allocateLeaveBalance({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to allocate leave.' })
  }
}

export const revokeLeaveAllocationController = async (req, res) => {
  try {
    const data = await revokeLeaveAllocation({
      actorId: req.user.sub,
      balanceId: req.params.balanceId,
      payload: req.body,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to revoke leave allocation.' })
  }
}

export const getLeaveBalancesController = async (req, res) => {
  try {
    const data = await getLeaveBalances({
      actorId: req.user.sub,
      employeeId: req.query.employee_id,
      year: req.query.year,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch leave balances.' })
  }
}

export const addLeaveRequest = async (req, res) => {
  try {
    const data = await createLeaveRequest({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to create leave request.' })
  }
}

export const getLeaveRequestsController = async (req, res) => {
  try {
    const data = await listLeaveRequestsByScope({
      actorId: req.user.sub,
      scope: req.query.scope,
      status: req.query.status,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch leave requests.' })
  }
}

export const decideLeaveRequestController = async (req, res) => {
  try {
    const data = await decideLeaveRequest({
      actorId: req.user.sub,
      requestId: req.params.requestId,
      payload: req.body,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to decide leave request.' })
  }
}

export const cancelOwnLeaveRequestController = async (req, res) => {
  try {
    const data = await cancelOwnLeaveRequest({
      actorId: req.user.sub,
      requestId: req.params.requestId,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to cancel leave request.' })
  }
}

export const addPublicHolidayController = async (req, res) => {
  try {
    const data = await addPublicHoliday({ actorId: req.user.sub, payload: req.body })
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to create public holiday.' })
  }
}

export const getPublicHolidaysController = async (req, res) => {
  try {
    const data = await getPublicHolidays({
      actorId: req.user.sub,
      year: req.query.year,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch public holidays.' })
  }
}

export const getHolidayCalendarController = async (req, res) => {
  try {
    const data = await getHolidayCalendarData({
      actorId: req.user.sub,
      year: req.query.year,
      month: req.query.month,
    })
    return res.json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to fetch holiday calendar.' })
  }
}
