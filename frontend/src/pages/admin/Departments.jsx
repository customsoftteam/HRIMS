import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  plant_office_id: '',
  department_name: '',
  department_code: '',
  department_description: '',
}

function DepartmentsPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [locations, setLocations] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))

    if (field === 'plant_office_id') {
      fetchDepartments(value).catch((error) => setErrorMessage(error.message))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/departments`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to add department.')
      }

      setSuccessMessage('Department added successfully.')
      const selectedLocation = form.plant_office_id
      setForm((current) => ({ ...EMPTY_FORM, plant_office_id: current.plant_office_id }))
      await fetchDepartments(selectedLocation)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const locationNameMap = new Map(locations.map((row) => [row.id, row.name]))

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Organization: Departments">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">Organization</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">Departments</h2>
          <p className="mt-2 text-sm text-black/60">Select a location and enable departments for it.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
            <h3 className="text-lg font-semibold text-black">Add Department to Location</h3>
            <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
              <select value={form.plant_office_id} onChange={handleChange('plant_office_id')} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                <option value="">Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
              <input value={form.department_name} onChange={handleChange('department_name')} placeholder="Department name" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <input value={form.department_code} onChange={handleChange('department_code')} placeholder="Department code" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <textarea value={form.department_description} onChange={handleChange('department_description')} placeholder="Description" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" rows={3} />
              <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                {saving ? 'Saving...' : 'Add Department'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <h3 className="text-lg font-semibold text-black">Department Mapping</h3>
            <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-black/50">Loading...</td></tr>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">{locationNameMap.get(row.plant_office_id) || '-'}</td>
                        <td className="px-4 py-3">{row.department_name || '-'}</td>
                        <td className="px-4 py-3">{row.department_code || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-4 text-black/50">No departments mapped.</td></tr>
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
