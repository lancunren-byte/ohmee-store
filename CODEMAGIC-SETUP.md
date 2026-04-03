# Codemagic 云端自动打包配置向导

> 配置完成后，每次推送代码到 Git 仓库，Codemagic 自动在云端 Mac 上构建 iOS IPA 并上传 TestFlight，
> 同时构建 Android APK 发送到你的邮箱，全程无需你动手。

---

## 前提条件

| 需要准备 | 说明 | 费用 |
|---------|------|------|
| Git 仓库 | GitHub / GitLab / Bitbucket 均可 | 免费 |
| Codemagic 账号 | 用 GitHub 账号直接登录 | 免费（500分钟/月 Mac M2） |
| Apple 开发者账号 | iOS 打包必须 | $99/年 |
| Android 签名证书 | 前面已生成的 .jks 文件 | 免费 |

---

## 第一步：把代码推送到 Git 仓库

```bash
# 在项目根目录执行（如果还没有 git 仓库）
git init
git add .
git commit -m "feat: 初始化 Ohmee 巡店系统"

# 在 GitHub/GitLab 创建仓库后，推送
git remote add origin https://github.com/你的用户名/ohmee-store.git
git push -u origin main
```

**注意**：确保 `.gitignore` 中包含以下内容（不要把密钥传到 Git）：
```
android/
ios/
*.keystore
*.jks
keystore.properties
.env
venv/
node_modules/
dist/
```

---

## 第二步：注册并连接 Codemagic

1. 打开 [https://codemagic.io](https://codemagic.io)
2. 点击 **Sign up with GitHub**（用你的 GitHub 账号登录）
3. 进入 **Apps** 页面 → 点击 **Add application**
4. 选择 **GitHub**，找到并选择你的 `ohmee-store` 仓库
5. Project type 选择 **React Native / Other**（不要选 Flutter）
6. 点击 **Finish: Add application**

---

## 第三步：配置 Android 签名证书

1. 进入 Codemagic 控制台 → 左侧菜单 **Teams** → 选择你的团队
2. 点击 **Code signing** → **Android keystores**
3. 点击 **Add keystore**，上传你的 `.jks` / `.keystore` 文件
4. 填写信息：

   | 字段 | 填写内容 |
   |------|---------|
   | Keystore name | `ohmee_keystore`（必须与 codemagic.yaml 中一致） |
   | Keystore password | `ohmee2026`（或你设置的密码） |
   | Key alias | `ohmee` |
   | Key password | `ohmee2026`（或你设置的密码） |

5. 点击 **Add keystore** 保存

---

## 第四步：配置 Apple Developer 账号（iOS 专用）

### 4.1 生成 App Store Connect API Key

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 点击右上角头像 → **Keys**（或访问 Users and Access → Integrations → App Store Connect API）
3. 点击 **+** 生成新 Key：
   - Name：`Codemagic CI`
   - Access：**App Manager**
4. 下载 `.p8` 私钥文件（**只能下载一次，请妥善保存**）
5. 记录下：
   - **Key ID**（10位字母数字，如 `ABC1234567`）
   - **Issuer ID**（UUID 格式，页面顶部显示）

### 4.2 在 Codemagic 中添加 App Store Connect 集成

1. Codemagic → **Teams** → **Integrations** → **App Store Connect**
2. 点击 **Add integration**
3. 填写：

   | 字段 | 填写内容 |
   |------|---------|
   | Integration name | `ohmee_asc_key`（必须与 codemagic.yaml 中一致） |
   | Issuer ID | 上一步记录的 Issuer ID |
   | Key ID | 上一步记录的 Key ID |
   | Private key | 粘贴 .p8 文件的完整内容（包括 `-----BEGIN PRIVATE KEY-----` 行） |

4. 点击 **Save**

### 4.3 在 App Store Connect 创建 APP 占位（iOS 首次必须）

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** → 点击 **+** → **New App**
3. 填写：

   | 字段 | 填写内容 |
   |------|---------|
   | Platform | iOS |
   | Name | Ohmee 巡店 |
   | Primary Language | Simplified Chinese |
   | Bundle ID | `com.ohmee.store` |
   | SKU | `ohmee-store-001` |

4. 点击 **Create**（App 不需要立即提交审核，仅用于 TestFlight）

### 4.4 创建 TestFlight 内部测试组

1. App Store Connect → 你的 App → **TestFlight**
2. 左侧 **Internal Testing** → 点击 **+** 创建组
3. 组名填：`Ohmee Internal Testers`（必须与 codemagic.yaml 中一致）
4. 添加测试员（输入员工 Apple ID 邮箱）

---

## 第五步：配置环境变量

1. Codemagic → 你的 App → **Environment variables**
2. 添加以下变量（勾选 **Secure** 加密存储敏感信息）：

   | 变量名 | 值 | 是否 Secure |
   |--------|-----|:----------:|
   | `NOTIFY_EMAIL` | 你的邮箱地址 | 否 |

---

## 第六步：触发第一次构建

1. Codemagic → 你的 App → 点击 **Start new build**
2. Branch 选 `main`
3. Workflow 先选 **Android Release APK** 测试
4. 点击 **Start new build**

构建完成后（约 10~15 分钟）：
- APK 文件出现在 **Artifacts** 区域，点击下载
- 同时发送到你的邮箱

iOS 构建（约 20~30 分钟）：
- IPA 自动上传到 TestFlight
- 测试员收到 Apple 邮件邀请，安装 TestFlight APP 后即可下载

---

## 第七步：设置自动触发

让每次推送代码自动构建（可选）：

1. Codemagic → 你的 App → **Workflow settings**
2. **Triggers** 部分：
   - 勾选 **Trigger on push**
   - Branch pattern：`main`（只有推送到 main 分支时触发）
3. 保存

之后只需 `git push`，Codemagic 自动开始构建、打包、发送邮件/上传 TestFlight。

---

## 费用说明

| 计划 | 价格 | Mac M2 分钟数 | Linux 分钟数 |
|------|------|:------------:|:------------:|
| **Free** | 免费 | 500 分钟/月 | 无限制 |
| Team | $95/月 | 无限制 | 无限制 |

> 每次 iOS 构建约 20~30 分钟，免费额度每月可构建约 **16~25 次**，日常发版完全够用。  
> Android 构建在 Linux 机器上运行，**完全不消耗 Mac 分钟数**，无限制免费。

---

## 常见问题

**Q：第一次 iOS 构建失败，提示 "No profiles for bundle identifier"？**  
A：检查 App Store Connect 中 Bundle ID 是否为 `com.ohmee.store`，以及 API Key 权限是否为 App Manager。

**Q：TestFlight 中收不到构建？**  
A：App Store Connect 首次需要在 TestFlight → Builds 中手动"启用"该构建（填写出口合规信息），之后自动。

**Q：Android APK 安装提示"解析包时出现问题"？**  
A：签名配置有误，检查 Codemagic 控制台中 keystore 密码是否正确。

**Q：免费额度用完了怎么办？**  
A：等下个月重置，或按需购买额外分钟数（$0.095/分钟），构建一次 iOS 约 $2~3。
