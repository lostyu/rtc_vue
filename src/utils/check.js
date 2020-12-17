import TRTC from 'trtc-js-sdk'

const mediaStreamContrains = {
  video: true,
  audio: true
}

export async function checkDevice() {
  try {
    await navigator.mediaDevices.getUserMedia(mediaStreamContrains)
    console.log('设备检测成功')
    return {
      ok: true,
      msg: ''
    }
  } catch (error) {
    console.log(error.name)
    console.log(error.message)
    switch (error.name) {
      case 'NotFoundError':
        console.log('找不到摄像头或麦克风设备')
        return {
          ok: false,
          msg: '找不到摄像头或麦克风设备'
        }
      case 'NotAllowedError':
        console.log('用户已拒绝授权访问摄像头或麦克风')
        return {
          ok: false,
          msg: '用户已拒绝授权访问摄像头或麦克风'
        }
      default:
        console.log('未知错误')
        return {
          ok: false,
          msg: '未知错误'
        }
    }
  }
}

export async function checkSystemRequirements() {
  // 当前浏览器不支持webRtc
  let checkResult = await TRTC.checkSystemRequirements()
  let checkDetail = checkResult.detail
  console.log('checkResult', checkResult.result, 'checkDetail', checkDetail)
  if (!checkResult.result) {
    console.log('当前浏览器不支持webRtc')
    return false
  } else {
    console.log('支持webRtc')
    return true
  }
}
