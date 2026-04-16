import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { Button } from '../../components/ui/button.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const TeamMembers = () => {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: '',
    role: '',
  })
  const [swapMode, setSwapMode] = useState(null)
  const [newEmployeeId, setNewEmployeeId] = useState('')

  useEffect(() => {
    fetchTeamAndMembers()
    fetchEmployees()
  }, [teamId])

  const fetchTeamAndMembers = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/manager/teams/${teamId}/members`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const data = await response.json()
      setMembers(data.data || [])

      // Extract team info from first member or fetch separately
      if (data.data && data.data.length > 0) {
        setTeam({ id: teamId, name: 'Team' }) // Placeholder, ideally fetch full team info
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching team members:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/teams/${teamId}/eligible-employees`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees(data?.data?.employees || [])
      } else {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || 'Failed to fetch eligible employees')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching employees:', err)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()

    if (!formData.employee_id) {
      setError('Please select an employee')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: formData.employee_id,
          role: formData.role || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add member')
      }

      await response.json()
      await fetchTeamAndMembers()
      await fetchEmployees()
      setFormData({
        employee_id: '',
        role: '',
      })
      setShowAddMemberForm(false)
    } catch (err) {
      setError(err.message)
      console.error('Error adding member:', err)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/team-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      setMembers(members.filter((m) => m.id !== memberId))
    } catch (err) {
      setError(err.message)
      console.error('Error removing member:', err)
    }
  }

  const handleSwapMember = async (oldMemberId, oldEmployeeId) => {
    if (!newEmployeeId) {
      setError('Please select a new employee')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/manager/teams/${teamId}/swap-member`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_employee_id: oldEmployeeId,
          new_employee_id: newEmployeeId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to swap member')
      }

      // Refresh members after swap
      await fetchTeamAndMembers()
      setSwapMode(null)
      setNewEmployeeId('')
    } catch (err) {
      setError(err.message)
      console.error('Error swapping member:', err)
    }
  }

  const getAvailableEmployees = () => {
    const memberIds = new Set(members.map((m) => m.employee_id))
    return employees.filter((e) => !memberIds.has(e.id))
  }

  const availableEmployees = getAvailableEmployees()

  return (
    <DashboardLayout role="manager" title="Team Members" subtitle="Add, remove, and swap project team members.">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button className="text-sm text-black/60 underline-offset-4 hover:underline" onClick={() => navigate(-1)}>
                ← Back to Teams
              </button>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Team Members</h1>
              <p className="mt-1 text-sm text-black/60">Manage membership with department and designation context.</p>
            </div>
            <Button onClick={() => setShowAddMemberForm(!showAddMemberForm)}>
              {showAddMemberForm ? 'Close Form' : '+ Add Member'}
            </Button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {showAddMemberForm ? (
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-black">Employee</label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none ring-0 transition focus:border-black/40"
                >
                  <option value="">Select an employee</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code || 'NA'})
                      {` - ${emp.department?.name || 'No Department'} / ${emp.designation?.name || 'No Designation'}`}
                    </option>
                  ))}
                </select>
                {!availableEmployees.length ? (
                  <p className="text-xs text-amber-700">
                    No eligible employees found. Add members to this project first, then assign them to teams.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-black">Team Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Frontend Developer"
                  className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none ring-0 transition focus:border-black/40"
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Add Member</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddMemberForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center text-sm text-black/60">
            Loading team members...
          </div>
        ) : null}

        {!loading && !members.length ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center text-sm text-black/60">
            No members in this team yet.
          </div>
        ) : null}

        {!loading && members.length ? (
          <section className="grid gap-4 md:grid-cols-2">
            {members.map((member) => (
              <article key={member.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  {member.employee?.profile_picture_url ? (
                    <img src={member.employee.profile_picture_url} alt={`${member.employee?.first_name || ''} ${member.employee?.last_name || ''}`.trim() || 'Member'} className="size-12 rounded-full border border-black/10 object-cover" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full border border-black/10 bg-[#f5f6fa] text-sm font-semibold text-black/60">
                      {`${member.employee?.first_name || ''}${member.employee?.last_name || ''}`.trim().slice(0, 1).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-black">
                      {member.employee?.first_name} {member.employee?.last_name}
                    </h3>
                    <p className="text-xs text-black/60">{member.employee?.employee_code || 'NA'}</p>
                    <p className="text-sm text-black/70">{member.employee?.email || 'NA'}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-700">Department: {member.employee?.department?.name || 'NA'}</div>
                  <div className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-700">Designation: {member.employee?.designation?.name || 'NA'}</div>
                </div>

                {member.role ? <p className="mt-3 text-sm font-medium text-black">Team Role: {member.role}</p> : null}

                {swapMode === member.id ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-black/10 bg-zinc-50 p-3">
                    <select
                      value={newEmployeeId}
                      onChange={(e) => setNewEmployeeId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black/40"
                    >
                      <option value="">Select replacement employee</option>
                      {availableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                          {` - ${emp.department?.name || 'No Department'} / ${emp.designation?.name || 'No Designation'}`}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSwapMember(member.id, member.employee_id)}>
                        Confirm Swap
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSwapMode(null)
                          setNewEmployeeId('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSwapMode(member.id)
                        setNewEmployeeId('')
                      }}
                    >
                      Swap
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveMember(member.id)}>
                      Remove
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default TeamMembers
