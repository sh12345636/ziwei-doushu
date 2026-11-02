#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────
# 在 Termux 里直接把本项目打成可安装的 APK
# 用法： bash termux-apk/build.sh
# 产物： termux-apk/build/ziwei.apk
# ─────────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"

PKG="cn.ziwei.doushu"
APP_NAME="ziwei"
BUILD="build"

echo "=== 0/7 检查前置 ==="
for t in java javac aapt2 apksigner zip; do
  command -v "$t" >/dev/null 2>&1 || { echo "缺少 $t，先跑 bash termux-apk/setup.sh"; exit 1; }
done
[ -f android.jar ] || { echo "缺少 android.jar，先跑 setup.sh"; exit 1; }
[ -d ziwei.keystore ] || [ -f ziwei.keystore ] || { echo "缺少签名密钥，先跑 setup.sh"; exit 1; }

# dx 和 d8 二选一
DEX_TOOL=""
command -v d8 >/dev/null 2>&1 && DEX_TOOL="d8"
[ -z "$DEX_TOOL" ] && command -v dx >/dev/null 2>&1 && DEX_TOOL="dx"
[ -z "$DEX_TOOL" ] && { echo "缺少 d8 或 dx（Java 字节码转 DEX 工具）"; exit 1; }
echo "  DEX 工具：$DEX_TOOL"

echo
echo "=== 1/7 准备静态资源 ==="
if [ ! -d "$ROOT/out" ]; then
  echo "找不到 out/，请先在项目根目录跑： npm run build"
  exit 1
fi
rm -rf assets
mkdir -p assets
cp -r "$ROOT/out/." assets/
echo "  assets 大小：$(du -sh assets | cut -f1)"

echo
echo "=== 2/7 编译资源 ==="
rm -rf "$BUILD" && mkdir -p "$BUILD/flat" "$BUILD/gen" "$BUILD/classes"

# 图标：如果 res 里没有 mipmap，从 public/icons 复制一份
if [ ! -d res/mipmap-mdpi ]; then
  mkdir -p res/mipmap-mdpi res/mipmap-hdpi res/mipmap-xhdpi res/mipmap-xxhdpi res/mipmap-xxxhdpi
  for pair in "mdpi:48" "hdpi:72" "xhdpi:96" "xxhdpi:144" "xxxhdpi:192"; do
    d="${pair%%:*}"; sz="${pair##*:}"
    src="$ROOT/public/icons/icon-192.png"
    [ -f "$ROOT/android/app/src/main/res/mipmap-$d/ic_launcher.png" ] && \
      src="$ROOT/android/app/src/main/res/mipmap-$d/ic_launcher.png"
    cp "$src" "res/mipmap-$d/ic_launcher.png"
  done
  echo "  已补 mipmap 图标"
fi

aapt2 compile --dir res -o "$BUILD/flat/" 2>&1 | tail -3
echo "  ✓ 资源编译完成"

echo
echo "=== 3/7 链接资源 + 生成 R.java ==="
aapt2 link \
  -o "$BUILD/base.apk" \
  -I android.jar \
  --manifest AndroidManifest.xml \
  --java "$BUILD/gen" \
  --min-sdk-version 21 \
  --target-sdk-version 33 \
  -A assets \
  $(find "$BUILD/flat" -name '*.flat' | tr '\n' ' ') 2>&1 | tail -5
echo "  ✓ base.apk 已生成"

echo
echo "=== 4/7 编译 Java ==="
find src "$BUILD/gen" -name '*.java' > "$BUILD/sources.txt"
javac -source 8 -target 8 -nowarn \
  -bootclasspath android.jar \
  -classpath android.jar \
  -d "$BUILD/classes" \
  @"$BUILD/sources.txt" 2>&1 | grep -v "^Note:" | tail -10
echo "  ✓ Java 编译完成"

echo
echo "=== 5/7 转成 DEX ==="
if [ "$DEX_TOOL" = "d8" ]; then
  d8 --lib android.jar --min-api 21 --output "$BUILD" \
    $(find "$BUILD/classes" -name '*.class' | tr '\n' ' ')
else
  dx --dex --min-sdk-version=21 --output="$BUILD/classes.dex" "$BUILD/classes"
fi
[ -f "$BUILD/classes.dex" ] || { echo "DEX 生成失败"; exit 1; }
echo "  ✓ classes.dex（$(du -h "$BUILD/classes.dex" | cut -f1)）"

echo
echo "=== 6/7 打包 APK ==="
cp "$BUILD/base.apk" "$BUILD/unsigned.apk"
cd "$BUILD"
zip -q -j unsigned.apk classes.dex
cd ..
echo "  ✓ 已打入 classes.dex"

echo
echo "=== 7/7 签名 ==="
apksigner sign \
  --ks ziwei.keystore \
  --ks-pass pass:ziwei123 \
  --key-pass pass:ziwei123 \
  --ks-key-alias ziwei \
  --out "$BUILD/$APP_NAME.apk" \
  "$BUILD/unsigned.apk" 2>&1 | tail -3

# 可选对齐（有 zipalign 就做）
if command -v zipalign >/dev/null 2>&1; then
  zipalign -f 4 "$BUILD/$APP_NAME.apk" "$BUILD/$APP_NAME-aligned.apk" && \
    mv "$BUILD/$APP_NAME-aligned.apk" "$BUILD/$APP_NAME.apk"
  echo "  ✓ 已对齐"
fi

apksigner verify --print-certs "$BUILD/$APP_NAME.apk" 2>&1 | head -4

echo
echo "════════════════════════════════════════════"
echo " APK 构建完成！"
echo " 位置：$(pwd)/$BUILD/$APP_NAME.apk"
echo " 大小：$(du -h "$BUILD/$APP_NAME.apk" | cut -f1)"
echo
echo " 安装到手机："
echo "   cp $BUILD/$APP_NAME.apk ~/storage/shared/"
echo "   termux-open ~/storage/shared/$APP_NAME.apk"
echo "════════════════════════════════════════════"
