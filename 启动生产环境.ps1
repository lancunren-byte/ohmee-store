# Ohmee 巡店系统 - 生产环境启动脚本 (PowerShell)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "========================================"
Write-Host "  Ohmee 巡店系统 - 生产环境启动"
Write-Host "========================================"
Write-Host ""

# 激活虚拟环境
& ".\venv\Scripts\Activate.ps1"

# 安装依赖
pip install -r requirements.txt -q

# 初始化数据库
python -m backend.init_db

# 构建前端
npm install
npm run build

Write-Host ""
Write-Host "启动服务..."
Write-Host "PC 端: http://localhost:8000/pc"
Write-Host "移动端: http://localhost:8000/mobile/login"
Write-Host ""

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
