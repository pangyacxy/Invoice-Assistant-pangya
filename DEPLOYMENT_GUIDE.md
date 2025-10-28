# 🚀 GitHub Pages 部署指南

## 📋 准备工作

所有必要的文件都已经准备好了！包括：

- ✅ `index.html` - 主页文件（GitHub Pages入口）
- ✅ `invoice_merger.html` - 工具主文件
- ✅ `README.md` - 项目说明
- ✅ `LICENSE` - MIT许可证
- ✅ `.github/workflows/deploy.yml` - 自动部署配置
- ✅ `.gitignore` - Git忽略文件配置

## 🎯 部署步骤

### 第一步：推送代码到GitHub

在项目目录下执行：

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "🦆 Initial commit: PDF Invoice Merger Tool"

# 添加远程仓库
git remote add origin https://github.com/pangyacxy/Invoice-Assistant-pangya.git

# 推送到GitHub（首次推送使用 -u）
git push -u origin main
```

如果遇到分支名问题（默认是master），先重命名为main：

```bash
git branch -M main
git push -u origin main
```

### 第二步：在GitHub上配置Pages

1. 打开你的仓库页面：https://github.com/pangyacxy/Invoice-Assistant-pangya

2. 点击 **Settings**（设置）

3. 在左侧菜单找到 **Pages**

4. 在 **Build and deployment** 部分：
   - **Source**: 选择 `GitHub Actions`
   - 不要选择 "Deploy from a branch"

5. 保存设置

### 第三步：等待自动部署

1. 推送代码后，GitHub Actions会自动运行

2. 查看部署进度：
   - 进入仓库的 **Actions** 标签页
   - 查看 "Deploy to GitHub Pages" 工作流

3. 等待绿色✅出现（大约1-2分钟）

### 第四步：访问你的网站

部署成功后，你的网站将在以下地址访问：

**🌐 https://pangyacxy.github.io/Invoice-Assistant-pangya/**

## 🔄 后续更新

每次修改代码后，只需：

```bash
git add .
git commit -m "你的更新说明"
git push
```

GitHub Actions会自动重新部署！

## ❓ 常见问题

### Q1: 推送代码时要求输入用户名和密码

**解决方案：使用Personal Access Token**

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：`repo` (全选)
4. 生成token并保存
5. 推送时使用token作为密码

或者使用SSH：

```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加到GitHub
# 复制 ~/.ssh/id_ed25519.pub 的内容
# 在 GitHub Settings > SSH and GPG keys 中添加

# 更改远程地址为SSH
git remote set-url origin git@github.com:pangyacxy/Invoice-Assistant-pangya.git
```

### Q2: GitHub Actions失败

**检查步骤：**

1. 确认仓库Settings > Pages中选择了 `GitHub Actions`
2. 查看Actions标签页的错误信息
3. 确认所有文件都已推送

### Q3: 页面显示404

**可能原因：**

1. 等待几分钟，首次部署需要时间
2. 确认URL正确：`https://pangyacxy.github.io/Invoice-Assistant-pangya/`
3. 检查GitHub Pages设置是否正确

### Q4: 想使用自定义域名

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名（例如：`invoice.yourdomain.com`）
3. 在域名DNS设置中添加CNAME记录指向 `pangyacxy.github.io`

## 📝 快速命令参考

```bash
# 检查状态
git status

# 查看远程仓库
git remote -v

# 查看提交历史
git log --oneline

# 拉取最新代码
git pull

# 创建新分支
git checkout -b feature-name

# 切换分支
git checkout main
```

## 🎉 部署完成后

访问你的网站：https://pangyacxy.github.io/Invoice-Assistant-pangya/

记得在README.md中更新徽章和链接！

## 💡 进阶配置

### 添加自定义404页面

创建 `404.html` 文件，内容自定义。

### 添加Google Analytics

在 `index.html` 的 `<head>` 中添加Google Analytics代码。

### 添加网站图标

1. 准备 `favicon.ico` 文件
2. 放在根目录
3. 在HTML中添加：
```html
<link rel="icon" href="favicon.ico" type="image/x-icon">
```

---

**准备好了吗？开始部署吧！🚀**

如有问题，参考：
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

