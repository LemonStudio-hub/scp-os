@echo off
chcp 65001 >nul
title SCP-OS 开发服务器
cd /d "%~dp0"

echo.
echo  ┌─────────────────────────────────────────┐
echo  │         SCP-OS 开发服务器               │
echo  │                                         │
echo  │  本地访问: http://localhost:37291        │
echo  │  局域网:   http://192.168.1.18:37291     │
echo  └─────────────────────────────────────────┘
echo.

:: 检查 pnpm 是否安装
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 pnpm，请先安装: npm install -g pnpm
    pause
    exit /b 1
)

echo 正在启动...
echo.
pnpm dev

pause
