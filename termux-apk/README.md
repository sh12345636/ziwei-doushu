# 在手机上出 APK（不需要电脑）

本目录是一套**手写的最小 Android 壳工程**，配合 Termux 里现成的编译工具，
就能在你手机上直接把本项目编译成可安装的 APK —— 不用 Android Studio、不用电脑、不用 Gradle。

> 原理：APK 本质是「ZIP + DEX（安卓字节码）+ 资源」。
> 我们用 `aapt2` 编资源、`javac` 编 Java、`d8` 转 DEX、`apksigner` 签名，
> 完全绕开 Gradle 和 Android Studio。

---

## 两条路，任选其一

| | 路线 | 需要什么 | 适合 |
|---|---|---|---|
| **A** | GitHub Actions 云端编译 | 一个 GitHub 仓库 | 不想在手机上折腾工具链 |
| **B** | Termux 本机编译 | 手机上装 Termux | 想完全在本地完成 |

---

## 路线 A：GitHub Actions（最省事）

仓库里已经放好了 workflow：`.github/workflows/build-apk.yml`

1. 把项目推到 GitHub（新建一个仓库即可）
2. 打开仓库页面 → **Actions** → 左边选 **Build Android APK** → 右边 **Run workflow**
3. 等 5～10 分钟
4. 进那次运行 → 页面底部 **Artifacts** → 下载 `ziwei-app-debug.zip`
5. 解压得到 `.apk`，传到手机上点安装

以后每次 push 到 main 也会自动构建一次。

---

## 路线 B：Termux 本机编译

### 前提

- 手机上装好 **Termux**（建议从 [F-Droid](https://f-droid.org/packages/com.termux/) 装，Google Play 版已停更）

### 步骤

```bash
# 1. 进到项目目录
cd /path/to/ziwei-doushu

# 2. 先构建静态站点（产出 out/）
npm run build

# 3. 一次性准备工具（装 JDK / aapt2 / apksigner / 下载 android.jar / 生成签名）
bash termux-apk/setup.sh

# 4. 打包 APK
bash termux-apk/build.sh

# 5. 安装
cp termux-apk/build/ziwei.apk ~/storage/shared/
termux-open ~/storage/shared/ziwei.apk
```

第 3 步只需要跑一次；以后改了代码，`npm run build` + `bash termux-apk/build.sh` 就行。

### 产物

`termux-apk/build/ziwei.apk` —— 直接点开安装即可。

---

## 这个壳做了什么

`src/cn/ziwei/doushu/MainActivity.java` 只有几十行，做了三件关键的事：

| 设置 | 为什么必须 |
|---|---|
| `setDomStorageEnabled(true)` | 应用要用 `localStorage` 存用户自己填的 API 密钥 |
| `setAllowUniversalAccessFromFileURLs(true)` | `file://` 页面要能 `fetch` 外部模型接口（否则 CORS 全挂） |
| `setAllowFileAccessFromFileURLs(true)` | 让页面能加载同目录的 JS / CSS |

还处理了返回键（回到上一页而不是直接退出）、状态栏配色、屏幕旋转。

---

## 常见问题

**Q：`setup.sh` 里 android.jar 下载失败？**
A：自动下载会依次尝试几个镜像。全失败的话，用浏览器打开 [Sable/android-platforms](https://github.com/Sable/android-platforms)，
下载 `android-30`（或更高）目录里的 `android.jar`，放到 `termux-apk/android.jar`，再重跑。

**Q：`aapt2` / `apksigner` 装不上？**
A：不同 Termux 源的包名不一样，先 `pkg search aapt` 看看有哪些，然后手动
`pkg install <包名>`。某些版本里它们在 `aapt` 包里。

**Q：`d8` 找不到？**
A：脚本会自动退回用 `dx`。两个都没有的话 `pkg install dx`。

**Q：装上去打开是白屏？**
A：八成是 `out/` 没重新构建，assets 里是旧的。重跑 `npm run build` 再 `build.sh`。

**Q：安装时提示「应用未安装」或签名冲突？**
A：手机上已装过同包名的不同签名版本。先卸载旧的，或改 `AndroidManifest.xml`
里的 `package` 为别的名字。

**Q：正式发布要怎么做？**
A：`setup.sh` 生成的 `ziwei.keystore` 是**测试用**的（口令写死在脚本里）。
正式发布请重新生成密钥并妥善保管 —— 密钥丢了就没法给已安装用户升级了。
Debug 版 APK 可以在自己的设备上用，但不要上架商店。
