const { showToast } = require('../../utils/util')

Page({
  data: {
    searchKeyword: '',
    activeCategory: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: 'basic', name: '基础使用' },
      { id: 'record', name: '积分记录' },
      { id: 'consume', name: '积分消耗' },
      { id: 'family', name: '家庭共享' }
    ],
    faqList: [
      {
        id: 1,
        category: 'basic',
        question: '如何添加新的积分规则？',
        answer: '进入"我的"页面，点击"积分规则"，选择或创建一个方案，然后点击"新增细项"即可添加新的积分规则。',
        open: false
      },
      {
        id: 2,
        category: 'basic',
        question: '积分等级A、B、C、D分别代表什么？',
        answer: 'A代表优秀（+10分），B代表完成（+6分），C代表不合格（0分），D代表未完成（-4分）。您可以根据实际情况自定义各等级的分值。',
        open: false
      },
      {
        id: 3,
        category: 'consume',
        question: '如何兑换奖励？',
        answer: '进入"消耗"页面，点击"添加奖励"设置奖励和所需积分，然后在奖励列表中点击"兑换"即可扣除相应积分。',
        open: false
      },
      {
        id: 4,
        category: 'record',
        question: '可以补录之前的积分吗？',
        answer: '可以。在计分页面点击具体项目计分时，或者在自由计分页面，都可以选择历史日期进行补录。',
        open: false
      },
      {
        id: 5,
        category: 'family',
        question: '如何邀请家人一起使用？',
        answer: '进入"我的"页面，点击"家庭共享"，将分享链接或二维码发送给家人，对方加入后即可共同管理孩子的积分。',
        open: false
      },
      {
        id: 6,
        category: 'basic',
        question: '数据会丢失吗？',
        answer: '数据存储在微信本地，只要您不删除小程序或清除微信缓存，数据就不会丢失。建议定期使用家庭共享功能进行数据同步。',
        open: false
      }
    ]
  },

  onLoad() {
    this.setData({ filteredFaqList: this.data.faqList })
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    this.filterFaq()
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCategory: id })
    this.filterFaq()
  },

  filterFaq() {
    const { faqList, searchKeyword, activeCategory } = this.data
    let filtered = faqList

    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory)
    }

    if (searchKeyword) {
      filtered = filtered.filter(item =>
        item.question.toLowerCase().includes(searchKeyword) ||
        item.answer.toLowerCase().includes(searchKeyword)
      )
    }

    this.setData({ filteredFaqList: filtered })
  },

  onToggleFaq(e) {
    const index = e.currentTarget.dataset.index
    const list = this.data.filteredFaqList.map((item, idx) => {
      if (idx === index) {
        return { ...item, open: !item.open }
      }
      return item
    })
    this.setData({ filteredFaqList: list })
  },

  onRuleDetail() {
    wx.navigateTo({ url: '/pages/help-detail/help-detail' })
  },

  onCopyPhone() {
    wx.setClipboardData({
      data: 'wxm309854581',
      success: () => {
        showToast('已复制到剪贴板', 'success')
      }
    })
  }
})
