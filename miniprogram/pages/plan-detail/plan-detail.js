const { getPlans, getBuiltinTemplates, isTemplateAdded, switchActivePlan, addPlanFromTemplate, deletePlan, isLoggedIn } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

Page({
  data: {
    currentTab: 'my',
    plans: [],
    templates: []
  },

  onShow() {
    if (!isLoggedIn()) return
    this.loadData()
  },

  loadData() {
    const plans = getPlans()
    const templates = getBuiltinTemplates().map(t => ({
      ...t,
      isAdded: plans.some(p => p.fromTemplateId === t.id || p.id === t.id)
    }))
    this.setData({ plans, templates })
  },

  onTabChange(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab })
  },

  onToggleActive(e) {
    const planId = e.currentTarget.dataset.id
    switchActivePlan(planId)
    showToast('已切换生效方案', 'success')
    this.loadData()
  },

  onViewPlan(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/plan-view/plan-view?id=${id}&type=plan` })
  },

  onViewTemplate(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/plan-view/plan-view?id=${id}&type=template` })
  },

  onUseTemplate(e) {
    const id = e.currentTarget.dataset.id
    const plan = addPlanFromTemplate(id)
    if (plan) {
      showToast('已添加到我的规则', 'success')
      this.setData({ currentTab: 'my' })
      this.loadData()
    }
  },

  onDeletePlan(e) {
    const planId = e.currentTarget.dataset.id
    showModal('确定删除该规则吗？', '确认删除').then(confirmed => {
      if (confirmed) {
        deletePlan(planId)
        showToast('已删除', 'success')
        this.loadData()
      }
    })
  },

  onCreatePlan() {
    wx.navigateTo({ url: '/pages/plan-create/plan-create' })
  }
})
