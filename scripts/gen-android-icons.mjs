/**
 * 生成 Android 原生图标（替换 Capacitor 默认的蓝白图标）
 * 跑：node scripts/gen-android-icons.mjs
 *
 * 输出到 android/app/src/main/res：
 *   · 各 mipmap 目录：ic_launcher.png / ic_launcher_round.png / ic_launcher_foreground.png
 *   · 各 drawable 目录：splash.png（启动画面）
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const RES = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

// ── PNG 编码 ──
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
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ── 绘制命盘图标 ──
/**
 * @param size 画布边长
 * @param opts.label  内边距比例（0=满画布）
 * @param opts.transparent  背景透明（自适应图标前景层用）
 * @param opts.round  画成圆形（圆形图标用）
 */
function drawChart(size, { label = 0, transparent = false, round = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const half = (size * (1 - label)) / 2;

  const gold = [212, 168, 67];
  const goldDim = [140, 108, 42];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = (x - cx) / size;
      const dy = (y - cy) / size;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);

      let R, G, B, A = 255;

      if (transparent) {
        // 自适应图标前景层：透明底，只画金色线条与星点
        R = 0; G = 0; B = 0; A = 0;
      } else {
        // 深空径向渐变
        R = Math.round(12 + (6 - 12) * r);
        G = Math.round(24 + (12 - 24) * r);
        B = Math.round(40 + (22 - 40) * r);
      }

      const gx = (x - cx) / half;
      const gy = (y - cy) / half;
      const inside = Math.abs(gx) <= 1 && Math.abs(gy) <= 1;

      if (inside) {
        const lineW = Math.max(1, size * 0.007);

        // 3 列 4 行分隔线
        for (const fx of [-1 / 3, 1 / 3]) {
          if (Math.abs(gx - fx) * half < lineW) {
            R = goldDim[0]; G = goldDim[1]; B = goldDim[2]; A = 255;
          }
        }
        for (const fy of [-0.5, 0, 0.5]) {
          if (Math.abs(gy - fy) * half < lineW) {
            R = goldDim[0]; G = goldDim[1]; B = goldDim[2]; A = 255;
          }
        }
        // 外框
        const edge = Math.min(Math.abs(Math.abs(gx) - 1), Math.abs(Math.abs(gy) - 1)) * half;
        if (edge < lineW * 1.7) {
          R = gold[0]; G = gold[1]; B = gold[2]; A = 255;
        }
      }

      // 中心星点
      const centerR = size * 0.075 * (1 - label);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < centerR) {
        const glow = 1 - dist / centerR;
        R = Math.round(gold[0] * (0.65 + 0.35 * glow));
        G = Math.round(gold[1] * (0.65 + 0.35 * glow));
        B = Math.round(gold[2] * (0.65 + 0.35 * glow));
        A = 255;
      } else if (dist < centerR * 2.1) {
        const glow = 1 - (dist - centerR) / (centerR * 1.1);
        if (transparent) {
          R = gold[0]; G = gold[1]; B = gold[2]; A = Math.round(90 * glow);
        } else {
          R = Math.round(R + (gold[0] - R) * glow * 0.3);
          G = Math.round(G + (gold[1] - G) * glow * 0.3);
          B = Math.round(B + (gold[2] - B) * glow * 0.3);
        }
      }

      // 圆形裁剪
      if (round) {
        const radius = size / 2;
        if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) > radius) A = 0;
      }

      rgba[i] = R;
      rgba[i + 1] = G;
      rgba[i + 2] = B;
      rgba[i + 3] = A;
    }
  }
  return encodePNG(size, size, rgba);
}

if (!fs.existsSync(RES)) {
  console.error(`找不到 Android 资源目录：${RES}\n先跑 npx cap add android`);
  process.exit(1);
}

