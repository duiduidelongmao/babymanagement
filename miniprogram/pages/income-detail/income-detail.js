const { getCurrentChild, getScoreRecords, getTodayScoreRecords, deleteScoreRecord, isLoggedIn } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

function getDayRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const start = d.getTime()
  const end = start + 24 * 60 * 60 * 1000 - 1
  return { start, end }
}

function formatTime(timestamp) {
  const d = new Date(timestamp)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `今天 ${h}:${m}`
}

function getGradeClass(grade) {
  if (grade === 'A') return 'grade-a-plus'
  if (grade === 'B') return 'grade-a'
  if (grade === 'C') return 'grade-b'
  if (grade === 'D') return 'grade-d'
  return 'grade-free'
}

Page({
  data: {
    queryDate: '',
    netValue: 0,
    recordCount: 0,
    income: 0,
    expense: 0,
    records: []
  },

  onLoad(options) {
    if (options.date) {
      this.setData({ queryDate: options.date })
      wx.setNavigationBarTitle({ title: options.date + ' 收支明细' })
    }
  },

  onShow() {
    if (!isLoggedIn()) {
      wx.navigateBack()
      return
    }
    this.loadData()
  },

  loadData() {
    const child = getCurrentChild()
    if (!child) return

    let scoreRecords
    if (this.data.queryDate) {
      const { start, end } = getDayRange(this.data.queryDate)
      scoreRecords = getScoreRecords(child.id, start, end)
    } else {
      scoreRecords = getTodayScoreRecords(child.id)
    }

    const income = scoreRecords.reduce((sum, r) => sum + (r.score > 0 ? r.score : 0), 0)
    const expense = scoreRecords.reduce((sum, r) => sum + (r.score < 0 ? Math.abs(r.score) : 0), 0)
    const netValue = income - expense

    const records = scoreRecords.map(r => ({
      ...r,
      timeStr: formatTime(r.timestamp),
      gradeClass: getGradeClass(r.grade),
      icon: r.isFreeScore ? '✨' : ''
    })).sort((a, b) => b.timestamp - a.timestamp)

    this.setData({
      netValue,
      recordCount: records.length,
      income,
      expense,
      records
    })
  },

  onGoExpense() {
    wx.navigateTo({ url: '/pages/expense-detail/expense-detail' })
  },

  onDeleteRecord(e) {
    const recordId = e.currentTarget.dataset.id
    const child = getCurrentChild()
    if (!child || !recordId) return

    showModal('删除后对应积分将退回/扣减，是否确认删除？', '确认删除').then(confirmed => {
      if (confirmed) {
        const ok = deleteScoreRecord(recordId, child.id)
        if (ok) {
          showToast('已删除', 'success')
          this.loadData()
        } else {
          showToast('删除失败')
        }
      }
    })
  }
})