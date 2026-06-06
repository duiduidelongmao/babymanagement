const { getCurrentChild, getChildStats, isLoggedIn, getChildren, setCurrentChildId } = require('../../utils/storage')
const { getDateRange, formatDate } = require('../../utils/util')

function formatDailyDate(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const d = new Date(dateStr + 'T00:00:00')
  if (d.getTime() === today.getTime()) return '今天'
  if (d.getTime() === yesterday.getTime()) return '昨天'

  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

Page({
  data: {
    loggedIn: false,
    currentRange: '7d',
    currentView: 'category',
    dateRange: '',
    currentChildName: '',
    currentChildAvatar: '',
    childrenCount: 0,
    stats: { income: 0, expense: 0, netValue: 0 },
    trendData: [],
    trendSvg: '',
    trendSvgKey: 0,
    categoryList: [],
    gradeList: [],
    dailyList: [],
    pendingInviteCode: '',
    showJoinModal: false,
    inputInviteCode: ''
  },

  onLoad(options) {
    if (options && options.inviteCode) {
      this.setData({ pendingInviteCode: options.inviteCode })
      this.handleInviteCode(options.inviteCode)
    }
  },

  onReady() {
    if (this.data.trendData && this.data.trendData.length > 0) {
      this.drawTrendLine()
    }
  },

  handleInviteCode(code) {
    const that = this
    if (!isLoggedIn()) {
      wx.showModal({
        title: '加入家庭',
        content: '你收到一个家庭邀请，登录后即可加入',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/mine/mine' })
        }
      })
      return
    }
    wx.showLoading({ title: '处理中...' })
    wx.cloud.callFunction({
      name: 'joinFamily',
      data: { code: code },
      success: (res) => {
        wx.hideLoading()
        const result = res.result
        if (result.success) {
          wx.showModal({
            title: '加入成功',
            content: `你已加入家庭「${result.family.name}」，现在可以与家人一起管理孩子积分了`,
            showCancel: false
          })
          that.setData({ pendingInviteCode: '' })
        } else {
          wx.showModal({
            title: '加入家庭',
            content: result.message || '加入失败',
            showCancel: false
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showModal({
          title: '网络错误',
          content: '加入家庭失败，请稍后重试',
          showCancel: false
        })
      }
    })
  },

  onShow() {
    const app = getApp()
    this.setData({ loggedIn: isLoggedIn() })
    this.loadData()
    if (this.data.pendingInviteCode) {
      this.handleInviteCode(this.data.pendingInviteCode)
    } else if (app.globalData.pendingInviteCode) {
      const code = app.globalData.pendingInviteCode
      app.globalData.pendingInviteCode = ''
      this.setData({ pendingInviteCode: code })
      this.handleInviteCode(code)
    }
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

  onGoIncome() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/income-detail/income-detail' })
    })
  },

  onGoExpense() {
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/expense-detail/expense-detail' })
    })
  },

  onDailyTap(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/income-detail/income-detail?date=' + date })
    })
  },

  onCategoryTap(e) {
    const name = e.currentTarget.dataset.name
    if (!name) return
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/category-detail/category-detail?categoryName=' + encodeURIComponent(name) + '&range=' + this.data.currentRange })
    })
  },

  onGradeTap(e) {
    const grade = e.currentTarget.dataset.grade
    if (!grade) return
    this.requireLogin(() => {
      wx.navigateTo({ url: '/pages/category-detail/category-detail?grade=' + grade + '&range=' + this.data.currentRange })
    })
  },

  drawTrendLine() {
    const trendData = this.data.trendData
    if (!trendData || trendData.length === 0) {
      this.setData({ trendSvg: '' })
      return
    }

    const width = 600
    const height = 140
    const padding = 10
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const nets = trendData.map(d => d.net)
    const maxNet = Math.max(...nets, 0)
    const minNet = Math.min(...nets, 0)
    const range = maxNet - minNet || 1

    // 生成折线路径
    let pathD = ''
    trendData.forEach((d, i) => {
      const x = padding + (i / (trendData.length - 1 || 1)) * chartWidth
      const y = padding + chartHeight * ((maxNet - d.net) / range)
      pathD += (i === 0 ? 'M' : 'L') + x + ',' + y
    })

    // 生成面积填充路径
    let areaD = pathD
    const lastX = padding + chartWidth
    const lastY = padding + chartHeight * ((maxNet - trendData[trendData.length - 1].net) / range)
    areaD += ` L${lastX},${height - padding} L${padding},${height - padding} Z`

    const first = trendData[0]
    const last = trendData[trendData.length - 1]
    const firstY = padding + chartHeight * ((maxNet - first.net) / range)

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '">' +
      '<defs>' +
      '<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#4CAF50" stop-opacity="0.15"/>' +
      '<stop offset="100%" stop-color="#4CAF50" stop-opacity="0.02"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<path d="' + areaD + '" fill="url(#areaGrad)"/>' +
      '<path d="' + pathD + '" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + padding + '" cy="' + firstY + '" r="3" fill="' + (first.net >= 0 ? '#4CAF50' : '#F44336') + '"/>' +
      '<circle cx="' + lastX + '" cy="' + lastY + '" r="3" fill="' + (last.net >= 0 ? '#4CAF50' : '#F44336') + '"/>' +
      '</svg>'

    const buf = new ArrayBuffer(svg.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i < svg.length; i++) {
      view[i] = svg.charCodeAt(i)
    }
    const base64 = wx.arrayBufferToBase64(buf)
    this.setData({ trendSvg: 'data:image/svg+xml;base64,' + base64, trendSvgKey: Date.now() })
  },

  buildTrendData(start, end, dailyMap) {
    function formatDateKey(date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const dates = []
    const startDate = new Date(start)
    const endDate = new Date(end)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(formatDateKey(d))
    }

    const trendData = dates.map(date => {
      const dayData = dailyMap[date] || { income: 0, expense: 0 }
      const net = dayData.income - dayData.expense
      return { date, net }
    })

    const maxAbs = Math.max(...trendData.map(d => Math.abs(d.net)), 1)
    trendData.forEach(d => {
      d.positiveHeight = d.net > 0 ? Math.round(d.net / maxAbs * 50) : 0
      d.negativeHeight = d.net < 0 ? Math.round(Math.abs(d.net) / maxAbs * 50) : 0
    })

    return trendData
  },

  loadData() {
    const child = getCurrentChild()
    const range = this.data.currentRange
    const { start, end, startStr, endStr } = getDateRange(range)
    const children = getChildren()

    if (!child) {
      this.setData({
        dateRange: `${startStr} - ${endStr}`,
        currentChildName: '宝贝',
        currentChildAvatar: '🧒',
        childrenCount: children.length,
        stats: { income: 0, expense: 0, netValue: 0 },
        trendData: [],
        trendSvg: '',
        categoryList: [],
        gradeList: [],
        dailyList: []
      })
      return
    }

    this.setData({
      dateRange: `${startStr} - ${endStr}`,
      currentChildName: child.name || '',
      currentChildAvatar: child.avatar || '',
      childrenCount: children.length
    })

    const stats = getChildStats(child.id, start, end)
    this.setData({ stats })

    // 按天净值趋势数据
    const trendData = this.buildTrendData(start, end, stats.dailyMap || {})
    this.setData({ trendData }, () => {
      setTimeout(() => this.drawTrendLine(), 300)
    })

    this.loadCategoryView(stats)
    this.loadGradeView(stats)
    this.loadDailyView(stats)
  },

  onChildSwitch() {
    this.requireLogin(() => {
      const children = getChildren()
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

  onRangeChange(e) {
    const range = e.currentTarget.dataset.range
    this.setData({ currentRange: range })
    this.loadData()
  },

  onViewChange(e) {
    this.setData({ currentView: e.currentTarget.dataset.view })
  },

  loadCategoryView(stats) {
    const map = stats.categoryMap || {}
    const list = Object.keys(map).map(name => ({
      name,
      income: map[name].income,
      expense: map[name].expense,
      count: map[name].count,
      barWidth: map[name].income > 0 ? Math.min((map[name].income / Math.max(stats.income, 1)) * 100, 100) : 0,
      expenseBarWidth: map[name].expense > 0 ? Math.min((map[name].expense / Math.max(stats.expense, 1)) * 100, 100) : 0
    }))
    this.setData({ categoryList: list })
  },

  loadGradeView(stats) {
    const map = stats.gradeMap || {}
    const maxCount = Math.max(...Object.values(map), 1)
    const gradeConfig = [
      { grade: 'A', gradeClass: 'a-plus', color: '#4CAF50' },
      { grade: 'B', gradeClass: 'a', color: '#2196F3' },
      { grade: 'C', gradeClass: 'b', color: '#FF9800' },
      { grade: 'D', gradeClass: 'd', color: '#F44336' }
    ]
    const list = gradeConfig.map(g => ({
      ...g,
      count: map[g.grade] || 0,
      barWidth: ((map[g.grade] || 0) / maxCount * 100)
    }))
    this.setData({ gradeList: list })
  },

  loadDailyView(stats) {
    const map = stats.dailyMap || {}
    const list = Object.keys(map).sort().reverse().map(date => ({
      date,
      dateStr: formatDailyDate(date),
      income: map[date].income,
      expense: map[date].expense,
      net: map[date].income - map[date].expense
    }))
    this.setData({ dailyList: list })
  },

  // ===== 加入家庭弹窗 =====
  onShowJoinModal() {
    if (!isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再加入家庭',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/mine/mine' })
        }
      })
      return
    }
    this.setData({ showJoinModal: true, inputInviteCode: '' })
  },

  onCloseJoinModal() {
    this.setData({ showJoinModal: false })
  },

  onJoinCodeInput(e) {
    this.setData({ inputInviteCode: e.detail.value.trim().toUpperCase() })
  },

  onConfirmJoin() {
    const code = this.data.inputInviteCode
    if (!code || code.length < 4) {
      wx.showToast({ title: '请输入有效邀请码', icon: 'none' })
      return
    }
    this.setData({ showJoinModal: false })
    this.handleInviteCode(code)
  },

  preventBubble() {}
})
