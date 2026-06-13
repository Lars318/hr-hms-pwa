/**
 * Minimal PNG-generator uten avhengigheter.
 * Kjør: node scripts/generate-icons-simple.mjs
 * Lager enkle einfargede ikoner som er gyldige for PWA-manifest.
 */

import { createWriteStream, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function makePNG(size, r, g, b) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB color type
  // compression, filter, interlace = 0

  // Raw pixel data: each row has filter byte (0) + RGB pixels
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize, 0);
  for (let y = 0; y < size; y++) {
    const base = y * rowSize;
    raw[base] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      raw[base + 1 + x * 3] = r;
      raw[base + 1 + x * 3 + 1] = g;
      raw[base + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const { writeFileSync } = await import("fs");
const BLUE = [37, 99, 235]; // #2563eb

for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), makePNG(size, ...BLUE));
  writeFileSync(join(OUT, `icon-${size}-maskable.png`), makePNG(size, 29, 78, 216)); // slightly darker
  console.log(`✓ ${size}×${size}`);
}

console.log("Placeholder-ikoner generert. Erstatt med ekte grafikk før produksjon.");
