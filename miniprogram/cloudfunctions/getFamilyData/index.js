const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { familyId } = event
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return { success: false, message: '未获取到用户信息' }
  }

  try {
    let targetFamilyId = familyId

    // 如果没有传familyId，根据openid查找
    if (!targetFamilyId) {
      const memberRes = await db.collection('members')
        .where({ openid: OPENID })
        .get()

      if (memberRes.data.length === 0) {
        return { success: false, message: '尚未加入任何家庭' }
      }

      targetFamilyId = memberRes.data[0].familyId
    }

    // 获取家庭信息（容错处理）
    let familyData
    try {
      const familyRes = await db.collection('families').doc(targetFamilyId).get()
      familyData = familyRes.data
    } catch (e) {
      familyData = { _id: targetFamilyId, name: '我的家庭' }
    }

    // 获取家庭成员
    const membersRes = await db.collection('members')
      .where({ familyId: targetFamilyId })
      .orderBy('joinedAt', 'asc')
      .get()

    return {
      success: true,
      family: familyData,
      members: membersRes.data,
      isMember: membersRes.data.some(m => m.openid === OPENID)
    }
  } catch (err) {
    console.error('获取家庭数据失败', err)
    return { success: false, message: '获取家庭数据失败', error: err.message }
  }
}
