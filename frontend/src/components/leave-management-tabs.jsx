import { NavLink } from 'react-router-dom'

const LEAVE_PAGES = {
  admin: [
    { to: '/admin/leave/setup', label: 'Setup' },
    { to: '/admin/leave/review', label: 'Review' },
    { to: '/admin/leave/requests', label: 'Requests' },
  ],
  hr: [
    { to: '/hr/leave/setup', label: 'Setup' },
    { to: '/hr/leave/review', label: 'Review' },
    { to: '/hr/leave/requests', label: 'Requests' },
  ],
  manager: [
    { to: '/manager/leave/review', label: 'Review' },
    { to: '/manager/leave/requests', label: 'Requests' },
  ],
  employee: [
    { to: '/employee/leave/requests', label: 'Requests' },
  ],
}

function LeaveManagementTabs({ role = 'employee' }) {
  const items = LEAVE_PAGES[role] || LEAVE_PAGES.employee

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm shadow-black/5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              'rounded-xl px-4 py-2 text-sm font-semibold transition',
              isActive ? 'bg-black text-white' : 'bg-transparent text-black/70 hover:bg-black/5 hover:text-black',
            ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export default LeaveManagementTabs
