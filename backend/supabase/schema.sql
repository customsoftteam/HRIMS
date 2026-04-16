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

create table if not exists public.designations (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	plant_office_id uuid null references public.plants_offices(id) on delete set null,
	department_id uuid null references public.departments(id) on delete set null,
	name text not null,
	code text null,
	description text null,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_designations_company_id on public.designations(company_id);
create index if not exists idx_designations_plant_office_id on public.designations(plant_office_id);
create index if not exists idx_designations_department_id on public.designations(department_id);
create index if not exists idx_designations_active on public.designations(is_active);

create table if not exists public.designation_responsibilities (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	designation_id uuid not null references public.designations(id) on delete cascade,
	title text not null,
	description text null,
	is_active boolean not null default true,
	created_by_employee_id uuid null references public.employees(id) on delete set null,
	created_by_role text null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_designation_responsibilities_company_id on public.designation_responsibilities(company_id);
create index if not exists idx_designation_responsibilities_designation_id on public.designation_responsibilities(designation_id);
create index if not exists idx_designation_responsibilities_active on public.designation_responsibilities(is_active);
