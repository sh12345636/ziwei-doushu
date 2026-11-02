# 紫微命盘 · 纯静态 APP 版

把原来的「需要服务器」的 Web 应用，改造成**可以装进手机的纯静态应用**：

- **不需要任何服务器** —— 所有逻辑（排盘引擎、古籍库、AI 调用）都在浏览器/APP 里跑
- **不内置任何 API 密钥** —— 由使用者自己在应用内填写，只存在自己设备上
- **可离线使用** —— 排盘、看盘、古籍检索断网也能用；只有 AI 解读需要联网
- **两种交付形态** —— PWA（现在就能装）／ Capacitor 原生 APP（需要电脑编译）

---

## 一、和原版的区别

| | 原版 | 本版本 |
|---|---|---|
| 运行方式 | Next.js 服务端 + 客户端 | 纯静态（`output: 'export'`） |
| AI 调用 | `/api/interpret` 服务端代理 | 浏览器直连用户自己配的接口 |
| 密钥存放 | 服务器 `.env.local` | 用户设备 `localStorage` |
| 部署 | 需要 Node 服务器 | 任意静态托管 / 装进 APK |
| 排盘引擎 | 同 | 同（未改动） |

排盘引擎（`lib/ziwei/`）**一行没改**，768 盘回归铁律仍然全过。

---

## 二、怎么用（PWA：立刻就能装）

### 1. 构建

```bash
npm install
npm run build      # 产物在 out/
```

### 2. 本地预览

```bash
node scripts/serve-static.mjs 3002
# 打开 http://127.0.0.1:3002
```

### 3. 装到手机桌面

**必须在 https 或 localhost 下才能安装**（浏览器安全限制）。两种做法：

- **A. 局域网访问**：把 `out/` 放到任意静态服务器，用手机访问 `https://你的域名`
- **B. 本机测试**：手机浏览器打开 `http://127.0.0.1:3002`，Chrome 菜单 →「添加到主屏幕」

装好后：
- 桌面出现图标（金色命盘图案）
- 全屏运行，没有浏览器地址栏
- 断网也能打开排盘

> Service Worker 只在 HTTPS / localhost 下注册；局域网 IP（如 192.168.x.x）会被浏览器拒绝，此时应用仍可用，只是**不缓存、不离线**。

---

## 三、填自己的 AI 密钥

应用里任何 AI 入口右上角都有 **⚙ 模型设置**：

| 字段 | 说明 | 例子 |
|---|---|---|
| 接口地址 | OpenAI 兼容的 Base URL | `https://api.deepseek.com/v1` |
| API 密钥 | 你自己的密钥 | `sk-...` |
| 模型名称 | 该接口支持的模型 | `deepseek-chat` |

内置了常用预设（DeepSeek / Kimi / 通义 / 智谱 / 本地 Ollama），点一下就填好地址和模型名，只需再填密钥。

**关于密钥安全：**

- 只存在你设备的 `localStorage`，**不会上传到任何服务器**
- 换设备、清理浏览器数据后需要重填
- 你也可以随时点「清空」删除

**关于跨域（CORS）：**

浏览器直连要求模型供应商开放 CORS。已验证 **DeepSeek 可用**。若某个供应商不支持，改用支持 CORS 的中转地址即可。

---

## 四、出真正的 APK

**不需要电脑**，两条路任选（详见 [termux-apk/README.md](termux-apk/README.md)）：

### 路线 A：GitHub Actions 云端编译（最省事）

仓库里已放好 `.github/workflows/build-apk.yml`：

1. 把项目推到 GitHub
2. 仓库页面 → **Actions** → **Build Android APK** → **Run workflow**
3. 等 5–10 分钟，在该次运行的 **Artifacts** 里下载 `ziwei-app-debug.zip`
4. 解压得到 APK，传到手机安装

### 路线 B：Termux 本机编译

手机上装好 Termux 后：

```bash
npm run build                    # 先出静态产物 out/
bash termux-apk/setup.sh         # 一次性：装 JDK/aapt2/apksigner、下 android.jar、生成签名
bash termux-apk/build.sh         # 打包 → termux-apk/build/ziwei.apk
```

原理是绕过 Gradle / Android Studio，直接用
`aapt2`（编资源）+ `javac`（编 Java）+ `d8`（转 DEX）+ `apksigner`（签名）手工组装 APK。
壳工程只有几十行 Java，关键是把 `localStorage` 和跨域 `fetch` 打开，
否则用户填的密钥存不住、AI 接口也调不通。

