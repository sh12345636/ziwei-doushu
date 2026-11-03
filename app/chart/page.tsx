'use client';
import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * 命盘页
 *
 * 说明：
 *   · 本命 / 大限 / 流年 的切换由 ChartBoard 内部的 TimeNav 负责（它需要同时驱动
 *     四化叠加层），本页不再重复渲染一份 —— 之前页面上有两条一模一样的时间导航，
 *     外层那条实际上控制不了命盘，纯属白占屏幕。
 *   · 布局：窄屏单栏、≥1024px 才右侧并排 AI 面板。
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ── 未起盘：展示出生信息表单 ──
  if (!chart) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>紫微斗数排盘</h1>
        <p style={{ color: 'var(--tx-2)', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          输入出生年月日时，排盘引擎即时生成命盘（全部在本机计算，不需要联网）。
        </p>
        {formError && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            color: '#ff8a8a', background: 'rgba(255,80,80,0.08)',
            border: '1px solid rgba(255,80,80,0.25)',
          }}>
            ⚠ {formError}
          </div>
        )}
        <BirthForm
          onSubmit={(info: BirthInfo) => {
            try {
              setFormError(null);
              setChart(generateChart(info));
            } catch (e) {
              // 引擎对非法日期/时辰会抛错，不能让它冒到 React 层导致白屏
              setFormError(e instanceof Error ? e.message : '排盘失败，请检查出生信息');
            }
          }}
        />
      </main>
    );
  }

  // ── 已起盘：命盘 + 解读 ──
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <button
        type="button"
        onClick={() => { setChart(null); setSelectedPalace(null); }}
        style={{
          marginBottom: 16, padding: '6px 14px', cursor: 'pointer',
          border: '1px solid var(--bdr)', borderRadius: 8, background: 'transparent',
          color: 'var(--tx-2)', fontSize: 13,
        }}
      >
        ← 重新起盘
      </button>

      <div
        className="chart-layout"
        style={{
          display: 'grid',
          // 默认窄屏：单栏（手机上并排会把命盘压成一条缝）
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
        <InsightPanel chart={chart} selectedPalace={selectedPalace} />
      </div>

      {/* 宽屏才并排 */}
      <style>{`
        @media (min-width: 1024px) {
          .chart-layout {
            grid-template-columns: minmax(0, 1fr) minmax(0, 380px);
          }
        }
      `}</style>
    </main>
  );
}
