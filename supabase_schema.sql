-- Ejecuta esto en Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  total_items integer not null default 0 check (total_items >= 0),
  source text not null default 'web',
  created_at_client timestamptz,
  created_at timestamptz not null default now()
);

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

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

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
