/**
 * 引擎演示：不启动 Next 界面，直接用排盘引擎算一张真实命盘并打印。
 * 跑：npx tsx scripts/demo-chart.ts
 */
import { generateChart } from '../lib/ziwei/algorithm';
import type { BirthInfo } from '../lib/ziwei/types';

const BR = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const cases: BirthInfo[] = [
  { year: 1990, month: 1, day: 1, hour: 0, gender: 'male' },
  { year: 1995, month: 6, day: 15, hour: 6, gender: 'female' },
  { year: 2000, month: 12, day: 31, hour: 11, gender: 'male' },
];

for (const bi of cases) {
  const chart = generateChart(bi);
  const li = chart.lunarInfo;

  console.log('\n' + '='.repeat(72));
  console.log(
    `公历 ${bi.year}-${String(bi.month).padStart(2, '0')}-${String(bi.day).padStart(2, '0')} ` +
      `${BR[bi.hour]}时  ${bi.gender === 'male' ? '男' : '女'}`,
  );
  console.log(
    `农历 ${li.lunarYear}年${li.isLeapMonth ? '闰' : ''}${Math.abs(li.lunarMonth)}月${li.lunarDay}日  ` +
      `年柱 ${STEMS[li.yearStem]}${BR[li.yearBranch]}` +
      (li.fourPillars ? `  四柱 ${li.fourPillars.join(' ')}` : ''),
  );
  console.log(
    `命宫 ${BR[chart.mingGongBranch]}宫  身宫 ${BR[chart.shenGongBranch]}宫  ` +
      `${chart.wuxingJuName}  紫微在${BR[chart.ziweiPos]}  ` +
      `命主 ${chart.mingZhu ?? '-'}  身主 ${chart.shenZhu ?? '-'}  ${chart.yinYangGender ?? ''}`,
  );

  console.log('\n宫位（按地支序）:');
  for (const p of chart.palaces) {
    const major = p.stars.filter((s) => s.type === 'major');
    const minor = p.stars.filter((s) => s.type !== 'major');

    const fmt = (s: (typeof p.stars)[number]) =>
      `${s.name}${s.brightnessRaw ? `[${s.brightnessRaw}]` : ''}${s.siHua ? `·化${s.siHua}` : ''}`;

    const tags: string[] = [];
    if (p.isMingGong) tags.push('★命宫');
    if (p.isShenGong) tags.push('身宫');
    if (p.daXianAge) tags.push(`大限${p.daXianAge[0]}-${p.daXianAge[1]}`);
    if (p.selfSihua?.length) tags.push(`自化:${p.selfSihua.map((x) => x.starName + x.siHua).join(',')}`);

    const majorStr = major.length
      ? major.map(fmt).join(' ')
      : p.borrowedStars?.length
        ? `(空宫 借 ${p.borrowedStars.join('、')})`
        : '(空宫)';

    console.log(
      `  ${BR[p.branch]}${STEMS[p.stem]} ${p.name.padEnd(3, '　')} │ ${majorStr}` +
        (minor.length ? `  ＋ ${minor.map(fmt).join(' ')}` : '') +
        (tags.length ? `  «${tags.join(' ')}»` : ''),
    );
  }

  const sihua = chart.palaces.flatMap((p) =>
    p.stars.filter((s) => s.siHua).map((s) => `${s.name}化${s.siHua}(${p.name})`),
  );
  console.log(`\n生年四化: ${sihua.join('  ') || '无'}`);
  console.log(
    `大限: ${chart.daXians
      .slice(0, 4)
      .map((d) => `${d.startAge}-${d.endAge}(${d.palaceName}${d.stemName ?? ''})`)
      .join(' → ')} …`,
  );
}

console.log('\n' + '='.repeat(72));
console.log('✅ 引擎演示完毕：3 张命盘全部由 lib/ziwei/algorithm.ts 现场算出\n');
