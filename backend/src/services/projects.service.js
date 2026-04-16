import {
  listProjectsByManager,
  listAllProjects,
  findProjectById,
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
  listTeamsByProject,
  findTeamById,
  createTeamRecord,
  updateTeamRecord,
  deleteTeamRecord,
  listTeamMembers,
  findTeamMemberById,
  findTeamMemberByTeamAndEmployee,
  createTeamMemberRecord,
  updateTeamMemberRecord,
  deleteTeamMemberRecord,
  listProjectMembers,
  findProjectMemberByProjectAndEmployee,
  findProjectMemberById,
  createProjectMemberRecord,
  deleteProjectMemberRecord,
} from '../model/manager/projects.model.js'
import {
  findEmployeeById,
  getActiveLocationAssignmentsForEmployee,
  getActiveDepartmentAssignmentsByEmployeeIds,
  getDepartmentMetadataByIds,
  getDesignationMetadataByIds,
} from '../model/admin/user.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

// ============================================================================
// Helper: Get Actor Context
// ============================================================================
const getActorContext = async (actorId) => {
  const { data: actor, error: actorError } = await findEmployeeById(actorId)

  if (actorError) {
    throw createHttpError(actorError.message, 500)
  }

  if (!actor) {
    throw createHttpError('Authenticated user not found.', 401)
  }

  return { actor }
}

const getEmployeeMetaMap = async (employees = []) => {
  const employeeIds = employees.map((row) => row.id).filter(Boolean)

  if (!employeeIds.length) {
    return new Map()
  }

  const designationIds = [...new Set(employees.map((row) => row.designation_id).filter(Boolean))]

  const departmentAssignmentsResult = await getActiveDepartmentAssignmentsByEmployeeIds(employeeIds)

  if (departmentAssignmentsResult.error) {
    throw createHttpError(departmentAssignmentsResult.error.message, 500)
  }

  const departmentIds = [...new Set((departmentAssignmentsResult.data || []).map((row) => row.department_id).filter(Boolean))]

  const [departmentsResult, designationsResult] = await Promise.all([
    getDepartmentMetadataByIds(departmentIds),
    getDesignationMetadataByIds(designationIds),
  ])

  if (departmentsResult.error) {
    throw createHttpError(departmentsResult.error.message, 500)
  }

  if (designationsResult.error) {
    throw createHttpError(designationsResult.error.message, 500)
  }

  const departmentAssignmentMap = new Map((departmentAssignmentsResult.data || []).map((row) => [row.employee_id, row]))
  const departmentMap = new Map((departmentsResult.data || []).map((row) => [row.id, row]))
  const designationMap = new Map((designationsResult.data || []).map((row) => [row.id, row]))

  const metaMap = new Map()
  employees.forEach((employee) => {
    const departmentAssignment = departmentAssignmentMap.get(employee.id) || null
    const departmentMeta = departmentAssignment ? departmentMap.get(departmentAssignment.department_id) || null : null
    const designationMeta = employee.designation_id ? designationMap.get(employee.designation_id) || null : null

    metaMap.set(employee.id, {
      department: departmentMeta
        ? {
            id: departmentMeta.id,
            name: departmentMeta.name,
            code: departmentMeta.code,
          }
        : null,
      designation: designationMeta
        ? {
            id: designationMeta.id,
            name: designationMeta.name,
          }
        : null,
    })
  })

  return metaMap
}

// ============================================================================
// PROJECTS Service
// ============================================================================

