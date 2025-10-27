# 项目结构说明

完整的「能力养成所」项目文件结构和说明。

## 📁 目录树

```
dataapp/
│
├── index.html              # 🏠 主HTML文件（应用入口）
│
├── css/
│   └── style.css          # 🎨 全局样式文件
│
├── js/
│   ├── config.js          # ⚙️ 配置文件（API密钥等）
│   ├── api.js             # 🤖 DeepSeek API封装
│   ├── abilities.js       # 📚 能力数据模型
│   └── app.js             # 🚀 主应用逻辑
│
├── README.md              # 📖 项目介绍
├── START_HERE.md          # ⚡ 快速开始指南
├── USAGE.md               # 📝 详细使用说明
├── PROMPTS.md             # 🎯 AI提示词库
├── DEPLOY.md              # 🌐 部署指南
├── CHANGELOG.md           # 📅 更新日志
└── PROJECT_STRUCTURE.md   # 📁 本文件（项目结构）
```

## 📄 文件详解

### 核心文件

#### `index.html`
**作用**：应用的主页面，包含所有页面结构

**包含的页面：**
- 欢迎页（welcomePage）
- 身份选择页（identityPage）
- AI访谈页（interviewPage）
- 能力画像报告页（reportPage）
- 成长路径页（pathPage）
- 今日任务页（taskPage）
  - 任务视图（taskView）
  - 时间轴视图（timelineView）
  - 社区视图（communityView）
- 成就页（achievementPage）
- Loading遮罩（loadingOverlay）

**关键元素：**
```html
<!-- 页面容器 -->
<div id="welcomePage" class="page active">
  <!-- 页面内容 -->
</div>

<!-- 聊天容器 -->
<div id="chatContainer" class="chat-container">
  <!-- 动态插入聊天消息 -->
</div>

<!-- 输入区域 -->
<textarea id="userInput"></textarea>
<button onclick="app.sendMessage()">发送</button>
```

**依赖关系：**
- CSS: `css/style.css`
- JS: `js/config.js`, `js/api.js`, `js/abilities.js`, `js/app.js`

---

#### `css/style.css`
**作用**：全局样式定义，包含所有页面和组件的样式

**主要部分：**

1. **CSS变量定义**（`:root`）
```css
--primary-color: #6366f1;      /* 主色调 */
--secondary-color: #ec4899;    /* 辅助色 */
--background: #f8fafc;         /* 背景色 */
--card-bg: #ffffff;            /* 卡片背景 */
--text-primary: #1e293b;       /* 主文字色 */
```

2. **全局样式**
- 重置样式
- 字体设置
- 响应式布局

3. **页面系统**
- `.page` 基类
- `.page.active` 显示当前页面
- 页面切换动画

4. **组件样式**
- 按钮（primary-btn, secondary-btn）
- 卡片（value-card, identity-card, chapter-card等）
- 消息（message.ai, message.user）
- 时间轴（timeline, day-dot）
- 社区（check-in-card, user-avatar）

5. **动画**
```css
@keyframes fadeIn { ... }
@keyframes bounce { ... }
@keyframes spin { ... }
@keyframes celebrate { ... }
```

6. **响应式**
```css
@media (max-width: 480px) {
  /* 移动端适配 */
}
```

---

#### `js/config.js`
**作用**：配置文件，集中管理全局配置

**配置项：**

```javascript
const CONFIG = {
    // DeepSeek API配置
    API_KEY: 'sk-74d34c223d944cc69fd90150b53ef464',
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    MODEL: 'deepseek-chat',
    
    // 应用配置
    APP_NAME: '能力养成所',
    TOTAL_DAYS: 21,
    CHAPTERS: 3,
    DAYS_PER_CHAPTER: 7,
    
    // 本地存储键
    STORAGE_KEYS: {
        USER_DATA: 'ability_user_data',
        INTERVIEW_HISTORY: 'ability_interview_history',
        CURRENT_PATH: 'ability_current_path',
        CHECK_IN_DATA: 'ability_checkin_data',
        PROGRESS: 'ability_progress'
    }
};
```

**使用方式：**
```javascript
// 其他文件中直接使用
const apiKey = CONFIG.API_KEY;
const totalDays = CONFIG.TOTAL_DAYS;
```

