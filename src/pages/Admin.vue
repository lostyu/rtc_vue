<template>
  <div class="app">
    <div v-if="isShowModal" class="modal">
      <div class="wrap">
        <span @click="hideModal" class="close">×</span>
        <div class="title">接受{{ modalInfo.name }}呼叫将中断本次通话</div>
        <div class="btns">
          <button @click="handleNo(modalInfo)" class="off">挂断</button>
          <button @click="handleOk(modalInfo)" class="on">接受</button>
        </div>
      </div>
    </div>
    <audio class="audio" loop controls ref="a1" src="../assets/weixin.mp3" />
    <div class="container">
      <div class="main">
        <div class="debug" style="display: none">
          timerMap: {{ timerMap }}
          <br />
          status:{{ status }}
          <br />
          modalInfo: {{ modalInfo }}
          {{ newCallStatus }}
          <br />
          curUserInfo.userId: {{ curUserInfo.userId }}
          <br />
          deptName: {{ deptName }}
          <br />
          deptId: {{ deptId }}
          <br />
          roomId: {{ roomId }}
          <br />
          userId: {{ userId }}
          <hr />
          {{ curStoreInfo }}
          <hr />
          sdkAppId: {{ sdkAppId }}
          <br />
          <br />
          userSig{{ userSig }}
          <br />
        </div>
        <div class="remoteBox">
          <div v-for="item in remoteStreamArr" :key="item" :id="'remote_stream_' + item"></div>
        </div>
        <div v-if="showStoreList" class="statusList">
          <ul>
            <li v-for="item in storeList" :key="item.id">
              <span class="text">{{ item.name }}</span>
              <span v-if="item.status === 1" class="zt">
                <i class="green"></i>
                空闲
              </span>
              <span v-else class="zt">
                <i class="red"></i>
                忙碌
              </span>
            </li>
          </ul>
        </div>
        <div class="remoteTitle">
          <div v-if="curStoreInfo" class="groupItem">
            <span class="dot green"></span>
            <span @click="toggleStoreList" class="text">{{ curStoreInfo.name }}</span>
            <span class="arrow" :class="{ active: showStoreList }"></span>
          </div>
        </div>
      </div>

      <div class="side">
        <div v-if="showCallList" class="fromCallList">
          <ul>
            <li v-for="item in callList" :key="item.id">
              <span class="text2">{{ item.name }}</span>
              <span class="zt">
                <a @click.once="fnReceiveCall(item)" class="call" href="javascript:;"></a>
                <a @click.once="fnHangUpNoAnswerCall(item)" class="offcall" href="javascript:;"></a>
              </span>
            </li>
          </ul>
        </div>
        <div class="text">
          <div v-if="latestCall" class="fromCall">
            <!-- <span @click="turnOn(latestCall)" class="item">{{latestCall.name}}来电呼叫</span> -->
            <span @click="toggleCallList" class="item">{{ latestCall.name }}来电呼叫</span>
            <span v-if="callNum" @click="toggleCallList" class="icon" :class="{ revert: showCallList }"></span>
          </div>
          <span v-if="callNum" class="fromCallNum">{{ callNum }}</span>
        </div>
        <div class="video">
          <!-- <div v-if="newCallStatus && callNum > 0" id="newCall">
            <div>
              <img />
              <div>
                <a @click="turnOn(latestCall)" class="call" href="javascript:;">接通</a>
                <a @click="hangUp(latestCall)" class="offcall" href="javascript:;">挂断</a>
              </div>
            </div>
          </div>-->
          <div id="local_stream"></div>
          <Person
            style="position: absolute; left: 0; top: 0"
            v-show="!status"
            :width="width"
            :height="height"
            ref="person"
          />
        </div>
        <div class="title">{{ deptName }}</div>
        <div class="btns">
          <!-- <button @click="join">加入</button> -->
          <!-- <div @click="handleBtnCall" v-show="btnCall" class="call"></div> -->
          <div @click="fnHangUpCall(roomId)" v-show="btnOff" class="off"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TRTC from 'trtc-js-sdk'
