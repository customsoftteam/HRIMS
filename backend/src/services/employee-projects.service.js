import { supabase } from '../config/supabase.js'
import { findEmployeeById } from '../model/admin/user.model.js'

const createHttpError = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getEmployeeProjectsRaw = async (employeeId) => {
  const [directMembershipResult, teamMembershipResult] = await Promise.all([
    supabase
      .from('project_members')
      .select('project_id, member_role, joined_on')
      .eq('employee_id', employeeId),
    supabase
      .from('project_team_members')
      .select('team_id, role, assigned_at')
      .eq('employee_id', employeeId),
  ])

  if (directMembershipResult.error) {
    throw createHttpError(directMembershipResult.error.message, 500)
  }

  if (teamMembershipResult.error) {
    throw createHttpError(teamMembershipResult.error.message, 500)
  }

  const directMemberships = directMembershipResult.data || []
  const teamMemberships = teamMembershipResult.data || []

  let teamRows = []
  if (teamMemberships.length) {
    const teamIds = [...new Set(teamMemberships.map((row) => row.team_id))]
    const teamResult = await supabase
      .from('project_teams')
      .select('id, project_id, name')
      .in('id', teamIds)

    if (teamResult.error) {
      throw createHttpError(teamResult.error.message, 500)
    }

    teamRows = teamResult.data || []
  }

  const projectIds = new Set(directMemberships.map((row) => row.project_id))
  teamRows.forEach((team) => {
    if (team.project_id) {
      projectIds.add(team.project_id)
    }
  })

  if (!projectIds.size) {
    return []
  }

  const projectResult = await supabase
    .from('projects')
    .select('id, code, name, description, status, start_date, end_date, manager_employee_id, created_at, updated_at')
    .in('id', [...projectIds])
    .order('created_at', { ascending: false })

  if (projectResult.error) {
    throw createHttpError(projectResult.error.message, 500)
  }

  const projects = projectResult.data || []
  const teamById = new Map(teamRows.map((team) => [team.id, team]))

  const directByProjectId = new Map()
  directMemberships.forEach((membership) => {
    if (!directByProjectId.has(membership.project_id)) {
      directByProjectId.set(membership.project_id, membership)
    }
  })

  const teamsByProjectId = new Map()
  teamMemberships.forEach((membership) => {
    const team = teamById.get(membership.team_id)
    if (!team?.project_id) {
      return
    }

    if (!teamsByProjectId.has(team.project_id)) {
      teamsByProjectId.set(team.project_id, [])
    }

    teamsByProjectId.get(team.project_id).push({
      team_id: team.id,
      team_name: team.name,
      team_role: membership.role || null,
      assigned_at: membership.assigned_at,
    })
  })

  const managerIds = [...new Set(projects.map((project) => project.manager_employee_id).filter(Boolean))]
  const managerMap = new Map()

  await Promise.all(
    managerIds.map(async (managerId) => {
      const { data: manager, error } = await findEmployeeById(managerId)
      if (!error && manager) {
        managerMap.set(managerId, {
          id: manager.id,
          first_name: manager.first_name,
          last_name: manager.last_name,
          email: manager.email,
        })
      }
    })
  )

  return projects.map((project) => ({
    ...project,
    manager: managerMap.get(project.manager_employee_id) || null,
    direct_membership: directByProjectId.get(project.id)
      ? {
          member_role: directByProjectId.get(project.id).member_role || null,
          joined_on: directByProjectId.get(project.id).joined_on || null,
        }
      : null,
    team_memberships: teamsByProjectId.get(project.id) || [],
  }))
}

export const getEmployeeProjects = async ({ actorId }) => {
  const { data: actor, error: actorError } = await findEmployeeById(actorId)

  if (actorError) {
    throw createHttpError(actorError.message, 500)
  }

  if (!actor) {
    throw createHttpError('Authenticated employee not found.', 401)
  }

  return getEmployeeProjectsRaw(actorId)
}