---

#### `js/api.js`
**作用**：DeepSeek API的完整封装

**主要类：**

```javascript
class DeepSeekAPI {
    constructor(apiKey)
    async chat(messages, temperature)
    async interview(round, userAnswer, identity, history)
    async generateReport(identity, interviewHistory)
    async generatePath(abilityName, userLevel)
    async evaluateTask(taskDescription, userSubmission)
    async generateAchievementReview(abilityName, checkInData)
}
```

**方法说明：**

1. **`chat()`** - 基础对话方法
   - 参数：messages（消息数组）、temperature（创意度）
   - 返回：AI回复内容

2. **`interview()`** - 访谈对话
   - 处理访谈流程
   - 判断是否结束（INTERVIEW_COMPLETE）
   - 返回下一个问题

3. **`generateReport()`** - 生成报告
   - 分析访谈历史
   - 输出JSON格式报告
   - 包含能力推荐

4. **`generatePath()`** - 生成路径
   - 设计21天任务
   - 输出JSON格式路径
   - 包含3章×7天任务

5. **`evaluateTask()`** - 评估任务
   - 评分（0-100）
   - 具体反馈
   - 改进建议

6. **`generateAchievementReview()`** - 成就评语
   - 回顾成长历程
   - 温暖的评语
   - 鼓励继续成长

**全局实例：**
```javascript
const deepseekAPI = new DeepSeekAPI(CONFIG.API_KEY);
```

---

#### `js/abilities.js`
**作用**：能力数据模型定义

**数据结构：**

```javascript
const ABILITIES_DATA = {
    "口述表达": {
        name: "口述表达",
        type: "软实力",
        icon: "🗣️",
        totalDays: 21,
        description: "...",
        chapters: [
            {
                chapterNum: 1,
                chapterName: "...",
                days: 7,
                goal: "...",
                dailyTasks: ["任务1", "任务2", ...],
                exam: "..."
            },
            // 章节2、3
        ]
    },
    // 其他能力...
};
```

**工具函数：**

```javascript
// 获取能力数据
getAbilityData(abilityName)

// 获取所有能力列表
getAllAbilities()

// 获取特定天的任务
getDayTask(abilityName, day)
```

**已实现的能力：**
- 口述表达（软实力）
- 归纳总结（软实力）
- 时间管理（软实力）
- Python基础（硬实力）
- Excel数据分析（硬实力）

---

#### `js/app.js`
**作用**：主应用逻辑，核心控制器

**主要类：**

```javascript
class AbilityApp {
    constructor()
    init()
    
    // 页面导航
    showPage(pageId)
    showLoading(show, text)
    
    // 身份选择
    showIdentitySelection()
    selectIdentity(identity)
    
    // AI访谈
    startInterview()
    addMessage(role, content)
    sendMessage()
    generateReport()
    displayReport(report)
    
    // 路径规划
    acceptPlan()
    customizePlan()
    selectAbility(abilityName)
    displayPath(pathData)
    startJourney()
    
    // 任务系统
    loadTaskPage()
    renderTimeline()
    showTaskView()
    showTimelineView()
    showCommunityView()
    uploadTask()
    displayAIFeedback(evaluation)
    checkIn()
    
    // 成就系统
    completeChallenge()
    generateAchievement()
    displayAchievement(review)
    shareCertificate()
    startNewChallenge()
    
    // 社区
    loadCommunityFeed()
    
    // 数据管理
    loadUserData()
    saveUserData()
    initCheckInData()
    loadCheckInData()
    saveCheckInData()
}
```

**全局实例：**
```javascript
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new AbilityApp();
});
```

**数据流：**
```
用户操作 → app方法 → API调用 → 更新数据 → 更新UI
```

---

### 文档文件

#### `README.md`
- 项目介绍
- 核心特性
- 快速开始
- 技术栈
- 功能列表

#### `START_HERE.md`
- 30秒快速启动
- 移动端使用
- 核心功能演示
- 重要提示

#### `USAGE.md`
- 5分钟上手指南
- 详细功能说明
- 常见问题
- 最佳实践
- 数据结构说明

#### `PROMPTS.md`
- 所有AI提示词
- 优化建议
- 自定义方法
- A/B测试技巧

