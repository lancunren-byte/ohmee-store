@echo off
chcp 65001 >nul
title Ohmee - 推送到 GitHub

echo ========================================
echo   Ohmee 巡店系统 - 推送到 GitHub
echo ========================================
echo.

:: 设置 Git 用户信息
echo [1/5] 配置 Git 用户信息...
git config --global user.name "lancunren-byte"
git config --global user.email "lancunren-byte@users.noreply.github.com"
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
echo      完成

:: 初始化 Git 仓库
echo [2/5] 初始化本地 Git 仓库...
cd /d "e:\Ohmee巡店系统"
git init
git branch -M main
echo      完成

:: 添加所有文件
echo [3/5] 添加文件到暂存区...
git add .
git status --short
echo      完成

:: 提交
echo [4/5] 创建首次提交...
git commit -m "feat: Ohmee 巡店系统初始版本 v1.0"
echo      完成

:: 创建 GitHub 仓库并推送
echo [5/5] 创建 GitHub 仓库并推送...
echo.
echo      正在用浏览器登录 GitHub（如果还未登录）...
gh auth login --web --hostname github.com --git-protocol https

echo.
echo      正在创建仓库 lancunren-byte/ohmee-store ...
gh repo create lancunren-byte/ohmee-store --public --description "Ohmee 便利店巡店排班打卡系统" --push --source .

echo.
echo ========================================
echo   推送完成！
echo   仓库地址：https://github.com/lancunren-byte/ohmee-store
echo ========================================
echo.
pause