import config from '@/config'
import api from '@/config/api'
import ReconnectingWebSocket from 'reconnecting-websocket'
import Person from '@/components/Animate/Person'

import { checkSystemRequirements, checkDevice } from '@/utils/check'

import '@/assets/css/common.less'

export default {
  components: {
    Person,
  },
  data() {
    return {
      // 253px  353px  1024
      // 388px  398px  1920
      width: '',
      height: '',

      timerMap: {}, //

      sid: this.$route.query.sid, // 获取token用

      isShowModal: false,
      modalInfo: '', // 弹层显示的门店信息

      curStoreInfo: null, // 对方门店信息，默认中控，如果角色是中控，则不显示
      status: 0, // 当前用户状态 0空闲，1忙碌

      showStoreList: false,
      showCallList: false,
      callList: [], //来电列表
      storeList: [], //门店列表

      latestCall: null, // 最近来电
      btnCall: false, // 拨打按钮是否显示
      btnOff: false, // 挂断按钮是否显示
      // ======================= userInfo
      curUserInfo: {}, // 当用户信息，初始化获取
      deptId: '',
      deptName: '',
      roomId: '',
      newCallStatus: true,

      // ======================= RTC
      sdkAppId: '',
      userId: '',
      userSig: '',
      mode: 'rtc',

      client: null,
      localStream: null,
      remoteStreamArr: [],
      videoProfile: '720p',

      inited: false,
      isJoined: false,
      accessToken: '',
      timer: null, // 定时器，关闭通知铃声
      timeout: 30000, // 30秒未接听关闭声音
    }
  },
  computed: {
    callNum() {
      return this.callList.length
    },
    storeNum() {
      return this.storeList.length
    },
  },
  async mounted() {
    const SysRequired = await checkSystemRequirements()

    if (SysRequired) {
      const deviceStatus = await checkDevice()
      if (!deviceStatus.ok) {
        this.$toast({ message: deviceStatus.msg, duration: 5000 })
      } else {
        this.initData()
        this.roleCrl()
        this.logger()
      }
    } else {
      this.$toast({ message: '该浏览器不支持视频通话', duration: 5000 })
    }
  },
  methods: {
    async noticeVideo(type, platform, sendId, roomId) {
      // type	是	Integer	3 按钮通话
      // platform	是	Integer	推送目标 1门店 2中控
      // sendId	是	String	推送目标id 可以为deptId 可以为userId
      try {
        const res = await this.$axios.post(
          api.sysNoticeVideo,
          {
            type,
            platform,
            sendId,
            roomId,
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
            interceptors: {
              // 为false 时，不再经过某个interceptor
              request: false,
              response: false,
              error: false,
            },
            postDataType: 'json',
          }
        )
      } catch (error) {
        console.log(error)
        this.$toast({ message: '网络错误，请联系管理员', duration: 5000 })
      }
    },
    bindSocket() {
      this.rws.onopen = () => {
        this.rws.send('中控连接到视频通话...')
        console.log('中控连接到视频通话...')
      }

      this.rws.onmessage = async (evt) => {
        setTimeout(() => {
          this.handleMessage(evt)
        }, 1000)
      }

      this.rws.onclose = () => {
        this.rws.send('中控断开连接...')
        console.log('中控断开连接...')
        // this.rws.close()
      }

      this.rws.onerror = (evt) => {
        console.log('error', evt)
      }
    },
    async handleMessage(evt) {
      const obj = JSON.parse(evt.data)
      const { id, roomId, type } = JSON.parse(evt.data)
      // type 1呼叫，2关闭，3触发门店端按钮，4接听电话通知其他中控刷新列表

      // 第一个来电，并且中控还未接听状态
      if (this.status === 0 && type === 1) {
        this.$refs.a1.play()
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.audioStop()
          this.timer = null
        }, this.timeout)
      }

      // 收到门店挂断的通知
      if (type === 2) {
        // 删除视频请求列表
        // 停止音乐
        this.audioStop()
      }

      if (type === 5) {
        this.audioStop()
        // this.leave()
        // this.timerMap[]
        // console.log(4444444444444444444444444)
        // console.log('4444444444444444444444444444', obj)
        clearTimeout(this.timerMap[roomId])
        console.log('清空了定时器')
      }

      console.log('=================================', obj)

      // 30秒未接听自动挂断
      if (type === 1) {
        this.autoOffCall(id, roomId)
        // console.log(id, roomId)
      }

      // 更新房间列表
      await this.getRoomList()
    },
    // 自动挂断30秒未接听的来电
    autoOffCall(id, roomId) {
      // 如果30秒内，接听了，取消挂断

      this.timerMap[roomId] = setTimeout(() => {
        // 请求更新房间状态接口
        // 更新房间
        console.log(id, roomId)
        console.log('==================自动关闭房间完成')

        // 真实挂断
        // api

        this.hangupCall(roomId)
        this.callList = this.callList.filter((call) => call.id !== id)
      }, this.timeout)
      console.log('开启定时器', this.timerMap[roomId], roomId)
    },

    // 初始化数据
    async initData() {
      await this.getUserInfo()
      let protocol = location.protocol === 'http' ? 'ws' : 'wss'
      // dev
      const url = `${protocol}://${location.host}/socket/video/connect?userId=${this.curUserInfo.userId}`

      // prod
      // const url = `${protocol}://${location.host}/video/connect?userId=${this.curUserInfo.userId}`
      console.log(url)

      this.rws = new ReconnectingWebSocket(url, [], {
        debug: true,
      })

      this.bindSocket()

      if (window.screen.width > 1024) {
        this.width = '388px'
        this.height = '398px'
      } else {
        this.width = '253px'
        this.height = '353px'
      }
      this.$refs.person.start()

      // 绑定浏览器关闭事件

      // window.onbeforeunload = function (e) {
      //   // Chrome, Safari, Firefox 4+, Opera 12+ , IE 9+
      //   console.log(123)
      //   return '关闭提示'
      // }
      // window.addEventListener('unload', function (event) {
      //   alert('123123123')
      // })
    },
    // 获取状态房间状态
    async getStatus(id) {
      try {
        const res = await this.$axios.get(api.getStatus, {
          params: {
            id,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
        const { data } = res.data
        return data
      } catch (e) {
        console.log('获取状态信息失败')
        this.$toast({ message: '获取状态信息失败', duration: 5000 })
        return -1
      }
    },

    // 用户点击
    // userClick() {
    //   console.log('1223344')
    //   this.$refs.a1.play()
    //   this.$refs.a1.pause()
    // },
    // 获取用户信息
    async getUserInfo() {
      if (!this.sid) {
        return
      }
      try {
        const res = await this.$axios.get(api.getAdminLoginInfo, {
          params: {
            sid: this.sid,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
        const data = res.data
        // token授权
        if (data.status === 0) {
          const { accessToken, refreshToken } = data.data
          this.$store.commit('REFRESH_USER', { accessToken, refreshToken })
          this.curUserInfo = data.data
          this.userId = data.data.userCode
          this.deptId = data.data.deptId
          this.deptName = data.data.departmentName
          this.accessToken = accessToken
        }
      } catch (e) {
        console.log('获取用户信息失败，请重新登录')
        this.$toast({ message: '获取用户信息失败，请重新登录', duration: 5000 })
      }
    },
    // 权限控制
    roleCrl() {
      this.curStoreInfo = null
      this.storeList = []
      this.btnCall = false
      this.btnOff = false
    },
    // 获取房间列表
    async getRoomList() {
      try {
        const res = await this.$axios.get(api.videoList, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
        const data = res.data
        // this.callList = data
        if (data.data.length > 0) {
          this.callList = data.data
          // let temp = {}
          // let result = []
          // this.callList.forEach((item, index) => {
          //   if (!temp[item.id]) {
          //     result.push(item)
          //     temp[item.id] = true
          //   }
          // })

          // this.callList = result
        } else {
          this.callList = []
        }
      } catch (e) {
        console.log('获取房间列表信息失败')
        this.$toast({ message: '获取房间列表信息失败', duration: 5000 })
      }
    },
    // 更新房间状态
    async updateStatus(id, roomId) {
      if (!id) {
        return
      }
      try {
        const res = await this.$axios.get(api.updateStatus, {
          params: {
            id,
            roomId,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
      } catch (e) {
        console.log(e)
      }
    },
    // api挂断来电
    async hangupCall(roomId) {
      if (!roomId) {
        return
      }
      try {
        const res = await this.$axios.get(api.closeVideoRoomAdmin, {
          params: {
            roomId,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
      } catch (e) {
        console.log(e)
      }
    },
    async toggleCallList() {
      // if (this.callNum === 0) {
      //   return
      // }
      await this.getRoomList()

      if (this.callList.length > 0) {
        this.showCallList = !this.showCallList
      }
    },
    toggleStoreList() {
      if (this.storeNum === 0) {
        return
      }
      this.showStoreList = !this.showStoreList
    },

    hideModal() {
      this.isShowModal = false
    },

    showModal() {
      this.isShowModal = true
    },

    audioStop() {
      clearTimeout(this.timer)
      this.$refs.a1.currentTime = 0
      this.$refs.a1.pause()
    },

    // ======================
    // 弹层取消按钮
    handleNo(item) {
      // 挂断未接通的电话
      this.fnHangUpNoAnswerCall(item)
      this.isShowModal = false
    },
    // 弹层确定按钮
    async handleOk(item) {
      // this.curStoreInfo = {...item}
      // 挂断当前的
      // console.log(item)
      await this.fnHangUpCall(this.roomId)
      console.log('挂断电话............')
      this.fnReceiveCall(item)
      this.isShowModal = false
    },
    // 接听来电
    async fnReceiveCall(item) {
      // TODO 接听，判断当前会话是否挂断
      // 加入房间
      // 更新状态
      // 获取curStoreInfo
      // 更改自身状态
      if (this.status === 0) {
        // 空闲状态
        this.receiveCall(item)
      } else if (this.status === 1) {
        // 忙碌状态
        this.modalInfo = { ...item }
        this.isShowModal = true
      }
    },
    async receiveCall(item) {
      console.log('清除timer：', this.timerMap[item.roomId], '===', item.roomId)
      clearTimeout(this.timerMap[item.roomId])
      this.$set(this.timerMap, item.roomId, null)

      //状态(00发起通话 01通话中 02会员挂断 03通话结束)
      const data = await this.getStatus(item.id)

      if (data === 0) {
        console.log('可以接听电话.....')
        this.roomId = item.roomId
        await this.join()
        this.curStoreInfo = { ...item }
        this.callList = this.callList.filter((call) => call.id !== item.id)
        await this.updateStatus(item.id, item.roomId)
        this.fnReceiveCallStatus()
        this.rws.send(`中控接听了来电，id:${item.id}, roomID：${item.roomId}`)
      } else {
        alert('当前视频通话已被其他客服接听')
        await this.getRoomList()
      }
    },
    // 接听电话后更改状态
    fnReceiveCallStatus() {
      this.status = 1
      this.btnOff = true
      this.showCallList = false
      this.audioStop()
    },
    // 挂断还未接听的电话，不做实际后台交互请求（只是本地屏蔽本条数据）
    async fnHangUpNoAnswerCall(item) {
      // api
      await this.noticeVideo(2, 1, null, item.roomId)
      await this.hangupCall(item.roomId)
      this.callList = this.callList.filter((call) => call.id !== item.id)
      this.audioStop()
    },
    // 挂断正在通话的电话
    async fnHangUpCall(roomId) {
      roomId = roomId || this.roomId
      // api 退出房间
      await this.leave()
      await this.hangupCall(roomId)
      this.fnHangUpCallStatus()
    },
    fnHangUpCallStatus() {
      this.status = 0
      this.btnOff = false
      this.curStoreInfo = null
      this.roomId = ''
      this.audioStop()
    },

    // ================= RTC
    // 开启日志
    logger() {
      TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.DEBUG)
    },

    // 初始化配置，全局只执行一次
    init() {
      if (!this.inited) {
        const { sdkAppId, userSig } = genTestUserSig(this.userId)
        this.sdkAppId = sdkAppId
        this.userSig = userSig

        this.client = TRTC.createClient({
          mode: this.mode,
          sdkAppId: this.sdkAppId,
          userId: this.userId,
          userSig: this.userSig,
        })

        // 绑定事件
        this.bindEvents()
        this.inited = true
      }
    },

    // 创建房间
    async join() {
      return new Promise(async (resolve, reject) => {
        if (this.isJoined) {
          console.log('已经加入房间，不能重复加入房间')
          reject('已经加入房间，不能重复加入房间')
          return
        }

        this.init()

        try {
          await this.client.join({ roomId: this.roomId })
          this.isJoined = true
          console.log('加入房间成功', this.userId)
          resolve()

          // 创建本地流
          this.localStream = TRTC.createStream({
            video: true,
            audio: true,
          })
          this.localStream.setVideoProfile(this.videoProfile)

          // 初始化本地流
          await this.localStream.initialize()
          console.log('初始化本地流成功')

          // 播放
          this.localStream.play('local_stream')
          // 推流
          await this.publish()
        } catch (e) {
          console.log('加入房间失败', e)
          reject('加入房间失败', e)
        }
      })
    },

    // 离开房间
    async leave() {
      if (!this.isJoined) {
        console.warn('leave() - please join() firstly')
        return
      }
      // ensure the local stream is unpublished before leaving.
      await this.unpublish()

      // leave the room
      await this.client.leave()
      await this.localStream.stop()
      await this.localStream.close()
      this.localStream = null
      this.isJoined = false
    },

    // 推流
    async publish() {
      if (!this.isJoined) {
        console.warn('publish() - please join() firstly')
        return
      }
      if (this.isPublished) {
        console.warn('duplicate RtcClient.publish() observed')
        return
      }
      try {
        await this.client.publish(this.localStream)
      } catch (e) {
        console.error('failed to publish local stream ' + e)
        this.isPublished = false
      }

      this.isPublished = true
    },

    async unpublish() {
      if (!this.isJoined) {
        console.warn('unpublish() - please join() firstly')
        return
      }
      if (!this.isPublished) {
        console.warn('RtcClient.unpublish() called but not published yet')
        return
      }

      await this.client.unpublish(this.localStream)
      this.isPublished = false
    },

    // 绑定事件
    bindEvents() {
      // fired when a remote stream is added
      this.client.on('stream-added', (evt) => {
        const remoteStream = evt.stream
        const id = remoteStream.getId()
        const userId = remoteStream.getUserId()
        console.log(`remote stream added: [${userId}] ID: ${id} type: ${remoteStream.getType()}`)
        console.log('subscribe to this remote stream')
        this.client.subscribe(remoteStream)
      })
      // fired when a remote stream has been subscribed
      this.client.on('stream-subscribed', (evt) => {
        const remoteStream = evt.stream
        const id = remoteStream.getId()
        this.remoteStreamArr.push(id)

        // this.addView(id)
        this.$nextTick(() => {
          remoteStream.play('remote_stream_' + id + '')
        })

        console.log('stream-subscribed ID: ', id)
      })

      this.client.on('stream-removed', (event) => {
        const remoteStream = event.stream
        const id = remoteStream.getId()
        this.remoteStreamArr = this.remoteStreamArr.filter((id2) => id2 !== id)
      })

      // 远端视频流断开连接，挂断本地流
      this.client.on('peer-leave', (event) => {
        console.log('peer-leave..................')
        this.fnHangUpCall(this.roomId)
      })
    },
  },
  watch: {
    callList(val) {
      if (val.length === 0) {
        this.showCallList = false
      }

      if (val.length >= 1) {
        this.$nextTick(() => {
          this.latestCall = val[0]
        })
      } else {
        this.$nextTick(() => {
          this.latestCall = null
        })
      }
    },
    status(val) {
      if (val === 0) {
        this.newCallStatus = true
      } else {
        this.newCallStatus = false
      }
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->


<style scoped lang="less">
.remoteBox {
  position: absolute;
  top: 96px;
  left: 65px;
  width: 1030px;
  height: 681px;
  background: #0b1333 url('~@/assets/img/logo-text.png') center no-repeat;
}
</style>
