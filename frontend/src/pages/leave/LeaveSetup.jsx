import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import LeaveManagementTabs from '../../components/leave-management-tabs.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'

function LeaveSetupPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'
  const isAdminOrHr = role === 'admin' || role === 'hr'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [leaveTypes, setLeaveTypes] = useState([])
  const [allocationEmployees, setAllocationEmployees] = useState([])
  const [holidays, setHolidays] = useState([])

  const [newTypeForm, setNewTypeForm] = useState({ name: '', code: '' })
  const [allocationForm, setAllocationForm] = useState({
    employee_id: '',
    leave_type_id: '',
    year: new Date().getFullYear(),
    allocated_days: 0,
    adjustment_days: 0,
  })

  const [holidayForm, setHolidayForm] = useState({
    name: '',
    holiday_date: '',
    description: '',
    is_optional: false,
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

  const reload = async () => {
    await Promise.all([fetchLeaveTypes(), fetchAllocationEmployees(), fetchHolidays()])
  }

  const fetchHolidays = async () => {
    const year = new Date().getFullYear()
    const response = await fetch(`${API_BASE_URL}/api/leave/holidays?year=${year}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch holidays.')
    setHolidays(payload.data || [])
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
    if (!leaveTypes.length || allocationForm.leave_type_id) {
      return
    }

    setAllocationForm((current) => ({ ...current, leave_type_id: leaveTypes[0].id }))
  }, [leaveTypes, allocationForm.leave_type_id])

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
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleCreateHoliday = async (event) => {
    event.preventDefault()

    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/leave/holidays`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(holidayForm),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to create holiday.')

      setHolidayForm({ name: '', holiday_date: '', description: '', is_optional: false })
      setSuccessMessage('Public holiday created successfully.')
      await fetchHolidays()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  if (!isAdminOrHr) {
    return (
      <DashboardLayout role={role} title="Leave Management" subtitle="Leave setup and allocation.">
        <LeaveManagementTabs role={role} />
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">
          You do not have access to leave setup and allocation.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role} title="Leave Management" subtitle="Leave setup and allocation.">
      <div className="space-y-6">
        <LeaveManagementTabs role={role} />
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading leave setup...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
        {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

        <section className="rounded-2xl border border-black/10 bg-white p-5 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-black">Create Leave Type</h3>
            <p className="mt-1 text-sm text-black/60">Define a leave category once, then use it in yearly employee allocations.</p>
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
            <p className="mt-1 text-sm text-black/60">Set yearly leave balance for an employee and leave type.</p>
            <p className="mt-1 text-xs text-black/50">Carried-forward days are auto-calculated from previous year's remaining balance.</p>
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

          <div>
            <h3 className="text-lg font-semibold text-black">Company Holiday Overrides</h3>
            <p className="mt-1 text-sm text-black/60">India public holidays are shown automatically. Use this only for company-specific extra holidays.</p>

            <form onSubmit={handleCreateHoliday} className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Holiday Name</label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(event) => setHolidayForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Example: Company Picnic"
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Holiday Date</label>
                <input
                  type="date"
                  value={holidayForm.holiday_date}
                  onChange={(event) => setHolidayForm((current) => ({ ...current, holiday_date: event.target.value }))}
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Add Override</button>
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Description (Optional)</label>
                <input
                  type="text"
                  value={holidayForm.description}
                  onChange={(event) => setHolidayForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Example: Internal company off-site"
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 self-end text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={holidayForm.is_optional}
                  onChange={(event) => setHolidayForm((current) => ({ ...current, is_optional: event.target.checked }))}
                />
                Optional company holiday
              </label>
            </form>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Description</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {holidays.length ? holidays.map((holiday) => (
                    <tr key={holiday.id}>
                      <td className="px-3 py-2">{holiday.holiday_date}</td>
                      <td className="px-3 py-2">{holiday.name}</td>
                      <td className="px-3 py-2">{holiday.description || '-'}</td>
                      <td className="px-3 py-2">{holiday.source === 'manual' ? (holiday.is_optional ? 'Optional override' : 'Company override') : 'Auto public holiday'}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="px-3 py-3 text-black/50">No holidays created yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default LeaveSetupPage
