import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import SidebarNav from '../nav.jsx'
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
} from '../utils/auth.js'

function StatCard({ label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'border-black/10 bg-white',
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
  const navigate = useNavigate()
  const authUser = getAuthUser()
  const profileSeed = authUser?.first_name || authUser?.email || role
  const profileImageUrl = useMemo(
    () => `https://api.dicebear.com/9.x/initials/svg?seed=${profileSeed}`,
    [profileSeed]
  )

  const closeSidebar = () => setMobileSidebarOpen(false)

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?')

    if (!confirmed) {
      return
    }

    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
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
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden">
              <SidebarNav role={role} onNavigate={closeSidebar} />
            </div>
          </>
        )}

        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-black/10 bg-black text-white shadow-lg shadow-black/10">
            <div className="flex items-center justify-between px-4 py-3 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen((value) => !value)}
                  className="rounded-md border border-white/15 p-2 text-white transition hover:bg-white/10 md:hidden"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  className="hidden rounded-md border border-white/15 p-2 text-white transition hover:bg-white/10 md:inline-flex"
                  aria-label="Toggle sidebar collapse"
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-white md:text-xl">{title}</h1>
                  <p className="text-xs text-white/70 md:text-sm">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="size-10 rounded-full border border-white/10 bg-white/10"
                />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-[#f4f4f5] p-4 md:p-8">
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
                  <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm shadow-black/5">
                    <h2 className="text-lg font-semibold text-black">Dashboard Highlights</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {highlights.map((item) => (
                        <div key={item} className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/80">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm shadow-black/5">
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

                <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm shadow-black/5">
                  <h2 className="text-lg font-semibold text-black">Dashboard Highlights</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {highlights.map((item) => (
                      <div key={item} className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/80">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm shadow-black/5">
                  <h2 className="text-lg font-semibold text-black">Next Build Steps</h2>
                  <p className="mt-2 text-sm text-black/60">
                    This layout is ready. Next we can connect live data from Supabase and
                    implement module pages one by one.
                  </p>
                </section>
              </>
            )}
          </main>

          <footer className="border-t border-black/10 bg-white px-4 py-4 text-xs text-black/50 md:px-8">
            HRIMS Dashboard • Built with role-based access • {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
