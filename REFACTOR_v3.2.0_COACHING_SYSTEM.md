# 🔧 重构 v3.2.0 - 阶段辅导系统 & 首页删除计划

## 更新时间
2025-10-27

## 用户需求

"阶段辅导删除辅导记录，改为现有多少个计划则多少个辅导，并要标注。首页的成长计划给删除的选择，也需要弹窗二次确认。"

### 需求拆解

#### 1. 重构阶段辅导系统
**之前的设计：**
- 一个ability → 多个coachingSessions（辅导历史记录）
- 可以新建、删除、查看历史辅导记录
- 复杂的辅导记录管理

**新的设计：**
- 一个ability → 一个当前辅导会话（ability.coachingMessages）
- 没有历史记录，只有当前正在进行的辅导
- 辅导列表显示所有正在进行的计划
- 点击某个计划进入其辅导对话

#### 2. 辅导标注
- 辅导要显示是哪个计划的辅导
- 计划名称要清晰标注

#### 3. 首页删除计划
- 首页成长计划卡片添加删除按钮
- 删除前弹窗二次确认
- 删除后刷新首页

---

## 架构对比

### 之前的数据结构

```javascript
ability: {
    id: 1234567890,
    name: "Python编程",
    coachingSessions: [  ← 多个辅导历史
        {
            id: 111111,
            date: "2025-10-20",
            messages: [...],
            planAdjusted: false,
            summary: "..."
        },
        {
            id: 222222,
            date: "2025-10-22",
            messages: [...],
            planAdjusted: true,
            summary: "..."
        }
    ]
}
```

### 现在的数据结构

```javascript
ability: {
    id: 1234567890,
    name: "Python编程",
    coachingMessages: [  ← 当前辅导的消息
        {
            role: "assistant",
            content: "你好，我注意到你的学习进度..."
        },
        {
            role: "user",
            content: "是的，我觉得有点困难"
        }
    ]
}
```

**变更说明：**
- 删除`coachingSessions`数组
- 添加`coachingMessages`数组（当前辅导的对话历史）
- 不保存历史辅导记录

---

## 新的阶段辅导流程

### 辅导列表页面

