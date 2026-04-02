#!/bin/bash
# ============================================================
# Ohmee APP - iOS 打包脚本
# ⚠️  必须在 Mac 上运行，需要 Xcode 15+ 和 Apple Developer 账号
# ============================================================

set -e

echo "========================================"
echo "  Ohmee APP - iOS 打包流程"
echo "========================================"

# ── 第一步：构建前端 ────────────────────────────────────────
echo ""
echo "[1/4] 构建前端（APP 模式）..."
BUILD_TARGET=app npm run build
echo "✅ 前端构建完成"

# ── 第二步：初始化 / 确认 iOS 平台 ─────────────────────────
if [ ! -d "ios" ]; then
  echo ""
  echo "[2/4] 初始化 iOS 平台（首次运行）..."
  npx cap add ios
  echo "✅ iOS 平台已创建 → ios/"
else
  echo "[2/4] iOS 平台已就绪"
fi

# ── 第三步：同步资产并修复 iOS 权限描述 ────────────────────
echo ""
echo "[3/4] 同步前端资产到 iOS 项目..."
npx cap sync ios

# 写入 Info.plist 权限描述（首次同步后自动补充）
PLIST="ios/App/App/Info.plist"
if [ -f "$PLIST" ]; then
  # 相机权限
  if ! grep -q "NSCameraUsageDescription" "$PLIST"; then
    plutil -insert NSCameraUsageDescription \
      -string "Ohmee 巡店系统需要使用相机进行打卡拍照验证" \
      "$PLIST"
    echo "  ✅ 已添加相机权限描述"
  fi
  # 定位权限
  if ! grep -q "NSLocationWhenInUseUsageDescription" "$PLIST"; then
    plutil -insert NSLocationWhenInUseUsageDescription \
      -string "Ohmee 巡店系统需要获取您的位置，以验证您在门店范围内打卡" \
      "$PLIST"
    echo "  ✅ 已添加定位权限描述"
  fi
fi
echo "✅ 同步完成"

# ── 第四步：用 Xcode 打开项目 ────────────────────────────────
echo ""
echo "[4/4] 正在打开 Xcode..."
npx cap open ios

echo ""
echo "========================================"
echo "  Xcode 已打开，请按以下步骤操作："
echo ""
echo "  【内部分发（Ad-hoc）】"
echo "  1. 顶部选择目标设备为 'Any iOS Device'"
echo "  2. Signing & Capabilities → 选择你的 Apple 开发者账号 Team"
echo "  3. 菜单 Product → Archive"
echo "  4. Organizer 窗口 → Distribute App → Ad Hoc"
echo "  5. 导出 .ipa 文件，上传到企业微信/内网服务器"
echo ""
echo "  【TestFlight 内测分发（推荐）】"
echo "  1. 同上 Archive 后 → Distribute App → App Store Connect"
echo "  2. 登录 App Store Connect → TestFlight → 添加内部测试人员"
echo "  3. 员工收到邀请邮件后安装 TestFlight APP 即可下载"
echo "========================================"
