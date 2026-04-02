@echo off
chcp 65001 >nul
echo ========================================
echo   Ohmee 巡店系统 - 生产环境启动
echo ========================================
echo.

cd /d "%~dp0.."

if not exist "venv\Scripts\activate.bat" (
    echo [1/4] 创建 Python 虚拟环境...
    if exist "venv" (
        echo 检测到不完整的虚拟环境，正在重新创建...
        rmdir /s /q venv
    )
    python -m venv venv 2>nul
    if errorlevel 1 (
        py -m venv venv
    )
    if not exist "venv\Scripts\activate.bat" (
        echo 创建虚拟环境失败，请确保已安装 Python 3.10+
        pause
        exit /b 1
    )
) else (
    echo [1/4] 虚拟环境已存在
)

echo [2/4] 激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q

echo [3/4] 初始化数据库...
python -m backend.init_db

echo [4/4] 安装前端依赖并构建...
call npm install
if errorlevel 1 (
    echo npm install 失败
    pause
    exit /b 1
)
call npm run build
if errorlevel 1 (
    echo 前端构建失败
    pause
    exit /b 1
)

echo.
echo 启动服务...
echo PC 端: http://localhost:8000/pc
echo 移动端: http://localhost:8000/mobile/login
echo.
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
