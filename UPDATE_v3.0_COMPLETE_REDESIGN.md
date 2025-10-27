# 更新记录 v3.0 - 完整重新设计

## 更新日期
2025-10-24

## 重大更新概述

本次是一个全面的重新设计，涵盖了计划调整流程、UI布局、用户体验等多个方面。

---

## 核心改进

### 1. 辅导页面全新布局 🎨

**左右分栏设计：**
- ✅ **左侧**：当前方案预览
  - 显示总天数、当前进度（如 3/32）
  - 显示所有阶段和任务
  - "讨论修改方案"按钮
  
- ✅ **右侧**：AI对话区域
  - 对话历史
  - 输入框
  - 发送按钮

**优势：**
- 方案和对话同时可见
- 修改时可以实时对比
- 更直观的交互体验

---

### 2. 计划调整全新流程 🔄

**旧流程（v2.x）：**
```
用户："改成40天"
  ↓
AI 直接执行
  ↓
完成
```

**新流程（v3.0）：**
```
用户："我想调整计划"
  ↓
AI 询问："哪里有问题？想怎么调整？"
  ↓
用户详细说明
  ↓
AI 生成新方案预览
  ↓
用户确认："看起来不错" / "再调整一下"
  ↓
AI 应用新方案（保持当前进度）
```

**关键改进：**
1. ✅ AI不再直接修改
2. ✅ 先询问、后建议、再确认
3. ✅ 用户有充分的决策权
4. ✅ 可以多轮调整直到满意

---

### 3. 保持当前进度 📊

**重要变化：**

**错误示例（旧版）：**
```
当前：第3天 / 共21天
修改为32天后：第1天 / 共32天  ❌ 进度重置了！
```

**正确示例（新版）：**
```
当前：第3天 / 共21天
修改为32天后：第3天 / 共32天  ✅ 进度保持！
```

**实现逻辑：**
```javascript
// 修改方案时
ability.totalDays = newTotalDays;  // 更新总天数
ability.currentDay = currentDay;   // 保持当前天数不变
```

---

### 4. 全局数据同步 🔄

**修改方案后，所有位置同步更新：**

1. ✅ **总表（abilities数组）**
   - `totalDays` 更新
   - `path.chapters` 重新生成

2. ✅ **主页**
   - 进度显示更新
   - 状态文本更新

3. ✅ **个人中心**
   - 能力卡片更新
   - 统计数据更新

4. ✅ **辅导页面**
   - 左侧方案预览更新
   - 进度信息更新

5. ✅ **任务页面**
   - 总天数更新
   - 时间轴更新

---

### 5. AI提示词重新设计 💬

**新的对话流程提示：**

```javascript
**计划调整对话流程（重要）：**

阶段1：了解需求
- 用户提出想调整计划
- 你要询问：
  1. 目前遇到什么问题？（太快/太慢/内容不合适）
  2. 具体哪些方面需要调整？
  3. 理想的方案是什么样的？

阶段2：生成方案
- 基于用户反馈，生成新方案
- 使用指令：[PROPOSE_PLAN]{...}[/PROPOSE_PLAN]
- 向用户说明新方案的特点和改进之处

阶段3：确认应用
- 等待用户确认
- 用户满意后，使用：[CONFIRM_PLAN][/CONFIRM_PLAN]
- 如果用户不满意，继续调整

重要规则：
1. 绝对不能跳过询问环节
2. 方案必须先展示，再应用
3. 保持当前进度（currentDay不变）
4. 至少进行2轮对话再生成方案
```

---

### 6. 删除辅导记录功能 🗑️

**位置：** 辅导对话页面头部

**功能：**
- 点击"🗑️ 删除记录"
- 弹出确认对话框
- 确认后删除当前辅导会话
- 返回辅导列表

**确认弹窗：**
```
⚠️ 确认删除此辅导记录？

删除后，本次辅导的所有对话记录将被永久删除。

[取消] [确认删除]
```

---

### 7. 昵称修改功能 ✏️

**位置：** 个人中心页面

**实现：**
1. 昵称旁边显示"✏️ 编辑"按钮
2. 点击后弹出输入框
3. 输入新昵称
4. 确认后更新所有显示昵称的位置

