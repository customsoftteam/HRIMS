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
}

function LocationsPage() {
  const [form, setForm] = useState(EMPTY_FORM)
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
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/locations`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to create location.')
      }

      setSuccessMessage('Location created successfully.')
      setForm(EMPTY_FORM)
      await fetchLocations()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Organization: Locations">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">Organization</p>
          <h2 className="mt-3 text-2xl font-semibold text-black">Locations</h2>
          <p className="mt-2 text-sm text-black/60">Create and maintain plants/offices for your company.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
            <h3 className="text-lg font-semibold text-black">Create Location</h3>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
              <input value={form.name} onChange={handleChange('name')} placeholder="Location name" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm md:col-span-2" />
              <input value={form.code} onChange={handleChange('code')} placeholder="Code" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <input value={form.location} onChange={handleChange('location')} placeholder="City" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <input value={form.timezone} onChange={handleChange('timezone')} placeholder="Timezone" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <input value={form.address} onChange={handleChange('address')} placeholder="Address" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
              <div className="md:col-span-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                  {saving ? 'Saving...' : 'Create Location'}
                </button>
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
                    <th className="px-4 py-3 font-semibold">Timezone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? (
                    <tr><td colSpan={4} className="px-4 py-4 text-black/50">Loading...</td></tr>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.code || '-'}</td>
                        <td className="px-4 py-3">{row.location || '-'}</td>
                        <td className="px-4 py-3">{row.timezone || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-4 py-4 text-black/50">No locations found.</td></tr>
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
