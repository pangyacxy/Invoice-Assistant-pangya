# 更新记录 v2.9 - AI智能调整计划

## 更新日期
2025-10-24

## 更新概述

本次更新彻底重构了计划调整机制，从"手动弹窗填写"改为"AI智能理解并自动调整"，大幅提升用户体验。

---

## 核心改进

### 原有机制（v2.8）
```
用户："我想调整计划"
  ↓
AI识别意图 → 触发关键词
  ↓
弹出表单 → 用户手动填写天数和原因
  ↓
提交 → 应用调整
```

**问题：**
- 需要用户二次操作（填表单）
- AI无法直接理解具体需求
- 交互不够自然流畅

---

### 新机制（v2.9）
```
用户："我想延长到45天"
  ↓
AI理解需求 → 生成调整指令（JSON）
  ↓
前端自动解析 → 立即应用调整
  ↓
显示确认信息 ✅
```

**优势：**
- ✅ **一次对话完成**：AI直接理解并执行
- ✅ **更自然**：就像和真人教练沟通
- ✅ **更智能**：AI可以理解隐含意图
- ✅ **更快捷**：无需额外操作

---

## 技术实现

### 1. AI提示词优化

**新的指令格式：**
```
[PLAN_ADJUST]{"newTotalDays": 45, "reason": "用户觉得30天时间太紧"}[/PLAN_ADJUST]
```

**提示词示例：**
```javascript
**重要：计划调整规则**
如果用户明确表达想要调整计划（例如："我想延长到45天"、"改成30天吧"、"时间太紧了"等），你需要：

1. 理解用户的具体需求（延长时间、缩短时间、调整内容等）
2. 在回复的【最后】加上调整指令，格式示例：
   [PLAN_ADJUST]{"newTotalDays": 45, "reason": "用户觉得30天时间太紧"}[/PLAN_ADJUST]
3. 不要在正文中提到这个指令标记

**示例1：**
用户："我想把计划延长到45天，30天感觉太紧了"
你的回复："完全理解！45天确实能让你有更充裕的时间来消化每个阶段的内容。我已经帮你调整好了，新计划将从明天开始生效。你觉得这样的节奏会更舒服吗？[PLAN_ADJUST]{"newTotalDays": 45, "reason": "用户觉得30天太紧，需要更多时间消化内容"}[/PLAN_ADJUST]"
```

---

### 2. 前端智能解析

**修改文件：** `js/app.js`

**核心逻辑：**
```javascript
// 检查是否包含计划调整指令
const adjustMatch = response.match(/\[PLAN_ADJUST\]([\s\S]*?)\[\/PLAN_ADJUST\]/);

if (adjustMatch) {
    // 提取纯文本回复（移除指令部分）
    const cleanResponse = response.replace(/\[PLAN_ADJUST\][\s\S]*?\[\/PLAN_ADJUST\]/g, '').trim();
    this.addCoachingMessage('ai', cleanResponse);
    
    // 解析调整指令
    try {
        const adjustData = JSON.parse(adjustMatch[1].trim());
        this.applyPlanAdjustmentAuto(adjustData);
    } catch (e) {
        console.error('计划调整指令解析失败:', e);
    }
}
```

**解析步骤：**
1. 使用正则匹配 `[PLAN_ADJUST]...[/PLAN_ADJUST]`
2. 提取JSON内容
3. 移除指令标记，只显示正常对话给用户
4. 自动应用调整

---

### 3. 自动应用调整

**新方法：** `applyPlanAdjustmentAuto(adjustData)`

```javascript
applyPlanAdjustmentAuto(adjustData) {
    const ability = this.abilities.find(a => a.id === this.currentAbilityId);
    if (!ability) return;
    
    const { newTotalDays, reason } = adjustData;
    
    // 验证天数范围
    if (newTotalDays < 21 || newTotalDays > 90) {
        console.error('天数超出范围:', newTotalDays);
        this.addCoachingMessage('system', '❌ 计划调整失败：天数必须在21-90天之间。');
        return;
    }
    
    // 记录调整
    if (!ability.planAdjustments) {
        ability.planAdjustments = [];
    }
    
    const oldDays = ability.totalDays || 21;
    
    ability.planAdjustments.push({
        date: new Date().toISOString(),
        oldDays: oldDays,
        newDays: newTotalDays,
        reason: reason || 'AI自动调整',
        effectiveDate: new Date(Date.now() + 86400000).toISOString(), // 明天生效
        appliedBy: 'ai'
    });
    
    // 更新计划（明天生效，这里只记录）
    ability.pendingTotalDays = newTotalDays;
    
    // 标记当前辅导会话已调整方案
    if (this.currentCoachingSession) {
        this.currentCoachingSession.planAdjusted = true;
    }
    
    this.saveAbilities();
    
    // 显示确认信息
    this.addCoachingMessage('system', `✅ 计划已调整！总天数：${oldDays}天 → ${newTotalDays}天。新计划将从明天开始生效。`);
}
```

**特点：**
- ✅ 自动验证天数范围（21-90天）
- ✅ 详细记录调整历史
- ✅ 标记调整来源（`appliedBy: 'ai'`）
- ✅ 明天生效机制
- ✅ 友好的确认提示

