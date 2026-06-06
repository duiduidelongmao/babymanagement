// storage.js - 数据存储与持久化模块

const { generateId } = require('./util')

// ===== 存储键名 =====
const KEYS = {
  LOGIN_USER: 'login_user',       // 当前登录用户信息
  CHILDREN: 'children',
  PLANS: 'plans',
  REWARDS: 'rewards',
  SCORE_RECORDS: 'score_records',
  CONSUMPTION_RECORDS: 'consumption_records',
  FAMILY_MEMBERS: 'family_members',
  FAMILY_NAME: 'family_name',
  INITIALIZED: 'initialized',     // 变为用户级: initialized_${userId}
  CURRENT_CHILD_ID: 'current_child_id'  // 当前选中的孩子ID（持久化）
}

// ===== 登录与用户管理 =====

/**
 * 获取当前登录用户
 * @returns {object|null} { userId, nickName, avatarUrl, loginTime } 或 null
 */
function getLoginUser() {
  const user = wx.getStorageSync(KEYS.LOGIN_USER)
  return user || null
}

/**
 * 是否已登录
 */
function isLoggedIn() {
  return !!getLoginUser()
}

/**
 * 获取当前用户ID（已登录返回userId，未登录返回空串）
 */
function getUserId() {
  const user = getLoginUser()
  return user ? user.userId : ''
}

/**
 * 微信登录
 * @param {string} nickName - 微信昵称
 * @param {string} avatarUrl - 微信头像URL
 */
function login(nickName, avatarUrl) {
  // 模拟生成 userId（真实场景由后端通过 wx.login + code 换取 openid）
  const userId = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6)
  const userInfo = {
    userId,
    nickName: nickName || '微信用户',
    avatarUrl: avatarUrl || '',
    loginTime: Date.now()
  }
  wx.setStorageSync(KEYS.LOGIN_USER, userInfo)

  // 初始化该用户的数据
  initUserData(userId)

  // 清除旧的孩子选中状态
  wx.removeStorageSync(KEYS.CURRENT_CHILD_ID)

  return userInfo
}

/**
 * 更新当前登录用户信息（修改昵称/头像）
 */
function updateLoginUser(updates) {
  const user = getLoginUser()
  if (!user) return
  const updated = { ...user, ...updates }
  wx.setStorageSync(KEYS.LOGIN_USER, updated)
  return updated
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync(KEYS.LOGIN_USER)
  wx.removeStorageSync(KEYS.CURRENT_CHILD_ID)
}

// ===== 用户级数据隔离 =====

/**
 * 获取用户级存储键名
 * 已登录时: key_userId
 * 未登录时: key（兼容旧数据）
 */
function getScopedKey(key) {
  const userId = getUserId()
  return userId ? `${key}_${userId}` : key
}

/**
 * 用户级读取
 */
function getData(key) {
  const scopedKey = getScopedKey(key)
  return wx.getStorageSync(scopedKey) || []
}

/**
 * 用户级写入
 */
function setData(key, data) {
  const scopedKey = getScopedKey(key)
  wx.setStorageSync(scopedKey, data)
}

// ===== 默认数据 =====

// ===== 内置模板 =====

