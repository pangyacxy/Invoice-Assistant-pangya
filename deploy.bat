@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   🦆 PDF发票拼接工具 - 快速部署脚本
echo   爱来自胖鸭没有肉
echo ========================================
echo.

REM 检查是否是Git仓库
if not exist ".git" (
    echo 📁 初始化Git仓库...
    git init
    git branch -M main
    echo ✅ Git仓库初始化完成
    echo.
)

REM 检查远程仓库
git remote -v | findstr "origin" >nul
if errorlevel 1 (
    echo 🔗 添加远程仓库...
    git remote add origin https://github.com/pangyacxy/Invoice-Assistant-pangya.git
    echo ✅ 远程仓库添加完成
    echo.
)

echo 📦 添加文件...
git add .

echo.
set /p commit_msg="💬 输入提交信息 (直接回车使用默认): "
if "%commit_msg%"=="" set commit_msg=🦆 Update: Invoice Merger Tool

echo.
echo 📝 提交更改...
git commit -m "%commit_msg%"

echo.
echo 🚀 推送到GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 💡 可能的原因：
    echo 1. 首次推送需要登录GitHub账号
    echo 2. 需要配置Personal Access Token
    echo 3. 网络连接问题
    echo.
    echo 📖 请查看 DEPLOYMENT_GUIDE.md 获取详细帮助
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 部署成功！
echo ========================================
echo.
echo 🌐 你的网站将在几分钟后上线：
echo    https://pangyacxy.github.io/Invoice-Assistant-pangya/
echo.
echo 📊 查看部署进度：
echo    https://github.com/pangyacxy/Invoice-Assistant-pangya/actions
echo.
echo 💡 记得在GitHub仓库设置中启用GitHub Pages！
echo    Settings → Pages → Source: GitHub Actions
echo.
pause

