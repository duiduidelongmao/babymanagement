const { getCurrentChild, getActivePlan, saveScoreRecord, isLoggedIn } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

Page({
  data: {
    habitItems: [],
    selections: {},
    selectedCount: 0,
    totalScore: 0,
    recordDate: ''
  },

  onLoad() {
    if (!isLoggedIn()) {
      wx.navigateBack()
      return
    }
    this.loadData()
  },

  loadData() {
    const currentChild = getCurrentChild()
    if (!currentChild) return

    const activePlan = getActivePlan()
    const today = new Date().getDay()
    const rawItems = activePlan ? activePlan.items.filter(item => {
      return item.frequencyDays && item.frequencyDays.includes(today)
    }) : []

    // 扁平化 grades，避免 WXML 中使用不支持的 grades['A+'] 语法
    const habitItems = rawItems.map(item => {
      const g = item.grades || {}
      return {
        ...item,
        gradeAPlus: { label: (g['A'] && g['A'].label) || '优秀', score: (g['A'] && g['A'].score) || 0 },
        gradeA:     { label: (g['B']  && g['B'].label)  || '完成', score: (g['B']  && g['B'].score)  || 0 },
        gradeB:     { label: (g['C']  && g['C'].label)  || '不合格', score: (g['C']  && g['C'].score)  || 0 },
        gradeD:     { label: (g['D']  && g['D'].label)  || '未完成', score: (g['D']  && g['D'].score)  || 0 }
      }
    })

    const now = new Date()
    const recordDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const selections = {}
    habitItems.forEach(item => { selections[item.id] = null })

    this.setData({
      habitItems,
      selections,
      selectedCount: 0,
      totalScore: 0,
      recordDate
    })
  },

  onGradeSelect(e) {
    const { itemId, grade } = e.currentTarget.dataset
    const item = this.data.habitItems.find(i => i.id === itemId)
    if (!item) return

    const score = item.grades[grade].score
    const selections = { ...this.data.selections }

    if (selections[itemId] && selections[itemId].grade === grade) {
      selections[itemId] = null
    } else {
      selections[itemId] = { grade, score }
    }

    this.updateSelectionStats(selections)
  },

  onSetAllGrade(e) {
    const grade = e.currentTarget.dataset.grade
    const selections = { ...this.data.selections }
    this.data.habitItems.forEach(item => {
      selections[item.id] = { grade, score: item.grades[grade].score }
    })
    this.updateSelectionStats(selections)
  },

  onResetAll() {
    const selections = { ...this.data.selections }
    this.data.habitItems.forEach(item => {
      selections[item.id] = null
    })
    this.updateSelectionStats(selections)
  },

  updateSelectionStats(selections) {
    let selectedCount = 0
    let totalScore = 0
    Object.values(selections).forEach(sel => {
      if (sel) {
        selectedCount++
        totalScore += sel.score
      }
    })
    this.setData({ selections, selectedCount, totalScore })
  },

  onDateChange(e) {
    this.setData({ recordDate: e.detail.value })
  },

  onSaveRecord() {
    if (this.data.selectedCount === 0) {
      showToast('请至少选择一项评分')
      return
    }

    const child = getCurrentChild()
    const selections = this.data.selections
    const [year, month, day] = this.data.recordDate.split('-').map(Number)
    const timestamp = new Date(year, month - 1, day).getTime()

    this.data.habitItems.forEach(item => {
      const sel = selections[item.id]
      if (sel) {
        saveScoreRecord({
          childId: child.id,
          itemId: item.id,
          itemName: item.name,
          grade: sel.grade,
          score: sel.score,
          timestamp: timestamp
        })
      }
    })

    showToast(`已保存 ${this.data.selectedCount} 项，合计 ${this.data.totalScore >= 0 ? '+' : ''}${this.data.totalScore} 分`, 'success')

    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  }
})