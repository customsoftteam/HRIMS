-- HRIMS Training Module Setup (Idempotent)
-- Run this file in Supabase SQL Editor.
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keep updated_at fresh on row updates.
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Training programs (one program -> many modules -> one final quiz)
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('mandatory', 'skill-development', 'optional')),
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 1 AND 100),
  created_by_employee_id UUID NOT NULL REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE training_programs
  ADD COLUMN IF NOT EXISTS modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS passing_score INTEGER NOT NULL DEFAULT 70;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_programs_passing_score_check'
  ) THEN
    ALTER TABLE training_programs
      ADD CONSTRAINT training_programs_passing_score_check
      CHECK (passing_score BETWEEN 1 AND 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_training_programs_company_id ON training_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_created_by ON training_programs(created_by_employee_id);

DROP TRIGGER IF EXISTS trg_training_programs_updated_at ON training_programs;
CREATE TRIGGER trg_training_programs_updated_at
BEFORE UPDATE ON training_programs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- 2) Training assignments
CREATE TABLE IF NOT EXISTS training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (completion_status IN ('pending', 'completed')),
  quiz_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz_score INTEGER,
  quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
  quiz_submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE training_assignments
  ADD COLUMN IF NOT EXISTS quiz_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz_score INTEGER,
  ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quiz_submitted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_training_assignments_employee_id ON training_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_training_program_id ON training_assignments(training_program_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_status ON training_assignments(completion_status);

DROP TRIGGER IF EXISTS trg_training_assignments_updated_at ON training_assignments;
CREATE TRIGGER trg_training_assignments_updated_at
BEFORE UPDATE ON training_assignments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- 3) Certificates (issued after passing final quiz)
CREATE TABLE IF NOT EXISTS training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  certificate_number VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_certificates_employee_id ON training_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_training_program_id ON training_certificates(training_program_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_assignment_id ON training_certificates(assignment_id);

-- 4) RLS
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_programs_company_access ON training_programs;
CREATE POLICY training_programs_company_access ON training_programs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM employees
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS training_programs_insert_admin_hr_manager ON training_programs;
CREATE POLICY training_programs_insert_admin_hr_manager ON training_programs
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'hr', 'manager')
    )
  );

DROP POLICY IF EXISTS training_assignments_employee_view ON training_assignments;
CREATE POLICY training_assignments_employee_view ON training_assignments
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR employee_id IN (
      SELECT id
      FROM employees
      WHERE company_id IN (
        SELECT company_id
        FROM employees
        WHERE id = auth.uid()
          AND role IN ('admin', 'hr', 'manager')
      )
    )
  );

DROP POLICY IF EXISTS training_assignments_insert_admin_hr_manager ON training_assignments;
CREATE POLICY training_assignments_insert_admin_hr_manager ON training_assignments
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id
      FROM employees
      WHERE company_id IN (
        SELECT company_id
        FROM employees
        WHERE id = auth.uid()
          AND role IN ('admin', 'hr', 'manager')
      )
    )
  );

DROP POLICY IF EXISTS training_assignments_update_own ON training_assignments;
CREATE POLICY training_assignments_update_own ON training_assignments
  FOR UPDATE
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS training_certificates_view ON training_certificates;
CREATE POLICY training_certificates_view ON training_certificates
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR employee_id IN (
      SELECT id
      FROM employees
      WHERE company_id IN (
        SELECT company_id
        FROM employees
        WHERE id = auth.uid()
          AND role IN ('admin', 'hr', 'manager')
      )
    )
  );

DROP POLICY IF EXISTS training_certificates_insert ON training_certificates;
CREATE POLICY training_certificates_insert ON training_certificates
  FOR INSERT
  WITH CHECK (
    employee_id = auth.uid()
    OR employee_id IN (
      SELECT id
      FROM employees
      WHERE company_id IN (
        SELECT company_id
        FROM employees
        WHERE id = auth.uid()
          AND role IN ('admin', 'hr', 'manager')
      )
    )
  );
