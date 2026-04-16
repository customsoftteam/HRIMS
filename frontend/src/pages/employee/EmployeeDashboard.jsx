import { useEffect, useState } from 'react'
import DashboardAnalytics from '../../components/dashboard-analytics.jsx'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

function EmployeeDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Profile Completion', value: '-' },
    { label: 'Active Locations', value: '-' },
    { label: 'Department Assignments', value: '-' },
    { label: 'Reporting Manager', value: '-' },
  ])
  const [highlights, setHighlights] = useState([
    'Loading dashboard insights...',
    'Please wait while real-time values are fetched.',
    'If this takes longer, verify backend connectivity.',
    'Role-based summary will appear here once loaded.',
  ])

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/employee/dashboard`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch dashboard data.')
        }

        if (payload?.data?.stats?.length) {
          setStats(payload.data.stats)
        }

        if (payload?.data?.highlights?.length) {
          setHighlights(payload.data.highlights)
        }
      } catch (error) {
        setHighlights([
          error.message || 'Failed to load employee dashboard data.',
          'Check backend server status and token validity.',
          'Ensure the user has employee access permissions.',
          'Retry after refreshing the page.',
        ])
      }
    })()
  }, [])

  return (
    <DashboardLayout
      role="employee"
      title="Employee Dashboard"
      subtitle="Personal tasks, profile updates, and team collaboration."
      stats={stats}
      highlights={highlights}
    >
      <DashboardAnalytics {...buildEmployeeAnalytics(stats)} />
    </DashboardLayout>
  )
}

function buildEmployeeAnalytics(stats) {
  const profileCompletion = toNumber(findStatValue(stats, 'Profile Completion'))
  const activeLocations = toNumber(findStatValue(stats, 'Active Locations'))
  const departmentAssignments = toNumber(findStatValue(stats, 'Department Assignments'))
  const managerAssigned = findStatValue(stats, 'Reporting Manager') === 'Assigned' ? 1 : 0
  const remainingCompletion = Math.max(100 - profileCompletion, 0)

  return {
    title: 'Personal readiness snapshot',
    subtitle: 'See how complete your profile is and how your current assignments are configured at a glance.',
    bars: [
      { label: 'Profile Completion', value: profileCompletion, tone: 'bg-zinc-900' },
      { label: 'Active Locations', value: activeLocations, tone: 'bg-blue-600' },
      { label: 'Department Assignments', value: departmentAssignments, tone: 'bg-amber-600' },
      { label: 'Reporting Manager', value: managerAssigned, tone: 'bg-emerald-600', note: managerAssigned ? 'Assigned' : 'Not set' },
    ],
    donut: {
      centerLabel: 'profile ready',
      centerValue: `${profileCompletion}%`,
      segments: [
        { label: 'Completed', value: profileCompletion, color: '#0f172a' },
        { label: 'Remaining', value: remainingCompletion, color: '#e4e4e7' },
      ],
    },
    metrics: [
      { label: 'Profile Status', value: profileCompletion >= 80 ? 'Strong' : 'Needs attention', description: 'Completion score based on core profile fields.' },
      { label: 'Locations', value: String(activeLocations), description: 'Active location assignments.' },
      { label: 'Departments', value: String(departmentAssignments), description: 'Active department assignments.' },
      { label: 'Manager', value: managerAssigned ? 'Assigned' : 'Not Set', description: 'Reporting manager configuration.' },
    ],
  }
}

function findStatValue(stats, label) {
  return stats.find((item) => item.label === label)?.value ?? '0'
}

function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0
}

export default EmployeeDashboardPage
