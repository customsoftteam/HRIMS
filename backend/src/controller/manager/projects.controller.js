import {
  getProjectsList,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getTeamsList,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  getEligibleTeamEmployees,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  swapTeamMember,
} from '../../services/projects.service.js'

// ============================================================================
// PROJECTS Controllers
// ============================================================================

export const getAllProjects = async (req, res) => {
  try {
    const actorId = req.user.sub
    const { role } = req.user

    const projects = await getProjectsList({ actorId, role })
    res.json({ success: true, data: projects })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const getProject = async (req, res) => {
  try {
    const { id: projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const project = await getProjectDetail({ projectId, actorId, role })
    res.json({ success: true, data: project })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const addProject = async (req, res) => {
  try {
    const actorId = req.user.sub
    const projectData = req.body

    const project = await createProject({ actorId, projectData })
    res.status(201).json({ success: true, data: project })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const editProject = async (req, res) => {
  try {
    const { id: projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const projectData = req.body

    const project = await updateProject({ projectId, actorId, role, projectData })
    res.json({ success: true, data: project })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const removeProject = async (req, res) => {
  try {
    const { id: projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const result = await deleteProject({ projectId, actorId, role })
    res.json({ success: true, data: result })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const getProjectMembersList = async (req, res) => {
  try {
    const { projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const members = await getProjectMembers({ projectId, actorId, role })
    res.json({ success: true, data: members })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const addMemberToProject = async (req, res) => {
  try {
    const { projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const { employee_id: employeeId, member_role: memberRole } = req.body

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employee_id is required' })
    }

    const member = await addProjectMember({ projectId, actorId, role, employeeId, memberRole })
    res.status(201).json({ success: true, data: member })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const removeMemberFromProject = async (req, res) => {
  try {
    const { memberId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const result = await removeProjectMember({ memberId, actorId, role })
    res.json({ success: true, data: result })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

// ============================================================================
// PROJECT TEAMS Controllers
// ============================================================================

export const getProjectTeams = async (req, res) => {
  try {
    const { projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const teams = await getTeamsList({ projectId, actorId, role })
    res.json({ success: true, data: teams })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const addProjectTeam = async (req, res) => {
  try {
    const { projectId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const teamData = req.body

    const team = await createTeam({ projectId, actorId, role, teamData })
    res.status(201).json({ success: true, data: team })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const editProjectTeam = async (req, res) => {
  try {
    const { teamId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const teamData = req.body

    const team = await updateTeam({ teamId, actorId, role, teamData })
    res.json({ success: true, data: team })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const removeProjectTeam = async (req, res) => {
  try {
    const { teamId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const result = await deleteTeam({ teamId, actorId, role })
    res.json({ success: true, data: result })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

// ============================================================================
// TEAM MEMBERS Controllers
// ============================================================================

export const getTeamMembersList = async (req, res) => {
  try {
    const { teamId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const members = await getTeamMembers({ teamId, actorId, role })
    res.json({ success: true, data: members })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const getEligibleTeamEmployeesList = async (req, res) => {
  try {
    const { teamId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const eligible = await getEligibleTeamEmployees({ teamId, actorId, role })
    res.json({ success: true, data: eligible })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const addTeamMemberToTeam = async (req, res) => {
  try {
    const { teamId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const memberData = req.body

    const member = await addTeamMember({ teamId, actorId, role, memberData })
    res.status(201).json({ success: true, data: member })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const editTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const memberData = req.body

    const member = await updateTeamMember({ memberId, actorId, role, memberData })
    res.json({ success: true, data: member })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const removeTeamMemberFromTeam = async (req, res) => {
  try {
    const { memberId } = req.params
    const actorId = req.user.sub
    const { role } = req.user

    const result = await removeTeamMember({ memberId, actorId, role })
    res.json({ success: true, data: result })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}

export const swapTeamMemberController = async (req, res) => {
  try {
    const { teamId } = req.params
    const actorId = req.user.sub
    const { role } = req.user
    const { old_employee_id: oldEmployeeId, new_employee_id: newEmployeeId } = req.body

    if (!oldEmployeeId || !newEmployeeId) {
      return res
        .status(400)
        .json({ success: false, message: 'Both old_employee_id and new_employee_id are required' })
    }

    const result = await swapTeamMember({ teamId, actorId, role, oldEmployeeId, newEmployeeId })
    res.json({ success: true, data: result })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message })
  }
}
