module.exports = {
  // 获取用户信息
  getAdminLoginInfo: '/erpApi/user/getAdminLoginInfo',

  // ==============中控=============
  videoList: '/erpApi/video/selectList', // 获取视频列表
  updateStatus: '/erpApi/video/updateStatus', // 更新房间状态
  closeVideoRoomAdmin: '/erpApi/video/closeVideoRoom', // 中控关闭房间

  // ==============门店=============
  createVideoRoom: '/baseApi/app/personalCenter/createVideoRoomByMd', // 创建房间
  closeVideoRoom: '/baseApi/app/personalCenter/closeVideoRoom' // 关闭房间
}