**更新位置：**
- ✅ 主页标题
- ✅ 个人中心
- ✅ 辅导对话中的称呼

---

### 8. 主页昵称显示 👤

**位置：** 主页顶部

**修改前：**
```html
<h2 id="homeUserName">我的成长空间</h2>
```

**修改后：**
```html
<h2 id="homeUserName">你好，[昵称]！</h2>
```

---

## 技术实现

### 1. HTML结构

#### 辅导页面新布局
```html
<div class="coaching-split-layout">
    <!-- 左侧：方案预览 -->
    <div class="coaching-plan-panel">
        <div class="plan-panel-header">
            <h3>📋 当前方案</h3>
            <div class="plan-progress">
                第3天 / 共32天
            </div>
        </div>
        <div class="plan-panel-content">
            <!-- 方案详情 -->
        </div>
    </div>

    <!-- 右侧：对话 -->
    <div class="coaching-chat-panel">
        <div class="coaching-messages">
            <!-- 消息列表 -->
        </div>
        <div class="coaching-input-section">
            <!-- 输入框 -->
        </div>
    </div>
</div>
```

---

### 2. CSS样式

```css
.coaching-split-layout {
    display: flex;
    gap: 20px;
    height: calc(100vh - 200px);
}

.coaching-plan-panel {
    width: 400px;
    flex-shrink: 0;
    background: var(--card-background);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
}

.coaching-chat-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--card-background);
    border-radius: var(--radius-lg);
}
```

---

### 3. 核心方法

#### displayCurrentPlan()
```javascript
displayCurrentPlan() {
    const ability = this.abilities.find(a => a.id === this.currentAbilityId);
    const content = document.getElementById('planPanelContent');
    
    const currentDay = ability.currentDay || 1;
    const totalDays = ability.totalDays || 21;
    
    let html = `
        <div class="plan-summary">
            <div class="plan-stat">
                <span class="stat-label">当前进度</span>
                <span class="stat-value">${currentDay}/${totalDays}天</span>
            </div>
        </div>
        <div class="plan-phases">
            <!-- 阶段列表 -->
        </div>
    `;
    
    content.innerHTML = html;
}
```

#### requestPlanChange()
```javascript
requestPlanChange() {
    const input = document.getElementById('coachingInput');
    input.value = '我想调整一下学习计划';
    input.focus();
    
    this.addCoachingMessage('system', 
        '💡 提示：告诉AI你遇到了什么问题，想要如何调整。AI会根据你的需求生成新方案供你确认。');
}
```

#### applyNewPlanKeepProgress()
```javascript
applyNewPlanKeepProgress(planData) {
    const ability = this.abilities.find(a => a.id === this.currentAbilityId);
    const currentDay = ability.currentDay; // 保存当前进度
    
    // 应用新计划
    ability.totalDays = planData.totalDays;
    ability.path = this.generatePathFromPhases(planData.phases);
    
    // 恢复当前进度
    ability.currentDay = currentDay;
    
    // 更新所有显示
    this.refreshAllViews();
}
```

#### refreshAllViews()
```javascript
refreshAllViews() {
    // 更新左侧方案预览
    this.displayCurrentPlan();
    
    // 更新进度信息
    this.updateProgressInfo();
    
    // 重新加载主页（如果需要）
    if (document.getElementById('homePage').classList.contains('active')) {
        this.loadHomePage();
    }
}
```

---

### 4. 新指令格式

#### PROPOSE_PLAN - 提议方案（不立即应用）
```
[PROPOSE_PLAN]{
  "totalDays": 32,
  "phases": [...]
}[/PROPOSE_PLAN]
```

#### CONFIRM_PLAN - 确认应用方案
```
[CONFIRM_PLAN][/CONFIRM_PLAN]
```

**流程：**
1. AI生成方案 → `PROPOSE_PLAN`
2. 显示在左侧预览
3. 用户确认满意
4. AI发送 → `CONFIRM_PLAN`
5. 正式应用到数据

---

## 数据结构

### ability对象新增字段

```javascript
{
    currentDay: 3,              // 当前第几天（保持不变）
    totalDays: 32,              // 总天数（可修改）
    
    proposedPlan: {             // 新增：提议的方案（未应用）
        totalDays: 40,
        phases: [...]
    },
    
    planHistory: [              // 新增：方案修改历史
        {
            date: "2025-10-24",
            type: "adjust",
            oldDays: 21,
            newDays: 32,
            reason: "用户觉得节奏太快"
        }
    ]
}
```

