import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  plant_office_id: '',
  department_id: '',
}

const ROLE_LABELS = {
  admin: 'Admin',
  hr: 'HR',
  manager: 'Manager',
}

function DesignationsPage({ role = 'admin' }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [rows, setRows] = useState([])
  const [locations, setLocations] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
    }),
    []
  )

  const fetchLocations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/catalog/locations`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch locations.')
    }

    setLocations(payload.data || [])
  }

  const fetchDepartments = async (locationId) => {
    if (!locationId) {
      setDepartments([])
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/catalog/departments?plant_office_id=${locationId}`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch departments.')
    }

    setDepartments(payload.data || [])
  }

  const fetchRows = async () => {
    const response = await fetch(`${API_BASE_URL}/api/catalog/designations`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch designations.')
    }

    setRows(payload.data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        await Promise.all([fetchLocations(), fetchRows()])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    fetchDepartments(form.plant_office_id).catch((error) => setErrorMessage(error.message))
  }, [form.plant_office_id])

  const handleChange = (field) => (event) => {
    const value = event.target.value

    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'plant_office_id' ? { department_id: '' } : {}),
    }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      description: row.description || '',
      plant_office_id: row.plant_office_id || '',
      department_id: row.department_id || '',
    })
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Remove this designation?')) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/designations/${row.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to remove designation.')
      }

      setSuccessMessage('Designation removed successfully.')
      if (editingId === row.id) {
        resetForm()
      }
      await fetchRows()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!form.name.trim()) {
      setErrorMessage('Designation name is required.')
      return
    }

    if (!form.plant_office_id || !form.department_id) {
      setErrorMessage('Location and department are required.')
      return
    }

    setSaving(true)

    try {
      const isEdit = Boolean(editingId)
      const response = await fetch(
        isEdit ? `${API_BASE_URL}/api/catalog/designations/${editingId}` : `${API_BASE_URL}/api/catalog/designations`,
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
        throw new Error(payload?.message || 'Failed to save designation.')
      }

      setSuccessMessage(isEdit ? 'Designation updated successfully.' : 'Designation created successfully.')
      resetForm()
      await fetchRows()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredRows = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()

    return rows.filter((row) => {
      if (!query) {
        return true
      }

      return [row.name, row.code, row.location?.name, row.department?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [rows, searchTerm])

  return (
    <DashboardLayout role={role} title={`${ROLE_LABELS[role] || 'Catalog'} Dashboard`} subtitle="Catalog: Designations">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">Catalog</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">Designation Master</h2>
          <p className="mt-2 text-sm text-black/60">Create scoped designations by location and department, then use them in the user and responsibility flows.</p>
        </div>

        <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
          <div>
            <h3 className="text-lg font-semibold text-black">{editingId ? 'Edit Designation' : 'Create Designation'}</h3>
            <p className="mt-1 text-sm text-black/60">Designations are scoped to a location and department so the dropdowns stay relevant.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2" noValidate>
            <div className="md:col-span-2">
              <input
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Designation name"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
            <input
              value={form.code}
              onChange={handleChange('code')}
              placeholder="Designation code"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <select
              value={form.plant_office_id}
              onChange={handleChange('plant_office_id')}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select location</option>
              {locations.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <select
              value={form.department_id}
              onChange={handleChange('department_id')}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select department</option>
              {departments.map((row) => (
                <option key={row.department_id} value={row.department_id}>
                  {row.department_name}
                </option>
              ))}
            </select>
            <div className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Designation description"
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                {saving ? 'Saving...' : editingId ? 'Update Designation' : 'Create Designation'}
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="rounded-xl border border-black/15 px-4 py-2 text-sm">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-black">Designation List</h3>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search designation"
              className="w-full max-w-xs rounded-xl border border-black/10 bg-[#f8f8fa] px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
            <table className="min-w-full divide-y divide-black/10 text-sm">
              <thead className="bg-[#f8f8fa] text-left text-black/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Designation</th>
                  <th className="px-4 py-3 font-semibold">Scope</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-black/50">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-black">{row.name}</td>
                      <td className="px-4 py-3 text-black/70">
                        <div>{row.location?.name || '-'}</div>
                        <div className="text-xs text-black/45">{row.department?.name || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-black/70">{row.code || '-'}</td>
                      <td className="px-4 py-3 text-black/70">{row.description || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(row)} className="rounded-lg border border-black/15 px-3 py-1 text-xs">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(row)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-700">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-black/50">
                      No designations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
        {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
      </div>
    </DashboardLayout>
  )
}

export default DesignationsPage