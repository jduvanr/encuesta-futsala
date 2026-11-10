-- ═══════════════════════════════════════════════════════════════════
-- Encuesta "¿Cómo vives el fútbol de salón en Bogotá?" — futsala.co
-- Pega todo este archivo en Supabase → SQL Editor → Run.
-- Se puede ejecutar varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabla de respuestas ─────────────────────────────────────────────
-- El id lo genera el navegador y se guarda en localStorage: si la misma
-- persona intenta enviar dos veces, la llave primaria lo rechaza.
create table if not exists public.respuestas (
  id            uuid primary key,
  fecha         timestamptz not null default now(),
  autorizacion  boolean not null check (autorizacion = true),
  edad          text not null check (edad in ('Menos de 18','18 a 25','26 a 35','36 a 45','Más de 45')),
  localidad     text not null check (localidad in (
                  'Usaquén','Chapinero','Santa Fe','San Cristóbal','Usme','Tunjuelito','Bosa',
                  'Kennedy','Fontibón','Engativá','Suba','Barrios Unidos','Teusaquillo',
                  'Los Mártires','Antonio Nariño','Puente Aranda','La Candelaria',
                  'Rafael Uribe Uribe','Ciudad Bolívar','Sumapaz','Fuera de Bogotá')),
  frecuencia    text check (frecuencia in ('Cada semana','Cada mes','Solo finales o partidos especiales','Casi nunca')),
  canales       text[] not null default '{}'
                  check (canales <@ array['Instagram','Facebook','TikTok','YouTube','WhatsApp','Voz a voz']::text[]),
  preferencia   text check (preferencia in ('Partido completo en vivo','Resumen','Solo goles','Historias y detrás de cámaras','Entrevistas')),
  seguridad     smallint check (seguridad between 1 and 5),
  comodidad     smallint check (comodidad between 1 and 5),
  banos         smallint check (banos between 1 and 5),
  comida        smallint check (comida between 1 and 5),
  pago_final    text check (pago_final in ('No','Sí hasta 5.000 pesos','Sí hasta 10.000 pesos','Sí más de 10.000 pesos')),
  origen        text check (char_length(origen) <= 100)
);

create index if not exists respuestas_fecha_idx on public.respuestas (fecha desc);

-- ── Tabla de contactos (separada: no se puede cruzar con las respuestas) ─
create table if not exists public.contactos (
  id        uuid primary key default gen_random_uuid(),
  fecha     timestamptz not null default now(),
  whatsapp  text not null check (whatsapp ~ '^3[0-9]{9}$')
);

-- ── Seguridad: Row Level Security ──────────────────────────────────
alter table public.respuestas enable row level security;
alter table public.contactos  enable row level security;

drop policy if exists "publico_solo_inserta" on public.respuestas;
create policy "publico_solo_inserta" on public.respuestas
  for insert to anon with check (autorizacion = true);

drop policy if exists "publico_solo_inserta" on public.contactos;
create policy "publico_solo_inserta" on public.contactos
  for insert to anon with check (true);

-- No hay ninguna política SELECT/UPDATE/DELETE para anon ⇒ el público no puede leer,
-- editar ni borrar. Además se limitan los permisos a nivel de columnas:
revoke all on public.respuestas from anon, authenticated;
revoke all on public.contactos  from anon, authenticated;

grant insert (id, autorizacion, edad, localidad, frecuencia, canales, preferencia,
              seguridad, comodidad, banos, comida, pago_final, origen)
  on public.respuestas to anon;
grant insert (whatsapp) on public.contactos to anon;

-- El panel /admin lee con la llave service_role (secreta), que salta RLS.
grant all on public.respuestas, public.contactos to service_role;
