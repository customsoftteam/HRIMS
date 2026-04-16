import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { Button } from '../../components/ui/button.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'active',
}

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  completed: 'Completed',
  on_hold: 'On Hold',
}

function ProjectsList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState(EMPTY_FORM)

  const loadProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/api/manager/projects`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch projects.')
    }
    setProjects(payload?.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        await loadProjects()
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCreateProject = async (event) => {
    event.preventDefault()

    try {
      setError('')
      const response = await fetch(`${API_BASE_URL}/api/manager/projects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to create project.')
      }

      setProjects((current) => [payload.data, ...current])
      setFormData(EMPTY_FORM)
      setShowCreateForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project permanently?')) return

    try {
      setError('')
      const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to delete project.')
      }
      setProjects((current) => current.filter((project) => project.id !== projectId))
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      if (!query) return matchesStatus
      const haystack = [project.name, project.code, project.description, project.manager?.first_name, project.manager?.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesStatus && haystack.includes(query)
    })
  }, [projects, searchTerm, statusFilter])

  const summary = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((project) => project.status === 'active').length,
      completed: projects.filter((project) => project.status === 'completed').length,
      held: projects.filter((project) => project.status === 'on_hold').length,
    }
  }, [projects])

  return (
    <DashboardLayout role="manager" title="Projects" subtitle="Create and manage delivery projects from one clean board.">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">Project workspace</p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Plan work, assign teams, and keep delivery visible.</h2>
              <p className="text-sm leading-6 text-zinc-600">
                Projects are now presented as a structured board with quick actions, filters, and clear status chips.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm((value) => !value)}>
                {showCreateForm ? 'Hide Form' : '+ New Project'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Projects" value={summary.total} tone="neutral" />
            <MetricCard label="Active" value={summary.active} tone="positive" />
            <MetricCard label="Completed" value={summary.completed} tone="accent" />
            <MetricCard label="On Hold" value={summary.held} tone="warning" />
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {showCreateForm ? (
          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
            <div className="max-w-2xl space-y-2">
              <h3 className="text-lg font-semibold text-zinc-950">Create project</h3>
              <p className="text-sm text-zinc-600">Use a short code, a clear name, and a realistic date range.</p>
            </div>
            <form onSubmit={handleCreateProject} className="mt-5 grid gap-4 md:grid-cols-6">
              <Field label="Project code" className="md:col-span-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(event) => setFormData((current) => ({ ...current, code: event.target.value }))}
                  placeholder="PROJ-2026-001"
                  className="field-input"
                />
              </Field>
              <Field label="Project name" className="md:col-span-4">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Human Resource Modernization"
                  className="field-input"
                />
              </Field>
              <Field label="Description" className="md:col-span-6">
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  rows="4"
                  placeholder="Brief context about the project, scope, and expected outcome."
                  className="field-input min-h-28"
                />
              </Field>
              <Field label="Start date" className="md:col-span-2">
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(event) => setFormData((current) => ({ ...current, start_date: event.target.value }))}
                  className="field-input"
                />
              </Field>
              <Field label="End date" className="md:col-span-2">
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(event) => setFormData((current) => ({ ...current, end_date: event.target.value }))}
                  className="field-input"
                />
              </Field>
              <Field label="Status" className="md:col-span-2">
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                  className="field-input"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-6 flex flex-wrap gap-2 pt-1">
                <Button type="submit">Create Project</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950">Delivery board</h3>
              <p className="text-sm text-zinc-600">Search by project, filter by status, then open the project workspace.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects"
                className="field-input w-full sm:w-72"
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-input w-full sm:w-44">
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
              Loading projects...
            </div>
          ) : null}

          {!loading && !filteredProjects.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
              No projects matched your filters.
            </div>
          ) : null}

          {!loading && filteredProjects.length ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                  <div className="border-b border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{project.code || 'No code'}</p>
                        <h4 className="text-lg font-semibold text-zinc-950">{project.name}</h4>
                      </div>
                      <StatusPill status={project.status} />
                    </div>
                    {project.description ? <p className="mt-3 text-sm leading-6 text-zinc-600">{project.description}</p> : null}
                  </div>

                  <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                    <InfoTile label="Teams" value={project.team_count || 0} />
                    <InfoTile
                      label="Manager"
                      value={project.manager ? (
                        <div className="flex items-center gap-2">
                          {project.manager.profile_picture_url ? (
                            <img src={project.manager.profile_picture_url} alt={`${project.manager.first_name || ''} ${project.manager.last_name || ''}`.trim() || 'Manager'} className="size-7 rounded-full border border-zinc-200 object-cover" />
                          ) : (
                            <div className="flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-[10px] font-semibold text-zinc-500">
                              {`${project.manager.first_name || ''}${project.manager.last_name || ''}`.trim().slice(0, 1).toUpperCase() || 'M'}
                            </div>
                          )}
                          <span>{`${project.manager.first_name || ''} ${project.manager.last_name || ''}`.trim()}</span>
                        </div>
                      ) : (
                        'Unassigned'
                      )}
                    />
                    <InfoTile label="Start" value={project.start_date ? new Date(project.start_date).toLocaleDateString() : 'NA'} />
                    <InfoTile label="End" value={project.end_date ? new Date(project.end_date).toLocaleDateString() : 'NA'} />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4">
                    <Button size="sm" onClick={() => navigate(`/manager/projects/${project.id}`)}>
                      Open Project
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClasses = {
    neutral: 'bg-zinc-50 text-zinc-950 border-zinc-200',
    positive: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    accent: 'bg-blue-50 text-blue-950 border-blue-200',
    warning: 'bg-amber-50 text-amber-950 border-amber-200',
  }

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses[tone] || toneClasses.neutral}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const statusClasses = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses[status] || statusClasses.inactive}`}>
      {status?.replaceAll('_', ' ') || 'unknown'}
    </span>
  )
}

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

export default ProjectsList
