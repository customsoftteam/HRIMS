import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
} from 'lucide-react'

const ROLE_LABELS = {
  admin: 'Admin',
  hr: 'HR',
  manager: 'Supervisor / Manager',
  employee: 'Employee',
}

const NAV_GROUPS = {
  admin: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Organization',
      items: [
        { to: '/admin/organization/locations', label: 'Locations', icon: Building2 },
        { to: '/admin/organization/departments', label: 'Departments', icon: Building2 },
      ],
    },
    {
      title: 'People',
      items: [
        { to: '/admin/people/hr', label: 'HR', icon: Users },
        { to: '/admin/people/manager', label: 'Manager', icon: Users },
        { to: '/admin/people/employee', label: 'Employee', icon: Users },
      ],
    },
  ],
  hr: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/hr', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'People',
      items: [{ to: '/hr/people/employee', label: 'Employee', icon: Users }],
    },
  ],
  manager: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/manager', label: 'Dashboard', icon: LayoutDashboard }],
    },
  ],
  employee: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard }],
    },
  ],
}

function SidebarNav({ role = 'employee', onNavigate, collapsed = false }) {
  const groups = NAV_GROUPS[role] ?? NAV_GROUPS.employee

  return (
    <aside className={`flex h-full flex-col border-r border-white/10 bg-black p-4 text-white shadow-2xl shadow-black/30 transition-all duration-200 ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        {collapsed ? (
          <p className="text-center text-xs font-semibold text-white/70">HR</p>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">HRIMS</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {ROLE_LABELS[role]} Panel
            </p>
          </>
        )}
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title} className="space-y-2">
            {!collapsed ? (
              <p className="px-2 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                {group.title}
              </p>
            ) : null}
            {group.items.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onNavigate}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) =>
                  [
                    'flex items-center rounded-xl px-3 py-2 text-sm transition-all duration-200',
                    collapsed ? 'justify-center' : 'gap-2',
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                <link.icon className="size-4" />
                {!collapsed ? <span>{link.label}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {!collapsed ? (
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60 backdrop-blur">
          Signed in as <span className="font-medium text-white">{ROLE_LABELS[role]}</span>
        </div>
      ) : null}
    </aside>
  )
}

export default SidebarNav
