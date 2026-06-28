// Genererer PWA-ikoner (hjemskjerm) fra en vektor-"T" — ingen font-avhengighet.
// Kjør: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const GREEN = "hsl(100, 28%, 30%)"; // --primary (Truls HR)
const ORANGE = "#FF5000"; // Pulsfollo-aksent

// `inset` styrer hvor mye luft rundt "T"-en (maskable trenger større safe zone).
function svg({ rounded, inset }) {
  const S = 512;
  const r = rounded ? 112 : 0;
  // "T" sentrert, skalert etter inset.
  const barW = 256 * (1 - inset);
  const stemH = 250 * (1 - inset);
  const thick = 56 * (1 - inset);
  const cx = S / 2;
  const topY = (S - (stemH + thick)) / 2 + 6;
  const barX = cx - barW / 2;
  const stemX = cx - thick / 2;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" rx="${r}" ry="${r}" fill="${GREEN}"/>
  <rect x="${barX}" y="${topY}" width="${barW}" height="${thick}" rx="${thick / 4}" fill="#ffffff"/>
  <rect x="${stemX}" y="${topY}" width="${thick}" height="${stemH}" rx="${thick / 4}" fill="#ffffff"/>
  <circle cx="${cx + barW / 2 - thick * 0.1}" cy="${topY - thick * 0.55}" r="${thick * 0.42}" fill="${ORANGE}"/>
</svg>`);
}

const targets = [
  { file: "icon-192.png", size: 192, rounded: true, inset: 0 },
  { file: "icon-512.png", size: 512, rounded: true, inset: 0 },
  { file: "icon-192-maskable.png", size: 192, rounded: false, inset: 0.22 },
  { file: "icon-512-maskable.png", size: 512, rounded: false, inset: 0.22 },
  { file: "apple-touch-icon.png", size: 180, rounded: false, inset: 0 }, // iOS runder selv
];

for (const t of targets) {
  await sharp(svg({ rounded: t.rounded, inset: t.inset }))
    .resize(t.size, t.size)
    .png()
    .toFile(join(outDir, t.file));
  console.log("✓", t.file);
}
console.log("Ferdig — ikoner skrevet til public/icons/");
