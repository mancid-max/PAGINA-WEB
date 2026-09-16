-- supabase_quotes_tomado.sql (2026-09-16)
-- Pegar en Supabase > SQL Editor > Run.
-- Quién tomó cada pedido desde el grupo de Telegram "Mohicano Pedidos" (botón "Lo tomo yo").
-- La función telegram-callback usa estas columnas como candado: solo la primera persona que toca
-- el botón queda registrada; las demás reciben "Ya lo tomó X". Sin estas columnas la función
-- igual funciona, pero se apoya en el texto del mensaje y dos toques simultáneos pueden pisarse.

alter table public.quotes
  add column if not exists tomado_por text,
  add column if not exists tomado_at  timestamptz;

comment on column public.quotes.tomado_por is 'Persona que tomó el pedido desde Telegram (botón Lo tomo yo)';
comment on column public.quotes.tomado_at  is 'Cuándo lo tomó';
