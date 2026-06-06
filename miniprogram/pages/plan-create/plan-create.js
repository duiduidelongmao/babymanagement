const { addPlan, getPlan, updatePlan } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

Page({
  data: {
    isEdit: false,
    planId: '',
    name: '',
    selectedIcon: '📝',
    description: '',
    iconList: ['📝', '📚', '🌅', '✅', '🏃', '🧹', '👋', '🎯', '🎨', '🎵', '🏆', '💪']
  },

  onLoad(options) {
    if (options.id) {
      const plan = getPlan(options.id)
      if (plan) {
        this.setData({
          isEdit: true,
          planId: options.id,
          name: plan.name,
          selectedIcon: plan.icon,
          description: plan.description
        })
        wx.setNavigationBarTitle({ title: '编辑方案' })
      }
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },

  onIconSelect(e) {
    this.setData({ selectedIcon: e.currentTarget.dataset.icon })
  },

  onCancel() {
    wx.navigateBack()
  },

  onSave() {
    const { name, selectedIcon, description, isEdit, planId } = this.data

    if (!name.trim()) {
      showToast('请输入方案名称')
      return
    }

    if (isEdit) {
      updatePlan(planId, { name, icon: selectedIcon, description })
      showToast('保存成功', 'success')
    } else {
      addPlan({ name, icon: selectedIcon, description, items: [] })
      showToast('创建成功', 'success')
    }

    setTimeout(() => wx.navigateBack(), 500)
  }
})
