const { getPlan, addItem, updateItem } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

Page({
  data: {
    isEdit: false,
    planId: '',
    itemId: '',
    name: '',
    selectedIcon: '✏️',
    frequency: '每天',
    description: '',
    weekdayChecked: [true, true, true, true, true, true, true],
    weekdayNames: ['日', '一', '二', '三', '四', '五', '六'],
    grades: {
      'A': { label: '优秀', score: 10 },
      'B': { label: '完成', score: 6 },
      'C': { label: '不合格', score: 0 },
      'D': { label: '未完成', score: -4 }
    },
    gradeAPlus: { label: '优秀', score: 10 },
    gradeA: { label: '完成', score: 6 },
    gradeB: { label: '不合格', score: 0 },
    gradeD: { label: '未完成', score: -4 },
    iconList: ['✏️', '📚', '🌅', '✅', '🏃', '🧹', '👋', '🎯', '🎨', '🎵', '🏆', '💪']
  },

  onLoad(options) {
    this.setData({ planId: options.planId })

    if (options.itemId) {
      const plan = getPlan(options.planId)
      if (plan) {
        const item = plan.items.find(i => i.id === options.itemId)
        if (item) {
          const weekdayChecked = [0,1,2,3,4,5,6].map(d => (item.frequencyDays || []).includes(d))
          this.setData({
            isEdit: true,
            itemId: options.itemId,
            name: item.name,
            selectedIcon: item.icon,
            frequency: item.frequency || '每天',
            description: item.description,
            weekdayChecked,
            grades: item.grades,
            gradeAPlus: item.grades['A'] || { label: '优秀', score: 10 },
            gradeA: item.grades['B'] || { label: '完成', score: 6 },
            gradeB: item.grades['C'] || { label: '不合格', score: 0 },
            gradeD: item.grades['D'] || { label: '未完成', score: -4 }
          })
          wx.setNavigationBarTitle({ title: '编辑细项' })
        }
      }
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },
  onIconSelect(e) { this.setData({ selectedIcon: e.currentTarget.dataset.icon }) },

  onFreqChange(e) {
    const freq = e.currentTarget.dataset.freq
    if (freq === '每天') {
      this.setData({
        frequency: '每天',
        weekdayChecked: [true, true, true, true, true, true, true]
      })
    } else {
      this.setData({ frequency: 'custom' })
    }
  },

  onWeekdayToggle(e) {
    const index = e.currentTarget.dataset.index
    const weekdayChecked = [...this.data.weekdayChecked]
    weekdayChecked[index] = !weekdayChecked[index]
    this.setData({ weekdayChecked })
  },

  onGradeInput(e) {
    const grade = e.currentTarget.dataset.grade
    const score = parseInt(e.detail.value) || 0
    const grades = { ...this.data.grades }
    grades[grade] = { ...grades[grade], score }
    // 同步更新扁平字段
    const flatKey = grade === 'A' ? 'gradeAPlus' : grade === 'B' ? 'gradeA' : grade === 'C' ? 'gradeB' : 'gradeD'
    this.setData({ grades, [flatKey]: { ...grades[grade], score } })
  },

  onCancel() { wx.navigateBack() },

  onSave() {
    const { name, selectedIcon, frequency, description, grades, planId, itemId, isEdit, weekdayChecked } = this.data

    if (!name.trim()) {
      showToast('请输入习惯名称')
      return
    }

    const frequencyDays = weekdayChecked.map((checked, idx) => checked ? idx : -1).filter(d => d >= 0)
    if (frequencyDays.length === 0) {
      showToast('请选择至少一天')
      return
    }

    const freqText = frequency === '每天' ? '每天' : undefined

    if (isEdit) {
      updateItem(planId, itemId, {
        name, icon: selectedIcon, frequency: freqText, frequencyDays, description, grades
      })
      showToast('保存成功', 'success')
    } else {
      addItem(planId, {
        name, icon: selectedIcon, frequency: freqText || '自定义', frequencyDays, description, grades
      })
      showToast('添加成功', 'success')
    }

    setTimeout(() => wx.navigateBack(), 500)
  }
})
