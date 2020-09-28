// prod
// module.exports = {
//   // https://xxcg.com/xxx/xxx

//   baseUrl: 'http://192.168.0.230:8075',
//   //   baseUrl: 'http://192.168.0.128:8087', // http://192.168.0.150:8075/personalCenter/createVideoRoom
//   //   baseUrl: 'http://192.168.0.212:8075', // http://192.168.0.150:8075/personalCenter/createVideoRoom
//   erpUrl: 'http://192.168.0.230:8085',
//   socketUrl: 'ws://192.168.0.230:8083'
//   // socketUrl: 'ws://192.168.0.200:8083'
// }

// dev
module.exports = {
  // https://xxcg.com/xxx/xxx

  baseUrl: 'http://192.168.0.230:8075',
  //   baseUrl: 'http://192.168.0.128:8087', // http://192.168.0.150:8075/personalCenter/createVideoRoom
  //   baseUrl: 'http://192.168.0.212:8075', // http://192.168.0.150:8075/personalCenter/createVideoRoom
  erpUrl: 'http://192.168.0.230:8085',
  socketUrl: 'ws://192.168.0.230:8083'
  // socketUrl: 'ws://192.168.0.200:8083'
}

// 获取认证用户信息
// erpUrl/user/getAdminLoginInfo?sid=d0109206-31cf-4e38-8e15-b05feb36565a

// 获取状态
// 返回值 status 状态(00发起通话 01通话中 02会员挂断 03通话结束)
// http://192.168.0.230:8085/video/getStatus

// ===============门店端==============
// 创建房间
// baseUrl/app/personalCenter/createVideoRoomByMd?roomId=12345&deptId=1&deptName=2

// 关闭房间
// baseUrl/app/personalCenter/closeVideoRoom?roomId=12345
// ===============门店端==============

// ===============中控端==============
// socket
// socketUrl/video/connect?userId=xxxxx
// socketUrl/video/connect?deptId=xxxxx

// 房间列表
// erpUrl/video/selectList 带token

// 挂断
// erpUrl/video/closeVideoRoom?roomId=xxx

// 更新房间状态
// erpUrl/video/updateStatus?id=xxx
// ===============中控端==============

// localhost: 8087 / send / sysNoticeVideo

// http://192.168.0.230
// http://192.168.0.231
