# PDF发票拼接工具 - 测试验证指南

## 如何验证工具保持了原始尺寸？

### 方法1：使用PDF阅读器查看属性

#### Adobe Acrobat Reader
1. 打开原始PDF文件
2. 文件 → 属性 → 描述
3. 记录"页面大小"（例如：148 × 210 mm）
4. 打开拼接后的PDF
5. 文件 → 属性 → 描述
6. 验证尺寸是否符合预期（例如：148 × 420 mm，高度翻倍）

#### PDF-XChange Viewer
1. 右键点击PDF → 文档属性
2. 查看页面尺寸信息

#### Chrome浏览器
1. 用Chrome打开PDF
2. 右键 → 检查元素
3. 查看Console中的页面信息

### 方法2：使用在线PDF工具

访问以下网站检查PDF尺寸：
- https://pdfresizer.com/inspect
- https://www.ilovepdf.com/pdf_to_jpg

### 方法3：使用命令行工具

#### Windows (使用 PowerShell + PDFtk 或 pdfinfo)

```powershell
# 安装 pdfinfo (需要先安装 Xpdf)
# 下载：https://www.xpdfreader.com/download.html

# 查看原始PDF尺寸
pdfinfo 原始发票.pdf | Select-String "Page size"

# 查看拼接后PDF尺寸
pdfinfo 拼接_001.pdf | Select-String "Page size"
```

#### Mac/Linux

```bash
# 使用 pdfinfo（通常预装）
pdfinfo 原始发票.pdf | grep "Page size"
pdfinfo 拼接_001.pdf | grep "Page size"

# 使用 identify（ImageMagick）
identify -format "%w x %h pixels\n" 原始发票.pdf
identify -format "%w x %h pixels\n" 拼接_001.pdf
```

## 测试用例

### 测试1：相同尺寸PDF拼接

**输入：**
- 发票1.pdf: 420 × 595 pt (A5横向)
- 发票2.pdf: 420 × 595 pt (A5横向)

**预期输出：**
- 拼接_001.pdf: 420 × 1190 pt (高度=595+595)

**验证：**
```
✓ 宽度保持：420 pt
✓ 高度翻倍：1190 pt = 595 × 2
✓ 无缩放变形
```

### 测试2：不同宽度PDF拼接

**输入：**
- 发票1.pdf: 400 × 600 pt
- 发票2.pdf: 500 × 600 pt

**预期输出：**
- 拼接_001.pdf: 500 × 1200 pt

**验证：**
```
✓ 宽度取最大：500 pt (较宽的那张)
✓ 高度求和：1200 pt = 600 + 600
✓ 窄的发票居中对齐
```

### 测试3：不同高度PDF拼接

**输入：**
- 发票1.pdf: 420 × 500 pt
- 发票2.pdf: 420 × 700 pt

**预期输出：**
- 拼接_001.pdf: 420 × 1200 pt

**验证：**
```
✓ 宽度保持：420 pt
✓ 高度求和：1200 pt = 500 + 700
✓ 各保持原始高度
```

### 测试4：奇数PDF（最后一张单独）

**输入：**
- 发票1.pdf: 420 × 595 pt
- 发票2.pdf: 420 × 595 pt
- 发票3.pdf: 420 × 595 pt

**预期输出：**
- 拼接_001.pdf: 420 × 1190 pt (发票1+2)
- 拼接_002.pdf: 420 × 595 pt (仅发票3)

**验证：**
```
✓ 第一个PDF：正常拼接两张
✓ 第二个PDF：只有一张的尺寸
✓ 无多余空白区域
```

## 快速验证清单

打印此清单，测试时逐项检查：

