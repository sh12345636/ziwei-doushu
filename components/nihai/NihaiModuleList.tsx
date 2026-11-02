/**
 * 三纪模块列表 —— 天纪 / 地纪 / 人纪 共用
 *
 * 纯静态：数据全部来自 lib/nihai，构建时就渲染成 HTML，不需要服务端。
 */
import Link from 'next/link';
import type { NiModule, SanJiCategory } from '@/lib/nihai/types';

const CATEGORY_META: Record<
  SanJiCategory,
  { title: string; en: string; tagline: string; intro: string }
> = {
  tianji: {
    title: '天纪',
    en: 'TIAN JI',
    tagline: '上知天文 · 术数体系',
    intro:
      '1994 年录制，共 24 集、约 48 小时。讲义分《天机道》《人间道》《地脉道》《64 卦易图》四册，涵盖紫微斗数、易经六十四卦、堪舆、推命、面相与测字。',
  },
  diji: {
    title: '地纪',
    en: 'DI JI',
    tagline: '下知地理 · 倪师未竟之业',
    intro:
      '倪师原计划 60 岁后著述地纪，2012 年辞世时仅留下构想与天纪中堪舆学的理论基础。本板块为后辈对遗稿的整理与补注。',
  },
  renji: {
    title: '人纪',
    en: 'REN JI',
    tagline: '中知人事 · 中医五课',
    intro:
      '人纪五课：针灸大成、黄帝内经、神农本草经、伤寒论、金匮要略。是倪师留给后学最完整的一套中医教学体系。',
  },
};

const STATUS_LABEL: Record<NiModule['status'], { text: string; color: string }> = {
  active: { text: '已整理', color: '#10b981' },
  preview: { text: '部分整理', color: '#d4a843' },
  coming: { text: '筹备中', color: '#8b8b8b' },
};

export default function NihaiModuleList({
  category,
  modules,
}: {
  category: SanJiCategory;
  modules: NiModule[];
}) {
  const meta = CATEGORY_META[category];
  const totalChapters = modules.reduce((n, m) => n + (m.chapters?.length ?? 0), 0);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* 顶栏 */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}
      >
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← 返回首页
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.3em' }}>
          {meta.title} · {meta.en}
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          起盘 →
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center px-6 py-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to right, transparent, rgba(184,146,42,0.4))' }} />
          <span style={{ fontSize: '11px', color: 'var(--ac)', letterSpacing: '0.4em' }}>{meta.tagline}</span>
          <div style={{ height: '1px', width: '48px', background: 'linear-gradient(to left, transparent, rgba(184,146,42,0.4))' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.15em', marginBottom: '14px' }}>
          {meta.title}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tx-2)', letterSpacing: '0.05em', maxWidth: '680px', margin: '0 auto', lineHeight: 1.8 }}>
          {meta.intro}
        </p>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginTop: '18px', letterSpacing: '0.1em' }}>
          <strong style={{ color: 'var(--ac)' }}>{modules.length}</strong> 个模块 ·{' '}
          <strong style={{ color: 'var(--ac)' }}>{totalChapters}</strong> 个章节
        </div>
      </div>

      {/* 模块列表 */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {modules
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((m) => {
              const st = STATUS_LABEL[m.status];
              return (
                <Link
                  key={m.id}
                  href={`/${category}/${m.slug}`}
                  style={{
                    display: 'block',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(184,146,42,0.18)',
                    borderRadius: '14px',
                    padding: '20px 22px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.18s, transform 0.18s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: 'var(--ac)',
                        background: 'rgba(184,146,42,0.08)',
                        border: '1px solid rgba(184,146,42,0.2)',
                      }}
                    >
                      {m.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
                          {m.name}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
                          {m.nameEn}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            color: st.color,
                            border: `1px solid ${st.color}44`,
                            letterSpacing: '0.08em',
                          }}
                        >
                          {st.text}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--ac)', opacity: 0.85, marginBottom: '8px', letterSpacing: '0.05em' }}>
                        {m.subtitle}
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.75, marginBottom: '10px' }}>
                        {m.description}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: '11px', color: 'var(--tx-3)' }}>
                        {m.lessons && <span>⏱ {m.lessons}</span>}
                        <span>📖 {m.chapters?.length ?? 0} 章节</span>
                        {m.school && <span>流派：{m.school}</span>}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                        {m.keywords.slice(0, 6).map((k) => (
                          <span
                            key={k}
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              color: 'var(--tx-2)',
                              background: 'rgba(184,146,42,0.06)',
                              border: '1px solid rgba(184,146,42,0.15)',
                            }}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <Link
            href="/library"
            style={{
              display: 'inline-block',
              fontSize: '12px',
              color: 'var(--ac)',
              letterSpacing: '0.15em',
              textDecoration: 'none',
              padding: '10px 22px',
              borderRadius: '999px',
              border: '1px solid rgba(184,146,42,0.3)',
            }}
          >
            去古籍原典库查证原文 →
          </Link>
        </div>
      </div>
    </div>
  );
}
