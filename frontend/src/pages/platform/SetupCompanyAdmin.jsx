import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ShieldPlus } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api.js'

const EMPTY_FORM = {
  setup_key: '',
  company_name: '',
  company_code: '',
  admin_first_name: '',
  admin_last_name: '',
  admin_email: '',
  admin_phone: '',
  admin_password: '',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function SetupCompanyAdminPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setValidationErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const errors = {}

    if (!form.setup_key.trim()) {
      errors.setup_key = 'Setup key is required.'
    }

    if (!form.company_name.trim()) {
      errors.company_name = 'Company name is required.'
    }

    if (!form.admin_first_name.trim()) {
      errors.admin_first_name = 'Admin first name is required.'
    }

    if (!form.admin_email.trim()) {
      errors.admin_email = 'Admin email is required.'
    } else if (!EMAIL_REGEX.test(form.admin_email.trim())) {
      errors.admin_email = 'Enter a valid email address.'
    }

    if (!form.admin_password) {
      errors.admin_password = 'Admin password is required.'
    } else if (!PASSWORD_REGEX.test(form.admin_password)) {
      errors.admin_password = 'Password must be at least 8 characters and include letters and numbers.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/platform/setup/company-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to create company and admin.')
      }

      setSuccessMessage('Company and first admin created. You can login with the admin credentials now.')
      setForm(EMPTY_FORM)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.08),_transparent_30%),linear-gradient(140deg,_#f7f7f8_0%,_#eceef2_45%,_#f9fafb_100%)] px-4 py-8 text-black">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.12)]">
        <section className="border-b border-black/10 bg-black px-6 py-8 text-white sm:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em]">
            <Building2 className="size-4" />
            Platform Setup
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Create Company and First Admin</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Use this one-time setup page to onboard a new company and its first admin account.
            The company admin will create locations and all HR, manager, and employee users.
          </p>
        </section>

        <section className="px-6 py-8 sm:px-10">
          <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Setup Key</label>
                <input
                  type="password"
                  value={form.setup_key}
                  onChange={handleChange('setup_key')}
                  className="w-full rounded-xl border border-black/10 bg-[#f7f8fb] px-3 py-2.5 text-sm"
                  placeholder="Enter platform setup key"
                />
                {validationErrors.setup_key ? <p className="mt-1 text-xs text-rose-700">{validationErrors.setup_key}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Company Name</label>
                <input
                  value={form.company_name}
                  onChange={handleChange('company_name')}
                  className="w-full rounded-xl border border-black/10 bg-[#f7f8fb] px-3 py-2.5 text-sm"
                  placeholder="Microsoft"
                />
                {validationErrors.company_name ? <p className="mt-1 text-xs text-rose-700">{validationErrors.company_name}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Company Code</label>
                <input
                  value={form.company_code}
                  onChange={handleChange('company_code')}
                  className="w-full rounded-xl border border-black/10 bg-[#f7f8fb] px-3 py-2.5 text-sm"
                  placeholder="MSFT"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-black/70">
                <ShieldPlus className="size-4" />
                First Company Admin
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">First Name</label>
                  <input
                    value={form.admin_first_name}
                    onChange={handleChange('admin_first_name')}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
                    placeholder="Alex"
                  />
                  {validationErrors.admin_first_name ? <p className="mt-1 text-xs text-rose-700">{validationErrors.admin_first_name}</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Last Name</label>
                  <input
                    value={form.admin_last_name}
                    onChange={handleChange('admin_last_name')}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
                    placeholder="Johnson"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Admin Email</label>
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={handleChange('admin_email')}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
                    placeholder="admin@microsoft.com"
                  />
                  {validationErrors.admin_email ? <p className="mt-1 text-xs text-rose-700">{validationErrors.admin_email}</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Admin Phone</label>
                  <input
                    value={form.admin_phone}
                    onChange={handleChange('admin_phone')}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
                    placeholder="+91 98xxxxxx"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Admin Password</label>
                  <input
                    type="password"
                    value={form.admin_password}
                    onChange={handleChange('admin_password')}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
                    placeholder="At least 8 chars with letters and numbers"
                  />
                  {validationErrors.admin_password ? (
                    <p className="mt-1 text-xs text-rose-700">{validationErrors.admin_password}</p>
                  ) : (
                    <p className="mt-1 text-xs text-black/50">Must include letters and numbers.</p>
                  )}
                </div>
              </div>
            </div>

            {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
            {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isSubmitting ? 'Creating...' : 'Create Company + Admin'}
              </button>
              <Link to="/login" className="text-sm font-medium text-black/70 underline underline-offset-4">
                Go to Login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default SetupCompanyAdminPage
