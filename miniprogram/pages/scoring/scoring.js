const { getCurrentChild, getChildren, getActivePlan, saveScoreRecord, getTodayScoreRecords, getTodayStats, isLoggedIn, setCurrentChildId } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

Page({
  data: {
    loggedIn: false,
    currentChild: { name: '', avatar: '', totalPoints: 0 },
    children: [],
    recordDate: '',
    habitItems: [],
    todayRecords: [],
    todayIncome: 0,
    todayExpense: 0,
    // 弹窗
    showGradeModal: false,
    modalItem: null,
    modalSelectedGrade: ''
  },

  onShow() {
    this.setData({ loggedIn: isLoggedIn() })
    this.loadData()
  },

  requireLogin(callback) {
    if (!isLoggedIn()) {
      const app = getApp()
      app.globalData.autoShowLogin = true
      wx.switchTab({ url: '/pages/mine/mine' })
      return
    }
    callback()
  },

  onGoLogin() {
    wx.switchTab({ url: '/pages/mine/mine' })
  },

  onLoginTap() {
    const app = getApp()
    app.globalData.autoShowLogin = true
    wx.switchTab({ url: '/pages/mine/mine' })
  },

  loadData() {
    const children = getChildren()
    const currentChild = getCurrentChild()

    if (!currentChild) {
      this.setData({
        currentChild: { name: '宝贝', avatar: '🧒', totalPoints: 0 },
        children,
        recordDate: '',
        habitItems: [],
        todayRecords: [],
        todayIncome: 0,
        todayExpense: 0
      })
      return
    }

    // 同步到全局，确保首次加载和跨页面一致
    const app = getApp()
    if (app && app.globalData) app.globalData.currentChildId = currentChild.id

    const activePlan = getActivePlan()
    const today = new Date().getDay()
    const habitItems = activePlan ? activePlan.items.filter(item => {
      return item.frequencyDays && item.frequencyDays.includes(today)
    }) : []

    const now = new Date()
    const recordDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // 查询今日已打分记录，并映射到 habitItems
    const todayRecords = getTodayScoreRecords(currentChild.id)
    const gradeClassMap = { 'A': 'grade-a-plus', 'B': 'grade-a', 'C': 'grade-b', 'D': 'grade-d' }
    const habitItemsWithState = habitItems.map(item => {
      const rec = todayRecords.find(r => r.itemId === item.id)
      const grade = rec ? rec.grade : ''
      return {
        ...item,
        scored: !!rec,
        scoredGrade: grade,
        gradeClass: gradeClassMap[grade] || '',
        displayScore: rec ? item.grades[grade].score : item.grades['A'].score
      }
    })

    const todayStats = getTodayStats(currentChild.id)

    this.setData({
      currentChild,
      children,
      recordDate,
      habitItems: habitItemsWithState,
      todayRecords,
      todayIncome: todayStats.income,
      todayExpense: todayStats.expense
    })
  },

  onChildSwitch() {
    this.requireLogin(() => {
      const children = this.data.children
      if (children.length <= 1) return
      wx.showActionSheet({
        itemList: children.map(c => c.name),
        success: (res) => {
          setCurrentChildId(children[res.tapIndex].id)
          this.loadData()
        }
      })
    })
  },

  // 点击"自由计分"按钮 → 跳转到自由计分录入页
  onFreeScoring() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/free-scoring/free-scoring' })
    })
  },

  // 点击"快速计分"按钮 → 跳转到快速计分详情页
  onQuickScoring() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/quick-scoring/quick-scoring' })
    })
  },

  // 点击项目 → 弹出等级选择弹窗
  onItemTap(e) {
    this.requireLogin(() => {
      const item = e.currentTarget.dataset.item
      const todayRecords = this.data.todayRecords
      const existing = todayRecords.find(r => r.itemId === item.id)
      const g = item.grades || {}
      // 展开 grades 为扁平字段，供 WXML 模板使用（WXML 不支持 grades['A+'] 语法）
      const modalItem = {
        ...item,
        gradeAPlus: { label: (g['A'] && g['A'].label) || '优秀', score: (g['A'] && g['A'].score) || 0 },
        gradeA:     { label: (g['B']  && g['B'].label)  || '完成', score: (g['B']  && g['B'].score)  || 0 },
        gradeB:     { label: (g['C']  && g['C'].label)  || '不合格', score: (g['C']  && g['C'].score)  || 0 },
        gradeD:     { label: (g['D']  && g['D'].label)  || '未完成', score: (g['D']  && g['D'].score)  || 0 }
      }
      this.setData({
        showGradeModal: true,
        modalItem: modalItem,
        modalSelectedGrade: existing ? existing.grade : ''
      })
    })
  },

  // 选择等级
  onModalGradeSelect(e) {
    const grade = e.currentTarget.dataset.grade
    const item = this.data.modalItem
    const child = this.data.currentChild
    const score = item.grades[grade].score

    saveScoreRecord({
      childId: child.id,
      itemId: item.id,
      itemName: item.name,
      grade: grade,
      score: score
    })

    showToast(`${item.name} ${grade} ${score >= 0 ? '+' : ''}${score}分`)
    this.setData({ showGradeModal: false, modalItem: null, modalSelectedGrade: '' })
    this.loadData()
  },

  // 关闭弹窗
  onModalClose() {
    this.setData({ showGradeModal: false, modalItem: null, modalSelectedGrade: '' })
  },

  preventBubble() {},

  onGoRules() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/plan-detail/plan-detail' })
    })
  },

  onGoIncome() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/income-detail/income-detail' })
    })
  },

  onGoExpense() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/expense-detail/expense-detail' })
    })
  }
})