- [ ] **步骤1：** 准备2-3个已知尺寸的测试PDF
- [ ] **步骤2：** 记录每个PDF的原始尺寸（宽×高）
- [ ] **步骤3：** 使用工具拼接PDF
- [ ] **步骤4：** 解压输出的ZIP文件
- [ ] **步骤5：** 检查拼接后的PDF尺寸
- [ ] **步骤6：** 验证公式：
  - 输出宽度 = max(PDF1宽度, PDF2宽度)
  - 输出高度 = PDF1高度 + PDF2高度
- [ ] **步骤7：** 打开PDF目视检查，确认无变形
- [ ] **步骤8：** 放大查看细节，确认清晰度

## 常见尺寸参考

| 纸张类型 | 尺寸 (mm) | 尺寸 (pt) | 备注 |
|---------|----------|----------|------|
| A5 横向 | 148 × 210 | 420 × 595 | 标准A5 |
| A5 纵向 | 210 × 148 | 595 × 420 | 旋转90° |
| A4 横向 | 210 × 297 | 595 × 842 | 标准A4 |
| A4 纵向 | 297 × 210 | 842 × 595 | 旋转90° |
| B5 | 176 × 250 | 499 × 709 | 日本常用 |
| Letter | 216 × 279 | 612 × 792 | 美国标准 |

**注意：** 1 inch = 72 points, 1 mm = 2.83465 points

## 问题排查

### 如果发现尺寸不对？

1. **检查原始PDF**
   - 确认原始PDF本身的尺寸是否正确
   - 有些PDF可能已经被缩放过

2. **检查PDF阅读器设置**
   - 打印/查看时是否设置了"适应页面"
   - 改为"实际大小"查看

3. **检查浏览器**
   - 使用最新版Chrome或Edge
   - 清除浏览器缓存
   - 刷新页面重试

4. **生成调试报告**
   - 打开浏览器开发者工具（F12）
   - 查看Console标签
   - 截图任何错误信息

## 精确度测试

### 专业级验证

如果你需要100%确认尺寸精确度：

```python
# 使用Python + PyPDF2验证
from PyPDF2 import PdfReader

def check_pdf_size(filename):
    reader = PdfReader(filename)
    page = reader.pages[0]
    mediabox = page.mediabox
    width = float(mediabox.width)
    height = float(mediabox.height)
    print(f"{filename}: {width} × {height} pt")
    return width, height

# 测试原始PDF
w1, h1 = check_pdf_size("原始1.pdf")
w2, h2 = check_pdf_size("原始2.pdf")

# 测试拼接后PDF
w_out, h_out = check_pdf_size("拼接_001.pdf")

# 验证
expected_width = max(w1, w2)
expected_height = h1 + h2

print(f"\n验证结果：")
print(f"预期宽度: {expected_width} pt")
print(f"实际宽度: {w_out} pt")
print(f"宽度匹配: {abs(w_out - expected_width) < 0.1}")
print(f"\n预期高度: {expected_height} pt")
print(f"实际高度: {h_out} pt")
print(f"高度匹配: {abs(h_out - expected_height) < 0.1}")
```

## 视觉验证技巧

### 方法1：网格对比
1. 在PDF上叠加网格（使用PDF编辑器）
2. 拼接前后对比网格是否对齐
3. 如有变形，网格会扭曲

### 方法2：文字清晰度
1. 选择包含小号文字的PDF
2. 拼接后放大到200%
3. 检查文字边缘是否清晰
4. 模糊说明可能有重采样

### 方法3：精确测量
1. 打印拼接前的PDF
2. 打印拼接后的PDF
3. 使用尺子实际测量
4. 验证物理尺寸是否一致

## 总结

**核心验证点：**
✅ 输出宽度 = max(输入1宽度, 输入2宽度)
✅ 输出高度 = 输入1高度 + 输入2高度
✅ 文字清晰，无模糊
✅ 无拉伸变形
✅ 尺寸误差 < 0.1 pt

如果以上都通过，说明工具完美保持了原始尺寸！🎉

---

*如有疑问，请参考 `invoice_merger_README.md` 或 `invoice_merger_EXAMPLE.md`*

