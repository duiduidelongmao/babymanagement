const { getCurrentChild, getRewards, removeReward, addConsumptionRecord, getMonthConsumption, isLoggedIn } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

Page({
  data: {
    loggedIn: false,
    currentChild: { totalPoints: 0 },
    rewards: [],
    monthConsumption: 0,
    showDeduct: false,
    deductDate: '',
    deductPoints: '',
    deductNote: ''
  },

  onShow() {
    const loggedIn = isLoggedIn()
    this.setData({ loggedIn })
    if (!loggedIn) {
      console.log('[consumption] 未登录，显示登录提示')
      return
    }
    console.log('[consumption] 已登录，开始加载数据')
    try {
      this.loadData()
    } catch (err) {
      console.error('[consumption] loadData 出错:', err)
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  onGoLogin() {
    wx.switchTab({ url: '/pages/mine/mine' })
  },

  loadData() {
    let currentChild = getCurrentChild()
    if (!currentChild) {
      console.warn('[consumption] getCurrentChild 返回 null，使用兜底对象')
      currentChild = { totalPoints: 0, name: '', id: '' }
    }
    const rewards = getRewards()
    const monthConsumption = getMonthConsumption(currentChild.id || '')
    console.log('[consumption] loadData 结果:', { currentChild, rewardsLen: rewards.length, monthConsumption })
    this.setData({ currentChild, rewards, monthConsumption })
  },

  onAddReward() {
    wx.navigateTo({ url: '/pages/reward-add/reward-add' })
  },

  onEditReward(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/reward-add/reward-add?id=${id}` })
  },

  async onDeleteReward(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showModal('确定删除该奖励吗？')
    if (confirmed) {
      removeReward(id)
      showToast('已删除')
      this.loadData()
    }
  },

  async onRedeem(e) {
    const reward = e.currentTarget.dataset.reward
    const child = this.data.currentChild
    if (child.totalPoints < reward.points) {
      showToast('积分不足，无法兑换')
      return
    }
    const confirmed = await showModal(`确定消耗 ${reward.points} 积分兑换「${reward.name}」吗？`)
    if (confirmed) {
      addConsumptionRecord({
        childId: child.id,
        type: 'redeem',
        points: reward.points,
        rewardId: reward.id,
        rewardName: reward.name,
        note: `兑换${reward.name}`
      })
      showToast('兑换成功！', 'success')
      this.loadData()
    }
  },

  onQuickDeduct() {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    this.setData({ showDeduct: true, deductDate: dateStr, deductPoints: '', deductNote: '' })
  },

  onDeductDateChange(e) {
    this.setData({ deductDate: e.detail.value })
  },

  onDeductCancel() {
    this.setData({ showDeduct: false })
  },

  onDeductPointsInput(e) {
    this.setData({ deductPoints: e.detail.value })
  },

  onDeductNoteInput(e) {
    this.setData({ deductNote: e.detail.value })
  },

  async onDeductConfirm() {
    const points = parseInt(this.data.deductPoints)
    const child = this.data.currentChild

    if (!points || points <= 0) {
      showToast('请输入有效的扣减积分')
      return
    }
    if (points > child.totalPoints) {
      showToast('扣减积分不能超过可用积分')
      return
    }

    const [year, month, day] = this.data.deductDate.split('-').map(Number)
    const timestamp = new Date(year, month - 1, day).getTime()

    addConsumptionRecord({
      childId: child.id,
      type: 'deduct',
      points: points,
      note: this.data.deductNote,
      timestamp: timestamp
    })

    this.setData({ showDeduct: false })
    showToast('扣减成功', 'success')
    this.loadData()
  },

  onViewDetail() {
    wx.navigateTo({ url: '/pages/consumption-detail/consumption-detail' })
  },

  preventBubble() {}
})
