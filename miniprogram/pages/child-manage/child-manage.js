const { getChildren, addChild, updateChild, removeChild } = require('../../utils/storage')
const { showToast, showModal } = require('../../utils/util')

Page({
  data: {
    children: [],
    showForm: false,
    isEditChild: false,
    editId: '',
    editName: '',
    editAvatar: '🧒',
    avatarList: ['🧒', '👧', '👶', '🧒🏻', '👧🏻', '👶🏻', '👦', '👦🏻', '🧒🏽', '👧🏽', '🧒🏾', '👧🏾']
  },

  onShow() { this.loadData() },

  loadData() {
    this.setData({ children: getChildren() })
  },

  onAddChild() {
    this.setData({ showForm: true, isEditChild: false, editName: '', editAvatar: '🧒' })
  },

  onEditChild(e) {
    const id = e.currentTarget.dataset.id
    const child = this.data.children.find(c => c.id === id)
    if (child) {
      this.setData({
        showForm: true,
        isEditChild: true,
        editId: id,
        editName: child.name,
        editAvatar: child.avatar
      })
    }
  },

  async onDeleteChild(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showModal('确定删除该孩子吗？相关积分数据将保留。')
    if (confirmed) {
      removeChild(id)
      showToast('已删除')
      this.loadData()
    }
  },

  onNameInput(e) { this.setData({ editName: e.detail.value }) },
  onAvatarSelect(e) { this.setData({ editAvatar: e.currentTarget.dataset.avatar }) },

  onFormCancel() { this.setData({ showForm: false }) },

  onFormSave() {
    const { editName, editAvatar, isEditChild, editId } = this.data
    if (!editName.trim()) {
      showToast('请输入名字')
      return
    }
    if (isEditChild) {
      updateChild(editId, { name: editName, avatar: editAvatar })
      showToast('保存成功', 'success')
    } else {
      addChild({ name: editName, avatar: editAvatar })
      showToast('添加成功', 'success')
    }
    this.setData({ showForm: false })
    this.loadData()
  },

  preventBubble() {}
})
