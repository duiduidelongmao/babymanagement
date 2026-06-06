const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function generateCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

exports.main = async (event, context) => {
  let { familyId } = event
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return { success: false, message: '未获取到用户信息' }
  }

  try {
    // 如果传入默认familyId，自动查找或创建用户的唯一家庭
    if (!familyId || familyId === 'default_family') {
      const memberRes = await db.collection('members').where({ openid: OPENID }).get()
      if (memberRes.data.length > 0) {
        familyId = memberRes.data[0].familyId
      } else {
        // 创建新家庭
        const createRes = await db.collection('families').add({
          data: {
            name: '我的家庭',
            creatorOpenid: OPENID,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        })
        familyId = createRes._id
        // 将创建者加入成员
        await db.collection('members').add({
          data: {
            familyId: familyId,
            openid: OPENID,
            nickName: '',
            avatarUrl: '',
            nickname: '创建者',
            role: 'admin',
            joinedAt: db.serverDate()
          }
        })
      }
    }

    // 检查是否已存在有效邀请码
    const existing = await db.collection('invites')
      .where({
        familyId: familyId,
        inviterOpenid: OPENID,
        status: 'active',
        expireAt: db.command.gt(db.serverDate())
      })
      .get()

    if (existing.data.length > 0) {
      const invite = existing.data[0]
      return {
        success: true,
        code: invite.code,
        familyId: familyId,
        expireAt: invite.expireAt,
        message: '已存在有效邀请码'
      }
    }

    // 创建新邀请码
    const code = generateCode()
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期

    await db.collection('invites').add({
      data: {
        familyId: familyId,
        inviterOpenid: OPENID,
        code: code,
        status: 'active',
        usedCount: 0,
        createdAt: db.serverDate(),
        expireAt: expireAt
      }
    })

    return {
      success: true,
      code: code,
      familyId: familyId,
      expireAt: expireAt,
      message: '邀请码创建成功'
    }
  } catch (err) {
    console.error('创建邀请失败', err)
    return { success: false, message: '创建邀请失败', error: err.message }
  }
}
