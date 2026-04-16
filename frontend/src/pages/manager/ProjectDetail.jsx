import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { Button } from '../../components/ui/button.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const ProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [teams, setTeams] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false)
  const [showAddProjectMemberForm, setShowAddProjectMemberForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [projectMemberForm, setProjectMemberForm] = useState({
    employee_id: '',
    member_role: '',
  })

  useEffect(() => {
    fetchProjectDetail()
    fetchTeams()
    fetchProjectMembers()
    fetchEmployees()
  }, [projectId])

  const fetchProjectDetail = async () => {
    try {
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      setProject(data.data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching project:', err)
    }
  }

  const fetchTeams = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}/teams`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }

      const data = await response.json()
      setTeams(data.data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching teams:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectMembers = async () => {
    try {
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}/members`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project members')
      }

      const data = await response.json()
      setProjectMembers(data.data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching project members:', err)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/employees`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }

      const data = await response.json()
      setEmployees(data.data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}/teams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create team')
      }

      const data = await response.json()
      setTeams([data.data, ...teams])
      setFormData({
        name: '',
        description: '',
      })
      setShowCreateTeamForm(false)
    } catch (err) {
      setError(err.message)
      console.error('Error creating team:', err)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete team')
      }

      setTeams(teams.filter((t) => t.id !== teamId))
    } catch (err) {
      setError(err.message)
      console.error('Error deleting team:', err)
    }
  }

  const handleAddProjectMember = async (e) => {
    e.preventDefault()

    if (!projectMemberForm.employee_id) {
      setError('Please select an employee to add to project')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectMemberForm),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to add project member')
      }

      setProjectMemberForm({ employee_id: '', member_role: '' })
      setShowAddProjectMemberForm(false)
      await fetchProjectMembers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveProjectMember = async (memberId) => {
    if (!window.confirm('Remove this member from project?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/project-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to remove project member')
      }

      await fetchProjectMembers()
    } catch (err) {
      setError(err.message)
    }
  }

  const getAvailableProjectMembers = () => {
    const assignedIds = new Set(projectMembers.map((m) => m.employee_id))
    return employees.filter((e) => !assignedIds.has(e.id))
  }

  if (!project && !loading) {
    return (
      <DashboardLayout role="manager" title="Project Details" subtitle="Manage project teams.">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Project not found</div>
          <Button onClick={() => navigate('/manager/projects')}>
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="manager" title="Project Details" subtitle="Manage project teams.">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button className="text-sm text-black/60 underline-offset-4 hover:underline" onClick={() => navigate('/manager/projects')}>
                ← Projects
              </button>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">{project?.name || 'Loading...'}</h1>
              {project?.code ? <p className="mt-1 text-sm text-black/60">{project.code}</p> : null}
            </div>
            <Button onClick={() => setShowCreateTeamForm(!showCreateTeamForm)}>
              {showCreateTeamForm ? 'Close Form' : '+ New Team'}
            </Button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {project ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div className="rounded-lg bg-zinc-100 px-3 py-2">Status: {project.status}</div>
              <div className="rounded-lg bg-zinc-100 px-3 py-2">
                Start: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'NA'}
              </div>
              <div className="rounded-lg bg-zinc-100 px-3 py-2">
                End: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'NA'}
              </div>
            </div>
            {project.description ? <p className="mt-4 text-sm text-black/70">{project.description}</p> : null}
          </section>
        ) : null}

        {showCreateTeamForm ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="mt-4 grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-black/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Team</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateTeamForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">Project Members ({projectMembers.length})</h2>
              <p className="text-sm text-black/60">Add people here before assigning them into teams.</p>
            </div>
            <Button onClick={() => setShowAddProjectMemberForm(!showAddProjectMemberForm)}>
              {showAddProjectMemberForm ? 'Close Form' : '+ Add Project Member'}
            </Button>
          </div>

          {showAddProjectMemberForm ? (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-black">Add Member To Project</h3>
              <form onSubmit={handleAddProjectMember} className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Employee</label>
                  <select
                    required
                    value={projectMemberForm.employee_id}
                    onChange={(e) => setProjectMemberForm({ ...projectMemberForm, employee_id: e.target.value })}
                    className="h-10 w-full rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-black/40"
                  >
                    <option value="">Select employee</option>
                    {getAvailableProjectMembers().map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code || 'NA'})
                        {` - ${emp.assignment?.department?.metadata?.name || 'No Department'} / ${emp.designation?.name || 'No Designation'}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Project Role</label>
                  <input
                    type="text"
                    value={projectMemberForm.member_role}
                    onChange={(e) => setProjectMemberForm({ ...projectMemberForm, member_role: e.target.value })}
                    placeholder="e.g., QA Engineer"
                    className="h-10 w-full rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-black/40"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit">Add To Project</Button>
                </div>
              </form>
            </div>
          ) : null}

          {projectMembers.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {projectMembers.map((member) => (
                <article key={member.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-black">
                      {member.employee?.first_name} {member.employee?.last_name}
                    </h3>
                    <p className="text-xs text-black/60">{member.employee?.employee_code || 'NA'}</p>
                    <p className="text-sm text-black/70">{member.employee?.email}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-700">Department: {member.employee?.department?.name || 'NA'}</div>
                    <div className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-700">Designation: {member.employee?.designation?.name || 'NA'}</div>
                  </div>

                  {member.member_role ? <p className="mt-3 text-sm font-medium text-black">Project Role: {member.member_role}</p> : null}

                  <div className="mt-4">
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveProjectMember(member.id)}>
                      Remove
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center text-sm text-black/60">
              <p>No project members added yet.</p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-black">Teams ({teams.length})</h2>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center text-sm text-black/60">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center text-sm text-black/60">
              <p>No teams yet. Create your first team to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <article key={team.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-black">{team.name}</h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-black/70">{team.member_count || 0} members</span>
                  </div>

                  {team.description ? <p className="mt-3 text-sm text-black/70">{team.description}</p> : null}

                  {team.creator ? (
                    <p className="mt-3 text-xs text-black/60">
                      Created by:
                      {' '}
                          {team.creator.first_name} {team.creator.last_name}
                    </p>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => navigate(`/manager/teams/${team.id}`)}>
                      Manage Members
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteTeam(team.id)}>
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default ProjectDetail
