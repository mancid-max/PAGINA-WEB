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
alter table public.quotes add column if not exists client_phone text;

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

create or replace function public.register_client_if_missing(
  p_rut text,
  p_razon_social text
)
returns table (
  rut text,
  rut_normalized text,
  razon_social text,
  created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rut_normalized text := upper(regexp_replace(coalesce(p_rut, ''), '[^0-9K-]', '', 'g'));
  v_rut text := coalesce(nullif(trim(p_rut), ''), v_rut_normalized);
  v_razon_social text := trim(coalesce(p_razon_social, ''));
  v_out_rut text;
  v_out_rut_normalized text;
  v_out_razon_social text;
  v_out_created boolean;
begin
  if v_rut_normalized = '' then
    raise exception 'RUT inválido';
  end if;

  if v_razon_social = '' then
    raise exception 'Razón social requerida';
  end if;

  insert into public.clients (rut, rut_normalized, razon_social, active)
  values (v_rut, v_rut_normalized, v_razon_social, true)
  on conflict (rut_normalized) do update
    set rut = excluded.rut,
        razon_social = excluded.razon_social,
        active = true
  returning clients.rut, clients.rut_normalized, clients.razon_social,
    (xmax = 0) as created
  into v_out_rut, v_out_rut_normalized, v_out_razon_social, v_out_created;

  rut := v_out_rut;
  rut_normalized := v_out_rut_normalized;
  razon_social := v_out_razon_social;
  created := v_out_created;

  return next;
end;
$$;

revoke all on function public.register_client_if_missing(text, text) from public;
grant execute on function public.register_client_if_missing(text, text) to anon, authenticated;

create or replace function public.create_quote_with_stock_reservation(
  p_quote jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote_id uuid := coalesce(nullif(p_quote->>'id', '')::uuid, gen_random_uuid());
  v_store_name text := trim(coalesce(p_quote->>'store_name', ''));
  v_client_rut text := nullif(trim(coalesce(p_quote->>'client_rut', '')), '');
  v_client_rut_normalized text := nullif(trim(coalesce(p_quote->>'client_rut_normalized', '')), '');
  v_client_phone text := nullif(trim(coalesce(p_quote->>'client_phone', '')), '');
  v_source text := coalesce(nullif(trim(coalesce(p_quote->>'source', '')), ''), 'web');
  v_created_at_client timestamptz := coalesce(nullif(p_quote->>'created_at_client', '')::timestamptz, now());
  v_total_items integer := 0;
  v_item record;
  v_size_id bigint;
  v_available integer;
  v_digits text;
  v_season text;
  v_lookup_sku text;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'No hay items para guardar';
  end if;

  if v_store_name = '' then
    raise exception 'Razón social requerida';
  end if;

  select coalesce(sum(qty), 0)::integer
  into v_total_items
  from (
    select greatest(0, coalesce(cantidad, 0)) as qty
    from jsonb_to_recordset(p_items) as x(sku text, talla text, cantidad integer)
  ) s;

  if v_total_items <= 0 then
    raise exception 'No hay items para guardar';
  end if;

  insert into public.quotes (
    id,
    store_name,
    client_rut,
    client_rut_normalized,
    client_phone,
    total_items,
    source,
    created_at_client
  )
  values (
    v_quote_id,
    v_store_name,
    v_client_rut,
    v_client_rut_normalized,
    v_client_phone,
    v_total_items,
    v_source,
    v_created_at_client
  );

  for v_item in
    select
      upper(trim(coalesce(sku, ''))) as sku,
      trim(coalesce(talla, '')) as size_label,
      sum(greatest(0, coalesce(cantidad, 0)))::integer as quantity
    from jsonb_to_recordset(p_items) as x(sku text, talla text, cantidad integer)
    group by 1, 2
  loop
    if v_item.sku = '' or v_item.size_label = '' or v_item.quantity <= 0 then
      raise exception 'Detalle de cotización inválido';
    end if;

    v_digits := regexp_replace(v_item.sku, '[^0-9]', '', 'g');
    v_season := case when length(v_digits) >= 2 then left(v_digits, 2) else null end;
    v_lookup_sku := case
      when v_item.sku ~ '^\d{4}$' then v_item.sku || '-00'
      when v_item.sku ~ '^\d{6}$' then substr(v_item.sku, 1, 4) || '-' || substr(v_item.sku, 5, 2)
      else v_item.sku
    end;

    select sis.id, sis.quantity
    into v_size_id, v_available
    from public.stock_items si
    join public.stock_item_sizes sis
      on sis.stock_item_id = si.id
    where si.active = true
      and upper(trim(si.sku)) in (v_item.sku, v_lookup_sku)
      and sis.size_label = v_item.size_label
      and (v_season is null or si.season = v_season)
    order by si.id
    limit 1
    for update of sis, si;

    if v_size_id is null then
      raise exception 'No se encontró stock para modelo % talla %', v_item.sku, v_item.size_label;
    end if;

    if v_available is null then
      raise exception 'No se encontró stock para modelo % talla %', v_item.sku, v_item.size_label;
    end if;

    if coalesce(v_available, 0) < v_item.quantity then
      raise exception 'Stock insuficiente para modelo % talla % (disponible: %, solicitado: %)',
        v_item.sku, v_item.size_label, coalesce(v_available, 0), v_item.quantity;
    end if;

    update public.stock_item_sizes
    set quantity = quantity - v_item.quantity
    where id = v_size_id;

    insert into public.quote_items (quote_id, sku, size, quantity)
    values (v_quote_id, v_lookup_sku, v_item.size_label, v_item.quantity);
  end loop;

  return v_quote_id;
end;
$$;

revoke all on function public.create_quote_with_stock_reservation(jsonb, jsonb) from public;
grant execute on function public.create_quote_with_stock_reservation(jsonb, jsonb) to anon, authenticated;

-- ============================================
-- STOCK INTERNO (editable con tallas dinámicas)
-- ============================================

create table if not exists public.stock_items (
  id bigint generated always as identity primary key,
  season text not null default '42',
  article_code text not null,
  sku text not null,
  tiro text,
  bota text,
  color text,
  active boolean not null default true,
  source text not null default 'admin',
  notes text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_item_sizes (
  id bigint generated always as identity primary key,
  stock_item_id bigint not null references public.stock_items(id) on delete cascade,
  size_label text not null,
  quantity integer not null default 0 check (quantity >= 0),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_item_reserve_sizes (
  id bigint generated always as identity primary key,
  stock_item_id bigint not null references public.stock_items(id) on delete cascade,
  size_label text not null,
  reserve_quantity integer not null default 0 check (reserve_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_stock_items_season_sku on public.stock_items(season, sku);
create index if not exists idx_stock_items_sku on public.stock_items(sku);
create index if not exists idx_stock_items_article_code on public.stock_items(article_code);
create index if not exists idx_stock_items_active on public.stock_items(active);
create index if not exists idx_stock_items_season on public.stock_items(season);

create unique index if not exists ux_stock_item_sizes_item_label on public.stock_item_sizes(stock_item_id, size_label);
create index if not exists idx_stock_item_sizes_item on public.stock_item_sizes(stock_item_id);
create index if not exists idx_stock_item_sizes_label on public.stock_item_sizes(size_label);
create unique index if not exists ux_stock_item_reserve_sizes_item_label on public.stock_item_reserve_sizes(stock_item_id, size_label);
create index if not exists idx_stock_item_reserve_sizes_item on public.stock_item_reserve_sizes(stock_item_id);
create index if not exists idx_stock_item_reserve_sizes_label on public.stock_item_reserve_sizes(size_label);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_reserve_stock_size_on_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.stock_item_reserve_sizes (stock_item_id, size_label, reserve_quantity)
  values (new.stock_item_id, new.size_label, new.quantity)
  on conflict (stock_item_id, size_label) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_stock_items_updated_at on public.stock_items;
create trigger trg_stock_items_updated_at
before update on public.stock_items
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_stock_item_sizes_updated_at on public.stock_item_sizes;
create trigger trg_stock_item_sizes_updated_at
before update on public.stock_item_sizes
for each row
execute function public.set_row_updated_at();

drop trigger if exists trg_stock_item_sizes_sync_reserve_insert on public.stock_item_sizes;
create trigger trg_stock_item_sizes_sync_reserve_insert
after insert on public.stock_item_sizes
for each row
execute function public.sync_reserve_stock_size_on_insert();

drop trigger if exists trg_stock_item_reserve_sizes_updated_at on public.stock_item_reserve_sizes;
create trigger trg_stock_item_reserve_sizes_updated_at
before update on public.stock_item_reserve_sizes
for each row
execute function public.set_row_updated_at();

alter table public.stock_items enable row level security;
alter table public.stock_item_sizes enable row level security;
alter table public.stock_item_reserve_sizes enable row level security;

drop policy if exists "authenticated_read_stock_items" on public.stock_items;
create policy "authenticated_read_stock_items"
on public.stock_items
for select
to authenticated
using (true);

drop policy if exists "authenticated_insert_stock_items" on public.stock_items;
create policy "authenticated_insert_stock_items"
on public.stock_items
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_update_stock_items" on public.stock_items;
create policy "authenticated_update_stock_items"
on public.stock_items
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_delete_stock_items" on public.stock_items;
create policy "authenticated_delete_stock_items"
on public.stock_items
for delete
to authenticated
using (true);

drop policy if exists "authenticated_read_stock_item_sizes" on public.stock_item_sizes;
create policy "authenticated_read_stock_item_sizes"
on public.stock_item_sizes
for select
to authenticated
using (true);

drop policy if exists "authenticated_insert_stock_item_sizes" on public.stock_item_sizes;
create policy "authenticated_insert_stock_item_sizes"
on public.stock_item_sizes
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_update_stock_item_sizes" on public.stock_item_sizes;
create policy "authenticated_update_stock_item_sizes"
on public.stock_item_sizes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_delete_stock_item_sizes" on public.stock_item_sizes;
create policy "authenticated_delete_stock_item_sizes"
on public.stock_item_sizes
for delete
to authenticated
using (true);

drop policy if exists "authenticated_read_stock_item_reserve_sizes" on public.stock_item_reserve_sizes;
create policy "authenticated_read_stock_item_reserve_sizes"
on public.stock_item_reserve_sizes
for select
to authenticated
using (true);

drop policy if exists "authenticated_insert_stock_item_reserve_sizes" on public.stock_item_reserve_sizes;
create policy "authenticated_insert_stock_item_reserve_sizes"
on public.stock_item_reserve_sizes
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_update_stock_item_reserve_sizes" on public.stock_item_reserve_sizes;
create policy "authenticated_update_stock_item_reserve_sizes"
on public.stock_item_reserve_sizes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_delete_stock_item_reserve_sizes" on public.stock_item_reserve_sizes;
create policy "authenticated_delete_stock_item_reserve_sizes"
on public.stock_item_reserve_sizes
for delete
to authenticated
using (true);

drop policy if exists "anon_read_active_stock_items" on public.stock_items;
create policy "anon_read_active_stock_items"
on public.stock_items
for select
to anon
using (active = true);

drop policy if exists "anon_read_stock_item_sizes" on public.stock_item_sizes;
create policy "anon_read_stock_item_sizes"
on public.stock_item_sizes
for select
to anon
using (
  exists (
    select 1
    from public.stock_items si
    where si.id = stock_item_id
      and si.active = true
  )
);

drop policy if exists "anon_read_stock_item_reserve_sizes" on public.stock_item_reserve_sizes;
create policy "anon_read_stock_item_reserve_sizes"
on public.stock_item_reserve_sizes
for select
to anon
using (
  exists (
    select 1
    from public.stock_items si
    where si.id = stock_item_id
      and si.active = true
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'stock_items'
  ) then
    execute 'alter publication supabase_realtime add table public.stock_items';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'stock_item_sizes'
  ) then
    execute 'alter publication supabase_realtime add table public.stock_item_sizes';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'stock_item_reserve_sizes'
  ) then
    execute 'alter publication supabase_realtime add table public.stock_item_reserve_sizes';
  end if;
end
$$;

create or replace view public.stock_catalog_web as
select
  si.season,
  si.sku,
  si.article_code,
  si.tiro,
  si.bota,
  si.color,
  coalesce(sum(case when sis.size_label = '36' then coalesce(sirs.reserve_quantity, sis.quantity) end), 0) as size_36,
  coalesce(sum(case when sis.size_label = '38' then coalesce(sirs.reserve_quantity, sis.quantity) end), 0) as size_38,
  coalesce(sum(case when sis.size_label = '40' then coalesce(sirs.reserve_quantity, sis.quantity) end), 0) as size_40,
  coalesce(sum(case when sis.size_label = '42' then coalesce(sirs.reserve_quantity, sis.quantity) end), 0) as size_42,
  coalesce(sum(case when sis.size_label = '44' then coalesce(sirs.reserve_quantity, sis.quantity) end), 0) as size_44,
  coalesce(sum(case when sis.size_label = '46' then coalesce(sirs.reserve_quantity, sis.quantity) end), 0) as size_46,
  coalesce(sum(coalesce(sirs.reserve_quantity, sis.quantity)), 0) as total_units,
  si.active,
  si.updated_at
from public.stock_items si
left join public.stock_item_sizes sis on sis.stock_item_id = si.id
left join public.stock_item_reserve_sizes sirs
  on sirs.stock_item_id = si.id
 and sirs.size_label = sis.size_label
where si.active = true
group by si.id, si.season, si.sku, si.article_code, si.tiro, si.bota, si.color, si.active, si.updated_at;

insert into public.stock_item_reserve_sizes (stock_item_id, size_label, reserve_quantity)
select sis.stock_item_id, sis.size_label, sis.quantity
from public.stock_item_sizes sis
on conflict (stock_item_id, size_label) do nothing;

-- Migración desde el esquema legacy stock_catalog si existe.
do $$
begin
  if to_regclass('public.stock_catalog') is not null then
    insert into public.stock_items (
      season, article_code, sku, tiro, bota, color, active, source, notes
    )
    select
      coalesce(sc.season, '42'),
      sc.article_code,
      sc.sku,
      sc.tiro,
      sc.bota,
      sc.color,
      sc.active,
      coalesce(sc.source, 'legacy-migration'),
      sc.notes
    from public.stock_catalog sc
    on conflict (season, sku) do update set
      article_code = excluded.article_code,
      tiro = excluded.tiro,
      bota = excluded.bota,
      color = excluded.color,
      active = excluded.active,
      source = excluded.source,
      notes = excluded.notes;

    delete from public.stock_item_sizes sis
    using public.stock_items si
    where sis.stock_item_id = si.id
      and si.source in ('legacy-migration', 'excel-seed', 'admin');

    insert into public.stock_item_sizes (stock_item_id, size_label, quantity, sort_order)
    select
      si.id,
      v.size_label,
      v.quantity,
      v.sort_order
    from public.stock_catalog sc
    join public.stock_items si
      on si.season = coalesce(sc.season, '42')
     and si.sku = sc.sku
    cross join lateral (
      values
        ('36', coalesce(sc.size_36, 0), 10),
        ('38', coalesce(sc.size_38, 0), 20),
        ('40', coalesce(sc.size_40, 0), 30),
        ('42', coalesce(sc.size_42, 0), 40),
        ('44', coalesce(sc.size_44, 0), 50),
        ('46', coalesce(sc.size_46, 0), 60)
    ) as v(size_label, quantity, sort_order)
    where v.quantity > 0
    on conflict (stock_item_id, size_label) do update set
      quantity = excluded.quantity,
      sort_order = excluded.sort_order;
  end if;
end
$$;
