import { Router } from 'express'
import { getManagerDashboard } from '../../controller/manager/manager.controller.js'
import {
  getAllProjects,
  getProject,
  addProject,
  editProject,
  removeProject,
  getProjectMembersList,
  addMemberToProject,
  removeMemberFromProject,
  getProjectTeams,
  addProjectTeam,
  editProjectTeam,
  removeProjectTeam,
  getTeamMembersList,
  getEligibleTeamEmployeesList,
  addTeamMemberToTeam,
  editTeamMember,
  removeTeamMemberFromTeam,
  swapTeamMemberController,
} from '../../controller/manager/projects.controller.js'
import { getManagerScopedEmployees } from '../../controller/manager/team.controller.js'
import {
  getManagerProjectsForTasks,
  getManagerTasksList,
  addManagerTask,
  editManagerTask,
  removeManagerTask,
  getManagerTaskUpdates,
  addManagerTaskUpdate,
  removeManagerTaskUpdate,
} from '../../controller/manager/tasks.controller.js'
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js'

const router = Router()

router.get('/dashboard', requireAuth, requireRole('manager'), getManagerDashboard)

// ============================================================================
// Projects Routes
// ============================================================================
router.get('/projects', requireAuth, getAllProjects)
router.get('/projects/:id', requireAuth, getProject)
router.post('/projects', requireAuth, requireRole('manager'), addProject)
router.put('/projects/:id', requireAuth, requireRole('manager'), editProject)
router.delete('/projects/:id', requireAuth, requireRole('manager'), removeProject)
router.get('/projects/:projectId/members', requireAuth, getProjectMembersList)
router.post('/projects/:projectId/members', requireAuth, requireRole('manager'), addMemberToProject)
router.delete('/project-members/:memberId', requireAuth, requireRole('manager'), removeMemberFromProject)

// ============================================================================
// Project Teams Routes
// ============================================================================
router.get('/projects/:projectId/teams', requireAuth, getProjectTeams)
router.post('/projects/:projectId/teams', requireAuth, requireRole('manager'), addProjectTeam)
router.put('/teams/:teamId', requireAuth, requireRole('manager'), editProjectTeam)
router.delete('/teams/:teamId', requireAuth, requireRole('manager'), removeProjectTeam)

// ============================================================================
// Team Members Routes
// ============================================================================
router.get('/teams/:teamId/members', requireAuth, getTeamMembersList)
router.get('/teams/:teamId/eligible-employees', requireAuth, getEligibleTeamEmployeesList)
router.post('/teams/:teamId/members', requireAuth, requireRole('manager'), addTeamMemberToTeam)
router.put('/team-members/:memberId', requireAuth, requireRole('manager'), editTeamMember)
router.delete('/team-members/:memberId', requireAuth, requireRole('manager'), removeTeamMemberFromTeam)
router.post('/teams/:teamId/swap-member', requireAuth, requireRole('manager'), swapTeamMemberController)
router.get('/employees', requireAuth, requireRole('manager'), getManagerScopedEmployees)

// ============================================================================
// Tasks Routes
// ============================================================================
router.get('/tasks/projects', requireAuth, requireRole('manager'), getManagerProjectsForTasks)
router.get('/tasks', requireAuth, requireRole('manager'), getManagerTasksList)
router.post('/tasks', requireAuth, requireRole('manager'), addManagerTask)
router.put('/tasks/:taskId', requireAuth, requireRole('manager'), editManagerTask)
router.delete('/tasks/:taskId', requireAuth, requireRole('manager'), removeManagerTask)
router.get('/tasks/:taskId/updates', requireAuth, requireRole('manager'), getManagerTaskUpdates)
router.post('/tasks/:taskId/updates', requireAuth, requireRole('manager'), addManagerTaskUpdate)
router.delete('/task-updates/:updateId', requireAuth, requireRole('manager'), removeManagerTaskUpdate)

export default router
