const { frequencyText } = require('../../utils/util')

Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    showActions: {
      type: Boolean,
      value: true
    }
  },

  data: {
    frequency: '每天',
    gradeAPlus: { label: '优秀', score: 0 },
    gradeA: { label: '完成', score: 0 },
    gradeB: { label: '不合格', score: 0 },
    gradeD: { label: '未完成', score: 0 }
  },

  observers: {
    'item': function(item) {
      if (item && item.frequencyDays) {
        this.setData({ frequency: frequencyText(item.frequencyDays) })
      }
      if (item && item.grades) {
        const g = item.grades
        this.setData({
          gradeAPlus: g['A'] || { label: '优秀', score: 0 },
          gradeA: g['B'] || { label: '完成', score: 0 },
          gradeB: g['C'] || { label: '不合格', score: 0 },
          gradeD: g['D'] || { label: '未完成', score: 0 }
        })
      }
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { item: this.properties.item })
    },

    onEdit() {
      this.triggerEvent('edit', { item: this.properties.item })
    },

    onDelete() {
      this.triggerEvent('delete', { item: this.properties.item })
    },

    preventBubble() {}
  }
})
