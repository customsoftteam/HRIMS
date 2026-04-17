import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

const toTwo = (value) => Number(Number(value || 0).toFixed(2))

const getDaysInclusive = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return toTwo(diffDays)
}

function LeaveRequestsPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [leaveTypes, setLeaveTypes] = useState([])
  const [balances, setBalances] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [activeTab, setActiveTab] = useState('requests')

  const [applyForm, setApplyForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
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

  const fetchMyRequests = async () => {
    const response = await fetch(`${API_BASE_URL}/api/leave/requests?scope=my`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch leave requests.')
    setMyRequests(payload.data || [])
  }

  const fetchBalances = async () => {
    const response = await fetch(`${API_BASE_URL}/api/leave/balances`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch leave balances.')
    setBalances(payload.data || [])
  }

  const reload = async () => {
    await Promise.all([fetchLeaveTypes(), fetchMyRequests(), fetchBalances()])
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
    if (!leaveTypes.length || applyForm.leave_type_id) {
      return
    }

    setApplyForm((current) => ({ ...current, leave_type_id: leaveTypes[0].id }))
  }, [leaveTypes, applyForm.leave_type_id])

  const selectedYear = useMemo(() => {
    if (applyForm.start_date) {
      return Number(new Date(`${applyForm.start_date}T00:00:00.000Z`).getUTCFullYear())
    }
    return new Date().getUTCFullYear()
  }, [applyForm.start_date])

  const selectedBalance = useMemo(() => {
    return (
      balances.find(
        (row) =>
          row.leave_type_id === applyForm.leave_type_id
          && Number(row.year) === Number(selectedYear)
          && !row.is_revoked
      ) || null
    )
  }, [balances, applyForm.leave_type_id, selectedYear])

  const totalLeaveForType = useMemo(() => {
    if (!selectedBalance) {
      return 0
    }

    return toTwo(
      Number(selectedBalance.allocated_days || 0)
      + Number(selectedBalance.carried_forward_days || 0)
      + Number(selectedBalance.adjustment_days || 0)
    )
  }, [selectedBalance])

  const availableLeaveForType = useMemo(() => {
    if (!selectedBalance) {
      return 0
    }

    return toTwo(selectedBalance.remaining_days)
  }, [selectedBalance])

  const requestedLeaveDays = useMemo(() => {
    return getDaysInclusive(applyForm.start_date, applyForm.end_date)
  }, [applyForm.start_date, applyForm.end_date])

  const exceedsBalance = requestedLeaveDays > availableLeaveForType

  const balancesByType = useMemo(() => {
    return balances.reduce((accumulator, balance) => {
      const key = balance.leave_type?.id || balance.leave_type_id || 'unknown'
      const fallbackType = leaveTypes.find((type) => type.id === key) || null
      const typeName = balance.leave_type?.name || fallbackType?.name || 'Unknown Type'
      const typeCode = balance.leave_type?.code || fallbackType?.code || '-'

      if (!accumulator[key]) {
        accumulator[key] = {
          key,
          typeName,
          typeCode,
          rows: [],
        }
      }

      accumulator[key].rows.push(balance)
      return accumulator
    }, {})
  }, [balances, leaveTypes])

  const groupedBalances = useMemo(() => {
    return Object.values(balancesByType)
      .map((group) => ({
        ...group,
        rows: [...group.rows].sort((a, b) => Number(b.year) - Number(a.year)),
      }))
      .sort((a, b) => a.typeName.localeCompare(b.typeName))
  }, [balancesByType])

  const pendingRequests = useMemo(() => myRequests.filter((request) => request.status === 'pending'), [myRequests])
  const previousRequests = useMemo(() => myRequests.filter((request) => request.status !== 'pending'), [myRequests])


  const handleApplyLeave = async (event) => {
    event.preventDefault()

    if (requestedLeaveDays <= 0) {
      setErrorMessage('Please select a valid leave date range.')
      return
    }

    if (exceedsBalance) {
      setErrorMessage(`Requested days (${requestedLeaveDays}) exceed available balance (${availableLeaveForType}).`)
      return
    }

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
      await Promise.all([fetchMyRequests(), fetchBalances()])
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
      await fetchMyRequests()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <DashboardLayout role={role} title="Leave Management" subtitle="Apply for leave and track your requests.">
      <div className="space-y-6">
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading leave requests...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
        {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

        <section className="rounded-2xl border border-black/10 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'apply' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Apply Leave
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'requests' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('balances')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'balances' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Leave Balance
            </button>
          </div>
        </section>

        {activeTab === 'requests' ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5">
            <h3 className="text-lg font-semibold text-black">My Leave Requests</h3>
            <p className="mt-1 text-sm text-black/60">Track current requests and review previously approved, rejected, or cancelled leaves.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Pending</p>
                <p className="mt-2 text-xl font-semibold text-black">{pendingRequests.length}</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Approved</p>
                <p className="mt-2 text-xl font-semibold text-emerald-700">{myRequests.filter((request) => request.status === 'approved').length}</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Rejected / Cancelled</p>
                <p className="mt-2 text-xl font-semibold text-rose-700">{previousRequests.filter((request) => request.status === 'rejected' || request.status === 'cancelled').length}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-black">Approved Leaves</h4>
                <p className="mt-1 text-xs text-black/50">Leaves that were approved by HR, Manager, or Admin.</p>
                <div className="mt-3 overflow-x-auto rounded-xl border border-black/10">
                  <table className="min-w-full divide-y divide-black/10 text-sm">
                    <thead className="bg-[#f8f8fa] text-left text-black/70">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Leave Type</th>
                        <th className="px-3 py-2 font-semibold">From</th>
                        <th className="px-3 py-2 font-semibold">To</th>
                        <th className="px-3 py-2 font-semibold">Days</th>
                        <th className="px-3 py-2 font-semibold">Reason</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Approved Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {previousRequests.filter((request) => request.status === 'approved').length ? previousRequests.filter((request) => request.status === 'approved').map((request) => (
                        <tr key={request.id} className="hover:bg-emerald-50/50 transition">
                          <td className="px-3 py-2">{request.leave_type?.name || '-'}</td>
                          <td className="px-3 py-2">{formatDate(request.start_date)}</td>
                          <td className="px-3 py-2">{formatDate(request.end_date)}</td>
                          <td className="px-3 py-2">{request.total_days}</td>
                          <td className="px-3 py-2">{request.reason}</td>
                          <td className="px-3 py-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {request.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{formatDate(request.approved_at || request.updated_at)}</td>
                        </tr>
                      )) : <tr><td colSpan={7} className="px-3 py-3 text-black/50">No approved leaves yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-black">Pending Requests</h4>
                <div className="mt-3 overflow-x-auto rounded-xl border border-black/10">
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
                      {pendingRequests.length ? pendingRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-3 py-2">{request.leave_type?.name || '-'}</td>
                          <td className="px-3 py-2">{formatDate(request.start_date)}</td>
                          <td className="px-3 py-2">{formatDate(request.end_date)}</td>
                          <td className="px-3 py-2">{request.total_days}</td>
                          <td className="px-3 py-2">{request.reason}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGES[request.status] || STATUS_BADGES.pending}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => handleCancelRequest(request.id)} className="rounded-lg border border-black/15 px-2 py-1 text-xs">Cancel</button>
                          </td>
                        </tr>
                      )) : <tr><td colSpan={7} className="px-3 py-3 text-black/50">No pending leave requests.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-black">Previous Requests</h4>
                <p className="mt-1 text-xs text-black/50">Approved, rejected, and cancelled leaves remain visible here.</p>
                <div className="mt-3 overflow-x-auto rounded-xl border border-black/10">
                  <table className="min-w-full divide-y divide-black/10 text-sm">
                    <thead className="bg-[#f8f8fa] text-left text-black/70">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Leave Type</th>
                        <th className="px-3 py-2 font-semibold">From</th>
                        <th className="px-3 py-2 font-semibold">To</th>
                        <th className="px-3 py-2 font-semibold">Days</th>
                        <th className="px-3 py-2 font-semibold">Reason</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Decision Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {previousRequests.length ? previousRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-3 py-2">{request.leave_type?.name || '-'}</td>
                          <td className="px-3 py-2">{formatDate(request.start_date)}</td>
                          <td className="px-3 py-2">{formatDate(request.end_date)}</td>
                          <td className="px-3 py-2">{request.total_days}</td>
                          <td className="px-3 py-2">{request.reason}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGES[request.status] || STATUS_BADGES.pending}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{formatDate(request.approved_at || request.updated_at)}</td>
                        </tr>
                      )) : <tr><td colSpan={7} className="px-3 py-3 text-black/50">No previous leave decisions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'apply' ? (
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="text-lg font-semibold text-black">Apply For Leave</h3>
          <p className="mt-1 text-sm text-black/60">Submit a leave request using the available leave types.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Total Leave</p>
              <p className="mt-2 text-xl font-semibold text-black">{totalLeaveForType}</p>
              <p className="mt-1 text-xs text-black/50">For selected type in {selectedYear}</p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Available Leave</p>
              <p className={`mt-2 text-xl font-semibold ${availableLeaveForType > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{availableLeaveForType}</p>
              <p className="mt-1 text-xs text-black/50">Remaining days you can apply</p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Requested Days</p>
              <p className={`mt-2 text-xl font-semibold ${exceedsBalance ? 'text-rose-700' : 'text-black'}`}>{requestedLeaveDays}</p>
              <p className="mt-1 text-xs text-black/50">Based on selected date range</p>
            </article>
          </div>

          {exceedsBalance ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              You cannot apply for {requestedLeaveDays} days because available balance is {availableLeaveForType}.
            </div>
          ) : null}

          <form onSubmit={handleApplyLeave} className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Leave Type</label>
              <select
                value={applyForm.leave_type_id}
                onChange={(event) => setApplyForm((current) => ({ ...current, leave_type_id: event.target.value }))}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                required
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Start Date</label>
              <input
                type="date"
                value={applyForm.start_date}
                onChange={(event) => setApplyForm((current) => ({ ...current, start_date: event.target.value }))}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                required
              />
              <p className="text-xs text-black/45">First day you want to take leave.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">End Date</label>
              <input
                type="date"
                value={applyForm.end_date}
                onChange={(event) => setApplyForm((current) => ({ ...current, end_date: event.target.value }))}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                required
              />
              <p className="text-xs text-black/45">Last day of your leave period.</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Reason for Leave</label>
              <input
                type="text"
                value={applyForm.reason}
                onChange={(event) => setApplyForm((current) => ({ ...current, reason: event.target.value }))}
                className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                placeholder="Example: Medical appointment, family event, travel"
                required
              />
              <p className="text-xs text-black/45">Brief reason shown to your approver.</p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={exceedsBalance || requestedLeaveDays <= 0}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Leave Request
              </button>
            </div>
          </form>
        </section>
        ) : null}

        {activeTab === 'balances' ? (
          <section className="space-y-4">
            {groupedBalances.length ? groupedBalances.map((group) => (
              <article key={group.key} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-black">{group.typeName}</h3>
                    <p className="text-sm text-black/55">Code: {group.typeCode}</p>
                  </div>
                  <div className="rounded-lg border border-black/10 bg-[#fafafa] px-3 py-2 text-xs text-black/60">
                    Balance records: <span className="font-semibold text-black">{group.rows.length}</span>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-black/10 text-sm">
                    <thead className="bg-[#f8f8fa] text-left text-black/70">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Year</th>
                        <th className="px-3 py-2 font-semibold">Allocated</th>
                        <th className="px-3 py-2 font-semibold">Carried</th>
                        <th className="px-3 py-2 font-semibold">Adjustment</th>
                        <th className="px-3 py-2 font-semibold">Used</th>
                        <th className="px-3 py-2 font-semibold">Total</th>
                        <th className="px-3 py-2 font-semibold">Available</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {group.rows.map((row) => {
                        const allocated = toTwo(row.allocated_days)
                        const carried = toTwo(row.carried_forward_days)
                        const adjustment = toTwo(row.adjustment_days)
                        const used = toTwo(row.used_days)
                        const total = toTwo(allocated + carried + adjustment)
                        const available = toTwo(row.remaining_days)

                        return (
                          <tr key={row.id}>
                            <td className="px-3 py-2">{row.year}</td>
                            <td className="px-3 py-2">{allocated}</td>
                            <td className="px-3 py-2">{carried}</td>
                            <td className="px-3 py-2">{adjustment}</td>
                            <td className="px-3 py-2">{used}</td>
                            <td className="px-3 py-2">{total}</td>
                            <td className={`px-3 py-2 font-semibold ${available > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{available}</td>
                            <td className="px-3 py-2">
                              {row.is_revoked ? (
                                <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">Revoked</span>
                              ) : (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            )) : (
              <article className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/55">No leave balances available yet.</article>
            )}
          </section>
        ) : null}

      </div>
    </DashboardLayout>
  )
}

export default LeaveRequestsPage
