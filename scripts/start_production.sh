#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "========================================"
echo "  Ohmee 巡店系统 - 生产环境启动"
echo "========================================"
echo

if [ ! -d "venv" ]; then
    echo "[1/4] 创建 Python 虚拟环境..."
    python3 -m venv venv
else
    echo "[1/4] 虚拟环境已存在"
fi

echo "[2/4] 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt -q

echo "[3/4] 初始化数据库..."
python -m backend.init_db

echo "[4/4] 安装前端依赖并构建..."
npm install
npm run build

echo
echo "启动服务..."
echo "PC 端: http://localhost:8000/pc"
echo "移动端: http://localhost:8000/mobile/login"
echo
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
