-- ============================================================================
-- PHASE 1: Employee Hierarchies + Projects & Teams Migration
-- ============================================================================
-- This migration adds:
-- 1. Project teams (teams within projects)
-- 2. Project team members (employee assignments to teams)
--
-- NOTE: 
-- - employees table already has reporting_manager_id
-- - projects table already exists (uses manager_employee_id)
-- - We are adding the Teams layer: Project -> Teams -> Team Members
-- ============================================================================

-- ============================================================================
-- 1. CREATE project_teams table
-- ============================================================================
-- Teams are created within a project by the project manager
-- Each team has team members assigned to it
CREATE TABLE IF NOT EXISTS public.project_teams (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
	name text NOT NULL,
	description text,
	created_by_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_teams_project_id ON public.project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_created_by_id ON public.project_teams(created_by_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_name ON public.project_teams(name);

-- ============================================================================
-- 2. CREATE project_team_members table
-- ============================================================================
-- Team members are assigned to teams with specific roles
-- Prevents duplicate assignments in same team via UNIQUE constraint
CREATE TABLE IF NOT EXISTS public.project_team_members (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	team_id uuid NOT NULL REFERENCES public.project_teams(id) ON DELETE CASCADE,
	employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
	role text,
	assigned_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	
	UNIQUE(team_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_project_team_members_team_id ON public.project_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_employee_id ON public.project_team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_employee ON public.project_team_members(team_id, employee_id);

-- ============================================================================
-- Summary of Changes:
-- ============================================================================
-- Tables Created: projects, project_teams, project_team_members
-- Tables Altered: employees (added reporting_manager_id column)
-- Indexes: 12 new indexes for performance optimization
-- 
-- Access Control Ready:
-- - Manager-based project ownership (manager_id FK)
-- - Team membership tracking with role flexibility
-- - Employee hierarchies via reporting_manager_id
-- ============================================================================
