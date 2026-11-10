/**
 * Convierte assets/logos-originales/futsala-parche-color.png (fondo negro) en
 * public/logos/parche.png con fondo transparente.
 * Rellena desde los bordes solo los píxeles casi negros conectados al borde, así
 * el negro del ícono dentro del parche se conserva.
 * Uso: node scripts/parche-transparente.mjs
 */
import sharp from "sharp";

const ORIGEN = "assets/logos-originales/futsala-parche-color.png";
const DESTINO = "public/logos/parche.png";
const N = 1200; // resolución de trabajo
const UMBRAL = 28; // canal máximo para considerar "fondo"

const base = await sharp(ORIGEN).trim({ background: "#000000", threshold: 20 }).resize(N, N, { fit: "contain", background: "#000" });
const { data } = await base.removeAlpha().raw().toBuffer({ resolveWithObject: true });

const total = N * N;
const fondo = new Uint8Array(total);
const max = (i) => Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
const pila = [];
for (let i = 0; i < N; i++) pila.push(i, (N - 1) * N + i, i * N, i * N + N - 1);
while (pila.length) {
  const i = pila.pop();
  if (fondo[i] || max(i) > UMBRAL) continue;
  fondo[i] = 1;
  const x = i % N, y = (i / N) | 0;
  if (x > 0) pila.push(i - 1);
  if (x < N - 1) pila.push(i + 1);
  if (y > 0) pila.push(i - N);
  if (y < N - 1) pila.push(i + N);
}

const rgba = Buffer.alloc(total * 4);
for (let i = 0; i < total; i++) {
  rgba[i * 4] = data[i * 3];
  rgba[i * 4 + 1] = data[i * 3 + 1];
  rgba[i * 4 + 2] = data[i * 3 + 2];
  // Borde suave: los píxeles junto al fondo se vuelven parcialmente transparentes según su brillo
  let a = 255;
  if (fondo[i]) a = 0;
  else {
    const x = i % N, y = (i / N) | 0;
    const vecino =
      (x > 0 && fondo[i - 1]) || (x < N - 1 && fondo[i + 1]) || (y > 0 && fondo[i - N]) || (y < N - 1 && fondo[i + N]);
    if (vecino) a = Math.min(255, Math.round((max(i) / 80) * 255));
  }
  rgba[i * 4 + 3] = a;
}

await sharp(rgba, { raw: { width: N, height: N, channels: 4 } })
  .trim()
  .resize(320, 320, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(DESTINO);
console.log(`✓ ${DESTINO}`);
