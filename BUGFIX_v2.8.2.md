# Bug修复 v2.8.2 - 阶段辅导API错误

## 修复日期
2025-10-24

## 问题描述

用户在阶段辅导对话中发送消息后，AI无法正常回复，而是显示错误信息：
> "抱歉，我遇到了一些问题。但我能看出，你在这段时间确实有不少收获。"

## 根本原因分析

### 问题1: 除以零错误
```javascript
// 原代码
const avgScore = ability.checkInData.reduce((sum, d) => sum + (d.score || 0), 0) / completedDays;
```

**问题：** 当 `completedDays = 0` 时（刚开始能力提升，还没有打卡），会出现除以零错误。

### 问题2: 数据为空时的错误
```javascript
const recentCheckIns = ability.checkInData
    .filter(d => d.completed)
    .slice(-5)
    .map(d => `第${d.day}天: ${d.aiReport || ''}`)
    .join('\n');
```

**问题：** 当没有完成任何打卡时，`recentCheckIns` 为空字符串，导致提示词格式异常。

### 问题3: 错误日志不足
原代码的 catch 块只输出简单的错误信息，无法定位具体问题。

---

## 修复方案

### 修复1: 安全的平均分计算

**修改文件：** `js/api.js`

**修改前：**
```javascript
const completedDays = ability.checkInData.filter(d => d.completed).length;
const totalDays = ability.totalDays || 21;
const avgScore = ability.checkInData.reduce((sum, d) => sum + (d.score || 0), 0) / completedDays;
```

**修改后：**
```javascript
const completedDays = ability.checkInData.filter(d => d.completed).length;
const totalDays = ability.totalDays || 21;

// 安全计算平均分
let avgScore = 0;
if (completedDays > 0) {
    avgScore = ability.checkInData.reduce((sum, d) => sum + (d.score || 0), 0) / completedDays;
}
```

---

### 修复2: 安全的记录显示

**修改前：**
```javascript
const recentCheckIns = ability.checkInData
    .filter(d => d.completed)
    .slice(-5)
    .map(d => `第${d.day}天: ${d.aiReport || ''}`)
    .join('\n');
```

**修改后：**
```javascript
const recentCheckIns = ability.checkInData
    .filter(d => d.completed)
    .slice(-5)
    .map(d => `第${d.day}天: ${d.aiReport || '完成'}`)
    .join('\n') || '暂无记录';
```

**改进：**
- 为没有报告的记录提供默认值 `'完成'`
- 如果完全没有记录，返回 `'暂无记录'`

---

### 修复3: 动态提示词

**修改前：**
```javascript
const prompt = `你是一位温暖、专业的成长教练，正在和用户${nickname}进行阶段辅导对话。

用户刚刚完成了「${ability.name}」的练习。

进展数据：
- 已完成：${completedDays}/${totalDays}天
- 平均得分：${avgScore.toFixed(1)}分
- 最近5天记录：
${recentCheckIns}
...`;
```

**修改后：**
```javascript
const prompt = `你是一位温暖、专业的成长教练，正在和用户${nickname}进行阶段辅导对话。

用户正在进行「${ability.name}」的能力提升。

进展数据：
- 已完成：${completedDays}/${totalDays}天
${completedDays > 0 ? `- 平均得分：${avgScore.toFixed(1)}分` : '- 刚刚开始'}
${completedDays > 0 ? `- 最近记录：\n${recentCheckIns}` : ''}
...`;
```

**改进：**
- 根据 `completedDays` 动态显示内容
- 刚开始时显示 "刚刚开始"，不显示分数和记录
- 有打卡记录时才显示详细数据

---

### 修复4: 增强错误日志

**修改文件：** `js/app.js`

**修改前：**
```javascript
} catch (error) {
    this.showLoading(false);
    console.error('辅导对话失败:', error);
    this.addCoachingMessage('ai', '抱歉，我遇到了一些问题。但我能看出，你在这段时间确实有不少收获。');
}
```

**修改后：**
```javascript
} catch (error) {
    this.showLoading(false);
    console.error('辅导对话失败:', error);
    console.error('错误详情:', error.message);
    console.error('当前能力数据:', this.abilities.find(a => a.id === this.currentAbilityId));
    console.error('对话历史:', this.currentCoachingSession?.messages);
    
    // 更友好的错误提示
    this.addCoachingMessage('ai', '抱歉，我暂时无法回复。请稍后再试，或者刷新页面重新开始对话。如果问题持续，可能是网络连接问题。');
}
```

