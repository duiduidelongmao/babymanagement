const { getLoginUser, updateLoginUser, logout } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    userId: '',
    joinDate: ''
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const user = getLoginUser()
    if (!user) {
      wx.navigateBack()
      return
    }
    const joinDate = user.loginTime
      ? new Date(user.loginTime).toISOString().split('T')[0]
      : ''
    this.setData({
      avatarUrl: user.avatarUrl || '',
      nickName: user.nickName || '',
      userId: user.userId || '',
      joinDate
    })
  },

  // 点击头像 → 选择新头像
  onAvatarTap() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const avatarUrl = res.tempFiles[0].tempFilePath
        that.setData({ avatarUrl })
        updateLoginUser({ avatarUrl })
        showToast('头像已更新', 'success')
      }
    })
  },

  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value })
  },

  onNickNameBlur() {
    const nickName = this.data.nickName.trim()
    if (nickName) {
      updateLoginUser({ nickName })
      showToast('昵称已保存', 'success')
    }
  },

  onLogout() {
    showModal('退出后需要重新登录才能管理数据', '确认退出').then(confirmed => {
      if (confirmed) {
        logout()
        showToast('已退出登录', 'success')
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/growth/growth' })
        }, 800)
      }
    })
  }
})
