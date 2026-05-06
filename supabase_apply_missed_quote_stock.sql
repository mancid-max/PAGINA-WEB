-- Ejecuta esto una sola vez en Supabase para rebajar stock de cotizaciones
-- que entraron sin descuento. Ajustado para cole 42 solamente.
--
-- Importante:
-- - Este script asume que "COT-30|34" en realidad es "COT-30134",
--   porque el código visual solo genera dígitos.
-- - Si ese segundo código no corresponde, primero corre solo el SELECT
--   de revisión y confirma el código correcto.

create or replace function public.quote_visual_code(p_quote_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  raw text := replace(coalesce(p_quote_id::text, ''), '-', '');
  acc integer := 0;
  i integer;
begin
  if raw = '' then
    return 'COT-';
  end if;

  for i in 1..length(raw) loop
    acc := mod(acc * 31 + ascii(substr(raw, i, 1)), 100000);
  end loop;

  return 'COT-' || lpad(acc::text, 5, '0');
end;
$$;

with target_quotes as (
  select q.id, q.source, public.quote_visual_code(q.id) as visual_code
  from public.quotes q
  where public.quote_visual_code(q.id) in ('COT-96323', 'COT-30134')
),
target_rows as (
  select
    tq.visual_code,
    qi.quote_id,
    qi.sku,
    qi.size,
    qi.quantity,
    sis.id as stock_size_id,
    sis.quantity as current_stock
  from target_quotes tq
  join public.quote_items qi
    on qi.quote_id = tq.id
  join public.stock_items si
    on si.active = true
   and upper(trim(si.sku)) = upper(trim(qi.sku))
  join public.stock_item_sizes sis
    on sis.stock_item_id = si.id
   and sis.size_label = qi.size
  where coalesce(tq.source, '') <> 'catalogo-43'
)
select *
from target_rows
order by visual_code, sku, size;

-- Cuando confirmes que las filas son correctas, ejecuta este bloque:
--
-- with target_quotes as (
--   select q.id, q.source, public.quote_visual_code(q.id) as visual_code
--   from public.quotes q
--   where public.quote_visual_code(q.id) in ('COT-96323', 'COT-30134')
-- ),
-- target_rows as (
--   select
--     tq.visual_code,
--     qi.quote_id,
--     qi.sku,
--     qi.size,
--     qi.quantity,
--     sis.id as stock_size_id
--   from target_quotes tq
--   join public.quote_items qi
--     on qi.quote_id = tq.id
--   join public.stock_items si
--     on si.active = true
--    and upper(trim(si.sku)) = upper(trim(qi.sku))
--   join public.stock_item_sizes sis
--     on sis.stock_item_id = si.id
--    and sis.size_label = qi.size
--   where coalesce(tq.source, '') <> 'catalogo-43'
-- )
-- update public.stock_item_sizes sis
-- set quantity = sis.quantity - tr.quantity
-- from target_rows tr
-- where sis.id = tr.stock_size_id;
