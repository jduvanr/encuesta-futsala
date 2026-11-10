# Encuesta futsala.co: ¿Cómo vives el fútbol de salón en Bogotá?

Encuesta pensada primero para celular, para el estudio de **futsala.co** con la **Liga de Fútbol de Salón de Bogotá**.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (plan gratuito) · Vercel
- **Rutas:** `/` encuesta · `/politica-de-datos` · `/admin` panel de resultados (con contraseña)

---

## 1. Requisitos

- Node.js 18.17 o superior (recomendado 20 o 22)
- Una cuenta gratuita en [supabase.com](https://supabase.com) y otra en [vercel.com](https://vercel.com)
- Una cuenta de GitHub (Vercel despliega desde un repositorio)

## 2. Crear la base de datos en Supabase

1. En Supabase, crea un proyecto nuevo (**New project**). Región sugerida: **South America (São Paulo)**.
2. Ve a **SQL Editor → New query**, pega todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea:
   - `respuestas_roles`: id, fecha, autorizacion, rol, localidad, edad, origen y `detalle` (JSON con las respuestas propias del rol: `j4`, `a8`, `t3`, `o10`…)
   - `contactos`: id, fecha, whatsapp (separada, no se puede cruzar con las respuestas)
   - **Row Level Security activado**: el público solo puede **insertar**. No puede leer, editar ni borrar.
   - Restricciones que solo aceptan roles, localidades y edades válidos, un `detalle` de máximo 8 KB y celulares colombianos de 10 dígitos.
   > Si ya habías corrido la versión anterior del archivo, vuelve a correrlo: crea la tabla nueva y no toca la vieja (`respuestas`), que ya no se usa.
3. Ve a **Project Settings → API** (o **API Keys**) y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (o **publishable**) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (o **secret**) → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Esta llave es secreta: nunca la pongas en el código ni con el prefijo `NEXT_PUBLIC_`.

> En el plan gratuito, Supabase **pausa el proyecto tras 7 días sin actividad**. Mientras la encuesta esté activa no pasa nada; si se pausa, entra al panel de Supabase y pulsa **Restore**.

## 3. Variables de entorno

Copia `.env.example` como `.env.local` y llena los valores:

| Variable | Para qué sirve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública. Solo permite insertar respuestas |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave secreta. Solo la usa el servidor para el panel `/admin` |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin` (larga y única) |
| `NEXT_PUBLIC_SITE_URL` | URL pública final, sin `/` al final. Ej.: `https://encuesta.futsala.co` |

> **Sin Supabase configurado**, el proyecto funciona en **modo demostración** al correrlo localmente: la encuesta no guarda nada (lo muestra en la consola) y `/admin` muestra datos ficticios. En producción, sin las variables, el envío muestra un error.

## 4. Correr en tu computador

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para probar en el celular, conéctalo a la misma red Wi-Fi y abre `http://IP-DE-TU-PC:3000`.

## 5. Imágenes: logos, fondo, Open Graph y QR

| Archivo | Qué hacer |
|---|---|
| `public/logos/futsala.png` | Reemplázalo por el logo oficial de futsala.co (PNG con fondo transparente, ~360×120 px) |
| `public/logos/parche.png` | Parche de color de futsala.co (lado derecho del encabezado). Se genera sin fondo desde `assets/logos-originales/futsala-parche-color.png` con `node scripts/parche-transparente.mjs` |
| `assets/cancha.jpg` | *(Opcional)* Pon aquí una foto real de una cancha de fútbol de salón |

Después ejecuta:

```bash
npm run assets
```

Esto regenera:
- `public/fondo-cancha.jpg`: el fondo, ya difuminado y comprimido (~25 KB) para que cargue rápido.
- `public/og-image.png`: la imagen que aparece al compartir en WhatsApp y redes (1200×630).
- `public/qr-encuesta.png`: el QR para imprimir en los escenarios. Apunta a `NEXT_PUBLIC_SITE_URL/?utm_source=qr_escenarios`, así en el panel sabes cuántas respuestas llegaron por el QR.

> ⚠️ Ejecuta `npm run assets` **cuando ya tengas la URL definitiva** en `NEXT_PUBLIC_SITE_URL`, y vuelve a subir los cambios. Los logos existentes no se sobrescriben.

## 6. Desplegar en Vercel

1. Sube el proyecto a GitHub:
   ```bash
   git add .
   git commit -m "Encuesta futsala.co"
   git remote add origin https://github.com/TU-USUARIO/encuesta-futsala.git
   git push -u origin main
   ```
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio. Vercel detecta Next.js solo.
3. En **Environment Variables**, agrega las 5 variables del paso 3 (para *Production* y *Preview*).
4. Pulsa **Deploy**.
5. *(Opcional)* Dominio propio: **Settings → Domains → Add** `encuesta.futsala.co` y crea en tu proveedor de DNS un registro **CNAME** `encuesta` → `cname.vercel-dns.com`.
6. Si la URL final cambió, actualiza `NEXT_PUBLIC_SITE_URL` en Vercel, ejecuta `npm run assets` localmente con esa URL, haz commit y push (Vercel redespliega solo).

### Revisar después de publicar

- Abre la URL en el celular y responde la encuesta completa.
- En Supabase → **Table Editor → respuestas** debe aparecer la fila.
- Abre `/admin`, entra con `ADMIN_PASSWORD` y descarga el CSV.
- Pega la URL en [opengraph.xyz](https://www.opengraph.xyz) o envíatela por WhatsApp para ver la vista previa.

## 7. Cómo funciona

- **Duplicados:** al empezar, el navegador genera un identificador y lo guarda en `localStorage`. Ese mismo identificador es el `id` de la fila, así que un segundo envío desde el mismo navegador lo rechaza la base de datos, y quien ya respondió ve directamente la pantalla de cierre.
- **Privacidad:** las respuestas no tienen nombre ni teléfono. El WhatsApp opcional va a la tabla `contactos`, sin ningún vínculo con las respuestas.
- **Velocidad:** no se usa el SDK de Supabase en el navegador (se usa `fetch` directo a la API REST), la fuente Poppins se sirve desde el mismo dominio y el QR de YouTube se genera en el servidor. Recharts solo se carga en `/admin`.
- **Panel `/admin`:** protegido con cookie `httpOnly` firmada a partir de `ADMIN_PASSWORD`. Cambiar la contraseña cierra todas las sesiones. Los CSV usan `;` como separador y UTF-8 con BOM para abrir bien en Excel en español.
- **Encuestas por rol:** bloque inicial (B1 autorización, B2 rol, B3 localidad, B4 edad) y luego la encuesta del rol: jugadores (J1–J15), aficionados (A1–A12), cuerpo técnico (T1–T11) u organizadores (O1–O12). Saltos: jugadores de categoría Infantil o Juvenil menores de 18 pasan de J2 a J13; A9 solo aparece si en A8 no respondió "No pagaría". Si no autoriza en B1, la encuesta termina sin guardar nada.
- **Preguntas obligatorias:** todas, salvo las marcadas `opcional: true` en [`lib/encuesta.ts`](lib/encuesta.ts) (ingresos, salud, lesiones y la pregunta abierta).
- **Panel:** elige un rol para ver las gráficas de cada pregunta (barras, promedios de las escalas y lista de respuestas abiertas). El CSV de un rol trae una columna por pregunta (`J4 ¿Recibes algún pago por jugar?`…).

## 8. Personalizar

- Textos, correo de contacto para datos personales y redes: [`lib/config.ts`](lib/config.ts). **Cambia `correoDatos` por un correo real** antes de publicar (lo exige la Ley 1581).
- Preguntas, opciones y saltos: [`lib/encuesta.ts`](lib/encuesta.ts). El panel y el CSV se arman solos a partir de ese archivo. Si cambias las opciones de rol, localidad o edad, actualiza también las restricciones en `supabase/schema.sql`.
- Política de datos: [`app/politica-de-datos/page.tsx`](app/politica-de-datos/page.tsx).
