import { useEffect, useState } from 'react'
import DashboardAnalytics from '../../components/dashboard-analytics.jsx'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

function HrDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Employees In Scope', value: '-' },
    { label: 'Managers In Scope', value: '-' },
    { label: 'Locations In Scope', value: '-' },
    { label: 'Departments Covered', value: '-' },
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
        const response = await fetch(`${API_BASE_URL}/api/hr/dashboard`, {
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
          error.message || 'Failed to load HR dashboard data.',
          'Check backend server status and token validity.',
          'Ensure the user has HR access permissions.',
          'Retry after refreshing the page.',
        ])
      }
    })()
  }, [])

  return (
    <DashboardLayout
      role="hr"
      title="HR Dashboard"
      subtitle="People records, designations, responsibilities, and policies."
      stats={stats}
      highlights={highlights}
    >
      <DashboardAnalytics {...buildHrAnalytics(stats)} />
    </DashboardLayout>
  )
}

function buildHrAnalytics(stats) {
  const employeesInScope = toNumber(findStatValue(stats, 'Employees In Scope'))
  const managersInScope = toNumber(findStatValue(stats, 'Managers In Scope'))
  const locationsInScope = toNumber(findStatValue(stats, 'Locations In Scope'))
  const departmentsCovered = toNumber(findStatValue(stats, 'Departments Covered'))
  const totalPeople = employeesInScope + managersInScope
  const managerShare = totalPeople ? Math.round((managersInScope / totalPeople) * 100) : 0
  const peoplePerLocation = locationsInScope ? (totalPeople / locationsInScope).toFixed(1) : '0.0'
  const departmentsPerLocation = locationsInScope ? (departmentsCovered / locationsInScope).toFixed(1) : '0.0'

  return {
    title: 'Scope coverage snapshot',
    subtitle: 'Review how many people fall under your HR scope, how that breaks down across roles, and how broad the location coverage is.',
    bars: [
      { label: 'Employees In Scope', value: employeesInScope, tone: 'bg-zinc-900' },
      { label: 'Managers In Scope', value: managersInScope, tone: 'bg-emerald-600' },
      { label: 'Locations In Scope', value: locationsInScope, tone: 'bg-blue-600' },
      { label: 'Departments Covered', value: departmentsCovered, tone: 'bg-amber-600' },
    ],
    donut: {
      centerLabel: 'manager share',
      centerValue: `${managerShare}%`,
      segments: [
        { label: 'Employees', value: employeesInScope, color: '#0f172a' },
        { label: 'Managers', value: managersInScope, color: '#14b8a6' },
      ],
    },
    metrics: [
      { label: 'People / Location', value: peoplePerLocation, description: 'Average people count covered by each location.' },
      { label: 'Departments / Location', value: departmentsPerLocation, description: 'Breadth of department coverage per location.' },
      { label: 'Manager Share', value: `${managerShare}%`, description: 'Managers as a share of the scoped population.' },
      { label: 'Total In Scope', value: String(totalPeople), description: 'Combined people count under this HR scope.' },
    ],
  }
}

function findStatValue(stats, label) {
  return stats.find((item) => item.label === label)?.value ?? '0'
}

function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0
}

export default HrDashboardPage
