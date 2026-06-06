const { getCurrentChild, getScoreRecords } = require('../../utils/storage')
const { getDateRange, formatDate } = require('../../utils/util')

function formatRecordDate(timestamp) {
  const d = new Date(timestamp)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

Page({
  data: {
    categoryName: '',
    grade: '',
    currentRange: '7d',
    dateRangeStr: '',
    stats: { income: 0, expense: 0, netValue: 0 },
    recordList: []
  },

  onLoad(options) {
    const categoryName = options.categoryName || ''
    const grade = options.grade || ''
    const range = options.range || '7d'
    this.setData({ categoryName, grade, currentRange: range })
    this.loadData()
  },

  loadData() {
    const child = getCurrentChild()
    if (!child) return

    const range = this.data.currentRange
    const { start, end, startStr, endStr } = getDateRange(range)
    this.setData({ dateRangeStr: `${startStr} - ${endStr}` })

    const allRecords = getScoreRecords(child.id, start, end)
    const categoryName = this.data.categoryName
    const grade = this.data.grade

    // 过滤记录
    let filtered
    if (grade) {
      filtered = allRecords.filter(r => r.grade === grade)
    } else {
      filtered = allRecords.filter(r => r.itemName === categoryName)
    }

    // 计算统计
    const income = filtered.reduce((sum, r) => sum + (r.score > 0 ? r.score : 0), 0)
    const expense = filtered.reduce((sum, r) => sum + (r.score < 0 ? Math.abs(r.score) : 0), 0)
    const netValue = income - expense

    // 格式化列表（按时间倒序）
    const recordList = filtered.sort((a, b) => b.timestamp - a.timestamp).map(r => ({
      id: r.id,
      name: r.itemName,
      score: r.score,
      dateStr: formatRecordDate(r.timestamp),
      isFreeScore: !!r.isFreeScore,
      planName: r.planName || ''
    }))

    this.setData({
      stats: { income, expense, netValue },
      recordList
    })
  },

  onRangeChange(e) {
    const range = e.currentTarget.dataset.range
    this.setData({ currentRange: range })
    this.loadData()
  }
})
