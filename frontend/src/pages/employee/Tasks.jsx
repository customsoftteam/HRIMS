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

function EmployeeTasksPage() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [taskUpdateDrafts, setTaskUpdateDrafts] = useState({})
  const [taskUpdates, setTaskUpdates] = useState({})
  const [taskSearch, setTaskSearch] = useState('')
  const [taskSort, setTaskSort] = useState('due_asc')
  const [expandedTaskId, setExpandedTaskId] = useState('')

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const loadData = async () => {
    const [projectsResponse, tasksResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/employee/projects`, { headers: authHeaders }),
      fetch(
        `${API_BASE_URL}/api/employee/tasks${statusFilter !== 'all' ? `?status=${encodeURIComponent(statusFilter)}` : ''}`,
        { headers: authHeaders }
      ),
    ])

    const projectsPayload = await projectsResponse.json()
    const tasksPayload = await tasksResponse.json()

    if (!projectsResponse.ok) {
      throw new Error(projectsPayload?.message || 'Failed to fetch projects.')
    }

    if (!tasksResponse.ok) {
      throw new Error(tasksPayload?.message || 'Failed to fetch tasks.')
    }

    const projectRows = projectsPayload?.data || []
    setProjects(projectRows)
    setTasks(tasksPayload?.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await loadData()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [statusFilter])

  const loadTaskUpdates = async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/api/employee/tasks/${taskId}/updates`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch task updates.')
    }
    setTaskUpdates((current) => ({ ...current, [taskId]: payload?.data || [] }))
  }

  const updateTask = async (taskId, patch) => {
    const response = await fetch(`${API_BASE_URL}/api/employee/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(patch),
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to update task.')
    }
    await loadData()
  }

  const addTaskUpdate = async (taskId) => {
    const draft = taskUpdateDrafts[taskId] || { note: '', media_url: '', media_type: '' }
    if (!draft.note && !draft.media_url) {
      setErrorMessage('Add a note or media URL before posting the update.')
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/employee/tasks/${taskId}/updates`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(draft),
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to add task update.')
    }

    setTaskUpdateDrafts((current) => ({ ...current, [taskId]: { note: '', media_url: '', media_type: '' } }))
    await loadTaskUpdates(taskId)
  }

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id)
      return {
        ...project,
        tasks: projectTasks,
        total: projectTasks.length,
        todo: projectTasks.filter((task) => task.status === 'todo').length,
        in_progress: projectTasks.filter((task) => task.status === 'in_progress').length,
        done: projectTasks.filter((task) => task.status === 'done').length,
      }
    })
  }, [projects, tasks])

  const selectedProject = projectCards.find((project) => project.id === selectedProjectId) || null

  const overallCounts = useMemo(() => {
    return tasks.reduce(
      (accumulator, task) => {
        accumulator.total += 1
        accumulator[task.status] = (accumulator[task.status] || 0) + 1
        return accumulator
      },
      { total: 0, todo: 0, in_progress: 0, done: 0 }
    )
  }, [tasks])

  const selectedTasks = useMemo(() => {
    if (!selectedProjectId) return []
    return tasks.filter((task) => task.project_id === selectedProjectId)
  }, [tasks, selectedProjectId])

  const totalGroupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce((accumulator, status) => {
      accumulator[status] = selectedTasks.filter((task) => task.status === status)
      return accumulator
    }, {})
  }, [selectedTasks])

  const visibleSelectedTasks = useMemo(() => {
    const searchValue = taskSearch.trim().toLowerCase()
    const filtered = selectedTasks.filter((task) => {
      if (!searchValue) return true
      const managerName = `${task.assigned_by_employee?.first_name || ''} ${task.assigned_by_employee?.last_name || ''}`.trim().toLowerCase()
      const haystack = [task.title, task.description, managerName, task.priority]
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
  }, [selectedTasks, taskSearch, taskSort])

  const groupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce((accumulator, status) => {
      accumulator[status] = visibleSelectedTasks.filter((task) => task.status === status)
      return accumulator
    }, {})
  }, [visibleSelectedTasks])

  const visibleCounts = useMemo(() => {
    return {
      total: visibleSelectedTasks.length,
      todo: groupedTasks.todo?.length || 0,
      in_progress: groupedTasks.in_progress?.length || 0,
      done: groupedTasks.done?.length || 0,
    }
  }, [visibleSelectedTasks, groupedTasks])

  return (
    <DashboardLayout role="employee" title="My Tasks" subtitle="Choose a project first, then inspect the tasks inside it.">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">Task center</p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Start with the project, then open its tasks.</h2>
              <p className="text-sm leading-6 text-zinc-600">
                The list below shows the projects you belong to. Click one to view its tasks, status split, and updates.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Task filter</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-input w-full">
                <option value="all">All tasks</option>
                <option value="todo">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tasks" value={overallCounts.total} tone="neutral" />
            <MetricCard label="Pending" value={overallCounts.todo} tone="warning" />
            <MetricCard label="In Progress" value={overallCounts.in_progress} tone="accent" />
            <MetricCard label="Done" value={overallCounts.done} tone="positive" />
          </div>
        </section>

        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}
        {loading ? <EmptyState text="Loading your projects and task board..." /> : null}

        {!loading ? <section className="space-y-4">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-950">Choose Project</h3>
              <p className="text-sm text-zinc-600">Select a project first, then view and update only its tasks.</p>
            </div>

            <div className="mt-5 space-y-3">
              {projectCards.map((project) => {
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
                        {project.total} task(s)
                      </span>
                    </div>

                    <div className={`mt-4 grid grid-cols-3 gap-2 text-xs ${isActive ? 'text-white' : 'text-zinc-700'}`}>
                      <MiniStat label="Pending" value={project.todo} active={isActive} />
                      <MiniStat label="Progress" value={project.in_progress} active={isActive} />
                      <MiniStat label="Done" value={project.done} active={isActive} />
                    </div>
                  </button>
                )
              })}
              {!projectCards.length ? <EmptyState text="No project assignments found yet." /> : null}
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
                <InfoTile label="Direct role" value={selectedProject.direct_membership?.member_role || 'Member'} />
                <InfoTile label="Team links" value={selectedProject.team_memberships?.length ? `${selectedProject.team_memberships.length}` : '0'} />
                <InfoTile label="Status" value={selectedProject.status || 'unknown'} />
              </div>
            </div>
          ) : null}

          {selectedProjectId ? (
            <>
              <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-zinc-950">Task Board</h3>
                    <p className="text-sm text-zinc-600">All tasks below belong to the selected project and are grouped by stage.</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGES[selectedProject?.status] || STATUS_BADGES.todo}`}>
                    {selectedProject?.status || 'project'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
                  <input
                    value={taskSearch}
                    onChange={(event) => setTaskSearch(event.target.value)}
                    placeholder="Search by task title, manager, description, or priority"
                    className="field-input"
                  />
                  <select value={taskSort} onChange={(event) => setTaskSort(event.target.value)} className="field-input">
                    <option value="due_asc">Sort: Due date (nearest)</option>
                    <option value="due_desc">Sort: Due date (latest)</option>
                    <option value="priority_desc">Sort: Priority (high to low)</option>
                    <option value="priority_asc">Sort: Priority (low to high)</option>
                  </select>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Visible" value={visibleCounts.total} tone="neutral" />
                  <MetricCard label="Pending" value={visibleCounts.todo} tone="warning" />
                  <MetricCard label="In Progress" value={visibleCounts.in_progress} tone="accent" />
                  <MetricCard label="Done" value={visibleCounts.done} tone="positive" />
                </div>
              </section>

            <div className="space-y-4">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm shadow-black/5">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-950">{STATUS_LABELS[status]}</h3>
                      <p className="text-xs text-zinc-500">
                        {groupedTasks[status]?.length || 0} shown of {totalGroupedTasks[status]?.length || 0}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGES[status]}`}>{STATUS_LABELS[status]}</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {(groupedTasks[status] || []).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projectName={selectedProject?.name || task.project?.name || 'Project'}
                        onRefreshUpdates={loadTaskUpdates}
                        onUpdateTask={updateTask}
                        onAddUpdate={addTaskUpdate}
                        updateDraft={taskUpdateDrafts[task.id] || { note: '', media_url: '', media_type: '' }}
                        setUpdateDraft={setTaskUpdateDrafts}
                        updates={taskUpdates[task.id] || []}
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() => setExpandedTaskId((current) => (current === task.id ? '' : task.id))}
                      />
                    ))}

                    {!groupedTasks[status]?.length ? (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                        {(totalGroupedTasks[status]?.length || 0) > 0 ? 'No tasks match the current search/sort filters.' : 'No tasks in this lane.'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <EmptyState text="Select a project first to view task-related information." />
          )}
        </section> : null}
      </div>
    </DashboardLayout>
  )
}

