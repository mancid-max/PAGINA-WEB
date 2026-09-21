-- supabase_solicitudes.sql (2026-09-21)
-- Pegar en Supabase > SQL Editor > Run.
-- Solicitudes de clientes que Sofía no puede resolver en el momento (talla/modelo/color sin stock o sin
-- publicar, precio que no tiene, quiere que lo llamen, reclamo, pregunta que no sabe responder).
-- Las registra la herramienta registrar_solicitud (función Netlify registrar-solicitud) y avisa al grupo
-- Ayuda de Telegram. Sirven para atenderlas y para ver qué piden los clientes y mejorar al agente.

create table if not exists public.solicitudes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  lead_id       text,                      -- lead de Nexor (uuid)
  phone         text,                      -- celular del cliente (E.164)
  rut           text,                      -- RUT si Sofía ya lo tenía
  nombre        text,                      -- nombre/razón social si se sabe
  tipo          text not null default 'otro', -- stock | talla | color | modelo | precio | foto | llamada | reclamo | otro
  texto         text not null,             -- qué pidió, con sus palabras
  contexto      text,                      -- nota corta de Sofía (modelo, cantidad, etc.)
  estado        text not null default 'pendiente', -- pendiente | resuelta
  resuelta_at   timestamptz,
  resuelta_por  text,
  notas         text
);

create index if not exists solicitudes_estado_idx on public.solicitudes (estado, created_at desc);
create index if not exists solicitudes_lead_idx   on public.solicitudes (lead_id);

comment on table public.solicitudes is 'Peticiones de clientes que Sofía no pudo resolver (registrar_solicitud). Pendientes se avisan por Telegram y salen en el informe diario.';

-- Solo el backend (service key) lee y escribe: sin acceso anónimo.
alter table public.solicitudes enable row level security;