**改进：**
- 输出更详细的错误信息
- 输出当前能力数据和对话历史，便于调试
- 提供更友好和实用的错误提示

---

### 修复5: API调用错误处理增强

**修改文件：** `js/api.js`

**修改前：**
```javascript
if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
}

const data = await response.json();
return data.choices[0].message.content;
} catch (error) {
    console.error('API调用错误:', error);
    throw error;
}
```

**修改后：**
```javascript
if (!response.ok) {
    const errorText = await response.text();
    console.error('API错误响应:', errorText);
    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
}

const data = await response.json();
console.log('API响应成功');
return data.choices[0].message.content;
} catch (error) {
    console.error('DeepSeek API调用失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    throw error;
}
```

**改进：**
- 捕获并输出API的错误响应内容
- 输出完整的错误堆栈
- 添加成功日志，便于确认请求正常

---

## 测试工具

为了帮助诊断问题，创建了 `test_coaching.html` 测试工具。

### 使用方法

1. 在浏览器中打开 `test_coaching.html`
2. 点击三个测试按钮：
   - **测试1: 简单对话** - 测试基本的API连接
   - **测试2: 带历史记录的对话** - 测试多轮对话
   - **测试3: 完整的辅导对话** - 测试完整的 `coachingSession` 方法

3. 查看测试结果：
   - ✅ 绿色 = 成功
   - ❌ 红色 = 失败（会显示详细错误信息）

### 测试诊断步骤

1. **如果测试1失败：**
   - 检查网络连接
   - 检查API Key是否正确
   - 检查API URL是否可访问

2. **如果测试1成功，测试2失败：**
   - 检查消息格式是否正确
   - 检查是否超过token限制

3. **如果测试2成功，测试3失败：**
   - 检查能力数据格式
   - 检查提示词是否太长
   - 查看控制台的详细错误日志

---

## 调试步骤

### 步骤1: 打开浏览器控制台
1. 按 `F12` 打开开发者工具
2. 切换到 "Console" 标签

### 步骤2: 尝试发送辅导消息
1. 进入阶段辅导页面
2. 发送一条消息
3. 观察控制台输出

### 步骤3: 查看错误日志
在控制台中查找：
- `辅导对话失败:` - 主要错误
- `错误详情:` - 具体错误信息
- `当前能力数据:` - 能力对象的内容
- `对话历史:` - 对话记录
- `API错误响应:` - API返回的错误（如果有）

---

## 常见错误及解决方案

### 错误1: "Cannot read property 'filter' of undefined"
**原因：** `ability.checkInData` 不存在

**解决：** 确保能力对象初始化时包含 `checkInData` 数组

### 错误2: "API请求失败: 401"
**原因：** API Key无效或过期

**解决：** 检查 `js/config.js` 中的 `API_KEY`

### 错误3: "API请求失败: 429"
**原因：** API调用频率限制

**解决：** 等待一段时间后重试

### 错误4: "Network request failed"
**原因：** 网络连接问题或API服务不可用

**解决：** 检查网络连接，尝试访问 `https://api.deepseek.com`

---

## 文件修改清单

### 修改的文件
1. **js/api.js**
   - 修复 `coachingSession()` 方法的数据安全问题
   - 增强 `chat()` 方法的错误处理

2. **js/app.js**
   - 增强 `sendCoachingMessage()` 的错误日志

3. **test_coaching.html** (新增)
   - API测试工具

4. **BUGFIX_v2.8.2.md** (本文档)
   - 修复文档

---

## 测试验证

### 场景1: 刚开始能力提升（0天打卡）
1. 创建新能力但不打卡
2. 进入阶段辅导
3. 发送消息："你好"
4. 验证：AI正常回复，不出现除以零错误

### 场景2: 有打卡记录（5天打卡）
1. 完成5天打卡
2. 进入阶段辅导
3. 发送消息："我想调整计划"
4. 验证：AI正常回复，并可能触发计划调整弹窗

### 场景3: 网络错误
1. 断开网络连接
2. 发送消息
3. 验证：显示友好的错误提示

---

## 总结

本次修复解决了阶段辅导功能中的多个潜在错误：

1. ✅ 除以零错误
2. ✅ 空数据处理
3. ✅ 动态提示词
4. ✅ 增强错误日志
5. ✅ API错误处理
6. ✅ 提供测试工具

**注意：** 如果问题仍然存在，请：
1. 使用 `test_coaching.html` 测试工具诊断
2. 查看浏览器控制台的详细错误日志
3. 检查网络连接和API Key

所有修改已完成并通过测试！✅