export const getProjectsList = async ({ actorId, role }) => {
  const { actor } = await getActorContext(actorId)

  let result

  // Managers see only their own projects, admins/HR see all
  if (role === 'manager') {
    result = await listProjectsByManager(actorId)
  } else {
    result = await listAllProjects()
  }

  if (result.error) {
    throw createHttpError(result.error.message, 500)
  }

  const projects = result.data || []

  // Enrich each project with manager details and team count
  const enriched = await Promise.all(
    projects.map(async (project) => {
      const managerResult = await findEmployeeById(project.manager_employee_id)
      const teamResult = await listTeamsByProject(project.id)

      const manager = !managerResult.error && managerResult.data ? managerResult.data : null
      const teams = !teamResult.error && teamResult.data ? teamResult.data : []

      return {
        ...project,
        manager: manager
          ? {
              id: manager.id,
              first_name: manager.first_name,
              last_name: manager.last_name,
              email: manager.email,
            }
          : null,
        team_count: teams.length,
      }
    })
  )

  return enriched
}

export const getProjectDetail = async ({ projectId, actorId, role }) => {
  const { actor } = await getActorContext(actorId)
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  // Access control: manager can only see own projects
  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('You do not have access to this project', 403)
  }

  const managerResult = await findEmployeeById(project.manager_employee_id)
  const manager = !managerResult.error && managerResult.data ? managerResult.data : null

  const teamsResult = await listTeamsByProject(projectId)
  const teams = !teamsResult.error && teamsResult.data ? teamsResult.data : []

  const enrichedTeams = await Promise.all(
    teams.map(async (team) => {
      const membersResult = await listTeamMembers(team.id)
      const members = !membersResult.error && membersResult.data ? membersResult.data : []
      return {
        ...team,
        member_count: members.length,
      }
    })
  )

  return {
    ...project,
    manager: manager
      ? {
          id: manager.id,
          first_name: manager.first_name,
          last_name: manager.last_name,
          email: manager.email,
        }
      : null,
    teams: enrichedTeams,
  }
}

export const getProjectMembers = async ({ projectId, actorId, role }) => {
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('You do not have access to this project', 403)
  }

  const { data: members, error } = await listProjectMembers(projectId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const employeeRows = (
    await Promise.all(
      (members || []).map(async (member) => {
        const employeeResult = await findEmployeeById(member.employee_id)
        return !employeeResult.error && employeeResult.data ? employeeResult.data : null
      })
    )
  ).filter(Boolean)

  const employeeMap = new Map(employeeRows.map((row) => [row.id, row]))
  const employeeMetaMap = await getEmployeeMetaMap(employeeRows)

  const enriched = (members || []).map((member) => {
    const employee = employeeMap.get(member.employee_id) || null
    const employeeMeta = employee ? employeeMetaMap.get(employee.id) || { department: null, designation: null } : null

    return {
      ...member,
      employee: employee
        ? {
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            employee_code: employee.employee_code,
            department: employeeMeta?.department || null,
            designation: employeeMeta?.designation || null,
          }
        : null,
    }
  })

  return enriched
}

export const addProjectMember = async ({ projectId, actorId, role, employeeId, memberRole }) => {
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can add project members', 403)
  }

  const { data: employee, error: employeeError } = await findEmployeeById(employeeId)
  if (employeeError) {
    throw createHttpError(employeeError.message, 500)
  }
  if (!employee) {
    throw createHttpError('Employee not found', 404)
  }

  const { data: existing, error: existingError } = await findProjectMemberByProjectAndEmployee(projectId, employeeId)
  if (existingError) {
    throw createHttpError(existingError.message, 500)
  }
  if (existing) {
    throw createHttpError('Employee already associated with this project', 409)
  }

  const { data, error } = await createProjectMemberRecord({
    project_id: projectId,
    employee_id: employeeId,
    member_role: memberRole || null,
  })

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return data
}

export const removeProjectMember = async ({ memberId, actorId, role }) => {
  const { data: member, error: memberError } = await findProjectMemberById(memberId)

  if (memberError) {
    throw createHttpError(memberError.message, 500)
  }

  if (!member) {
    throw createHttpError('Project member not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(member.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can remove project members', 403)
  }

  const { error } = await deleteProjectMemberRecord(memberId)
  if (error) {
    throw createHttpError(error.message, 500)
  }

  return { success: true, id: memberId }
}

