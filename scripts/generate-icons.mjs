import zlib from "zlib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CRC32 ────────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// ─── Gradient ring color ──────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

const GRADIENT_STOPS = [
  [0,    [45,  90,  39]],   // #2d5a27
  [0.25, [127, 184, 154]],  // #7fb89a
  [0.5,  [201, 147, 90]],   // #c9935a
  [0.75, [74,  124, 89]],   // #4a7c59
  [1,    [45,  90,  39]],   // #2d5a27
];

function gradientColor(t) {
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const [t0, c0] = GRADIENT_STOPS[i];
    const [t1, c1] = GRADIENT_STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      const lt = (t - t0) / (t1 - t0);
      return c0.map((c, j) => Math.round(lerp(c, c1[j], lt)));
    }
  }
  return GRADIENT_STOPS[0][1];
}

// ─── Distance from point to segment ──────────────────────────────────────────
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const tt = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - x1 - tt * dx, py - y1 - tt * dy);
}

// ─── Render icon ──────────────────────────────────────────────────────────────
function renderIcon(size) {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.335;
  const bg = [13, 31, 26];          // #0D1F1A
  const textColor = [127, 184, 154]; // #7fb89a

  // Y glyph in normalised coords (centre = 0,0; unit = half-size)
  const s = size;
  const tw = 18; // stroke half-thickness in 512px units → scaled below

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.hypot(dx, dy);

      let r, g, b;

      if (dist <= innerR) {
        // Inside: draw "Y" letter
        // Coordinates relative to centre, normalised to 512-space
        const nx = (dx / s) * 512;
        const ny = (dy / s) * 512;
        const thick = tw * (size / 512);

        const onBranchL = distSeg(nx, ny, -100, -130,  0, -30) < thick;
        const onBranchR = distSeg(nx, ny,  100, -130,  0, -30) < thick;
        const onStem    = distSeg(nx, ny,    0,  -30,  0, 130) < thick;

        if (onBranchL || onBranchR || onStem) {
          [r, g, b] = textColor;
        } else {
          [r, g, b] = bg;
        }
      } else if (dist > outerR) {
        [r, g, b] = bg;
      } else {
        // Ring: gradient based on angle
        const angle = Math.atan2(dy, dx) + Math.PI; // 0..2π
        const t = angle / (2 * Math.PI);
        [r, g, b] = gradientColor(t);
      }

      const off = y * rowSize + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

// ─── Write files ──────────────────────────────────────────────────────────────
const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const buf = renderIcon(size);
  const out = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`✓ ${out} (${buf.length} bytes)`);
}
