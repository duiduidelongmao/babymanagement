Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    item: {
      type: Object,
      value: {}
    }
  },

  data: {
    gradeAPlus: { label: '优秀', score: 10 },
    gradeA: { label: '完成', score: 6 },
    gradeB: { label: '不合格', score: 0 },
    gradeD: { label: '未完成', score: -4 }
  },

  observers: {
    'item': function(item) {
      if (item && item.grades) {
        const g = item.grades
        this.setData({
          gradeAPlus: g['A'] || { label: '优秀', score: 10 },
          gradeA: g['B'] || { label: '完成', score: 6 },
          gradeB: g['C'] || { label: '不合格', score: 0 },
          gradeD: g['D'] || { label: '未完成', score: -4 }
        })
      }
    }
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close')
    },

    preventBubble() {
      // 阻止事件冒泡
    },

    onGradeTap(e) {
      const { grade, score } = e.currentTarget.dataset
      this.triggerEvent('score', { grade, score: Number(score) })
    }
  }
})
