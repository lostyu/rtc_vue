<template>
  <div>
    <audio class="audio" loop controls ref="a1" src="../assets/weixin.mp3" />
    <div class="container">
      <div class="main">
        <div class="debug" style="display: -none">
          sendId:{{ sendId }}<br />
          devStatus:{{ devStatus }}<br />
          authored:{{ authored }}
          <br />
          canBtnOff: {{ canBtnOff }}
          <br />
          bmessage: {{ bMessage }}
          <br />
          timer: {{ timer }}
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
          <div class="remoteBoxAnimate">
            <div class="logo_text">sendId:{{ sendId }}</div>
            <div v-if="animateStatus === 'default'" class="animate default">
              <!-- <AnimateCmp
                id="callAnimate"
                style="position: absolute; left: 0; top: 0"
                v-show="!status"
                ref="callAnimate"
              /> -->
            </div>
            <div v-if="animateStatus === 'call'" class="animate call"></div>
          </div>
          <div v-for="item in remoteStreamArr" :key="item" :id="'remote_stream_' + item"></div>
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
        <div class="text"></div>
        <div class="video">
          <div id="local_stream"></div>
          <AnimateCmp
            id="animation"
            style="position: absolute; left: 0; top: 0"
            v-show="!status"
            :width="width"
            :height="height"
            ref="animation"
          />
        </div>
        <div class="title">{{ deptName }}</div>
        <div class="btns">
          <div @click="handleBtnCall" v-show="btnCall" class="call"></div>
          <div @click="handleBtnOff" v-show="btnOff" class="off"></div>
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

// import Person from '@/components/Animate/Person'
import AnimateCmp from '@/components/Animate/Animate'
import { checkSystemRequirements, checkDevice } from '@/utils/check'

import '@/assets/css/common.less'

