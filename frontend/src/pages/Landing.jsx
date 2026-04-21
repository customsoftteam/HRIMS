import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Layers3,
  MessageSquare,
  Shield,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
import { getAuthToken, getDashboardPathForRole, getAuthUser } from '../utils/auth.js'
import BrandLogo from '../components/BrandLogo.jsx'

function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getAuthToken()) {
      const user = getAuthUser()
      navigate(getDashboardPathForRole(user?.role), { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,_rgba(16,185,129,0.16),_transparent_38%),radial-gradient(circle_at_100%_0%,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(180deg,_#f6fffb_0%,_#f8fafc_48%,_#eefbf5_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo size="sm" showText theme="light" />

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#capabilities"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 sm:inline-flex"
            >
              Capabilities
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-600 sm:px-5"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="relative">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sparkles className="size-4" />
                Enterprise-grade HR operations
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                The operating system for modern HR and people teams.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                From onboarding and responsibilities to leave workflows and updates, HRIMS Orbit brings every role into one elegant control center.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 transition hover:from-emerald-700 hover:to-teal-600"
                >
                  Enter workspace
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Explore platform
                </a>
              </div>

              <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Enterprises onboarded', value: '500+' },
                  { label: 'User roles supported', value: '4' },
                  { label: 'Avg. approval speed-up', value: '39%' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                    <p className="text-xl font-semibold text-emerald-700">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-300/40 blur-2xl" />
              <div className="absolute -left-8 bottom-2 h-24 w-24 rounded-full bg-sky-300/35 blur-2xl" />

              <div className="relative rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-2xl shadow-emerald-900/10 backdrop-blur sm:p-6">
                <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Operations Pulse</p>
                    <p className="text-sm font-semibold text-slate-900">Today at a glance</p>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Live</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Users, title: 'Active employees', value: '102' },
                    { icon: Calendar, title: 'Leave requests', value: '18' },
                    { icon: Layers3, title: 'Open tasks', value: '54' },
                    { icon: MessageSquare, title: 'Company updates', value: '9' },
                  ].map((stat) => (
                    <div key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <stat.icon className="size-4 text-emerald-700" />
                      <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.title}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                  <div className="flex items-center gap-2 text-sky-700">
                    <Timer className="size-4" />
                    <p className="text-sm font-semibold">Approval pipeline health</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: 'Pending review', pct: '22%' },
                      { label: 'Approved', pct: '61%' },
                      { label: 'Escalated', pct: '17%' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-xs text-slate-600">
                        <span>{row.label}</span>
                        <span className="font-semibold text-slate-800">{row.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trusted by teams running mission-critical workflows</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:grid-cols-6">
              {['Pioneer Labs', 'Aster Retail', 'BlueOrbit', 'Kinetic Works', 'Helio Group', 'Arcline'].map((name) => (
                <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold tracking-wide text-slate-600">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Capabilities</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Built for every role in your organization</h2>
              <p className="mt-4 text-base text-slate-600">
                Purpose-built modules unify HR, managers, and employees with clear permissions and shared visibility.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'People Directory',
                  description: 'Centralized employee records with role-aware access and profile management.',
                  accent: 'from-emerald-500 to-teal-500',
                },
                {
                  icon: Calendar,
                  title: 'Leave Orchestration',
                  description: 'Configurable leave setup, holiday controls, and fast approval loops.',
                  accent: 'from-sky-500 to-cyan-500',
                },
                {
                  icon: BarChart3,
                  title: 'Work Insights',
                  description: 'Live operational metrics that surface bottlenecks and throughput.',
                  accent: 'from-lime-500 to-emerald-500',
                },
                {
                  icon: MessageSquare,
                  title: 'Internal Communication',
                  description: 'Announcements and updates delivered in one structured communication lane.',
                  accent: 'from-teal-500 to-emerald-600',
                },
                {
                  icon: Shield,
                  title: 'Role Security',
                  description: 'Strong permission boundaries for admins, HR, managers, and employees.',
                  accent: 'from-cyan-500 to-sky-500',
                },
                {
                  icon: CheckCircle2,
                  title: 'Catalog Control',
                  description: 'Designations and responsibilities managed with clean, auditable workflows.',
                  accent: 'from-emerald-500 to-green-500',
                },
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"
                >
                  <div className={`inline-flex rounded-xl bg-gradient-to-r ${feature.accent} p-3 text-white shadow-md`}>
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 lg:px-8 lg:pb-16">
          <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-teal-500 p-8 text-white shadow-2xl shadow-emerald-700/20 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Implementation speed</p>
              <h3 className="mt-3 text-3xl font-semibold leading-tight">Launch your complete HR control plane in days, not quarters.</h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
                Standardized modules, role templates, and company-level configuration make rollout simple for fast-moving teams.
              </p>
              <Link
                to="/login"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Open HRIMS Orbit
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Why teams choose HRIMS Orbit</p>
              <ul className="mt-5 space-y-4">
                {[
                  'One place for people operations, updates, and leave workflows',
                  'Role-specific dashboards that reduce noise and improve focus',
                  'Clean, consistent UX across admin, HR, manager, and employee experiences',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-100 bg-white/80 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
          <p>HRIMS_Orbit_1.0.1_17 Apr 2026_build</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
              Sign in
            </Link>
            <a href="#capabilities" className="font-semibold text-slate-600 transition hover:text-emerald-700">
              Capabilities
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
