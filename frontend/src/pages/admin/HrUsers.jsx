import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  plant_office_id: '',
  department_id: '',
  manager_employee_id: '',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function HrUsersPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [rows, setRows] = useState([])
  const [locations, setLocations] = useState([])
  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const [transferTarget, setTransferTarget] = useState(null)
  const [transfer, setTransfer] = useState({ plant_office_id: '', department_id: '', effective_date: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [transferSaving, setTransferSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const authHeaders = { Authorization: `Bearer ${getAuthToken()}` }

  const fetchRows = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/users?role=hr`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch HR users.')
    setRows(payload.data || [])
  }

  const fetchLocations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/locations`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch locations.')
    setLocations(payload.data || [])
  }

  const fetchDepartments = async (locationId) => {
    if (!locationId) {
      setDepartments([])
      return
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/departments?plant_office_id=${locationId}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch departments.')
    setDepartments(payload.data || [])
  }

  const fetchManagers = async (locationId) => {
    if (!locationId) {
      setManagers([])
      return
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/managers?plant_office_id=${locationId}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch managers.')
    setManagers(payload.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        await Promise.all([fetchRows(), fetchLocations()])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    fetchDepartments(form.plant_office_id).catch((error) => setErrorMessage(error.message))
    fetchManagers(form.plant_office_id).catch((error) => setErrorMessage(error.message))
  }, [form.plant_office_id])

  useEffect(() => {
    fetchDepartments(transfer.plant_office_id).catch((error) => setErrorMessage(error.message))
  }, [transfer.plant_office_id])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setValidationErrors((current) => ({ ...current, [field]: '' }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setValidationErrors({})
  }

  const validateForm = () => {
    const errors = {}
    if (!form.first_name.trim()) errors.first_name = 'First name is required.'
    if (!form.last_name.trim()) errors.last_name = 'Last name is required.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (!form.plant_office_id) errors.plant_office_id = 'Location is required.'
    if (!form.department_id) errors.department_id = 'Department is required.'
    if (!editingId && !form.password) errors.password = 'Password is required for new users.'
    else if (form.password && !PASSWORD_REGEX.test(form.password)) errors.password = 'Password must be at least 8 characters and include letters and numbers.'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    if (!validateForm()) return
    setSaving(true)
    try {
      const isEdit = Boolean(editingId)
      const response = await fetch(isEdit ? `${API_BASE_URL}/api/admin/users/${editingId}` : `${API_BASE_URL}/api/admin/users`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'hr', manager_employee_id: form.manager_employee_id || null }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to save HR user.')
      setSuccessMessage(isEdit ? 'HR user updated successfully.' : 'HR user created successfully.')
      resetForm()
      await fetchRows()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (row) => {
    setEditingId(row.id)
    setForm({
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      password: '',
      plant_office_id: row.assignment?.location?.plant_office_id || '',
      department_id: row.assignment?.department?.department_id || '',
      manager_employee_id: row.manager_employee_id || '',
    })
    setValidationErrors({})
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this HR user?')) return
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { method: 'DELETE', headers: authHeaders })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to delete HR user.')
      if (editingId === id) resetForm()
      setSuccessMessage('HR user deleted successfully.')
      await fetchRows()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const openTransfer = (row) => {
    setTransferTarget(row)
    setTransfer({
      plant_office_id: row.assignment?.location?.plant_office_id || '',
      department_id: row.assignment?.department?.department_id || '',
      effective_date: '',
    })
  }

  const handleTransfer = async (event) => {
    event.preventDefault()
    if (!transferTarget) return
    setTransferSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${transferTarget.id}/transfer`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to transfer user.')
      setSuccessMessage('User transferred successfully.')
      setTransferTarget(null)
      setTransfer({ plant_office_id: '', department_id: '', effective_date: '' })
      await fetchRows()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setTransferSaving(false)
    }
  }

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return rows.filter((row) => {
      if (!q) return true
      return (`${row.first_name || ''} ${row.last_name || ''}`.toLowerCase().includes(q) || (row.email || '').toLowerCase().includes(q))
    })
  }, [rows, searchTerm])

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="People: HR">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">People</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">HR</h2>
          <p className="mt-2 text-sm text-black/60">Create HR users with location and department assignment.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
            <h3 className="text-lg font-semibold text-black">{editingId ? 'Edit HR User' : 'Create HR User'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2" noValidate>
              <div><input value={form.first_name} onChange={handleChange('first_name')} placeholder="First name" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />{validationErrors.first_name ? <p className="mt-1 text-xs text-rose-700">{validationErrors.first_name}</p> : null}</div>
              <div><input value={form.last_name} onChange={handleChange('last_name')} placeholder="Last name" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />{validationErrors.last_name ? <p className="mt-1 text-xs text-rose-700">{validationErrors.last_name}</p> : null}</div>
              <div className="md:col-span-2"><input type="email" value={form.email} onChange={handleChange('email')} placeholder="Email" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />{validationErrors.email ? <p className="mt-1 text-xs text-rose-700">{validationErrors.email}</p> : null}</div>
              <div><input value={form.phone} onChange={handleChange('phone')} placeholder="Phone" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" /></div>
              <div><input type="password" value={form.password} onChange={handleChange('password')} placeholder={editingId ? 'New password (optional)' : 'Password'} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />{validationErrors.password ? <p className="mt-1 text-xs text-rose-700">{validationErrors.password}</p> : <p className="mt-1 text-xs text-black/45">Min 8 chars with letters and numbers.</p>}</div>
              <div><select value={form.plant_office_id} onChange={handleChange('plant_office_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"><option value="">Select location</option>{locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>{validationErrors.plant_office_id ? <p className="mt-1 text-xs text-rose-700">{validationErrors.plant_office_id}</p> : null}</div>
              <div><select value={form.department_id} onChange={handleChange('department_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"><option value="">Select department</option>{departments.map((row) => <option key={row.id} value={row.department_id}>{row.department_name}</option>)}</select>{validationErrors.department_id ? <p className="mt-1 text-xs text-rose-700">{validationErrors.department_id}</p> : null}</div>
              <div className="md:col-span-2"><select value={form.manager_employee_id} onChange={handleChange('manager_employee_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"><option value="">Optional manager</option>{managers.map((row) => <option key={row.id} value={row.id}>{row.first_name} {row.last_name || ''}</option>)}</select></div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">{saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}</button>
                {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-black/15 px-4 py-2 text-sm">Cancel</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-black">HR Directory</h3>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name/email" className="w-full max-w-xs rounded-xl border border-black/10 bg-[#f8f8fa] px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? <tr><td colSpan={4} className="px-4 py-4 text-black/50">Loading...</td></tr> : filteredRows.length ? filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.first_name} {row.last_name || ''}<div className="text-xs text-black/50">{row.email}</div></td>
                      <td className="px-4 py-3">{row.assignment?.location?.metadata?.name || '-'}</td>
                      <td className="px-4 py-3">{row.assignment?.department?.metadata?.name || '-'}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(row)} className="rounded-lg border border-black/15 px-3 py-1 text-xs">Edit</button><button onClick={() => openTransfer(row)} className="rounded-lg border border-blue-200 px-3 py-1 text-xs text-blue-700">Transfer</button><button onClick={() => handleDelete(row.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-700">Delete</button></div></td>
                    </tr>
                  )) : <tr><td colSpan={4} className="px-4 py-4 text-black/50">No HR users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {transferTarget ? (
          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <h3 className="text-lg font-semibold text-black">Transfer User</h3>
            <p className="mt-1 text-sm text-black/60">{transferTarget.first_name} {transferTarget.last_name || ''}</p>
            <form onSubmit={handleTransfer} className="mt-4 grid gap-3 md:grid-cols-3">
              <select value={transfer.plant_office_id} onChange={(event) => setTransfer((current) => ({ ...current, plant_office_id: event.target.value, department_id: '' }))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"><option value="">Select location</option>{locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
              <select value={transfer.department_id} onChange={(event) => setTransfer((current) => ({ ...current, department_id: event.target.value }))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"><option value="">Select department</option>{departments.map((row) => <option key={row.id} value={row.department_id}>{row.department_name}</option>)}</select>
              <input type="date" value={transfer.effective_date} onChange={(event) => setTransfer((current) => ({ ...current, effective_date: event.target.value }))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" disabled={transferSaving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">{transferSaving ? 'Transferring...' : 'Transfer User'}</button>
                <button type="button" onClick={() => setTransferTarget(null)} className="rounded-xl border border-black/15 px-4 py-2 text-sm">Cancel</button>
              </div>
            </form>
          </section>
        ) : null}

        {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
        {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
      </div>
    </DashboardLayout>
  )
}

export default HrUsersPage
