import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

function EmployeeProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const response = await fetch(`${API_BASE_URL}/api/employee/projects`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch projects.')
        }

        setProjects(payload?.data || [])
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load projects.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const summary = useMemo(() => {
    return {
      total: projects.length,
      direct: projects.filter((project) => project.direct_membership).length,
      teamAssignments: projects.reduce((count, project) => count + (project.team_memberships?.length || 0), 0),
    }
  }, [projects])

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return projects
    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.code,
        project.description,
        project.manager?.first_name,
        project.manager?.last_name,
        project.team_memberships?.map((item) => item.team_name).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [projects, searchTerm])

  return (
    <DashboardLayout role="employee" title="My Projects" subtitle="Projects and teams you are currently part of.">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">Project overview</p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">See your project memberships and team assignments in one place.</h2>
              <p className="text-sm leading-6 text-zinc-600">
                This view shows the projects you are linked to directly or through a team assignment.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects or teams"
                className="field-input w-full"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Projects" value={summary.total} tone="neutral" />
            <MetricCard label="Direct Memberships" value={summary.direct} tone="positive" />
            <MetricCard label="Team Links" value={summary.teamAssignments} tone="accent" />
          </div>
        </section>

        {loading ? <EmptyState text="Loading projects..." /> : null}

        {!loading && errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {!loading && !errorMessage && !filteredProjects.length ? <EmptyState text="No project assignments found yet." /> : null}

        {!loading && !errorMessage && filteredProjects.length ? (
          <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="border-b border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{project.code || 'No code'}</p>
                      <h3 className="text-lg font-semibold text-zinc-950">{project.name}</h3>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">{project.status || 'unknown'}</span>
                  </div>
                  {project.description ? <p className="mt-3 text-sm leading-6 text-zinc-600">{project.description}</p> : null}
                </div>

                <div className="space-y-3 px-5 py-4">
                  <InfoLine label="Manager" value={project.manager ? `${project.manager.first_name || ''} ${project.manager.last_name || ''}`.trim() : 'Unassigned'} />
                  <InfoLine label="Direct role" value={project.direct_membership?.member_role || 'Not directly assigned'} />
                  <InfoLine
                    label="Team assignments"
                    value={project.team_memberships?.length ? `${project.team_memberships.length} team link(s)` : 'No team link'}
                  />

                  {project.team_memberships?.length ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">Teams</p>
                      <ul className="mt-2 space-y-1 text-sm text-blue-950">
                        {project.team_memberships.map((teamMembership) => (
                          <li key={teamMembership.team_id} className="flex items-center justify-between gap-3">
                            <span>{teamMembership.team_name}</span>
                            <span className="text-xs text-blue-700">{teamMembership.team_role || 'Member'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClasses = {
    neutral: 'bg-zinc-50 text-zinc-950 border-zinc-200',
    positive: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    accent: 'bg-blue-50 text-blue-950 border-blue-200',
  }

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses[tone] || toneClasses.neutral}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900 text-right">{value}</span>
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">{text}</div>
}

function ErrorBanner({ message }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>
}

export default EmployeeProjectsPage
