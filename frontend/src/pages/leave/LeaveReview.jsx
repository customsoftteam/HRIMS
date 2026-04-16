import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import LeaveManagementTabs from '../../components/leave-management-tabs.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'

const STATUS_BADGES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  revoked: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function LeaveReviewPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'
  const isManager = role === 'manager'
  const isAdminOrHr = role === 'admin' || role === 'hr'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [balances, setBalances] = useState([])
  const [approvalRequests, setApprovalRequests] = useState([])
  const [allocationEmployees, setAllocationEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const fetchBalances = async (employeeId) => {
    const query = employeeId ? `?employee_id=${employeeId}` : ''
    const response = await fetch(`${API_BASE_URL}/api/leave/balances${query}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch leave balances.')
    setBalances(payload.data || [])
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
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch employees.')

    const rows = payload.data || []
    setAllocationEmployees(rows)
    if (rows.length && !selectedEmployeeId) {
      setSelectedEmployeeId(rows[0].id)
      await fetchBalances(rows[0].id)
    }
  }

  const reload = async () => {
    await Promise.all([fetchApprovalRequests(), fetchAllocationEmployees()])
    if (isAdminOrHr) {
      await fetchBalances(selectedEmployeeId)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await reload()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!isAdminOrHr || !selectedEmployeeId) {
      return
    }

    fetchBalances(selectedEmployeeId).catch((error) => setErrorMessage(error.message))
  }, [isAdminOrHr, selectedEmployeeId])

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
        body: JSON.stringify({ decision, rejection_reason: rejectionReason }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to submit decision.')

      setSuccessMessage(`Leave request ${decision}d successfully.`)
      await Promise.all([fetchApprovalRequests(), isAdminOrHr ? fetchBalances(selectedEmployeeId) : Promise.resolve()])
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
      await fetchBalances(selectedEmployeeId)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <DashboardLayout role={role} title="Leave Management" subtitle="Balance review and approvals.">
      <div className="space-y-6">
        <LeaveManagementTabs role={role} />
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading leave review...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
        {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

        {isAdminOrHr ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">Leave Balances</h3>
                <p className="mt-1 text-sm text-black/60">Review allocations for a selected employee and revoke when needed.</p>
              </div>
              <div className="w-full md:w-96">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="">Select employee</option>
                  {allocationEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {`${employee.first_name || ''} ${employee.last_name || ''}`.trim()} ({employee.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
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
                      <td className="px-3 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${balance.is_revoked ? STATUS_BADGES.revoked : STATUS_BADGES.active}`}>
                          {balance.is_revoked ? 'Revoked' : 'Active'}
                        </span>
                      </td>
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
                    </tr>
                  )) : <tr><td colSpan={9} className="px-3 py-3 text-black/50">No leave balance records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-black/10 bg-white p-5">
            <h3 className="text-lg font-semibold text-black">Pending Approvals</h3>
            <p className="mt-1 text-sm text-black/60">Use the Requests page to apply for leave and manage your own requests.</p>
          </section>
        )}

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
      </div>
    </DashboardLayout>
  )
}

export default LeaveReviewPage
