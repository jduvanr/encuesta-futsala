-- ═══════════════════════════════════════════════════════════════════
-- Encuestas dirigidas de futsala.co
-- (jugadores, aficionados, cuerpo técnico, organizadores, periodistas, creadores, patrocinadores y árbitros)
-- Pega todo este archivo en Supabase → SQL Editor → Run.
-- Se puede ejecutar varias veces sin romper nada.
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabla de respuestas por rol ─────────────────────────────────────
-- Las respuestas llegan solo por el servidor del sitio (/api/respuesta), que valida
-- todo y guarda la huella del dispositivo en "dispositivo": un índice único impide
-- que el mismo dispositivo deje dos respuestas (salvo el modo encuestador, que la deja vacía).
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

-- Una respuesta por dispositivo. Se guarda una huella (HMAC), no el identificador real.
alter table public.respuestas_roles add column if not exists dispositivo text
  check (dispositivo is null or dispositivo ~ '^[0-9a-f]{64}$');
create unique index if not exists respuestas_roles_dispositivo_uidx
  on public.respuestas_roles (dispositivo) where dispositivo is not null;

-- ── Tabla de contactos (separada: no se puede cruzar con las respuestas) ─
create table if not exists public.contactos (
  id        uuid primary key default gen_random_uuid(),
  fecha     timestamptz not null default now(),
  whatsapp  text not null check (whatsapp ~ '^3[0-9]{9}$')
);

-- ── Seguridad: Row Level Security ──────────────────────────────────
alter table public.respuestas_roles enable row level security;
alter table public.contactos        enable row level security;

-- Las respuestas ya no se insertan con la llave pública: solo el servidor (service_role).
-- Así nadie puede saltarse el límite de una respuesta por dispositivo llamando a Supabase directamente.
drop policy if exists "publico_solo_inserta" on public.respuestas_roles;

drop policy if exists "publico_solo_inserta" on public.contactos;
create policy "publico_solo_inserta" on public.contactos
  for insert to anon with check (true);

-- No hay ninguna política SELECT/UPDATE/DELETE para anon ⇒ el público no puede leer,
-- editar ni borrar. Además se limitan los permisos a nivel de columnas:
revoke all on public.respuestas_roles from anon, authenticated;
revoke all on public.contactos        from anon, authenticated;

grant insert (whatsapp) on public.contactos to anon;

-- El panel /admin lee con la llave service_role (secreta), que salta RLS.
grant all on public.respuestas_roles, public.contactos to service_role;

-- ── Vistas y tablas auxiliares: nunca públicas ─────────────────────
-- Las vistas nuevas en "public" nacen con permisos para anon. Se retiran aquí
-- (la vista v_respuestas_tabla expuso todas las respuestas antes de este ajuste).
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('v', 'm')
  loop
    execute format('revoke all on public.%I from anon, authenticated', r.relname);
  end loop;
end $$;

-- ── Versión anterior ───────────────────────────────────────────────
-- La primera versión (8 preguntas) usaba la tabla "respuestas". Ya no se usa.
-- Si no tiene datos que quieras conservar, puedes borrarla quitando el "--" de la siguiente línea:
-- drop table if exists public.respuestas;
