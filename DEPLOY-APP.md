# Ohmee 巡店 APP 部署指南

> **适用平台**：Android（直接发 APK）+ iOS（TestFlight 内测 / Ad-hoc 分发）

---

## 一、环境准备总览

| 工具 | Android | iOS | 下载地址 |
|------|:-------:|:---:|---------|
| Node.js 18+ | ✅ | ✅ | https://nodejs.org |
| Android Studio | ✅ | — | https://developer.android.com/studio |
| JDK 17 | ✅ | — | Android Studio 自带 |
| Mac + Xcode 15+ | — | ✅ | Mac App Store |
| Apple 开发者账号 ($99/年) | — | ✅ | https://developer.apple.com |

> ⚠️ **iOS 只能在 Mac 上构建**，Windows 无法编译 iOS 应用，这是 Apple 的硬性限制。  
> 建议：Android 用 Windows 打包，iOS 用 Mac（或找云 Mac 服务，约 ¥20/小时）。

---

## 二、Android APK 打包（Windows/Mac/Linux 均可）

### 2.1 首次配置（只需做一次）

**① 安装 Android Studio**  
安装时勾选：Android SDK、Android SDK Platform、Android Virtual Device

**② 配置 JAVA_HOME 环境变量**
```powershell
# Windows PowerShell - 找到 Android Studio 自带的 JDK 路径（通常如下）
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH += ";$env:JAVA_HOME\bin"
```

**③ 初始化 Android 项目**
```bash
# 构建前端（APP 模式）
npm run build:app

# 添加 Android 平台（只需执行一次）
npx cap add android

# 同步资产
npx cap sync android
```

### 2.2 日常打包（每次发版时执行）

```bash
# 重新构建前端并同步
npm run build:app
npx cap sync android

# 打开 Android Studio 构建 APK
npx cap open:android
```

**在 Android Studio 中生成签名 APK：**
1. 菜单 `Build` → `Generate Signed Bundle / APK`
2. 选择 `APK` → Next
3. 首次：点击 `Create new...` 创建证书（⚠️ 保存好 .jks 文件，丢失后无法更新 APP）
4. 选择 `release` build type → Finish
5. 生成路径：`android/app/release/app-release.apk`

### 2.3 APK 发给员工安装

员工手机需要开启「允许安装未知来源应用」（设置 → 安全 → 未知来源）

**发送方式（任选一种）：**

| 方式 | 操作 | 适合场景 |
|------|------|---------|
| 企业微信/钉钉 | 上传至群文件，员工点击下载安装 | 最常用 |
| 二维码下载页 | 上传至对象存储（OSS），生成下载链接转成二维码 | 批量分发 |
| 内网分发服务器 | `python3 -m http.server 8080`，局域网扫码 | 门店内网 |
| 蒲公英 / fir.im | 上传至第三方内测平台，生成安装二维码 | 专业内测 |

> 推荐 **[蒲公英](https://www.pgyer.com)**：免费额度足够，上传 APK 自动生成二维码，员工扫码直接安装，还能管理版本历史。

---

## 三、iOS IPA 打包（必须在 Mac 上操作）

### 3.1 准备工作

1. 注册 [Apple 开发者账号](https://developer.apple.com/programs/)（$99/年）
2. 在 Mac 上安装 Xcode 15+（App Store 免费）
3. 在 Xcode 中登录你的 Apple ID：`Preferences → Accounts → Add Apple ID`

### 3.2 首次配置

```bash
# 在 Mac 上执行（把项目传到 Mac 后运行）
npm install
npm run build:app
npx cap add ios
npx cap sync ios

# 打开 Xcode
npx cap open ios
```

**在 Xcode 中配置签名：**
1. 左侧点击 `App` → `Signing & Capabilities`
2. Team 选择你的开发者账号
3. Bundle Identifier 确认为 `com.ohmee.store`
4. 勾选 `Automatically manage signing`

### 3.3 内部分发方案对比

| 方案 | 设备数量限制 | 费用 | 更新方式 | 推荐度 |
|------|:-----------:|------|---------|:------:|
| **TestFlight** | 最多 10,000 名测试员 | 含在 $99/年内 | 推送通知更新 | ⭐⭐⭐⭐⭐ |
| **Ad-hoc 分发** | 最多 100 台设备 | 含在 $99/年内 | 重新发安装包 | ⭐⭐⭐ |
| **Enterprise 企业证书** | 无限制 | $299/年 | 自建分发页 | ⭐⭐⭐⭐ |

**推荐选 TestFlight**（员工数 < 10,000 时完全够用）：
- 员工手机安装 TestFlight APP（App Store 免费）
- 你在 App Store Connect 添加员工 Apple ID 为测试员
- 员工收到邮件邀请后，打开 TestFlight 一键安装
- 每次更新 APP，员工 TestFlight 会收到推送通知

### 3.4 打包步骤

```
Xcode → Product → Archive（等待编译完成）
    ↓
Organizer 窗口自动打开 → 选中刚生成的 Archive
    ↓
点击「Distribute App」
    ↓
选择分发方式：
  ┌─ TestFlight → App Store Connect（推荐）
  ├─ Ad Hoc → 导出 .ipa 文件
  └─ Enterprise → 导出 .ipa 文件（需企业证书）
```

---

## 四、APP 权限说明

安装后首次启动，系统会弹出权限请求：

| 权限 | 用途 | 必须授权 |
|------|------|:-------:|
| 📷 相机 | 打卡人脸拍照、交接班现场拍照 | ✅ |
| 📍 位置（精确） | 验证员工在门店 100 米范围内 | ✅ |
| 🔔 通知（可选） | 借调审批结果、任务提醒推送 | 建议开启 |

> 员工拒绝相机或位置权限后，打卡功能将无法使用。可引导员工在手机设置中手动开启：  
> **Android**：设置 → 应用 → Ohmee 巡店 → 权限  
> **iOS**：设置 → 隐私与安全性 → 相机 / 定位服务 → Ohmee 巡店

---

## 五、版本更新流程

```
修改代码
  ↓
npm run build:app          # 重新构建前端
npx cap sync               # 同步到 Android + iOS 项目
  ↓
Android：Android Studio → Generate Signed APK → 发给员工替换安装
iOS：Xcode → Archive → Distribute → TestFlight 推送通知
```

---

## 六、常见问题

**Q：Android 安装提示"解析包时出现问题"？**  
A：APK 签名与已安装版本不一致，先卸载旧版本再安装。（正式发版前统一使用同一个 keystore）

**Q：iOS 提示"无法验证 App"？**  
A：Ad-hoc 安装后需要：设置 → 通用 → VPN 与设备管理 → 信任该开发者。TestFlight 无此问题。

**Q：相机 / 定位权限被拒绝了怎么重新开启？**  
A：直接删除应用重装，或在系统设置中手动找到 Ohmee 巡店重新授权。

**Q：APK 文件太大，员工下载慢？**  
A：正常情况 Release APK 约 5~15MB。可在 `android/app/build.gradle` 中启用 `shrinkResources true` 和 `minifyEnabled true` 减小体积。

---

*如需 Google Play 上架或 App Store 正式发布，请联系技术支持。*
