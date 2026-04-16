import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { Button } from '../../components/ui/button.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const STATUS_ORDER = ['todo', 'in_progress', 'done']
const STATUS_LABELS = {
  todo: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_BADGES = {
  todo: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const PRIORITY_BADGES = {
  low: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
}

function ManagerTasksPage() {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectMembers, setProjectMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [updatesByTaskId, setUpdatesByTaskId] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [taskSort, setTaskSort] = useState('due_asc')

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const loadProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/api/manager/tasks/projects`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch projects.')
    }

    const rows = payload?.data || []
    setProjects(rows)
  }

  const loadProjectMembers = async (projectId) => {
    if (!projectId) {
      setProjectMembers([])
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}/members`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch project members.')
    }
    setProjectMembers(payload?.data || [])
  }

  const loadTasks = async (projectId) => {
    if (!projectId) {
      setTasks([])
      return
    }

    const query = new URLSearchParams()
    if (projectId) query.set('project_id', projectId)

    const response = await fetch(`${API_BASE_URL}/api/manager/tasks${query.toString() ? `?${query.toString()}` : ''}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch tasks.')
    }
    setTasks(payload?.data || [])
  }

  const loadTaskUpdates = async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/api/manager/tasks/${taskId}/updates`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch task updates.')
    }
    setUpdatesByTaskId((current) => ({ ...current, [taskId]: payload?.data || [] }))
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await loadProjects()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setErrorMessage('')
        await Promise.all([loadProjectMembers(selectedProjectId), loadTasks(selectedProjectId)])
      } catch (error) {
        setErrorMessage(error.message)
      }
    })()
  }, [selectedProjectId])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null
  const totalTaskGroups = useMemo(() => {
    return STATUS_ORDER.reduce((accumulator, status) => {
      accumulator[status] = tasks.filter((task) => task.status === status)
      return accumulator
    }, {})
  }, [tasks])

  const visibleTasks = useMemo(() => {
    const searchValue = taskSearch.trim().toLowerCase()
    const filtered = tasks.filter((task) => {
      if (!searchValue) return true
      const assignedName = `${task.assigned_to_employee?.first_name || ''} ${task.assigned_to_employee?.last_name || ''}`.trim().toLowerCase()
      const haystack = [task.title, task.description, assignedName, task.priority]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchValue)
    })

    const priorityRank = { high: 3, medium: 2, low: 1 }
    const getDueTimestamp = (task) => (task.due_date ? new Date(task.due_date).getTime() : Number.MAX_SAFE_INTEGER)

    return [...filtered].sort((firstTask, secondTask) => {
      if (taskSort === 'due_desc') return getDueTimestamp(secondTask) - getDueTimestamp(firstTask)
      if (taskSort === 'priority_desc') return (priorityRank[secondTask.priority] || 0) - (priorityRank[firstTask.priority] || 0)
      if (taskSort === 'priority_asc') return (priorityRank[firstTask.priority] || 0) - (priorityRank[secondTask.priority] || 0)
      return getDueTimestamp(firstTask) - getDueTimestamp(secondTask)
    })
  }, [tasks, taskSearch, taskSort])

  const taskGroups = useMemo(() => {
    return STATUS_ORDER.reduce((accumulator, status) => {
      accumulator[status] = visibleTasks.filter((task) => task.status === status)
      return accumulator
    }, {})
  }, [visibleTasks])

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      todo: totalTaskGroups.todo?.length || 0,
      in_progress: totalTaskGroups.in_progress?.length || 0,
      done: totalTaskGroups.done?.length || 0,
    }
  }, [tasks, totalTaskGroups])

  const projectCounts = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        task_count: tasks.filter((task) => task.project_id === project.id).length,
        todo_count: tasks.filter((task) => task.project_id === project.id && task.status === 'todo').length,
        progress_count: tasks.filter((task) => task.project_id === project.id && task.status === 'in_progress').length,
        done_count: tasks.filter((task) => task.project_id === project.id && task.status === 'done').length,
      })),
    [projects, tasks]
  )

  return (
    <DashboardLayout role="manager" title="Project Tasks" subtitle="Select a project first, then create and track its tasks.">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">Task workspace</p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Pick a project, then build the task list under it.</h2>
              <p className="text-sm leading-6 text-zinc-600">
                Projects stay visible first. Selecting one loads its tasks, counts, updates, and member list for assignment.
              </p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
              View Only
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Tasks" value={counts.total} tone="neutral" />
            <MetricCard label="Pending" value={counts.todo} tone="neutral" />
            <MetricCard label="In Progress" value={counts.in_progress} tone="warning" />
            <MetricCard label="Done" value={counts.done} tone="positive" />
          </div>
        </section>

        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
        {loading ? <EmptyState text="Loading your projects and task board..." /> : null}

        {!loading ? <section className="space-y-4">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-950">Choose Project</h3>
              <p className="text-sm text-zinc-600">Select a project first to load tasks, members, and updates.</p>
            </div>

            <div className="mt-5 space-y-3">
              {projectCounts.map((project) => {
                const isActive = project.id === selectedProjectId
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full rounded-[1.35rem] border p-4 text-left transition ${isActive ? 'border-zinc-950 bg-zinc-950 text-white shadow-md shadow-black/10' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>{project.code || 'No code'}</p>
                        <h4 className={`mt-1 text-base font-semibold ${isActive ? 'text-white' : 'text-zinc-950'}`}>{project.name}</h4>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isActive ? 'border-white/15 bg-white/10 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                        {project.task_count} task(s)
                      </span>
                    </div>
                    <div className={`mt-4 grid gap-2 text-xs ${isActive ? 'text-white' : 'text-zinc-700'}`}>
                      <MiniStat label="Pending" value={project.todo_count} active={isActive} />
                      <MiniStat label="Progress" value={project.progress_count} active={isActive} />
                      <MiniStat label="Done" value={project.done_count} active={isActive} />
                    </div>
                  </button>
                )
              })}
              {!projectCounts.length ? <EmptyState text="No projects available yet." /> : null}
            </div>
          </div>

          {selectedProject ? (
            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-950">{selectedProject.name}</h3>
                <p className="text-sm text-zinc-600">{selectedProject.description || 'No project description available.'}</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Manager" value={selectedProject.manager ? `${selectedProject.manager.first_name || ''} ${selectedProject.manager.last_name || ''}`.trim() : 'Unassigned'} />
                <InfoTile label="Members" value={projectMembers.length} />
                <InfoTile label="Pending" value={counts.todo} />
                <InfoTile label="In Progress" value={counts.in_progress} />
              </div>
            </div>
          ) : null}

          {selectedProject ? (
            <div className="rounded-[1.75rem] border border-dashed border-zinc-300 bg-white p-5 text-sm text-zinc-500 shadow-sm shadow-black/5">
              Managers have view-only access. Employees can update status, progress, and task notes from their task page.
            </div>
          ) : (
            <EmptyState text="Select a project first to create or manage tasks." />
          )}

          {selectedProject ? <section className="space-y-4">
            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm shadow-black/5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-zinc-950">Task Board</h3>
                  <p className="text-sm text-zinc-600">Tasks are grouped by status for the selected project.</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGES[selectedProject?.status] || STATUS_BADGES.todo}`}>
                  {selectedProject?.status || 'project'}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
                <input
                  value={taskSearch}
                  onChange={(event) => setTaskSearch(event.target.value)}
                  placeholder="Search by task title, assignee, description, or priority"
                  className="field-input"
                />
                <select value={taskSort} onChange={(event) => setTaskSort(event.target.value)} className="field-input">
                  <option value="due_asc">Sort: Due date (nearest)</option>
                  <option value="due_desc">Sort: Due date (latest)</option>
                  <option value="priority_desc">Sort: Priority (high to low)</option>
                  <option value="priority_asc">Sort: Priority (low to high)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-950">{STATUS_LABELS[status]}</h3>
                      <p className="text-xs text-zinc-500">
                        {taskGroups[status]?.length || 0} shown of {totalTaskGroups[status]?.length || 0}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGES[status]}`}>{STATUS_LABELS[status]}</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {(taskGroups[status] || []).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projectName={selectedProject?.name || task.project?.name || 'Project'}
                        onRefreshUpdates={loadTaskUpdates}
                        updates={updatesByTaskId[task.id] || []}
                      />
                    ))}

                    {!taskGroups[status]?.length ? (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                        {(totalTaskGroups[status]?.length || 0) > 0 ? 'No tasks match the current search/sort filters.' : 'No tasks in this lane.'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section> : <EmptyState text="Choose a project to view task-related information." />}
        </section> : null}
      </div>
    </DashboardLayout>
  )
}

function TaskCard({
  task,
  projectName,
  onRefreshUpdates,
  updates,
}) {
  const assignedName = task.assigned_to_employee ? `${task.assigned_to_employee.first_name || ''} ${task.assigned_to_employee.last_name || ''}`.trim() : 'Unassigned'
  const managerName = task.assigned_by_employee ? `${task.assigned_by_employee.first_name || ''} ${task.assigned_by_employee.last_name || ''}`.trim() : 'NA'
  const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'
  const progressValue = Math.min(Math.max(task.progress_percent ?? 0, 0), 100)
  const statusLabel = STATUS_LABELS[task.status] || 'Pending'

  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{projectName}</p>
            <h4 className="text-base font-semibold text-zinc-950">{task.title}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGES[task.status] || STATUS_BADGES.todo}`}>{statusLabel}</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">{dueDate}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium}`}>
              {task.priority || 'medium'}
            </span>
          </div>
        </div>

        <p className="text-sm leading-6 text-zinc-600">{task.description || 'No detailed description was provided for this task.'}</p>

        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <InfoTile label="Assigned to" value={assignedName} />
          <InfoTile label="Manager" value={managerName} />
          <InfoTile label="Due" value={dueDate} />
          <InfoTile label="Progress" value={`${task.progress_percent ?? 0}%`} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>{task.status?.replace('_', ' ') || 'todo'}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-zinc-950 transition-all"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <InfoTile label="Current status" value={statusLabel} />
          <InfoTile label="Current progress" value={`${progressValue}%`} />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-950">Updates</p>
            <Button size="xs" variant="outline" type="button" onClick={() => onRefreshUpdates(task.id)}>
              Refresh
            </Button>
          </div>

          <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-3 text-xs text-zinc-500">
            Task updates can be posted by employees from the employee task page.
          </div>

          {updates.length ? (
            <div className="mt-3 space-y-3">
              {updates.map((update) => (
                <div key={update.id} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
                  <div className="border-l-2 border-zinc-200 pl-3">
                    {update.note ? <p className="leading-6 text-zinc-800">{update.note}</p> : null}
                    {update.media_url ? (
                      <a className="mt-2 inline-flex text-xs font-semibold text-blue-700 underline-offset-4 hover:underline" href={update.media_url} target="_blank" rel="noreferrer">
                        {update.media_type || 'media'}
                      </a>
                    ) : null}
                  </div>
                  {update.media_url ? (
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Attachment added</p>
                  ) : null}
                  <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                    {update.created_at ? new Date(update.created_at).toLocaleString() : 'Just now'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-sm text-zinc-500">
              No updates yet.
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClasses = {
    neutral: 'bg-zinc-50 text-zinc-950 border-zinc-200',
    positive: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    warning: 'bg-amber-50 text-amber-950 border-amber-200',
  }

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses[tone] || toneClasses.neutral}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function MiniStat({ label, value, active }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 ${active ? 'border-white/15 bg-white/10' : 'border-zinc-200 bg-white'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${active ? 'text-white/70' : 'text-zinc-500'}`}>{label}</p>
      <p className={`mt-1 text-sm font-semibold ${active ? 'text-white' : 'text-zinc-950'}`}>{value}</p>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">{text}</div>
}

export default ManagerTasksPage
