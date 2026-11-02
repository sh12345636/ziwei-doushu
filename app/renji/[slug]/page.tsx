/**
 * /renji/[slug] — 人纪模块详情
 */
import { notFound } from 'next/navigation';
import NihaiModuleDetail from '@/components/nihai/NihaiModuleDetail';
import { AcupointBoard, FormulaBoard } from '@/components/nihai/NihaiDataTables';
import { RENJI_MODULES } from '@/lib/nihai';

export const dynamicParams = false;

export function generateStaticParams() {
  return RENJI_MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = RENJI_MODULES.find((x) => x.slug === slug);
  if (!m) return {};
  return {
    title: `${m.name} · 人纪 · ${m.subtitle}`,
    description: m.description.slice(0, 120),
  };
}

export default async function RenjiModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = RENJI_MODULES.find((x) => x.slug === slug);
  if (!m) notFound();

  const showAcu = slug === 'zhenjiu';
  const showFormula = slug === 'bencao' || slug === 'shanghan' || slug === 'jingui';

  return (
    <NihaiModuleDetail category="renji" module={m} siblings={RENJI_MODULES}>
      {showAcu && <AcupointBoard />}
      {showFormula && <FormulaBoard />}
    </NihaiModuleDetail>
  );
}
