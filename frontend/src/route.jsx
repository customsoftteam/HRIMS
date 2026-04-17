import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import LoginPage from './pages/Login.jsx'
import LandingPage from './pages/Landing.jsx'
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
import InternalChatPage from './pages/chat/InternalChat.jsx'
import LeaveSetupPage from './pages/leave/LeaveSetup.jsx'
import LeaveReviewPage from './pages/leave/LeaveReview.jsx'
import LeaveRequestsPage from './pages/leave/LeaveRequests.jsx'
import HolidayCalendarPage from './pages/leave/HolidayCalendar.jsx'
import TrainingPage from './pages/training/Training.jsx'
import TrainingManagementPage from './pages/training/TrainingManagement.jsx'
import CatalogDesignationsPage from './pages/catalog/Designations.jsx'
import CatalogResponsibilitiesPage from './pages/catalog/Responsibilities.jsx'
import WorkplaceUpdatesPage from './pages/updates/WorkplaceUpdatesPage.jsx'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
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
  { path: '/admin/profile', element: <EmployeeProfilePage /> },
  { path: '/admin/chat', element: <InternalChatPage /> },
  { path: '/admin/updates/announcements', element: <WorkplaceUpdatesPage role="admin" section="announcements" /> },
  { path: '/admin/updates/notice-board', element: <WorkplaceUpdatesPage role="admin" section="noticeBoard" /> },
  { path: '/admin/updates/upcoming-events', element: <WorkplaceUpdatesPage role="admin" section="upcomingEvents" /> },
  { path: '/admin/leave', element: <Navigate to="/admin/leave/setup" replace /> },
  { path: '/admin/leave/setup', element: <LeaveSetupPage /> },
  { path: '/admin/leave/review', element: <LeaveReviewPage /> },
  { path: '/admin/leave/requests', element: <LeaveRequestsPage /> },
  { path: '/admin/holiday-calendar', element: <HolidayCalendarPage /> },
  { path: '/admin/training', element: <TrainingManagementPage /> },
  { path: '/dashboard/hr', element: <HrDashboardPage /> },
  { path: '/hr/people/employee', element: <HrEmployeeUsersPage /> },
  { path: '/hr/catalog/designations', element: <CatalogDesignationsPage role="hr" /> },
  { path: '/hr/catalog/responsibilities', element: <CatalogResponsibilitiesPage role="hr" /> },
  { path: '/hr/profile', element: <EmployeeProfilePage /> },
  { path: '/hr/chat', element: <InternalChatPage /> },
  { path: '/hr/updates/announcements', element: <WorkplaceUpdatesPage role="hr" section="announcements" /> },
  { path: '/hr/updates/notice-board', element: <WorkplaceUpdatesPage role="hr" section="noticeBoard" /> },
  { path: '/hr/updates/upcoming-events', element: <WorkplaceUpdatesPage role="hr" section="upcomingEvents" /> },
  { path: '/hr/leave', element: <Navigate to="/hr/leave/setup" replace /> },
  { path: '/hr/leave/setup', element: <LeaveSetupPage /> },
  { path: '/hr/leave/review', element: <LeaveReviewPage /> },
  { path: '/hr/leave/requests', element: <LeaveRequestsPage /> },
  { path: '/hr/training', element: <TrainingManagementPage /> },
  { path: '/hr/training/my', element: <TrainingPage /> },
  { path: '/hr/holiday-calendar', element: <HolidayCalendarPage /> },
  { path: '/dashboard/manager', element: <ManagerDashboardPage /> },
  { path: '/manager/projects', element: <ProjectsList /> },
  { path: '/manager/projects/:projectId', element: <ProjectDetail /> },
  { path: '/manager/teams/:teamId', element: <TeamMembers /> },
  { path: '/manager/tasks', element: <ManagerTasksPage /> },
  { path: '/manager/catalog/designations', element: <CatalogDesignationsPage role="manager" /> },
  { path: '/manager/catalog/responsibilities', element: <CatalogResponsibilitiesPage role="manager" /> },
  { path: '/manager/profile', element: <EmployeeProfilePage /> },
  { path: '/manager/chat', element: <InternalChatPage /> },
  { path: '/manager/updates/announcements', element: <WorkplaceUpdatesPage role="manager" section="announcements" /> },
  { path: '/manager/updates/notice-board', element: <WorkplaceUpdatesPage role="manager" section="noticeBoard" /> },
  { path: '/manager/updates/upcoming-events', element: <WorkplaceUpdatesPage role="manager" section="upcomingEvents" /> },
  { path: '/manager/leave', element: <Navigate to="/manager/leave/review" replace /> },
  { path: '/manager/leave/review', element: <LeaveReviewPage /> },
  { path: '/manager/leave/requests', element: <LeaveRequestsPage /> },
  { path: '/manager/training', element: <TrainingManagementPage /> },
  { path: '/manager/training/my', element: <TrainingPage /> },
  { path: '/manager/holiday-calendar', element: <HolidayCalendarPage /> },
  { path: '/dashboard/employee', element: <EmployeeDashboardPage /> },
  { path: '/employee/projects', element: <EmployeeProjectsPage /> },
  { path: '/employee/tasks', element: <EmployeeTasksPage /> },
  { path: '/employee/profile', element: <EmployeeProfilePage /> },
  { path: '/employee/chat', element: <InternalChatPage /> },
  { path: '/employee/updates/announcements', element: <WorkplaceUpdatesPage role="employee" section="announcements" /> },
  { path: '/employee/updates/notice-board', element: <WorkplaceUpdatesPage role="employee" section="noticeBoard" /> },
  { path: '/employee/updates/upcoming-events', element: <WorkplaceUpdatesPage role="employee" section="upcomingEvents" /> },
  { path: '/employee/leave', element: <Navigate to="/employee/leave/requests" replace /> },
  { path: '/employee/leave/requests', element: <LeaveRequestsPage /> },
  { path: '/employee/training', element: <TrainingPage /> },
  { path: '/employee/holiday-calendar', element: <HolidayCalendarPage /> },
  { path: '*', element: <NotFoundPage /> },
])

function AppRoutes() {
  return <RouterProvider router={router} />
}

export default AppRoutes
