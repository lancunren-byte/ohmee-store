# Ohmee 巡店系统 - 生产环境部署指南

## 一、环境要求

| 项目 | 要求 |
|------|------|
| Python | 3.10+ |
| Node.js | 18+（仅构建时需要） |
| 操作系统 | Windows / Linux / macOS |

## 二、快速启动（生产模式）

### Windows

```batch
scripts\start_production.bat
```

### Linux / macOS

```bash
chmod +x scripts/start_production.sh
./scripts/start_production.sh
```

脚本将自动：创建虚拟环境 → 安装依赖 → 初始化数据库 → 构建前端 → 启动服务。

### 访问地址

- **PC 端**：http://localhost:8000/pc
- **移动端**：http://localhost:8000/mobile/login
- **API 健康检查**：http://localhost:8000/api/health

## 三、手动部署步骤

### 1. 准备 Python 环境

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### 2. 初始化数据库

```bash
python -m backend.init_db
```

### 3. 构建前端

```bash
npm install
npm run build
```

### 4. 启动服务

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## 四、环境变量（.env）

复制 `.env.example` 为 `.env` 并修改：

```ini
PORT=8000
HOST=0.0.0.0
DEBUG=false
DATABASE_URL=sqlite:///./ohmee.db
SECRET_KEY=your-secret-key-change-in-production
CHECKIN_MAX_DISTANCE_METERS=100
```

## 五、HTTPS 部署（推荐）

生产环境建议使用 Nginx 反向代理 + Let's Encrypt：

1. Nginx 配置 SSL，反向代理到 `http://127.0.0.1:8000`
2. 摄像头、定位、PWA、Web Push 在 HTTPS 下才能正常工作

## 六、演示账号

| 工号 | 密码 | 角色 |
|------|------|------|
| EMP001 | ohmee2026 | 督导 |
| EMP003 | ohmee2026 | 店长 |
| EMP006 | ohmee2026 | 全职店员 |

## 七、数据库

- 默认使用 SQLite，数据文件：`ohmee.db`（项目根目录）
- 备份：直接复制 `ohmee.db` 文件
- 迁移：可切换为 MySQL/PostgreSQL，修改 `DATABASE_URL` 即可