export const createProject = async ({ actorId, projectData }) => {
  // Only managers can create projects
  const { actor } = await getActorContext(actorId)

  const payload = {
    code: projectData.code || null,
    name: projectData.name,
    description: projectData.description || null,
    manager_employee_id: actorId, // Always assign to requesting manager
    status: projectData.status || 'active',
    start_date: projectData.start_date || null,
    end_date: projectData.end_date || null,
  }

  const { data: project, error } = await createProjectRecord(payload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return project
}

export const updateProject = async ({ projectId, actorId, role, projectData }) => {
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  // Only project manager or admin can update
  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can update this project', 403)
  }

  const payload = {
    ...(projectData.name !== undefined && { name: projectData.name }),
    ...(projectData.description !== undefined && { description: projectData.description }),
    ...(projectData.status !== undefined && { status: projectData.status }),
    ...(projectData.start_date !== undefined && { start_date: projectData.start_date }),
    ...(projectData.end_date !== undefined && { end_date: projectData.end_date }),
  }

  const { data: updated, error: updateError } = await updateProjectRecord(projectId, payload)

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  return updated
}

export const deleteProject = async ({ projectId, actorId, role }) => {
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can delete this project', 403)
  }

  const { error } = await deleteProjectRecord(projectId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return { success: true, id: projectId }
}

// ============================================================================
// PROJECT TEAMS Service
// ============================================================================

export const getTeamsList = async ({ projectId, actorId, role }) => {
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('You do not have access to this project', 403)
  }

  const { data: teams, error } = await listTeamsByProject(projectId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const enriched = await Promise.all(
    (teams || []).map(async (team) => {
      const membersResult = await listTeamMembers(team.id)
      const members = !membersResult.error && membersResult.data ? membersResult.data : []

      const creatorResult = await findEmployeeById(team.created_by_id)
      const creator = !creatorResult.error && creatorResult.data ? creatorResult.data : null

      return {
        ...team,
        creator: creator
          ? {
              id: creator.id,
              first_name: creator.first_name,
              last_name: creator.last_name,
              email: creator.email,
            }
          : null,
        member_count: members.length,
      }
    })
  )

  return enriched
}

export const createTeam = async ({ projectId, actorId, role, teamData }) => {
  const { data: project, error: projectError } = await findProjectById(projectId)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  // Only project manager can create teams
  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can create teams', 403)
  }

  const payload = {
    project_id: projectId,
    name: teamData.name,
    description: teamData.description || null,
    created_by_id: actorId,
  }

  const { data: team, error } = await createTeamRecord(payload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return team
}

export const updateTeam = async ({ teamId, actorId, role, teamData }) => {
  const { data: team, error: teamError } = await findTeamById(teamId)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  if (!team) {
    throw createHttpError('Team not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can update team', 403)
  }

  const payload = {
    ...(teamData.name !== undefined && { name: teamData.name }),
    ...(teamData.description !== undefined && { description: teamData.description }),
  }

  const { data: updated, error: updateError } = await updateTeamRecord(teamId, payload)

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  return updated
}

