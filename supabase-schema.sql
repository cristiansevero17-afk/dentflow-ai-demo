create table if not exists product_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists whatsapp_events (
  id text primary key,
  from_phone text,
  patient_name text,
  message_text text,
  analysis jsonb,
  action text,
  reply text,
  sent boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

alter table product_state enable row level security;
alter table whatsapp_events enable row level security;

drop policy if exists "service role can manage product state" on product_state;
create policy "service role can manage product state"
  on product_state
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role can manage whatsapp events" on whatsapp_events;
create policy "service role can manage whatsapp events"
  on whatsapp_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
