'use client';
/**
 * 三纪数据看板 —— 六十四卦 / 针灸经验 / 方剂 / 堪舆
 *
 * 数据量大（64 卦、120 条针灸、97 个汉唐方…），全部铺开会把页面撑得很长，
 * 所以做成可搜索的看板：默认折叠，输入关键词即时过滤。
 */
import { useMemo, useState } from 'react';
import {
  HEXAGRAMS,
  ACU_EXPERIENCES,
  TRANS_NEEDLING,
  HANTANG_FORMULAS,
  CLASSIC_FORMULAS,
  FENGSHUI_ENTRIES,
} from '@/lib/nihai';

const box: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid rgba(184,146,42,0.18)',
  borderRadius: '14px',
  padding: '20px 22px',
  marginBottom: '20px',
};

const chip: React.CSSProperties = {
  fontSize: '10px',
  padding: '2px 8px',
  borderRadius: '999px',
  color: 'var(--tx-2)',
  background: 'rgba(184,146,42,0.06)',
  border: '1px solid rgba(184,146,42,0.15)',
  whiteSpace: 'nowrap',
};

function SectionTitle({ title, count, hint }: { title: string; count: number; hint?: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tx-0)', letterSpacing: '0.08em' }}>
          {title}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--ac)', opacity: 0.8 }}>共 {count} 条</span>
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--tx-3)' }}>{hint}</div>}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '14px',
        padding: '9px 13px',
        fontSize: '12.5px',
        borderRadius: '9px',
        background: 'var(--bg-page)',
        border: '1px solid rgba(184,146,42,0.22)',
        color: 'var(--tx-0)',
        outline: 'none',
      }}
    />
  );
}

/** 六十四卦 */
export function HexagramBoard() {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const list = useMemo(() => {
    const kw = q.trim();
    if (!kw) return HEXAGRAMS;
    return HEXAGRAMS.filter(
      (h) =>
        h.name.includes(kw) ||
        h.composition.includes(kw) ||
        h.meaning.includes(kw) ||
        h.niInterpretation.includes(kw) ||
        h.divination.includes(kw),
    );
  }, [q]);

  return (
    <div style={box}>
      <SectionTitle
        title="六十四卦"
        count={HEXAGRAMS.length}
        hint="点开看倪师讲解要点与断事要诀"
      />
      <SearchInput value={q} onChange={setQ} placeholder="搜索卦名 / 卦象 / 关键词…" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: '8px' }}>
        {list.map((h) => (
          <button
            key={h.number}
            onClick={() => setExpanded(expanded === h.number ? null : h.number)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: '9px',
              cursor: 'pointer',
              background: expanded === h.number ? 'rgba(184,146,42,0.1)' : 'transparent',
              border: `1px solid ${expanded === h.number ? 'rgba(184,146,42,0.45)' : 'rgba(184,146,42,0.15)'}`,
              color: 'inherit',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--tx-3)', marginBottom: '2px' }}>
              第 {h.number} 卦
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)' }}>{h.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--tx-3)', marginTop: '2px' }}>{h.composition}</div>
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', textAlign: 'center', padding: '20px' }}>
          没有匹配的卦
        </div>
      )}

      {expanded !== null && (
        <div style={{ marginTop: '16px' }}>
          {list
            .filter((h) => h.number === expanded)
            .map((h) => (
              <div
                key={h.number}
                style={{
                  padding: '16px 18px',
                  borderRadius: '11px',
                  background: 'rgba(184,146,42,0.05)',
                  border: '1px solid rgba(184,146,42,0.25)',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ac)', marginBottom: '8px' }}>
                  第 {h.number} 卦 · {h.name}（{h.composition}）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginBottom: '10px' }}>
                  上卦 {h.upper} · 下卦 {h.lower}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--tx-1)', lineHeight: 1.85, marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--ac)' }}>卦辞要点：</strong>
                  {h.meaning}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--tx-1)', lineHeight: 1.85, marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--ac)' }}>倪师讲解：</strong>
                  {h.niInterpretation}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--tx-1)', lineHeight: 1.85 }}>
                  <strong style={{ color: 'var(--ac)' }}>断事要诀：</strong>
                  {h.divination}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/** 针灸经验穴 + 透针透穴 */
