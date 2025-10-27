// 主应用逻辑 - 重新设计版本
class AbilityApp {
    constructor() {
        this.currentPage = 'welcomePage';
        this.userData = this.loadUserData();
        this.abilities = this.loadAbilities(); // 多个能力
        this.diaries = this.loadDiaries();
        this.interviewHistory = [];
        this.interviewRound = 0;
        this.interviewType = 'ability'; // 访谈类型：ability 或 deep
        this.currentAbilityId = null; // 当前正在操作的能力ID
        this.selectedMood = null;
        this.diaryImages = [];
        
        this.init();
    }

    init() {
        // 初始化心情选择器
        this.initMoodSelector();
        
        // 检查用户状态
        if (!this.userData.onboarded) {
            this.showPage('welcomePage');
        } else {
            this.showPage('homePage');
            this.loadHomePage();
        }
    }

    // ========== 页面导航 ==========
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
        }
    }

    showLoading(show = true, text = 'AI正在思考...') {
        const loading = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        const aiStatusHint = document.getElementById('aiStatusHint');
        const sendBtn = document.getElementById('sendBtn');
        const inputPrompt = document.getElementById('inputPrompt');
        
        // 检查是否在访谈页面
        const isInterviewPage = document.getElementById('interviewPage').classList.contains('active');
        
        if (isInterviewPage && aiStatusHint) {
            // 访谈页面：使用状态提示，不显示灰屏
            if (show) {
                // 显示状态提示
                aiStatusHint.querySelector('.status-text').textContent = text;
                aiStatusHint.style.display = 'flex';
                
                // 禁用发送按钮
                if (sendBtn) {
                    sendBtn.disabled = true;
                    sendBtn.style.opacity = '0.5';
                    sendBtn.style.cursor = 'not-allowed';
                }
                
                // 隐藏输入提示
                if (inputPrompt) {
                    inputPrompt.style.display = 'none';
                }
            } else {
                // 隐藏状态提示
                aiStatusHint.style.display = 'none';
                
                // 恢复发送按钮
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.style.opacity = '1';
                    sendBtn.style.cursor = 'pointer';
                }
            }
        } else {
            // 其他页面：使用灰屏加载
            if (loading && loadingText) {
                loadingText.textContent = text;
                if (show) {
                    loading.classList.add('active');
                } else {
                    loading.classList.remove('active');
                }
            }
        }
    }

    // ========== 主页功能 ==========
    goToHome() {
        this.showPage('homePage');
        this.loadHomePage();
    }

    loadHomePage() {
        // 更新主页昵称显示
        const nickname = this.userData.nickname || '朋友';
        document.getElementById('homeUserName').textContent = `你好，${nickname}！`;
        
        // 加载进行中的能力
        const activeAbilities = this.abilities.filter(a => !a.completed);
        const container = document.getElementById('activeAbilities');
        
        if (activeAbilities.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">还没有进行中的挑战，点击下方按钮开始吧！</p>';
        } else {
            container.innerHTML = '';
            activeAbilities.forEach(ability => {
                const card = this.createAbilityCard(ability);
                container.appendChild(card);
            });
        }
        
        // 更新今日任务徽章
        const todayTaskCount = this.getTodayTaskCount();
        const badge = document.getElementById('todayTaskBadge');
        if (badge) {
            badge.textContent = todayTaskCount;
            badge.style.display = todayTaskCount > 0 ? 'block' : 'none';
        }
    }

    createAbilityCard(ability) {
        const card = document.createElement('div');
        card.className = 'ability-progress-card';
        card.onclick = () => this.goToAbility(ability.id);
        
        const abilityData = getAbilityData(ability.name);
        const icon = abilityData ? abilityData.icon : '✨';
        
        // ✅ 核心修复：使用 ability 总表数据，不再使用 CONFIG.TOTAL_DAYS
        const currentDay = ability.currentDay || 1;
        const totalDays = ability.totalDays || 21;
        const completedDays = ability.checkInData.filter(c => c.completed).length;
        const progress = (completedDays / totalDays) * 100;
        
        // 检查今天是否已打卡
        const todayChecked = this.isTodayChecked(ability.id);
        const statusText = todayChecked ? '✅ 今日已打卡' : '📝 待完成';
        
        card.innerHTML = `
            <div class="ability-card-header">
                <div class="ability-card-title">
                    <span class="ability-card-icon">${icon}</span>
                    <span>${ability.name}</span>
                </div>
                <div class="ability-card-actions">
                    <div class="ability-card-day">第${currentDay}/${totalDays}天</div>
                    <button class="delete-ability-btn" onclick="event.stopPropagation(); app.showDeletePlanDialog(${ability.id})">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="ability-card-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">${statusText}</p>
            </div>
        `;
        
        return card;
    }

    getTodayTaskCount() {
        const today = new Date().toDateString();
        return this.abilities.filter(a => {
            if (a.completed) return false;
            const lastCheckIn = a.lastCheckInDate ? new Date(a.lastCheckInDate).toDateString() : null;
            return lastCheckIn !== today;
        }).length;
    }

    startNewAbility() {
        // 开始新能力提升，直接跳转到访谈类型选择
        this.showPage('interviewTypePage');
    }

    goToAbility(abilityId) {
        this.currentAbilityId = abilityId;
        this.showPage('taskPage');
        this.loadTaskPage(abilityId);
    }

    goToTodayTasks() {
        const unfinishedAbilities = this.abilities.filter(a => !a.completed && !this.isTodayChecked(a.id));
        if (unfinishedAbilities.length > 0) {
            this.goToAbility(unfinishedAbilities[0].id);
        } else {
            alert('今天的任务都完成了！👏');
        }
    }

    goToDiary() {
        // 成长日记不需要绑定特定计划，显示所有日记
        this.showPage('diaryPage');
        this.loadAllDiaries();
    }

    goToCoachingFromHome() {
        // 从主页快捷入口进入辅导（所有能力都可以，包括进行中的）
        if (this.abilities.length === 0) {
            alert('还没有开始任何能力提升哦，先开始一个挑战吧');
            return;
        }
        
        // 显示辅导列表，让用户选择要辅导的计划
        this.showCoachingList();
    }
    
    goToCoachingFromProfile() {
        this.goToCoachingFromHome();
    }

    // ========== 个人中心 ==========
    goToProfile() {
        this.showPage('profilePage');
        this.loadProfilePage();
    }

    loadProfilePage() {
        // 基本信息
        document.getElementById('profileNickname').textContent = 
            this.userData.nickname || '-';
        document.getElementById('profileJoinDate').textContent = 
            this.userData.joinDate ? new Date(this.userData.joinDate).toLocaleDateString() : '-';
        
        // 计算总打卡天数
        let totalDays = 0;
        this.abilities.forEach(a => {
            totalDays += a.checkInData.filter(c => c.completed).length;
        });
        document.getElementById('profileTotalDays').textContent = totalDays + '天';
        
        // 能力进度列表
        const progressContainer = document.getElementById('abilityProgress');
        progressContainer.innerHTML = '';
        
        if (this.abilities.length === 0) {
            progressContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">还没有任何能力记录</p>';
        } else {
            this.abilities.forEach(ability => {
                const card = this.createAbilityCardForProfile(ability);
                progressContainer.appendChild(card);
            });
        }
        
        // 统计数据
        const completed = this.abilities.filter(a => a.completed).length;
        const diaries = this.diaries.length;
        
        // 计算辅导次数
        const totalCoachingSessions = this.abilities.reduce((sum, ability) => {
            return sum + (ability.coachingSessions ? ability.coachingSessions.length : 0);
        }, 0);
        
        // 计算最长连续
        let maxStreak = 0;
        this.abilities.forEach(a => {
            const streak = this.calculateStreak(a);
            if (streak > maxStreak) maxStreak = streak;
        });
        
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statCoachingCount').textContent = totalCoachingSessions;
        document.getElementById('statDiaries').textContent = diaries;
        document.getElementById('statStreak').textContent = maxStreak;
    }

    calculateStreak(ability) {
        let streak = 0;
        let currentStreak = 0;
        
        ability.checkInData.forEach(c => {
            if (c.completed) {
                currentStreak++;
                if (currentStreak > streak) streak = currentStreak;
            } else {
                currentStreak = 0;
            }
        });
        
        return streak;
    }
    
    createAbilityCardForProfile(ability) {
        const card = document.createElement('div');
        card.className = 'ability-progress-card profile-ability-card';
        
        const abilityData = getAbilityData(ability.name);
        const icon = abilityData ? abilityData.icon : '✨';
        const completedDays = ability.checkInData.filter(c => c.completed).length;
        const totalDays = ability.totalDays || 21;
        const progress = (completedDays / totalDays) * 100;
        const statusText = ability.completed ? '✅ 已完成' : `进行中 ${completedDays}/${totalDays}天`;
        
        card.innerHTML = `
            <div class="ability-card-header">
                <div class="ability-card-title">
                    <span class="ability-card-icon">${icon}</span>
                    <span>${ability.name}</span>
                </div>
                <button class="delete-ability-btn" onclick="event.stopPropagation(); app.confirmDeleteAbility('${ability.id}')">
                    🗑️
                </button>
            </div>
            <div class="ability-card-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">${statusText}</p>
            </div>
        `;
        
        // 点击卡片查看详情（不包括删除按钮）
        card.onclick = () => this.goToAbility(ability.id);
        
        return card;
    }
    
    confirmDeleteAbility(abilityId) {
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) return;
        
        // 创建删除确认弹窗
        const dialog = document.createElement('div');
        dialog.className = 'delete-confirm-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay" onclick="this.parentElement.remove()"></div>
            <div class="dialog-content">
                <h3>⚠️ 确认删除计划？</h3>
                
                <div class="delete-warning">
                    <div class="delete-warning-icon">🗑️</div>
                    <div class="delete-warning-text">
                        <h4>即将删除：${ability.name}</h4>
                        <p>删除后，该能力的所有记录、打卡数据和日记都将被永久删除，无法恢复。</p>
                    </div>
                </div>
                
                <div class="dialog-actions">
                    <button class="secondary-btn" onclick="this.closest('.delete-confirm-dialog').remove()">
                        取消
                    </button>
                    <button class="primary-btn" style="background: #ef4444;" onclick="app.deleteAbility('${abilityId}')">
                        确认删除
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    deleteAbility(abilityId) {
        const index = this.abilities.findIndex(a => a.id === abilityId);
        if (index === -1) return;
        
        // 删除能力
        this.abilities.splice(index, 1);
        this.saveAbilities();
        
        // 关闭弹窗
        const dialog = document.querySelector('.delete-confirm-dialog');
        if (dialog) {
            dialog.remove();
        }
        
        // 刷新个人页面
        this.loadProfilePage();
        
        // 提示
        alert('计划已删除');
    }

    // ========== 访谈功能 - 漫画式对话 ==========
    startOnboarding() {
        // 弹出昵称输入框
        const nickname = prompt('欢迎来到能力养成所！\n\n请输入你的昵称（至少2个字符）：');
        
        if (!nickname || nickname.trim().length === 0) {
            alert('昵称不能为空哦');
            return;
        }
        
        if (nickname.trim().length < 2) {
            alert('昵称至少要2个字符哦');
            return;
        }
        
        // 保存用户信息
        this.userData.nickname = nickname.trim();
        this.userData.onboarded = true;
        if (!this.userData.joinDate) {
            this.userData.joinDate = new Date().toISOString();
        }
        this.saveUserData();
        
        // 直接跳转到主页
        this.goToHome();
    }

    async selectInterviewType(type) {
        this.interviewType = type;
        
        // 两种访谈都直接开始对话
        this.showPage('interviewPage');
        await this.startInterview();
    }

    backToHomeFromInterview() {
        if (confirm('确定要退出访谈吗？访谈进度将不会保存。')) {
            if (this.userData.onboarded) {
                this.goToHome();
            } else {
                this.showPage('welcomePage');
            }
        }
    }

    async startInterview() {
        this.interviewRound = 1;
        this.interviewHistory = [];
        
        // 清空聊天记录
        const messagesContainer = document.getElementById('interviewMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // 隐藏方案展示区域
        const planDisplay = document.getElementById('planDisplay');
        if (planDisplay) {
            planDisplay.style.display = 'none';
        }
        
        const nickname = this.userData.nickname || '朋友';
        
        // 根据访谈类型选择第一个问题
        let firstQuestion = '';
        if (this.interviewType === 'deep') {
            firstQuestion = `你好，${nickname}！我想深入地了解你。不用紧张，就像和朋友聊天一样。我想先问问，现在你最想改变自己的是什么？`;
        } else {
            firstQuestion = `你好，${nickname}！我是你的成长教练。最近有遇到什么让你感到困扰的事情吗？`;
        }
        
        this.addInterviewMessage('ai', firstQuestion);
        this.interviewHistory.push({ role: 'assistant', content: firstQuestion });
    }

    addInterviewMessage(role, text) {
        const messagesContainer = document.getElementById('interviewMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `interview-message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'interview-message-avatar';
        avatar.textContent = role === 'ai' ? '🤗' : '😊';
        
        const content = document.createElement('div');
        content.className = 'interview-message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'interview-message-text';
        textDiv.textContent = text;
        
        content.appendChild(textDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        messagesContainer.appendChild(messageDiv);
        
        // 滚动到底部
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    async sendMessage() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // 显示用户消息
        this.addInterviewMessage('user', message);
        input.value = '';
        
        // 添加到历史
        this.interviewHistory.push({ role: 'user', content: message });
        
        // 调用AI
        this.showLoading(true);
        
        setTimeout(async () => {
            try {
                const response = await deepseekAPI.interview(
                    this.interviewRound,
                    message,
                    null, // 不再使用身份信息
                    this.interviewHistory,
                    this.interviewType,
                    this.questionnaireAnswers || null  // 传递问卷答案
                );
                
                this.showLoading(false);
                
                // 检查AI是否要求生成问卷
                if (response.includes('GENERATE_QUESTIONNAIRE')) {
                    // 能力访谈：生成动态问卷
                    this.showLoading(true, 'AI正在为你定制问卷...');
                    setTimeout(async () => {
                        await this.generateDynamicQuestionnaire();
                        this.showLoading(false);
                        this.showPage('questionnairePage');
                    }, 1500);
                    return;
                }
                
                // 检查AI是否要生成方案预览
                if (response.includes('GENERATE_PLAN_PREVIEW')) {
                    // 生成方案并显示，但继续对话
                    const cleanResponse = response.replace('GENERATE_PLAN_PREVIEW', '').trim();
                    if (cleanResponse) {
                        this.addInterviewMessage('ai', cleanResponse);
                        this.interviewHistory.push({ role: 'assistant', content: cleanResponse });
                    }
                    
                    this.showLoading(true, 'AI正在生成方案...');
                    setTimeout(async () => {
                        await this.generatePlanPreview();
                        this.showLoading(false);
                        this.addInterviewMessage('ai', '我为你准备了这个成长方案，你可以往下看看方案详情，有什么想法随时告诉我，我们一起调整！');
                    }, 1500);
                    this.interviewRound++;
                    return;
                }
                
                // 检查AI是否要求用户确认方案（能力访谈）
                if (response.includes('CONFIRM_PLAN')) {
                    // 用户确认方案，生成最终报告
                    const cleanResponse = response.replace('CONFIRM_PLAN', '').trim();
                    if (cleanResponse) {
                        this.addInterviewMessage('ai', cleanResponse);
                    } else {
                        this.addInterviewMessage('ai', '看起来你对方案很满意！那我们就开始挑战吧！');
                    }
                    
                    setTimeout(async () => {
                        await this.generateReport();
                    }, 2000);
                    return;
                }
                
                // 检查深度访谈是否完成
                if (response.includes('INTERVIEW_COMPLETE')) {
                    const cleanResponse = response.replace('INTERVIEW_COMPLETE', '').trim();
                    if (cleanResponse) {
                        this.addInterviewMessage('ai', cleanResponse);
                    } else {
                        this.addInterviewMessage('ai', '我们聊了很多，我觉得已经很了解你了。让我为你生成深度分析报告吧！');
                    }
                    
                    setTimeout(async () => {
                        await this.generateReport();
                    }, 2000);
                    return;
                }
                
                // 根据访谈类型设置不同的结束轮数（增加上限，因为有更多互动）
                const maxRounds = this.interviewType === 'deep' ? 15 : 12;
                
                // 检查是否强制结束
                if (this.interviewRound >= maxRounds) {
                    this.addInterviewMessage('ai', '我们聊了很多，我觉得已经很了解你了。让我为你生成完整的方案吧！');
                    setTimeout(async () => {
                        await this.generateReport();
                    }, 2000);
                } else {
                    // 继续访谈
                    this.addInterviewMessage('ai', response);
                    this.interviewHistory.push({ role: 'assistant', content: response });
                    this.interviewRound++;
                }
            } catch (error) {
                this.showLoading(false);
                this.addInterviewMessage('ai', '抱歉，我遇到了一些问题。让我们换个角度继续聊吧。能跟我分享一个你最近遇到的具体困难吗？');
            }
        }, 1000);
    }

    async generateReport() {
        const loadingText = this.interviewType === 'deep' 
            ? '正在为你生成深度分析报告...' 
            : '正在为你生成能力画像报告...';
        this.showLoading(true, loadingText);
        
        try {
            const report = await deepseekAPI.generateReport(
                null, // 不再使用身份信息
                this.interviewHistory,
                this.interviewType  // 传递访谈类型
            );
            
            this.userData.report = report;
            this.userData.reportType = this.interviewType;
            this.userData.onboarded = true;
            this.saveUserData();
            
            this.showLoading(false);
            this.showPage('reportPage');
            this.displayReport(report);
        } catch (error) {
            console.error('生成报告失败:', error);
            this.showLoading(false);
            
            // 根据访谈类型生成默认报告
            let defaultReport;
            if (this.interviewType === 'deep') {
                defaultReport = {
                    type: 'deep',
                    coreValues: ['成长', '真诚', '自由'],
                    personalityTraits: '你是一个富有思考力的人，对自己有较高的要求，但有时会因为追求完美而感到焦虑。你渴望被理解，也在努力理解他人。',
                    currentState: '当前处于探索和成长的阶段，虽然有些迷茫，但内心有着清晰的方向感。',
                    potentialIssues: [
                        '是否害怕失败？',
                        '是否过于在意他人的评价？',
                        '是否经常自我怀疑？',
                        '是否难以表达真实的自己？',
                        '是否对未来感到焦虑？'
                    ],
                    suggestions: [
                        { title: '接纳不完美的自己', content: '完美主义是成长的敌人，学会接纳当下的自己。' },
                        { title: '建立支持系统', content: '找到能够理解你的朋友，建立情感支持网络。' },
                        { title: '行动起来', content: '想太多不如做一件小事，行动能带来改变。' }
                    ],
                    summary: '通过我们的对话，我看到了一个真诚、努力的你。你不需要变成谁，你只需要成为更好的自己。'
                };
            } else {
                defaultReport = {
                    type: 'ability',
                    mainScenario: '在表达和沟通场景中遇到困难',
                    corePain: '想法清晰但表达不出来',
                    emotion: '有些焦虑但愿意改变',
                    recommendedAbilities: [
                        { name: '口述表达', reason: '帮助你在工作汇报、面试等场景中清晰表达' }
                    ],
                    summary: '通过我们的对话，我发现你不是不够努力，只是还没找到合适的表达方法。21天的系统训练可以帮助你建立信心。'
                };
            }
            
            this.userData.report = defaultReport;
            this.userData.reportType = this.interviewType;
            this.saveUserData();
            this.showPage('reportPage');
            this.displayReport(defaultReport);
        }
    }

    displayReport(report) {
        const reportContent = document.getElementById('reportContent');
        let html = '';
        
        if (report.type === 'deep') {
            // 深度访谈报告
            html += '<div class="report-section">';
            html += `<h3>👤 身份</h3>`;
            html += `<p>${report.identity}</p>`;
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>💎 核心价值观</h3>`;
            html += '<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">';
            if (report.coreValues && report.coreValues.length > 0) {
                report.coreValues.forEach(value => {
                    html += `<span class="ability-tag">${value}</span>`;
                });
            }
            html += '</div>';
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>🎭 人格特质</h3>`;
            html += `<p style="line-height: 1.8;">${report.personalityTraits}</p>`;
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>📍 当前状态</h3>`;
            html += `<p style="line-height: 1.8;">${report.currentState}</p>`;
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>❓ 你可能不敢面对的问题</h3>`;
            html += '<ul style="list-style: none; padding-left: 0;">';
            if (report.potentialIssues && report.potentialIssues.length > 0) {
                report.potentialIssues.forEach(issue => {
                    html += `<li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">• ${issue}</li>`;
                });
            }
            html += '</ul>';
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>💡 给你的建议</h3>`;
            if (report.suggestions && report.suggestions.length > 0) {
                report.suggestions.forEach(sug => {
                    html += `<div style="background: var(--background); padding: 15px; border-radius: 8px; margin: 10px 0;">`;
                    html += `<h4 style="margin-bottom: 8px; color: var(--primary-color);">${sug.title}</h4>`;
                    html += `<p>${sug.content}</p>`;
                    html += `</div>`;
                });
            }
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<p style="font-size: 16px; line-height: 1.8; font-style: italic; color: var(--primary-color);">${report.summary}</p>`;
            html += '</div>';
            
            // 深度访谈不需要接受计划按钮，直接显示返回主页
            document.querySelector('.report-actions').innerHTML = `
                <button class="primary-btn" onclick="app.goToHome()">返回主页</button>
            `;
        } else {
            // 能力访谈报告（原有逻辑）
            html += '<div class="report-section">';
            html += `<h3>👤 身份</h3>`;
            html += `<p>${report.identity}</p>`;
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>🎯 主要场景</h3>`;
            html += `<p>${report.mainScenario || '日常工作/学习场景'}</p>`;
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>💭 核心痛点</h3>`;
            html += `<p>${report.corePain || '表达和沟通能力需要提升'}</p>`;
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<h3>💡 为你推荐</h3>`;
            if (report.recommendedAbilities && report.recommendedAbilities.length > 0) {
                report.recommendedAbilities.forEach(ability => {
                    const abilityData = ABILITIES_DATA[ability.name];
                    const icon = abilityData ? abilityData.icon : '✨';
                    html += `<div class="ability-tag">${icon} ${ability.name}</div>`;
                    html += `<p>${ability.reason}</p>`;
                });
            }
            html += '</div>';
            
            html += '<div class="report-section">';
            html += `<p style="font-size: 16px; line-height: 1.8;">${report.summary || '如果你想，我可以为你设计一个21天的成长计划，每天只需10分钟，你愿意试试吗？'}</p>`;
            html += '</div>';
            
            // 能力访谈显示接受计划按钮
            document.querySelector('.report-actions').innerHTML = `
                <button class="primary-btn" onclick="app.acceptPlanFromReport()">接受成长计划，开始挑战</button>
            `;
        }
        
        reportContent.innerHTML = html;
    }

    // 从报告接受计划（使用currentPlan）
    acceptPlanFromReport() {
        if (!this.currentPlan) {
            alert('❌ 方案数据丢失，请重新访谈');
            return;
        }
        
        // 直接使用createAbilityFromPlan方法
        this.createAbilityFromPlan();
    }

    async acceptPlan() {
        const report = this.userData.report;
        if (!report || !report.recommendedAbilities || report.recommendedAbilities.length === 0) {
            await this.selectAbility('口述表达');
            return;
        }
        
        const firstAbility = report.recommendedAbilities[0].name;
        await this.selectAbility(firstAbility);
    }

    async customizePlan() {
        alert('自定义功能开发中...\n当前版本请先体验推荐的能力养成计划');
        await this.acceptPlan();
    }

    async selectAbility(abilityName) {
        this.showLoading(true, '正在为你规划21天成长路径...');
        
        const pathData = ABILITIES_DATA[abilityName];
        
        if (!pathData) {
            this.showLoading(false);
            alert('能力数据不存在');
            return;
        }
        
        // 创建新的能力记录
        const newAbility = {
            id: Date.now().toString(),
            name: abilityName,
            startDate: new Date().toISOString(),
            currentDay: 1,
            completed: false,
            lastCheckInDate: null,
            checkInData: this.initCheckInDataForAbility()
        };
        
        this.abilities.push(newAbility);
        this.saveAbilities();
        
        this.showLoading(false);
        this.showPage('pathPage');
        this.displayPath(pathData);
    }

    initCheckInDataForAbility() {
        const data = [];
        for (let i = 1; i <= CONFIG.TOTAL_DAYS; i++) {
            data.push({
                day: i,
                completed: false,
                date: null,
                answers: {},
                summary: '',
                aiReport: ''
            });
        }
        return data;
    }

    displayPath(pathData) {
        document.getElementById('pathAbilityName').textContent = pathData.name;
        
        const pathContent = document.getElementById('pathContent');
        let html = '';
        
        pathData.chapters.forEach(chapter => {
            html += '<div class="chapter-card">';
            html += '<div class="chapter-header">';
            html += `<div class="chapter-name">${chapter.chapterName}</div>`;
            html += `<div class="chapter-days">${chapter.days}天</div>`;
            html += '</div>';
            html += `<div class="chapter-goal">🎯 ${chapter.goal}</div>`;
            html += '<ul class="task-list">';
            chapter.dailyTasks.slice(0, 3).forEach(task => {
                html += `<li>${task}</li>`;
            });
            html += `<li>...还有${chapter.dailyTasks.length - 3}个任务</li>`;
            html += '</ul>';
            html += `<p style="margin-top: 15px; color: var(--text-secondary); font-size: 14px;">📝 章节考核：${chapter.exam}</p>`;
            html += '</div>';
        });
        
        pathContent.innerHTML = html;
    }

    startJourney() {
        this.goToHome();
    }

    // ========== 打卡功能 - 真实日期限制 ==========
    loadTaskPage(abilityId) {
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) return;
        
        // ✅ 核心修复：从 ability.path 读取数据，而不是静态配置
        const currentDay = ability.currentDay || 1;
        const totalDays = ability.totalDays || 21;
        const path = ability.path || {};
        
        // 更新导航标题
        document.getElementById('navAbilityName').textContent = ability.name;
        
        // 更新进度（使用总表数据）
        document.getElementById('currentDay').textContent = currentDay;
        
        // 从 ability.path.chapters 计算当前天数属于哪个阶段
        const { chapter, dayInChapter, task } = this.getCurrentDayInfo(ability, currentDay);
        
        if (chapter) {
            document.getElementById('chapterName').textContent = chapter.name || `阶段${chapter.index + 1}`;
            document.getElementById('chapterGoal').textContent = this.getChapterGoal(chapter);
        }
        
        // 检查今天是否已打卡
        const todayChecked = this.isTodayChecked(abilityId);
        const statusDiv = document.getElementById('checkInStatus');
        const taskContentDiv = document.getElementById('taskContent');
        const questionsContainer = document.getElementById('taskQuestions');
        
        if (todayChecked) {
            // 已打卡：显示提示信息，不显示任务问卷
            statusDiv.innerHTML = '<div class="status-checked">✅ 今日已完成打卡</div>';
            document.getElementById('checkInBtn').disabled = true;
            document.getElementById('checkInBtn').textContent = '今日已打卡';
            
            taskContentDiv.innerHTML = `
                <div class="today-checked-notice">
                    <div class="notice-icon">✅</div>
                    <h3>今日已打卡</h3>
                    <p>你今天已经完成打卡了，明天再来吧！</p>
                    <p class="notice-hint">可以去【成长日记】记录今天的感受哦</p>
                </div>
            `;
            
            // 清空问题容器
            questionsContainer.innerHTML = '';
        } else {
            // 未打卡：正常显示任务和问卷
            statusDiv.innerHTML = '<div class="status-pending">⏰ 今日待完成</div>';
            document.getElementById('checkInBtn').disabled = false;
            document.getElementById('checkInBtn').textContent = '完成今日打卡';
            
            // 显示今日任务（从ability.path读取）
            taskContentDiv.innerHTML = `<p>${task || '继续今天的学习任务'}</p>`;
            
            // 生成任务问题
            this.generateTaskQuestions(currentDay);
        }
        
        // 渲染时间轴（使用总表的totalDays）
        this.renderTimeline(ability);
    }
    
    // 新方法：获取当前天数的详细信息（从ability.path读取）
    getCurrentDayInfo(ability, currentDay) {
        const chapters = ability.path?.chapters || [];
        let dayCounter = 0;
        
        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            const chapterDays = chapter.days || 7;
            
            if (currentDay <= dayCounter + chapterDays) {
                // 当前天数属于这个阶段
                const dayInChapter = currentDay - dayCounter;
                const task = this.getTaskForDay(chapter, dayInChapter);
                
                return {
                    chapter: {
                        ...chapter,
                        index: i
                    },
                    dayInChapter,
                    task
                };
            }
            
            dayCounter += chapterDays;
        }
        
        // 如果超出范围，返回最后一个阶段
        const lastChapter = chapters[chapters.length - 1];
        return {
            chapter: {
                ...lastChapter,
                index: chapters.length - 1
            },
            dayInChapter: 1,
            task: '继续学习'
        };
    }
    
    // 新方法：从阶段信息获取具体任务
    getTaskForDay(chapter, dayInChapter) {
        const tasks = chapter.tasks || [];
        if (tasks.length === 0) return '继续学习';
        
        // 根据天数循环使用任务列表
        const taskIndex = (dayInChapter - 1) % tasks.length;
        return tasks[taskIndex];
    }
    
    // 新方法：获取阶段目标
    getChapterGoal(chapter) {
        const tasks = chapter.tasks || [];
        if (tasks.length > 0) {
            return tasks.join('、');
        }
        return '完成本阶段的学习任务';
    }

    isTodayChecked(abilityId) {
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) return false;
        
        const today = new Date().toDateString();
        const lastCheckIn = ability.lastCheckInDate ? new Date(ability.lastCheckInDate).toDateString() : null;
        
        return lastCheckIn === today;
    }

    generateTaskQuestions(day) {
        // 根据天数生成不同的问题
        const questions = [
            {
                question: '今天的任务你完成了吗？',
                options: ['完全完成', '部分完成', '还没开始'],
                key: 'completion'
            },
            {
                question: '完成这个任务用了多长时间？',
                options: ['5-10分钟', '10-20分钟', '20-30分钟', '超过30分钟'],
                key: 'time'
            },
            {
                question: '你觉得今天的任务难度如何？',
                options: ['很简单', '适中', '有点难', '很困难'],
                key: 'difficulty'
            }
        ];
        
        const container = document.getElementById('taskQuestions');
        container.innerHTML = '';
        
        questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = `
                <div class="question-text">${q.question}</div>
                <div class="question-options" id="options-${index}">
                    ${q.options.map((opt, i) => `
                        <button class="option-btn" onclick="app.selectOption(${index}, ${i}, '${q.key}')">${opt}</button>
                    `).join('')}
                </div>
            `;
            container.appendChild(questionDiv);
        });
    }

    selectOption(questionIndex, optionIndex, key) {
        // 清除该问题的其他选中
        const options = document.querySelectorAll(`#options-${questionIndex} .option-btn`);
        options.forEach(opt => opt.classList.remove('selected'));
        
        // 选中当前选项
        options[optionIndex].classList.add('selected');
        
        // 保存答案
        if (!this.currentTaskAnswers) {
            this.currentTaskAnswers = {};
        }
        this.currentTaskAnswers[key] = optionIndex;
    }

    async checkIn() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        // 检查是否今天已打卡
        if (this.isTodayChecked(this.currentAbilityId)) {
            alert('今天已经打过卡了，明天再来吧！');
            return;
        }
        
        // 检查是否回答了所有问题
        if (!this.currentTaskAnswers || Object.keys(this.currentTaskAnswers).length < 3) {
            alert('请回答所有问题后再打卡');
            return;
        }
        
        // 计算今日得分
        const score = this.calculateCheckInScore(this.currentTaskAnswers);
        
        // 初始化checkInData数组（如果不存在）
        if (!ability.checkInData) {
            ability.checkInData = [];
        }
        
        // 确保当前天数的记录存在
        if (!ability.checkInData[ability.currentDay - 1]) {
            ability.checkInData[ability.currentDay - 1] = {
                day: ability.currentDay,
                completed: false,
                date: null,
                answers: {},
                score: 0
            };
        }
        
        // 记录打卡
        const checkInRecord = ability.checkInData[ability.currentDay - 1];
        checkInRecord.completed = true;
        checkInRecord.date = new Date().toISOString();
        checkInRecord.answers = this.currentTaskAnswers || {};
        checkInRecord.score = score;
        
        // 更新最后打卡日期
        ability.lastCheckInDate = new Date().toISOString();
        
        // 更新当前天数（如果不是最后一天）
        const totalDays = ability.totalDays || CONFIG.TOTAL_DAYS;
        if (ability.currentDay < totalDays) {
            ability.currentDay++;
        } else {
            ability.completed = true;
        }
        
        this.saveAbilities();
        this.currentTaskAnswers = {};
        
        // 判断是否需要辅导
        if (score < 60) {
            // 分数不够，弹窗提示
            this.showScoreLowDialog(ability, score);
        } else {
            // 显示完成提示
            if (ability.completed) {
                setTimeout(() => {
                    alert('🎉 恭喜你完成挑战！');
                    this.completeChallenge(ability);
                }, 500);
            } else {
                alert(`✅ 打卡成功！\n今日得分：${score}分\n已连续打卡 ${ability.currentDay - 1} 天`);
                this.loadTaskPage(this.currentAbilityId);
            }
        }
    }
    
    // 计算打卡问卷得分
    calculateCheckInScore(answers) {
        // 三个问题的权重
        // 问题1（完成度）：40%
        // 问题2（收获）：30%
        // 问题3（困难）：30%
        
        let score = 0;
        
        // 问题1：今天的任务完成情况
        const answer1 = answers['question1'] || '';
        if (answer1.includes('完全完成') || answer1.includes('很好') || answer1.includes('顺利')) {
            score += 40;
        } else if (answer1.includes('部分完成') || answer1.includes('基本') || answer1.includes('还行')) {
            score += 25;
        } else if (answer1.includes('没完成') || answer1.includes('困难') || answer1.includes('很难')) {
            score += 10;
        } else {
            // 根据文字长度判断（简单的启发式）
            if (answer1.length > 30) {
                score += 30;
            } else if (answer1.length > 10) {
                score += 20;
            } else {
                score += 10;
            }
        }
        
        // 问题2：今天最大的收获
        const answer2 = answers['question2'] || '';
        if (answer2.length > 30) {
            score += 30;
        } else if (answer2.length > 15) {
            score += 20;
        } else if (answer2.length > 5) {
            score += 10;
        } else {
            score += 5;
        }
        
        // 问题3：遇到的困难
        const answer3 = answers['question3'] || '';
        if (answer3.includes('没有') || answer3.includes('没遇到') || answer3.includes('顺利')) {
            score += 30;
        } else if (answer3.length > 20) {
            score += 20;
        } else if (answer3.length > 5) {
            score += 15;
        } else {
            score += 5;
        }
        
        return Math.min(score, 100);
    }
    
    // 显示分数低的弹窗
    showScoreLowDialog(ability, score) {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog-overlay';
        dialog.innerHTML = `
            <div class="custom-dialog score-low-dialog">
                <div class="dialog-icon">⚠️</div>
                <h3>今日得分偏低</h3>
                <p class="score-text">你的今日得分是 <strong>${score}分</strong></p>
                <p class="dialog-hint">看起来你在学习过程中遇到了一些困难。<br>需要和AI教练聊聊，帮你调整学习计划吗？</p>
                <div class="dialog-actions">
                    <button class="secondary-btn" onclick="app.closeScoreLowDialog(false)">
                        不需要，继续努力
                    </button>
                    <button class="primary-btn" onclick="app.closeScoreLowDialog(true)">
                        需要，开始辅导
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 保存能力ID，用于后续跳转
        this.scoreLowAbilityId = ability.id;
    }
    
    // 关闭分数低弹窗
    closeScoreLowDialog(needCoaching) {
        const dialog = document.querySelector('.custom-dialog-overlay');
        if (dialog) {
            dialog.remove();
        }
        
        if (needCoaching && this.scoreLowAbilityId) {
            // 直接进入该能力的辅导对话
            this.enterCoachingForAbility(this.scoreLowAbilityId);
        } else {
            // 正常返回主页
            const ability = this.abilities.find(a => a.id === this.scoreLowAbilityId);
            if (ability && ability.completed) {
                this.completeChallenge(ability);
            } else {
                this.showPage('homePage');
                this.loadHomePage();
            }
        }
        
        this.scoreLowAbilityId = null;
    }


    async completeChallenge(ability) {
        // 完成挑战后，进入阶段辅导列表
        this.showCoachingList();
    }
    
    // ========== 阶段辅导列表 ==========
    showCoachingList() {
        // 显示所有计划的辅导列表
        this.showPage('coachingListPage');
        this.renderAllCoachingList();
    }
    
    // 渲染所有计划的辅导列表
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
    
    // 进入某个计划的辅导对话
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
    
    // 渲染所有计划的辅导列表
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
    
    async startCoachingConversation(ability) {
        const nickname = this.userData.nickname || '朋友';
        const completedDays = ability.checkInData.filter(d => d.completed).length;
        const totalDays = ability.totalDays || 21;
        
        // 显示当前方案
        this.displayCurrentPlan();
        
        // 检查是否有多个进行中的计划
        const activeAbilities = this.abilities.filter(a => !a.completed);
        
        let greeting = `你好，${nickname}！`;
        
        if (activeAbilities.length > 1) {
            // 多计划提示
            greeting += `\n\n我看到你有${activeAbilities.length}个进行中的能力提升计划：\n`;
            activeAbilities.forEach((a, index) => {
                const current = a.id === ability.id ? '（当前）' : '';
                greeting += `${index + 1}. ${a.name}${current}\n`;
            });
            greeting += `\n我们现在聊的是「${ability.name}」。如果你想调整其他计划，请告诉我是第几个。`;
        }
        
        greeting += `\n\n我看到你已经完成了${completedDays}天的练习。让我们聊聊你最近的感受和收获吧。你觉得这段时间最大的变化是什么？`;
        
        // 添加到历史
        ability.coachingMessages.push({
            role: 'assistant',
            content: greeting
        });
        this.saveAbilities();
        
        // 显示消息
        this.addCoachingMessage('assistant', greeting);
    }
    
    // 显示当前方案（左侧面板）
    displayCurrentPlan() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        const currentDay = ability.currentDay || (ability.checkInData.filter(d => d.completed).length + 1);
        const totalDays = ability.totalDays || 21;
        const completedDays = ability.checkInData.filter(d => d.completed).length;
        
        // 更新进度信息（新ID）
        const progressInfo = document.getElementById('currentPlanProgressInfo');
        if (progressInfo) {
            progressInfo.innerHTML = `
                <div style="font-size: 16px; font-weight: 600;">
                    第 ${currentDay} 天 / 共 ${totalDays} 天
                </div>
                <div style="font-size: 14px; margin-top: 5px;">
                    已打卡：${completedDays}天
                </div>
            `;
        }
        
        // 显示方案内容（新ID）
        const content = document.getElementById('currentPlanContent');
        if (!content) return;
        
        const chapters = ability.path?.chapters || [];
        
        let phasesHTML = '';
        chapters.forEach((chapter, index) => {
            phasesHTML += `
                <div class="phase-item">
                    <div class="phase-header">
                        <span class="phase-name">${chapter.name}</span>
                        <span class="phase-days">${chapter.days}天</span>
                    </div>
                    <div class="phase-tasks">
                        ${chapter.tasks.map(task => `
                            <div class="phase-task">${task}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        content.innerHTML = `
            <div class="plan-summary">
                <div class="plan-stat">
                    <span class="stat-label">总天数</span>
                    <span class="stat-value">${totalDays}天</span>
                </div>
                <div class="plan-stat">
                    <span class="stat-label">已完成</span>
                    <span class="stat-value">${completedDays}天</span>
                </div>
                <div class="plan-stat">
                    <span class="stat-label">完成率</span>
                    <span class="stat-value">${Math.round(completedDays / totalDays * 100)}%</span>
                </div>
            </div>
            <div class="plan-phases">
                ${phasesHTML}
            </div>
        `;
    }
    
    // 渲染辅导对话（显示历史消息）
    renderCoachingChat(ability) {
        const messagesContainer = document.getElementById('coachingMessages');
        
        // 更新页面标题（显示计划名称）
        const pageTitle = document.querySelector('#coachingChatPage h2');
        if (pageTitle) {
            pageTitle.textContent = `${ability.name} - 辅导`;
        }
        
        // 清空并显示对话历史
        messagesContainer.innerHTML = '';
        
        if (!ability.coachingMessages) {
            ability.coachingMessages = [];
        }
        
        // 显示所有历史消息
        ability.coachingMessages.forEach(msg => {
            this.addCoachingMessage(msg.role, msg.content, false);
        });
        
        // 滚动到底部
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
    
    addCoachingMessage(role, content, saveToHistory = false) {
        const container = document.getElementById('coachingMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `coaching-message ${role}-message`;
        
        if (role === 'ai' || role === 'assistant' || role === 'system') {
            messageDiv.innerHTML = `
                <div class="message-avatar">🤗</div>
                <div class="message-content">${content}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-avatar">👤</div>
            `;
        }
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        // saveToHistory参数用于从历史中加载消息时避免重复保存
        // 新消息已经在sendCoachingMessage中添加到ability.coachingMessages
    }
    
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
        
        // 添加用户消息到历史
        ability.coachingMessages.push({
            role: 'user',
            content: message
        });
        
        // 显示用户消息
        this.addCoachingMessage('user', message);
        input.value = '';
        
        // AI回复
        this.showLoading(true, 'AI正在思考...');
        
        try {
            // 限制历史消息数量，避免请求过大
            const maxHistoryLength = 20; // 最多保留20条历史
            let history = ability.coachingMessages;
            if (history.length > maxHistoryLength) {
                // 保留最近的消息
                history = history.slice(-maxHistoryLength);
            }
            
            // 确保所有消息的role都是API接受的格式
            history = history.map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            }));
            
            const response = await deepseekAPI.coachingSession(
                this.userData.nickname,
                ability,
                history
            );
            
            this.showLoading(false);
            
            console.log('AI原始回复:', response);
            
            // 检查新的调整指令
            const hasProposePlan = response.includes('[PROPOSE_PLAN]');
            const hasConfirmPlan = response.includes('[CONFIRM_PLAN]');
            
            let cleanResponse = response;
            
            // 处理提议方案
            if (hasProposePlan) {
                const proposePlanMatch = response.match(/\[PROPOSE_PLAN\](.*?)\[\/PROPOSE_PLAN\]/);
                
                // 移除指令标记
                cleanResponse = response
                    .replace(/\[PROPOSE_PLAN\].*?\[\/PROPOSE_PLAN\]/g, '')
                    .trim();
                
                console.log('清理后的回复:', cleanResponse);
                
                // 添加AI回复到历史
                ability.coachingMessages.push({
                    role: 'assistant',
                    content: cleanResponse
                });
                
                // 显示AI回复
                this.addCoachingMessage('assistant', cleanResponse);
                
                // 解析并显示提议的方案
                if (proposePlanMatch) {
                    console.log('检测到提议方案:', proposePlanMatch[1]);
                    try {
                        const planData = JSON.parse(proposePlanMatch[1].trim());
                        this.showProposedPlan(planData);
                    } catch (e) {
                        console.error('方案解析失败:', e);
                        console.error('原始数据:', proposePlanMatch[1]);
                        this.addCoachingMessage('system', '❌ 方案生成失败，请重试。');
                    }
                }
            } 
            // 处理确认方案
            else if (hasConfirmPlan) {
                // 移除指令标记
                cleanResponse = response
                    .replace(/\[CONFIRM_PLAN\]\[\/CONFIRM_PLAN\]/g, '')
                    .replace(/\[CONFIRM_PLAN\]/g, '')
                    .trim();
                
                console.log('清理后的回复:', cleanResponse);
                
                // 添加AI回复到历史
                ability.coachingMessages.push({
                    role: 'assistant',
                    content: cleanResponse
                });
                
                // 显示AI回复
                this.addCoachingMessage('assistant', cleanResponse);
                
                // 应用已提议的方案
                this.confirmProposedPlan();
            } 
            // 普通对话
            else {
                console.log('普通对话，无调整指令');
                
                // 添加AI回复到历史
                ability.coachingMessages.push({
                    role: 'assistant',
                    content: response
                });
                
                // 显示AI回复
                this.addCoachingMessage('assistant', response);
            }
            
            // 保存数据
            this.saveAbilities();
        } catch (error) {
            this.showLoading(false);
            console.error('=== 辅导对话失败 ===');
            console.error('错误对象:', error);
            console.error('错误消息:', error.message);
            console.error('错误堆栈:', error.stack);
            console.error('当前能力ID:', this.currentAbilityId);
            const ability = this.abilities.find(a => a.id === this.currentAbilityId);
            console.error('当前能力数据:', ability);
            console.error('对话历史长度:', ability?.coachingMessages?.length);
            
            // 更友好的错误提示
            this.addCoachingMessage('system', '❌ AI暂时无法回复，可能是以下原因：\n1. 网络连接问题\n2. API调用失败\n3. 请检查浏览器控制台的详细错误信息\n\n建议：刷新页面后重试');
        }
    }
    
    requestPlanChange() {
        const input = document.getElementById('coachingInput');
        input.value = '我想调整一下学习计划';
        input.focus();
        
        // 提示AI
        this.addCoachingMessage('system', '💡 提示：告诉AI你遇到了什么问题，想要如何调整。AI会根据你的需求生成新方案供你确认。');
    }
    
    // 显示提议的方案（中间栏对比）
    showProposedPlan(planData) {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        // 临时保存提议的方案
        ability.proposedPlan = planData;
        this.saveAbilities();
        
        const currentDay = ability.currentDay || (ability.checkInData.filter(d => d.completed).length + 1);
        const completedDays = ability.checkInData.filter(d => d.completed).length;
        
        // 显示中间栏（新方案）
        const newPlanPanel = document.getElementById('newPlanPanel');
        if (newPlanPanel) {
            newPlanPanel.style.display = 'flex';
        }
        
        // 更新新方案进度信息
        const newProgressInfo = document.getElementById('newPlanProgressInfo');
        if (newProgressInfo) {
            newProgressInfo.innerHTML = `
                <div style="font-size: 16px; font-weight: 600; color: #f59e0b;">
                    第 ${currentDay} 天 / 共 ${planData.totalDays} 天
                </div>
                <div style="font-size: 14px; margin-top: 5px;">
                    已打卡：${completedDays}天（进度保持）
                </div>
            `;
        }
        
        // 显示新方案内容
        const newContent = document.getElementById('newPlanContent');
        if (!newContent) return;
        
        let phasesHTML = '';
        planData.phases.forEach((phase, index) => {
            phasesHTML += `
                <div class="phase-item">
                    <div class="phase-header">
                        <span class="phase-name">${phase.name}</span>
                        <span class="phase-days">${phase.days}天</span>
                    </div>
                    <div class="phase-tasks">
                        ${phase.tasks.map(task => `
                            <div class="phase-task">${task}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        newContent.innerHTML = `
            <div class="plan-summary">
                <div class="plan-stat">
                    <span class="stat-label">总天数</span>
                    <span class="stat-value">${planData.totalDays}天</span>
                </div>
                <div class="plan-stat">
                    <span class="stat-label">当前进度</span>
                    <span class="stat-value">${currentDay}/${planData.totalDays}</span>
                </div>
                <div class="plan-stat">
                    <span class="stat-label">已完成</span>
                    <span class="stat-value">${completedDays}天</span>
                </div>
            </div>
            <div class="plan-phases">
                ${phasesHTML}
            </div>
        `;
        
        this.addCoachingMessage('system', '💡 中间栏显示新方案预览，你可以左右对比。满意的话点击"✅ 确认使用新方案"。');
    }
    
    // 确认使用新方案
    confirmNewPlan() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability || !ability.proposedPlan) {
            alert('❌ 没有待确认的方案');
            return;
        }
        
        const planData = ability.proposedPlan;
        const oldDays = ability.totalDays || 21;
        const currentDay = ability.currentDay || 1;
        
        // 应用方案
        this.confirmProposedPlan();
        
        // 隐藏中间栏
        const newPlanPanel = document.getElementById('newPlanPanel');
        if (newPlanPanel) {
            newPlanPanel.style.display = 'none';
        }
        
        // 显示成功弹窗
        const message = `✅ 方案已成功更新！\n\n【调整内容】\n• 总天数：${oldDays}天 → ${planData.totalDays}天\n• 阶段数：${planData.phases.length}个\n• 当前进度：第${currentDay}天 / 共${planData.totalDays}天\n\n【重要提醒】\n✓ 你的学习进度保持不变\n✓ 新方案明天开始生效\n✓ 所有页面已同步更新\n\n继续加油！💪`;
        
        alert(message);
        
        // 添加系统消息
        this.addCoachingMessage('system', `✅ 方案更新成功！\n总天数：${oldDays}天 → ${planData.totalDays}天\n当前进度保持在第${currentDay}天`);
    }
    
    // 取消新方案，继续讨论
    cancelNewPlan() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (ability && ability.proposedPlan) {
            delete ability.proposedPlan;
            this.saveAbilities();
        }
        
        // 隐藏中间栏
        const newPlanPanel = document.getElementById('newPlanPanel');
        if (newPlanPanel) {
            newPlanPanel.style.display = 'none';
        }
        
        this.addCoachingMessage('system', '💬 已取消新方案，继续和AI讨论吧。');
    }
    
    // 确认并应用提议的方案
    confirmProposedPlan() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability || !ability.proposedPlan) {
            this.addCoachingMessage('system', '❌ 没有待确认的方案');
            return;
        }
        
        const planData = ability.proposedPlan;
        const currentDay = ability.currentDay || (ability.checkInData.filter(d => d.completed).length + 1);
        const oldDays = ability.totalDays || 21;
        
        // 应用新方案（保持当前进度）
        ability.totalDays = planData.totalDays;
        ability.currentDay = currentDay; // 关键：保持当前进度
        ability.path = this.generatePathFromPhases(planData.phases);
        
        // 清除提议的方案
        delete ability.proposedPlan;
        
        // 记录调整历史
        if (!ability.planAdjustments) {
            ability.planAdjustments = [];
        }
        
        ability.planAdjustments.push({
            date: new Date().toISOString(),
            type: 'full_plan',
            oldDays: oldDays,
            newDays: planData.totalDays,
            reason: 'AI辅导调整'
        });
        
        this.saveAbilities();
        
        // 更新显示
        this.displayCurrentPlan();
        this.refreshAllViews();
        
        this.addCoachingMessage('system', `✅ 方案已更新！\n• 总天数：${oldDays}天 → ${planData.totalDays}天\n• 当前进度：第${currentDay}天 / 共${planData.totalDays}天\n• 你的进度保持不变，明天开始按新方案执行`);
    }
    
    // 生成路径结构
    generatePathFromPhases(phases) {
        return {
            chapters: phases.map(phase => ({
                name: phase.name,
                days: phase.days,
                tasks: phase.tasks
            }))
        };
    }
    
    // 刷新所有视图
    refreshAllViews() {
        // 如果主页是活动的，刷新主页
        if (document.getElementById('homePage').classList.contains('active')) {
            this.loadHomePage();
        }
        // 刷新个人中心（如果打开）
        if (document.getElementById('profilePage').classList.contains('active')) {
            this.loadProfilePage();
        }
    }
    
    applyDaysAdjustment(newDays) {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        // 验证天数范围
        if (newDays < 21 || newDays > 90) {
            console.error('天数超出范围:', newDays);
            this.addCoachingMessage('system', '❌ 调整失败：天数必须在21-90天之间。');
            return;
        }
        
        const oldDays = ability.totalDays || 21;
        
        // 记录调整
        if (!ability.planAdjustments) {
            ability.planAdjustments = [];
        }
        
        ability.planAdjustments.push({
            date: new Date().toISOString(),
            type: 'days_only',
            oldDays: oldDays,
            newDays: newDays,
            appliedBy: 'ai'
        });
        
        // 立即更新天数
        ability.totalDays = newDays;
        
        // 标记当前辅导会话已调整方案
        if (this.currentCoachingSession) {
            this.currentCoachingSession.planAdjusted = true;
        }
        
        this.saveAbilities();
        
        // 显示确认信息
        this.addCoachingMessage('system', `✅ 天数已调整：${oldDays}天 → ${newDays}天`);
    }
    
    applyNewPlan(planData) {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        const { totalDays, phases } = planData;
        
        // 验证数据
        if (!totalDays || !phases || phases.length < 2) {
            this.addCoachingMessage('system', '❌ 计划格式错误');
            return;
        }
        
        if (totalDays < 21 || totalDays > 90) {
            this.addCoachingMessage('system', '❌ 天数必须在21-90天之间');
            return;
        }
        
        // 验证阶段天数总和
        const totalPhaseDays = phases.reduce((sum, p) => sum + (p.days || 0), 0);
        if (totalPhaseDays !== totalDays) {
            console.error('阶段天数不匹配:', totalPhaseDays, 'vs', totalDays);
            this.addCoachingMessage('system', '❌ 计划阶段天数与总天数不匹配');
            return;
        }
        
        // 保存旧计划
        const oldPlan = {
            totalDays: ability.totalDays,
            path: ability.path
        };
        
        // 记录调整
        if (!ability.planAdjustments) {
            ability.planAdjustments = [];
        }
        
        ability.planAdjustments.push({
            date: new Date().toISOString(),
            type: 'full_plan',
            oldDays: oldPlan.totalDays,
            newDays: totalDays,
            appliedBy: 'ai'
        });
        
        // 应用新计划
        ability.totalDays = totalDays;
        
        // 重新生成path结构（保持当前进度）
        const currentDay = ability.currentDay || 1;
        ability.path = this.generatePathFromPhases(phases, currentDay);
        
        // 标记当前辅导会话已调整方案
        if (this.currentCoachingSession) {
            this.currentCoachingSession.planAdjusted = true;
        }
        
        this.saveAbilities();
        
        // 显示确认信息
        this.addCoachingMessage('system', `✅ 新计划已生成！\n总天数：${totalDays}天\n阶段数：${phases.length}个\n当前进度：第${currentDay}天`);
    }
    
    generatePathFromPhases(phases, currentDay) {
        // 将phases转换为path结构
        const chapters = phases.map((phase, index) => {
            const startDay = index === 0 ? 1 : phases.slice(0, index).reduce((sum, p) => sum + p.days, 0) + 1;
            const endDay = startDay + phase.days - 1;
            
            return {
                chapterName: phase.name,
                goal: `完成${phase.name}的所有任务`,
                days: phase.days,
                startDay: startDay,
                endDay: endDay,
                dailyTasks: phase.tasks || [],
                exam: `${phase.name}综合评估`
            };
        });
        
        return { chapters };
    }
    
    showPlanAdjustmentDialog() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        // 创建弹窗
        const dialog = document.createElement('div');
        dialog.className = 'plan-adjustment-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay" onclick="this.parentElement.remove()"></div>
            <div class="dialog-content">
                <h3>📝 调整学习计划</h3>
                <p class="dialog-hint">根据你的实际情况调整计划，调整后将在明天生效</p>
                
                <div class="adjustment-form">
                    <div class="form-group">
                        <label>计划天数</label>
                        <input type="number" id="adjustTotalDays" value="${ability.totalDays || 21}" min="21" max="90">
                        <span class="form-hint">最少21天，最多90天</span>
                    </div>
                    
                    <div class="form-group">
                        <label>调整原因</label>
                        <textarea id="adjustReason" rows="3" placeholder="简单说说为什么要调整..."></textarea>
                    </div>
                </div>
                
                <div class="dialog-actions">
                    <button class="secondary-btn" onclick="this.closest('.plan-adjustment-dialog').remove()">
                        取消
                    </button>
                    <button class="primary-btn" onclick="app.applyPlanAdjustment()">
                        确认调整
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    applyPlanAdjustment() {
        const newDays = parseInt(document.getElementById('adjustTotalDays').value);
        const reason = document.getElementById('adjustReason').value.trim();
        
        if (newDays < 21 || newDays > 90) {
            alert('计划天数需要在21-90天之间');
            return;
        }
        
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) return;
        
        // 记录调整
        if (!ability.planAdjustments) {
            ability.planAdjustments = [];
        }
        
        ability.planAdjustments.push({
            date: new Date().toISOString(),
            oldDays: ability.totalDays,
            newDays: newDays,
            reason: reason,
            effectiveDate: new Date(Date.now() + 86400000).toISOString() // 明天生效
        });
        
        // 更新计划（明天生效，这里只记录）
        ability.pendingTotalDays = newDays;
        
        this.saveAbilities();
        
        // 关闭弹窗
        document.querySelector('.plan-adjustment-dialog').remove();
        
        // AI 提示
        this.addCoachingMessage('system', `✅ 计划调整已记录！新计划将从明天开始生效，总天数调整为 ${newDays} 天。`);
    }
    
    backToCoachingList() {
        this.showCoachingList();
    }
    
    
    // 编辑昵称
    editNickname() {
        const currentNickname = this.userData.nickname || '';
        const newNickname = prompt('请输入新昵称：', currentNickname);
        
        if (newNickname && newNickname.trim()) {
            this.userData.nickname = newNickname.trim();
            this.saveUserData();
            
            // 更新所有显示
            document.getElementById('profileNickname').textContent = newNickname.trim();
            document.getElementById('homeUserName').textContent = `你好，${newNickname.trim()}！`;
            
            alert('✅ 昵称已更新！');
        }
    }

    async generateAchievement(ability) {
        this.showLoading(true, '正在生成你的成就证书...');
        
        try {
            const completedDays = ability.checkInData.filter(d => d.completed).length;
            const review = await deepseekAPI.generateAchievementReview(
                ability.name,
                ability.checkInData
            );
            
            this.showLoading(false);
            this.displayAchievement(ability, review, completedDays);
        } catch (error) {
            this.showLoading(false);
            const defaultReview = '你刚刚完成了21天挑战！从第一天的紧张到现在的自信，你已经走过了一段不平凡的旅程。这不是"变厉害"，这是你本来就有的能力，只是现在，你终于看见了它。';
            this.displayAchievement(ability, defaultReview, 21);
        }
    }

    async displayAchievement(ability, review, completedDays) {
        // 不显示证书，改为成长总结
        const certificate = document.getElementById('certificate');
        certificate.style.display = 'none';
        
        const aiReview = document.getElementById('aiReview');
        aiReview.innerHTML = `
            <div class="completion-header">
                <h2>🎉 完成「${ability.name}」21天挑战</h2>
                <p class="completion-subtitle">你已经走过了一段不平凡的成长旅程</p>
            </div>
            <div class="ai-deep-review">${review}</div>
        `;
        
        // 生成21天总结
        this.generate21DaysSummary(ability);
        
        // 生成相关能力推荐
        await this.generateRelatedAbilities(ability);
        
        // 修改底部按钮
        const actionsDiv = document.querySelector('.achievement-actions');
        actionsDiv.innerHTML = `
            <button class="primary-btn" onclick="app.continueDeepInterview('${ability.id}')">
                🔍 继续深度访谈
            </button>
            <button class="secondary-btn" onclick="app.goToHome()">
                🏠 返回主页
            </button>
        `;
    }
    
    async generateRelatedAbilities(ability) {
        const summaryContainer = document.getElementById('summaryContent');
        
        // 在总结后添加相关能力推荐
        const relatedDiv = document.createElement('div');
        relatedDiv.className = 'related-abilities';
        relatedDiv.innerHTML = `
            <h4>🔗 你可能也需要提升</h4>
            <p class="related-intro">基于你在「${ability.name}」的成长，我发现这些能力也值得你关注：</p>
            <div id="relatedAbilitiesList" class="related-abilities-list">
                <div class="loading-text">AI正在分析...</div>
            </div>
        `;
        
        summaryContainer.appendChild(relatedDiv);
        
        // 调用AI生成相关能力推荐
        try {
            const recommendations = await deepseekAPI.generateRelatedAbilities(
                ability.name,
                ability.report,
                ability.checkInData
            );
            
            const listDiv = document.getElementById('relatedAbilitiesList');
            listDiv.innerHTML = '';
            
            recommendations.forEach(rec => {
                const card = document.createElement('div');
                card.className = 'related-ability-card';
                card.innerHTML = `
                    <div class="related-ability-icon">${rec.icon}</div>
                    <div class="related-ability-content">
                        <h5>${rec.name}</h5>
                        <p>${rec.reason}</p>
                        <button class="start-related-btn" onclick="app.startRelatedAbility('${rec.name}')">
                            开始学习
                        </button>
                    </div>
                `;
                listDiv.appendChild(card);
            });
        } catch (error) {
            console.error('生成相关能力推荐失败:', error);
            document.getElementById('relatedAbilitiesList').innerHTML = `
                <div class="related-ability-card">
                    <div class="related-ability-icon">💡</div>
                    <div class="related-ability-content">
                        <h5>逻辑思维能力</h5>
                        <p>清晰的逻辑能让你的表达更有说服力</p>
                        <button class="start-related-btn" onclick="app.startRelatedAbility('逻辑思维能力')">开始学习</button>
                    </div>
                </div>
                <div class="related-ability-card">
                    <div class="related-ability-icon">🎭</div>
                    <div class="related-ability-content">
                        <h5>情绪管理能力</h5>
                        <p>管理好情绪能帮你在压力下保持冷静表达</p>
                        <button class="start-related-btn" onclick="app.startRelatedAbility('情绪管理能力')">开始学习</button>
                    </div>
                </div>
                <div class="related-ability-card">
                    <div class="related-ability-icon">📖</div>
                    <div class="related-ability-content">
                        <h5>知识管理能力</h5>
                        <p>丰富的知识储备是自信表达的基础</p>
                        <button class="start-related-btn" onclick="app.startRelatedAbility('知识管理能力')">开始学习</button>
                    </div>
                </div>
            `;
        }
    }
    
    continueDeepInterview(abilityId) {
        // 继续深度访谈
        this.currentAbilityId = abilityId;
        this.interviewType = 'deep';
        this.interviewHistory = [];
        this.interviewRound = 1;
        
        this.showPage('interviewPage');
        this.startInterview();
    }
    
    startRelatedAbility(abilityName) {
        // 开始新的相关能力
        this.interviewType = 'ability';
        this.interviewHistory = [];
        this.interviewRound = 1;
        
        // 在对话中提及这是相关推荐
        this.showPage('interviewPage');
        this.startInterview();
    }
    
    // ========== 进展概览 ==========
    displayProgressOverview(ability) {
        const overview = document.getElementById('progressOverview');
        const completedDays = ability.checkInData.filter(d => d.completed).length;
        const totalDays = ability.totalDays || 21;
        const avgScore = ability.checkInData.reduce((sum, d) => sum + (d.score || 0), 0) / completedDays;
        
        let html = `
            <div class="progress-card">
                <h3>「${ability.name}」成长进展</h3>
                <div class="progress-stats">
                    <div class="stat-item">
                        <span class="stat-label">已完成</span>
                        <span class="stat-value">${completedDays}/${totalDays}天</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均得分</span>
                        <span class="stat-value">${avgScore.toFixed(1)}分</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">完成率</span>
                        <span class="stat-value">${((completedDays/totalDays)*100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        `;
        
        overview.innerHTML = html;
    }
    
    // ========== 方案展示功能 ==========
    async generatePlanPreview() {
        try {
            // 调用AI生成初步方案
            const plan = await deepseekAPI.generatePlanPreview(
                this.userData.nickname,
                this.interviewHistory,
                this.questionnaireAnswers
            );
            
            this.currentPlan = plan;
            this.displayPlanPreview(plan);
        } catch (error) {
            console.error('生成方案失败:', error);
            // 显示默认方案
            this.currentPlan = {
                ability: '沟通表达能力',
                goal: '在21天内提升职场沟通表达能力',
                phases: [
                    { name: '第一周：基础认知', tasks: ['了解表达的基本结构', '练习简单的自我介绍', '学习倾听技巧'] },
                    { name: '第二周：场景实战', tasks: ['会议发言练习', '一对一沟通演练', '处理突发状况'] },
                    { name: '第三周：进阶提升', tasks: ['复杂问题表达', '说服力训练', '综合应用'] }
                ]
            };
            this.displayPlanPreview(this.currentPlan);
        }
    }
    
    displayPlanPreview(plan) {
        const planDisplay = document.getElementById('planDisplay');
        const planContent = document.getElementById('planContent');
        
        // 检查元素是否存在
        if (!planDisplay || !planContent) {
            console.error('方案显示区域未找到！请检查 HTML 中是否存在 planDisplay 和 planContent 元素');
            alert('❌ 系统错误：无法显示方案预览区域。请刷新页面重试。');
            return;
        }
        
        // 计算总天数
        const totalDays = plan.phases.reduce((sum, phase) => {
            return sum + (phase.days || 7);
        }, 0);
        
        let html = `
            <div class="plan-summary">
                <div class="plan-item">
                    <span class="plan-label">🎯 目标能力</span>
                    <span class="plan-value">${plan.ability}</span>
                </div>
                <div class="plan-item">
                    <span class="plan-label">📅 成长目标</span>
                    <span class="plan-value">${plan.goal}</span>
                </div>
                <div class="plan-item">
                    <span class="plan-label">⏰ 计划天数</span>
                    <span class="plan-value">${totalDays}天</span>
                </div>
            </div>
            
            <div class="plan-phases">
                <h4>📚 详细计划</h4>
        `;
        
        plan.phases.forEach((phase, index) => {
            html += `
                <div class="phase-card">
                    <div class="phase-title">${phase.name}（${phase.days || 7}天）</div>
                    <ul class="phase-tasks">
                        ${phase.tasks.map(task => `<li>${task}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
        
        html += `
            </div>
            <div class="plan-actions">
                <p class="plan-hint">💡 这是初步方案，你可以继续和我讨论调整（包括天数和内容）</p>
                <div class="plan-action-buttons">
                    <button class="secondary-btn" onclick="app.continueDiscussPlan()">
                        💬 继续讨论
                    </button>
                    <button class="primary-btn" onclick="app.confirmInterviewPlan()">
                        ✅ 确认方案，开始挑战
                    </button>
                </div>
            </div>
        `;
        
        planContent.innerHTML = html;
        planDisplay.style.display = 'block';
        
        // 滚动到方案区域
        setTimeout(() => {
            planDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    togglePlanDisplay() {
        const planContent = document.getElementById('planContent');
        const toggleIcon = document.getElementById('planToggleIcon');
        
        if (planContent.style.display === 'none') {
            planContent.style.display = 'block';
            toggleIcon.textContent = '▼';
        } else {
            planContent.style.display = 'none';
            toggleIcon.textContent = '▶';
        }
    }
    
    // 确认方案并生成报告
    async confirmInterviewPlan() {
        if (!this.currentPlan) {
            alert('❌ 没有可确认的方案');
            return;
        }
        
        // 检查是否是零基础用户（从对话历史中判断）
        const conversationText = this.interviewHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content.toLowerCase())
            .join(' ');
        
        const isZeroBase = conversationText.includes('零基础') || 
                          conversationText.includes('没基础') || 
                          conversationText.includes('没有基础') ||
                          conversationText.includes('完全不会') ||
                          conversationText.includes('啥也不懂') ||
                          conversationText.includes('什么都不会') ||
                          conversationText.includes('从头开始') ||
                          conversationText.includes('完全不懂');
        
        if (isZeroBase) {
            // 零基础用户：跳过报告，直接创建能力
            this.addInterviewMessage('ai', '太好了！既然你是零基础，我会为你从头开始设计学习路径。让我们马上开始吧！');
            
            setTimeout(() => {
                this.createAbilityFromPlan();
            }, 1500);
        } else {
            // 有基础用户：显示报告
            this.addInterviewMessage('ai', '太好了！你已确认方案，让我为你生成完整的成长报告吧！');
            
            setTimeout(async () => {
                await this.generateReport();
            }, 1500);
        }
    }
    
    // 从方案直接创建能力（零基础用户）
    createAbilityFromPlan() {
        if (!this.currentPlan) {
            alert('❌ 方案数据丢失');
            return;
        }
        
        this.showLoading(true, '正在为你创建成长计划...');
        
        // 创建新能力
        const newAbility = {
            id: Date.now(),
            name: this.currentPlan.ability,
            startDate: new Date().toISOString().split('T')[0],
            totalDays: this.currentPlan.phases.reduce((sum, p) => sum + (p.days || 7), 0),
            currentDay: 1,
            path: {
                goal: this.currentPlan.goal,
                chapters: this.currentPlan.phases.map((phase, index) => ({
                    chapterNum: index + 1,
                    chapterName: phase.name,
                    days: phase.days || 7,
                    goal: phase.tasks.join('、'),
                    tasks: phase.tasks
                }))
            },
            checkInData: [],
            coachingSessions: [],
            planAdjustments: []
        };
        
        this.abilities.push(newAbility);
        this.saveAbilities();
        
        this.showLoading(false);
        
        // 显示路径页面
        this.currentAbilityId = newAbility.id;
        this.showPage('pathPage');
        this.displayPath({
            abilityName: newAbility.name,
            totalDays: newAbility.totalDays,
            chapters: newAbility.path.chapters
        });
    }
    
    // 继续讨论方案
    continueDiscussPlan() {
        // 滚动到输入框
        const inputSection = document.querySelector('.interview-input-section');
        if (inputSection) {
            inputSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        // 聚焦输入框
        const inputArea = document.getElementById('userInput');
        if (inputArea) {
            inputArea.focus();
        }
        
        // 添加提示消息
        this.addInterviewMessage('ai', '好的！你可以告诉我你想如何调整方案，比如增加/减少天数，或者修改某个阶段的内容。');
    }
    
    // ========== 动态问卷生成 ==========
    async generateDynamicQuestionnaire() {
        try {
            // 调用AI根据对话生成问卷
            const questionnaire = await deepseekAPI.generateQuestionnaire(
                null, // 不再使用身份信息
                this.interviewHistory
            );
            
            this.dynamicQuestions = questionnaire.questions;
            this.renderQuestionnaire(questionnaire);
        } catch (error) {
            console.error('生成问卷失败:', error);
            // 使用默认问卷
            this.dynamicQuestions = this.getDefaultQuestions();
            this.renderQuestionnaire({ 
                title: '能力深度调研问卷',
                intro: '根据我们的对话，我为你准备了一些深入问题，帮助更全面地了解你的情况。',
                questions: this.dynamicQuestions
            });
        }
    }
    
    getDefaultQuestions() {
        // 默认问卷（当AI生成失败时使用）
        return [
            { type: 'textarea', question: '请详细描述一个你最近遇到的具体困难场景？', placeholder: '时间、地点、人物、经过、结果...' },
            { type: 'textarea', question: '当时你的情绪和感受是什么？', placeholder: '紧张、焦虑、自我怀疑...' },
            { type: 'textarea', question: '你觉得问题的根源在哪里？', placeholder: '技巧？经验？心态？认知？' },
            { type: 'select', question: '这类问题出现的频率？', options: ['每天', '每周2-3次', '每周1次', '偶尔'] },
            { type: 'textarea', question: '你之前有尝试过改变吗？效果如何？', placeholder: '具体做了什么，为什么没效果...' },
            { type: 'select', question: '你每天能投入多少时间练习？', options: ['10-15分钟', '20-30分钟', '30-60分钟', '1小时以上'] },
            { type: 'textarea', question: '你理想中解决这个问题后是什么状态？', placeholder: '具体描述你期待的改变...' },
            { type: 'select', question: '你的学习风格？', options: ['理论学习', '实践为主', '模仿他人', '系统训练'] }
        ];
    }
    
    renderQuestionnaire(questionnaire) {
        const container = document.getElementById('questionnaireContent');
        const introDiv = document.querySelector('.questionnaire-intro p');
        
        if (questionnaire.title) {
            document.querySelector('#questionnairePage .page-header h2').textContent = questionnaire.title;
        }
        if (questionnaire.intro) {
            introDiv.textContent = questionnaire.intro;
        }
        
        container.innerHTML = '';
        
        questionnaire.questions.forEach((q, index) => {
            const block = document.createElement('div');
            block.className = 'question-block';
            
            let html = `<span class="question-number">问题 ${index + 1}/${questionnaire.questions.length}</span>`;
            html += `<div class="question-title">${q.question}</div>`;
            
            if (q.type === 'text') {
                html += `<input type="text" class="question-input" data-index="${index}" placeholder="${q.placeholder || ''}">`;
            } else if (q.type === 'textarea') {
                html += `<textarea class="question-input textarea" data-index="${index}" placeholder="${q.placeholder || ''}" rows="4"></textarea>`;
            } else if (q.type === 'select' || q.type === 'radio') {
                html += '<div class="question-options">';
                q.options.forEach((opt, i) => {
                    html += `
                        <div class="question-option">
                            <input type="radio" name="q${index}" id="q${index}_${i}" value="${opt}" data-index="${index}">
                            <label for="q${index}_${i}">${opt}</label>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            block.innerHTML = html;
            container.appendChild(block);
        });
    }
    
    submitQuestionnaire() {
        // 收集问卷答案
        const answers = [];
        const inputs = document.querySelectorAll('.question-input');
        const radios = document.querySelectorAll('input[type="radio"]:checked');
        
        // 文本和textarea输入
        inputs.forEach(input => {
            answers[input.dataset.index] = input.value.trim();
        });
        
        // 单选按钮
        radios.forEach(radio => {
            answers[radio.dataset.index] = radio.value;
        });
        
        const totalQuestions = this.dynamicQuestions ? this.dynamicQuestions.length : 8;
        const requiredAnswers = Math.ceil(totalQuestions * 0.7); // 至少回答70%
        
        // 检查是否回答了足够的问题
        if (answers.filter(a => a).length < requiredAnswers) {
            alert(`请至少回答${requiredAnswers}个问题`);
            return;
        }
        
        // 保存问卷答案
        this.questionnaireAnswers = answers;
        
        // 返回访谈页面，继续对话（AI已知问卷信息）
        this.showPage('interviewPage');
        
        // AI发起下一轮对话
        setTimeout(() => {
            this.showSpeechBubble('mentor', '谢谢你的详细回答！现在我对你的情况有了更全面的了解。让我们继续深入聊聊，一起商讨最适合你的成长方案吧。');
            setTimeout(() => {
                document.getElementById('inputPrompt').style.display = 'block';
            }, 2000);
        }, 500);
    }
    
    // ========== 21天完成总结 ==========
    generate21DaysSummary(ability) {
        const summaryContainer = document.getElementById('summaryContent');
        
        // 统计数据
        const completedDays = ability.checkInData.filter(d => d.completed).length;
        const totalScore = ability.checkInData.reduce((sum, d) => sum + (d.score || 0), 0);
        const avgScore = totalScore / completedDays;
        
        // 按章节统计
        const chapter1Days = ability.checkInData.slice(0, 7).filter(d => d.completed).length;
        const chapter2Days = ability.checkInData.slice(7, 14).filter(d => d.completed).length;
        const chapter3Days = ability.checkInData.slice(14, 21).filter(d => d.completed).length;
        
        let html = '';
        
        // 基础统计
        html += `
            <div class="summary-stat">
                <span class="stat-label">完成天数</span>
                <span class="stat-value">${completedDays}/21</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">平均得分</span>
                <span class="stat-value">${avgScore.toFixed(1)}分</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">完成率</span>
                <span class="stat-value">${((completedDays/21)*100).toFixed(0)}%</span>
            </div>
        `;
        
        // 章节进度图表
        html += `
            <div class="summary-chart">
                <h4 style="margin-bottom: 15px; font-size: 15px;">各章节完成情况</h4>
                <div class="chart-bar">
                    <span class="bar-label">第一章</span>
                    <div class="bar-fill-container">
                        <div class="bar-fill" style="width: ${(chapter1Days/7)*100}%"></div>
                    </div>
                    <span class="bar-value">${chapter1Days}/7</span>
                </div>
                <div class="chart-bar">
                    <span class="bar-label">第二章</span>
                    <div class="bar-fill-container">
                        <div class="bar-fill" style="width: ${(chapter2Days/7)*100}%"></div>
                    </div>
                    <span class="bar-value">${chapter2Days}/7</span>
                </div>
                <div class="chart-bar">
                    <span class="bar-label">第三章</span>
                    <div class="bar-fill-container">
                        <div class="bar-fill" style="width: ${(chapter3Days/7)*100}%"></div>
                    </div>
                    <span class="bar-value">${chapter3Days}/7</span>
                </div>
            </div>
        `;
        
        // 成长亮点
        html += `
            <div class="summary-highlights">
                <h4>🌟 你的成长亮点</h4>
                <ul>
                    <li>坚持完成了 ${completedDays} 天的练习，展现了强大的毅力</li>
                    <li>平均得分 ${avgScore.toFixed(1)} 分，${avgScore >= 85 ? '表现优秀' : '稳步进步'}</li>
                    <li>从第一章的基础到第三章的进阶，能力持续提升</li>
                    <li>每一次打卡都是对自己的承诺，你做到了！</li>
                </ul>
            </div>
        `;
        
        summaryContainer.innerHTML = html;
    }

    shareCertificate() {
        alert('分享功能开发中...');
    }

    startNewChallenge() {
        this.goToHome();
    }

    // ========== 视图切换 ==========
    showTaskView() {
        document.getElementById('taskView').style.display = 'block';
        document.getElementById('timelineView').style.display = 'none';
        document.getElementById('diaryView').style.display = 'none';
        
        // 更新导航激活状态
        document.querySelectorAll('.task-nav .nav-item').forEach((item, index) => {
            item.classList.toggle('active', index === 0);
        });
    }

    showTimelineView() {
        document.getElementById('taskView').style.display = 'none';
        document.getElementById('timelineView').style.display = 'block';
        document.getElementById('diaryView').style.display = 'none';
        
        document.querySelectorAll('.task-nav .nav-item').forEach((item, index) => {
            item.classList.toggle('active', index === 1);
        });
    }

    showDiaryView() {
        document.getElementById('taskView').style.display = 'none';
        document.getElementById('timelineView').style.display = 'none';
        document.getElementById('diaryView').style.display = 'block';
        
        document.querySelectorAll('.task-nav .nav-item').forEach((item, index) => {
            item.classList.toggle('active', index === 2);
        });
        
        this.loadDiaryList();
    }

    renderTimeline(ability) {
        const timeline = document.getElementById('timeline');
        
        // ✅ 核心修复：使用 ability.totalDays 而不是 CONFIG.TOTAL_DAYS
        const totalDays = ability.totalDays || 21;
        
        let html = '';
        for (let day = 1; day <= totalDays; day++) {
            const checkIn = ability.checkInData[day - 1];
            const isCompleted = checkIn && checkIn.completed;
            const isCurrent = day === ability.currentDay;
            
            let dotClass = 'day-dot';
            if (isCompleted) dotClass += ' completed';
            if (isCurrent) dotClass += ' current';
            
            html += `<div class="timeline-day">`;
            html += `<div class="${dotClass}">${isCompleted ? '✓' : day}</div>`;
            html += `<div class="day-label">第${day}天</div>`;
            html += '</div>';
        }
        
        timeline.innerHTML = html;
    }

    viewDay(day) {
        console.log('查看第' + day + '天');
    }

    // ========== 日记功能 ==========
    initMoodSelector() {
        const container = document.getElementById('moodSelector');
        if (!container) return;
        
        container.innerHTML = '';
        CONFIG.MOODS.forEach(mood => {
            const moodDiv = document.createElement('div');
            moodDiv.className = 'mood-item';
            moodDiv.onclick = () => this.selectMood(mood.value);
            moodDiv.innerHTML = `
                <div class="mood-emoji">${mood.emoji}</div>
                <div class="mood-label">${mood.label}</div>
            `;
            moodDiv.dataset.value = mood.value;
            container.appendChild(moodDiv);
        });
    }

    selectMood(moodValue) {
        this.selectedMood = moodValue;
        document.querySelectorAll('.mood-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.value === moodValue);
        });
    }

    showDiaryEditor() {
        document.getElementById('diaryEditor').style.display = 'block';
        document.getElementById('diaryList').style.display = 'none';
    }

    cancelDiary() {
        document.getElementById('diaryEditor').style.display = 'none';
        document.getElementById('diaryList').style.display = 'block';
        this.clearDiaryForm();
    }

    clearDiaryForm() {
        document.getElementById('diaryContent').value = '';
        document.getElementById('diaryImagePreview').innerHTML = '';
        this.selectedMood = null;
        this.diaryImages = [];
        document.querySelectorAll('.mood-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    uploadDiaryImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.diaryImages.push(event.target.result);
                    this.updateImagePreview();
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    }

    updateImagePreview() {
        const preview = document.getElementById('diaryImagePreview');
        preview.innerHTML = '';
        
        this.diaryImages.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'preview-image';
            div.innerHTML = `
                <img src="${img}" />
                <button class="remove-image-btn" onclick="app.removeDiaryImage(${index})">×</button>
            `;
            preview.appendChild(div);
        });
    }

    removeDiaryImage(index) {
        this.diaryImages.splice(index, 1);
        this.updateImagePreview();
    }

    saveDiary() {
        const content = document.getElementById('diaryContent').value.trim();
        
        if (!content) {
            alert('请输入日记内容');
            return;
        }
        
        if (!this.selectedMood) {
            alert('请选择今日心情');
            return;
        }
        
        // 创建日记记录
        const diary = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            mood: this.selectedMood,
            content: content,
            images: [...this.diaryImages],
            abilityId: this.currentAbilityId
        };
        
        this.diaries.unshift(diary);
        this.saveDiaries();
        
        alert('✅ 日记保存成功！');
        this.cancelDiary();
        this.loadDiaryList();
    }

    loadDiaryList() {
        const container = document.getElementById('diaryList');
        container.style.display = 'block';
        
        // 筛选当前能力的日记
        const diaries = this.diaries.filter(d => d.abilityId === this.currentAbilityId);
        
        if (diaries.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">还没有日记，点击"写日记"开始记录吧！</p>';
            return;
        }
        
        container.innerHTML = '';
        diaries.forEach(diary => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'diary-entry';
            
            const moodData = CONFIG.MOODS.find(m => m.value === diary.mood);
            const moodEmoji = moodData ? moodData.emoji : '😊';
            
            entryDiv.innerHTML = `
                <div class="diary-entry-header">
                    <div class="diary-date">${new Date(diary.date).toLocaleDateString('zh-CN')}</div>
                    <div class="diary-mood">${moodEmoji}</div>
                </div>
                <div class="diary-text">${diary.content}</div>
                ${diary.images.length > 0 ? `
                    <div class="diary-images">
                        ${diary.images.map(img => `
                            <div class="diary-image">
                                <img src="${img}" onclick="app.viewImage('${img}')" />
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
            
            container.appendChild(entryDiv);
        });
    }
    
    // ========== 独立日记页面功能 ==========
    loadAllDiaries() {
        const container = document.getElementById('diaryEntriesContainer');
        
        if (this.diaries.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">还没有日记，点击"写日记"开始记录吧！</p>';
            return;
        }
        
        container.innerHTML = '';
        this.diaries.forEach(diary => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'diary-entry';
            
            const moodData = CONFIG.MOODS.find(m => m.value === diary.mood);
            const moodEmoji = moodData ? moodData.emoji : '😊';
            
            // 获取关联的计划名称
            let abilityName = '';
            if (diary.abilityId) {
                const ability = this.abilities.find(a => a.id === diary.abilityId);
                abilityName = ability ? ability.name : '已删除的计划';
            }
            
            entryDiv.innerHTML = `
                <div class="diary-entry-header">
                    <div class="diary-date">${new Date(diary.date).toLocaleDateString('zh-CN')}</div>
                    <div class="diary-meta">
                        ${abilityName ? `<span class="diary-ability">📌 ${abilityName}</span>` : ''}
                        <span class="diary-mood">${moodEmoji}</span>
                    </div>
                </div>
                <div class="diary-text">${diary.content}</div>
                ${diary.images && diary.images.length > 0 ? `
                    <div class="diary-images">
                        ${diary.images.map(img => `
                            <div class="diary-image">
                                <img src="${img}" onclick="app.viewImage('${img}')" />
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
            
            container.appendChild(entryDiv);
        });
    }
    
    showDiaryEditorStandalone() {
        document.getElementById('diaryEditorStandalone').style.display = 'block';
        document.getElementById('diaryListStandalone').style.display = 'none';
        
        // 初始化心情选择器
        this.initMoodSelectorStandalone();
        
        // 填充计划选择器
        this.populateAbilitySelect();
    }
    
    initMoodSelectorStandalone() {
        const container = document.getElementById('moodSelectorStandalone');
        if (!container) return;
        
        container.innerHTML = '';
        CONFIG.MOODS.forEach(mood => {
            const moodDiv = document.createElement('div');
            moodDiv.className = 'mood-item';
            moodDiv.onclick = () => this.selectMoodStandalone(mood.value);
            moodDiv.innerHTML = `
                <div class="mood-emoji">${mood.emoji}</div>
                <div class="mood-label">${mood.label}</div>
            `;
            moodDiv.dataset.value = mood.value;
            container.appendChild(moodDiv);
        });
    }
    
    selectMoodStandalone(moodValue) {
        this.selectedMoodStandalone = moodValue;
        document.querySelectorAll('#moodSelectorStandalone .mood-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.value === moodValue);
        });
    }
    
    populateAbilitySelect() {
        const select = document.getElementById('diaryAbilitySelect');
        select.innerHTML = '<option value="">不关联任何计划</option>';
        
        // 添加所有进行中的计划
        this.abilities.forEach(ability => {
            if (!ability.completed) {
                const option = document.createElement('option');
                option.value = ability.id;
                option.textContent = ability.name;
                select.appendChild(option);
            }
        });
    }
    
    uploadDiaryImageStandalone() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (!this.diaryImagesStandalone) {
                        this.diaryImagesStandalone = [];
                    }
                    this.diaryImagesStandalone.push(event.target.result);
                    this.updateImagePreviewStandalone();
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    }
    
    updateImagePreviewStandalone() {
        const preview = document.getElementById('diaryImagePreviewStandalone');
        preview.innerHTML = '';
        
        if (!this.diaryImagesStandalone) return;
        
        this.diaryImagesStandalone.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'preview-image';
            div.innerHTML = `
                <img src="${img}" />
                <button class="remove-image-btn" onclick="app.removeDiaryImageStandalone(${index})">×</button>
            `;
            preview.appendChild(div);
        });
    }
    
    removeDiaryImageStandalone(index) {
        this.diaryImagesStandalone.splice(index, 1);
        this.updateImagePreviewStandalone();
    }
    
    saveDiaryStandalone() {
        const content = document.getElementById('diaryContentStandalone').value.trim();
        
        if (!content) {
            alert('请输入日记内容');
            return;
        }
        
        if (!this.selectedMoodStandalone) {
            alert('请选择今日心情');
            return;
        }
        
        // 获取选择的计划
        const abilitySelect = document.getElementById('diaryAbilitySelect');
        const selectedAbilityId = abilitySelect.value ? parseInt(abilitySelect.value) : null;
        
        // 创建日记记录
        const diary = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            mood: this.selectedMoodStandalone,
            content: content,
            images: this.diaryImagesStandalone ? [...this.diaryImagesStandalone] : [],
            abilityId: selectedAbilityId
        };
        
        this.diaries.unshift(diary);
        this.saveDiaries();
        
        alert('✅ 日记保存成功！');
        this.cancelDiaryStandalone();
        this.loadAllDiaries();
    }
    
    cancelDiaryStandalone() {
        document.getElementById('diaryEditorStandalone').style.display = 'none';
        document.getElementById('diaryListStandalone').style.display = 'block';
        this.clearDiaryFormStandalone();
    }
    
    clearDiaryFormStandalone() {
        document.getElementById('diaryContentStandalone').value = '';
        document.getElementById('diaryImagePreviewStandalone').innerHTML = '';
        document.getElementById('diaryAbilitySelect').value = '';
        this.selectedMoodStandalone = null;
        this.diaryImagesStandalone = [];
        document.querySelectorAll('#moodSelectorStandalone .mood-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    viewImage(imageSrc) {
        // 简单的图片查看
        window.open(imageSrc, '_blank');
    }
    
    // ========== 记录成长功能 ==========
    async recordGrowth() {
        const ability = this.abilities.find(a => a.id === this.currentAbilityId);
        if (!ability) {
            alert('❌ 未找到当前计划');
            return;
        }
        
        // 检查今天是否有对话记录
        if (!ability.coachingMessages || ability.coachingMessages.length === 0) {
            alert('📝 还没有辅导对话记录哦，先和AI聊聊吧！');
            return;
        }
        
        // 显示弹窗
        this.showGrowthRecordDialog(ability);
    }
    
    showGrowthRecordDialog(ability) {
        const dialog = document.getElementById('growthRecordDialog');
        dialog.style.display = 'flex';
        
        // 设置计划名称
        document.getElementById('growthRecordAbility').value = ability.name;
        
        // 初始化心情选择器
        this.initMoodSelectorGrowth();
        
        // 清空之前的数据
        this.selectedMoodGrowth = null;
        this.growthImages = [];
        document.getElementById('growthRecordContent').value = '';
        document.getElementById('growthImagePreview').innerHTML = '';
        document.getElementById('saveGrowthBtn').disabled = true;
        
        // 生成AI总结
        this.generateGrowthSummary(ability);
    }
    
    initMoodSelectorGrowth() {
        const container = document.getElementById('moodSelectorGrowth');
        if (!container) return;
        
        container.innerHTML = '';
        CONFIG.MOODS.forEach(mood => {
            const moodDiv = document.createElement('div');
            moodDiv.className = 'mood-item';
            moodDiv.onclick = () => this.selectMoodGrowth(mood.value);
            moodDiv.innerHTML = `
                <div class="mood-emoji">${mood.emoji}</div>
                <div class="mood-label">${mood.label}</div>
            `;
            moodDiv.dataset.value = mood.value;
            container.appendChild(moodDiv);
        });
    }
    
    selectMoodGrowth(moodValue) {
        this.selectedMoodGrowth = moodValue;
        document.querySelectorAll('#moodSelectorGrowth .mood-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.value === moodValue);
        });
        
        // 检查是否可以保存
        this.checkGrowthRecordReady();
    }
    
    async generateGrowthSummary(ability) {
        const loadingDiv = document.getElementById('growthSummaryLoading');
        const textarea = document.getElementById('growthRecordContent');
        
        // 显示加载状态
        loadingDiv.style.display = 'block';
        textarea.disabled = true;
        textarea.value = '';
        
        try {
            const nickname = this.userData.nickname || '朋友';
            const summary = await deepseekAPI.generateGrowthSummary(
                nickname,
                ability,
                ability.coachingMessages
            );
            
            // 显示总结
            textarea.value = summary;
            textarea.disabled = false;
            loadingDiv.style.display = 'none';
            
            // 检查是否可以保存
            this.checkGrowthRecordReady();
        } catch (error) {
            console.error('生成成长总结失败:', error);
            loadingDiv.style.display = 'none';
            textarea.disabled = false;
            textarea.value = '抱歉，AI总结生成失败。你可以手动编辑这里记录今天的成长。';
            alert('❌ AI总结生成失败，请手动编辑或重试');
        }
    }
    
    checkGrowthRecordReady() {
        const content = document.getElementById('growthRecordContent').value.trim();
        const saveBtn = document.getElementById('saveGrowthBtn');
        
        // 有内容且选择了心情才能保存
        if (content && this.selectedMoodGrowth) {
            saveBtn.disabled = false;
        } else {
            saveBtn.disabled = true;
        }
    }
    
    uploadGrowthImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (!this.growthImages) {
                        this.growthImages = [];
                    }
                    this.growthImages.push(event.target.result);
                    this.updateGrowthImagePreview();
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    }
    
    updateGrowthImagePreview() {
        const preview = document.getElementById('growthImagePreview');
        preview.innerHTML = '';
        
        if (!this.growthImages) return;
        
        this.growthImages.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'preview-image';
            div.innerHTML = `
                <img src="${img}" />
                <button class="remove-image-btn" onclick="app.removeGrowthImage(${index})">×</button>
            `;
            preview.appendChild(div);
        });
    }
    
    removeGrowthImage(index) {
        this.growthImages.splice(index, 1);
        this.updateGrowthImagePreview();
    }
    
    saveGrowthRecord() {
        const content = document.getElementById('growthRecordContent').value.trim();
        
        if (!content) {
            alert('请输入成长总结内容');
            return;
        }
        
        if (!this.selectedMoodGrowth) {
            alert('请选择今日心情');
            return;
        }
        
        // 创建日记记录
        const diary = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            mood: this.selectedMoodGrowth,
            content: content,
            images: this.growthImages ? [...this.growthImages] : [],
            abilityId: this.currentAbilityId,
            fromCoaching: true // 标记这是从辅导生成的
        };
        
        this.diaries.unshift(diary);
        this.saveDiaries();
        
        alert('✅ 成长记录已保存到日记！');
        this.closeGrowthRecordDialog();
    }
    
    closeGrowthRecordDialog() {
        const dialog = document.getElementById('growthRecordDialog');
        dialog.style.display = 'none';
        
        // 清空数据
        this.selectedMoodGrowth = null;
        this.growthImages = [];
    }

    showMenu() {
        alert('菜单功能开发中...');
    }

    // ========== 数据管理 ==========
    loadUserData() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : {
            identity: null,
            onboarded: false,
            joinDate: null,
            report: null
        };
    }

    saveUserData() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.userData));
    }

    loadAbilities() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.ABILITIES);
        return data ? JSON.parse(data) : [];
    }

    saveAbilities() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ABILITIES, JSON.stringify(this.abilities));
    }

    loadDiaries() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.DIARIES);
        return data ? JSON.parse(data) : [];
    }

    saveDiaries() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.DIARIES, JSON.stringify(this.diaries));
    }
    
    // ========== 删除计划功能 ==========
    showDeletePlanDialog(abilityId) {
        const ability = this.abilities.find(a => a.id === abilityId);
        if (!ability) return;
        
        const completedDays = ability.checkInData ? ability.checkInData.filter(d => d.completed).length : 0;
        const coachingCount = ability.coachingMessages ? ability.coachingMessages.length : 0;
        
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
                    <li>📝 打卡记录：${completedDays} 天</li>
                    <li>💬 辅导记录：${coachingCount} 条对话</li>
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
}

// 初始化应用
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new AbilityApp();
});

