import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { API_BASE_URL } from '../utils/api.js'
import BrandLogo from './BrandLogo.jsx'
import SidebarNav from '../nav.jsx'
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
} from '../utils/auth.js'

function StatCard({ label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'border-emerald-100 bg-white',
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-rose-200 bg-rose-50',
  }

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone] ?? toneClasses.default}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function DashboardLayout({ role, title, subtitle, stats, highlights, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [headerUser, setHeaderUser] = useState(() => getAuthUser())
  const navigate = useNavigate()
  const profileSeed = headerUser?.first_name || headerUser?.email || role
  const profileImageUrl = useMemo(() => {
    return headerUser?.profile_picture_url || `https://api.dicebear.com/9.x/initials/svg?seed=${profileSeed}`
  }, [headerUser?.profile_picture_url, profileSeed])

  const closeSidebar = () => setMobileSidebarOpen(false)

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const refreshProfilePicture = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        })

        if (!response.ok) {
          return
        }

        const payload = await response.json()
        const avatarUrl = payload?.data?.profile?.personal_details?.profile_picture_url || null

        if (avatarUrl) {
          const currentUser = getAuthUser()
          if (currentUser && currentUser.profile_picture_url !== avatarUrl) {
            const nextUser = { ...currentUser, profile_picture_url: avatarUrl }
            localStorage.setItem('hrims_auth_user', JSON.stringify(nextUser))
            setHeaderUser(nextUser)
          }
        }
      } catch {
        // Keep the fallback avatar if profile lookup fails.
      }
    }

    refreshProfilePicture()

    const handleProfileUpdate = (event) => {
      if (event.detail?.profile_picture_url) {
        const currentUser = getAuthUser()
        if (!currentUser) {
          return
        }

        const nextUser = { ...currentUser, profile_picture_url: event.detail.profile_picture_url }
        localStorage.setItem('hrims_auth_user', JSON.stringify(nextUser))
        setHeaderUser(nextUser)
      }
    }

    window.addEventListener('hrims-profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('hrims-profile-updated', handleProfileUpdate)
  }, [])

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?')

    if (!confirmed) {
      return
    }

    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_0%_0%,_rgba(16,185,129,0.1),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ecfdf5_100%)] text-foreground">
      <div className="mx-auto flex h-screen max-w-[1480px] overflow-hidden">
        <div className="hidden md:block">
          <SidebarNav role={role} collapsed={sidebarCollapsed} />
        </div>

        {mobileSidebarOpen && (
          <>
            <button
              type="button"
              aria-label="Close sidebar overlay"
              onClick={closeSidebar}
              className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden">
              <SidebarNav role={role} onNavigate={closeSidebar} />
            </div>
          </>
        )}

        <div className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-emerald-700/30 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/20">
            <div className="flex items-center justify-between px-4 py-3 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen((value) => !value)}
                  className="rounded-md border border-white/20 p-2 text-white transition hover:bg-white/15 md:hidden"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  className="hidden rounded-md border border-white/20 p-2 text-white transition hover:bg-white/15 md:inline-flex"
                  aria-label="Toggle sidebar collapse"
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </button>
                <BrandLogo size="sm" className="hidden lg:inline-flex" />
                <div>
                  <h1 className="text-lg font-semibold text-white md:text-xl">{title}</h1>
                  <p className="text-xs text-white/70 md:text-sm">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={profileImageUrl}
                  alt={headerUser?.first_name ? `${headerUser.first_name} profile` : 'Profile'}
                  className="size-10 rounded-full border border-white/10 bg-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent p-4 md:p-8">
            {children ? (
              <div className="space-y-6">
                {stats?.length ? (
                  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                      <StatCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        tone={item.tone}
                      />
                    ))}
                  </section>
                ) : null}

                {highlights?.length ? (
                  <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5">
                    <h2 className="text-lg font-semibold text-slate-900">Dashboard Highlights</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {highlights.map((item) => (
                        <div key={item} className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5">
                  {children}
                </section>
              </div>
            ) : (
              <>
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((item) => (
                    <StatCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      tone={item.tone}
                    />
                  ))}
                </section>

                <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5">
                  <h2 className="text-lg font-semibold text-slate-900">Dashboard Highlights</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {highlights.map((item) => (
                      <div key={item} className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5">
                  <h2 className="text-lg font-semibold text-slate-900">Next Build Steps</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This layout is ready. Next we can connect live data from Supabase and
                    implement module pages one by one.
                  </p>
                </section>
              </>
            )}
          </main>

          <footer className="border-t border-emerald-100 bg-white/90 px-4 py-4 text-xs text-slate-500 md:px-8">
            HRIMS_Orbit_1.0.1_17 Apr 2026_build
          </footer>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
