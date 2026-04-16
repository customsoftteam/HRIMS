import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import LoginPage from './pages/Login.jsx'
import SetupCompanyAdminPage from './pages/platform/SetupCompanyAdmin.jsx'
import NotFoundPage from './pages/NotFound.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboard.jsx'
import LocationsPage from './pages/admin/Locations.jsx'
import DepartmentsPage from './pages/admin/Departments.jsx'
import HrUsersPage from './pages/admin/HrUsers.jsx'
import ManagerUsersPage from './pages/admin/ManagerUsers.jsx'
import AdminEmployeeUsersPage from './pages/admin/EmployeeUsers.jsx'
import HrDashboardPage from './pages/hr/HrDashboard.jsx'
import HrEmployeeUsersPage from './pages/hr/EmployeeUsers.jsx'
import ManagerDashboardPage from './pages/manager/ManagerDashboard.jsx'
import ProjectsList from './pages/manager/ProjectsList.jsx'
import ProjectDetail from './pages/manager/ProjectDetail.jsx'
import TeamMembers from './pages/manager/TeamMembers.jsx'
import ManagerTasksPage from './pages/manager/Tasks.jsx'
import EmployeeDashboardPage from './pages/employee/EmployeeDashboard.jsx'
import EmployeeProjectsPage from './pages/employee/Projects.jsx'
import EmployeeTasksPage from './pages/employee/Tasks.jsx'
import EmployeeProfilePage from './pages/employee/Profile.jsx'
import CatalogDesignationsPage from './pages/catalog/Designations.jsx'
import CatalogResponsibilitiesPage from './pages/catalog/Responsibilities.jsx'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/setup/company-admin', element: <SetupCompanyAdminPage /> },
  { path: '/dashboard/admin', element: <AdminDashboardPage /> },
  { path: '/admin/organization/locations', element: <LocationsPage /> },
  { path: '/admin/organization/departments', element: <DepartmentsPage /> },
  { path: '/admin/people/hr', element: <HrUsersPage /> },
  { path: '/admin/people/manager', element: <ManagerUsersPage /> },
  { path: '/admin/people/employee', element: <AdminEmployeeUsersPage /> },
  { path: '/admin/catalog/designations', element: <CatalogDesignationsPage role="admin" /> },
  { path: '/admin/catalog/responsibilities', element: <CatalogResponsibilitiesPage role="admin" /> },
  { path: '/dashboard/hr', element: <HrDashboardPage /> },
  { path: '/hr/people/employee', element: <HrEmployeeUsersPage /> },
  { path: '/hr/catalog/designations', element: <CatalogDesignationsPage role="hr" /> },
  { path: '/hr/catalog/responsibilities', element: <CatalogResponsibilitiesPage role="hr" /> },
  { path: '/dashboard/manager', element: <ManagerDashboardPage /> },
  { path: '/manager/projects', element: <ProjectsList /> },
  { path: '/manager/projects/:projectId', element: <ProjectDetail /> },
  { path: '/manager/teams/:teamId', element: <TeamMembers /> },
  { path: '/manager/tasks', element: <ManagerTasksPage /> },
  { path: '/manager/catalog/designations', element: <CatalogDesignationsPage role="manager" /> },
  { path: '/manager/catalog/responsibilities', element: <CatalogResponsibilitiesPage role="manager" /> },
  { path: '/dashboard/employee', element: <EmployeeDashboardPage /> },
  { path: '/employee/projects', element: <EmployeeProjectsPage /> },
  { path: '/employee/tasks', element: <EmployeeTasksPage /> },
  { path: '/employee/profile', element: <EmployeeProfilePage /> },
  { path: '*', element: <NotFoundPage /> },
])

function AppRoutes() {
  return <RouterProvider router={router} />
}

export default AppRoutes
