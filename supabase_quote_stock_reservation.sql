alter table public.quotes add column if not exists client_phone text;

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

    select sis.id, sis.quantity
    into v_size_id, v_available
    from public.stock_items si
    join public.stock_item_sizes sis
      on sis.stock_item_id = si.id
    where si.active = true
      and upper(trim(si.sku)) = v_item.sku
      and sis.size_label = v_item.size_label
      and (v_season is null or si.season = v_season)
    order by si.id
    limit 1
    for update of sis, si;

    if v_size_id is null then
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
    values (v_quote_id, v_item.sku, v_item.size_label, v_item.quantity);
  end loop;

  return v_quote_id;
end;
$$;

revoke all on function public.create_quote_with_stock_reservation(jsonb, jsonb) from public;
grant execute on function public.create_quote_with_stock_reservation(jsonb, jsonb) to anon, authenticated;
