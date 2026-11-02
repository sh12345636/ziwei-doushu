'use client';
/**
 * PwaRegister —— 注册 Service Worker，让应用可离线运行 / 可安装到桌面。
 *
 * 注意：
 *   · 浏览器只在 HTTPS 或 localhost 下允许注册 SW，局域网 IP / file:// 会被拒绝，
 *     这种情况下静默跳过即可（不影响其他功能）。
 *   · 延迟注册，避免和首屏渲染抢资源。
 *   · ★ Capacitor 原生 APP 内不注册：本地资源本来就在 APK 里，不需要缓存；
 *     反而 SW 会缓存旧版本 HTML/JS，导致「装了新版打开还是老界面」。
 */
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // 原生 APP（Capacitor）内跳过，避免把旧版本缓存住
    const w = window as unknown as { Capacitor?: unknown };
    if (w.Capacitor) return;

    const { protocol, hostname } = window.location;
    const secure = protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
    if (!secure) return;

    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* 注册失败不影响使用 */
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
