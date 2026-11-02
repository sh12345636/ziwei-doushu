/**
 * /diji/[slug] — 地纪模块详情
 */
import { notFound } from 'next/navigation';
import NihaiModuleDetail from '@/components/nihai/NihaiModuleDetail';
import { FengshuiBoard } from '@/components/nihai/NihaiDataTables';
import { DIJI_MODULES } from '@/lib/nihai';

export const dynamicParams = false;

export function generateStaticParams() {
  return DIJI_MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = DIJI_MODULES.find((x) => x.slug === slug);
  if (!m) return {};
  return {
    title: `${m.name} · 地纪 · ${m.subtitle}`,
    description: m.description.slice(0, 120),
  };
}

export default async function DijiModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = DIJI_MODULES.find((x) => x.slug === slug);
  if (!m) notFound();

  return (
    <NihaiModuleDetail category="diji" module={m} siblings={DIJI_MODULES}>
      {(slug === 'kanyu-theory' || slug === 'geography') && <FengshuiBoard />}
    </NihaiModuleDetail>
  );
}
