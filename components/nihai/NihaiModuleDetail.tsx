/**
 * 三纪模块详情 —— 天纪 / 地纪 / 人纪 共用
 *
 * 展示：模块介绍 → 章节要点 → 倪师原话 → 相关数据 → 同门其他模块
 * 特殊数据区（六十四卦 / 针灸经验 / 方剂…）由调用方通过 children 传入。
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { NiModule, SanJiCategory } from '@/lib/nihai/types';

const CATEGORY_TITLE: Record<SanJiCategory, string> = {
  tianji: '天纪',
  diji: '地纪',
  renji: '人纪',
};

const STATUS_LABEL: Record<NiModule['status'], string> = {
  active: '已整理',
  preview: '部分整理',
  coming: '筹备中',
};

export default function NihaiModuleDetail({
  category,
  module: m,
  siblings,
  children,
}: {
  category: SanJiCategory;
  module: NiModule;
  siblings: NiModule[];
  children?: ReactNode;
}) {
  const others = siblings.filter((s) => s.slug !== m.slug).sort((a, b) => a.order - b.order);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* 顶栏 */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}
      >
        <Link href={`/${category}`} style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← {CATEGORY_TITLE[category]}
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.25em' }}>
          {m.nameEn}
        </div>
        <Link href="/chart" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          起盘 →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* 标题区 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '34px', color: 'var(--ac)', opacity: 0.85, marginBottom: '10px' }}>{m.icon}</div>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.12em', marginBottom: '8px' }}>
            {m.name}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--ac)', opacity: 0.9, letterSpacing: '0.1em', marginBottom: '10px' }}>
            {m.subtitle}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.15em' }}>
            {STATUS_LABEL[m.status]}
            {m.school ? ` · ${m.school}` : ''}
            {m.lessons ? ` · ${m.lessons}` : ''}
          </div>
        </div>

        {/* 概述 */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(184,146,42,0.18)',
            borderRadius: '14px',
            padding: '22px 24px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '14px', color: 'var(--tx-1)', lineHeight: 1.9, marginBottom: m.details.length ? '16px' : 0 }}>
            {m.description}
          </p>
          {m.details.map((d, i) => (
            <p
              key={i}
              style={{
                fontSize: '13px',
                color: 'var(--tx-2)',
                lineHeight: 1.9,
                marginTop: i === 0 ? 0 : '12px',
                paddingLeft: '12px',
                borderLeft: '2px solid rgba(184,146,42,0.25)',
              }}
            >
              {d}
            </p>
          ))}
        </div>

        {/* 关键词 */}
        {m.keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px' }}>
            {m.keywords.map((k) => (
              <span
                key={k}
                style={{
                  fontSize: '10px',
                  padding: '3px 9px',
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
        )}

        {/* 章节 */}
        {m.chapters.length > 0 && (
          <>
            <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.35em', textAlign: 'center', marginBottom: '18px' }}>
              章 节 要 点
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {m.chapters
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((ch, idx) => (
                  <div
                    key={ch.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(184,146,42,0.15)',
                      borderRadius: '12px',
                      padding: '18px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ac)', opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', letterSpacing: '0.06em' }}>
                        {ch.title}
                      </span>
                      {ch.subtitle && (
                        <span style={{ fontSize: '11px', color: 'var(--tx-3)' }}>{ch.subtitle}</span>
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--tx-2)', lineHeight: 1.8, marginBottom: '10px' }}>
                      {ch.description}
                    </p>

                    {ch.keyPoints.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {ch.keyPoints.map((p, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--tx-1)',
                              lineHeight: 1.75,
                              paddingLeft: '16px',
                              position: 'relative',
                            }}
                          >
                            <span style={{ position: 'absolute', left: 0, color: 'var(--ac)', opacity: 0.6 }}>·</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}

                    {ch.quotes && ch.quotes.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ch.quotes.map((q, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: '12.5px',
                              color: 'var(--ac)',
                              lineHeight: 1.8,
                              padding: '10px 14px',
                              background: 'rgba(184,146,42,0.06)',
                              borderRadius: '8px',
                              borderLeft: '2px solid rgba(184,146,42,0.5)',
                            }}
                          >
                            倪师：「{q}」
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}

        {/* 特殊数据区（六十四卦 / 针灸 / 方剂…） */}
        {children}

        {/* 参考书目 */}
        {m.references.length > 0 && (
          <div
            style={{
              marginTop: '28px',
              padding: '18px 22px',
              background: 'var(--bg-card)',
              border: '1px dashed rgba(184,146,42,0.25)',
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.2em', marginBottom: '10px' }}>
              参考书目
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {m.references.map((r) => (
                <span key={r} style={{ fontSize: '12px', color: 'var(--tx-2)' }}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 同门其他模块 */}
        {others.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.35em', textAlign: 'center', marginBottom: '16px' }}>
              {CATEGORY_TITLE[category]} · 其 他 模 块
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {others.map((o) => (
                <Link
                  key={o.id}
                  href={`/${category}/${o.slug}`}
                  style={{
                    display: 'block',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: '1px solid rgba(184,146,42,0.15)',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontSize: '16px', color: 'var(--ac)', opacity: 0.7, marginBottom: '4px' }}>{o.icon}</div>
                  <div style={{ fontSize: '13px', color: 'var(--tx-1)', letterSpacing: '0.05em' }}>{o.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--tx-3)', marginTop: '2px' }}>
                    {o.chapters?.length ?? 0} 章节
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 免责 */}
        <p style={{ fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.8, textAlign: 'center', marginTop: '40px', opacity: 0.8 }}>
          本板块为倪海厦《天纪》《人纪》课程的内容整理，仅供学习研究。<br />
          中医内容不可替代专业诊疗，身体不适请及时就医。
        </p>
      </div>
    </div>
  );
}
