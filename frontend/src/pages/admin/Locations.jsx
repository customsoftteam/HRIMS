import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const EMPTY_FORM = {
  name: '',
  code: '',
  location: '',
  address: '',
  timezone: '',
  is_active: true,
}

function LocationsPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const authHeaders = {
    Authorization: `Bearer ${getAuthToken()}`,
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/locations`, { headers: authHeaders })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch locations.')
      }

      setRows(payload.data || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

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
        isEdit ? `${API_BASE_URL}/api/admin/locations/${editingId}` : `${API_BASE_URL}/api/admin/locations`,
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
        throw new Error(payload?.message || 'Failed to save location.')
      }

      setSuccessMessage(isEdit ? 'Location updated successfully.' : 'Location created successfully.')
      resetForm()
      await fetchLocations()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (row) => {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      code: row.code || '',
      location: row.location || '',
      address: row.address || '',
      timezone: row.timezone || '',
      is_active: Boolean(row.is_active),
    })
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this location?')) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/locations/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to remove location.')
      }

      if (editingId === id) {
        resetForm()
      }

      setSuccessMessage('Location removed successfully.')
      await fetchLocations()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Organization: Locations">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">Organization</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">Locations</h2>
          <p className="mt-2 text-sm text-black/60">Create, edit, and disable plants/offices for your company.</p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
            <div>
              <h3 className="text-lg font-semibold text-black">{editingId ? 'Edit Location' : 'Create Location'}</h3>
              <p className="mt-1 text-sm text-black/60">Keep the location details structured so the directory stays clean and easy to scan.</p>
            </div>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <input value={form.name} onChange={handleChange('name')} placeholder="Location name" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.code} onChange={handleChange('code')} placeholder="Code" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.location} onChange={handleChange('location')} placeholder="City" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.timezone} onChange={handleChange('timezone')} placeholder="Timezone" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-black/45">Status</label>
                <label className="flex h-[42px] items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm text-black/70">
                  <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} />
                  Active
                </label>
              </div>
              <div className="md:col-span-2">
                <input value={form.address} onChange={handleChange('address')} placeholder="Address" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2 flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                  {saving ? 'Saving...' : editingId ? 'Update Location' : 'Create Location'}
                </button>
                {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-black/15 px-4 py-2 text-sm">Cancel</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <h3 className="text-lg font-semibold text-black">Location Directory</h3>
            <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-4 text-black/50">Loading...</td></tr>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.code || '-'}</td>
                        <td className="px-4 py-3">{row.location || '-'}</td>
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
                    <tr><td colSpan={5} className="px-4 py-4 text-black/50">No locations found.</td></tr>
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

export default LocationsPage
