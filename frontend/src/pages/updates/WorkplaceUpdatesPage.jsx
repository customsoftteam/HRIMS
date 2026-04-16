import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const SECTION_CONTENT = {
  announcements: {
    title: 'Announcements',
    subtitle: 'Important company-wide updates and policy communication.',
    badge: 'Company Broadcast',
    items: [
      {
        heading: 'Quarterly Townhall on Friday',
        body: 'All teams are invited to join the Q2 townhall at 4:00 PM in the main conference hall.',
        meta: 'Published by Admin Office',
      },
      {
        heading: 'Leave Policy Clarification Released',
        body: 'Updated leave carry-forward rules are now visible in leave setup and balance sections.',
        meta: 'Published by HR Team',
      },
    ],
  },
  noticeBoard: {
    title: 'Notice Board',
    subtitle: 'Day-to-day notices for facilities, operations, and department updates.',
    badge: 'Operational Notices',
    items: [
      {
        heading: 'Parking Area B Closed on Saturday',
        body: 'Use Parking Area A during resurfacing work scheduled from 9:00 AM to 6:00 PM.',
        meta: 'Facilities Team',
      },
      {
        heading: 'ID Card Renewal Window Open',
        body: 'Employees with expiring cards should submit renewal details by end of this month.',
        meta: 'Admin Desk',
      },
    ],
  },
  upcomingEvents: {
    title: 'Upcoming Events',
    subtitle: 'Planned cultural, team, and learning events for the next few weeks.',
    badge: 'Event Timeline',
    items: [
      {
        heading: 'Wellness Camp - 22 April',
        body: 'Basic health screening and wellness sessions will be available in Block C.',
        meta: '10:00 AM to 3:00 PM',
      },
      {
        heading: 'Tech Knowledge Sharing - 28 April',
        body: 'Cross-team session on performance best practices and frontend architecture.',
        meta: '2:00 PM in Training Room 2',
      },
    ],
  },
}

const ROLE_TITLES = {
  admin: 'Admin Dashboard',
  hr: 'HR Dashboard',
  manager: 'Manager Dashboard',
  employee: 'Employee Dashboard',
}

const SECTION_TO_CATEGORY = {
  announcements: 'announcements',
  noticeBoard: 'notice_board',
  upcomingEvents: 'upcoming_events',
}

const PUBLISH_ROLES = new Set(['admin', 'hr', 'manager'])

function WorkplaceUpdatesPage({ role = 'employee', section = 'announcements' }) {
  const config = SECTION_CONTENT[section] ?? SECTION_CONTENT.announcements
  const category = SECTION_TO_CATEGORY[section] || SECTION_TO_CATEGORY.announcements
  const canPublish = PUBLISH_ROLES.has(role)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    content: '',
    event_date: '',
    is_pinned: false,
  })

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
    }),
    []
  )

  const fetchUpdates = async () => {
    const response = await fetch(`${API_BASE_URL}/api/updates?category=${category}&limit=50`, {
      headers: authHeaders,
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch updates.')
    }

    setRows(payload.data || [])
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        await fetchUpdates()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [category])

  const handleChange = (field) => (event) => {
    const value = field === 'is_pinned' ? event.target.checked : event.target.value

    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      event_date: '',
      is_pinned: false,
    })
  }

  const handlePublish = async (event) => {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!form.title.trim() || !form.content.trim()) {
      setErrorMessage('Title and content are required.')
      return
    }

    if (category === 'upcoming_events' && !form.event_date) {
      setErrorMessage('Event date is required for upcoming events.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/updates`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          title: form.title.trim(),
          content: form.content.trim(),
          event_date: form.event_date || null,
          is_pinned: form.is_pinned,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to publish update.')
      }

      setSuccessMessage('Update published successfully.')
      resetForm()
      await fetchUpdates()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role={role} title={ROLE_TITLES[role] || 'Dashboard'} subtitle={`Updates: ${config.title}`}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">{config.badge}</p>
          <h2 className="mt-2 text-2xl font-semibold text-black">{config.title}</h2>
          <p className="mt-2 text-sm text-black/60">{config.subtitle}</p>
        </div>

        {canPublish ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm shadow-black/5">
            <h3 className="text-lg font-semibold text-black">Publish {config.title}</h3>
            <p className="mt-1 text-sm text-black/60">Only Admin, HR, and Managers can publish updates.</p>

            <form onSubmit={handlePublish} className="mt-4 grid gap-3" noValidate>
              <input
                value={form.title}
                onChange={handleChange('title')}
                placeholder="Title"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />

              <textarea
                rows={4}
                value={form.content}
                onChange={handleChange('content')}
                placeholder="Write the update details"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />

              {category === 'upcoming_events' ? (
                <input
                  type="date"
                  value={form.event_date}
                  onChange={handleChange('event_date')}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm md:max-w-xs"
                />
              ) : null}

              <label className="inline-flex items-center gap-2 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={handleChange('is_pinned')}
                  className="size-4"
                />
                Pin this update
              </label>

              {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60">Loading updates...</div>
          ) : null}

          {!loading && !rows.length ? (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-5 text-sm text-black/60">
              No {config.title.toLowerCase()} published yet.
            </div>
          ) : null}

          {!loading
            ? rows.map((item) => (
                <article key={item.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm shadow-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                    {item.is_pinned ? (
                      <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Pinned</span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-black/70">{item.content}</p>

                  <p className="mt-4 text-xs uppercase tracking-[0.12em] text-black/45">
                    {item.event_date ? `Event date: ${item.event_date}` : 'Published update'}
                  </p>
                  <p className="mt-1 text-xs text-black/45">Published on {new Date(item.created_at).toLocaleDateString()}</p>
                </article>
              ))
            : null}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default WorkplaceUpdatesPage