---

## 用户体验流程示例

### 完整的计划调整对话

```
👤 用户："我想调整一下学习计划"

🤖 AI："好的！我先了解一下情况：
      1. 你觉得现在的计划有什么问题吗？
      2. 是节奏太快、太慢，还是内容不太合适？"

👤 用户："节奏太快了，感觉每天的任务完成得很仓促"

🤖 AI："我理解你的感受。那你觉得：
      1. 希望延长到多少天会比较合适？
      2. 想在哪个阶段多花点时间？"

👤 用户："可能35-40天吧，主要是第二阶段需要更多时间"

🤖 AI："好的！根据你的反馈，我设计了一个新方案：

      总天数：38天（从目前的21天延长）
      当前进度：保持在第3天
      
      第一阶段（12天）：基础夯实
      第二阶段（18天）：深入练习 ⬅️ 重点加强
      第三阶段（8天）：综合提升
      
      这样的安排怎么样？"
      [PROPOSE_PLAN]{...}[/PROPOSE_PLAN]

💻 系统：（左侧显示新方案预览）

👤 用户："看起来不错，就按这个来吧"

🤖 AI："太好了！新方案已经应用，从明天开始生效。
      记住，学习不是赶进度，而是真正吸收知识。加油！"
      [CONFIRM_PLAN][/CONFIRM_PLAN]

💻 系统："✅ 方案已更新！
         总天数：21天 → 38天
         当前进度：第3天 / 共38天"
```

---

## 文件修改清单

### 修改的文件

1. **index.html**
   - 辅导页面左右分栏布局
   - 删除记录按钮
   - 主页昵称显示
   - 个人中心昵称编辑

2. **css/style.css**
   - 左右分栏样式
   - 方案预览面板样式
   - 删除按钮样式
   - 昵称编辑样式

3. **js/app.js**
   - `displayCurrentPlan()` - 显示方案预览
   - `requestPlanChange()` - 请求修改方案
   - `applyProposedPlan()` - 应用提议的方案
   - `confirmDeleteCoachingSession()` - 删除确认
   - `editNickname()` - 编辑昵称
   - `refreshAllViews()` - 刷新所有视图

4. **js/api.js**
   - 更新 `coachingSession()` 提示词
   - 新增方案提议和确认机制

5. **UPDATE_v3.0_COMPLETE_REDESIGN.md** (本文档)

---

## 测试场景

### 场景1：完整的计划调整流程
1. 进入辅导页面
2. 左侧显示当前方案（如 3/21天）
3. 点击"讨论修改方案"
4. 与AI对话，说明需求
5. AI询问详情
6. AI生成新方案，左侧预览更新
7. 确认满意
8. AI应用方案
9. 验证：进度显示为 3/38天（保持currentDay）

### 场景2：删除辅导记录
1. 在辅导页面点击"删除记录"
2. 弹出确认对话框
3. 点击"确认删除"
4. 返回辅导列表
5. 验证：记录已删除

### 场景3：修改昵称
1. 进入个人中心
2. 点击昵称旁的"✏️ 编辑"
3. 输入新昵称
4. 确认
5. 验证：主页、个人中心、辅导对话都已更新

---

## 注意事项

1. ✅ **进度保持**：无论如何修改方案，currentDay不变
2. ✅ **多轮对话**：AI必须先询问，再建议，最后确认
3. ✅ **全局同步**：修改后所有位置立即更新
4. ✅ **二次确认**：删除操作必须确认
5. ✅ **响应式**：左右分栏在移动端自动变为上下布局

---

## 总结

本次更新（v3.0）是一次全面的重新设计：

- ✅ **更直观的UI**：左右分栏，方案和对话同时可见
- ✅ **更智能的交互**：AI先问后答，充分了解需求
- ✅ **更安全的修改**：提议→确认→应用，避免误操作
- ✅ **更完整的功能**：删除记录、编辑昵称、全局同步
- ✅ **更好的体验**：保持进度、实时预览、二次确认

这是一个质的飞跃！🚀


