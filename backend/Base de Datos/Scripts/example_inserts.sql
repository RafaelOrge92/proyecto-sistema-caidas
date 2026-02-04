-- =========================================
-- SEEDS (idempotente) - SUPABASE
-- =========================================

-- 1) ACCOUNTS
insert into public.accounts (email, password_hash, role, full_name, phone)
values
  ('superadmin@demo.local', 'hash', 'ADMIN',  'Super Admin', '+34 600 000 001'),
  ('maria@demo.local',      'hash', 'MEMBER', 'María López', '+34 600 000 002'),
  ('pablo@demo.local',      'hash', 'MEMBER', 'Pablo López', '+34 600 000 003'),
  ('lucia@demo.local',      'hash', 'MEMBER', 'Lucía Pérez', '+34 600 000 004')
on conflict (email) do nothing;

-- 2) PATIENTS (personas cuidadas)
insert into public.patients (nif, first_name, last_name, address_line1, city, province, postal_code, country, date_of_birth, notes)
values
  ('00000000X', 'Carmen', 'García', 'Calle Falsa 123', 'Madrid',  'Madrid',  '28001', 'ES', '1940-05-12', 'Paciente demo 1'),
  ('11111111H', 'Antonio','Pérez',  'Av. Ejemplo 45',  'Valencia','Valencia','46001', 'ES', '1938-11-03', 'Paciente demo 2')
on conflict (nif) do nothing;

-- Helper CTEs: obtener IDs
with
a as (
  select
    (select account_id from public.accounts where email='maria@demo.local')  as maria_id,
    (select account_id from public.accounts where email='pablo@demo.local')  as pablo_id,
    (select account_id from public.accounts where email='lucia@demo.local')  as lucia_id
),
p as (
  select
    (select patient_id from public.patients where nif='00000000X') as carmen_pid,
    (select patient_id from public.patients where nif='11111111H') as antonio_pid
)
-- 3) DEVICES
insert into public.devices (device_id, patient_id, alias, is_active, last_seen_at)
select * from (
  values
    ('ESP32-001', (select carmen_pid from p),  'Salón (Casa Carmen)', true,  now() - interval '2 minutes'),
    ('ESP32-002', (select antonio_pid from p), 'Dormitorio (Casa Antonio)', true, now() - interval '25 minutes')
) as v(device_id, patient_id, alias, is_active, last_seen_at)
on conflict (device_id) do update
set patient_id = excluded.patient_id,
    alias = excluded.alias,
    is_active = excluded.is_active,
    last_seen_at = excluded.last_seen_at;

-- 4) DEVICE_ACCESS (OWNER + MEMBER)
with
a as (
  select
    (select account_id from public.accounts where email='maria@demo.local')  as maria_id,
    (select account_id from public.accounts where email='pablo@demo.local')  as pablo_id,
    (select account_id from public.accounts where email='lucia@demo.local')  as lucia_id
)
insert into public.device_access (account_id, device_id, access_type)
values
  ((select maria_id from a), 'ESP32-001', 'OWNER'),
  ((select pablo_id from a), 'ESP32-001', 'MEMBER'),
  ((select lucia_id from a), 'ESP32-001', 'MEMBER'),

  ((select lucia_id from a), 'ESP32-002', 'OWNER'),
  ((select maria_id from a), 'ESP32-002', 'MEMBER')
on conflict (account_id, device_id) do update
set access_type = excluded.access_type;

-- 5) EVENTS (con event_uid para idempotencia)
-- Creamos 4 eventos: 2 para ESP32-001, 2 para ESP32-002
insert into public.events (event_uid, device_id, event_type, status, occurred_at, reviewed_by, reviewed_at, review_comment)
values
  -- Evento 1: caída abierta (sin revisar)
  ('11111111-1111-4111-8111-111111111111', 'ESP32-001', 'FALL', 'OPEN',
   now() - interval '45 minutes', null, null, null),

  -- Evento 2: botón emergencia confirmado
  ('22222222-2222-4222-8222-222222222222', 'ESP32-001', 'EMERGENCY_BUTTON', 'CONFIRMED_FALL',
   now() - interval '2 hours',
   (select account_id from public.accounts where email='pablo@demo.local'),
   now() - interval '1 hour 55 minutes',
   'Se llamó al 112 y se atendió.'),

  -- Evento 3: simulación falsa alarma
  ('33333333-3333-4333-8333-333333333333', 'ESP32-002', 'SIMULATED', 'FALSE_ALARM',
   now() - interval '1 day 3 hours',
   (select account_id from public.accounts where email='lucia@demo.local'),
   now() - interval '1 day 2 hours 50 minutes',
   'Era una prueba.'),

  -- Evento 4: caída resuelta
  ('44444444-4444-4444-8444-444444444444', 'ESP32-002', 'FALL', 'RESOLVED',
   now() - interval '30 minutes',
   (select account_id from public.accounts where email='maria@demo.local'),
   now() - interval '20 minutes',
   'Se revisó, todo bien.')
on conflict (event_uid) do nothing;

-- 6) EVENT_SAMPLES (para gráfica) - 2 eventos con 60 muestras cada uno (simplificado)
-- Generamos muestras para:
--  - Evento 1 (FALL OPEN) en ESP32-001
--  - Evento 4 (FALL RESOLVED) en ESP32-002
with e as (
  select event_id, event_uid
  from public.events
  where event_uid in (
    '11111111-1111-4111-8111-111111111111',
    '44444444-4444-4444-8444-444444444444'
  )
),
series as (
  select
    e.event_id,
    e.event_uid,
    gs as seq,
    (gs * 20) - 600 as t_ms  -- ventana ~0.6s a 50Hz (20ms)
  from e
  cross join generate_series(0, 59) as gs
)
insert into public.event_samples (event_id, seq, t_ms, acc_x, acc_y, acc_z)
select
  s.event_id,
  s.seq,
  s.t_ms,
  -- señales "fake" con algo de forma para que la gráfica tenga pinta:
  case
    when s.event_uid = '11111111-1111-4111-8111-111111111111' and s.seq between 20 and 30 then 2.8
    when s.event_uid = '44444444-4444-4444-8444-444444444444' and s.seq between 25 and 35 then 3.2
    else 0.12
  end as acc_x,
  case
    when s.seq between 22 and 28 then -1.6
    else 0.05
  end as acc_y,
  case
    when s.seq between 24 and 32 then 6.5
    else 9.81
  end as acc_z
from series s
on conflict (event_id, seq) do update
set t_ms = excluded.t_ms,
    acc_x = excluded.acc_x,
    acc_y = excluded.acc_y,
    acc_z = excluded.acc_z;
