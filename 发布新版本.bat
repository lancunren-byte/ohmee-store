@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Ohmee 一键发版工具

echo ============================================
echo        Ohmee 一键发版工具
echo ============================================
echo.

:: 读取当前版本号（从 src/version.ts）
set "VERSION_FILE=%~dp0src\version.ts"
set "CURRENT_VERSION=1.0.0"
set "CURRENT_BUILD=1"

for /f "usebackq tokens=*" %%a in ("%VERSION_FILE%") do (
    set "line=%%a"
    echo !line! | findstr /c:"APP_VERSION" >nul && (
        for /f "tokens=2 delims='" %%v in ("!line!") do set "CURRENT_VERSION=%%v"
    )
    echo !line! | findstr /c:"APP_BUILD" >nul && (
        for /f "tokens=2 delims==" %%v in ("!line!") do (
            set "tmp=%%v"
            set "tmp=!tmp: =!"
            set "CURRENT_BUILD=!tmp!"
        )
    )
)

:: 解析版本号 MAJOR.MINOR.PATCH
for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VERSION%") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
    set "PATCH=%%c"
)

:: 自动递增
set /a "NEW_PATCH=%PATCH% + 1"
set /a "NEW_BUILD=%CURRENT_BUILD% + 1"
set "NEW_VERSION=%MAJOR%.%MINOR%.%NEW_PATCH%"

echo 当前版本：v%CURRENT_VERSION% ^(build %CURRENT_BUILD%^)
echo 新版本：  v%NEW_VERSION% ^(build %NEW_BUILD%^)
echo.

:: 输入更新说明
set "RELEASE_NOTES=优化体验，修复已知问题"
set /p "RELEASE_NOTES=请输入本次更新说明（直接回车跳过）: "

echo.
echo 即将执行：
echo   - 更新版本号: v%CURRENT_VERSION% -^> v%NEW_VERSION%
echo   - 重新构建前端 dist/
echo   - 提交并推送到 GitHub
echo.
set /p "CONFIRM=确认发版？(y/n): "
if /i not "%CONFIRM%"=="y" (
    echo 已取消。
    pause
    exit /b
)

:: 写入新版本号到 version.ts
(
echo /** 当前 APP 版本（每次发布新 APK 时递增） */
echo export const APP_VERSION = '%NEW_VERSION%'
echo export const APP_BUILD = %NEW_BUILD%
) > "%VERSION_FILE%"

echo.
echo [步骤 1/3] 版本号已更新为 v%NEW_VERSION% ^(build %NEW_BUILD%^)

:: 构建前端
echo.
echo [步骤 2/3] 正在构建前端...
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
echo [步骤 3/3] 正在推送到 GitHub...
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
echo   发版成功！v%NEW_VERSION% 已推送到 GitHub
echo ============================================
echo.
echo 后续步骤（等 Codemagic 构建完 APK 后）：
echo.
echo   A. 下载 APK，拖拽上传到 OrcaTerm
echo.
echo   B. 服务器执行：
echo      mv /root/app-release*.apk /opt/ohmee-store/uploads/apk/ohmee-latest.apk
echo.
echo   C. 更新服务器版本号（复制下面这行到 OrcaTerm）：
echo.
echo curl -X PUT https://ohmeesm.com/api/app-version -H "Content-Type: application/json" -d "{\"version\":\"%NEW_VERSION%\",\"build\":%NEW_BUILD%,\"force_update\":true,\"apk_url\":\"https://ohmeesm.com/apk/ohmee-latest.apk\",\"release_notes\":\"%RELEASE_NOTES%\"}"
echo.
pause