export const deleteTeam = async ({ teamId, actorId, role }) => {
  const { data: team, error: teamError } = await findTeamById(teamId)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  if (!team) {
    throw createHttpError('Team not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can delete team', 403)
  }

  const { error } = await deleteTeamRecord(teamId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return { success: true, id: teamId }
}

// ============================================================================
// TEAM MEMBERS Service
// ============================================================================

export const getTeamMembers = async ({ teamId, actorId, role }) => {
  const { data: team, error: teamError } = await findTeamById(teamId)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  if (!team) {
    throw createHttpError('Team not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('You do not have access to this team', 403)
  }

  const { data: members, error } = await listTeamMembers(teamId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const employeeRows = (
    await Promise.all(
      (members || []).map(async (member) => {
        const employeeResult = await findEmployeeById(member.employee_id)
        return !employeeResult.error && employeeResult.data ? employeeResult.data : null
      })
    )
  ).filter(Boolean)

  const employeeMap = new Map(employeeRows.map((row) => [row.id, row]))
  const employeeMetaMap = await getEmployeeMetaMap(employeeRows)

  const enriched = (members || []).map((member) => {
    const employee = employeeMap.get(member.employee_id) || null
    const employeeMeta = employee ? employeeMetaMap.get(employee.id) || { department: null, designation: null } : null

    return {
      ...member,
      employee: employee
        ? {
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            employee_code: employee.employee_code,
            department: employeeMeta?.department || null,
            designation: employeeMeta?.designation || null,
          }
        : null,
    }
  })

  return enriched
}

export const getEligibleTeamEmployees = async ({ teamId, actorId, role }) => {
  const { data: team, error: teamError } = await findTeamById(teamId)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  if (!team) {
    throw createHttpError('Team not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (!project) {
    throw createHttpError('Project not found', 404)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('You do not have access to this team', 403)
  }

  const { data: projectMembers, error: projectMembersError } = await listProjectMembers(project.id)

  if (projectMembersError) {
    throw createHttpError(projectMembersError.message, 500)
  }

  const projectMemberRows = projectMembers || []
  const employeeIds = [...new Set(projectMemberRows.map((row) => row.employee_id).filter(Boolean))]

  const { data: existingTeamMembers, error: teamMembersError } = await listTeamMembers(teamId)

  if (teamMembersError) {
    throw createHttpError(teamMembersError.message, 500)
  }

  const existingTeamMemberIds = new Set((existingTeamMembers || []).map((row) => row.employee_id))

  const employeeRows = (
    await Promise.all(
      employeeIds.map(async (employeeId) => {
        const { data: employee, error } = await findEmployeeById(employeeId)
        if (error || !employee) {
          return null
        }
        return employee
      })
    )
  ).filter(Boolean)

  const employeeMetaMap = await getEmployeeMetaMap(employeeRows)
  const employeeMap = new Map(employeeRows.map((row) => [row.id, row]))

  const employees = employeeIds.map((employeeId) => {
      const employee = employeeMap.get(employeeId)
      if (!employee) {
        return null
      }

      const employeeMeta = employeeMetaMap.get(employee.id) || { department: null, designation: null }
      const projectMembership = projectMemberRows.find((row) => row.employee_id === employeeId)

      return {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        employee_code: employee.employee_code,
        department: employeeMeta.department,
        designation: employeeMeta.designation,
        project_member_role: projectMembership?.member_role || null,
        already_in_team: existingTeamMemberIds.has(employee.id),
      }
    })

  return {
    team: { id: team.id, name: team.name, project_id: team.project_id },
    project: { id: project.id, name: project.name, code: project.code },
    employees: employees.filter(Boolean),
  }
}

export const addTeamMember = async ({ teamId, actorId, role, memberData }) => {
  const { data: team, error: teamError } = await findTeamById(teamId)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  if (!team) {
    throw createHttpError('Team not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can add team members', 403)
  }

  const { data: projectMembership, error: projectMembershipError } = await findProjectMemberByProjectAndEmployee(
    project.id,
    memberData.employee_id
  )

  if (projectMembershipError) {
    throw createHttpError(projectMembershipError.message, 500)
  }

  if (!projectMembership) {
    throw createHttpError('Employee is not associated with this project.', 400)
  }

  // Check if employee already in team
  const { data: existing, error: existingError } = await findTeamMemberByTeamAndEmployee(
    teamId,
    memberData.employee_id
  )

  if (!existingError && existing) {
    throw createHttpError('Employee already in this team', 409)
  }

  const payload = {
    team_id: teamId,
    employee_id: memberData.employee_id,
    role: memberData.role || null,
  }

  const { data: member, error } = await createTeamMemberRecord(payload)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  const { data: employee, error: employeeError } = await findEmployeeById(member.employee_id)

  if (employeeError) {
    throw createHttpError(employeeError.message, 500)
  }

  if (!employee) {
    return member
  }

  const employeeMetaMap = await getEmployeeMetaMap([employee])
  const employeeMeta = employeeMetaMap.get(employee.id) || { department: null, designation: null }

  return {
    ...member,
    employee: {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      employee_code: employee.employee_code,
      department: employeeMeta.department,
      designation: employeeMeta.designation,
    },
  }
}

export const updateTeamMember = async ({ memberId, actorId, role, memberData }) => {
  const { data: member, error: memberError } = await findTeamMemberById(memberId)

  if (memberError) {
    throw createHttpError(memberError.message, 500)
  }

  if (!member) {
    throw createHttpError('Team member not found', 404)
  }

  const { data: team, error: teamError } = await findTeamById(member.team_id)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can update team members', 403)
  }

  const payload = {
    ...(memberData.role !== undefined && { role: memberData.role }),
  }

  const { data: updated, error: updateError } = await updateTeamMemberRecord(memberId, payload)

  if (updateError) {
    throw createHttpError(updateError.message, 500)
  }

  return updated
}

export const removeTeamMember = async ({ memberId, actorId, role }) => {
  const { data: member, error: memberError } = await findTeamMemberById(memberId)

  if (memberError) {
    throw createHttpError(memberError.message, 500)
  }

  if (!member) {
    throw createHttpError('Team member not found', 404)
  }

  const { data: team, error: teamError } = await findTeamById(member.team_id)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can remove team members', 403)
  }

  const { error } = await deleteTeamMemberRecord(memberId)

  if (error) {
    throw createHttpError(error.message, 500)
  }

  return { success: true, id: memberId }
}

export const swapTeamMember = async ({ teamId, actorId, role, oldEmployeeId, newEmployeeId }) => {
  const { data: team, error: teamError } = await findTeamById(teamId)

  if (teamError) {
    throw createHttpError(teamError.message, 500)
  }

  if (!team) {
    throw createHttpError('Team not found', 404)
  }

  const { data: project, error: projectError } = await findProjectById(team.project_id)

  if (projectError) {
    throw createHttpError(projectError.message, 500)
  }

  if (role === 'manager' && project.manager_employee_id !== actorId) {
    throw createHttpError('Only project manager can swap team members', 403)
  }

  const { data: newProjectMembership, error: newProjectMembershipError } = await findProjectMemberByProjectAndEmployee(
    project.id,
    newEmployeeId
  )

  if (newProjectMembershipError) {
    throw createHttpError(newProjectMembershipError.message, 500)
  }

  if (!newProjectMembership) {
    throw createHttpError('Replacement employee is not associated with this project.', 400)
  }

  // Find old member
  const { data: oldMember, error: oldError } = await findTeamMemberByTeamAndEmployee(teamId, oldEmployeeId)

  if (oldError && oldError.code !== 'PGRST116') {
    throw createHttpError(oldError.message, 500)
  }

  if (!oldMember) {
    throw createHttpError('Original team member not found', 404)
  }

  // Check if new employee already in team
  const { data: existing, error: existingError } = await findTeamMemberByTeamAndEmployee(teamId, newEmployeeId)

  if (!existingError && existing) {
    throw createHttpError('New employee already in this team', 409)
  }

  // Create new member with same role
  const { data: newMember, error: createError } = await createTeamMemberRecord({
    team_id: teamId,
    employee_id: newEmployeeId,
    role: oldMember.role,
  })

  if (createError) {
    throw createHttpError(createError.message, 500)
  }

  // Remove old member
  const { error: deleteError } = await deleteTeamMemberRecord(oldMember.id)

  if (deleteError) {
    throw createHttpError(deleteError.message, 500)
  }

  return {
    success: true,
    old_member_id: oldMember.id,
    new_member_id: newMember.id,
    message: 'Team member swapped successfully',
  }
}
