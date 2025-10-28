# 🦆 PDF发票拼接工具 | Invoice Assistant

[![GitHub Pages](https://img.shields.io/badge/demo-online-brightgreen)](https://pangyacxy.github.io/Invoice-Assistant-pangya/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made with Love](https://img.shields.io/badge/made%20with-❤️-red.svg)](https://github.com/pangyacxy)

> 💕 爱来自胖鸭没有肉

一个简单易用的PDF发票拼接工具，支持批量处理，完全保持原始尺寸，不缩放不变形！

## 🌟 在线体验

**[🚀 立即使用 →](https://pangyacxy.github.io/Invoice-Assistant-pangya/)**

## ✨ 主要特性

- 🎯 **保持原样** - 完全保持原始PDF尺寸，不缩放、不拉伸、不变形
- 📦 **ZIP支持** - 上传ZIP压缩包，自动解压并按文件名排序
- 🔄 **批量处理** - 一次处理最多100个PDF文件
- 📝 **智能拼接** - 每两张PDF自动拼接成一张（上下排列）
- 💾 **打包输出** - 拼接完成后自动打包成ZIP下载
- 🔒 **隐私安全** - 完全在浏览器本地处理，不上传服务器
- 🎨 **美观界面** - 现代化设计，流畅的用户体验

## 📖 使用方法

### 方法一：上传ZIP压缩包（推荐）

1. 将所有PDF发票文件放入文件夹
2. 按顺序命名：`001.pdf`, `002.pdf`, `003.pdf`...
3. 压缩成ZIP格式
4. 上传到工具
5. 点击"开始拼接"
6. 下载生成的ZIP文件

### 方法二：直接上传多个PDF

1. 点击上传区域
2. 按住 Ctrl/Cmd 选择多个PDF文件
3. 文件会自动按文件名排序
4. 点击"开始拼接"
5. 下载生成的ZIP文件

## 🎯 拼接规则

```
输入：100张PDF (001.pdf ~ 100.pdf)
输出：50个拼接后的PDF，打包成ZIP

第1、2张 → 拼接_001.pdf
第3、4张 → 拼接_002.pdf
第5、6张 → 拼接_003.pdf
...
第99、100张 → 拼接_050.pdf

如果是奇数张，最后一个PDF只包含一张
```

## 💡 技术特点

- **前端技术**：纯HTML + JavaScript
- **PDF处理**：PDF.js 3.11.174
- **PDF生成**：jsPDF 2.5.1
- **ZIP处理**：JSZip 3.10.1
- **尺寸保持**：读取原始PDF尺寸，精确拼接
- **渲染质量**：2倍分辨率渲染，保证清晰度

## 📊 性能参考

| 文件数量 | 预计处理时间 | 输出文件数 |
|---------|-------------|-----------|
| 10张    | ~10秒       | 5个PDF    |
| 50张    | ~50秒       | 25个PDF   |
| 100张   | ~2分钟      | 50个PDF   |

## 🔧 本地运行

```bash
# 克隆仓库
git clone https://github.com/pangyacxy/Invoice-Assistant-pangya.git

# 进入目录
cd Invoice-Assistant-pangya

# 直接用浏览器打开
# Windows
start invoice_merger.html

# Mac
open invoice_merger.html

# Linux
xdg-open invoice_merger.html
```

或者使用本地服务器：

```bash
# Python 3
python -m http.server 8000

# Node.js (需要安装 http-server)
npx http-server

# 然后访问 http://localhost:8000
```

## 📁 文件说明

- `invoice_merger.html` - 主工具文件
- `invoice_merger_README.md` - 详细使用说明
- `invoice_merger_EXAMPLE.md` - 使用示例和场景
- `invoice_merger_TEST.md` - 测试验证指南
- `invoice_merger_更新说明.md` - 版本更新说明

## 🌐 浏览器兼容性

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 💖 关于作者

**爱来自胖鸭没有肉** 🦆

- GitHub: [@pangyacxy](https://github.com/pangyacxy)
- 项目主页: [Invoice-Assistant-pangya](https://github.com/pangyacxy/Invoice-Assistant-pangya)

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## ⭐ Star History

如果这个工具帮到了你，请给个 Star ⭐️ 支持一下！

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/pangyacxy">胖鸭没有肉</a>
  <br>
  <sub>© 2025 Invoice Assistant. All rights reserved.</sub>
</div>
