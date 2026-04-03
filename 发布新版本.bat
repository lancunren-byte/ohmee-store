@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Ohmee Release Tool

echo ============================================
echo        Ohmee Release Tool
echo ============================================
echo.

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

for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VERSION%") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
    set "PATCH=%%c"
)

set /a "NEW_PATCH=%PATCH% + 1"
set /a "NEW_BUILD=%CURRENT_BUILD% + 1"
set "NEW_VERSION=%MAJOR%.%MINOR%.%NEW_PATCH%"

echo Current: v%CURRENT_VERSION% (build %CURRENT_BUILD%)
echo New:     v%NEW_VERSION% (build %NEW_BUILD%)
echo.

set "RELEASE_NOTES=Bug fixes and improvements"
set /p "RELEASE_NOTES=Update notes (Enter to skip): "

echo.
set /p "CONFIRM=Confirm release? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    pause
    exit /b
)

(
echo /** APP version - auto managed by release script */
echo export const APP_VERSION = '%NEW_VERSION%'
echo export const APP_BUILD = %NEW_BUILD%
) > "%VERSION_FILE%"

echo.
echo [1/3] Version updated: v%NEW_VERSION% (build %NEW_BUILD%)

echo.
echo [2/3] Building frontend...
cd /d "%~dp0"
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build done!

echo.
echo [3/3] Pushing to GitHub...
git add -A
git commit --trailer "Made-with: Cursor" -m "release: v%NEW_VERSION% - %RELEASE_NOTES%"
git push origin main
if errorlevel 1 (
    echo Push failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Released: v%NEW_VERSION% pushed to GitHub
echo ============================================
echo.
echo Next steps after Codemagic builds the APK:
echo.
echo  A. Download APK, drag to OrcaTerm to upload
echo.
echo  B. On server: mv /root/app-release*.apk /opt/ohmee-store/uploads/apk/ohmee-latest.apk
echo.
echo  C. Update version on server (copy this line to OrcaTerm):
echo.
echo curl -X PUT https://ohmeesm.com/api/app-version -H "Content-Type: application/json" -d "{\"version\":\"%NEW_VERSION%\",\"build\":%NEW_BUILD%,\"force_update\":true,\"apk_url\":\"https://ohmeesm.com/apk/ohmee-latest.apk\",\"release_notes\":\"%RELEASE_NOTES%\"}"
echo.
pause