### 路线 C：Android Studio（有电脑的话）

`capacitor.config.ts` 已经配好（`appId: cn.ziwei.doushu`、`webDir: out`）：

```bash
npm install && npm run build
npx cap sync android
npx cap open android     # Android Studio → Build Signed APK
```

---

## 五、改了什么

### 新增

| 文件 | 作用 |
|---|---|
| `lib/ai/client.ts` | 浏览器端 AI 客户端（localStorage 配置 + 直连 + 流式解析） |
| `components/AiSettingsModal.tsx` | 模型设置弹窗 |
| `components/PwaRegister.tsx` | 注册 Service Worker |
| `components/SearchResultClient.tsx` | 古籍搜索（改成客户端执行） |
| `public/manifest.json` | PWA 清单 |
| `public/sw.js` | Service Worker（离线缓存） |
| `public/icons/*.png` | 图标（`npm run icons` 可重新生成） |
| `scripts/gen-icons.mjs` | 零依赖 PNG 图标生成器 |
| `scripts/serve-static.mjs` | 本地静态服务器 |
| `capacitor.config.ts` | Capacitor 配置 |

### 修改

| 文件 | 改动 |
|---|---|
| `next.config.js` | `output: 'export'`、`images.unoptimized`、`trailingSlash` |
| `package.json` | `dev`/`build` 加 `--webpack`（Android 无 Turbopack 原生绑定） |
| `components/InsightPanel.tsx` | `/api/interpret` → `streamChatClient` |
| `components/ChatPanel.tsx` | 同上 |
| `app/heming/page.tsx` | `/api/heming` → `streamChatClient` |
| `app/layout.tsx` | PWA metadata + Service Worker 注册 |
| `app/knowledge/page.tsx` | 卡片去掉死链（详情页依赖未开源数据） |
| `app/library/search/page.tsx` | 改为客户端搜索（静态导出不支持 searchParams） |
| `lib/ziwei/patterns.ts` | 移除 `server-only`（浏览器里要算格局） |
| `app/robots.ts` / `app/sitemap.ts` | 加 `dynamic = 'force-static'` |

### 删除

- `app/api/*`（服务端路由，纯静态用不到）
- `app/knowledge/[star]/[topic]/`（SEO 落地页，内容依赖未开源的 STAR_DB）

---

## 六、常见问题

**Q：构建报 `Turbopack is not supported on this platform`？**
A：Android 上没有 Turbopack 的原生绑定。`npm run build` / `npm run dev` 已经带 `--webpack`。

**Q：AI 解读报「无法连接模型接口」？**
A：三种可能——接口地址写错、密钥无效、该服务不开放浏览器跨域（CORS）。错误提示会写清楚是哪一种。换成支持 CORS 的地址即可。

**Q：装到桌面后打不开 / 白屏？**
A：PWA 必须走 https 或 localhost。用局域网 IP 访问时 Service Worker 不生效，但页面本身应该能打开；若白屏请检查服务器是否正确返回了 `index.html`。

**Q：改了代码后手机上还是旧版本？**
A：Service Worker 有缓存。刷新几次，或在浏览器里清除该站点数据。`sw.js` 的 `VERSION` 常量也能用来强制失效。

---

## 七、新增：天纪 / 地纪 / 人纪 学习板块

原来首页那三个板块只有「X 月开放」的占位文案（月份早过了），现在都做成了真正的页面：

| 板块 | 路由 | 内容 |
|---|---|---|
| **天纪** | `/tianji` | 6 个模块：紫微斗数、易经六十四卦、堪舆学、推命、面相、测字 |
| **地纪** | `/diji` | 3 个模块：国家地理志、堪舆理论基础、遗稿与后学 |
| **人纪** | `/renji` | 5 个模块：针灸大成、黄帝内经、神农本草经、伤寒论、金匮要略 |

每个模块都有：章节要点、**倪师原话引用**、流派与课时、参考书目、同门模块导航。

另外三块可交互的数据看板（都能搜）：

- **六十四卦**（`/tianji/yijing`）— 64 卦的卦象、卦辞、倪师讲解、断事要诀
- **针灸经验穴 120 条 + 透针透穴 31 条**（`/renji/zhenjiu`）
- **汉唐方剂 97 个 + 经典经方 25 个**（`/renji/bencao`、`/renji/shanghan`、`/renji/jingui`）

首页那四个板块卡片现在都能点了，状态也从「研发中」统一改成「✓ 已上线」。

> 中医内容仅作课程资料整理，页面底部有免责提示；方剂不可自行照方抓药。
