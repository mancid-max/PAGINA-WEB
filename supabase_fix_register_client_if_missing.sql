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
