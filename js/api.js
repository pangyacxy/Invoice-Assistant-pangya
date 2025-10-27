// DeepSeek API封装
class DeepSeekAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = CONFIG.API_URL;
        this.model = CONFIG.MODEL;
    }

    async chat(messages, temperature = 0.8) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: 2000
                })
            });

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
    }

    // 访谈阶段
    async interview(round, userAnswer, identity, history = [], interviewType = 'ability', questionnaireAnswers = null) {
        let systemPrompt = '';
        
        if (interviewType === 'deep') {
            // 深度访谈
            systemPrompt = `你是一位深度、开放、极具洞察力的「心灵访谈者」，正在与用户进行一场深入的对话。

你的目标：
- 通过开放式的提问，全面深入地了解用户
- 可以问任何问题，不设限制，从生活、工作、情感、价值观、人生观等多个维度探索
- 每轮对话只问一个问题，问题要深入、直接、有穿透力
- 用户回答后，你要先共情理解，再深入追问
- 访谈共8-12轮，循序渐进，从浅入深
- 当你认为已经充分了解用户时，回复"INTERVIEW_COMPLETE"作为结束信号

用户身份：${identity === 'worker' ? '打工人' : '大学生'}
当前轮数：${round}

可以问的问题方向（但不限于此）：
- 人生价值观：你觉得什么对你来说最重要？
- 内心恐惧：你最不敢面对的是什么？
- 人际关系：你和周围人的关系如何？
- 情感状态：最近有什么让你开心或难过的事？
- 人生困惑：现在最困扰你的问题是什么？
- 自我认知：你觉得自己是个什么样的人？
- 未来期待：你理想中的生活是什么样的？

请继续访谈，只返回你的提问，不要其他说明。如果已经可以生成深度分析报告，返回"INTERVIEW_COMPLETE"。`;
        } else {
            // 能力访谈
            let questionnaireInfo = '';
            if (questionnaireAnswers && questionnaireAnswers.length > 0) {
                questionnaireInfo = `\n用户已完成背景问卷，关键信息：
• 年龄职业：${questionnaireAnswers[0] || '未填'}，${questionnaireAnswers[1] || '未填'}
• 工作/学习年限：${questionnaireAnswers[2] || '未填'}
• 最大困难：${questionnaireAnswers[4] || '未填'}
• 表达失败经历：${questionnaireAnswers[7] || '未填'}
• 最想提升：${questionnaireAnswers[13] || '未填'}
• 期待改变：${questionnaireAnswers[19] || '未填'}

基于问卷信息，你只需3-5轮对话即可生成报告。不要重复问卷内容，而要深挖细节、情绪和认知。\n`;
            }
            
            systemPrompt = `你是一位温柔、专业、极具洞察力的「能力成长教练」，正在与用户进行一场轻松的访谈。
${questionnaireInfo}
用户身份：${identity === 'worker' ? '打工人' : '大学生'}
当前轮数：${round}

你的目标：
${questionnaireInfo ? 
`- 已知问卷信息，继续深入对话
- 结合问卷和对话，和用户一起商讨最适合的成长方案
- **重要：讨论方案时，要询问用户可投入时间和期望周期，灵活建议天数（21-90天）**
- 在对话中逐步明确方案细节（包括天数和内容）
- 当你觉得方案已经初步成型（再聊2-3轮），返回"GENERATE_PLAN_PREVIEW"生成方案
- 方案生成后，用户可以看到方案（包括总天数和各阶段天数）并继续和你讨论调整
- 用户可以要求调整天数或内容
- 当用户表示满意或确认方案时，返回"CONFIRM_PLAN"进入正式开始阶段` 
: 
`- 通过3-5轮对话，初步了解用户的能力短板方向
- 每轮对话只问一个问题，问题要短、具体、有画面感
- 用户回答后，你要先共情，再追问细节
- 当你大致了解方向后（3-5轮），返回"GENERATE_QUESTIONNAIRE"触发问卷生成`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【重要：零基础快速通道】

如果用户明确表示"完全零基础"、"啥也不懂"、"没有基础"、"完全不会"等情况：

✅ 直接跳过详细对话和问卷环节
✅ 立即返回 "GENERATE_PLAN_PREVIEW" 触发方案生成
✅ 为用户设计从零开始的基础学习路径

识别关键词：
- "啥也不懂" / "什么都不会" / "完全不懂"
- "零基础" / "没基础" / "没有基础"
- "从头开始" / "完全不会"
- 用户明确说自己是初学者且没有任何经验

示例对话：
用户："我对沟通表达完全不懂，啥也不会"
你："我理解！没关系，每个人都是从零开始的。既然你是零基础，我直接为你设计一个从基础到进阶的完整方案，让你一步步建立起沟通表达的能力。GENERATE_PLAN_PREVIEW"

用户："没有基础，想从头学"
你："太好了，有学习的决心就是最好的开始！我会为你设计一个零基础友好的学习计划，从最基本的概念开始，循序渐进。GENERATE_PLAN_PREVIEW"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

关键词触发规则：
1. "GENERATE_QUESTIONNAIRE" - 初步对话后，需要更详细信息时使用（仅一次）
2. "GENERATE_PLAN_PREVIEW" - 有问卷信息或零基础用户，可生成方案时使用（可多次）
   - 第一次：根据初步讨论生成方案
   - 后续：用户要求调整时，可再次使用生成新方案
3. "CONFIRM_PLAN" - 用户明确满意并确认方案，准备开始时使用（仅一次）

【重要：方案调整流程】
- 方案生成后，用户可能说"天数太短了"、"能延长到40天吗"、"第二阶段能简化吗"等
- 这时你应该：
  1. 理解用户需求
  2. 提出调整建议
  3. 再次使用 GENERATE_PLAN_PREVIEW 生成新方案
- 可以多次调整，直到用户满意

对话风格：
- 像朋友聊天一样自然
- 善于倾听和共情
- 帮助用户一起思考方案
- **讨论方案时主动询问时间投入，灵活建议天数**
- 方案要切合用户实际情况
- 对零基础用户更加耐心和鼓励

请继续对话，只返回你的回复。必要时使用关键词触发下一步。`;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history
        ];

        if (userAnswer) {
            messages.push({ role: 'user', content: userAnswer });
        }

        const response = await this.chat(messages);
        return response;
    }

    // 生成能力画像报告
    async generateReport(identity, interviewHistory, interviewType = 'ability') {
        let prompt = '';
        
        if (interviewType === 'deep') {
            // 深度访谈报告
            prompt = `根据以下深度访谈记录，对用户做一个全面深入的分析：

用户身份：${identity === 'worker' ? '打工人' : '大学生'}

访谈记录：
${interviewHistory.map((msg, i) => `${msg.role === 'assistant' ? 'AI访谈者' : '用户'}：${msg.content}`).join('\n')}

【要求】：
请深入分析用户，包含以下内容：
1. 核心价值观：提炼出用户最看重的3-5个核心价值观
2. 人格特质：分析用户的核心人格特质（性格、行为模式、思维方式）
3. 当前状态：用户目前的生活状态、情绪状态、面临的主要问题
4. 潜在问题：你觉得用户最不敢面对的5-10个问题是什么？
5. 深度建议：针对用户的情况，给出3-5条具体、深入、有价值的建议

语气要真诚、温暖、有深度，像一个理解你的朋友。

请以JSON格式输出：
{
  "type": "deep",
  "identity": "打工人/大学生",
  "coreValues": ["价值观1", "价值观2", "价值观3"],
  "personalityTraits": "人格特质描述（200-300字）",
  "currentState": "当前状态描述（150-200字）",
  "potentialIssues": [
    "问题1",
    "问题2",
    "问题3",
    ...
  ],
  "suggestions": [
    {
      "title": "建议标题",
      "content": "具体建议内容"
    }
  ],
  "summary": "总体评价和感受（150-200字）"
}`;
        } else {
            // 能力访谈报告
            // 从对话中提取用户明确提到的目标能力
            const conversationText = interviewHistory
                .filter(msg => msg.role === 'user')
                .map(msg => msg.content)
                .join(' ');
            
            prompt = `根据以下用户访谈记录，生成一份「能力画像报告」：

用户身份：${identity === 'worker' ? '打工人' : '大学生'}

访谈记录：
${interviewHistory.map((msg, i) => `${msg.role === 'assistant' ? 'AI教练' : '用户'}：${msg.content}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【重要：能力推荐原则】

1. **聚焦用户目标**：
   - 如果用户明确提到要学习某个具体技能（如Python、英语、Excel等），你只能推荐这个技能的细分能力
   - 例如：用户说"学Python" → 只推荐：Python基础、Python数据分析、Python爬虫等Python相关能力
   - 例如：用户说"学英语" → 只推荐：英语口语、英语听力、英语写作等英语相关能力

2. **不擅自推荐软技能**：
   - 不要推荐"时间管理"、"归纳总结"、"情绪管理"等软技能
   - 除非：用户在访谈中明确表达了这些方面的困扰
   - 例如：用户说"我总是拖延"、"我经常焦虑" → 才可以推荐时间管理、情绪管理

3. **能力细分而非扩展**：
   - 用户要学Python → 细分Python的不同方向（基础、爬虫、数据分析、Web开发）
   - 用户要学Python → 不要推荐Excel、SQL等其他技能
   - 用户要学英语 → 细分英语的不同技能（口语、写作、听力、阅读）
   - 用户要学英语 → 不要推荐日语、法语等其他语言

4. **推荐数量**：
   - 如果用户目标明确：推荐1个能力即可（就是用户想学的那个）
   - 如果用户目标模糊：推荐1-2个最匹配的能力

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【报告要求】：
- 报告要温柔、具体、有画面感
- 指出"你不是不会，你只是缺一个方法"
- 推荐能力要严格遵循上述原则
- 每个能力用1句话说明"它如何帮你解决你刚说的那个场景"
- 最后说："我已经为你准备好成长计划，准备好开始了吗？"

请以JSON格式输出：
{
  "type": "ability",
  "identity": "打工人/大学生",
  "mainScenario": "主要场景描述",
  "corePain": "核心痛点",
  "emotion": "情绪状态",
  "recommendedAbilities": [
    {
      "name": "能力名称（必须与用户目标一致或相关）",
      "reason": "推荐理由（说明如何解决用户场景中的问题）"
    }
  ],
  "summary": "总结文字"
}`;
        }

        const messages = [
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages, 0.7);
        
        // 尝试提取JSON
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败，返回原始响应');
        }
        
        return response;
    }

    // 生成成长路径
    async generatePath(abilityName, userLevel = '初学者') {
        const prompt = `你是一位「能力路径设计师」，擅长把一个大能力拆成21天可执行的小任务。

【输入】：
能力名称：${abilityName}
当前水平：${userLevel}
每天投入时间：10-15分钟

【输出要求】：
设计一个21天成长路径，包含：
- 3个章节，每章7天
- 每章有明确目标
- 每天有具体可执行的小任务
- 每章结束有小考验收
- 任务要能通过语音/文字/照片完成

请以JSON格式输出：
{
  "abilityName": "能力名",
  "totalDays": 21,
  "chapters": [
    {
      "chapterNum": 1,
      "chapterName": "章节名",
      "days": 7,
      "goal": "本章目标",
      "dailyTasks": [
        "第1天任务描述",
        "第2天任务描述",
        ...
      ],
      "exam": "章节小考描述"
    }
  ]
}`;

        const messages = [
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages, 0.7);
        
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败');
        }
        
        return response;
    }

    // AI评估任务完成情况
    async evaluateTask(taskDescription, userSubmission) {
        const prompt = `你是一位温柔而专业的AI教练，正在评估用户的任务完成情况。

今日任务：${taskDescription}
用户提交：${userSubmission}

请给出：
1. 评分（0-100分）
2. 具体反馈（3-5句话，要具体、温柔、有建设性）
3. 改进建议（1-2点）

以JSON格式输出：
{
  "score": 85,
  "feedback": "具体反馈内容...",
  "suggestions": ["建议1", "建议2"]
}`;

        const messages = [
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages, 0.6);
        
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败');
        }
        
        return { score: 80, feedback: response, suggestions: [] };
    }

    // 生成成就评语
    async generateAchievementReview(abilityName, checkInData) {
        const completedDays = checkInData.filter(d => d.completed).length;
        const avgScore = checkInData.reduce((sum, d) => sum + (d.score || 0), 0) / completedDays;
        
        const prompt = `用户刚刚完成了「${abilityName}」21天挑战！

完成天数：${completedDays}/21天
平均得分：${avgScore.toFixed(1)}分

请写一段温暖、具体、有感染力的成就评语（100-150字），包含：
1. 回顾用户的成长历程（可以想象一些具体细节）
2. 肯定用户的进步
3. 鼓励用户继续成长

语气要像朋友一样温暖，不要说教，要有画面感。`;

        const messages = [
            { role: 'user', content: prompt }
        ];

        return await this.chat(messages, 0.9);
    }

    // 生成动态问卷（根据访谈内容定制）
    async generateQuestionnaire(identity, interviewHistory) {
        const conversationSummary = interviewHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content)
            .join('\n');
        
        const prompt = `基于以下用户访谈内容，为用户生成一份针对性的深度调研问卷。

用户身份：${identity === 'worker' ? '打工人' : '大学生'}

访谈对话：
${conversationSummary}

你的任务：
1. 分析用户在对话中提到的问题、场景、困难
2. 生成8-12个深度问题，帮助更全面了解用户
3. 问题类型要多样：选择题、文本输入、长文本
4. 问题要针对性强，不要泛泛而谈

请返回JSON格式：
{
  "title": "问卷标题",
  "intro": "问卷说明（1-2句话）",
  "questions": [
    {
      "type": "textarea",
      "question": "问题内容？",
      "placeholder": "提示文字"
    },
    {
      "type": "select",
      "question": "问题内容？",
      "options": ["选项1", "选项2", "选项3", "选项4"]
    }
  ]
}

只返回JSON，不要其他内容。`;

        const messages = [{ role: 'user', content: prompt }];
        const response = await this.chat(messages, 0.7);
        
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('问卷JSON解析失败:', e);
        }
        
        return {
            title: '能力深度调研问卷',
            intro: '根据我们的对话，我为你准备了一些深入问题。',
            questions: []
        };
    }

    // 生成相关能力推荐
    async generateRelatedAbilities(abilityName, abilityReport, checkInData) {
        const prompt = `用户刚刚完成了「${abilityName}」21天挑战。

请基于用户在这个能力上的成长，推荐3个相关的、值得他继续提升的能力。

要求：
1. 能力要与已完成的能力有关联性（互补或延伸）
2. 每个能力要说明推荐理由（为什么需要？）
3. 要有实际价值

请返回JSON格式：
[
  {
    "name": "能力名称",
    "icon": "emoji图标",
    "reason": "推荐理由（50字内）"
  }
]

只返回JSON数组，不要其他内容。`;

        const messages = [{ role: 'user', content: prompt }];
        const response = await this.chat(messages, 0.7);
        
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('相关能力JSON解析失败:', e);
        }
        
        return [
            { name: '逻辑思维能力', icon: '💡', reason: '清晰的逻辑能让你的表达更有说服力' },
            { name: '情绪管理能力', icon: '🎭', reason: '管理好情绪能帮你在压力下保持冷静表达' },
            { name: '知识管理能力', icon: '📖', reason: '丰富的知识储备是自信表达的基础' }
        ];
    }

    // 生成方案预览（在对话中展示）
    async generatePlanPreview(identity, interviewHistory, questionnaireAnswers) {
        const conversationSummary = interviewHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content)
            .join('\n');
        
        const questionnaireSummary = questionnaireAnswers ? 
            questionnaireAnswers.filter(a => a).slice(0, 5).join('\n') : '';
        
        const nickname = identity || '用户';
        
        const prompt = `根据以下用户信息，生成一份初步的能力提升方案。

用户昵称：${nickname}

对话内容：
${conversationSummary}

问卷回答（部分）：
${questionnaireSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【方案设计原则】

1. **天数灵活性：**
   - 根据用户的基础、目标、可投入时间灵活设定
   - 建议范围：21-90天
   - 零基础用户建议40-60天
   - 有基础用户可以21-30天
   - 复杂技能建议60-90天

2. **阶段划分：**
   - 通常分为3个阶段
   - 每个阶段的天数可以不相等
   - 根据学习曲线合理分配时间

3. **任务设计：**
   - 每阶段3-5个关键任务
   - 任务要具体、可执行、能通过打卡完成
   - 循序渐进，由易到难

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【示例1：零基础用户】
能力：口述表达
基础：完全不会
→ 建议40天，分3阶段：15天+15天+10天

【示例2：有基础用户】
能力：Excel数据处理
基础：会基本操作
→ 建议25天，分3阶段：8天+10天+7天

【示例3：复杂技能】
能力：Python编程
基础：零基础
→ 建议60天，分3阶段：20天+25天+15天

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请生成一份方案，必须包含每个阶段的天数！

返回JSON格式：
{
  "ability": "能力名称",
  "goal": "成长目标描述",
  "totalDays": 40,
  "phases": [
    {
      "name": "第一阶段：基础夯实",
      "days": 15,
      "tasks": ["任务1", "任务2", "任务3", "任务4"]
    },
    {
      "name": "第二阶段：深入实践",
      "days": 15,
      "tasks": ["任务1", "任务2", "任务3"]
    },
    {
      "name": "第三阶段：综合提升",
      "days": 10,
      "tasks": ["任务1", "任务2", "任务3"]
    }
  ]
}

重要约束：
- totalDays必须等于所有phase的days之和
- 每个phase必须有days字段
- days最小为5，最大为30
- totalDays范围：21-90

只返回JSON，不要其他内容。`;

        const messages = [{ role: 'user', content: prompt }];
        const response = await this.chat(messages, 0.7);
        
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const plan = JSON.parse(jsonMatch[0]);
                // 确保至少21天
                if (plan.totalDays < 21) {
                    plan.totalDays = 21;
                }
                return plan;
            }
        } catch (e) {
            console.error('方案JSON解析失败:', e);
        }
        
        return {
            ability: '沟通表达能力',
            goal: '提升职场沟通表达能力',
            totalDays: 30,
            phases: [
                { name: '第一阶段：基础认知', tasks: ['了解表达的基本结构', '练习简单的自我介绍', '学习倾听技巧'] },
                { name: '第二阶段：场景实战', tasks: ['会议发言练习', '一对一沟通演练', '处理突发状况'] },
                { name: '第三阶段：进阶提升', tasks: ['复杂问题表达', '说服力训练', '综合应用'] }
            ]
        };
    }
    
    // 阶段辅导对话
    async coachingSession(nickname, ability, history) {
        const completedDays = ability.checkInData.filter(d => d.completed).length;
        const totalDays = ability.totalDays || 21;
        const currentDay = ability.currentDay || completedDays + 1;
        
        // 安全计算平均分
        let avgScore = 0;
        if (completedDays > 0) {
            avgScore = ability.checkInData.reduce((sum, d) => sum + (d.score || 0), 0) / completedDays;
        }
        
        const recentCheckIns = ability.checkInData
            .filter(d => d.completed)
            .slice(-5)
            .map(d => `第${d.day}天: ${d.aiReport || '完成'}`)
            .join('\n') || '暂无记录';
        
        // 当前方案信息
        const chapters = ability.path?.chapters || [];
        const currentPlan = chapters.length > 0 
            ? chapters.map((ch, i) => {
                const tasks = ch.tasks || [];
                const taskStr = tasks.length > 0 ? tasks.join('、') : '继续学习';
                return `阶段${i+1}：${ch.name || '阶段' + (i+1)}（${ch.days || 7}天）\n  任务：${taskStr}`;
              }).join('\n')
            : '无方案信息';
        
        const prompt = `你是一位温暖、专业的成长教练，正在和用户${nickname}进行阶段辅导对话。

【用户当前状态】
能力：${ability.name}
进度：第${currentDay}天 / 共${totalDays}天
${completedDays > 0 ? `已打卡：${completedDays}天\n平均得分：${avgScore.toFixed(1)}分` : '刚刚开始'}
${completedDays > 0 ? `\n最近记录：\n${recentCheckIns}` : ''}

【当前方案】
${currentPlan}

【对话历史】
${history.map(h => `${h.role === 'user' ? nickname : 'AI教练'}: ${h.content}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【你的任务】
1. 了解用户的感受和收获
2. 发现用户的进步和问题
3. 给予具体的建议和鼓励
4. 如果用户想调整方案，先充分了解需求再提出建议

【对话风格】
- 像朋友一样温暖、真诚
- 问题具体、有针对性
- 给出实用的建议
- 每次只问一个问题或给一个建议

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【重要：计划调整全新流程】

**核心原则：充分沟通、共同决策、保持进度**

**你可以调整的内容：**
1. ✅ 总天数（21-90天之间）
2. ✅ 阶段数量（2-5个阶段）
3. ✅ 每个阶段的天数
4. ✅ **每个阶段的任务节点**（重点！可以修改具体学习内容）

当用户提出想调整计划时，必须按以下流程进行：

═══ 第一步：充分了解需求（至少2-3轮对话）═══

不要立即修改！先询问：
1. "遇到什么问题了？是节奏太快、太慢，还是**内容不合适**？"
2. "具体哪个阶段或**哪些任务**让你觉得不舒服？"
3. "你希望**学什么内容**？想要怎样的节奏？"

**重要：询问时要关注具体的学习内容！**

示例对话1（调整节奏）：
用户："我想调整计划"
你："好的！你觉得现在的计划有什么问题吗？是节奏太快、太慢，还是学习内容不太适合你？"

示例对话2（调整内容）：
用户："第二阶段的任务太理论了"
你："我理解。你希望第二阶段多一些什么样的内容？比如实战练习、案例分析，还是其他？"

═══ 第二步：提议新方案（生成但不应用）═══

基于用户的反馈，提出建议：
- **可以调整天数**
- **可以调整任务节点**（修改学习内容）
- 在回复最后使用指令：[PROPOSE_PLAN]{...}[/PROPOSE_PLAN]
- 用户会在中间栏看到新方案预览，和左侧当前方案对比

JSON格式（必须一行）：
[PROPOSE_PLAN]{"totalDays":35,"phases":[{"name":"阶段名","days":12,"tasks":["任务1","任务2","任务3"]}]}[/PROPOSE_PLAN]

**重要约束：**
- totalDays范围：21-90天
- phases数组中各阶段days之和 = totalDays
- 至少2个阶段，最多5个阶段
- **每个阶段至少2个任务，最多5个任务**
- 任务要具体、可执行、有针对性

**修改任务节点示例：**

原方案任务：
name:"基础练习", tasks:["掌握概念","学习理论","完成作业"]

新方案任务（根据用户需求调整）：
name:"实战训练", tasks:["真实场景演练","案例深度分析","解决实际问题","总结反思"]

完整示例：
你："根据你的反馈，我重新设计了方案：

**原方案（21天）：**
- 阶段2：深入学习（7天）
  - 掌握核心知识
  - 理论学习
  - 完成练习

**新方案（35天）：**
- 阶段2：实战训练（15天）  ← 延长+内容调整
  - 真实场景模拟演练
  - 10个经典案例深度分析
  - 独立解决5个实际问题
  - 每周总结反思

主要改变：
• 天数：7天→15天，更充裕
• 内容：从理论学习改为**实战为主**
• 增加案例分析和实际问题解决

你看这样调整怎么样？[PROPOSE_PLAN]{"totalDays":35,"phases":[{"name":"基础夯实","days":10,"tasks":["掌握核心概念","建立知识框架","初步实践"]},{"name":"实战训练","days":15,"tasks":["真实场景模拟演练","10个经典案例深度分析","独立解决5个实际问题","每周总结反思"]},{"name":"综合提升","days":10,"tasks":["复杂情况应对","形成个人方法论","持续改进机制"]}]}[/PROPOSE_PLAN]"

═══ 第三步：用户对比确认 ═══

用户会看到三栏对比：
- 左侧：当前方案
- 中间：新方案预览（可对比任务节点差异）
- 右侧：继续对话

用户可能的反应：
- "看起来不错" / "可以" → 继续第四步
- "第二阶段的任务改成XXX" → 回到第二步，调整任务内容
- "天数改成40天" → 回到第二步，调整天数
- "不太合适..." → 回到第一步重新了解

═══ 第四步：用户点击确认 ═══

用户点击中间栏的"✅ 确认使用新方案"按钮后，使用：
[CONFIRM_PLAN][/CONFIRM_PLAN]

示例：
用户："好的，就按这个来吧"
你："太好了！新方案已经应用，明天开始生效。

✅ 调整完成：
• 总天数：21天 → 35天
• 阶段2任务：从理论学习改为实战训练
• 当前进度：第${currentDay}天 / 共35天（保持不变）

新方案更符合你的需求，加油！💪[CONFIRM_PLAN][/CONFIRM_PLAN]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【关键规则】

❌ 禁止行为：
1. 不要一听到"调整"就立即执行
2. 不要跳过询问环节
3. 不要在对话正文中提到指令名称

✅ 正确流程：
1. 询问（2-3轮）→ 2. 提议[PROPOSE_PLAN] → 3. 讨论 → 4. 确认[CONFIRM_PLAN]

✅ 重要提醒：
- 用户的当前进度（第${currentDay}天）会保持不变
- 只是总天数会改变，给用户更多或更少时间
- 所有修改明天生效

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

现在请继续对话，只返回你的回复。`;

        const messages = [
            { role: 'system', content: prompt },
            ...history
        ];
        
        return await this.chat(messages, 0.8);
    }
    
    // 生成辅导成长总结
    async generateGrowthSummary(nickname, ability, todayMessages) {
        // 筛选今天的对话
        const today = new Date().toLocaleDateString('zh-CN');
        const recentMessages = todayMessages.slice(-20); // 最近20条消息
        
        // 构建对话内容
        const conversationText = recentMessages
            .map(msg => {
                const role = msg.role === 'user' ? nickname : 'AI教练';
                return `${role}：${msg.content}`;
            })
            .join('\n\n');
        
        const prompt = `你是一位善于总结和反思的成长教练。

用户信息：
- 昵称：${nickname}
- 当前能力提升：${ability.name}
- 目标：${ability.path?.goal || '提升该能力'}
- 进度：第 ${ability.currentDay} / ${ability.totalDays} 天

今日辅导对话：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${conversationText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

任务：
请根据今天的辅导对话，为用户生成一份**成长日记**。

要求：
1. **总结今日收获**：今天在辅导中讨论了什么？有什么新的认知和理解？
2. **记录关键行动**：确定了什么行动计划？计划调整了什么内容？
3. **情感与感受**：用户在对话中表现出什么情绪？有什么困惑或突破？
4. **下一步方向**：基于今天的对话，用户接下来应该关注什么？

写作风格：
- 第一人称（"我"），像用户自己在写日记
- 真诚、反思性的语气
- 具体而不空洞，记录实际内容
- 300-500字

只返回日记正文，不要标题，不要"亲爱的日记"等开头。直接从内容开始。`;

        const messages = [{ role: 'user', content: prompt }];
        return await this.chat(messages, 0.7);
    }
}

// 创建全局API实例
const deepseekAPI = new DeepSeekAPI(CONFIG.API_KEY);


