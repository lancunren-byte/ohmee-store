#!/bin/bash
# ============================================================
# Ohmee APP - Android 正式签名 APK 打包脚本
# 生成可直接发给员工安装的正式版 APK
# ============================================================

set -e

KEYSTORE_FILE="ohmee-release.keystore"
KEY_ALIAS="ohmee"
APK_OUTPUT="ohmee-release.apk"

echo "========================================"
echo "  Ohmee APP - Android Release 打包"
echo "========================================"

# ── 第一步：生成签名证书（仅首次执行） ──────────────────────
if [ ! -f "$KEYSTORE_FILE" ]; then
  echo ""
  echo "[0/5] 首次运行：生成 APK 签名证书..."
  echo "      请按提示输入信息（公司名、地区等，全部可填 Ohmee）"
  echo ""
  keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass ohmee2026 \
    -keypass ohmee2026 \
    -dname "CN=Ohmee, OU=Ohmee, O=Ohmee, L=Shanghai, S=Shanghai, C=CN"
  echo "✅ 证书已生成：$KEYSTORE_FILE（请妥善保管，丢失后无法更新 APP）"
else
  echo "[0/5] 签名证书已存在：$KEYSTORE_FILE"
fi

# ── 第一步：构建前端 ────────────────────────────────────────
echo ""
echo "[1/5] 构建前端（APP 模式）..."
BUILD_TARGET=app npm run build
echo "✅ 前端构建完成"

# ── 第二步：初始化 / 确认 Android 平台 ─────────────────────
if [ ! -d "android" ]; then
  echo ""
  echo "[2/5] 初始化 Android 平台..."
  npx cap add android
else
  echo "[2/5] Android 平台已就绪"
fi

# ── 第三步：同步资产 ────────────────────────────────────────
echo ""
echo "[3/5] 同步前端资产到 Android 项目..."
npx cap sync android
echo "✅ 同步完成"

# ── 第四步：写入签名配置 ────────────────────────────────────
KEYSTORE_ABS=$(realpath "$KEYSTORE_FILE")
SIGNING_CONFIG="android/app/keystore.properties"
cat > "$SIGNING_CONFIG" <<EOF
storeFile=$KEYSTORE_ABS
storePassword=ohmee2026
keyAlias=$KEY_ALIAS
keyPassword=ohmee2026
EOF
echo "[4/5] 签名配置已写入：$SIGNING_CONFIG"

# ── 第五步：构建 Release APK ────────────────────────────────
echo ""
echo "[5/5] 编译 Release APK..."
cd android

# 在 build.gradle 中启用签名（如果还未配置）
if ! grep -q "keystoreProperties" app/build.gradle; then
  sed -i '1s/^/def keystoreProperties = new Properties()\nkeystoreProperties.load(new FileInputStream(rootProject.file("app\/keystore.properties")))\n\n/' app/build.gradle
  sed -i '/android {/a\\n    signingConfigs {\n        release {\n            storeFile file(keystoreProperties["storeFile"])\n            storePassword keystoreProperties["storePassword"]\n            keyAlias keystoreProperties["keyAlias"]\n            keyPassword keystoreProperties["keyPassword"]\n        }\n    }' app/build.gradle
fi

./gradlew assembleRelease
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  cp "$APK_PATH" "$APK_OUTPUT"
  APK_SIZE=$(du -sh "$APK_OUTPUT" | cut -f1)
  echo ""
  echo "========================================"
  echo "  ✅ 打包成功！"
  echo "  文件：$APK_OUTPUT（$APK_SIZE）"
  echo ""
  echo "  发给员工安装方式："
  echo "  1. 上传到企业微信/钉钉群文件"
  echo "  2. 上传到任意网盘生成下载链接"
  echo "  3. 局域网内用 python3 -m http.server 分享"
  echo "========================================"
else
  echo "❌ APK 未生成，请检查上方错误信息"
  exit 1
fi
