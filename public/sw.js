/**
 * Service Worker —— 让这个应用离线可用
 *
 * 策略：
 *   · 页面导航：network-first（先拿新的，失败回退缓存）—— 保证更新能及时生效
 *   · 静态资源（/_next/static/*、图标、字体）：cache-first —— 加载飞快
 *   · 其它 GET：先网络，失败再用缓存
 *
 * 排盘引擎全部打包在前端 JS 里，所以断网也能起盘、看古籍。
 * 只有「AI 解读」需要联网（那是直连用户自己配的模型接口）。
 */
const VERSION = 'ziwei-v1';
const RUNTIME_CACHE = `${VERSION}-runtime`;
const STATIC_CACHE = `${VERSION}-static`;

/** 安装时预缓存应用外壳，保证第一次离线也能打开 */
const PRECACHE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只处理 GET；POST（AI 请求）一律直连，不缓存
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 跨域请求（模型接口等）不拦截
  if (url.origin !== self.location.origin) return;

  // 页面导航：network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match('./index.html');
          if (shell) return shell;
          return new Response('离线状态，且此页面尚未缓存。', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }),
    );
    return;
  }

  // 静态资源：cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => cached);
    }),
  );
});
