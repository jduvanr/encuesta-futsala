/**
 * Genera las imágenes estáticas del sitio:
 *   public/fondo-cancha.jpg   fondo difuminado (desde assets/cancha.jpg|png|webp si existe)
 *   public/og-image.png       imagen para compartir en WhatsApp y redes (1200×630)
 *   public/qr-encuesta.png    QR de la encuesta para imprimir en los escenarios
 *   public/logos/futsala.png  logo provisional (solo si todavía no existe)
 * El parche (public/logos/parche.png) se genera con: node scripts/parche-transparente.mjs
 *
 * Uso:  npm run assets
 * La URL del QR sale de NEXT_PUBLIC_SITE_URL (en .env.local o en la terminal).
 */
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";

const RAIZ = process.cwd();
const PUB = join(RAIZ, "public");
mkdirSync(join(PUB, "logos"), { recursive: true });

// Lee NEXT_PUBLIC_SITE_URL de .env.local / .env si no viene en el entorno
function leerEnv(nombre) {
  if (process.env[nombre]) return process.env[nombre];
  for (const f of [".env.local", ".env"]) {
    const ruta = join(RAIZ, f);
    if (!existsSync(ruta)) continue;
    const m = readFileSync(ruta, "utf8").match(new RegExp(`^${nombre}=(.*)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
}
const URL_SITIO = (leerEnv("NEXT_PUBLIC_SITE_URL") || "https://encuesta.futsala.co").replace(/\/$/, "");

// ── 1. Fondo de cancha ──────────────────────────────────────────────
const CANCHA_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1600" viewBox="0 0 1280 1600">
  <defs>
    <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d3f8a"/><stop offset="1" stop-color="#0e2357"/>
    </linearGradient>
    <radialGradient id="luz" cx="0.5" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="1600" fill="#c4521d"/>
  <rect x="140" y="120" width="1000" height="1360" fill="url(#piso)"/>
  <g fill="none" stroke="#f4f4f4" stroke-width="10">
    <rect x="140" y="120" width="1000" height="1360"/>
    <line x1="140" y1="800" x2="1140" y2="800"/>
    <circle cx="640" cy="800" r="150"/>
    <path d="M400 120 a240 240 0 0 0 240 240 a240 240 0 0 0 240 -240"/>
    <path d="M400 1480 a240 240 0 0 1 240 -240 a240 240 0 0 1 240 240"/>
    <rect x="560" y="70" width="160" height="50"/>
    <rect x="560" y="1480" width="160" height="50"/>
  </g>
  <g fill="#f4f4f4"><circle cx="640" cy="800" r="12"/><circle cx="640" cy="360" r="10"/><circle cx="640" cy="1240" r="10"/></g>
  <rect width="1280" height="1600" fill="url(#luz)"/>
</svg>`;

const foto = ["jpg", "jpeg", "png", "webp"].map((e) => join(RAIZ, "assets", `cancha.${e}`)).find(existsSync);
const baseFondo = foto ? sharp(foto).rotate() : sharp(Buffer.from(CANCHA_SVG));
await baseFondo
  .resize(1280, 1600, { fit: "cover" })
  .blur(foto ? 14 : 18)
  .modulate({ brightness: 0.85, saturation: 0.9 })
  .jpeg({ quality: 55, progressive: true, mozjpeg: true })
  .toFile(join(PUB, "fondo-cancha.jpg"));
console.log(`✓ public/fondo-cancha.jpg ${foto ? `(desde ${foto})` : "(cancha ilustrada; pon tu foto en assets/cancha.jpg)"}`);

// ── 2. Logos provisionales ──────────────────────────────────────────
const logos = {
  "futsala.png": `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120"><text x="0" y="84" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700" fill="#FFFFFF">futsala<tspan fill="#FCD116">.co</tspan></text></svg>`,
};
for (const [nombre, svg] of Object.entries(logos)) {
  const ruta = join(PUB, "logos", nombre);
  if (existsSync(ruta)) {
    console.log(`• public/logos/${nombre} ya existe, no se toca`);
    continue;
  }
  await sharp(Buffer.from(svg)).png().toFile(ruta);
  console.log(`✓ public/logos/${nombre} (PROVISIONAL: reemplázalo por el logo oficial)`);
}

// ── 3. Imagen Open Graph 1200×630 ──────────────────────────────────
const fondoOg = await sharp(join(PUB, "fondo-cancha.jpg")).resize(1200, 630, { fit: "cover" }).toBuffer();
const capa = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0A0A0A" stop-opacity="0.95"/><stop offset="1" stop-color="#0A0A0A" stop-opacity="0.6"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="80" y="170" width="90" height="12" fill="#FCD116"/><rect x="170" y="170" width="90" height="12" fill="#CE1126"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#FFFFFF">
    <text x="80" y="275" font-size="66" font-weight="700">¿Cómo vives el fútbol</text>
    <text x="80" y="355" font-size="66" font-weight="700">de salón en <tspan fill="#FCD116">Bogotá</tspan>?</text>
    <text x="80" y="430" font-size="30" fill="#D6D6D6">Encuesta de futsala.co con la Liga de Fútbol de Salón de Bogotá</text>
    <rect x="80" y="475" width="330" height="70" rx="35" fill="#FCD116"/>
    <text x="245" y="521" font-size="30" font-weight="700" fill="#0A0A0A" text-anchor="middle">Responde en 3 min</text>
  </g>
</svg>`;
const logoF = await sharp(join(PUB, "logos", "futsala.png")).resize({ height: 104 }).toBuffer();
const logoL = await sharp(join(PUB, "logos", "parche.png")).resize({ height: 110 }).toBuffer();
await sharp(fondoOg)
  .composite([
    { input: Buffer.from(capa) },
    { input: logoF, top: 50, left: 80 },
    { input: logoL, top: 50, left: 1200 - 80 - (await sharp(logoL).metadata()).width },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(join(PUB, "og-image.png"));
console.log("✓ public/og-image.png");

// ── 4. QR imprimible de la encuesta ────────────────────────────────
const urlQr = `${URL_SITIO}/?utm_source=qr_escenarios`;
await QRCode.toFile(join(PUB, "qr-encuesta.png"), urlQr, {
  width: 1200,
  margin: 3,
  errorCorrectionLevel: "H",
  color: { dark: "#0A0A0A", light: "#FFFFFF" },
});
console.log(`✓ public/qr-encuesta.png → ${urlQr}`);
