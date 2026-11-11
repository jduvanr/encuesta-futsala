-- ═══════════════════════════════════════════════════════════════════
-- Encuestas dirigidas futsala.co y Liga de Fútbol de Salón de Bogotá
-- (jugadores, aficionados, cuerpo técnico, organizadores, periodistas, creadores, patrocinadores y árbitros)
-- Pega todo este archivo en Supabase → SQL Editor → Run.
-- Se puede ejecutar varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabla de respuestas por rol ─────────────────────────────────────
-- El id lo genera el navegador y se guarda en localStorage: si la misma
-- persona intenta enviar dos veces, la llave primaria lo rechaza.
-- El bloque inicial (rol, localidad, edad) va en columnas; las respuestas
-- propias de cada rol (J1…J28, A1…A14, T1…T13, O1…O13, PE1…PE7, CR1…CR7, PA1…PA8, AR1…AR12) van en "detalle" (JSON).
create table if not exists public.respuestas_roles (
  id            uuid primary key,
  fecha         timestamptz not null default now(),
  autorizacion  boolean not null check (autorizacion = true),
  rol           text not null,
  localidad     text not null check (localidad in (
                  'Usaquén','Chapinero','Santa Fe','San Cristóbal','Usme','Tunjuelito','Bosa',
                  'Kennedy','Fontibón','Engativá','Suba','Barrios Unidos','Teusaquillo',
                  'Los Mártires','Antonio Nariño','Puente Aranda','La Candelaria',
                  'Rafael Uribe Uribe','Ciudad Bolívar','Sumapaz',
                  'Soacha','Otro municipio de Cundinamarca','Otro lugar')),
  edad          text not null check (edad in ('Menos de 14','14 a 17','18 a 25','26 a 35','36 a 45','46 o más')),
  detalle       jsonb not null default '{}'::jsonb
                  check (jsonb_typeof(detalle) = 'object' and pg_column_size(detalle) <= 8192),
  origen        text check (char_length(origen) <= 100)
);

-- Roles válidos. Se define aparte para que, al volver a correr el archivo, se actualice la lista.
alter table public.respuestas_roles drop constraint if exists respuestas_roles_rol_check;
alter table public.respuestas_roles add constraint respuestas_roles_rol_check check (rol in (
  'Jugador o jugadora','Aficionado o espectador','Entrenador o cuerpo técnico',
  'Organizador de torneos o liga','Periodista','Creador de contenido','Patrocinador o marca',
  'Árbitro o juez'));

create index if not exists respuestas_roles_fecha_idx on public.respuestas_roles (fecha desc);
create index if not exists respuestas_roles_rol_idx on public.respuestas_roles (rol);

-- ── Tabla de contactos (separada: no se puede cruzar con las respuestas) ─
create table if not exists public.contactos (
  id        uuid primary key default gen_random_uuid(),
  fecha     timestamptz not null default now(),
  whatsapp  text not null check (whatsapp ~ '^3[0-9]{9}$')
);

-- ── Seguridad: Row Level Security ──────────────────────────────────
alter table public.respuestas_roles enable row level security;
alter table public.contactos        enable row level security;

drop policy if exists "publico_solo_inserta" on public.respuestas_roles;
create policy "publico_solo_inserta" on public.respuestas_roles
  for insert to anon with check (autorizacion = true);

drop policy if exists "publico_solo_inserta" on public.contactos;
create policy "publico_solo_inserta" on public.contactos
  for insert to anon with check (true);

-- No hay ninguna política SELECT/UPDATE/DELETE para anon ⇒ el público no puede leer,
-- editar ni borrar. Además se limitan los permisos a nivel de columnas:
revoke all on public.respuestas_roles from anon, authenticated;
revoke all on public.contactos        from anon, authenticated;

grant insert (id, autorizacion, rol, localidad, edad, detalle, origen) on public.respuestas_roles to anon;
grant insert (whatsapp) on public.contactos to anon;

-- El panel /admin lee con la llave service_role (secreta), que salta RLS.
grant all on public.respuestas_roles, public.contactos to service_role;

-- ── Versión anterior ───────────────────────────────────────────────
-- La primera versión (8 preguntas) usaba la tabla "respuestas". Ya no se usa.
-- Si no tiene datos que quieras conservar, puedes borrarla quitando el "--" de la siguiente línea:
-- drop table if exists public.respuestas;
