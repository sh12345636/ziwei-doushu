/**
 * 生成 PWA 图标（纯 Node，零依赖，自己手写 PNG 编码）
 * 跑：node scripts/gen-icons.mjs
 *
 * 图案：深空底 + 金色「命盘方格」+ 中心星点，呼应紫微斗数的 12 宫布局。
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'icons');

// ── CRC32 ──
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // 每行前置 filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 绘制 ──
function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // maskable 图标要把内容缩到安全区（80%）
  const contentScale = maskable ? 0.62 : 0.78;
  const half = (size * contentScale) / 2;

  // 颜色
  const bg0 = [6, 12, 22];        // 深空
  const bg1 = [12, 24, 40];       // 略亮
  const gold = [212, 168, 67];    // 主金
  const goldDim = [140, 108, 42];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // 径向渐变底
      const dx = (x - cx) / size;
      const dy = (y - cy) / size;
      const r = Math.sqrt(dx * dx + dy * dy) * 2;
      const t = Math.min(1, r);
      let R = Math.round(bg1[0] + (bg0[0] - bg1[0]) * t);
      let G = Math.round(bg1[1] + (bg0[1] - bg1[1]) * t);
      let B = Math.round(bg1[2] + (bg0[2] - bg1[2]) * t);

      // 12 宫方格：3x4 网格线（象征命盘十二宫）
      const gx = (x - cx) / half;   // -1..1
      const gy = (y - cy) / half;
      if (Math.abs(gx) <= 1 && Math.abs(gy) <= 1) {
        const lineW = Math.max(1, size * 0.006);

        // 3 列 4 行的分隔线
        for (const fx of [-1 / 3, 1 / 3]) {
          if (Math.abs(gx - fx) * half < lineW) {
            R = goldDim[0]; G = goldDim[1]; B = goldDim[2];
          }
        }
        for (const fy of [-0.5, 0, 0.5]) {
          if (Math.abs(gy - fy) * half < lineW) {
            R = goldDim[0]; G = goldDim[1]; B = goldDim[2];
          }
        }

        // 外框
        const edge = Math.min(Math.abs(Math.abs(gx) - 1), Math.abs(Math.abs(gy) - 1)) * half;
        if (edge < lineW * 1.6) {
          R = gold[0]; G = gold[1]; B = gold[2];
        }
      }

      // 中心星点
      const centerR = size * 0.075;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < centerR) {
        const glow = 1 - dist / centerR;
        R = Math.round(gold[0] * (0.6 + 0.4 * glow));
        G = Math.round(gold[1] * (0.6 + 0.4 * glow));
        B = Math.round(gold[2] * (0.6 + 0.4 * glow));
      } else if (dist < centerR * 2.1) {
        // 柔和外晕
        const glow = 1 - (dist - centerR) / (centerR * 1.1);
        R = Math.round(R + (gold[0] - R) * glow * 0.35);
        G = Math.round(G + (gold[1] - G) * glow * 0.35);
        B = Math.round(B + (gold[2] - B) * glow * 0.35);
      }

      rgba[i] = R;
      rgba[i + 1] = G;
      rgba[i + 2] = B;
      rgba[i + 3] = 255;
    }
  }

  return encodePNG(size, size, rgba);
}

fs.mkdirSync(OUT, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon-32.png', size: 32, maskable: false },
];

for (const t of targets) {
  const png = drawIcon(t.size, { maskable: t.maskable });
  fs.writeFileSync(path.join(OUT, t.file), png);
  console.log(`✓ ${t.file}  ${t.size}×${t.size}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log('\n图标已生成到 public/icons/');
