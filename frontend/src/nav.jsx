import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  BadgeCheck,
  ListTodo,
  FolderKanban,
  ClipboardCheck,
  MessageSquare,
  CalendarDays,
  BookOpen,
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
      title: 'Profile',
      items: [{ to: '/admin/profile', label: 'Profile', icon: Users }],
    },
    {
      title: 'Communication',
      items: [{ to: '/admin/chat', label: 'Chat', icon: MessageSquare }],
    },
    {
      title: 'Updates',
      items: [
        { to: '/admin/updates/announcements', label: 'Announcements', icon: MessageSquare },
        { to: '/admin/updates/notice-board', label: 'Notice Board', icon: ListTodo },
        { to: '/admin/updates/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
      ],
    },
    {
      title: 'Calendar',
      items: [{ to: '/admin/holiday-calendar', label: 'Holiday Calendar', icon: CalendarDays }],
    },
    {
      title: 'Leave Management',
      items: [
        { to: '/admin/leave/setup', label: 'Setup', icon: CalendarDays },
        { to: '/admin/leave/review', label: 'Review', icon: CalendarDays },
        { to: '/admin/leave/requests', label: 'Requests', icon: CalendarDays },
      ],
    },
    {
      title: 'Training',
      items: [{ to: '/admin/training', label: 'Management', icon: BookOpen }],
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
    {
      title: 'Catalog',
      items: [
        { to: '/admin/catalog/designations', label: 'Designations', icon: BadgeCheck },
        { to: '/admin/catalog/responsibilities', label: 'Responsibilities', icon: ListTodo },
      ],
    },
  ],
  hr: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/hr', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Profile',
      items: [{ to: '/hr/profile', label: 'Profile', icon: Users }],
    },
    {
      title: 'Communication',
      items: [{ to: '/hr/chat', label: 'Chat', icon: MessageSquare }],
    },
    {
      title: 'Updates',
      items: [
        { to: '/hr/updates/announcements', label: 'Announcements', icon: MessageSquare },
        { to: '/hr/updates/notice-board', label: 'Notice Board', icon: ListTodo },
        { to: '/hr/updates/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
      ],
    },
    {
      title: 'Calendar',
      items: [{ to: '/hr/holiday-calendar', label: 'Holiday Calendar', icon: CalendarDays }],
    },
    {
      title: 'Leave Management',
      items: [
        { to: '/hr/leave/setup', label: 'Setup', icon: CalendarDays },
        { to: '/hr/leave/review', label: 'Review', icon: CalendarDays },
        { to: '/hr/leave/requests', label: 'Requests', icon: CalendarDays },
      ],
    },
    {
      title: 'Training',
      items: [
        { to: '/hr/training', label: 'Management', icon: BookOpen },
        { to: '/hr/training/my', label: 'My Training', icon: BookOpen },
      ],
    },
    {
      title: 'People',
      items: [{ to: '/hr/people/employee', label: 'Employee', icon: Users }],
    },
    {
      title: 'Catalog',
      items: [
        { to: '/hr/catalog/designations', label: 'Designations', icon: BadgeCheck },
        { to: '/hr/catalog/responsibilities', label: 'Responsibilities', icon: ListTodo },
      ],
    },
  ],
  manager: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/manager', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Profile',
      items: [{ to: '/manager/profile', label: 'Profile', icon: Users }],
    },
    {
      title: 'Communication',
      items: [{ to: '/manager/chat', label: 'Chat', icon: MessageSquare }],
    },
    {
      title: 'Updates',
      items: [
        { to: '/manager/updates/announcements', label: 'Announcements', icon: MessageSquare },
        { to: '/manager/updates/notice-board', label: 'Notice Board', icon: ListTodo },
        { to: '/manager/updates/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
      ],
    },
    {
      title: 'Calendar',
      items: [{ to: '/manager/holiday-calendar', label: 'Holiday Calendar', icon: CalendarDays }],
    },
    {
      title: 'Leave Management',
      items: [
        { to: '/manager/leave/review', label: 'Review', icon: CalendarDays },
        { to: '/manager/leave/requests', label: 'Requests', icon: CalendarDays },
      ],
    },
    {
      title: 'Training',
      items: [
        { to: '/manager/training', label: 'Overview', icon: BookOpen },
        { to: '/manager/training/my', label: 'My Training', icon: BookOpen },
      ],
    },
    {
      title: 'Projects',
      items: [
        { to: '/manager/projects', label: 'Projects', icon: FolderKanban },
        { to: '/manager/tasks', label: 'Tasks', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { to: '/manager/catalog/designations', label: 'Designations', icon: BadgeCheck },
        { to: '/manager/catalog/responsibilities', label: 'Responsibilities', icon: ListTodo },
      ],
    },
  ],
  employee: [
    {
      title: 'Overview',
      items: [{ to: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Work',
      items: [
        { to: '/employee/projects', label: 'Projects', icon: FolderKanban },
        { to: '/employee/tasks', label: 'Tasks', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Profile',
      items: [{ to: '/employee/profile', label: 'Profile', icon: Users }],
    },
    {
      title: 'Communication',
      items: [{ to: '/employee/chat', label: 'Chat', icon: MessageSquare }],
    },
    {
      title: 'Updates',
      items: [
        { to: '/employee/updates/announcements', label: 'Announcements', icon: MessageSquare },
        { to: '/employee/updates/notice-board', label: 'Notice Board', icon: ListTodo },
        { to: '/employee/updates/upcoming-events', label: 'Upcoming Events', icon: CalendarDays },
      ],
    },
    {
      title: 'Calendar',
      items: [{ to: '/employee/holiday-calendar', label: 'Holiday Calendar', icon: CalendarDays }],
    },
    {
      title: 'Leave Management',
      items: [{ to: '/employee/leave/requests', label: 'Requests', icon: CalendarDays }],
    },
    {
      title: 'Learning',
      items: [{ to: '/employee/training', label: 'Training', icon: BookOpen }],
    },
  ],
}

function SidebarNav({ role = 'employee', onNavigate, collapsed = false }) {
  const groups = NAV_GROUPS[role] ?? NAV_GROUPS.employee

  return (
    <aside className={`flex h-full flex-col overflow-hidden border-r border-emerald-900/30 bg-gradient-to-b from-slate-900 to-emerald-950 p-4 text-white shadow-2xl shadow-emerald-950/50 transition-all duration-200 ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="mb-8 rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 p-4 backdrop-blur-xl shadow-lg shadow-emerald-500/25">
        {collapsed ? (
          <p className="text-center text-xs font-bold text-emerald-100">HO</p>
        ) : (
          <>
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-emerald-100 drop-shadow-lg">HRIMS Orbit</p>
            <p className="mt-2 text-lg font-bold text-white drop-shadow">
              {ROLE_LABELS[role]} Panel
            </p>
          </>
        )}
      </div>

      <div
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((group) => (
          <div key={group.title} className="space-y-2">
            {!collapsed ? (
              <p className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
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
                    'flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200',
                    collapsed ? 'justify-center' : 'gap-2',
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/35'
                      : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white',
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
        <div className="mt-auto rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs text-slate-200 backdrop-blur">
          Signed in as <span className="font-medium text-emerald-200">{ROLE_LABELS[role]}</span>
          <p className="mt-2 text-[10px] text-emerald-100/80">HRIMS_Orbit_1.0.1_17 Apr 2026_build</p>
        </div>
      ) : null}
    </aside>
  )
}

export default SidebarNav
