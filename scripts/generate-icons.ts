/**
 * Genera los iconos derivados a partir de public/logomeme.png.
 *
 *   npm run icons:generate
 *
 * Produce, dentro de src/app/ (donde el App Router los detecta solo y emite las
 * etiquetas <link> correspondientes):
 *
 *   icon.png              favicon de la pestaña
 *   apple-icon.png        icono de pantalla de inicio en iOS
 *   opengraph-image.png   tarjeta de previsualización al compartir el enlace
 *
 * Existe como script y no como recorte manual para que cambiar el logo sea
 * sustituir un fichero y volver a ejecutarlo.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "logomeme.png");
const APP_DIR = path.join(ROOT, "src", "app");

/** Crema del sistema de diseño (DESIGN.md §2.1). */
const CANVAS = "#FFFBF3";

async function main() {
  await mkdir(APP_DIR, { recursive: true });

  // Favicon. 96 px se ve nítido en pantallas retina y sigue pesando poco.
  await sharp(SOURCE)
    .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, "icon.png"));

  // iOS recorta a esquinas redondeadas y no admite transparencia: se aplana
  // sobre la crema para que no salga un fondo negro.
  await sharp(SOURCE)
    .resize(180, 180, { fit: "contain", background: CANVAS })
    .flatten({ background: CANVAS })
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, "apple-icon.png"));

  // Tarjeta social: 1200x630 con el logo sobre el fondo de la marca.
  const LOGO_SIZE = 360;
  const logo = await sharp(SOURCE).resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain" }).toBuffer();

  const fondo = Buffer.from(
    `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <radialGradient id="a" cx="15%" cy="0%" r="80%">
           <stop offset="0%" stop-color="#FF7A18" stop-opacity="0.16"/>
           <stop offset="100%" stop-color="#FF7A18" stop-opacity="0"/>
         </radialGradient>
         <radialGradient id="b" cx="88%" cy="8%" r="75%">
           <stop offset="0%" stop-color="#4ADE80" stop-opacity="0.16"/>
           <stop offset="100%" stop-color="#4ADE80" stop-opacity="0"/>
         </radialGradient>
       </defs>
       <rect width="1200" height="630" fill="${CANVAS}"/>
       <rect width="1200" height="630" fill="url(#a)"/>
       <rect width="1200" height="630" fill="url(#b)"/>
       <text x="600" y="556" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
             font-size="26" letter-spacing="3" fill="#7C6957">memecoin.codezun.com</text>
     </svg>`,
  );

  await sharp(fondo)
    // Ligeramente por encima del centro: deja aire para la línea del dominio.
    .composite([{ input: logo, top: 96, left: Math.round((1200 - LOGO_SIZE) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, "opengraph-image.png"));

  // Versión ligera del logo para la cabecera: el original son 500x500 y ~300 KB.
  await sharp(SOURCE)
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, "public", "logo-mark.png"));

  console.log("✓ icon.png, apple-icon.png, opengraph-image.png y public/logo-mark.png generados");
}

main().catch((error) => {
  console.error("✗ No se han podido generar los iconos:", error);
  process.exit(1);
});
