/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // 纯静态导出：所有页面预渲染成 HTML，可直接放进 APK / 任意静态托管
  output: 'export',
  // 静态导出无法使用 Next 的图片优化服务
  images: { unoptimized: true },
  // 生成 dir/index.html 形式，WebView / file:// 加载更稳
  trailingSlash: true,
  // 本地开发时允许通过 127.0.0.1 / 局域网 IP 访问 dev 资源
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.2.7'],
};

module.exports = nextConfig;
