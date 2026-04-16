create extension if not exists pgcrypto;

create table if not exists public.chat_conversations (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	participant_a_employee_id uuid not null references public.employees(id) on delete cascade,
	participant_b_employee_id uuid not null references public.employees(id) on delete cascade,
	created_by_employee_id uuid not null references public.employees(id) on delete cascade,
	last_message_at timestamptz null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint chk_chat_conversation_distinct_participants check (participant_a_employee_id <> participant_b_employee_id),
	constraint uq_chat_conversation_pair unique (participant_a_employee_id, participant_b_employee_id)
);

create index if not exists idx_chat_conversations_company_id on public.chat_conversations(company_id);
create index if not exists idx_chat_conversations_participant_a on public.chat_conversations(participant_a_employee_id);
create index if not exists idx_chat_conversations_participant_b on public.chat_conversations(participant_b_employee_id);
create index if not exists idx_chat_conversations_last_message_at on public.chat_conversations(last_message_at desc);

create table if not exists public.chat_messages (
	id uuid primary key default gen_random_uuid(),
	conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
	sender_employee_id uuid not null references public.employees(id) on delete cascade,
	content text not null,
	delivered_at timestamptz null,
	read_at timestamptz null,
	created_at timestamptz not null default now()
);

alter table public.chat_messages add column if not exists delivered_at timestamptz null;
alter table public.chat_messages add column if not exists read_at timestamptz null;

create index if not exists idx_chat_messages_conversation_id on public.chat_messages(conversation_id);
create index if not exists idx_chat_messages_sender_employee_id on public.chat_messages(sender_employee_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at desc);
create index if not exists idx_chat_messages_read_at on public.chat_messages(read_at);
create index if not exists idx_chat_messages_delivered_at on public.chat_messages(delivered_at);

create table if not exists public.leave_types (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	name text not null,
	code text not null,
	is_active boolean not null default true,
	created_by_employee_id uuid null references public.employees(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint uq_leave_types_company_code unique (company_id, code)
);

create index if not exists idx_leave_types_company_id on public.leave_types(company_id);
create index if not exists idx_leave_types_active on public.leave_types(is_active);

create table if not exists public.leave_balances (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	employee_id uuid not null references public.employees(id) on delete cascade,
	leave_type_id uuid not null references public.leave_types(id) on delete cascade,
	year integer not null,
	allocated_days numeric(8,2) not null default 0,
	used_days numeric(8,2) not null default 0,
	carried_forward_days numeric(8,2) not null default 0,
	adjustment_days numeric(8,2) not null default 0,
	is_revoked boolean not null default false,
	revoked_at timestamptz null,
	revoked_by_employee_id uuid null references public.employees(id) on delete set null,
	revocation_reason text null,
	created_by_employee_id uuid null references public.employees(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint uq_leave_balances_employee_type_year unique (employee_id, leave_type_id, year),
	constraint chk_leave_balances_year check (year >= 2000 and year <= 2100)
);

alter table public.leave_balances add column if not exists is_revoked boolean not null default false;
alter table public.leave_balances add column if not exists revoked_at timestamptz null;
alter table public.leave_balances add column if not exists revoked_by_employee_id uuid null references public.employees(id) on delete set null;
alter table public.leave_balances add column if not exists revocation_reason text null;

create index if not exists idx_leave_balances_company_id on public.leave_balances(company_id);
create index if not exists idx_leave_balances_employee_id on public.leave_balances(employee_id);
create index if not exists idx_leave_balances_leave_type_id on public.leave_balances(leave_type_id);
create index if not exists idx_leave_balances_year on public.leave_balances(year);
create index if not exists idx_leave_balances_is_revoked on public.leave_balances(is_revoked);

create table if not exists public.leave_requests (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	employee_id uuid not null references public.employees(id) on delete cascade,
	leave_type_id uuid not null references public.leave_types(id) on delete cascade,
	start_date date not null,
	end_date date not null,
	total_days numeric(6,2) not null,
	reason text not null,
	status text not null default 'pending',
	applied_at timestamptz not null default now(),
	approved_by_employee_id uuid null references public.employees(id) on delete set null,
	approved_at timestamptz null,
	rejection_reason text null,
	approver_comment text null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint chk_leave_requests_status check (status in ('pending', 'approved', 'rejected', 'cancelled')),
	constraint chk_leave_requests_dates check (end_date >= start_date)
);

alter table public.leave_requests add column if not exists approver_comment text null;
alter table public.leave_requests add column if not exists rejection_reason text null;
alter table public.leave_requests add column if not exists approved_by_employee_id uuid null references public.employees(id) on delete set null;
alter table public.leave_requests add column if not exists approved_at timestamptz null;

create index if not exists idx_leave_requests_company_id on public.leave_requests(company_id);
create index if not exists idx_leave_requests_employee_id on public.leave_requests(employee_id);
create index if not exists idx_leave_requests_leave_type_id on public.leave_requests(leave_type_id);
create index if not exists idx_leave_requests_status on public.leave_requests(status);
create index if not exists idx_leave_requests_start_date on public.leave_requests(start_date);

create table if not exists public.public_holidays (
	id uuid primary key default gen_random_uuid(),
	company_id uuid null,
	name text not null,
	holiday_date date not null,
	description text null,
	is_optional boolean not null default false,
	created_by_employee_id uuid null references public.employees(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint uq_public_holidays_company_date_name unique (company_id, holiday_date, name)
);

alter table public.public_holidays add column if not exists description text null;
alter table public.public_holidays add column if not exists is_optional boolean not null default false;

create index if not exists idx_public_holidays_company_id on public.public_holidays(company_id);
create index if not exists idx_public_holidays_holiday_date on public.public_holidays(holiday_date);

create table if not exists public.company_updates (
	id uuid primary key default gen_random_uuid(),
	company_id uuid not null,
	category text not null,
	title text not null,
	content text not null,
	event_date date null,
	is_pinned boolean not null default false,
	published_by_employee_id uuid null references public.employees(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint chk_company_updates_category check (category in ('announcements', 'notice_board', 'upcoming_events'))
);

alter table public.company_updates add column if not exists event_date date null;
alter table public.company_updates add column if not exists is_pinned boolean not null default false;

create index if not exists idx_company_updates_company_id on public.company_updates(company_id);
create index if not exists idx_company_updates_category on public.company_updates(category);
create index if not exists idx_company_updates_event_date on public.company_updates(event_date);
create index if not exists idx_company_updates_created_at on public.company_updates(created_at desc);
