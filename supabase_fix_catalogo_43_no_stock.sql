create extension if not exists pg_net;

create or replace function public.queue_quote_email_notification(
  p_quote_id uuid,
  p_quote jsonb,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://mohicanojeans.netlify.app/.netlify/functions/quote-notify-email',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'quote_id', p_quote_id,
      'quote', p_quote,
      'items', p_items,
      'client', jsonb_build_object(
        'rut', coalesce(p_quote->>'client_rut', ''),
        'rut_normalized', coalesce(p_quote->>'client_rut_normalized', ''),
        'razon_social', coalesce(p_quote->>'store_name', ''),
        'client_phone', coalesce(p_quote->>'client_phone', '')
      )
    ),
    timeout_milliseconds := 5000
  );
exception
  when others then
    raise notice 'queue_quote_email_notification skipped: %', sqlerrm;
end;
$$;

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
  v_quote_payload jsonb;
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

  v_quote_payload := jsonb_build_object(
    'id', v_quote_id,
    'store_name', v_store_name,
    'client_rut', v_client_rut,
    'client_rut_normalized', v_client_rut_normalized,
    'client_phone', v_client_phone,
    'total_items', v_total_items,
    'created_at_client', v_created_at_client,
    'source', v_source
  );

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
      trim(coalesce(source, '')) as item_source,
      sum(greatest(0, coalesce(cantidad, 0)))::integer as quantity
    from jsonb_to_recordset(p_items) as x(sku text, talla text, cantidad integer, source text)
    group by 1, 2, 3
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

    if coalesce(nullif(v_item.item_source, ''), case when v_item.sku ~ '^43\d{2}(-\d{2})?$' then 'catalogo-43' else v_source end) = 'catalogo-43' then
      insert into public.quote_items (quote_id, sku, size, quantity)
      values (v_quote_id, v_lookup_sku, v_item.size_label, v_item.quantity);
      continue;
    end if;

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

  perform public.queue_quote_email_notification(v_quote_id, v_quote_payload, p_items);

  return v_quote_id;
end;
$$;

revoke all on function public.create_quote_with_stock_reservation(jsonb, jsonb) from public;
grant execute on function public.create_quote_with_stock_reservation(jsonb, jsonb) to anon, authenticated;
