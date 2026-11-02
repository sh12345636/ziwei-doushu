/**
 * lib/ai/chart-context —— 把排盘结果（ZiweiChart）压成给大模型读的紧凑文本。
 *
 * 原则：
 *   1. 只喂「盘上有什么」，不喂任何断语 —— 断语由模型依据命理规则现场推导。
 *   2. 密度优先：同一宫的主星、亮度、四化、煞星合并成一行，减少 token。
 *   3. 空宫写明「借对宫某某」，避免模型误判为「该宫无星」。
 */
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const PALACE_ORDER = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
];

function starText(s: Star): string {
  const bits = [s.name];
  if (s.brightnessRaw) bits.push(`[${s.brightnessRaw}]`);
  if (s.siHua) bits.push(`化${s.siHua}`);
  return bits.join('');
}

function palaceLine(p: Palace): string {
  const major = p.stars.filter((s) => s.type === 'major');
  const minor = p.stars.filter((s) => s.type !== 'major');

  const majorStr = major.length
    ? major.map(starText).join(' ')
    : p.borrowedStars && p.borrowedStars.length
      ? `（空宫 借对宫 ${p.borrowedStars.join('、')}）`
      : '（空宫）';

  const minorStr = minor.length ? ' ｜辅煞：' + minor.map(starText).join(' ') : '';

  const flags: string[] = [];
  if (p.isMingGong) flags.push('命宫');
  if (p.isShenGong) flags.push('身宫');
  if (p.selfSihua && p.selfSihua.length) {
    flags.push('宫干自化：' + p.selfSihua.map((x) => `${x.starName}化${x.siHua}`).join('、'));
  }
  if (p.daXianAge) flags.push(`大限${p.daXianAge[0]}–${p.daXianAge[1]}`);
  const flagStr = flags.length ? `  「${flags.join(' · ')}」` : '';

  return `${BRANCHES[p.branch]}宫 · ${p.name}（宫干${STEMS[p.stem]}）｜主星：${majorStr}${minorStr}${flagStr}`;
}

/** 单张命盘 → 文本 */
export function chartToPromptText(chart: ZiweiChart): string {
  const bi = chart.birthInfo;
  const li = chart.lunarInfo;

  const lines: string[] = [];

  // ① 基本信息
  lines.push('【基本资料】');
  lines.push(
    `公历 ${bi.year}年${bi.month}月${bi.day}日 ${BRANCHES[bi.hour] ?? '?'}时 · ` +
      `${bi.gender === 'male' ? '男' : '女'}命` +
      (bi.city ? ` · 出生地${bi.city}` : '') +
      (bi.longitude !== undefined ? `（经度${bi.longitude}）` : ''),
  );
  lines.push(
    `农历 ${li.lunarYear}年${li.isLeapMonth ? '闰' : ''}${Math.abs(li.lunarMonth)}月${li.lunarDay}日 · ` +
      `年柱 ${STEMS[li.yearStem]}${BRANCHES[li.yearBranch]}` +
      (li.fourPillars ? ` · 四柱 ${li.fourPillars.join(' ')}` : ''),
  );
  lines.push(
    `命宫在${BRANCHES[chart.mingGongBranch]} · 身宫在${BRANCHES[chart.shenGongBranch]} · ` +
      `${chart.wuxingJuName} · 紫微在${BRANCHES[chart.ziweiPos]}` +
      (chart.mingZhu ? ` · 命主${chart.mingZhu}` : '') +
      (chart.shenZhu ? ` · 身主${chart.shenZhu}` : '') +
      (chart.yinYangGender ? ` · ${chart.yinYangGender}` : ''),
  );

  // ② 十二宫（按命宫起逆时针的宫位顺序，读起来更符合命理习惯）
  lines.push('');
  lines.push('【十二宫】（按「命→兄弟→夫妻→…」顺序）');
  const ordered = PALACE_ORDER
    .map((name) => chart.palaces.find((p) => p.name === name))
    .filter((p): p is Palace => Boolean(p));
  for (const p of ordered) lines.push('· ' + palaceLine(p));

  // ③ 生年四化
  const sihua = chart.palaces.flatMap((p) =>
    p.stars.filter((s) => s.siHua).map((s) => {
      const where = p.name;
      return `${s.name}化${s.siHua}（落${where}宫）`;
    }),
  );
  lines.push('');
  lines.push('【生年四化】' + (sihua.length ? sihua.join('、') : '本盘无'));

  // ④ 大限
  if (chart.daXians.length) {
    lines.push('');
    lines.push('【大限】');
    lines.push(
      chart.daXians
        .slice(0, 12)
        .map((d) => `${d.startAge}–${d.endAge}岁：${d.palaceName}宫${d.stemName ? `（宫干${d.stemName}）` : ''}`)
        .join(' ｜ '),
    );
    lines.push(`当前 ${chart.currentAge} 岁，行第 ${chart.currentDaXianIndex + 1} 大限。`);
  }

  // ⑤ 格局（引擎规则库识别结果）
  try {
    const patterns = detectPatterns(chart);
    if (patterns.length) {
      lines.push('');
      lines.push('【命中格局】（由格局规则库自动识别）');
      for (const pt of patterns) {
        lines.push(`· ${pt.name}：${pt.description ?? ''}`.trimEnd());
      }
    }
  } catch {
    // 格局识别失败不影响解读
  }

  return lines.join('\n');
}

/** 合盘：两张盘 + 关键宫位对照 */
export function hemingToPromptText(chartA: ZiweiChart, chartB: ZiweiChart): string {
  const rel = (chart: ZiweiChart, label: string) => {
    const key = ['命宫', '夫妻', '福德'];
    const rows = key.map((name) => {
      const p = chart.palaces.find((x) => x.name === name);
      if (!p) return `${name}：—`;
      const major = p.stars.filter((s) => s.type === 'major');
      const txt = major.length
        ? major.map(starText).join(' ')
        : p.borrowedStars?.length
          ? `（空宫 借 ${p.borrowedStars.join('、')}）`
          : '（空宫）';
      return `${name}（${BRANCHES[p.branch]}）：${txt}`;
    });
    return `${label}\n  ${rows.join('\n  ')}`;
  };

  return [
    '=== 甲方命盘 ===',
    chartToPromptText(chartA),
    '',
    '=== 乙方命盘 ===',
    chartToPromptText(chartB),
    '',
    '=== 合盘关键宫位对照 ===',
    rel(chartA, '甲方：'),
    rel(chartB, '乙方：'),
  ].join('\n');
}
