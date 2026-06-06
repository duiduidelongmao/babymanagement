const { getCurrentChild, addFreeScoreRecord, isLoggedIn } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

Page({
  data: {
    recordDate: '',
    scoreType: 'add',
    quickScores: [5, 10, 20, 50],
    selectedQuick: null,
    customScore: '',
    description: '',
    estimateScore: 0,
    canSave: false
  },

  onLoad() {
    const now = new Date()
    this.setData({
      recordDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      loggedIn: isLoggedIn()
    })
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      scoreType: type,
      selectedQuick: null,
      customScore: '',
      estimateScore: 0,
      canSave: false
    })
  },

  onQuickScoreSelect(e) {
    const score = e.currentTarget.dataset.score
    const val = String(score)
    this.setData({
      selectedQuick: score,
      customScore: val,
      estimateScore: this.data.scoreType === 'add' ? score : -score,
      canSave: true
    })
  },

  onScoreInput(e) {
    const val = e.detail.value
    const num = parseFloat(val) || 0
    const estimate = this.data.scoreType === 'add' ? num : -num
    this.setData({
      customScore: val,
      selectedQuick: null,
      estimateScore: estimate,
      canSave: num !== 0
    })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ recordDate: e.detail.value })
  },

  onGoLogin() {
    wx.switchTab({ url: '/pages/mine/mine' })
  },

  onSave() {
    if (!this.data.canSave) return
    const child = getCurrentChild()
    if (!child) return

    const score = this.data.estimateScore
    const [year, month, day] = this.data.recordDate.split('-').map(Number)
    const timestamp = new Date(year, month - 1, day).getTime()

    addFreeScoreRecord({
      childId: child.id,
      itemName: this.data.description || '自由计分',
      grade: '自由计分',
      score: score,
      timestamp: timestamp
    })

    showToast(`已保存：${score >= 0 ? '+' : ''}${score}分`, 'success')
    setTimeout(() => {
      wx.navigateBack()
    }, 600)
  }
})