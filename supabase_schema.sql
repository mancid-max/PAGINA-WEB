-- Ejecuta esto en Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  client_rut text,
  client_rut_normalized text,
  total_items integer not null default 0 check (total_items >= 0),
  source text not null default 'web',
  is_ready boolean not null default false,
  ready_at timestamptz,
  created_at_client timestamptz,
  created_at timestamptz not null default now()
);

alter table public.quotes add column if not exists is_ready boolean not null default false;
alter table public.quotes add column if not exists ready_at timestamptz;
alter table public.quotes add column if not exists client_rut text;
alter table public.quotes add column if not exists client_rut_normalized text;

create table if not exists public.quote_items (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  sku text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);
create index if not exists idx_quotes_client_rut_normalized on public.quotes(client_rut_normalized);

create table if not exists public.clients (
  id bigint generated always as identity primary key,
  rut text not null,
  rut_normalized text not null unique,
  razon_social text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_rut_normalized on public.clients(rut_normalized);

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.clients enable row level security;

-- Permite insertar cotizaciones desde el frontend (anon key)
drop policy if exists "anon_insert_quotes" on public.quotes;
create policy "anon_insert_quotes"
on public.quotes
for insert
to anon
with check (true);

drop policy if exists "anon_insert_quote_items" on public.quote_items;
create policy "anon_insert_quote_items"
on public.quote_items
for insert
to anon
with check (true);

-- Opcional: permitir lectura solo a usuarios autenticados del panel de Supabase
drop policy if exists "authenticated_read_quotes" on public.quotes;
create policy "authenticated_read_quotes"
on public.quotes
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_quote_items" on public.quote_items;
create policy "authenticated_read_quote_items"
on public.quote_items
for select
to authenticated
using (true);

-- Permite marcar estado de cotizacion desde panel admin (usuarios autenticados)
drop policy if exists "authenticated_update_quotes" on public.quotes;
create policy "authenticated_update_quotes"
on public.quotes
for update
to authenticated
using (true)
with check (true);

-- Lectura de clientes solo autenticado (panel)
drop policy if exists "authenticated_read_clients" on public.clients;
create policy "authenticated_read_clients"
on public.clients
for select
to authenticated
using (true);

-- Importacion de clientes (solo autenticado)
drop policy if exists "authenticated_insert_clients" on public.clients;
create policy "authenticated_insert_clients"
on public.clients
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_update_clients" on public.clients;
create policy "authenticated_update_clients"
on public.clients
for update
to authenticated
using (true)
with check (true);

-- RPC lookup por RUT para frontend publico (sin exponer tabla completa)
create or replace function public.lookup_client_by_rut(p_rut text)
returns table (
  rut text,
  rut_normalized text,
  razon_social text
)
language sql
security definer
set search_path = public
as $$
  select c.rut, c.rut_normalized, c.razon_social
  from public.clients c
  where c.active = true
    and c.rut_normalized = upper(regexp_replace(coalesce(p_rut, ''), '[^0-9K-]', '', 'g'))
  limit 1;
$$;

revoke all on function public.lookup_client_by_rut(text) from public;
grant execute on function public.lookup_client_by_rut(text) to anon, authenticated;
