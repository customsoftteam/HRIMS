-- Training Module Database Setup
-- Run these SQL queries in your Supabase SQL Editor

-- 1. Create training_programs table
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('mandatory', 'skill-development', 'optional')),
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_by_employee_id UUID NOT NULL REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_programs_company_id ON training_programs(company_id);
CREATE INDEX idx_training_programs_created_by ON training_programs(created_by_employee_id);

-- 2. Create training_assignments table
CREATE TABLE training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (completion_status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_assignments_employee_id ON training_assignments(employee_id);
CREATE INDEX idx_training_assignments_training_program_id ON training_assignments(training_program_id);
CREATE INDEX idx_training_assignments_status ON training_assignments(completion_status);

-- 3. Create training_certificates table
CREATE TABLE training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_number VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_certificates_employee_id ON training_certificates(employee_id);
CREATE INDEX idx_training_certificates_training_program_id ON training_certificates(training_program_id);
CREATE INDEX idx_training_certificates_assignment_id ON training_certificates(assignment_id);

-- Grant permissions
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_programs
CREATE POLICY "training_programs_company_access" ON training_programs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "training_programs_insert_admin_hr" ON training_programs
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- RLS Policies for training_assignments
CREATE POLICY "training_assignments_employee_view" ON training_assignments
  FOR SELECT USING (
    employee_id = auth.uid() OR
    employee_id IN (
      SELECT id FROM employees WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
      )
    )
  );

CREATE POLICY "training_assignments_insert_admin_hr" ON training_assignments
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

CREATE POLICY "training_assignments_update_own" ON training_assignments
  FOR UPDATE USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- RLS Policies for training_certificates
CREATE POLICY "training_certificates_view" ON training_certificates
  FOR SELECT USING (
    employee_id = auth.uid() OR
    employee_id IN (
      SELECT id FROM employees WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

CREATE POLICY "training_certificates_insert" ON training_certificates
  FOR INSERT WITH CHECK (
    employee_id = auth.uid() OR
    employee_id IN (
      SELECT id FROM employees WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );
