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

drop policy if exists "authenticated_delete_quote_items" on public.quote_items;
create policy "authenticated_delete_quote_items"
on public.quote_items
for delete
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

drop policy if exists "authenticated_delete_quotes" on public.quotes;
create policy "authenticated_delete_quotes"
on public.quotes
for delete
to authenticated
using (true);

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

-- ============================================
-- STOCK INTERNO (estructura base tipo Excel)
-- ============================================

create table if not exists public.stock_catalog (
  id bigint generated always as identity primary key,
  article_code text not null,
  sku text not null unique,
  tiro text,
  bota text,
  color text,
  size_36 integer not null default 0 check (size_36 >= 0),
  size_38 integer not null default 0 check (size_38 >= 0),
  size_40 integer not null default 0 check (size_40 >= 0),
  size_42 integer not null default 0 check (size_42 >= 0),
  size_44 integer not null default 0 check (size_44 >= 0),
  size_46 integer not null default 0 check (size_46 >= 0),
  total_units integer generated always as (size_36 + size_38 + size_40 + size_42 + size_44 + size_46) stored,
  active boolean not null default true,
  source text not null default 'admin',
  notes text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_catalog_sku on public.stock_catalog(sku);
create index if not exists idx_stock_catalog_article_code on public.stock_catalog(article_code);
create index if not exists idx_stock_catalog_active on public.stock_catalog(active);

create or replace function public.set_stock_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stock_catalog_updated_at on public.stock_catalog;
create trigger trg_stock_catalog_updated_at
before update on public.stock_catalog
for each row
execute function public.set_stock_catalog_updated_at();

alter table public.stock_catalog enable row level security;

drop policy if exists "authenticated_read_stock_catalog" on public.stock_catalog;
create policy "authenticated_read_stock_catalog"
on public.stock_catalog
for select
to authenticated
using (true);

drop policy if exists "authenticated_insert_stock_catalog" on public.stock_catalog;
create policy "authenticated_insert_stock_catalog"
on public.stock_catalog
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_update_stock_catalog" on public.stock_catalog;
create policy "authenticated_update_stock_catalog"
on public.stock_catalog
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_delete_stock_catalog" on public.stock_catalog;
create policy "authenticated_delete_stock_catalog"
on public.stock_catalog
for delete
to authenticated
using (true);

-- Vista simple para frontend o paneles futuros.
create or replace view public.stock_catalog_web as
select
  sku,
  article_code,
  tiro,
  bota,
  color,
  size_36,
  size_38,
  size_40,
  size_42,
  size_44,
  size_46,
  total_units,
  active,
  updated_at
from public.stock_catalog
where active = true;
