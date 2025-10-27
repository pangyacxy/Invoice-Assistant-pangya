// 主应用逻辑 - 重新设计版本
class AbilityApp {
    constructor() {
        this.currentPage = 'welcomePage';
        this.userData = this.loadUserData();
        this.abilities = this.loadAbilities(); // 多个能力
        this.diaries = this.loadDiaries();
        this.interviewHistory = [];
        this.interviewRound = 0;
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
        if (loading && loadingText) {
            loadingText.textContent = text;
            if (show) {
                loading.classList.add('active');
            } else {
                loading.classList.remove('active');
            }
        }
    }

    // ========== 主页功能 ==========
    goToHome() {
        this.showPage('homePage');
        this.loadHomePage();
    }

    loadHomePage() {
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
        const progress = (ability.currentDay / CONFIG.TOTAL_DAYS) * 100;
        
        // 检查今天是否已打卡
        const todayChecked = this.isTodayChecked(ability.id);
        const statusText = todayChecked ? '✅ 今日已打卡' : '📝 待完成';
        
        card.innerHTML = `
            <div class="ability-card-header">
                <div class="ability-card-title">
                    <span class="ability-card-icon">${icon}</span>
                    <span>${ability.name}</span>
                </div>
                <div class="ability-card-day">第${ability.currentDay}/${CONFIG.TOTAL_DAYS}天</div>
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
        // 重新开始访谈流程
        this.showIdentitySelection();
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
        if (this.abilities.length > 0) {
            this.currentAbilityId = this.abilities[0].id;
            this.showPage('taskPage');
            this.showDiaryView();
        } else {
            alert('请先开始一个能力挑战');
        }
    }

    goToAchievements() {
        alert('成就页面开发中...');
    }

    // ========== 个人中心 ==========
    goToProfile() {
        this.showPage('profilePage');
        this.loadProfilePage();
    }

    loadProfilePage() {
        // 基本信息
        document.getElementById('profileIdentity').textContent = 
            this.userData.identity === 'worker' ? '打工人' : '大学生';
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
        
        this.abilities.forEach(ability => {
            const card = this.createAbilityCard(ability);
            progressContainer.appendChild(card);
        });
        
        // 统计数据
        const completed = this.abilities.filter(a => a.completed).length;
        const inProgress = this.abilities.filter(a => !a.completed).length;
        const diaries = this.diaries.length;
        
        // 计算最长连续
        let maxStreak = 0;
        this.abilities.forEach(a => {
            const streak = this.calculateStreak(a);
            if (streak > maxStreak) maxStreak = streak;
        });
        
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statInProgress').textContent = inProgress;
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

    // ========== 访谈功能 - 漫画式对话 ==========
    showIdentitySelection() {
        this.showPage('identityPage');
    }

    async selectIdentity(identity) {
        this.userData.identity = identity;
        if (!this.userData.joinDate) {
            this.userData.joinDate = new Date().toISOString();
        }
        this.saveUserData();
        
        this.showPage('interviewPage');
        await this.startInterview();
    }

    async startInterview() {
        this.interviewRound = 1;
        this.interviewHistory = [];
        
        // 第一个问题
        const firstQuestion = this.userData.identity === 'worker' 
            ? "最近有没有哪一刻，你觉得自己'明明准备好了，却就是说不出来'？" 
            : "有没有遇到过这样的时刻：你知道答案，但就是表达不清楚，让老师或面试官误解了你？";
        
        this.showSpeechBubble('mentor', firstQuestion);
        
        // 显示输入提示
        document.getElementById('inputPrompt').style.display = 'block';
        document.getElementById('inputPrompt').onclick = () => {
            document.getElementById('inputPrompt').style.display = 'none';
            document.getElementById('inputArea').style.display = 'block';
            document.getElementById('userInput').focus();
        };
    }

    showSpeechBubble(from, text) {
        const bubble = document.getElementById('speechBubble');
        const content = document.querySelector('.bubble-content');
        
        content.textContent = text;
        bubble.className = `speech-bubble from-${from}`;
        bubble.style.display = 'block';
        
        // 添加动画
        bubble.style.animation = 'bubbleAppear 0.3s ease';
    }

    cancelInput() {
        document.getElementById('inputArea').style.display = 'none';
        document.getElementById('inputPrompt').style.display = 'block';
        document.getElementById('userInput').value = '';
    }

    async sendMessage() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // 显示用户消息
        this.showSpeechBubble('user', message);
        input.value = '';
        
        // 隐藏输入区
        document.getElementById('inputArea').style.display = 'none';
        
        // 添加到历史
        this.interviewHistory.push({ role: 'user', content: message });
        
        // 调用AI
        this.showLoading(true);
        
        setTimeout(async () => {
            try {
                const response = await deepseekAPI.interview(
                    this.interviewRound,
                    message,
                    this.userData.identity,
                    this.interviewHistory
                );
                
                this.showLoading(false);
                
                // 检查是否结束
                if (response.includes('INTERVIEW_COMPLETE') || this.interviewRound >= 8) {
                    await this.generateReport();
                } else {
                    // 继续访谈
                    this.showSpeechBubble('mentor', response);
                    this.interviewHistory.push({ role: 'assistant', content: response });
                    this.interviewRound++;
                    
                    // 显示输入提示
                    document.getElementById('inputPrompt').style.display = 'block';
                    document.getElementById('inputPrompt').onclick = () => {
                        document.getElementById('inputPrompt').style.display = 'none';
                        document.getElementById('inputArea').style.display = 'block';
                        document.getElementById('userInput').focus();
                    };
                }
            } catch (error) {
                this.showLoading(false);
                this.showSpeechBubble('mentor', '抱歉，我遇到了一些问题。让我们换个角度继续聊吧。能跟我分享一个你最近遇到的具体困难吗？');
                
                document.getElementById('inputPrompt').style.display = 'block';
            }
        }, 1000);
    }

    async generateReport() {
        this.showLoading(true, '正在为你生成能力画像报告...');
        
        try {
            const report = await deepseekAPI.generateReport(
                this.userData.identity,
                this.interviewHistory
            );
            
            this.userData.report = report;
            this.userData.onboarded = true;
            this.saveUserData();
            
            this.showLoading(false);
            this.showPage('reportPage');
            this.displayReport(report);
        } catch (error) {
            console.error('生成报告失败:', error);
            this.showLoading(false);
            
            // 默认报告
            const defaultReport = {
                identity: this.userData.identity === 'worker' ? '打工人' : '大学生',
                mainScenario: '在表达和沟通场景中遇到困难',
                corePain: '想法清晰但表达不出来',
                emotion: '有些焦虑但愿意改变',
                recommendedAbilities: [
                    { name: '口述表达', reason: '帮助你在工作汇报、面试等场景中清晰表达' }
                ],
                summary: '通过我们的对话，我发现你不是不够努力，只是还没找到合适的表达方法。21天的系统训练可以帮助你建立信心。'
            };
            
            this.userData.report = defaultReport;
            this.saveUserData();
            this.showPage('reportPage');
            this.displayReport(defaultReport);
        }
    }

    displayReport(report) {
        const reportContent = document.getElementById('reportContent');
        
        let html = '<div class="report-section">';
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
        
        reportContent.innerHTML = html;
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
        
        const abilityData = getAbilityData(ability.name);
        if (!abilityData) return;
        
        // 更新导航标题
        document.getElementById('navAbilityName').textContent = ability.name;
        
        // 更新进度
        document.getElementById('currentDay').textContent = ability.currentDay;
        
        const dayData = getDayTask(ability.name, ability.currentDay);
        if (!dayData) return;
        
        document.getElementById('chapterName').textContent = dayData.chapter.chapterName;
        document.getElementById('chapterGoal').textContent = dayData.chapter.goal;
        
        // 检查今天是否已打卡
        const todayChecked = this.isTodayChecked(abilityId);
        const statusDiv = document.getElementById('checkInStatus');
        
        if (todayChecked) {
            statusDiv.innerHTML = '<div class="status-checked">✅ 今日已完成打卡</div>';
            document.getElementById('checkInBtn').disabled = true;
            document.getElementById('checkInBtn').textContent = '今日已打卡';
        } else {
            statusDiv.innerHTML = '<div class="status-pending">⏰ 今日待完成</div>';
            document.getElementById('checkInBtn').disabled = false;
            document.getElementById('checkInBtn').textContent = '完成今日打卡';
        }
        
        // 显示今日任务
        document.getElementById('taskContent').innerHTML = `<p>${dayData.task}</p>`;
        
        // 生成任务问题
        this.generateTaskQuestions(ability.currentDay);
        
        // 渲染时间轴
        this.renderTimeline(ability);
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
        
        // 获取小结
        const summary = document.getElementById('taskSummary').value.trim();
        if (!summary) {
            alert('请写下今日小结');
            return;
        }
        
        this.showLoading(true, 'AI正在生成今日总结...');
        
        // 调用AI生成总结
        setTimeout(async () => {
            const aiReport = await this.generateDailyReport(ability, summary);
            
            // 记录打卡
            const checkInRecord = ability.checkInData[ability.currentDay - 1];
            checkInRecord.completed = true;
            checkInRecord.date = new Date().toISOString();
            checkInRecord.answers = this.currentTaskAnswers || {};
            checkInRecord.summary = summary;
            checkInRecord.aiReport = aiReport;
            
            // 更新最后打卡日期
            ability.lastCheckInDate = new Date().toISOString();
            
            // 更新当前天数（如果不是最后一天）
            if (ability.currentDay < CONFIG.TOTAL_DAYS) {
                ability.currentDay++;
            } else {
                ability.completed = true;
            }
            
            this.saveAbilities();
            this.currentTaskAnswers = {};
            
            this.showLoading(false);
            
            // 显示AI反馈
            const feedbackDiv = document.getElementById('aiFeedback');
            feedbackDiv.style.display = 'block';
            feedbackDiv.innerHTML = `
                <h4>🤖 今日AI总结</h4>
                <div style="background: var(--background); padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <p>${aiReport}</p>
                </div>
            `;
            
            // 显示完成提示
            if (ability.completed) {
                setTimeout(() => {
                    alert('🎉 恭喜你完成21天挑战！');
                    this.completeChallenge(ability);
                }, 1000);
            } else {
                alert('✅ 打卡成功！\n已连续打卡 ' + ability.currentDay + ' 天');
                this.loadTaskPage(this.currentAbilityId);
            }
        }, 2000);
    }

    async generateDailyReport(ability, summary) {
        try {
            const dayData = getDayTask(ability.name, ability.currentDay);
            const prompt = `用户今天完成了「${ability.name}」第${ability.currentDay}天的任务。

任务内容：${dayData.task}

用户小结：${summary}

请生成一段简短的AI总结（50-80字），包含：
1. 肯定用户的完成情况
2. 指出亮点或需要改进的地方
3. 简短的鼓励

语气要温柔、具体、有画面感。`;

            const messages = [{ role: 'user', content: prompt }];
            const response = await deepseekAPI.chat(messages, 0.8);
            return response;
        } catch (error) {
            return `今天完成得不错！${summary}。继续保持，明天会更好！💪`;
        }
    }

    async completeChallenge(ability) {
        this.showPage('achievementPage');
        await this.generateAchievement(ability);
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

    displayAchievement(ability, review, completedDays) {
        const certificate = document.getElementById('certificate');
        
        let html = '<h2>🏆 能力养成证书</h2>';
        html += '<div class="certificate-info">';
        html += `<p>恭喜你完成</p>`;
        html += `<p><strong style="font-size: 20px;">「${ability.name}」</strong></p>`;
        html += `<p>21天成长挑战</p>`;
        html += `<p>连续打卡 ${completedDays} 天</p>`;
        html += '</div>';
        
        certificate.innerHTML = html;
        
        const aiReview = document.getElementById('aiReview');
        aiReview.innerHTML = review;
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
        
        let html = '';
        for (let day = 1; day <= CONFIG.TOTAL_DAYS; day++) {
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

    viewImage(imageSrc) {
        // 简单的图片查看
        window.open(imageSrc, '_blank');
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
}

// 初始化应用
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new AbilityApp();
});

