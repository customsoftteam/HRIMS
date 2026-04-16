import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'

const formatMonthValue = (date) => {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

const getCalendarCells = (year, month) => {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const startWeekday = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const cells = []
  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

const formatDateLabel = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function HolidayCalendarPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(formatMonthValue(new Date()))
  const [calendarData, setCalendarData] = useState({ holidays: [], leaves: [], year: null, month: null })

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const fetchCalendarData = async (monthValue) => {
    const [year, month] = String(monthValue).split('-')
    const response = await fetch(`${API_BASE_URL}/api/leave/calendar?year=${Number(year)}&month=${Number(month)}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch holiday calendar.')
    setCalendarData(payload.data || { holidays: [], leaves: [], year: Number(year), month: Number(month) })
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await fetchCalendarData(calendarMonth)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [calendarMonth])

  const parsedCalendar = useMemo(() => {
    const [year, month] = String(calendarMonth).split('-')
    return {
      year: Number(year),
      month: Number(month),
    }
  }, [calendarMonth])

  const calendarCells = useMemo(() => {
    if (!parsedCalendar.year || !parsedCalendar.month) {
      return []
    }
    return getCalendarCells(parsedCalendar.year, parsedCalendar.month)
  }, [parsedCalendar])

  const holidayMap = useMemo(() => {
    const map = new Map()
    ;(calendarData.holidays || []).forEach((holiday) => {
      const key = holiday.holiday_date
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(holiday)
    })
    return map
  }, [calendarData.holidays])

  const leaveMap = useMemo(() => {
    const map = new Map()
    const monthStart = `${parsedCalendar.year}-${String(parsedCalendar.month).padStart(2, '0')}-01`
    const monthEnd = `${parsedCalendar.year}-${String(parsedCalendar.month).padStart(2, '0')}-${String(new Date(Date.UTC(parsedCalendar.year, parsedCalendar.month, 0)).getUTCDate()).padStart(2, '0')}`

    ;(calendarData.leaves || []).forEach((leave) => {
      const start = leave.start_date
      const end = leave.end_date

      if (!start || !end) {
        return
      }

      const rangeStart = start < monthStart ? monthStart : start
      const rangeEnd = end > monthEnd ? monthEnd : end

      let walker = new Date(`${rangeStart}T00:00:00.000Z`)
      const endDate = new Date(`${rangeEnd}T00:00:00.000Z`)

      while (!Number.isNaN(walker.getTime()) && !Number.isNaN(endDate.getTime()) && walker <= endDate) {
        const key = `${walker.getUTCFullYear()}-${String(walker.getUTCMonth() + 1).padStart(2, '0')}-${String(walker.getUTCDate()).padStart(2, '0')}`
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key).push(leave)
        walker = new Date(walker.getTime() + 24 * 60 * 60 * 1000)
      }
    })

    return map
  }, [calendarData.leaves, parsedCalendar])

  return (
    <DashboardLayout role={role} title="Holiday Calendar" subtitle="Public holidays and applied leaves in one monthly view.">
      <div className="space-y-6">
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading holiday calendar...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}

        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-black">Holiday Calendar</h3>
              <p className="mt-1 text-sm text-black/60">India public holidays are loaded automatically. Company overrides and your applied leaves are shown here too.</p>
            </div>
            <input
              type="month"
              value={calendarMonth}
              onChange={(event) => setCalendarMonth(event.target.value)}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">Automatic Public Holiday</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">Approved Leave</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">Pending Leave</span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">Rejected Leave</span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-black/60">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarCells.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[110px] rounded-xl border border-transparent bg-transparent" />
              }

              const dateKey = `${parsedCalendar.year}-${String(parsedCalendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const holidayEvents = holidayMap.get(dateKey) || []
              const leaveEvents = leaveMap.get(dateKey) || []

              return (
                <article key={dateKey} className="min-h-[110px] rounded-xl border border-black/10 bg-[#fafafa] p-2 text-left">
                  <p className="text-xs font-semibold text-black">{day}</p>

                  <div className="mt-1 space-y-1">
                    {holidayEvents.slice(0, 2).map((holiday) => (
                      <div key={holiday.id} className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        {holiday.name}
                      </div>
                    ))}

                    {leaveEvents.slice(0, 2).map((leave) => {
                      const leaveLabel = leave.leave_type?.code || leave.leave_type?.name || 'Leave'
                      const leaveClasses = leave.status === 'approved'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : leave.status === 'rejected'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'

                      return (
                        <div key={`${leave.id}-${dateKey}`} className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${leaveClasses}`}>
                          {leaveLabel}
                        </div>
                      )
                    })}

                    {holidayEvents.length + leaveEvents.length > 2 ? (
                      <div className="text-[10px] text-black/45">+{holidayEvents.length + leaveEvents.length - 2} more</div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="text-lg font-semibold text-black">This Month Summary</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Public Holidays</p>
              <p className="mt-2 text-xl font-semibold text-black">{(calendarData.holidays || []).length}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Applied Leaves</p>
              <p className="mt-2 text-xl font-semibold text-black">{(calendarData.leaves || []).length}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
                    <h4 className="text-sm font-semibold text-black">Public Holidays</h4>
              <div className="mt-3 space-y-2">
                {(calendarData.holidays || []).length ? (calendarData.holidays || []).map((holiday) => (
                  <div key={holiday.id} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    <p className="font-semibold">{holiday.name}</p>
                    <p className="text-xs text-blue-700">{formatDateLabel(holiday.holiday_date)} {holiday.source === 'manual' ? '• Company override' : '• Auto'}</p>
                    {holiday.description ? <p className="mt-1 text-xs text-blue-700/80">{holiday.description}</p> : null}
                  </div>
                )) : <p className="text-sm text-black/50">No public holidays for this month.</p>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-black">Applied Leaves</h4>
              <div className="mt-3 space-y-2">
                {(calendarData.leaves || []).length ? (calendarData.leaves || []).map((leave) => (
                  <div key={leave.id} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black">
                    <p className="font-semibold">{leave.leave_type?.name || 'Leave'} <span className="text-xs text-black/50">({leave.status})</span></p>
                    <p className="text-xs text-black/55">{formatDateLabel(leave.start_date)} to {formatDateLabel(leave.end_date)} • {leave.total_days} days</p>
                  </div>
                )) : <p className="text-sm text-black/50">No leave applications in this month.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default HolidayCalendarPage
