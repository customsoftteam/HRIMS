import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  plant_office_id: '',
  department_name: '',
  department_code: '',
  department_description: '',
  is_active: true,
}

function DepartmentsPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [locations, setLocations] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const authHeaders = {
    Authorization: `Bearer ${getAuthToken()}`,
  }

  const fetchLocations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/locations`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch locations.')
    }

    setLocations(payload.data || [])
  }

  const fetchDepartments = async (locationId) => {
    const query = locationId ? `?plant_office_id=${locationId}` : ''
    const response = await fetch(`${API_BASE_URL}/api/admin/departments${query}`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch departments.')
    }

    setRows(payload.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        await fetchLocations()
        await fetchDepartments('')
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    fetchDepartments(locationFilter).catch((error) => setErrorMessage(error.message))
  }, [locationFilter])

  const handleChange = (field) => (event) => {
    const value = field === 'is_active' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const isEdit = Boolean(editingId)
      const response = await fetch(
        isEdit ? `${API_BASE_URL}/api/admin/departments/${editingId}` : `${API_BASE_URL}/api/admin/departments`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to save department.')
      }

      setSuccessMessage(isEdit ? 'Department updated successfully.' : 'Department created successfully.')
      resetForm()
      await fetchDepartments(locationFilter)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (row) => {
    setEditingId(row.id)
    setForm({
      plant_office_id: row.plant_office_id || '',
      department_name: row.department_name || '',
      department_code: row.department_code || '',
      department_description: row.department_description || '',
      is_active: Boolean(row.is_active),
    })
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this department from the location?')) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to remove department.')
      }

      if (editingId === id) {
        resetForm()
      }

      setSuccessMessage('Department removed successfully.')
      await fetchDepartments(locationFilter)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const filteredRows = useMemo(() => {
    if (!locationFilter) {
      return rows
    }
    return rows.filter((row) => row.plant_office_id === locationFilter)
  }, [rows, locationFilter])

  const locationNameMap = new Map(locations.map((row) => [row.id, row.name]))

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Organization: Departments">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">Organization</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">Departments</h2>
          <p className="mt-2 text-sm text-black/60">Create, edit, and disable departments for a location.</p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
            <div>
              <h3 className="text-lg font-semibold text-black">{editingId ? 'Edit Department' : 'Add Department to Location'}</h3>
              <p className="mt-1 text-sm text-black/60">Map the department to one location and keep the metadata consistent.</p>
            </div>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <select value={form.plant_office_id} onChange={handleChange('plant_office_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <input value={form.department_name} onChange={handleChange('department_name')} placeholder="Department name" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.department_code} onChange={handleChange('department_code')} placeholder="Department code" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <textarea value={form.department_description} onChange={handleChange('department_description')} placeholder="Description" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-black/45">Status</label>
                <label className="flex h-[42px] items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm text-black/70">
                  <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} />
                  Active
                </label>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                  {saving ? 'Saving...' : editingId ? 'Update Department' : 'Add Department'}
                </button>
                {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-black/15 px-4 py-2 text-sm">Cancel</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-black">Department Mapping</h3>
              <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="w-full max-w-xs rounded-xl border border-black/10 bg-[#f8f8fa] px-3 py-2 text-sm">
                <option value="">All locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-4 text-black/50">Loading...</td></tr>
                  ) : filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">{locationNameMap.get(row.plant_office_id) || '-'}</td>
                        <td className="px-4 py-3">{row.department_name || '-'}</td>
                        <td className="px-4 py-3">{row.department_code || '-'}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-black/5 px-2 py-1 text-xs capitalize text-black/70">{row.is_active ? 'active' : 'inactive'}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleEdit(row)} className="rounded-lg border border-black/15 px-3 py-1 text-xs">Edit</button>
                            <button type="button" onClick={() => handleDelete(row.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-700">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-4 text-black/50">No departments mapped.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
        {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
      </div>
    </DashboardLayout>
  )
}

export default DepartmentsPage
