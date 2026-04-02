#!/bin/bash
# ============================================================
# Ohmee APP Android 打包脚本
# 前提：已安装 Android Studio + JDK 17 + Node.js 18+
# ============================================================

set -e

echo "========================================"
echo "  Ohmee APP - Android 打包流程"
echo "========================================"

# 第一步：构建前端（APP 模式，使用相对路径）
echo ""
echo "[1/4] 构建前端静态文件..."
BUILD_TARGET=app npm run build
echo "✅ 前端构建完成 → dist/"

# 第二步：首次运行时添加 Android 平台
if [ ! -d "android" ]; then
  echo ""
  echo "[2/4] 初始化 Android 平台（首次运行）..."
  npx cap add android
  echo "✅ Android 平台已创建 → android/"
else
  echo ""
  echo "[2/4] Android 平台已存在，跳过初始化"
fi

# 第三步：同步 Web 资产到 Android 项目
echo ""
echo "[3/4] 同步前端资产到 Android 项目..."
npx cap sync android
echo "✅ 同步完成"

# 第四步：构建 APK
echo ""
echo "[4/4] 编译 APK（debug 版本）..."
cd android
./gradlew assembleDebug
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo ""
  echo "========================================"
  echo "  ✅ 打包成功！"
  echo "  APK 路径：$APK_PATH"
  echo "========================================"
else
  echo "❌ APK 未找到，请检查编译错误"
  exit 1
fi
