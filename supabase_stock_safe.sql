-- Ejecuta esto en Supabase SQL Editor
-- SAFE: no toca clients, quotes ni quote_items
-- SAFE: no hace DROP, no borra tablas, no elimina datos existentes
-- SAFE: crea tablas nuevas para stock y copia datos solo si existe public.stock_catalog

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

create unique index if not exists ux_stock_items_season_sku on public.stock_items(season, sku);
create index if not exists idx_stock_items_sku on public.stock_items(sku);
create index if not exists idx_stock_items_article_code on public.stock_items(article_code);
create index if not exists idx_stock_items_active on public.stock_items(active);
create index if not exists idx_stock_items_season on public.stock_items(season);

create unique index if not exists ux_stock_item_sizes_item_label on public.stock_item_sizes(stock_item_id, size_label);
create index if not exists idx_stock_item_sizes_item on public.stock_item_sizes(stock_item_id);
create index if not exists idx_stock_item_sizes_label on public.stock_item_sizes(size_label);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_stock_items_updated_at'
  ) then
    create trigger trg_stock_items_updated_at
    before update on public.stock_items
    for each row
    execute function public.set_row_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_stock_item_sizes_updated_at'
  ) then
    create trigger trg_stock_item_sizes_updated_at
    before update on public.stock_item_sizes
    for each row
    execute function public.set_row_updated_at();
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
  coalesce(sum(case when sis.size_label = '36' then sis.quantity end), 0) as size_36,
  coalesce(sum(case when sis.size_label = '38' then sis.quantity end), 0) as size_38,
  coalesce(sum(case when sis.size_label = '40' then sis.quantity end), 0) as size_40,
  coalesce(sum(case when sis.size_label = '42' then sis.quantity end), 0) as size_42,
  coalesce(sum(case when sis.size_label = '44' then sis.quantity end), 0) as size_44,
  coalesce(sum(case when sis.size_label = '46' then sis.quantity end), 0) as size_46,
  coalesce(sum(sis.quantity), 0) as total_units,
  si.active,
  si.updated_at
from public.stock_items si
left join public.stock_item_sizes sis on sis.stock_item_id = si.id
where si.active = true
group by si.id, si.season, si.sku, si.article_code, si.tiro, si.bota, si.color, si.active, si.updated_at;

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
      coalesce(sc.active, true),
      coalesce(sc.source, 'legacy-copy'),
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

    insert into public.stock_item_sizes (
      stock_item_id, size_label, quantity, sort_order
    )
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
