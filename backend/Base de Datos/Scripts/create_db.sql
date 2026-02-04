-- =========================================================
-- 0) EXTENSION
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- 1) TYPES
-- =========================================================
do $$ begin
  create type account_role as enum ('ADMIN','MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type access_type as enum ('OWNER','MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_type as enum ('FALL','EMERGENCY_BUTTON','SIMULATED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('OPEN','CONFIRMED_FALL','FALSE_ALARM','RESOLVED');
exception when duplicate_object then null; end $$;

-- =========================================================
-- 2) TABLES
-- =========================================================

create table if not exists public.accounts (
  account_id     uuid primary key default gen_random_uuid(),
  email          varchar(255) unique not null,
  password_hash  varchar(255) not null,
  role           account_role not null,
  full_name      varchar(120),
  phone          varchar(30),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.patients (
  patient_id     uuid primary key default gen_random_uuid(),
  nif            varchar(15) unique not null,
  first_name     varchar(80) not null,
  last_name      varchar(120) not null,
  address_line1  varchar(120) not null,
  address_line2  varchar(120),
  city           varchar(80) not null,
  province       varchar(80),
  postal_code    varchar(12),
  country        varchar(60),
  date_of_birth  date,
  notes          varchar(255),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.devices (
  device_id       varchar(64) primary key, -- ID/MAC estable del ESP32
  patient_id      uuid not null references public.patients(patient_id) on delete restrict,
  alias           varchar(80),
  is_active       boolean not null default true,
  device_key_hash varchar(255),
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.device_access (
  account_id   uuid not null references public.accounts(account_id) on delete cascade,
  device_id    varchar(64) not null references public.devices(device_id) on delete cascade,
  access_type  access_type not null,
  created_at   timestamptz not null default now(),
  primary key (account_id, device_id)
);

-- 1 solo OWNER por device
create unique index if not exists device_single_owner_idx
  on public.device_access(device_id)
  where access_type = 'OWNER';

create table if not exists public.events (
  event_id       uuid primary key default gen_random_uuid(),
  event_uid      uuid not null unique, -- idempotencia (firmware)
  device_id      varchar(64) not null references public.devices(device_id) on delete restrict,
  event_type     event_type not null,
  status         event_status not null default 'OPEN',
  occurred_at    timestamptz not null,
  created_at     timestamptz not null default now(),
  reviewed_by    uuid references public.accounts(account_id),
  reviewed_at    timestamptz,
  review_comment varchar(255)
);

create index if not exists events_device_time_idx
  on public.events(device_id, occurred_at desc);

create table if not exists public.event_samples (
  event_id  uuid not null references public.events(event_id) on delete cascade,
  seq       int  not null,
  t_ms      int  not null,
  acc_x     real not null,
  acc_y     real not null,
  acc_z     real not null,
  primary key (event_id, seq)
);

create or replace view public.v_event_acceleration as
select
  e.event_id,
  e.event_uid,
  e.device_id,
  d.patient_id,
  e.occurred_at,
  s.seq,
  s.t_ms,
  s.acc_x,
  s.acc_y,
  s.acc_z
from public.events e
join public.event_samples s on s.event_id = e.event_id
join public.devices d on d.device_id = e.device_id;

-- =========================================================
-- 3) updated_at triggers (opcional pero recomendado)
-- =========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$ begin
  create trigger trg_accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_devices_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
