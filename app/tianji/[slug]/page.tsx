/**
 * /tianji/[slug] — 天纪模块详情
 */
import { notFound } from 'next/navigation';
import NihaiModuleDetail from '@/components/nihai/NihaiModuleDetail';
import { HexagramBoard, FengshuiBoard } from '@/components/nihai/NihaiDataTables';
import { TIANJI_MODULES } from '@/lib/nihai';

export const dynamicParams = false;

export function generateStaticParams() {
  return TIANJI_MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = TIANJI_MODULES.find((x) => x.slug === slug);
  if (!m) return {};
  return {
    title: `${m.name} · 天纪 · ${m.subtitle}`,
    description: m.description.slice(0, 120),
  };
}

export default async function TianjiModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = TIANJI_MODULES.find((x) => x.slug === slug);
  if (!m) notFound();

  return (
    <NihaiModuleDetail category="tianji" module={m} siblings={TIANJI_MODULES}>
      {slug === 'yijing' && <HexagramBoard />}
      {slug === 'kanyu' && <FengshuiBoard />}
    </NihaiModuleDetail>
  );
}