#### `DEPLOY.md`
- 多种部署方式
- 详细步骤
- 性能优化
- 安全建议
- 常见问题

#### `CHANGELOG.md`
- 版本历史
- 功能列表
- 未来规划
- 已知问题

---

## 🔄 数据流图

```
┌─────────────┐
│  用户访问   │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│   index.html加载    │
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  加载CSS和JS文件    │
│  config → api       │
│  → abilities → app  │
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  初始化AbilityApp   │
│  检查用户状态       │
└──────┬──────────────┘
       │
       v
    ┌──┴──┐
    │判断 │
    └──┬──┘
       │
   ┌───┴───┬─────────┬─────────┐
   v       v         v         v
 新用户  已访谈   已选择   已完成
   │       │       能力      21天
   v       v         v         v
欢迎页  报告页  任务页  成就页
```

## 📊 页面流程

```
欢迎页
  ↓ 点击"开始探索"
身份选择页
  ↓ 选择身份
AI访谈页（5-10轮对话）
  ↓ 访谈完成
能力画像报告页
  ↓ 接受计划
成长路径页
  ↓ 开始旅程
今日任务页
  ├→ 任务视图（完成打卡）
  ├→ 时间轴视图（查看进度）
  └→ 社区视图（互动）
  ↓ 坚持21天
成就页
  └→ 开启新挑战（回到报告页）
```

## 💾 数据存储

### LocalStorage结构

```
ability_user_data
├── identity: "worker" | "student"
├── onboarded: boolean
├── interviewCompleted: boolean
├── report: {
│     identity, mainScenario, corePain,
│     emotion, recommendedAbilities[], summary
│   }
├── currentAbility: string
└── currentDay: number

ability_checkin_data
└── [
      {
        day: number,
        completed: boolean,
        date: string,
        score: number
      },
      ...
    ]
```

## 🎯 关键交互

### 访谈流程
```javascript
1. 用户输入 → app.sendMessage()
2. 添加消息 → app.addMessage('user', message)
3. 调用API → deepseekAPI.interview()
4. 收到回复 → app.addMessage('ai', response)
5. 判断结束 → response.includes('INTERVIEW_COMPLETE')
6. 生成报告 → app.generateReport()
```

### 打卡流程
```javascript
1. 上传任务 → app.uploadTask()
2. AI评估 → deepseekAPI.evaluateTask()
3. 显示反馈 → app.displayAIFeedback()
4. 启用打卡 → document.getElementById('checkInBtn').disabled = false
5. 完成打卡 → app.checkIn()
6. 更新数据 → saveCheckInData()
7. 下一天 → userData.currentDay++
```

## 🔧 扩展指南

### 添加新能力

在 `js/abilities.js` 中添加：
```javascript
ABILITIES_DATA["新能力名"] = {
    name: "新能力名",
    type: "软实力/硬实力",
    icon: "emoji",
    totalDays: 21,
    description: "一句话描述",
    chapters: [
        // 3个章节...
    ]
};
```

### 添加新页面

1. 在 `index.html` 中添加页面结构
2. 在 `css/style.css` 中添加样式
3. 在 `js/app.js` 中添加页面逻辑
4. 使用 `app.showPage('newPageId')` 导航

### 修改AI行为

编辑 `js/api.js` 中对应方法的提示词，参考 `PROMPTS.md`

---

## 📱 技术选型说明

### 为什么用原生JavaScript？
- ✅ 零依赖，快速启动
- ✅ 体积小，加载快
- ✅ 易部署，兼容性好
- ✅ 学习曲线平缓

### 为什么用LocalStorage？
- ✅ 简单易用
- ✅ 无需后端
- ✅ 适合单机应用
- ✅ 5MB容量足够

### 为什么选DeepSeek？
- ✅ API简单易用
- ✅ 中文能力强
- ✅ 价格实惠
- ✅ 响应速度快

---

## 🚀 性能优化

### 已实现
- CSS动画使用transform（GPU加速）
- 事件代理减少监听器
- 按需渲染DOM
- 防抖/节流（部分场景）

### 可优化
- 代码压缩
- 图片懒加载
- 虚拟滚动
- Service Worker缓存

---

**这就是完整的项目结构！** 🎉

