/**
 * /library/search?q=xxx — 搜索结果页
 *
 * 纯静态导出（output: 'export'）下服务端无法读取 searchParams，
 * 所以外壳保持服务端（为了 title），搜索本身交给客户端组件在浏览器里做。
 */

import { Suspense } from 'react';
import Link from 'next/link';
import SearchResultClient from '@/components/SearchResultClient';

export const metadata = {
  title: '搜索 · 古籍原典库',
};

export default function SearchPage() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,146,42,0.15)', background: 'var(--bg-page)' }}>
        <Link href="/library" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}>
          ← 古籍库
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>
          搜索结果
        </div>
        <Link href="/" style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}>
          首页 →
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-6 py-12 text-center" style={{ color: 'var(--tx-3)', fontSize: '13px' }}>
            正在检索古籍…
          </div>
        }
      >
        <SearchResultClient />
      </Suspense>
    </div>
  );
}
