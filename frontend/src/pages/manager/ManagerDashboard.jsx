import { useEffect, useState } from 'react'
import DashboardAnalytics from '../../components/dashboard-analytics.jsx'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

function ManagerDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Direct Reports', value: '-' },
    { label: 'Active Team Members', value: '-' },
    { label: 'My Locations', value: '-' },
    { label: 'Team Departments', value: '-' },
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
        const response = await fetch(`${API_BASE_URL}/api/manager/dashboard`, {
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
          error.message || 'Failed to load manager dashboard data.',
          'Check backend server status and token validity.',
          'Ensure the user has manager access permissions.',
          'Retry after refreshing the page.',
        ])
      }
    })()
  }, [])

  return (
    <DashboardLayout
      role="manager"
      title="Manager Dashboard"
      subtitle="Project teams, task updates, and day-to-day delivery tracking."
      stats={stats}
      highlights={highlights}
    >
      <DashboardAnalytics {...buildManagerAnalytics(stats)} />
    </DashboardLayout>
  )
}

function buildManagerAnalytics(stats) {
  const directReports = toNumber(findStatValue(stats, 'Direct Reports'))
  const activeTeamMembers = toNumber(findStatValue(stats, 'Active Team Members'))
  const locations = toNumber(findStatValue(stats, 'My Locations'))
  const departments = toNumber(findStatValue(stats, 'Team Departments'))
  const inactiveTeamMembers = Math.max(directReports - activeTeamMembers, 0)
  const activeRate = directReports ? Math.round((activeTeamMembers / directReports) * 100) : 0
  const teamSpan = locations + departments

  return {
    title: 'Team delivery snapshot',
    subtitle: 'Track team size, active coverage, and how broadly your team is spread across locations and departments.',
    bars: [
      { label: 'Direct Reports', value: directReports, tone: 'bg-zinc-900' },
      { label: 'Active Team Members', value: activeTeamMembers, tone: 'bg-emerald-600' },
      { label: 'My Locations', value: locations, tone: 'bg-blue-600' },
      { label: 'Team Departments', value: departments, tone: 'bg-amber-600' },
    ],
    donut: {
      centerLabel: 'active rate',
      centerValue: `${activeRate}%`,
      segments: [
        { label: 'Active', value: activeTeamMembers, color: '#16a34a' },
        { label: 'Inactive', value: inactiveTeamMembers, color: '#e4e4e7' },
      ],
    },
    metrics: [
      { label: 'Team Span', value: String(teamSpan), description: 'Location count plus department coverage.' },
      { label: 'Activity Rate', value: `${activeRate}%`, description: 'Share of direct reports currently active.' },
      { label: 'Location Reach', value: String(locations), description: 'Active locations in your scope.' },
      { label: 'Department Reach', value: String(departments), description: 'Departments represented by your team.' },
    ],
  }
}

function findStatValue(stats, label) {
  return stats.find((item) => item.label === label)?.value ?? '0'
}

function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0
}

export default ManagerDashboardPage
