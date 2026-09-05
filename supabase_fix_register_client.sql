-- 2026-09-04 · Ejecutar en Supabase > SQL Editor (segunda pasada)
-- 1) register_client_if_missing: normalizar igual que lookup_client_by_rut (solo digitos/K, sin guion)
--    y evitar el error 42702 (ambiguedad OUT params vs columnas) con #variable_conflict use_column.
-- 2) Borrar la fila duplicada creada con guion ("16388334-1").
-- 3) Completar datos de la clienta para que la web los pre-llene.

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
#variable_conflict use_column
declare
  v_rut_normalized text := upper(regexp_replace(coalesce(p_rut, ''), '[^0-9Kk]', '', 'g'));
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

  insert into public.clients as c (rut, rut_normalized, razon_social, active)
  values (v_rut, v_rut_normalized, v_razon_social, true)
  on conflict (rut_normalized) do update
    set rut = excluded.rut,
        razon_social = excluded.razon_social,
        active = true
  returning c.rut, c.rut_normalized, c.razon_social, (c.xmax = 0)
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

-- 2) duplicado con guion
delete from public.clients where rut_normalized = '16388334-1';

-- 3) datos completos de la clienta (fila con rut_normalized solo digitos)
update public.clients
set telefono      = '950096525',
    giro          = 'GRANDES TIENDAS DE VESTIR Y CALZADO',
    direccion     = 'LAGO LYNCH #45',
    nombre_tienda = 'TIENDA ANTONELLA',
    comuna        = 'PORVENIR',
    active        = true
where rut_normalized = '163883341';

-- Verificacion (debe devolver 1 fila con los datos):
select rut, rut_normalized, razon_social, telefono, giro, direccion, nombre_tienda, comuna
from public.clients where rut_normalized in ('163883341', '16388334-1');