---

## 使用示例

### 示例1：明确延长时间
```
👤 用户："我想把计划延长到45天，30天感觉太紧了"
  ↓
🤖 AI："完全理解！45天确实能让你有更充裕的时间来消化每个阶段的内容。
       我已经帮你调整好了，新计划将从明天开始生效。你觉得这样的节奏会更舒服吗？"
  ↓
💻 系统："✅ 计划已调整！总天数：30天 → 45天。新计划将从明天开始生效。"
```

### 示例2：缩短时间
```
👤 用户："时间太长了，我想快点完成，改成25天"
  ↓
🤖 AI："看得出你很有动力！25天的话节奏会比较紧凑，但如果你能保证每天的练习质量，
       完全可以。已经帮你调整了，加油！"
  ↓
💻 系统："✅ 计划已调整！总天数：30天 → 25天。新计划将从明天开始生效。"
```

### 示例3：模糊表达（AI智能理解）
```
👤 用户："感觉进度有点赶，能不能宽裕一些？"
  ↓
🤖 AI："我理解你的感受。根据你的情况，我建议可以延长到40天，这样每个阶段都能有更充足
       的时间练习。已经帮你调整了，从明天开始生效。感觉怎么样？"
  ↓
💻 系统："✅ 计划已调整！总天数：30天 → 40天。新计划将从明天开始生效。"
```

---

## 数据结构

### planAdjustments 数组
```javascript
{
    date: "2025-10-24T10:30:00.000Z",      // 调整时间
    oldDays: 30,                            // 原天数
    newDays: 45,                            // 新天数
    reason: "用户觉得30天太紧",             // 调整原因
    effectiveDate: "2025-10-25T00:00:00.000Z",  // 生效时间
    appliedBy: "ai"                         // 调整方式：ai自动 / manual手动
}
```

### coachingSession 对象
```javascript
{
    date: "2025-10-24T10:30:00.000Z",
    messages: [...],
    summary: "讨论了学习进度调整",
    planAdjusted: true  // 新增：标记本次会话是否调整了方案
}
```

---

## 兼容性处理

### 保留手动调整功能
虽然现在主要使用AI智能调整，但仍保留了手动调整功能（通过弹窗）作为备选方案。

**触发方式：**
- 点击"🔧 调整方案"按钮
- 旧的 `showPlanAdjustmentDialog()` 方法仍然可用

---

## 对比总结

| 功能 | v2.8 手动调整 | v2.9 AI智能调整 |
|------|--------------|----------------|
| **操作步骤** | 2步（对话+填表） | 1步（对话） |
| **用户体验** | 需要手动填写 | 自动完成 |
| **交互方式** | 弹窗表单 | 自然对话 |
| **AI理解** | 仅识别意图 | 完整理解需求 |
| **灵活性** | 固定格式 | 自由表达 |
| **效率** | 中等 | 高 |

---

## 测试验证

### 测试场景1：明确数字
1. 进入阶段辅导
2. 输入："改成40天"
3. 验证：AI回复 + 系统确认 + 调整生效

### 测试场景2：模糊意图
1. 输入："时间太紧了"
2. 验证：AI理解并提出具体方案
3. 再输入确认
4. 验证：调整生效

### 测试场景3：超出范围
1. 输入："改成15天"（小于21）
2. 验证：显示错误提示

### 测试场景4：仅抱怨不调整
1. 输入："感觉有点难"
2. 验证：AI回复但不触发调整

---

## 注意事项

### 1. AI响应格式
- 指令必须在回复的**最后**
- JSON格式必须正确（无多余逗号）
- 指令标记不会显示给用户

### 2. 天数限制
- 最少：21天
- 最多：90天
- 超出范围会显示错误

### 3. 生效时间
- 所有调整都是**明天生效**
- 今天的任务不受影响

### 4. 调整记录
- 所有调整都会被完整记录
- 包括时间、原因、来源等

---

## 文件修改清单

### 修改的文件
1. **js/api.js**
   - 重构 `coachingSession()` 提示词
   - 新的指令格式和示例

2. **js/app.js**
   - 修改 `sendCoachingMessage()` - 智能解析AI响应
   - 新增 `applyPlanAdjustmentAuto()` - 自动应用调整
   - 修改 `requestPlanAdjustment()` - 更新提示文字

3. **UPDATE_v2.9_AI_ADJUSTMENT.md** (本文档)
   - 详细的更新说明

---

## 未来优化建议

1. **更智能的意图理解**
   - 识别更多隐含意图
   - 支持多轮对话确认

2. **调整历史可视化**
   - 显示调整时间线
   - 对比调整前后效果

3. **AI主动建议**
   - 根据打卡情况主动建议调整
   - 智能推荐最佳学习节奏

4. **批量调整**
   - 同时调整多个能力
   - 统一管理所有计划

---

## 总结

本次更新（v2.9）是一次重大的用户体验升级：

- ✅ **从手动到智能**：AI理解并自动执行
- ✅ **从复杂到简单**：一句话完成调整
- ✅ **从机械到自然**：像和教练对话一样流畅
- ✅ **从被动到主动**：AI能理解隐含意图

所有功能已实现并通过测试，无linter错误！🎉


