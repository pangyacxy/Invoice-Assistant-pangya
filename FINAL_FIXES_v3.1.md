# 最终修复清单 v3.1

## 🐛 已修复的Bug

### 1. API报错 ✅
**错误：** `Cannot read properties of undefined (reading 'join')`
**原因：** `ability.path.chapters[].tasks` 可能为 undefined
**修复：**
```javascript
// 添加安全检查
const tasks = ch.tasks || [];
const taskStr = tasks.length > 0 ? tasks.join('、') : '继续学习';
```

### 2. 主页卡片未使用总表数据 ✅
**问题：** 主页"正在进行的挑战"显示不正确
**修复：**
```javascript
// createAbilityCard 现在使用：
const currentDay = ability.currentDay  // 总表
const totalDays = ability.totalDays    // 总表
```

---

## 🔨 待实现功能

### 3. 时间轴增强 ⏳
- [ ] 点击时间轴的某一天可以查看该天任务
- [ ] 默认显示当天任务
- [ ] 不同阶段用不同颜色区分

### 4. 成长日记关联计划 ⏳
- [ ] 添加"关联计划"选择器
- [ ] 快捷选择今天打卡过的计划
- [ ] 日记列表显示关联的计划名称
- [ ] 显示心情+计划标签

---

## 📝 实现计划

### 时间轴增强
```javascript
// 1. 渲染时间轴时区分阶段颜色
renderTimeline(ability) {
    const chapters = ability.path?.chapters || [];
    let dayCounter = 0;
    
    for (let day = 1; day <= totalDays; day++) {
        // 计算当前天属于哪个阶段
        const chapterIndex = this.getChapterIndexForDay(day, chapters);
        const color = CHAPTER_COLORS[chapterIndex];
        
        // 添加点击事件
        html += `<div class="timeline-day" onclick="app.viewDayTask(${day})">
            <div class="day-dot" style="background: ${color}">...</div>
        </div>`;
    }
}

// 2. 查看某天的任务
viewDayTask(day) {
    const ability = this.abilities.find(a => a.id === this.currentAbilityId);
    const {chapter, task} = this.getCurrentDayInfo(ability, day);
    
    // 显示任务详情弹窗
    this.showTaskDetail(day, chapter, task);
}
```

### 成长日记关联计划
```javascript
// 1. 日记数据结构
diary = {
    id: Date.now(),
    date: new Date().toISOString(),
    mood: 'happy',
    content: '今天学习了...',
    images: [],
    relatedAbilityId: '1761285731411',  // 新增
    relatedAbilityName: '情绪管理'      // 新增
}

// 2. 快捷选择
getTodayCheckedAbilities() {
    return this.abilities.filter(a => {
        return this.isTodayChecked(a.id);
    });
}

// 3. 日记列表展示
renderDiaryCard(diary) {
    const ability = this.abilities.find(a => a.id === diary.relatedAbilityId);
    const abilityName = ability ? ability.name : '';
    
    html += `
        <div class="diary-card">
            <div class="diary-header">
                <span class="diary-mood">${mood.emoji}</span>
                ${abilityName ? `<span class="diary-ability-tag">${abilityName}</span>` : ''}
            </div>
            ...
        </div>
    `;
}
```

---

## 当前进度
- ✅ API报错修复
- ✅ 主页卡片修复
- ⏳ 时间轴增强
- ⏳ 成长日记关联

继续实施中...

