/**
 * Genererer enkle placeholder PNG-ikoner for HR/HMS PWA.
 * Kjør én gang: node scripts/generate-icons.mjs
 *
 * Krever: npm install --save-dev canvas  (eller @napi-rs/canvas)
 * Hvis canvas ikke er tilgjengelig: erstattes av ekte SVG→PNG-konverteringsverktøy
 * som Inkscape, ImageMagick, eller en online-tjeneste.
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const padding = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - padding * 2;

  // Background
  ctx.fillStyle = "#2563eb"; // blue-600
  ctx.fillRect(0, 0, size, size);

  // Rounded square for maskable safe zone
  if (maskable) {
    ctx.fillStyle = "#1d4ed8"; // blue-700 inner
    const r = inner * 0.2;
    ctx.beginPath();
    ctx.moveTo(padding + r, padding);
    ctx.arcTo(padding + inner, padding, padding + inner, padding + inner, r);
    ctx.arcTo(padding + inner, padding + inner, padding, padding + inner, r);
    ctx.arcTo(padding, padding + inner, padding, padding, r);
    ctx.arcTo(padding, padding, padding + inner, padding, r);
    ctx.closePath();
    ctx.fill();
  }

  // Text: HR
  const fontSize = Math.round(inner * 0.38);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HR", size / 2, size / 2 - fontSize * 0.2);

  const fontSize2 = Math.round(inner * 0.22);
  ctx.font = `${fontSize2}px Arial, sans-serif`;
  ctx.fillText("HMS", size / 2, size / 2 + fontSize * 0.5);

  return canvas.toBuffer("image/png");
}

const sizes = [192, 512];
for (const size of sizes) {
  writeFileSync(join(OUT, `icon-${size}.png`), generateIcon(size, false));
  writeFileSync(join(OUT, `icon-${size}-maskable.png`), generateIcon(size, true));
  console.log(`✓ icon-${size}.png og icon-${size}-maskable.png`);
}

console.log("\nIkoner generert i public/icons/");
console.log("Erstatt med profesjonelle ikoner før produksjonslansering.");