const BUILTIN_TEMPLATES = [
  {
    id: 'tpl_lightweight',
    name: '轻量日常',
    icon: '🌱',
    description: '默认启用的轻量方案，只保留四个高频日常项目。',
    tags: ['日常', '6-12岁'],
    items: [
      { id: 'item_hw', name: '完成作业', icon: '✏️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '按时完成当天作业', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 6 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -4 } } },
      { id: 'item_read', name: '课外阅读', icon: '📚', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '阅读不少于20分钟', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_exercise', name: '户外运动', icon: '🏃', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '户外活动不少于30分钟', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_clean', name: '整理房间', icon: '🧹', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '书桌、床铺和地面整洁', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } }
    ]
  },
  {
    id: 'tpl_scholar',
    name: '学霸日常',
    icon: '📚',
    description: '上学日使用，覆盖学习、习惯、运动和家务。',
    tags: ['上学日', '6-12岁'],
    items: [
      { id: 'item_s_hw', name: '完成作业', icon: '✏️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '按时完成当天作业', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -5 } } },
      { id: 'item_s_morning', name: '早读打卡', icon: '🌅', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '早晨完成朗读或背诵', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_s_dictation', name: '英语听写', icon: '🎯', frequency: '每周六、日', frequencyDays: [0,6], description: '完成英语单词或句子听写', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_s_tutor', name: '英语外教', icon: '🎯', frequency: '每周二、四、六', frequencyDays: [2,4,6], description: '按时参加外教课并积极互动', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 6 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -4 } } },
      { id: 'item_s_read', name: '课外阅读', icon: '📚', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '阅读不少于20分钟', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_s_exercise', name: '户外运动', icon: '🏃', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '户外活动不少于30分钟', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_s_clean', name: '整理房间', icon: '🧹', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '书桌、床铺和地面整洁', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_s_habit', name: '习惯记录', icon: '📝', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '按约定完成习惯事项', grades: { 'A': { label: '优秀', score: 5 }, 'B': { label: '完成', score: 3 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_s_polite', name: '礼貌待人', icon: '👋', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '主动问好，使用礼貌用语', grades: { 'A': { label: '优秀', score: 5 }, 'B': { label: '完成', score: 3 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } }
    ]
  },
  {
    id: 'tpl_vacation',
    name: '假期规则',
    icon: '🏖️',
    description: '假期节奏使用，兼顾作业、运动和休息。',
    tags: ['周末假期', '6-12岁'],
    items: [
      { id: 'item_v_hw', name: '假期作业', icon: '✏️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '按计划完成假期作业', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 6 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -4 } } },
      { id: 'item_v_read', name: '自由阅读', icon: '📚', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '阅读喜欢的书籍不少于30分钟', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_v_outdoor', name: '户外活动', icon: '🏃', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '户外玩耍或运动不少于1小时', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_v_housework', name: '家务劳动', icon: '🧹', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '参与力所能及的家务', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_v_hobby', name: '兴趣时间', icon: '🎨', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '绘画、乐器、编程等兴趣活动', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } }
    ]
  },
  {
    id: 'tpl_preschool',
    name: '幼儿启蒙',
    icon: '🧸',
    description: '适合低龄孩子，重点放在自理和表达。',
    tags: ['启蒙阶段', '3-6岁'],
    items: [
      { id: 'item_p_dress', name: '自己穿衣', icon: '👕', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '尝试自己穿脱衣服和鞋袜', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_p_tidy', name: '整理玩具', icon: '🧸', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '玩完玩具后放回原位', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_p_express', name: '主动表达', icon: '💬', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '用完整句子表达需求和感受', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_p_sleep', name: '规律作息', icon: '🌙', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '按时睡觉和起床', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_p_read', name: '亲子阅读', icon: '📖', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '和家长一起读绘本或故事', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } }
    ]
  },
  {
    id: 'tpl_primary',
    name: '小学学习',
    icon: '✏️',
    description: '学习任务更明确，适合课业稳定期。',
    tags: ['小学学习', '7-12岁'],
    items: [
      { id: 'item_pr_preview', name: '预习复习', icon: '📖', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '课前预习，课后及时复习', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_pr_notes', name: '课堂笔记', icon: '📝', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '认真记录课堂重点', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_pr_mistake', name: '错题整理', icon: '✂️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '整理错题并分析原因', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_pr_homework', name: '按时作业', icon: '✏️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '独立、按时完成各科作业', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 6 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -4 } } },
      { id: 'item_pr_ask', name: '主动提问', icon: '❓', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '遇到不懂主动请教老师或家长', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } }
    ]
  },
  {
    id: 'tpl_reading',
    name: '阅读写作',
    icon: '📖',
    description: '强化阅读、摘抄和表达能力。',
    tags: ['阅读计划', '6-14岁'],
    items: [
      { id: 'item_rd_daily', name: '每日阅读', icon: '📖', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '阅读不少于30分钟', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 6 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_rd_copy', name: '摘抄好句', icon: '📋', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '记录喜欢的句子', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_rd_write', name: '写作练习', icon: '📝', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '完成日记或小作文', grades: { 'A': { label: '优秀', score: 12 }, 'B': { label: '完成', score: 8 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -4 } } },
      { id: 'item_rd_retell', name: '复述表达', icon: '🎁', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '讲出读到的内容', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } },
      { id: 'item_rd_shelf', name: '整理书架', icon: '🏀', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '图书归位', grades: { 'A': { label: '优秀', score: 5 }, 'B': { label: '完成', score: 3 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: 0 } } }
    ]
  },
  {
    id: 'tpl_sports',
    name: '运动健康',
    icon: '⚽',
    description: '适合精力旺盛或需要增加运动的孩子。',
    tags: ['运动习惯', '5-14岁'],
    items: [
      { id: 'item_sp_morning', name: '晨间运动', icon: '🌅', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '早晨进行拉伸或慢跑', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_sp_rope', name: '跳绳打卡', icon: '🪢', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '完成规定次数的跳绳', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_sp_ball', name: '球类运动', icon: '⚽', frequency: '每周三、五、日', frequencyDays: [0,3,5], description: '篮球、足球或乒乓球等', grades: { 'A': { label: '优秀', score: 10 }, 'B': { label: '完成', score: 6 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -4 } } },
      { id: 'item_sp_eye', name: '护眼操', icon: '👀', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '认真做眼保健操', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_sp_sleep', name: '规律作息', icon: '🌙', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '早睡早起，保证充足睡眠', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } }
    ]
  },
  {
    id: 'tpl_chores',
    name: '家务责任',
    icon: '🏠',
    description: '培养家庭参与感和责任意识。',
    tags: ['家务习惯', '6-12岁'],
    items: [
      { id: 'item_ch_wash', name: '洗碗擦桌', icon: '🍽️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '饭后清洗餐具并擦净桌面', grades: { 'A': { label: '优秀', score: 8 }, 'B': { label: '完成', score: 5 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -3 } } },
      { id: 'item_ch_trash', name: '倒垃圾', icon: '🗑️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '定时清理家庭垃圾', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_ch_clothes', name: '叠衣服', icon: '👕', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '将自己的衣物叠放整齐', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_ch_plant', name: '浇花养护', icon: '🌱', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '照顾家中植物，定期浇水', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } },
      { id: 'item_ch_table', name: '餐前准备', icon: '🍽️', frequency: '每天', frequencyDays: [0,1,2,3,4,5,6], description: '摆放碗筷，帮忙端菜', grades: { 'A': { label: '优秀', score: 6 }, 'B': { label: '完成', score: 4 }, 'C': { label: '不合格', score: 0 }, 'D': { label: '未完成', score: -2 } } }
    ]
  }
]

let _builtinTemplatesCache = null

function getBuiltinTemplates() {
  if (!_builtinTemplatesCache) {
    _builtinTemplatesCache = JSON.parse(JSON.stringify(BUILTIN_TEMPLATES))
  }
  return JSON.parse(JSON.stringify(_builtinTemplatesCache))
}

function getTemplateById(templateId) {
  return BUILTIN_TEMPLATES.find(t => t.id === templateId)
}

function getDefaultPlans() {
  const tplLight = getTemplateById('tpl_lightweight')
  const tplScholar = getTemplateById('tpl_scholar')
  return [
    { ...JSON.parse(JSON.stringify(tplLight)), id: 'plan_lightweight', isActive: true },
    { ...JSON.parse(JSON.stringify(tplScholar)), id: 'plan_scholar', isActive: false }
  ]
}

function getDefaultRewards() {
  return [
    { id: 'reward_toy', name: '小玩具', icon: '🦆', category: '精选', description: '兑换一个喜欢的小玩具', points: 20 },
    { id: 'reward_game', name: '游戏时间', icon: '🎮', category: '玩具', description: '兑换一次约定的游戏时间', points: 30 },
    { id: 'reward_movie', name: '亲子电影', icon: '🎬', category: '活动体验', description: '周末一起看一场电影', points: 50 },
    { id: 'reward_paint', name: '亲子绘画', icon: '🎨', category: '学习创作', description: '一起完成一次画画或手工创作', points: 60 },
    { id: 'reward_dining', name: '外出就餐', icon: '🍔', category: '吃喝', description: '一起去喜欢的餐厅吃饭', points: 80 },
    { id: 'reward_park', name: '游乐场', icon: '🎪', category: '活动体验', description: '周末去游乐场玩一次', points: 100 }
  ]
}

function getDefaultChildren() {
  return [
    {
      id: 'child_1',
      name: '王小明',
      avatar: '🧒',
      joinDate: new Date().toISOString().split('T')[0],
      totalPoints: 0,
      consecutiveDays: 0
    }
  ]
}

// ===== 初始化 =====

/**
 * 应用启动时初始化（旧逻辑保留兼容）
 */
function initDefaultData() {
  // 不再自动初始化全局数据，由登录流程触发 initUserData
}

/**
 * 用户级数据初始化（登录后调用）
 */
function initUserData(userId) {
  const initKey = `${KEYS.INITIALIZED}_${userId}`
  if (wx.getStorageSync(initKey)) return

  wx.setStorageSync(`${KEYS.PLANS}_${userId}`, getDefaultPlans())
  wx.setStorageSync(`${KEYS.REWARDS}_${userId}`, getDefaultRewards())
  wx.setStorageSync(`${KEYS.CHILDREN}_${userId}`, getDefaultChildren())
  wx.setStorageSync(`${KEYS.SCORE_RECORDS}_${userId}`, [])
  wx.setStorageSync(`${KEYS.CONSUMPTION_RECORDS}_${userId}`, [])
  wx.setStorageSync(`${KEYS.FAMILY_MEMBERS}_${userId}`, [{ id: 'member_1', name: '爸爸', role: 'admin', nickname: '爸爸', avatar: '' }])
  wx.setStorageSync(`${KEYS.FAMILY_NAME}_${userId}`, '我的家庭')
  wx.setStorageSync(initKey, true)
}

// ===== 孩子管理 =====

function getChildren() {
  return getData(KEYS.CHILDREN)
}

function getChild(childId) {
  const children = getChildren()
  return children.find(c => c.id === childId)
}

function getCurrentChildId() {
  return wx.getStorageSync(KEYS.CURRENT_CHILD_ID) || ''
}

function setCurrentChildId(childId) {
  wx.setStorageSync(KEYS.CURRENT_CHILD_ID, childId)
  const app = getApp()
  if (app && app.globalData) app.globalData.currentChildId = childId
}

function clearCurrentChildId() {
  wx.removeStorageSync(KEYS.CURRENT_CHILD_ID)
  const app = getApp()
  if (app && app.globalData) app.globalData.currentChildId = null
}

function getCurrentChild() {
  const children = getChildren()
  if (children.length === 0) return null

  // 优先从 app.globalData 内存读取（切换后立即生效），再 fallback 到 storage
  const app = getApp()
  let currentChildId = (app && app.globalData && app.globalData.currentChildId) || getCurrentChildId()

  if (currentChildId) {
    return children.find(c => c.id === currentChildId) || children[0]
  }
  return children[0]
}

function updateChild(childId, updates) {
  const children = getChildren()
  const idx = children.findIndex(c => c.id === childId)
  if (idx >= 0) {
    children[idx] = { ...children[idx], ...updates }
    setData(KEYS.CHILDREN, children)
  }
}

// ===== 家庭共享 =====

function getFamilyName() {
  return getData(KEYS.FAMILY_NAME) || '我的家庭'
}

function setFamilyName(name) {
  setData(KEYS.FAMILY_NAME, name)
}

function getFamilyMembers() {
  return getData(KEYS.FAMILY_MEMBERS) || []
}

function updateFamilyMembers(members) {
  setData(KEYS.FAMILY_MEMBERS, members)
}

function updateMemberNickname(memberId, nickname) {
  const members = getFamilyMembers()
  const idx = members.findIndex(m => m.id === memberId)
  if (idx >= 0) {
    members[idx] = { ...members[idx], nickname }
    updateFamilyMembers(members)
    return true
  }
  return false
}

function addFamilyMember(member) {
  const members = getFamilyMembers()
  member.id = member.id || generateId()
  member.nickname = member.nickname || '成员'
  member.role = member.role || 'member'
  members.push(member)
  updateFamilyMembers(members)
  return member
}

function removeFamilyMember(memberId) {
  const members = getFamilyMembers()
  const idx = members.findIndex(m => m.id === memberId)
  if (idx >= 0) {
    members.splice(idx, 1)
    updateFamilyMembers(members)
    return true
  }
  return false
}

function addChild(child) {
  const children = getChildren()
  child.id = generateId()
  child.joinDate = new Date().toISOString().split('T')[0]
  child.totalPoints = 0
  child.consecutiveDays = 0
  children.push(child)
  setData(KEYS.CHILDREN, children)
  return child
}

function removeChild(childId) {
  let children = getChildren()
  children = children.filter(c => c.id !== childId)
  setData(KEYS.CHILDREN, children)
}

// ===== 方案管理 =====

function migrateItemGrades(item) {
  if (!item.grades || !item.grades['A+']) return false
  const old = item.grades
  item.grades = {
    'A': old['A+'],
    'B': old['A'],
    'C': old['B'],
    'D': old['D']
  }
  return true
}

function getPlans() {
  const plans = getData(KEYS.PLANS)
  let migrated = false
  plans.forEach(plan => {
    if (plan.items) {
      plan.items.forEach(item => {
        if (migrateItemGrades(item)) migrated = true
      })
    }
  })
  if (migrated) {
    setData(KEYS.PLANS, plans)
  }
  return plans
}

function isTemplateAdded(templateId) {
  const plans = getPlans()
  return plans.some(p => p.fromTemplateId === templateId || p.id === templateId)
}

function addPlanFromTemplate(templateId) {
  const tpl = getTemplateById(templateId)
  if (!tpl) return null
  const plan = JSON.parse(JSON.stringify(tpl))
  plan.fromTemplateId = templateId
  return addPlan(plan)
}

function getActivePlan() {
  const plans = getPlans()
  return plans.find(p => p.isActive) || plans[0]
}

function getPlan(planId) {
  const plans = getPlans()
  return plans.find(p => p.id === planId)
}

function addPlan(plan) {
  const plans = getPlans()
  plan.id = generateId()
  plan.isActive = false
  plan.items = plan.items || []
  plans.push(plan)
  setData(KEYS.PLANS, plans)
  return plan
}

function updatePlan(planId, updates) {
  const plans = getPlans()
  const idx = plans.findIndex(p => p.id === planId)
  if (idx >= 0) {
    plans[idx] = { ...plans[idx], ...updates }
    setData(KEYS.PLANS, plans)
  }
}

function switchActivePlan(planId) {
  const plans = getPlans()
  plans.forEach(p => { p.isActive = (p.id === planId) })
  setData(KEYS.PLANS, plans)
}

function deletePlan(planId) {
  let plans = getPlans()
  const matched = plans.find(p => p.id === planId)
  const wasActive = matched ? matched.isActive : false
  plans = plans.filter(p => p.id !== planId)
  if (wasActive && plans.length > 0) {
    plans[0].isActive = true
  }
  setData(KEYS.PLANS, plans)
}

// ===== 细项管理 =====

function addItem(planId, item) {
  const plans = getPlans()
  const plan = plans.find(p => p.id === planId)
  if (plan) {
    item.id = generateId()
    if (!item.frequencyDays) {
      item.frequencyDays = [0, 1, 2, 3, 4, 5, 6]
    }
    plan.items.push(item)
    setData(KEYS.PLANS, plans)
  }
  return item
}

function updateItem(planId, itemId, updates) {
  const plans = getPlans()
  const plan = plans.find(p => p.id === planId)
  if (plan) {
    const idx = plan.items.findIndex(i => i.id === itemId)
    if (idx >= 0) {
      plan.items[idx] = { ...plan.items[idx], ...updates }
      setData(KEYS.PLANS, plans)
    }
  }
}

function removeItem(planId, itemId) {
  const plans = getPlans()
  const plan = plans.find(p => p.id === planId)
  if (plan) {
    plan.items = plan.items.filter(i => i.id !== itemId)
    setData(KEYS.PLANS, plans)
  }
}

// ===== 计分记录 =====

function migrateRecordGrade(record) {
  if (record.gradeVersion === 2) return false
  const map = { 'A+': 'A', 'A': 'B', 'B': 'C' }
  if (map[record.grade]) {
    record.grade = map[record.grade]
  }
  record.gradeVersion = 2
  return true
}

function getScoreRecords(childId, startDate, endDate) {
  const records = getData(KEYS.SCORE_RECORDS)
  let migrated = false
  records.forEach(r => {
    if (migrateRecordGrade(r)) migrated = true
  })
  if (migrated) {
    setData(KEYS.SCORE_RECORDS, records)
  }
  let filtered = childId ? records.filter(r => r.childId === childId) : records
  if (startDate) {
    filtered = filtered.filter(r => r.timestamp >= startDate)
  }
  if (endDate) {
    filtered = filtered.filter(r => r.timestamp <= endDate)
  }
  return filtered
}

/**
 * 保存计分记录（同一天同项仅保留一条，更新时替换旧分）
 */
function saveScoreRecord(record) {
  const records = getData(KEYS.SCORE_RECORDS)
  const child = getChild(record.childId)

  // 获取当天起始和结束时间戳
  const now = new Date(record.timestamp || Date.now())
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayEnd = dayStart + 24 * 60 * 60 * 1000

  // 查找同一天同项的已有记录
  const existingIdx = records.findIndex(r =>
    r.childId === record.childId &&
    r.itemId === record.itemId &&
    r.timestamp >= dayStart &&
    r.timestamp < dayEnd
  )

  if (existingIdx >= 0) {
    const old = records[existingIdx]
    // 更新孩子积分：先减去旧分，再加新分
    if (child) {
      updateChild(record.childId, {
        totalPoints: child.totalPoints - old.score + record.score
      })
    }
    // 替换记录
    record.id = old.id
    record.timestamp = old.timestamp
    record.gradeVersion = 2
    records[existingIdx] = record
  } else {
    record.id = generateId()
    record.timestamp = record.timestamp || Date.now()
    record.gradeVersion = 2
    records.push(record)
    if (child) {
      updateChild(record.childId, {
        totalPoints: child.totalPoints + record.score
      })
    }
  }

  setData(KEYS.SCORE_RECORDS, records)
  return record
}

/**
 * 添加自由计分记录
 */
function addFreeScoreRecord(record) {
  const records = getData(KEYS.SCORE_RECORDS)
  record.id = generateId()
  record.timestamp = record.timestamp || Date.now()
  record.isFreeScore = true
  record.gradeVersion = 2
  records.push(record)
  setData(KEYS.SCORE_RECORDS, records)

  const child = getChild(record.childId)
  if (child) {
    updateChild(record.childId, {
      totalPoints: child.totalPoints + record.score
    })
  }
  return record
}

/**
 * 获取今日计分记录
 */
function getTodayScoreRecords(childId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getScoreRecords(childId, today.getTime(), tomorrow.getTime())
}

/**
 * 获取今日消耗记录
 */
function getTodayConsumptionRecords(childId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getConsumptionRecords(childId, today.getTime(), tomorrow.getTime())
}

/**
 * 删除计分记录（退回/扣减对应积分）
 */
function deleteScoreRecord(recordId, childId) {
  const records = getData(KEYS.SCORE_RECORDS)
  const idx = records.findIndex(r => r.id === recordId && r.childId === childId)
  if (idx < 0) return false

  const record = records[idx]
  records.splice(idx, 1)
  setData(KEYS.SCORE_RECORDS, records)

  // 更新孩子积分：删除记录时反向操作
  const child = getChild(childId)
  if (child) {
    updateChild(childId, {
      totalPoints: child.totalPoints - record.score
    })
  }
  return true
}

/**
 * 删除消费记录（退回积分）
 */
function deleteConsumptionRecord(recordId, childId) {
  const records = getData(KEYS.CONSUMPTION_RECORDS)
  const idx = records.findIndex(r => r.id === recordId && r.childId === childId)
  if (idx < 0) return false

  const record = records[idx]
  records.splice(idx, 1)
  setData(KEYS.CONSUMPTION_RECORDS, records)

  // 更新孩子积分：退回消费积分
  const child = getChild(childId)
  if (child) {
    updateChild(childId, {
      totalPoints: child.totalPoints + record.points
    })
  }
  return true
}

// ===== 消耗记录 =====

function getConsumptionRecords(childId, startDate, endDate) {
  const records = getData(KEYS.CONSUMPTION_RECORDS)
  let filtered = childId ? records.filter(r => r.childId === childId) : records
  if (startDate) {
    filtered = filtered.filter(r => r.timestamp >= startDate)
  }
  if (endDate) {
    filtered = filtered.filter(r => r.timestamp <= endDate)
  }
  return filtered
}

function addConsumptionRecord(record) {
  const records = getData(KEYS.CONSUMPTION_RECORDS)
  record.id = generateId()
  record.timestamp = record.timestamp || Date.now()
  records.push(record)
  setData(KEYS.CONSUMPTION_RECORDS, records)

  // 更新孩子积分
  const child = getChild(record.childId)
  if (child) {
    updateChild(record.childId, {
      totalPoints: child.totalPoints - record.points
    })
  }

  return record
}

// ===== 奖励管理 =====

function getRewards() {
  return getData(KEYS.REWARDS)
}

function addReward(reward) {
  const rewards = getRewards()
  reward.id = generateId()
  rewards.push(reward)
  setData(KEYS.REWARDS, rewards)
  return reward
}

function updateReward(rewardId, updates) {
  const rewards = getRewards()
  const idx = rewards.findIndex(r => r.id === rewardId)
  if (idx >= 0) {
    rewards[idx] = { ...rewards[idx], ...updates }
    setData(KEYS.REWARDS, rewards)
  }
}

function removeReward(rewardId) {
  let rewards = getRewards()
  rewards = rewards.filter(r => r.id !== rewardId)
  setData(KEYS.REWARDS, rewards)
}

// ===== 统计 =====

function getChildStats(childId, startDate, endDate) {
  const scoreRecords = getScoreRecords(childId, startDate, endDate)
  const consumptionRecords = getConsumptionRecords(childId, startDate, endDate)

  const income = scoreRecords.reduce((sum, r) => sum + (r.score > 0 ? r.score : 0), 0)
  const expense = consumptionRecords.reduce((sum, r) => sum + r.points, 0)
  const netValue = income - expense

  // 按分类累计
  const categoryMap = {}
  scoreRecords.forEach(r => {
    if (!categoryMap[r.itemName]) {
      categoryMap[r.itemName] = { income: 0, expense: 0, count: 0 }
    }
    if (r.score > 0) categoryMap[r.itemName].income += r.score
    else categoryMap[r.itemName].expense += Math.abs(r.score)
    categoryMap[r.itemName].count++
  })

  // 评分统计
  const gradeMap = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 }
  scoreRecords.forEach(r => { gradeMap[r.grade] = (gradeMap[r.grade] || 0) + 1 })

  // 每日变化（使用本地日期作为key，避免UTC偏移）
  function formatDateKey(ts) {
    const d = new Date(ts)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const dailyMap = {}
  scoreRecords.forEach(r => {
    const day = formatDateKey(r.timestamp)
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 }
    if (r.score > 0) dailyMap[day].income += r.score
    else dailyMap[day].expense += Math.abs(r.score)
  })
  consumptionRecords.forEach(r => {
    const day = formatDateKey(r.timestamp)
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 }
    dailyMap[day].expense += r.points
  })

  return { income, expense, netValue, categoryMap, gradeMap, dailyMap }
}

function getTodayStats(childId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const scoreRecords = getScoreRecords(childId, today.getTime(), tomorrow.getTime())
  const consumptionRecords = getConsumptionRecords(childId, today.getTime(), tomorrow.getTime())

  const income = scoreRecords.reduce((sum, r) => sum + (r.score > 0 ? r.score : 0), 0)
  const expense = consumptionRecords.reduce((sum, r) => sum + r.points, 0)
    + scoreRecords.reduce((sum, r) => sum + (r.score < 0 ? Math.abs(r.score) : 0), 0)

  return { income, expense }
}

/**
 * 清除所有应用数据
 */
function clearAllData() {
  const allKeys = wx.getStorageInfoSync().keys || []
  const appKeys = Object.values(KEYS)
  allKeys.forEach(key => {
    const isAppKey = appKeys.some(k => key === k || key.startsWith(k + '_'))
    if (isAppKey) {
      wx.removeStorageSync(key)
    }
  })
}

function getMonthConsumption(childId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const records = getConsumptionRecords(childId, startOfMonth)
  return records.reduce((sum, r) => sum + r.points, 0)
}

module.exports = {
  KEYS,
  initDefaultData,
  // 登录与用户
  getLoginUser, isLoggedIn, getUserId, login, updateLoginUser, logout,
  getChildren, getChild, getCurrentChild, getCurrentChildId, setCurrentChildId, clearCurrentChildId, updateChild, addChild, removeChild,
  // 家庭共享
  getFamilyName, setFamilyName, getFamilyMembers, updateMemberNickname, addFamilyMember, removeFamilyMember,
  // 方案管理
  getPlans, getActivePlan, getPlan, addPlan, updatePlan, switchActivePlan, deletePlan,
  addItem, updateItem, removeItem,
  // 模板
  getBuiltinTemplates, getTemplateById, isTemplateAdded, addPlanFromTemplate,
  // 计分记录
  getScoreRecords, saveScoreRecord, addFreeScoreRecord, getTodayScoreRecords, deleteScoreRecord,
  getConsumptionRecords, addConsumptionRecord, getTodayConsumptionRecords, deleteConsumptionRecord,
  getRewards, addReward, updateReward, removeReward,
  getChildStats, getTodayStats, getMonthConsumption,
  clearAllData,
  getData, setData
}
