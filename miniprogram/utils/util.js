// util.js - 通用工具函数

/**
 * 生成唯一ID
 */
function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6)
}

/**
 * 格式化日期
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
}

/**
 * 获取日期范围
 * @param {string} range - '7d'|'30d'|'90d'|'half'|'year'
 */
function getDateRange(range) {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  switch (range) {
    case '7d': start.setDate(start.getDate() - 6); break
    case '30d': start.setDate(start.getDate() - 29); break
    case '90d': start.setDate(start.getDate() - 89); break
    case 'half': start.setMonth(start.getMonth() - 6); break
    case 'year': start.setFullYear(start.getFullYear() - 1); break
    default: start.setDate(start.getDate() - 6)
  }
  start.setHours(0, 0, 0, 0)

  return {
    start: start.getTime(),
    end: end.getTime(),
    startStr: formatDate(start),
    endStr: formatDate(end)
  }
}

/**
 * 频率显示文本
 */
function frequencyText(days) {
  if (!days || days.length === 7) return '每天'
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const sorted = [...days].sort((a, b) => a - b)
  // 检测连续区间
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return '每周六、日'
  if (sorted.length === 3 && sorted.includes(2) && sorted.includes(4) && sorted.includes(6)) return '每周二、四、六'
  return '每周' + sorted.map(d => dayNames[d]).join('、')
}

/**
 * 计算加入天数
 */
function daysSinceJoin(joinDate) {
  const join = new Date(joinDate)
  const now = new Date()
  const diff = Math.floor((now - join) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 1)
}

/**
 * 防抖
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 显示Toast
 */
function showToast(title, icon = 'none', duration = 1500) {
  wx.showToast({ title, icon, duration })
}

/**
 * 显示模态对话框
 */
function showModal(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmColor: '#FF8C00',
      success: (res) => resolve(res.confirm)
    })
  })
}

module.exports = {
  generateId,
  formatDate,
  getDateRange,
  frequencyText,
  daysSinceJoin,
  debounce,
  showToast,
  showModal
}
