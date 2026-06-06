const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { code, nickName, avatarUrl } = event
  const { OPENID } = cloud.getWXContext()

  if (!code || !OPENID) {
    return { success: false, message: '参数错误' }
  }

  try {
    // 查找邀请码
    const inviteRes = await db.collection('invites')
      .where({
        code: code,
        status: 'active',
        expireAt: _.gt(db.serverDate())
      })
      .get()

    if (inviteRes.data.length === 0) {
      return { success: false, message: '邀请码无效或已过期' }
    }

    const invite = inviteRes.data[0]
    const familyId = invite.familyId

    // 检查是否已在家庭中
    const existingMember = await db.collection('members')
      .where({
        familyId: familyId,
        openid: OPENID
      })
      .get()

    if (existingMember.data.length > 0) {
      return { success: false, message: '你已经是该家庭的成员' }
    }

    // 添加成员
    await db.collection('members').add({
      data: {
        familyId: familyId,
        openid: OPENID,
        nickName: nickName || '',
        avatarUrl: avatarUrl || '',
        nickname: '成员',
        role: 'member',
        joinedAt: db.serverDate()
      }
    })

    // 更新邀请码使用次数
    await db.collection('invites').doc(invite._id).update({
      data: {
        usedCount: _.inc(1)
      }
    })

    // 获取家庭信息（容错处理）
    let familyData
    try {
      const familyRes = await db.collection('families').doc(familyId).get()
      familyData = familyRes.data
    } catch (e) {
      familyData = { _id: familyId, name: '我的家庭' }
    }

    return {
      success: true,
      message: '加入家庭成功',
      family: familyData
    }
  } catch (err) {
    console.error('加入家庭失败', err)
    return { success: false, message: '加入家庭失败', error: err.message }
  }
}
