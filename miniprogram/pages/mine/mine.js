const { isLoggedIn, getLoginUser, getCurrentChild, getChildren, getActivePlan, getData, login, logout, setCurrentChildId } = require('../../utils/storage')
const { daysSinceJoin, showToast, showModal } = require('../../utils/util')

Page({
  data: {
    loggedIn: false,
    loginUser: null,
    joinDays: 1,
    currentChild: { totalPoints: 0, consecutiveDays: 0 },
    childrenCount: 0,
    activePlanName: '',
    memberCount: 1,
    // 登录弹窗
    showLoginModal: false,
    tempAvatarUrl: '',
    tempNickName: ''
  },

  onShow() {
    this.loadData()
    const app = getApp()
    if (!this.data.loggedIn && app.globalData.autoShowLogin) {
      app.globalData.autoShowLogin = false
      this.onLogin()
    }
  },

  loadData() {
    const loggedIn = isLoggedIn()
    const loginUser = getLoginUser()

    this.setData({ loggedIn, loginUser })

    if (!loggedIn) return

    const currentChild = getCurrentChild()
    const children = getChildren()
    const activePlan = getActivePlan()
    const members = getData('family_members')

    const joinDays = loginUser && loginUser.loginTime
      ? Math.max(Math.floor((Date.now() - loginUser.loginTime) / (1000 * 60 * 60 * 24)), 1)
      : 1

    this.setData({
      currentChild: currentChild || { totalPoints: 0, consecutiveDays: 0 },
      joinDays,
      childrenCount: children.length,
      activePlanName: activePlan ? activePlan.name : '',
      memberCount: members.length
    })
  },

  // ===== 登录相关 =====

  onLogin() {
    if (this.data.loggedIn) return
    this.setData({
      showLoginModal: true,
      tempAvatarUrl: '',
      tempNickName: ''
    })
  },

  onChooseAvatar() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.setData({ tempAvatarUrl: res.tempFiles[0].tempFilePath })
      }
    })
  },

  onNickNameInput(e) {
    this.setData({ tempNickName: e.detail.value })
  },

  onLoginCancel() {
    this.setData({ showLoginModal: false })
  },

  onLoginConfirm() {
    const { tempNickName, tempAvatarUrl } = this.data
    const nickName = tempNickName || '微信用户'

    login(nickName, tempAvatarUrl)
    this.setData({ showLoginModal: false })
    showToast('登录成功', 'success')
    this.loadData()
  },

  onGoProfile() {
    if (!this.data.loggedIn) { this.onLogin(); return }
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  preventBubble() {},

  // ===== 菜单操作 =====

  onChildManage() {
    if (!this.data.loggedIn) { this.onLogin(); return }
    wx.navigateTo({ url: '/pages/child-manage/child-manage' })
  },

  onPlanRules() {
    if (!this.data.loggedIn) { this.onLogin(); return }
    wx.navigateTo({ url: '/pages/plan-detail/plan-detail' })
  },

  onFamilyShare() {
    if (!this.data.loggedIn) { this.onLogin(); return }
    wx.navigateTo({ url: '/pages/family-share/family-share' })
  },

  onHelp() { wx.navigateTo({ url: '/pages/help-center/help-center' }) },
  onAgreement() { wx.navigateTo({ url: '/pages/user-agreement/user-agreement' }) },
  onPrivacy() { wx.navigateTo({ url: '/pages/privacy-policy/privacy-policy' }) },

  onChildSwitch() {
    if (!this.data.loggedIn) { this.onLogin(); return }
    const children = getChildren()
    if (children.length <= 1) return
    wx.showActionSheet({
      itemList: children.map(c => c.name),
      success: (res) => {
        setCurrentChildId(children[res.tapIndex].id)
        this.loadData()
      }
    })
  },

})
