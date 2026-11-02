#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────
# 一次性准备：在 Termux 里装好构建 APK 所需的一切
# 用法： bash termux-apk/setup.sh
# ─────────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")"

echo "=== 1/4 安装构建工具 ==="
pkg update -y || true
# 不同 Termux 版本的包名略有差异，逐个尝试
for p in openjdk-21 openjdk-17; do
  pkg install -y "$p" 2>/dev/null && break || true
done
for p in aapt aapt2 apksigner dx d8 zip unzip; do
  pkg install -y "$p" 2>/dev/null || echo "  (跳过 $p，可能已内置或不需要)"
done

echo
echo "=== 2/4 检查工具 ==="
for t in java javac aapt2 aapt apksigner zip; do
  if command -v "$t" >/dev/null 2>&1; then
    echo "  ✓ $t"
  else
    echo "  ✗ $t  (缺失)"
  fi
done

echo
echo "=== 3/4 准备 android.jar ==="
if [ -f android.jar ]; then
  echo "  已存在，跳过"
else
  # 依次尝试几个来源
  URLS="
https://raw.githubusercontent.com/Sable/android-platforms/master/android-33/android.jar
https://raw.githubusercontent.com/Sable/android-platforms/master/android-32/android.jar
https://raw.githubusercontent.com/Sable/android-platforms/master/android-30/android.jar
"
  for u in $URLS; do
    echo "  尝试下载：$u"
    if curl -fL --retry 2 -o android.jar "$u" 2>/dev/null && [ -s android.jar ]; then
      echo "  ✓ 下载成功（$(du -h android.jar | cut -f1)）"
      break
    fi
    rm -f android.jar
  done

  if [ ! -f android.jar ] || [ ! -s android.jar ]; then
    echo "  ✗ 自动下载失败。请手动获取 android.jar："
    echo "    - 浏览器打开 https://github.com/Sable/android-platforms"
    echo "    - 下载 android-30（或更高）目录下的 android.jar"
    echo "    - 放到 $(pwd)/android.jar"
    exit 1
  fi
fi

echo
echo "=== 4/4 生成签名密钥（首次）==="
if [ -f ziwei.keystore ]; then
  echo "  已存在，跳过"
else
  keytool -genkeypair -v \
    -keystore ziwei.keystore \
    -alias ziwei \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass ziwei123 -keypass ziwei123 \
    -dname "CN=Ziwei, OU=App, O=Ziwei, L=CN, ST=CN, C=CN" 2>&1 | tail -3
  echo "  ✓ 密钥已生成（口令 ziwei123，正式发布请自行更换）"
fi

echo
echo "准备完成！接着跑： bash termux-apk/build.sh"
