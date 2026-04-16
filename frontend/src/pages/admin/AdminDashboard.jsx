import { useEffect, useState } from 'react'
import DashboardAnalytics from '../../components/dashboard-analytics.jsx'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Total Employees', value: '-' },
    { label: 'Active Locations', value: '-' },
    { label: 'Department Mappings', value: '-' },
    { label: 'Active HR Users', value: '-' },
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
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
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
          error.message || 'Failed to load admin dashboard data.',
          'Check backend server status and token validity.',
          'Ensure the user has admin access permissions.',
          'Retry after refreshing the page.',
        ])
      }
    })()
  }, [])

  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Global controls, employee setup, and organization-wide access."
      stats={stats}
      highlights={highlights}
    >
      <DashboardAnalytics {...buildAdminAnalytics(stats)} />
    </DashboardLayout>
  )
}

function buildAdminAnalytics(stats) {
  const totalEmployees = toNumber(findStatValue(stats, 'Total Employees'))
  const activeLocations = toNumber(findStatValue(stats, 'Active Locations'))
  const departmentMappings = toNumber(findStatValue(stats, 'Department Mappings'))
  const activeHrUsers = toNumber(findStatValue(stats, 'Active HR Users'))
  const nonHrEmployees = Math.max(totalEmployees - activeHrUsers, 0)
  const employeesPerLocation = activeLocations ? (totalEmployees / activeLocations).toFixed(1) : '0.0'
  const mappingsPerLocation = activeLocations ? (departmentMappings / activeLocations).toFixed(1) : '0.0'
  const hrShare = totalEmployees ? Math.round((activeHrUsers / totalEmployees) * 100) : 0

  return {
    title: 'Organization overview',
    subtitle: 'Monitor employee volume, operational footprint, and the breadth of active HR coverage across the company.',
    bars: [
      { label: 'Total Employees', value: totalEmployees, tone: 'bg-zinc-900' },
      { label: 'Active Locations', value: activeLocations, tone: 'bg-blue-600' },
      { label: 'Department Mappings', value: departmentMappings, tone: 'bg-amber-600' },
      { label: 'Active HR Users', value: activeHrUsers, tone: 'bg-emerald-600' },
    ],
    donut: {
      centerLabel: 'hr share',
      centerValue: `${hrShare}%`,
      segments: [
        { label: 'HR Users', value: activeHrUsers, color: '#14b8a6' },
        { label: 'Other Workforce', value: nonHrEmployees, color: '#e4e4e7' },
      ],
    },
    metrics: [
      { label: 'Employees / Location', value: employeesPerLocation, description: 'Average staff density per active location.' },
      { label: 'Mappings / Location', value: mappingsPerLocation, description: 'Average department mappings per location.' },
      { label: 'HR Share', value: `${hrShare}%`, description: 'Active HR users as a share of total employees.' },
      { label: 'Operations Scope', value: String(activeLocations), description: 'Active locations under management.' },
    ],
  }
}

function findStatValue(stats, label) {
  return stats.find((item) => item.label === label)?.value ?? '0'
}

function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0
}

export default AdminDashboardPage