// ── 各密度对应尺寸 ──
const DENSITIES = [
  { dir: 'mipmap-mdpi', launch: 48, fg: 108 },
  { dir: 'mipmap-hdpi', launch: 72, fg: 162 },
  { dir: 'mipmap-xhdpi', launch: 96, fg: 216 },
  { dir: 'mipmap-xxhdpi', launch: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', launch: 192, fg: 432 },
];

for (const d of DENSITIES) {
  const dir = path.join(RES, d.dir);
  if (!fs.existsSync(dir)) continue;

  // 完整图标
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), drawChart(d.launch));
  // 圆形图标：内容缩到 72%（方框内切于圆，避免四角被裁）
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), drawChart(d.launch, { round: true, label: 0.28 }));
  // 自适应图标前景层（留 22% 边距给系统的遮罩裁剪）
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), drawChart(d.fg, { transparent: true, label: 0.28 }));

  console.log(`✓ ${d.dir}  launcher ${d.launch}px  foreground ${d.fg}px`);
}

// ── 启动画面（深空底 + 居中图标） ──
const SPLASHES = [
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  { dir: 'drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];

function drawSplash(w, h) {
  const rgba = Buffer.alloc(w * h * 4);
  const cx = w / 2;
  const cy = h / 2;
  const iconSize = Math.round(Math.min(w, h) * 0.38);
  const icon = drawChart(iconSize);
  // 解出图标像素（自己重新绘制一份，避免解析 PNG）
  const iconPixels = drawChartPixels(iconSize);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // 深空底 + 极淡径向光
      const dx = (x - cx) / w;
      const dy = (y - cy) / h;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      rgba[i] = Math.round(10 + (4 - 10) * r);
      rgba[i + 1] = Math.round(18 + (8 - 18) * r);
      rgba[i + 2] = Math.round(30 + (16 - 30) * r);
      rgba[i + 3] = 255;

      // 贴中心图标
      const ix = Math.round(x - (cx - iconSize / 2));
      const iy = Math.round(y - (cy - iconSize / 2));
      if (ix >= 0 && ix < iconSize && iy >= 0 && iy < iconSize) {
        const p = (iy * iconSize + ix) * 4;
        const a = iconPixels[p + 3] / 255;
        if (a > 0) {
          rgba[i] = Math.round(rgba[i] * (1 - a) + iconPixels[p] * a);
          rgba[i + 1] = Math.round(rgba[i + 1] * (1 - a) + iconPixels[p + 1] * a);
          rgba[i + 2] = Math.round(rgba[i + 2] * (1 - a) + iconPixels[p + 2] * a);
        }
      }
    }
  }
  return encodePNG(w, h, rgba);
}

/** 返回图标的原始 RGBA 像素（用于合成启动图） */
function drawChartPixels(size) {
  const png = drawChart(size);
  // 直接重算一遍像素（避免解码 PNG）
  return pngToRGBA(size, size, png);
}

/** 极简 PNG 解码：仅支持我们自己的 RGBA8 无滤波编码 */
function pngToRGBA(w, h, png) {
  // 找到 IDAT
  let off = 8;
  let idat = Buffer.alloc(0);
  while (off < png.length) {
    const len = png.readUInt32BE(off);
    const type = png.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') idat = Buffer.concat([idat, png.subarray(off + 8, off + 8 + len)]);
    off += 12 + len;
  }
  const raw = zlib.inflateSync(idat);
  const stride = w * 4;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    raw.copy(out, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
  }
  return out;
}

for (const s of SPLASHES) {
  const dir = path.join(RES, s.dir);
  if (!fs.existsSync(dir)) continue;
  fs.writeFileSync(path.join(dir, 'splash.png'), drawSplash(s.w, s.h));
  console.log(`✓ ${s.dir}  splash ${s.w}×${s.h}`);
}

// 默认 splash（drawable 根目录）
const drawableDir = path.join(RES, 'drawable');
if (fs.existsSync(drawableDir)) {
  fs.writeFileSync(path.join(drawableDir, 'splash.png'), drawSplash(480, 800));
  console.log('✓ drawable  splash 480×800');
}

console.log('\nAndroid 图标与启动图已全部替换。');
