import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  designation_id: '',
  title: '',
  description: '',
}

const EMPTY_SCOPE = {
  plant_office_id: '',
  department_id: '',
}

const ROLE_LABELS = {
  admin: 'Admin',
  hr: 'HR',
  manager: 'Manager',
}

function ResponsibilitiesPage({ role = 'admin' }) {
  const [scope, setScope] = useState(EMPTY_SCOPE)
  const [form, setForm] = useState(EMPTY_FORM)
  const [rows, setRows] = useState([])
  const [locations, setLocations] = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

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

  const fetchDesignations = async (locationId, departmentId) => {
    const params = new URLSearchParams()
    if (locationId) params.set('plant_office_id', locationId)
    if (departmentId) params.set('department_id', departmentId)

    const response = await fetch(`${API_BASE_URL}/api/catalog/designations${params.toString() ? `?${params.toString()}` : ''}`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch designations.')
    }

    setDesignations(payload.data || [])
  }

  const fetchRows = async () => {
    const response = await fetch(`${API_BASE_URL}/api/catalog/responsibilities`, { headers: authHeaders })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch responsibilities.')
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
    fetchDepartments(scope.plant_office_id).catch((error) => setErrorMessage(error.message))
    fetchDesignations(scope.plant_office_id, scope.department_id).catch((error) => setErrorMessage(error.message))
  }, [scope.plant_office_id, scope.department_id])

  const handleScopeChange = (field) => (event) => {
    const value = event.target.value

    setScope((current) => ({
      ...current,
      [field]: value,
      ...(field === 'plant_office_id' ? { department_id: '' } : {}),
    }))
    setForm((current) => ({ ...current, designation_id: '' }))
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Remove this responsibility?')) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/responsibilities/${row.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to remove responsibility.')
      }

      setSuccessMessage('Responsibility removed successfully.')
      await fetchRows()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleEdit = (row) => {
    setForm({
      designation_id: row.designation_id,
      title: row.title,
      description: row.description || '',
    })
    setScope({
      plant_office_id: row.designation?.location?.id || '',
      department_id: row.designation?.department?.id || '',
    })
    setEditingId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!form.designation_id) {
      setErrorMessage('Designation is required.')
      return
    }

    if (!form.title.trim()) {
      setErrorMessage('Responsibility title is required.')
      return
    }

    setSaving(true)

    try {
      const url = editingId ? `${API_BASE_URL}/api/catalog/responsibilities/${editingId}` : `${API_BASE_URL}/api/catalog/responsibilities`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || `Failed to ${editingId ? 'update' : 'save'} responsibility.`)
      }

      setSuccessMessage(`Responsibility ${editingId ? 'updated' : 'created'} successfully.`)
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

      return [row.title, row.designation?.name, row.designation?.location?.name, row.designation?.department?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [rows, searchTerm])

  return (
    <DashboardLayout role={role} title={`${ROLE_LABELS[role] || 'Catalog'} Dashboard`} subtitle="Catalog: Responsibilities">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">Catalog</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">Responsibilities</h2>
          <p className="mt-2 text-sm text-black/60">Select a location and department to narrow the designation dropdown, then create the responsibility list for that role.</p>
        </div>

        <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
          <div>
            <h3 className="text-lg font-semibold text-black">{editingId ? 'Edit Responsibility' : 'Create Responsibility'}</h3>
            <p className="mt-1 text-sm text-black/60">The scope filters keep the designation dropdown relevant for admin, HR, and manager logins.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2" noValidate>
            <select value={scope.plant_office_id} onChange={handleScopeChange('plant_office_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
              <option value="">Select location</option>
              {locations.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <select value={scope.department_id} onChange={handleScopeChange('department_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
              <option value="">Select department</option>
              {departments.map((row) => (
                <option key={row.department_id} value={row.department_id}>
                  {row.department_name}
                </option>
              ))}
            </select>
            <div className="md:col-span-2">
              <select value={form.designation_id} onChange={handleChange('designation_id')} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                <option value="">Select designation</option>
                {designations.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} {row.location?.name ? `(${row.location.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <input value={form.title} onChange={handleChange('title')} placeholder="Responsibility title" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <textarea value={form.description} onChange={handleChange('description')} placeholder="Responsibility details" rows={4} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                {saving ? 'Saving...' : editingId ? 'Update Responsibility' : 'Create Responsibility'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-black/15 px-4 py-2 text-sm">
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-black">Responsibility List</h3>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search responsibility" className="w-full max-w-xs rounded-xl border border-black/10 bg-[#f8f8fa] px-3 py-2 text-sm" />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
            <table className="min-w-full divide-y divide-black/10 text-sm">
              <thead className="bg-[#f8f8fa] text-left text-black/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Responsibility</th>
                  <th className="px-4 py-3 font-semibold">Designation</th>
                  <th className="px-4 py-3 font-semibold">Scope</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-black/50">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-black">{row.title}</div>
                        <div className="whitespace-pre-wrap text-xs text-black/50">{row.description || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-black/70">{row.designation?.name || '-'}</td>
                      <td className="px-4 py-3 text-black/70">
                        <div>{row.designation?.location?.name || '-'}</div>
                        <div className="text-xs text-black/45">{row.designation?.department?.name || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(row)} className="rounded-lg border border-blue-200 px-3 py-1 text-xs text-blue-700">
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
                    <td colSpan={4} className="px-4 py-4 text-black/50">
                      No responsibilities found.
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

export default ResponsibilitiesPage