import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, LockKeyhole, Sparkles } from 'lucide-react'
import { API_BASE_URL } from '../utils/api.js'
import {
  getAuthToken,
  getAuthUser,
  getDashboardPathForRole,
  saveAuthSession,
} from '../utils/auth.js'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (getAuthToken()) {
      const user = getAuthUser()
      navigate(getDashboardPathForRole(user?.role), { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Login failed.')
      }

      const { token, user } = payload.data
      saveAuthSession(token, user)
      navigate(getDashboardPathForRole(user.role), { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_28%),linear-gradient(135deg,_#09090b_0%,_#18181b_45%,_#111827_100%)] px-4 py-6 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-black p-8 text-white xl:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
              <Sparkles className="size-4" />
              HRIMS Secure Access
            </div>
            <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight">
              Manage employees, projects, and operations from one secure workspace.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
              Sign in with your admin, HR, manager, or employee account and continue to the right dashboard instantly.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-white" />
                <p className="font-medium">Role-based dashboard access</p>
              </div>
              <p className="mt-2 text-sm text-white/65">
                Each user sees only the navigation and modules allowed for their role.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <LockKeyhole className="size-5 text-white" />
                <p className="font-medium">Hashed password login</p>
              </div>
              <p className="mt-2 text-sm text-white/65">
                Passwords are stored as hashes and tokens are used for session security.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-4 py-10 text-black sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 xl:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-xs uppercase tracking-[0.35em] text-white">
                <Sparkles className="size-4" />
                HRIMS Secure Access
              </div>
              <h1 className="mt-6 text-3xl font-semibold leading-tight">
                Welcome back.
              </h1>
              <p className="mt-2 text-sm text-black/60">
                Sign in to continue to your dashboard.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-8">
              <h2 className="text-2xl font-semibold">Login</h2>
              <p className="mt-2 text-sm text-black/60">
                Enter your email and password to access your HRIMS workspace.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-black/80">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8f8fa] px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-black/80">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8f8fa] px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Signing in...' : 'Login'}
                </button>
              </form>

              {errorMessage ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <p className="mt-6 text-sm text-black/55">
                After login, you will be redirected to the correct dashboard automatically.
              </p>

              <p className="mt-2 text-sm text-black/55">
                First-time onboarding?{' '}
                <Link to="/setup/company-admin" className="font-medium text-black underline underline-offset-4">
                  Create company and admin
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