export default {
  components: {
    AnimateCmp,
  },
  data() {
    return {
      sendId: 0,
      // 页面设备状态
      devStatus: false,

      // 动画状态
      animateStatus: 'default', // default call

      testId: 0,
      // 253px  353px  1024
      // 388px  398px  1920
      canBtnOff: false, // 默认不能挂断，要2秒后才能挂
      isConnectSocket: false, // 是否连接到socket
      width: '',
      height: '',
      bMessage: true, // 避免多次收到推送消息
      sid: this.$route.query.sid, // 获取token用
      isShowModal: false,
      modalInfo: '', // 弹层显示的门店名

      curStoreInfo: {
        id: '999999',
        name: '新仙农业中控',
      }, // 对方门店信息，默认中控
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
      timeout: 30000, // 通话超时 30秒
      timer: null, // 定时器
      audioTimer: null,

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
    }
  },
  computed: {
    callNum() {
      return this.callList.length
    },
    storeNum() {
      return this.storeList.length
    },
    // 权限校验，socket是否连通，是否获取到user信息
    authored() {
      return this.isConnectSocket && this.deptName !== ''
    },
  },
  async mounted() {
    const SysRequired = await checkSystemRequirements()

    this.deviceChangeFn()

    if (SysRequired) {
      const deviceStatus = await checkDevice()
      if (!deviceStatus.ok) {
        this.devStatus = false
        this.$toast({ message: deviceStatus.msg, duration: 5000 })
      } else {
        this.devStatus = true
      }
    } else {
      this.$toast({ message: '该浏览器不支持视频通话', duration: 5000 })
    }

    this.initData()
    this.roleCrl()
    this.logger()
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

    deviceChangeFn() {
      const _this = this
      navigator.mediaDevices.ondevicechange = async function () {
        const deviceStatus = await checkDevice()
        if (!deviceStatus.ok) {
          _this.$toast({ message: deviceStatus.msg, duration: 5000 })
          _this.devStatus = false
          this.noticeVideo(6, 1, this.sendId)
        } else {
          _this.devStatus = true
          _this.$toast({ message: '设备已连接', duration: 5000 })
          
        }
      }
    },

    // 初始化数据
    async initData() {
      await this.getUserInfo()
      // socket
      let protocol = location.protocol === 'http' ? 'ws' : 'wss'
      // dev
      const url = `${protocol}://${location.host}/socket/video/connect?deptId=${this.curUserInfo.deptId}`

      // prod
      // const url = `${protocol}://${location.host}/video/connect?deptId=${this.curUserInfo.deptId}`
      console.log('==============================', url)

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
      // this.$refs.callAnimate.start()
      this.$refs.animation.start()
    },

    // socket
    bindSocket() {
      this.rws.onopen = () => {
        this.isConnectSocket = true
        this.rws.send('门店连接到视频通话...')
        console.log('门店连接到视频通话...')
      }

      this.rws.onmessage = async (evt) => {
        console.log('门店收到信息')
        // console.log(evt.data)
        const { roomId, type } = JSON.parse(evt.data)
        const obj = JSON.parse(evt.data)
        this.sendId = obj.sendId
        console.log('================================', obj)

        // type等于2，关闭
        if (type === 2) {
          this.testId++
          console.log('@@@@我是socket message type===2，api调用了关闭房间接口', this.testId)
          this.handleBtnOff()
        }

        // 通话按钮
        if (type === 3) {
          if (this.bMessage) {
            console.log('333333333333333333333333333')
            if (this.devStatus) {
              this.handleBtnCall()
            } else {
              // this.rws.send({ status: 'deviceError', message: '设备不可用' })
              this.noticeVideo(6, 1, this.sendId)
              console.log('@@@@@@@@@@@@@@@@@@@@@@@@@设备不可用')
            }
          }
        }
      }

      this.rws.onclose = () => {
        this.rws.send('门店断开连接...')
        console.log('门店断开连接...')
        this.isConnectSocket = false
        // this.handleBtnOff()
        // this.rws.close()
      }

      this.rws.onerror = (evt) => {
        this.$toast({ message: '网络错误，请联系管理员', duration: 5000 })
        console.error('==11123=231=23=123=1=31=23=12=3=123', evt)
        this.isConnectSocket = false
      }
    },
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
      this.storeList = []
      this.callList = []
      this.btnCall = true
    },
    toggleCallList() {
      if (this.callNum === 0) {
        return
      }
      this.showCallList = !this.showCallList
    },
    toggleStoreList() {
      if (this.storeNum === 0) {
        return
      }
      this.showStoreList = !this.showStoreList
    },
    audioStop() {
      clearTimeout(this.audioTimer)
      this.$refs.a1.currentTime = 0
      this.$refs.a1.pause()
    },
    hideModal() {
      this.isShowModal = false
    },

    showModal() {
      this.isShowModal = true
    },

    // 挂断电话回调设置
    settingOffCall() {
      this.btnOff = false
      this.btnCall = true
      this.status = 0
    },
    randomRoomId() {
      const str = Date.now().toString()
      const id = str.substr(-3)
      let r1 = Math.floor(Math.random() * 10)
      const r2 = Math.floor(Math.random() * 10)

      while (r1 === 0) {
        r1 = Math.floor(Math.random() * 10)
      }

      const result = '' + r1 + r2 + id
      this.roomId = Number(result)
    },
    // 调用API接口，创建房间
    async createRoom() {
      if (!this.roomId) {
        return
      }
      try {
        const res = await this.$axios.get(api.createVideoRoom, {
          params: {
            roomId: this.roomId,
            deptId: this.deptId,
            deptName: this.deptName,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
        const data = res.data

        if (data.status === 0) {
          this.btnOff = true
          this.btnCall = false
          this.status = 1

          console.log(this.curUserInfo)
          console.log(this.curStoreInfo)
          console.log(this.status)
        }
      } catch (e) {
        console.log(e)
      }
    },
    // 关闭房间
    // /app/personalCenter/closeVideoRoom?roomId=12345
    async closeVideoRoom() {
      if (!this.roomId) {
        return
      }
      try {
        const res = await this.$axios.get(api.closeVideoRoom, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: {
            roomId: this.roomId,
          },
          interceptors: {
            // 为false 时，不再经过某个interceptor
            request: false,
            response: false,
            error: false,
          },
        })
        const data = res.data
        console.log(data)
      } catch (e) {
        console.log(e)
      }
    },
    // 拨打按钮 customer显示
    async handleBtnCall() {
      if (!this.authored) {
        return
      }
      if (!this.bMessage) {
        return
      }
      if (!this.devStatus) {
        return
      }

      this.$refs.a1.play()
      clearTimeout(this.audioTimer)
      this.audioTimer = setTimeout(() => {
        this.audioStop()
        this.audioTimer = null
      }, this.timeout)

      this.animateStatus = 'call' // 正在拨打中
      // this.rws.send({ status: this.animateStatus, message: '拨打中' })

      this.bMessage = false
      // 创建房间，随机生成房间号
      if (!this.isJoined) {
        this.randomRoomId()
        await this.join()
        await this.createRoom()

        this.noticeVideo(4, 1, this.sendId, this.roomId)
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@拨打中')

        setTimeout(() => {
          this.canBtnOff = true
        }, 1500)

        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.handleBtnOff()
          this.timer = null
          this.audioStop()
        }, this.timeout)
      }
    },
    // 挂断大按钮
    async handleBtnOff() {
      if (this.canBtnOff) {
        console.log('@@@@挂断大按钮@@@@挂断大按钮@@@@挂断大按钮@@@@挂断大按钮')
        this.canBtnOff = false
        await this.leave()
        this.settingOffCall()
        this.testId++
        console.log('@@@@挂断大按钮', this.testId)
        // await this.closeVideoRoom()
        // await this.noticeVideo(2, 1, this.sendId, this.roomId)
        this.bMessage = true
        clearTimeout(this.timer)
        this.timer = null

        this.audioStop()
        this.animateStatus = 'default'
      }
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
          resolve()
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
      // this.rws.send({ status: 'disconnect', message: '挂断' })
      await this.closeVideoRoom()
      this.noticeVideo(2, 1, this.sendId, this.roomId)
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@挂断')
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
      this.client.on('peer-leave', async (event) => {
        this.leave()
        // await this.closeVideoRoom()
        // await this.noticeVideo(2, 1, this.sendId, this.roomId)
        this.btnCall = true
        this.btnOff = false
        this.bMessage = true
        this.animateStatus = 'default'

        console.log('peer-leave..............')
        // this.rws.send({ status: 'disconnect', message: '挂断' })

        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@挂断')
      })

      this.client.on('peer-join', (event) => {
        console.log('======================== peer-join')
        clearTimeout(this.timer)
        this.timer = null

        this.audioStop()
        // this.rws.send({ status: 'connect', message: '通话中' })

        this.noticeVideo(5, 1, this.sendId)
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@通话中')
      })
    },
  },
  watch: {
    callList(val) {
      if (val.length === 0) {
        this.showCallList = false
      }
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped lang="less">
.remoteBoxAnimate {
  position: absolute;
  width: 100%;
  height: 100%;

  .logo_text {
    margin: 0 auto;
    width: 80%;
    height: 20%;
    background: url(~@/assets/img/logo_text.png) center no-repeat;
    background-size: contain;
  }

  .animate {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 80%;

    display: flex;
    align-items: center;
    justify-content: center;

    &.default {
      background: url(~@/assets/img/call_default.gif) center no-repeat;
      background-size: contain;
    }
    &.call {
      background: url(~@/assets/img/call.gif) center no-repeat;
      background-size: contain;
    }
  }
}
</style>
