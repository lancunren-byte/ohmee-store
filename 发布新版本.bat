@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Ohmee 一键发版工具

echo ============================================
echo        Ohmee 一键发版工具
echo ============================================
echo.

:: 读取当前版本号
set "VERSION_FILE=%~dp0src\version.ts"
set "CURRENT_VERSION="
set "CURRENT_BUILD="

for /f "tokens=*" %%a in ('type "%VERSION_FILE%"') do (
    set "line=%%a"
    echo !line! | findstr /c:"APP_VERSION" >nul && (
        for /f "tokens=2 delims=''" %%v in ("!line!") do set "CURRENT_VERSION=%%v"
    )
    echo !line! | findstr /c:"APP_BUILD" >nul && (
        for /f "tokens=2 delims== " %%v in ("!line!") do (
            set "raw=%%v"
            set "CURRENT_BUILD=!raw:~0,-0!"
        )
    )
)

:: 解析版本号
for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VERSION%") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
    set "PATCH=%%c"
)

:: 递增 patch 版本和 build
set /a "NEW_PATCH=%PATCH% + 1"
set /a "NEW_BUILD=%CURRENT_BUILD% + 1"
set "NEW_VERSION=%MAJOR%.%MINOR%.%NEW_PATCH%"

echo 当前版本：v%CURRENT_VERSION% (build %CURRENT_BUILD%)
echo 新版本：  v%NEW_VERSION% (build %NEW_BUILD%)
echo.

:: 输入更新说明
set "RELEASE_NOTES="
set /p "RELEASE_NOTES=请输入本次更新说明（直接回车跳过）: "
if "%RELEASE_NOTES%"=="" set "RELEASE_NOTES=优化体验，修复已知问题"

echo.
echo 即将执行：
echo  1. 更新 src/version.ts  v%CURRENT_VERSION% → v%NEW_VERSION%
echo  2. 重新构建前端 dist/
echo  3. 提交并推送到 GitHub（触发 Codemagic 构建 APK）
echo.
set /p "CONFIRM=确认发版？(y/n): "
if /i not "%CONFIRM%"=="y" (
    echo 已取消。
    pause
    exit /b
)

:: 写入新版本号
echo // 当前 APP 版本（每次发布新 APK 时递增）> "%VERSION_FILE%"
echo export const APP_VERSION = '%NEW_VERSION%'>> "%VERSION_FILE%"
echo export const APP_BUILD = %NEW_BUILD%>> "%VERSION_FILE%"

echo.
echo [1/3] 版本号已更新为 v%NEW_VERSION% (build %NEW_BUILD%)

:: 构建前端
echo.
echo [2/3] 正在构建前端...
cd /d "%~dp0"
call npm run build
if errorlevel 1 (
    echo 构建失败！请检查错误信息。
    pause
    exit /b 1
)
echo 构建完成！

:: Git 提交推送
echo.
echo [3/3] 正在推送到 GitHub...
git add -A
git commit -m "release: v%NEW_VERSION% - %RELEASE_NOTES%"
git push origin main
if errorlevel 1 (
    echo 推送失败！请检查 Git 配置。
    pause
    exit /b 1
)

echo.
echo ============================================
echo  发版成功！v%NEW_VERSION% 已推送到 GitHub
echo ============================================
echo.
echo 后续步骤：
echo  1. 等待 Codemagic 构建 APK（约 15 分钟，完成后发邮件）
echo  2. 下载 APK，拖拽上传到 OrcaTerm 服务器
echo  3. 在服务器执行：
echo     mv /root/app-release*.apk /opt/ohmee-store/uploads/apk/ohmee-latest.apk
echo  4. 更新服务器版本号：
echo     curl -X PUT https://ohmeesm.com/api/app-version ^
echo       -H "Content-Type: application/json" ^
echo       -d "{\"version\":\"%NEW_VERSION%\",\"build\":%NEW_BUILD%,\"force_update\":true,\"apk_url\":\"https://ohmeesm.com/apk/ohmee-latest.apk\",\"release_notes\":\"%RELEASE_NOTES%\"}"
echo.
pause
