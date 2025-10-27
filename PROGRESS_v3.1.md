# 修复进度 v3.1

## ⏱️ 当前时间
正在进行中...

## ✅ 已完成

### 1. 数据源统一 ✅
- ✅ `loadTaskPage()` - 从 `ability.path.chapters` 读取任务
- ✅ `renderTimeline()` - 使用 `ability.totalDays` 而不是固定21天
- ✅ 添加 `getCurrentDayInfo()` - 从动态数据计算当前阶段
- ✅ 添加 `getTaskForDay()` - 从动态数据获取任务
- ✅ 添加 `getChapterGoal()` - 从动态数据获取目标

**效果：**
```
修改方案：21天 → 40天
  ↓
保存到：ability.totalDays = 40
  ↓
主页卡片：✅ 显示第3天 / 40天
任务页面：✅ 显示第3天 / 40天
时间轴：✅ 显示40个点
```

### 2. HTML结构重构 ✅
- ✅ 辅导列表页：独立横栏 + 删除按钮
- ✅ 辅导对话页：三栏布局（当前方案 | 新方案 | 对话）

**新布局预览：**
```
┌───────────────┬──────────────┬────────────────┐
│  📋 当前方案   │  🆕 新方案    │   💬 对话区域   │
│               │  (条件显示)  │                │
│  第3天/21天   │  第3天/40天  │   AI: ...      │
│  阶段1...     │  阶段1...    │                │
│  阶段2...     │  阶段2...    │   你: ...      │
│               │              │                │
│               │  [✅确认]     │   [发送]       │
│               │  [❌继续讨论] │                │
└───────────────┴──────────────┴────────────────┘
```

## 🔄 进行中

### 3. CSS样式更新
- 🔄 三栏布局样式
- 🔄 辅导记录横栏样式
- 🔄 方案对比样式

### 4. JS方法重写
- 🔄 `displayCurrentPlan()` - 显示在currentPlanContent
- 🔄 `showProposedPlan()` - 显示在newPlanContent并显示中栏
- 🔄 `confirmNewPlan()` - 确认新方案
- 🔄 `cancelNewPlan()` - 隐藏中栏继续讨论
- 🔄 `renderCoachingCards()` - 带复选框的列表
- 🔄 `deleteSelectedCoaching()` - 删除选中记录

## ⏳ 待完成

### 5. AI增强
- ⏳ 更新提示词：支持修改任务节点
- ⏳ 多计划识别和选择流程

### 6. 测试
- ⏳ 全面测试数据同步
- ⏳ 测试方案对比显示
- ⏳ 测试任务节点修改

---

## 关键改进

### Before（v3.0）
```javascript
// 错误：从静态配置读取
getDayTask(ability.name, day)  // config.js固定数据
CONFIG.TOTAL_DAYS  // 固定21天
```

### After（v3.1）
```javascript
// 正确：从动态数据读取
ability.path.chapters  // 用户可修改的方案
ability.totalDays  // AI可调整的天数
ability.currentDay  // 保持不变的进度
```

---

## 预期效果

修改后，用户在辅导页面调整方案：
1. AI询问需求（2-3轮）
2. AI生成新方案（包含新的任务节点）
3. 中间栏显示新方案预览
4. 用户左右对比当前方案和新方案
5. 点击"✅ 确认使用新方案"
6. 所有页面立即同步更新

---

继续实施中...