export function AcupointBoard() {
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => {
    const kw = q.trim();
    if (!kw) return ACU_EXPERIENCES;
    return ACU_EXPERIENCES.filter(
      (a) =>
        a.condition.includes(kw) ||
        a.acupoints.includes(kw) ||
        a.category.includes(kw) ||
        (a.note ?? '').includes(kw),
    );
  }, [q]);

  const visible = showAll ? list : list.slice(0, 24);

  return (
    <>
      <div style={box}>
        <SectionTitle
          title="针灸经验穴"
          count={ACU_EXPERIENCES.length}
          hint="倪师临床常用的对症取穴，按症状查"
        />
        <SearchInput value={q} onChange={setQ} placeholder="搜索症状 / 穴位 / 分类…" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {visible.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'baseline',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(184,146,42,0.035)',
                border: '1px solid rgba(184,146,42,0.1)',
              }}
            >
              <span style={{ ...chip, flexShrink: 0 }}>{a.category}</span>
              <span style={{ fontSize: '13px', color: 'var(--tx-0)', minWidth: '110px' }}>{a.condition}</span>
              <span style={{ fontSize: '12.5px', color: 'var(--ac)' }}>{a.acupoints}</span>
              {a.note && <span style={{ fontSize: '11px', color: 'var(--tx-3)' }}>{a.note}</span>}
            </div>
          ))}
        </div>

        {list.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--tx-3)', textAlign: 'center', padding: '16px' }}>
            没有匹配条目
          </div>
        )}

        {list.length > 24 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '9px',
              fontSize: '12px',
              color: 'var(--ac)',
              background: 'transparent',
              border: '1px dashed rgba(184,146,42,0.3)',
              borderRadius: '9px',
              cursor: 'pointer',
            }}
          >
            {showAll ? '收起' : `展开全部 ${list.length} 条`}
          </button>
        )}
      </div>

      <div style={box}>
        <SectionTitle title="透针透穴法" count={TRANS_NEEDLING.length} hint="一针透两穴，倪师常用手法" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {TRANS_NEEDLING.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(184,146,42,0.035)',
                border: '1px solid rgba(184,146,42,0.1)',
                fontSize: '12.5px',
                color: 'var(--tx-1)',
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: 'var(--ac)', fontWeight: 600 }}>{t.combo}</span>
              <span style={{ color: 'var(--tx-2)' }}> — {t.indication}</span>
              {t.supporting && <span style={{ color: 'var(--tx-3)' }}>（配穴：{t.supporting}）</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** 方剂：汉唐方 + 经典经方 */
export function FormulaBoard() {
  const [q, setQ] = useState('');

  const hantang = useMemo(() => {
    const kw = q.trim();
    if (!kw) return HANTANG_FORMULAS;
    return HANTANG_FORMULAS.filter(
      (f) => f.name.includes(kw) || f.indication.includes(kw) || (f.theory ?? '').includes(kw),
    );
  }, [q]);

  const classics = useMemo(() => {
    const kw = q.trim();
    if (!kw) return CLASSIC_FORMULAS;
    return CLASSIC_FORMULAS.filter(
      (f) =>
        f.name.includes(kw) ||
        f.indication.includes(kw) ||
        f.composition.includes(kw) ||
        f.source.includes(kw),
    );
  }, [q]);

  return (
    <>
      <div style={box}>
        <SectionTitle
          title="汉唐方剂"
          count={HANTANG_FORMULAS.length}
          hint="倪师汉唐中医系列方剂，按主治方向查"
        />
        <SearchInput value={q} onChange={setQ} placeholder="搜索方名 / 主治…" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {hantang.map((f) => (
            <div
              key={f.id}
              style={{
                padding: '10px 13px',
                borderRadius: '8px',
                background: 'rgba(184,146,42,0.035)',
                border: '1px solid rgba(184,146,42,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--tx-0)' }}>{f.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--tx-2)' }}>{f.indication}</span>
              </div>
              {f.theory && (
                <div style={{ fontSize: '11.5px', color: 'var(--tx-3)', marginTop: '3px' }}>{f.theory}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={box}>
        <SectionTitle title="经典经方" count={CLASSIC_FORMULAS.length} hint="出自《伤寒论》《金匮要略》" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {classics.map((f) => (
            <div
              key={f.id}
              style={{
                padding: '10px 13px',
                borderRadius: '8px',
                background: 'rgba(184,146,42,0.035)',
                border: '1px solid rgba(184,146,42,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--tx-0)' }}>{f.name}</span>
                <span style={{ ...chip }}>{f.source}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--tx-2)', marginTop: '4px', lineHeight: 1.7 }}>
                组成：{f.composition}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--tx-3)', marginTop: '2px', lineHeight: 1.7 }}>
                主治：{f.indication}
              </div>
              {f.niUsage && (
                <div style={{ fontSize: '11.5px', color: 'var(--ac)', marginTop: '4px', lineHeight: 1.7 }}>
                  倪师用法：{f.niUsage}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.8, textAlign: 'center', marginBottom: '20px' }}>
        ⚠️ 方剂内容仅为课程资料整理，切勿自行照方抓药。用药请遵专业中医师辨证。
      </p>
    </>
  );
}

/** 堪舆条目 */
export function FengshuiBoard() {
  return (
    <div style={box}>
      <SectionTitle title="堪舆条目" count={FENGSHUI_ENTRIES.length} hint="阳宅 / 阴宅 / 理论" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FENGSHUI_ENTRIES.map((f) => (
          <div
            key={f.id}
            style={{
              padding: '13px 16px',
              borderRadius: '10px',
              background: 'rgba(184,146,42,0.035)',
              border: '1px solid rgba(184,146,42,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx-0)' }}>{f.title}</span>
              <span style={chip}>
                {f.category === 'yangzhai' ? '阳宅' : f.category === 'yinzhai' ? '阴宅' : '理论'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--tx-2)', lineHeight: 1.8, marginBottom: '8px' }}>
              {f.description}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {f.keyPoints.map((p, i) => (
                <li
                  key={i}
                  style={{ fontSize: '12px', color: 'var(--tx-1)', lineHeight: 1.7, paddingLeft: '14px', position: 'relative' }}
                >
                  <span style={{ position: 'absolute', left: 0, color: 'var(--ac)', opacity: 0.6 }}>·</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