```
┌─────────────────────────────────┐
│      阶段辅导 - 全部计划        │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐ │
│  │ Python编程      [进行中]    │ │
│  │ ▬▬▬▬▬▬▬▬▬▬  ░░░ 65%       │ │
│  │ 第 13 / 20 天               │ │
│  │ 💬 25条对话                 │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 英语口语        [未开始]    │ │
│  │ ▬▬▬░░░░░░░░ 30%            │ │
│  │ 第 6 / 21 天                │ │
│  │ 点击开始辅导对话             │ │
│  └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**特点：**
- 显示所有正在进行的计划（未完成的）
- 每个计划显示进度、状态、对话数量
- 点击某个计划进入其辅导对话
- 有对话记录的显示"进行中"，没有的显示"未开始"

---

### 辅导对话页面

```
┌─────────────────────────────────┐
│  ← 返回    Python编程 - 辅导    │
├─────────────────────────────────┤
│  【进展概览】                   │
│  当前进度：第 13 / 20 天  (65%)  │
│  完成天数：12天                  │
│  平均得分：75分                  │
├─────────────────────────────────┤
│                                 │
│  AI: 你好，我注意到你的学习...  │
│  你: 是的，我觉得有点困难        │
│  AI: 我理解，让我们一起调整...  │
│                                 │
│  [输入框]                       │
│  [发送]                         │
└─────────────────────────────────┘
```

**特点：**
- 标题显示计划名称
- 显示当前计划的进展概览
- 显示对话历史
- 可以调整计划

---

## 核心代码实现

### 1. 新的showCoachingList方法

```javascript
showCoachingList(abilityId) {
    // 如果指定了abilityId，直接进入该计划的辅导
    if (abilityId) {
        this.currentAbilityId = abilityId;
        this.enterCoachingForAbility(abilityId);
        return;
    }
    
    // 否则显示所有计划的辅导列表
    this.showPage('coachingListPage');
    this.renderAllCoachingList();
}
```

**逻辑说明：**
- 如果传入`abilityId`：直接进入该计划的辅导对话
- 如果没传：显示所有计划的辅导列表

---

### 2. renderAllCoachingList方法

```javascript
renderAllCoachingList() {
    const container = document.getElementById('coachingCards');
    
    // 获取所有正在进行的计划
    const activeAbilities = this.abilities.filter(a => !a.completed);
    
    if (activeAbilities.length === 0) {
        container.innerHTML = `
            <div class="empty-coaching">
                <div class="empty-icon">📚</div>
                <p>还没有正在进行的计划</p>
                <p class="empty-hint">先开始一个成长计划吧</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    activeAbilities.forEach(ability => {
        const progress = Math.round((ability.currentDay / ability.totalDays) * 100);
        const hasMessages = ability.coachingMessages && ability.coachingMessages.length > 0;
        const messageCount = hasMessages ? ability.coachingMessages.length : 0;
        
        html += `
            <div class="coaching-plan-card" onclick="app.enterCoachingForAbility(${ability.id})">
                <div class="coaching-plan-header">
                    <h4>${ability.name}</h4>
                    ${hasMessages ? '<span class="coaching-badge">进行中</span>' : '<span class="coaching-badge-new">未开始</span>'}
                </div>
                <div class="coaching-plan-progress">
                    <div class="progress-info">
                        <span>第 ${ability.currentDay} / ${ability.totalDays} 天</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                ${hasMessages ? `
                    <div class="coaching-plan-footer">
                        <span class="coaching-card-messages">💬 ${messageCount}条对话</span>
                    </div>
                ` : `
                    <div class="coaching-plan-footer">
                        <span class="coaching-hint">点击开始辅导对话</span>
                    </div>
                `}
            </div>
        `;
    });
    
    container.innerHTML = html;
}
```

**特点：**
- 只显示未完成的计划（`!a.completed`）
- 显示进度条、状态徽章
- 有对话记录显示"进行中"，否则"未开始"
- 点击卡片进入辅导对话

---

### 3. enterCoachingForAbility方法

```javascript
enterCoachingForAbility(abilityId) {
    this.currentAbilityId = abilityId;
    const ability = this.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    
    // 初始化辅导消息数组
    if (!ability.coachingMessages) {
        ability.coachingMessages = [];
    }
    
    this.showPage('coachingChatPage');
    
    // 显示进展概览
    this.displayProgressOverview(ability);
    
    // 显示辅导对话
    this.renderCoachingChat(ability);
    
    // 如果是第一次进入，AI主动发起对话
    if (ability.coachingMessages.length === 0) {
        this.startCoachingConversation(ability);
    }
}
```

**逻辑说明：**
1. 找到对应的ability
2. 初始化`coachingMessages`数组
3. 显示辅导对话页面
4. 如果是第一次进入（没有对话记录），AI主动发起对话

---

### 4. renderCoachingChat方法（需修改）

```javascript
renderCoachingChat(ability) {
    const messagesContainer = document.getElementById('coachingMessages');
    
    // 更新页面标题（显示计划名称）
    const coachingTitle = document.querySelector('#coachingChatPage .coaching-title');
    if (coachingTitle) {
        coachingTitle.textContent = `${ability.name} - 辅导`;
    }
    
    // 显示对话历史
    messagesContainer.innerHTML = '';
    
    if (!ability.coachingMessages) {
        ability.coachingMessages = [];
    }
    
    ability.coachingMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `coaching-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = msg.role === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = msg.content;
        
        if (msg.role === 'user') {
            messageDiv.appendChild(content);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
        }
        
        messagesContainer.appendChild(messageDiv);
    });
    
    // 滚动到底部
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}
```

**特点：**
- 显示计划名称在标题
- 显示`ability.coachingMessages`的对话历史
- 自动滚动到底部

---

### 5. sendCoachingMessage方法（需修改）

```javascript
async sendCoachingMessage() {
    const input = document.getElementById('coachingInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const ability = this.abilities.find(a => a.id === this.currentAbilityId);
    if (!ability) return;
    
    // 初始化coachingMessages
    if (!ability.coachingMessages) {
        ability.coachingMessages = [];
    }
    
    // 添加用户消息
    ability.coachingMessages.push({
        role: 'user',
        content: message
    });
    
    // 清空输入框
    input.value = '';
    
    // 显示用户消息
    this.addCoachingMessage('user', message);
    
    // 显示加载状态
    this.showLoading(true, 'AI正在思考...');
    
    try {
        // 调用AI
        const response = await deepseekAPI.coachingSession(
            ability,
            ability.coachingMessages
        );
        
        // 添加AI消息
        ability.coachingMessages.push({
            role: 'assistant',
            content: response
        });
        
        this.saveAbilities();
        
        // 显示AI消息
        this.addCoachingMessage('ai', response);
        
        // 检查是否有方案调整指令
        this.handleCoachingCommands(response, ability);
        
    } catch (error) {
        console.error('辅导对话失败:', error);
        alert('❌ AI响应失败，请稍后重试');
    }
    
    this.showLoading(false);
}
```

**变更说明：**
- 使用`ability.coachingMessages`而不是`session.messages`
- 直接保存到ability对象

---

## 首页删除计划功能

### 1. 首页计划卡片添加删除按钮

```javascript
createAbilityCard(ability) {
    const progress = Math.round((ability.currentDay / ability.totalDays) * 100);
    const dayData = this.getCurrentDayInfo(ability);
    
    const card = document.createElement('div');
    card.className = 'ability-card';
    card.innerHTML = `
        <div class="ability-card-header">
            <h3>${ability.name}</h3>
            <button class="delete-ability-btn" onclick="event.stopPropagation(); app.showDeletePlanDialog(${ability.id})">
                🗑️
            </button>
        </div>
        <div class="ability-progress">
            <div class="progress-info">
                <span>第 ${ability.currentDay} / ${ability.totalDays} 天</span>
                <span>${progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
        </div>
        <div class="ability-footer">
            <button class="primary-btn" onclick="app.loadTaskPage(${ability.id})">
                今日任务
            </button>
        </div>
    `;
    
    return card;
}
```

**变更：**
- 添加删除按钮（`delete-ability-btn`）
- 点击删除按钮触发`showDeletePlanDialog`

---

### 2. 删除确认弹窗

```javascript
showDeletePlanDialog(abilityId) {
    const ability = this.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog-overlay';
    dialog.innerHTML = `
        <div class="custom-dialog delete-plan-dialog">
            <div class="dialog-icon">🗑️</div>
            <h3>删除成长计划</h3>
            <p class="delete-plan-name">${ability.name}</p>
            <p class="dialog-hint">
                确认删除这个成长计划吗？<br>
                删除后将无法恢复：
            </p>
            <ul class="delete-plan-info">
                <li>📅 计划进度：第 ${ability.currentDay} / ${ability.totalDays} 天</li>
                <li>📝 打卡记录：${ability.checkInData?.filter(d => d.completed).length || 0} 天</li>
                <li>💬 辅导记录：${ability.coachingMessages?.length || 0} 条对话</li>
            </ul>
            <div class="dialog-actions">
                <button class="secondary-btn" onclick="app.closeDeletePlanDialog()">
                    取消
                </button>
                <button class="danger-btn" onclick="app.confirmDeletePlan(${abilityId})">
                    确认删除
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
}
```

**特点：**
- 显示计划名称
- 显示计划的进度、打卡记录、辅导记录
- 红色"确认删除"按钮
- 灰色"取消"按钮

---

### 3. 确认删除方法

```javascript
confirmDeletePlan(abilityId) {
    const index = this.abilities.findIndex(a => a.id === abilityId);
    if (index === -1) return;
    
    // 删除计划
    this.abilities.splice(index, 1);
    this.saveAbilities();
    
    // 关闭弹窗
    this.closeDeletePlanDialog();
    
    // 刷新首页
    this.loadHomePage();
    
    // 显示成功提示
    setTimeout(() => {
        alert('✅ 成长计划已删除');
    }, 300);
}

closeDeletePlanDialog() {
    const dialog = document.querySelector('.custom-dialog-overlay');
    if (dialog) {
        dialog.remove();
    }
}
```

**逻辑：**
1. 从`abilities`数组中删除
2. 保存数据
3. 关闭弹窗
4. 刷新首页
5. 显示成功提示

---

## CSS样式（新增）

### 1. 辅导计划卡片

```css
.coaching-plan-card {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-md);
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 15px;
}

.coaching-plan-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.coaching-plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.coaching-plan-header h4 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.coaching-badge-new {
    background: #e5e7eb;
    color: #6b7280;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
}

.coaching-plan-progress {
    margin-bottom: 12px;
}

.coaching-plan-footer {
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
}

.coaching-hint {
    color: var(--primary-color);
    font-weight: 500;
}
```

---

### 2. 删除计划弹窗

```css
.delete-plan-dialog .dialog-icon {
    font-size: 60px;
    margin-bottom: 15px;
}

.delete-plan-dialog .delete-plan-name {
    font-size: 20px;
    font-weight: 600;
    color: var(--primary-color);
    margin: 10px 0;
}

.delete-plan-info {
    list-style: none;
    padding: 0;
    margin: 15px 0;
    text-align: left;
}

.delete-plan-info li {
    padding: 8px 0;
    color: var(--text-secondary);
    font-size: 14px;
}

.danger-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.danger-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
```

---

### 3. 首页删除按钮

```css
.delete-ability-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.3s ease;
    padding: 5px;
}

.delete-ability-btn:hover {
    opacity: 1;
    transform: scale(1.2);
}
```

---

## 需要删除的旧代码

### js/app.js

1. `renderCoachingCards()` - 删除
2. `toggleDeleteButton()` - 删除
3. `deleteSelectedCoaching()` - 删除
4. `deleteSingleCoaching()` - 删除
5. `startNewCoaching()` - 删除
6. `viewCoachingSession()` - 删除

### index.html

1. 辅导列表页面的"新建辅导"按钮 - 删除
2. 辅导列表页面的"删除选中"按钮 - 删除
3. 辅导卡片的复选框 - 删除

---

## 测试建议

### 🧪 测试1：查看辅导列表

**步骤：**
1. 进入阶段辅导页面

**预期结果：**
- ✅ 显示所有正在进行的计划
- ✅ 每个计划显示名称、进度、状态
- ✅ 有对话记录的显示"进行中"
- ✅ 没有对话记录的显示"未开始"

---

### 🧪 测试2：进入某个计划的辅导

**步骤：**
1. 在辅导列表中点击某个计划

**预期结果：**
- ✅ 进入辅导对话页面
- ✅ 标题显示计划名称（如"Python编程 - 辅导"）
- ✅ 显示进展概览（当前天数、进度、得分）
- ✅ 显示对话历史
- ✅ 如果是第一次进入，AI主动发起对话

---

### 🧪 测试3：辅导对话

**步骤：**
1. 在辅导页面输入消息并发送
2. 等待AI响应

**预期结果：**
- ✅ 用户消息显示在右侧
- ✅ AI消息显示在左侧
- ✅ 对话保存到`ability.coachingMessages`
- ✅ 刷新页面后对话仍然存在

---

### 🧪 测试4：首页删除计划

**步骤：**
1. 在首页点击某个计划的删除按钮（🗑️）
2. 查看删除确认弹窗

**预期结果：**
- ✅ 显示删除确认弹窗
- ✅ 显示计划名称、进度、打卡记录、辅导记录
- ✅ 显示"取消"和"确认删除"按钮

---

### 🧪 测试5：确认删除计划

**步骤：**
1. 点击"确认删除"

**预期结果：**
- ✅ 弹窗关闭
- ✅ 首页刷新
- ✅ 计划从首页消失
- ✅ 显示"✅ 成长计划已删除"提示

---

### 🧪 测试6：取消删除计划

**步骤：**
1. 点击"取消"

**预期结果：**
- ✅ 弹窗关闭
- ✅ 计划未被删除
- ✅ 首页不变

---

## 版本信息

- **重构版本：** v3.2.0
- **基于版本：** v3.1.9
- **更新类型：** 重大架构重构
- **影响范围：** 阶段辅导系统、首页删除功能
- **破坏性变更：** 是（数据结构变更：`coachingSessions` → `coachingMessages`）

---

## 数据迁移建议

对于现有用户的数据，需要迁移`coachingSessions`到新的`coachingMessages`：

```javascript
// 迁移代码（在loadAbilities中执行）
loadAbilities() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.ABILITIES);
    if (data) {
        let abilities = JSON.parse(data);
        
        // 迁移旧数据
        abilities = abilities.map(ability => {
            // 如果有旧的coachingSessions，迁移到coachingMessages
            if (ability.coachingSessions && ability.coachingSessions.length > 0) {
                // 合并所有session的messages到coachingMessages
                const allMessages = [];
                ability.coachingSessions.forEach(session => {
                    if (session.messages && session.messages.length > 0) {
                        allMessages.push(...session.messages);
                    }
                });
                
                ability.coachingMessages = allMessages;
                delete ability.coachingSessions; // 删除旧字段
            }
            
            return ability;
        });
        
        // 保存迁移后的数据
        this.abilities = abilities;
        this.saveAbilities();
        
        return abilities;
    }
    return [];
}
```

---

## 后续优化建议

### 🚀 辅导历史回顾

虽然现在不保存历史辅导记录，但可以在未来添加：
1. **辅导摘要：** 每次辅导后AI生成摘要
2. **关键决策记录：** 记录用户在辅导中的关键决策
3. **进展快照：** 定期保存进展快照

---

### 📊 辅导分析

1. **对话分析：** 分析用户的对话模式
2. **问题识别：** 识别用户的常见问题
3. **建议优化：** AI根据历史对话优化建议

---

**重构完成！** ✅

阶段辅导系统已从"多历史记录"模式简化为"单一会话"模式，更加简洁高效！

