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
  ],
}

function SidebarNav({ role = 'employee', onNavigate, collapsed = false }) {
  const groups = NAV_GROUPS[role] ?? NAV_GROUPS.employee

  return (
    <aside className={`flex h-full flex-col overflow-hidden border-r border-white/10 bg-black p-4 text-white shadow-2xl shadow-black/30 transition-all duration-200 ${collapsed ? 'w-20' : 'w-72'}`}>
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

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1">
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
