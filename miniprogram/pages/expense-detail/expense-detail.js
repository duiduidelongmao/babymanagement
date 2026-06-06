const { getCurrentChild, getTodayScoreRecords, getTodayConsumptionRecords, deleteScoreRecord, deleteConsumptionRecord, isLoggedIn } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

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
    netValue: 0,
    recordCount: 0,
    income: 0,
    expense: 0,
    records: []
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

    const scoreRecords = getTodayScoreRecords(child.id)
    const consumptionRecords = getTodayConsumptionRecords(child.id)

    const income = scoreRecords.reduce((sum, r) => sum + (r.score > 0 ? r.score : 0), 0)
    const expenseScore = scoreRecords.reduce((sum, r) => sum + (r.score < 0 ? Math.abs(r.score) : 0), 0)
    const expenseConsumption = consumptionRecords.reduce((sum, r) => sum + r.points, 0)
    const expense = expenseScore + expenseConsumption
    const netValue = income - expense

    // 合并两类支出记录
    const negativeScoreRecords = scoreRecords
      .filter(r => r.score < 0)
      .map(r => ({
        ...r,
        timeStr: formatTime(r.timestamp),
        gradeClass: getGradeClass(r.grade),
        points: Math.abs(r.score)
      }))

    const consumptionItems = consumptionRecords.map(r => ({
      ...r,
      timeStr: formatTime(r.timestamp),
      itemName: r.rewardName || '积分兑换',
      points: r.points,
      grade: ''
    }))

    const allRecords = [...negativeScoreRecords, ...consumptionItems]
      .sort((a, b) => b.timestamp - a.timestamp)

    this.setData({
      netValue,
      recordCount: allRecords.length,
      income,
      expense,
      records: allRecords
    })
  },

  onGoIncome() {
    wx.navigateTo({ url: '/pages/income-detail/income-detail' })
  },

  onDeleteRecord(e) {
    const recordId = e.currentTarget.dataset.id
    const child = getCurrentChild()
    if (!child || !recordId) return

    showModal('删除后对应积分将退回，是否确认删除？', '确认删除').then(confirmed => {
      if (confirmed) {
        // 先尝试删除计分记录中的负分，再尝试删除消费记录
        let ok = deleteScoreRecord(recordId, child.id)
        if (!ok) {
          ok = deleteConsumptionRecord(recordId, child.id)
        }
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