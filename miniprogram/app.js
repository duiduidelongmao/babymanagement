// app.js
App({
  onLaunch(options) {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d8g7dql1c6392b345',
        traceUser: true
      })
    }

    // 处理小程序码扫码场景
    if (options && options.query && options.query.scene) {
      const scene = decodeURIComponent(options.query.scene)
      this.globalData.pendingInviteCode = scene
    }
  },

  onShow(options) {
    // 处理从后台返回时的场景值
    if (options && options.query && options.query.scene) {
      const scene = decodeURIComponent(options.query.scene)
      this.globalData.pendingInviteCode = scene
    }
  },

  globalData: {
    currentChildId: null,
    pendingInviteCode: ''
  }
})
