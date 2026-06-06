const { getPlan, getTemplateById, addItem, updatePlan, updateItem, removeItem, isLoggedIn } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

const ICON_CATEGORIES = [
  { name: '学习', icons: ['✏️', '📚', '📖', '🎨', '🧮', '🔬', '🌍', '📝'] },
  { name: '生活', icons: ['🛏️', '🧹', '🍽️', '🧺', '🪥', '🚿', '👕', '🍳'] },
  { name: '运动', icons: ['🏃', '⚽', '🏀', '🚴', '🏊', '⛹️', '🤸', '🧘'] },
  { name: '娱乐', icons: ['🎮', '🎬', '🎵', '🎤', '🎯', '🎲', '🎪', '🎨'] },
  { name: '自然', icons: ['🌱', '🌳', '🌸', '🌞', '🌙', '⭐', '🌈', '❄️'] },
  { name: '其他', icons: ['🎁', '💖', '🔔', '⏰', '💡', '🔑', '✅', '❤️'] }
]

Page({
  data: {
    plan: null,
    isTemplate: false,
    iconCategories: ICON_CATEGORIES,
    currentIconCat: '学习',
    // 规则编辑弹窗
    showPlanEdit: false,
    editPlanName: '',
    editPlanDesc: '',
    editPlanTags: '',
    // 细项编辑弹窗
    showItemEdit: false,
    isAddingItem: false,
    editItemId: '',
    editItemName: '',
    editItemDesc: '',
    editItemIcon: '',
    editItemFreq: '',
    editItemScores: { 'A': 0, 'B': 0, 'C': 0, 'D': 0 }
  },

  onLoad(options) {
    if (!isLoggedIn()) {
      wx.navigateBack()
      return
    }
    this.loadPlan(options)
  },

  onShow() {
    if (!isLoggedIn()) return
    // 重新加载以反映编辑后的变化
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    if (current.options) this.loadPlan(current.options)
  },

  loadPlan(options) {
    const { id, type } = options
    let plan = null

    if (type === 'template') {
      plan = getTemplateById(id)
      this.setData({ isTemplate: true })
      if (plan) wx.setNavigationBarTitle({ title: plan.name })
    } else {
      plan = getPlan(id)
      if (plan) wx.setNavigationBarTitle({ title: plan.name + ' 详情' })
    }

    if (plan) {
      const items = plan.items.map(item => {
        const gradeList = ['A', 'B', 'C', 'D'].map(g => ({
          grade: g,
          score: (item.grades[g] && item.grades[g].score) || 0,
          class: this.getGradeClass(g)
        }))
        return { ...item, gradeList }
      })
      this.setData({ plan: { ...plan, items } })
    }
  },

  getGradeClass(grade) {
    if (grade === 'A') return 'grade-a-plus'
    if (grade === 'B') return 'grade-a'
    if (grade === 'C') return 'grade-b'
    if (grade === 'D') return 'grade-d'
    return ''
  },

  onUseTemplate() {
    const { addPlanFromTemplate } = require('../../utils/storage')
    const plan = addPlanFromTemplate(this.data.plan.id)
    if (plan) {
      wx.showToast({ title: '已添加', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    }
  },

  // ===== 规则信息编辑 =====

  onEditPlan() {
    const plan = this.data.plan
    if (!plan || this.data.isTemplate) return
    this.setData({
      showPlanEdit: true,
      editPlanName: plan.name || '',
      editPlanDesc: plan.description || '',
      editPlanTags: (plan.tags || []).join('，')
    })
  },

  onPlanEditCancel() {
    this.setData({ showPlanEdit: false })
  },

  onPlanEditConfirm() {
    const plan = this.data.plan
    if (!plan) return

    const name = this.data.editPlanName.trim()
    const description = this.data.editPlanDesc.trim()
    const tags = this.data.editPlanTags.split(/[,，]/).map(t => t.trim()).filter(t => t)

    if (!name) {
      showToast('名称不能为空')
      return
    }

    updatePlan(plan.id, { name, description, tags })
    showToast('已保存', 'success')
    this.setData({ showPlanEdit: false })
    this.loadPlan({ id: plan.id, type: '' })
  },

  onEditPlanName(e) { this.setData({ editPlanName: e.detail.value }) },
  onEditPlanDesc(e) { this.setData({ editPlanDesc: e.detail.value }) },
  onEditPlanTags(e) { this.setData({ editPlanTags: e.detail.value }) },

  onRemoveTag(e) {
    const tag = e.currentTarget.dataset.tag
    const plan = this.data.plan
    if (!plan || this.data.isTemplate) return

    const tags = (plan.tags || []).filter(t => t !== tag)
    updatePlan(plan.id, { tags })
    this.loadPlan({ id: plan.id, type: '' })
  },

  // ===== 细项编辑 =====

  onAddItem() {
    const plan = this.data.plan
    if (!plan || this.data.isTemplate) return
    this.setData({
      showItemEdit: true,
      isAddingItem: true,
      editItemId: '',
      editItemName: '',
      editItemDesc: '',
      editItemIcon: '',
      editItemFreq: '',
      editItemScores: { 'A': 0, 'B': 0, 'C': 0, 'D': 0 }
    })
  },

  onEditItem(e) {
    const itemId = e.currentTarget.dataset.id
    const plan = this.data.plan
    if (!plan || this.data.isTemplate) return

    const item = plan.items.find(i => i.id === itemId)
    if (!item) return

    this.setData({
      showItemEdit: true,
      isAddingItem: false,
      editItemId: item.id,
      editItemName: item.name || '',
      editItemDesc: item.description || '',
      editItemIcon: item.icon || '',
      editItemFreq: item.frequency || '',
      editItemScores: {
        'A': (item.grades['A'] && item.grades['A'].score) || 0,
        'B': (item.grades['B'] && item.grades['B'].score) || 0,
        'C': (item.grades['C'] && item.grades['C'].score) || 0,
        'D': (item.grades['D'] && item.grades['D'].score) || 0
      }
    })
  },

  onItemEditCancel() {
    this.setData({ showItemEdit: false })
  },

  onItemEditConfirm() {
    const plan = this.data.plan
    if (!plan) return

    const name = this.data.editItemName.trim()
    if (!name) {
      showToast('细项名称不能为空')
      return
    }

    const grades = {}
    ;['A', 'B', 'C', 'D'].forEach(g => {
      grades[g] = { label: this.getDefaultLabel(g), score: parseInt(this.data.editItemScores[g]) || 0 }
    })

    if (this.data.isAddingItem) {
      addItem(plan.id, {
        name,
        description: this.data.editItemDesc.trim(),
        icon: this.data.editItemIcon.trim(),
        frequency: this.data.editItemFreq.trim(),
        grades
      })
      showToast('已添加', 'success')
    } else {
      const itemId = this.data.editItemId
      if (!itemId) return
      updateItem(plan.id, itemId, {
        name,
        description: this.data.editItemDesc.trim(),
        icon: this.data.editItemIcon.trim(),
        frequency: this.data.editItemFreq.trim(),
        grades
      })
      showToast('已保存', 'success')
    }

    this.setData({ showItemEdit: false })
    this.loadPlan({ id: plan.id, type: '' })
  },

  getDefaultLabel(grade) {
    const map = { 'A': '优秀', 'B': '完成', 'C': '不合格', 'D': '未完成' }
    return map[grade] || ''
  },

  onEditItemName(e) { this.setData({ editItemName: e.detail.value }) },
  onEditItemDesc(e) { this.setData({ editItemDesc: e.detail.value }) },
  onEditItemIcon(e) { this.setData({ editItemIcon: e.detail.value }) },
  onEditItemFreq(e) { this.setData({ editItemFreq: e.detail.value }) },

  onSwitchIconCat(e) {
    this.setData({ currentIconCat: e.currentTarget.dataset.cat })
  },

  onSelectIcon(e) {
    this.setData({ editItemIcon: e.currentTarget.dataset.icon })
  },

  onEditItemScore(e) {
    const grade = e.currentTarget.dataset.grade
    const val = e.detail.value
    const scores = { ...this.data.editItemScores }
    scores[grade] = val
    this.setData({ editItemScores: scores })
  },

  async onDeleteItem(e) {
    const itemId = e.currentTarget.dataset.id
    const plan = this.data.plan
    if (!plan || this.data.isTemplate) return

    const confirmed = await showModal('确定删除该细项吗？')
    if (confirmed) {
      removeItem(plan.id, itemId)
      showToast('已删除')
      this.loadPlan({ id: plan.id, type: '' })
    }
  },

  preventBubble() {}
})
