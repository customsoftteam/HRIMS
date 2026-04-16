create extension if not exists pgcrypto;

create table if not exists public.employee_profiles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  company_id uuid null,
  personal_details jsonb not null default '{}'::jsonb,
  family_details jsonb not null default '{}'::jsonb,
  academic_details jsonb not null default '{}'::jsonb,
  professional_details jsonb not null default '{}'::jsonb,
  health_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employee_profiles_employee_id on public.employee_profiles(employee_id);
create index if not exists idx_employee_profiles_company_id on public.employee_profiles(company_id);