function TaskCard({ task, projectName, onRefreshUpdates, onUpdateTask, onAddUpdate, updateDraft, setUpdateDraft, updates, isExpanded, onToggleExpand }) {
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
          <InfoTile label="Assigned to" value={task.assigned_to_employee ? `${task.assigned_to_employee.first_name || ''} ${task.assigned_to_employee.last_name || ''}`.trim() : 'Unassigned'} />
          <InfoTile label="Manager" value={task.assigned_by_employee ? `${task.assigned_by_employee.first_name || ''} ${task.assigned_by_employee.last_name || ''}`.trim() : 'NA'} />
          <InfoTile label="Due" value={task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'} />
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
          <Field label="Status">
            <select value={task.status} onChange={(event) => onUpdateTask(task.id, { status: event.target.value })} className="field-input">
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Progress %">
            <input
              type="number"
              min="0"
              max="100"
              value={task.progress_percent ?? 0}
              onChange={(event) => onUpdateTask(task.id, { progress_percent: Number(event.target.value) })}
              className="field-input"
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Updates</p>
              <p className="text-xs text-zinc-500">{updates.length} item(s)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="xs" variant="outline" type="button" onClick={() => onRefreshUpdates(task.id)}>
                Refresh
              </Button>
              <Button size="xs" variant="outline" type="button" onClick={onToggleExpand}>
                {isExpanded ? 'Hide Panel' : 'Open Panel'}
              </Button>
            </div>
          </div>

          {isExpanded ? (
            <div className="mt-3 grid gap-2">
              <textarea
                value={updateDraft.note || ''}
                onChange={(event) =>
                  setUpdateDraft((current) => ({
                    ...current,
                    [task.id]: { ...current[task.id], note: event.target.value },
                  }))
                }
                placeholder="Add an update note..."
                className="field-input min-h-24"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={updateDraft.media_url || ''}
                  onChange={(event) =>
                    setUpdateDraft((current) => ({
                      ...current,
                      [task.id]: { ...current[task.id], media_url: event.target.value },
                    }))
                  }
                  placeholder="Media URL"
                  className="field-input"
                />
                <select
                  value={updateDraft.media_type || ''}
                  onChange={(event) =>
                    setUpdateDraft((current) => ({
                      ...current,
                      [task.id]: { ...current[task.id], media_type: event.target.value },
                    }))
                  }
                  className="field-input"
                >
                  <option value="">Type</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" type="button" onClick={() => onAddUpdate(task.id)}>
                  Post Update
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setUpdateDraft((current) => ({
                      ...current,
                      [task.id]: { note: '', media_url: '', media_type: '' },
                    }))
                  }
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-3 text-xs text-zinc-500">
              Open panel to add updates or media.
            </div>
          )}

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

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

export default EmployeeTasksPage
