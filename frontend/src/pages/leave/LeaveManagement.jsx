import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  revoked: 'bg-rose-50 text-rose-700 border-rose-200',
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function LeaveManagementPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'
  const isManager = role === 'manager'
  const isAdminOrHr = role === 'admin' || role === 'hr'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [leaveTypes, setLeaveTypes] = useState([])
  const [balances, setBalances] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [approvalRequests, setApprovalRequests] = useState([])
  const [allocationEmployees, setAllocationEmployees] = useState([])

  const [applyForm, setApplyForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const [allocationForm, setAllocationForm] = useState({
    employee_id: '',
    leave_type_id: '',
    year: new Date().getFullYear(),
    allocated_days: 0,
    adjustment_days: 0,
  })

  const [newTypeForm, setNewTypeForm] = useState({
    name: '',
    code: '',
  })

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const fetchLeaveTypes = async () => {
    const response = await fetch(`${API_BASE_URL}/api/leave/types`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch leave types.')
    setLeaveTypes(payload.data || [])
  }

  const fetchBalances = async (targetEmployeeId) => {
    const employeeIdForQuery = targetEmployeeId || (isAdminOrHr ? allocationForm.employee_id : null)
    const query = employeeIdForQuery ? `?employee_id=${employeeIdForQuery}` : ''

    const response = await fetch(`${API_BASE_URL}/api/leave/balances${query}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch leave balances.')
    setBalances(payload.data || [])
  }

  const fetchMyRequests = async () => {
    const response = await fetch(`${API_BASE_URL}/api/leave/requests?scope=my`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch leave requests.')
    setMyRequests(payload.data || [])
  }

  const fetchApprovalRequests = async () => {
    if (!(isManager || isAdminOrHr)) {
      setApprovalRequests([])
      return
    }

    const scope = isAdminOrHr ? 'company' : 'team'
    const response = await fetch(`${API_BASE_URL}/api/leave/requests?scope=${scope}&status=pending`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch approval queue.')
    setApprovalRequests(payload.data || [])
  }

  const fetchAllocationEmployees = async () => {
    if (!isAdminOrHr) {
      setAllocationEmployees([])
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/leave/employees`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch allocation employees.')

    const rows = payload.data || []
    setAllocationEmployees(rows)
    if (rows.length && !allocationForm.employee_id) {
      setAllocationForm((current) => ({ ...current, employee_id: rows[0].id }))
    }
  }

  const reloadAll = async () => {
    await Promise.all([
      fetchLeaveTypes(),
      fetchBalances(),
      fetchMyRequests(),
      fetchApprovalRequests(),
      fetchAllocationEmployees(),
    ])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await reloadAll()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!leaveTypes.length || applyForm.leave_type_id) {
      return
    }

    setApplyForm((current) => ({ ...current, leave_type_id: leaveTypes[0].id }))
  }, [leaveTypes, applyForm.leave_type_id])

  useEffect(() => {
    if (!leaveTypes.length || allocationForm.leave_type_id) {
      return
    }

    setAllocationForm((current) => ({ ...current, leave_type_id: leaveTypes[0].id }))
  }, [leaveTypes, allocationForm.leave_type_id])

  const handleApplyLeave = async (event) => {
    event.preventDefault()

    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/requests`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(applyForm),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to submit leave request.')

      setSuccessMessage('Leave request submitted successfully.')
      setApplyForm((current) => ({ ...current, reason: '' }))
      await Promise.all([fetchMyRequests(), fetchApprovalRequests()])
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleCancelRequest = async (requestId) => {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: authHeaders,
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to cancel request.')

      setSuccessMessage('Leave request cancelled.')
      await Promise.all([fetchMyRequests(), fetchApprovalRequests()])
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleDecision = async (requestId, decision) => {
    let rejectionReason = ''

    if (decision === 'reject') {
      rejectionReason = window.prompt('Enter rejection reason:') || ''
      if (!rejectionReason.trim()) {
        return
      }
    }

    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/requests/${requestId}/decision`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          decision,
          rejection_reason: rejectionReason,
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to submit decision.')

      setSuccessMessage(`Leave request ${decision}d successfully.`)
      await Promise.all([fetchApprovalRequests(), fetchBalances(), fetchMyRequests()])
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleCreateLeaveType = async (event) => {
    event.preventDefault()

    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/types`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(newTypeForm),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to create leave type.')

      setNewTypeForm({ name: '', code: '' })
      setSuccessMessage('Leave type created successfully.')
      await fetchLeaveTypes()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleAllocateLeave = async (event) => {
    event.preventDefault()

    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/allocations`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...allocationForm,
          year: Number(allocationForm.year),
          allocated_days: Number(allocationForm.allocated_days),
          adjustment_days: Number(allocationForm.adjustment_days),
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to allocate leave.')

      setSuccessMessage('Leave allocation updated successfully.')
      await fetchBalances(allocationForm.employee_id)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleRevokeAllocation = async (balance) => {
    const reason = window.prompt('Enter revocation reason for this leave allocation:') || ''
    if (!reason.trim()) {
      return
    }

    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/allocations/${balance.id}/revoke`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to revoke leave allocation.')

      setSuccessMessage('Leave allocation revoked successfully.')
      await fetchBalances(allocationForm.employee_id)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  useEffect(() => {
    if (!isAdminOrHr || !allocationForm.employee_id) {
      return
    }

    fetchBalances(allocationForm.employee_id).catch((error) => {
      setErrorMessage(error.message)
    })
  }, [isAdminOrHr, allocationForm.employee_id])

  return (
    <DashboardLayout role={role} title="Leave Management" subtitle="Apply leave, track balances, and handle approvals.">
      <div className="space-y-6">
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading leave data...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
        {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="text-lg font-semibold text-black">Apply For Leave</h3>
          <form onSubmit={handleApplyLeave} className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              value={applyForm.leave_type_id}
              onChange={(event) => setApplyForm((current) => ({ ...current, leave_type_id: event.target.value }))}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
              required
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
              ))}
            </select>
            <input
              type="date"
              value={applyForm.start_date}
              onChange={(event) => setApplyForm((current) => ({ ...current, start_date: event.target.value }))}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
              required
            />
            <input
              type="date"
              value={applyForm.end_date}
              onChange={(event) => setApplyForm((current) => ({ ...current, end_date: event.target.value }))}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              value={applyForm.reason}
              onChange={(event) => setApplyForm((current) => ({ ...current, reason: event.target.value }))}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm md:col-span-2"
              placeholder="Reason for leave"
              required
            />
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Submit Leave Request</button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="text-lg font-semibold text-black">{isAdminOrHr ? 'Leave Balances (Selected Employee)' : 'My Leave Balances'}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-black/10 text-sm">
              <thead className="bg-[#f8f8fa] text-left text-black/70">
                <tr>
                  <th className="px-3 py-2 font-semibold">Leave Type</th>
                  <th className="px-3 py-2 font-semibold">Year</th>
                  <th className="px-3 py-2 font-semibold">Allocated</th>
                  <th className="px-3 py-2 font-semibold">Used</th>
                  <th className="px-3 py-2 font-semibold">Carry Forward</th>
                  <th className="px-3 py-2 font-semibold">Adjustments</th>
                  <th className="px-3 py-2 font-semibold">Remaining</th>
                  {isAdminOrHr ? <th className="px-3 py-2 font-semibold">Status</th> : null}
                  {isAdminOrHr ? <th className="px-3 py-2 font-semibold">Action</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {balances.length ? balances.map((balance) => (
                  <tr key={balance.id}>
                    <td className="px-3 py-2">{balance.leave_type?.name || '-'}</td>
                    <td className="px-3 py-2">{balance.year}</td>
                    <td className="px-3 py-2">{balance.allocated_days}</td>
                    <td className="px-3 py-2">{balance.used_days}</td>
                    <td className="px-3 py-2">{balance.carried_forward_days}</td>
                    <td className="px-3 py-2">{balance.adjustment_days}</td>
                    <td className="px-3 py-2 font-semibold">{balance.remaining_days}</td>
                    {isAdminOrHr ? (
                      <td className="px-3 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${balance.is_revoked ? STATUS_BADGES.revoked : STATUS_BADGES.active}`}>
                          {balance.is_revoked ? 'Revoked' : 'Active'}
                        </span>
                      </td>
                    ) : null}
                    {isAdminOrHr ? (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleRevokeAllocation(balance)}
                          disabled={balance.is_revoked}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {balance.is_revoked ? 'Revoked' : 'Revoke'}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                )) : <tr><td colSpan={isAdminOrHr ? 9 : 7} className="px-3 py-3 text-black/50">No leave balance records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="text-lg font-semibold text-black">My Leave Requests</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-black/10 text-sm">
              <thead className="bg-[#f8f8fa] text-left text-black/70">
                <tr>
                  <th className="px-3 py-2 font-semibold">Leave Type</th>
                  <th className="px-3 py-2 font-semibold">From</th>
                  <th className="px-3 py-2 font-semibold">To</th>
                  <th className="px-3 py-2 font-semibold">Days</th>
                  <th className="px-3 py-2 font-semibold">Reason</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {myRequests.length ? myRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-3 py-2">{request.leave_type?.name || '-'}</td>
                    <td className="px-3 py-2">{formatDate(request.start_date)}</td>
                    <td className="px-3 py-2">{formatDate(request.end_date)}</td>
                    <td className="px-3 py-2">{request.total_days}</td>
                    <td className="px-3 py-2">{request.reason}</td>
                    <td className="px-3 py-2"><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGES[request.status] || STATUS_BADGES.pending}`}>{request.status}</span></td>
                    <td className="px-3 py-2">
                      {request.status === 'pending' ? (
                        <button onClick={() => handleCancelRequest(request.id)} className="rounded-lg border border-black/15 px-2 py-1 text-xs">Cancel</button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={7} className="px-3 py-3 text-black/50">No leave requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {(isManager || isAdminOrHr) ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5">
            <h3 className="text-lg font-semibold text-black">Pending Approvals</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Employee</th>
                    <th className="px-3 py-2 font-semibold">Leave Type</th>
                    <th className="px-3 py-2 font-semibold">From</th>
                    <th className="px-3 py-2 font-semibold">To</th>
                    <th className="px-3 py-2 font-semibold">Days</th>
                    <th className="px-3 py-2 font-semibold">Reason</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {approvalRequests.length ? approvalRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-3 py-2">{`${request.employee?.first_name || ''} ${request.employee?.last_name || ''}`.trim() || request.employee?.email || '-'}</td>
                      <td className="px-3 py-2">{request.leave_type?.name || '-'}</td>
                      <td className="px-3 py-2">{formatDate(request.start_date)}</td>
                      <td className="px-3 py-2">{formatDate(request.end_date)}</td>
                      <td className="px-3 py-2">{request.total_days}</td>
                      <td className="px-3 py-2">{request.reason}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button onClick={() => handleDecision(request.id, 'approve')} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700">Approve</button>
                          <button onClick={() => handleDecision(request.id, 'reject')} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700">Reject</button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={7} className="px-3 py-3 text-black/50">No pending approvals.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {isAdminOrHr ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black">Create Leave Type</h3>
              <p className="mt-1 text-sm text-black/60">
                Define a leave category once, then use it in yearly employee allocations.
              </p>
              <form onSubmit={handleCreateLeaveType} className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Leave Type Name</label>
                  <input
                    type="text"
                    value={newTypeForm.name}
                    onChange={(event) => setNewTypeForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Example: Earned Leave"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    required
                  />
                  <p className="text-xs text-black/45">Human-readable category shown to employees and approvers.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Leave Code</label>
                  <input
                    type="text"
                    value={newTypeForm.code}
                    onChange={(event) => setNewTypeForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                    placeholder="Example: EL"
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    required
                  />
                  <p className="text-xs text-black/45">Short unique code used internally (per company).</p>
                </div>

                <div className="flex items-end">
                  <button type="submit" className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Create Type</button>
                </div>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black">Allocate Leave</h3>
              <p className="mt-1 text-sm text-black/60">
                Set yearly leave balance for an employee and leave type.
              </p>
              <p className="mt-1 text-xs text-black/50">
                Carried-forward days are auto-calculated from previous year's remaining balance.
              </p>
              <form onSubmit={handleAllocateLeave} className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Employee</label>
                  <select
                    value={allocationForm.employee_id}
                    onChange={(event) => setAllocationForm((current) => ({ ...current, employee_id: event.target.value }))}
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select employee to allocate leave</option>
                    {allocationEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {`${employee.first_name || ''} ${employee.last_name || ''}`.trim()} ({employee.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-black/45">Choose which employee gets this leave balance entry.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Leave Type</label>
                  <select
                    value={allocationForm.leave_type_id}
                    onChange={(event) => setAllocationForm((current) => ({ ...current, leave_type_id: event.target.value }))}
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select leave type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                    ))}
                  </select>
                  <p className="text-xs text-black/45">Type of leave this allocation applies to.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Year</label>
                  <input
                    type="number"
                    value={allocationForm.year}
                    onChange={(event) => setAllocationForm((current) => ({ ...current, year: event.target.value }))}
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    placeholder="Example: 2026"
                    min={2000}
                    max={2100}
                    required
                  />
                  <p className="text-xs text-black/45">Calendar year for this leave balance.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Allocated Days</label>
                  <input
                    type="number"
                    step="0.5"
                    value={allocationForm.allocated_days}
                    onChange={(event) => setAllocationForm((current) => ({ ...current, allocated_days: event.target.value }))}
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    placeholder="Example: 12"
                    required
                  />
                  <p className="text-xs text-black/45">Base leave granted for the year.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Adjustment Days</label>
                  <input
                    type="number"
                    step="0.5"
                    value={allocationForm.adjustment_days}
                    onChange={(event) => setAllocationForm((current) => ({ ...current, adjustment_days: event.target.value }))}
                    className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    placeholder="Example: -1 or +2"
                  />
                  <p className="text-xs text-black/45">Manual correction to add or deduct leave days.</p>
                </div>

                <div className="md:col-span-3">
                  <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Save Allocation</button>
                </div>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default LeaveManagementPage
