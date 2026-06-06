const { getFamilyName, setFamilyName, getFamilyMembers, updateMemberNickname, getLoginUser } = require('../../utils/storage')
const { showToast } = require('../../utils/util')

Page({
  data: {
    familyName: '',
    members: [],
    showNicknameModal: false,
    showNameModal: false,
    showPosterModal: false,
    presetNicknames: ['爸爸', '妈妈', '爷爷', '奶奶', '外公', '外婆'],
    selectedNickname: '',
    inputNickname: '',
    currentMemberId: '',
    inputFamilyName: '',
    posterUrl: '',
    inviteCode: '',
    familyId: 'default_family',
    shareMode: ''
  },

  onShow() {
    this.loadData()
    this.prepareInviteCode()
  },

  // 预生成邀请码，确保分享时可用
  prepareInviteCode() {
    if (this.data.inviteCode) return
    wx.cloud.callFunction({
      name: 'createInvite',
      data: { familyId: this.data.familyId },
      success: (res) => {
        const result = res.result
        if (result.success) {
          this.setData({ inviteCode: result.code, familyId: result.familyId || this.data.familyId })
        }
      }
    })
  },

  loadData() {
    const familyName = getFamilyName()
    const members = getFamilyMembers()
    const user = getLoginUser()
    // 同步当前用户头像到成员列表
    if (user && members.length > 0) {
      members[0].name = user.nickName || members[0].name
      members[0].avatar = user.avatarUrl || members[0].avatar
    }
    this.setData({ familyName, members })
  },

  // ===== 家庭名称 =====
  onEditFamilyName() {
    this.setData({
      showNameModal: true,
      inputFamilyName: this.data.familyName
    })
  },

  onCloseNameModal() {
    this.setData({ showNameModal: false })
  },

  onFamilyNameInput(e) {
    this.setData({ inputFamilyName: e.detail.value })
  },

  onConfirmFamilyName() {
    const name = this.data.inputFamilyName.trim()
    if (!name) {
      showToast('请输入家庭名称')
      return
    }
    setFamilyName(name)
    this.setData({ familyName: name, showNameModal: false })
    showToast('修改成功', 'success')
  },

  // ===== 成员称呼 =====
  onEditNickname(e) {
    const { id, nickname } = e.currentTarget.dataset
    this.setData({
      showNicknameModal: true,
      currentMemberId: id,
      inputNickname: nickname || '',
      selectedNickname: nickname || ''
    })
  },

  onCloseNicknameModal() {
    this.setData({ showNicknameModal: false })
  },

  onSelectPreset(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ selectedNickname: name, inputNickname: name })
  },

  onNicknameInput(e) {
    this.setData({ inputNickname: e.detail.value, selectedNickname: '' })
  },

  onConfirmNickname() {
    const nickname = this.data.inputNickname.trim()
    if (!nickname) {
      showToast('请输入称呼')
      return
    }
    const success = updateMemberNickname(this.data.currentMemberId, nickname)
    if (success) {
      this.loadData()
      this.setData({ showNicknameModal: false })
      showToast('修改成功', 'success')
    }
  },

  preventBubble() {},

  // ===== 发送邀请 =====
  onSendInvite() {
    this.onShowPoster()
  },

  onShareAppMessage() {
    return {
      title: '儿童成长积分管理',
      path: '/pages/growth/growth',
      imageUrl: '/images/share-cover.png'
    }
  },

  // ===== 邀请码弹窗 =====
  onShowPoster() {
    this.setData({ showPosterModal: true })
    if (!this.data.inviteCode) {
      wx.cloud.callFunction({
        name: 'createInvite',
        data: { familyId: this.data.familyId },
        success: (res) => {
          const result = res.result
          if (result.success) {
            this.setData({ inviteCode: result.code, familyId: result.familyId || this.data.familyId })
          }
        }
      })
    }
  },

  onClosePosterModal() {
    this.setData({ showPosterModal: false })
  },

  onCopyCode() {
    if (!this.data.inviteCode) return
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        showToast('邀请码已复制', 'success')
      }
    })
  }
})
