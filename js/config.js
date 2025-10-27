// 配置文件
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
        ABILITIES: 'ability_abilities',  // 多个能力
        DIARIES: 'ability_diaries',
        LAST_CHECK_IN_DATE: 'ability_last_checkin_date'
    },
    
    // 心情选项 (Emoji)
    MOODS: [
        { emoji: '😊', label: '开心', value: 'happy' },
        { emoji: '😌', label: '平静', value: 'calm' },
        { emoji: '🤔', label: '思考', value: 'thinking' },
        { emoji: '😤', label: '努力', value: 'motivated' },
        { emoji: '😰', label: '焦虑', value: 'anxious' },
        { emoji: '😴', label: '疲惫', value: 'tired' },
        { emoji: '🥳', label: '兴奋', value: 'excited' },
        { emoji: '😢', label: '难过', value: 'sad' },
        { emoji: '💪', label: '坚定', value: 'determined' },
        { emoji: '🤯', label: '崩溃', value: 'overwhelmed' }
    ]
};


