# 部署指南

将「能力养成所」部署到线上，让更多人使用。

## 🌐 部署方式对比

| 方式 | 难度 | 费用 | 速度 | 推荐度 |
|------|------|------|------|--------|
| GitHub Pages | ⭐ | 免费 | 快 | ⭐⭐⭐⭐⭐ |
| Vercel | ⭐⭐ | 免费 | 很快 | ⭐⭐⭐⭐⭐ |
| Netlify | ⭐⭐ | 免费 | 快 | ⭐⭐⭐⭐ |
| 云服务器 | ⭐⭐⭐⭐ | 付费 | 中等 | ⭐⭐⭐ |

---

## 方式1：GitHub Pages（最推荐）

### 优点
- ✅ 完全免费
- ✅ 自动HTTPS
- ✅ 自带CDN
- ✅ 操作简单

### 步骤

#### 1. 创建GitHub账号
访问 [github.com](https://github.com) 注册账号

#### 2. 创建仓库
1. 点击右上角 "+" → "New repository"
2. Repository name: `ability-app`（或其他名字）
3. 选择 "Public"
4. 点击 "Create repository"

#### 3. 上传代码

**方式A：使用Git命令行**
```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 关联远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/ability-app.git

# 推送
git branch -M main
git push -u origin main
```

**方式B：使用GitHub网页上传**
1. 在仓库页面点击 "uploading an existing file"
2. 拖拽所有文件到页面
3. 点击 "Commit changes"

#### 4. 开启GitHub Pages
1. 进入仓库 Settings
2. 左侧菜单找到 "Pages"
3. Source 选择 "main" 分支
4. 点击 "Save"
5. 等待1-2分钟

#### 5. 访问你的网站
```
https://你的用户名.github.io/ability-app/
```

### 自定义域名（可选）

如果你有自己的域名：

1. 在域名服务商添加CNAME记录：
```
CNAME   www   你的用户名.github.io
```

2. 在GitHub Pages设置中填入：
```
Custom domain: www.你的域名.com
```

3. 等待DNS生效（10分钟-24小时）

---

## 方式2：Vercel（最快速）

### 优点
- ✅ 部署速度最快（秒级）
- ✅ 自动HTTPS
- ✅ 全球CDN
- ✅ 自动重新部署

### 步骤

#### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录
```bash
vercel login
```

#### 3. 部署
```bash
# 在项目目录运行
vercel

# 按提示操作：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - What's your project's name? ability-app
# - In which directory is your code located? ./
```

#### 4. 获取网址
```
部署完成后会显示：
https://ability-app-xxx.vercel.app
```

### 自定义域名
```bash
vercel domains add 你的域名.com
```

---

## 方式3：Netlify

### 优点
- ✅ 免费版功能丰富
- ✅ 表单处理、函数等扩展功能
- ✅ 拖拽式部署

### 步骤

#### 1. 访问Netlify
[netlify.com](https://www.netlify.com)

#### 2. 注册登录

#### 3. 拖拽部署
1. 点击 "Add new site" → "Deploy manually"
2. 将整个项目文件夹拖拽到页面
3. 等待部署完成

#### 4. 获取网址
```
https://random-name.netlify.app
```

#### 5. 自定义域名（可选）
Site settings → Domain management → Add custom domain

---

## 方式4：云服务器（进阶）

### 适用场景
- 需要后端功能
- 需要数据库
- 需要完全控制

### 推荐服务商
- **国内**：阿里云、腾讯云、华为云
- **国外**：AWS、Google Cloud、DigitalOcean

### 基本步骤

#### 1. 购买服务器
- 系统：Ubuntu 22.04
- 配置：1核2G即可
- 带宽：1M起

#### 2. 连接服务器
```bash
ssh root@你的服务器IP
```

#### 3. 安装Nginx
```bash
# 更新包管理器
apt update

# 安装Nginx
apt install nginx -y

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

#### 4. 上传代码
```bash
# 使用SCP上传（在本地运行）
scp -r ./* root@服务器IP:/var/www/html/

# 或使用FTP工具（FileZilla、WinSCP等）
```

#### 5. 配置Nginx
```bash
# 编辑配置
nano /etc/nginx/sites-available/default
```

配置内容：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 开启gzip压缩
    gzip on;
    gzip_types text/css application/javascript;
}
```

重启Nginx：
```bash
nginx -t  # 测试配置
systemctl reload nginx
```

#### 6. 配置HTTPS（使用Let's Encrypt）
```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d 你的域名.com

# 自动续期
certbot renew --dry-run
```

---

## 📱 移动端适配

### PWA配置（可选）

创建 `manifest.json`：
```json
{
  "name": "能力养成所",
  "short_name": "能力养成所",
  "description": "AI驱动的21天能力成长应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

在 `index.html` 中引入：
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#6366f1">
```

---

## 🔧 性能优化

### 1. 启用压缩
确保服务器开启Gzip压缩（Nginx/Apache）

### 2. CDN加速
使用Cloudflare免费CDN：
1. 注册Cloudflare账号
2. 添加你的域名
3. 修改DNS服务器为Cloudflare提供的
4. 开启代理（橙色云朵）

### 3. 图片优化
如果添加了图片：
- 使用WebP格式
- 压缩图片（tinypng.com）
- 使用懒加载

### 4. 代码压缩
```bash
# 安装terser（JS压缩）
npm install -g terser

# 压缩JS文件
terser js/app.js -o js/app.min.js -c -m

# 压缩CSS（使用cssnano）
npm install -g cssnano-cli
cssnano css/style.css css/style.min.css
```

---

## 🔐 安全建议

### 1. API密钥保护

⚠️ **重要**：不要在前端代码中暴露API密钥！

当前版本为演示，直接写在代码中。生产环境应该：

**方法A：后端代理**
```javascript
// 前端调用你的后端API
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message })
})

// 后端转发到DeepSeek
// 后端代码中保存API密钥
```

**方法B：环境变量**
使用Vercel/Netlify的环境变量功能

**方法C：Serverless函数**
```javascript
// /api/chat.js (Vercel Function)
export default async function handler(req, res) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  // 调用DeepSeek API
}
```

### 2. 数据安全
- 不在LocalStorage存储敏感信息
- 考虑使用加密存储
- 定期清理过期数据

### 3. HTTPS
- 生产环境必须使用HTTPS
- 免费证书：Let's Encrypt
- 云服务商一般提供免费证书

---

## 📊 监控与分析

### Google Analytics（可选）

在 `index.html` 的 `<head>` 中添加：
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Sentry错误监控（可选）
```html
<script src="https://js.sentry-cdn.com/xxx.min.js"></script>
```

---

## 🚀 持续部署（CI/CD）

### GitHub Actions自动部署

创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

每次推送代码到main分支，自动部署！

---

## ✅ 部署检查清单

部署前确认：
- [ ] 所有文件已上传
- [ ] API密钥已配置
- [ ] 在本地测试通过
- [ ] 404页面处理
- [ ] 移动端适配测试
- [ ] HTTPS配置完成
- [ ] 域名DNS已生效
- [ ] 性能测试通过

部署后测试：
- [ ] 访问首页正常
- [ ] AI访谈功能正常
- [ ] 报告生成正常
- [ ] 打卡功能正常
- [ ] 数据持久化正常
- [ ] 移动端显示正常

---

## 🐛 常见问题

### Q: GitHub Pages部署后显示404？
A: 检查仓库设置中的Pages配置，确保分支选择正确

### Q: 部署后AI功能不工作？
A: 
1. 检查API密钥是否正确
2. 查看浏览器Console错误
3. 确认网络可以访问DeepSeek API
4. 检查CORS配置

### Q: HTTPS证书问题？
A: GitHub Pages和Vercel自动提供HTTPS，如果自建服务器，使用Let's Encrypt免费证书

### Q: 国内访问慢？
A: 
1. 使用国内CDN（七牛云、又拍云）
2. 部署到国内服务器
3. 使用Cloudflare CDN

### Q: 如何限制访问？
A: 添加简单的密码保护或OAuth登录

---

## 📞 需要帮助？

部署遇到问题？
1. 查看服务商文档
2. 搜索错误信息
3. 访问社区论坛

---

**祝部署顺利！** 🎉

