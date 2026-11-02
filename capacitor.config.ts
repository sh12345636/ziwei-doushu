import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置 —— 把纯静态产物（out/）包成 Android / iOS 原生 APP。
 *
 * 前提：先 `npm run build` 生成 out/ 目录。
 *
 * 出 APK 需要电脑上装 Android Studio + JDK 17：
 *   npx cap add android     # 首次，生成 android/ 工程
 *   npx cap sync android    # 每次 build 后同步静态产物
 *   npx cap open android    # 打开 Android Studio，签名打包
 *
 * 说明：APP 内置的是排盘引擎（纯前端），AI 解读走用户在 APP 里自己填的
 * 接口地址与密钥，不经过任何服务器。
 */
const config: CapacitorConfig = {
  appId: 'cn.ziwei.doushu',
  appName: '紫微命盘',
  webDir: 'out',
  // 用 https 协议加载本地资源，避免 mixed-content 与部分 Web API 限制
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
