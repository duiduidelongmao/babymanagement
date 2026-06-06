const { addReward, getRewards, updateReward } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

const ICON_MAP = {
  '精选': ['🎁', '🎉', '⭐', '🏅', '📝'],
  '吃喝': ['🍔', '🍕', '🍦', '🧁', '🥤'],
  '玩具': ['🦆', '🎮', '🧸', '🎲', '🎯'],
  '学习创作': ['🎨', '📚', '✏️', '🖌️', '📖'],
  '活动体验': ['🎬', '🎪', '🏖️', '🚲', '🏊']
}

Page({
  data: {
    isEdit: false,
    rewardId: '',
    categories: ['精选', '吃喝', '玩具', '学习创作', '活动体验'],
    currentCategory: '精选',
    filteredIcons: ICON_MAP['精选'],
    selectedIcon: '🎁',
    name: '',
    points: 100,
    description: '',
    category: '精选'
  },

  onLoad(options) {
    if (options.id) {
      const rewards = getRewards()
      const reward = rewards.find(r => r.id === options.id)
      if (reward) {
        this.setData({
          isEdit: true,
          rewardId: options.id,
          name: reward.name,
          points: reward.points,
          description: reward.description,
          selectedIcon: reward.icon,
          currentCategory: reward.category,
          category: reward.category,
          filteredIcons: ICON_MAP[reward.category] || ICON_MAP['精选']
        })
        wx.setNavigationBarTitle({ title: '编辑奖励' })
      }
    }
  },

  onCategoryChange(e) {
    const cat = e.currentTarget.dataset.cat
    this.setData({
      currentCategory: cat,
      category: cat,
      filteredIcons: ICON_MAP[cat] || ICON_MAP['精选']
    })
  },

  onIconSelect(e) {
    this.setData({ selectedIcon: e.currentTarget.dataset.icon })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPointsInput(e) { this.setData({ points: parseInt(e.detail.value) || 0 }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },

  onSave() {
    const { name, points, description, selectedIcon, category, isEdit, rewardId } = this.data

    if (!name.trim()) {
      showToast('请输入奖励名称')
      return
    }
    if (!points || points <= 0) {
      showToast('请输入有效积分')
      return
    }

    if (isEdit) {
      updateReward(rewardId, { name, points, description, icon: selectedIcon, category })
      showToast('保存成功', 'success')
    } else {
      addReward({ name, points, description, icon: selectedIcon, category })
      showToast('添加成功', 'success')
    }

    setTimeout(() => wx.navigateBack(), 500)
  }
})
