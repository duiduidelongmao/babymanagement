const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { inviteCode } = event

  if (!inviteCode) {
    return { success: false, message: '缺少邀请码' }
  }

  // 校验邀请码有效性
  const inviteRes = await db.collection('invites')
    .where({
      code: inviteCode,
      status: 'active'
    })
    .get()

  if (inviteRes.data.length === 0) {
    return { success: false, message: '邀请码无效' }
  }

  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: inviteCode,
      page: 'pages/growth/growth',
      width: 280,
      checkPath: false
    })

    // 将buffer上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `wxacode/${inviteCode}_${Date.now()}.png`,
      fileContent: result.buffer
    })

    // 获取临时链接
    const fileResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    return {
      success: true,
      fileID: uploadResult.fileID,
      url: fileResult.fileList[0].tempFileURL
    }
  } catch (err) {
    console.error('生成小程序码失败', err)
    return { success: false, message: '生成小程序码失败', error: err.message }
  }
}
