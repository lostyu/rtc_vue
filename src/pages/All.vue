<template>
  <div>
    <div v-if="isShowModal" class="modal">
      <div class="wrap">
        <span @click="hideModal" class="close">×</span>
        <div class="title">接受{{modalInfo.name}}呼叫将中断本次通话</div>
        <div class="btns">
          <button @click="handleNo(modalInfo)" class="off">挂断</button>
          <button @click="handleOk(modalInfo)" class="on">接受</button>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="main">
        <div class="remoteBox">
          <div v-for="item in remoteStreamArr" :key="item" :id="'remote_stream_'+item"></div>
        </div>
        <div v-if="showStoreList" class="statusList">
          <ul>
            <li v-for="item in storeList" :key="item.id">
              <span class="text">{{item.name}}</span>
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
            <span @click="toggleStoreList" class="text">{{curStoreInfo.name}}</span>
            <span class="arrow" :class="{'active': showStoreList}"></span>
          </div>
        </div>
      </div>

      <div class="side">
        <div v-if="showCallList&&isAdmin" class="fromCallList">
          <ul>
            <li v-for="item in callList" :key="item.id">
              <span class="text2">{{item.name}}</span>
              <span class="zt">
                <a @click="turnOn(item)" class="call" href="javascript:;"></a>
                <a @click="hangUp(item)" class="offcall" href="javascript:;"></a>
              </span>
            </li>
          </ul>
        </div>
        <div class="text">
          <div v-if="latestCall&&isAdmin" class="fromCall">
            <span @click="turnOn(latestCall)" class="item">{{latestCall.name}}来电呼叫</span>
            <span @click="toggleCallList" class="icon" :class="{'revert': showCallList}"></span>
          </div>
          <span v-if="callNum>0&&isAdmin" class="fromCallNum">{{callNum}}</span>
        </div>
        <div class="video">
          <div id="local_stream"></div>
        </div>
        <div class="title">{{curUserInfo.name}}</div>
        <div class="btns">
          <button @click="join">加入</button>
          <div @click="handleBtnCall" v-show="btnCall" class="call"></div>
          <div @click="handleBtnOff" v-show="btnOff" class="off"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TRTC from 'trtc-js-sdk'

export default {
  data() {
    return {
      isShowModal: false,
      modalInfo: '', // 弹层显示的门店名
      curUserInfo: {
        id: '12312',
        name: '塔山西街店',
        role: 'customer', // customer  admin
      }, // 当用户信息，初始化获取
      curStoreInfo: null, // 对方门店信息，默认中控，如果角色是中控，则不显示
      status: 0, // 当前用户状态 0空闲，1忙碌

      showStoreList: false,
      showCallList: false,
      callList: [], //来电列表
      storeList: [
        //门店列表
        {
          id: '1',
          name: '塔山西街店',
          status: 1,
        },
        {
          id: '2',
          name: '塔山西街2店',
          status: 0,
        },
      ],

      latestCall: null, // 最近来电
      btnCall: false, // 拨打按钮是否显示
      btnOff: false, // 挂断按钮是否显示
      websock: null,
      // ======================= RTC
      roomId: 500,
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
    }
  },
  computed: {
    callNum() {
      return this.callList.length
    },
    storeNum() {
      return this.storeList.length
    },
    isAdmin() {
      return this.curUserInfo.role === 'admin'
    },
  },
  mounted() {
    this.initData()
    this.roleCrl()
    this.initWebSocket()
    this.mock()
    this.logger()
  },
  destroyed() {
    this.websock.close()
  },
  methods: {
    // 模拟请求
    mock() {
      const id = Math.floor(Math.random() * 100000)
      this.latestCall = {
        id,
        name: 'user_' + Math.floor(Math.random() * 100000),
        status: Math.floor(Math.random() * 10) % 2,
      }
      this.callList.unshift(this.latestCall)
      let i = 0
      setInterval(() => {
        if (i > 3) {
          return
        }
        i++
        const id = Math.floor(Math.random() * 100000)
        this.latestCall = {
          id,
          name: 'user_' + Math.floor(Math.random() * 100000),
          status: Math.floor(Math.random() * 10) % 2,
        }
        this.callList.unshift(this.latestCall)
      }, 2000)

      // setInterval(() => {
      //   const id = Math.floor(Math.random() * 100000)
      //   this.latestCall = {
      //     id,
      //     name: 'user_' + Math.floor(Math.random() * 100000),
      //     status: Math.floor(Math.random() * 10) % 2,
      //   }
      //   this.callList.unshift(this.latestCall)
      // }, 1000)
    },
    // 初始化数据
    initData() {
      console.log('---------------------')
      const { userId, role } = this.$route.query
      const id = Math.floor(Math.random() * 100)
      this.curUserInfo = {
        id,
        name: userId,
        role,
      }
      this.userId = userId
    },
    // 权限控制
    roleCrl() {
      if (this.curUserInfo.role === 'customer') {
        this.curStoreInfo = {
          id: '1231231',
          name: '新仙农业中控',
          status: 1,
        }
        this.storeList = []
        this.callList = []
        this.btnCall = true
      } else if (this.curUserInfo.role === 'admin') {
        this.curStoreInfo = null
        this.storeList = []
        this.btnCall = false
        this.btnOff = false
      }
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

    hideModal() {
      this.isShowModal = false
    },

    showModal() {
      this.isShowModal = true
    },

    // 弹层确定按钮
    handleOk(item) {
      // this.curStoreInfo = {...item}
      // 挂断当前的
      this.handleBtnOff()
      this.turnOn(item)
      this.isShowModal = false
    },
    // 弹层取消按钮
    handleNo(item) {
      // 挂断未接通的电话
      this.hangUp(item)
      this.isShowModal = false
    },

    // 挂断
    hangUp(item) {
      // TODO 调用API
      this.callList = this.callList.filter((call) => call.id !== item.id)
      this.latestCall = this.callList[0] ? this.callList[0] : null
    },
    // 接听
    turnOn(item) {
      // 空闲状态，直接接通
      if (this.status === 0) {
        // TODO 加入房间，调用API
        this.curStoreInfo = { ...item }
        this.callList = this.callList.filter((call) => call.id !== item.id)
        this.settingCall()
      } else {
        this.modalInfo = { ...item }
        this.isShowModal = true
      }
    },

    // 接通电话回调设置admin
    settingCall() {
      this.status = 1
      this.btnOff = true
      this.latestCall = this.callList[0] ? this.callList[0] : null
      this.showCallList = false
    },

    // 挂断电话回调设置
    settingOffCall() {
      if (this.isAdmin) {
        this.curStoreInfo = null
        this.btnOff = false
        this.status = 0
      } else {
        this.btnOff = false
        this.btnCall = true
        this.status = 0
      }
    },
    // 拨打按钮 customer显示
    handleBtnCall() {
      // TODO 创建房间，调用API
      this.join()

      this.btnOff = true
      this.btnCall = false
      this.status = 1

      console.log(this.curUserInfo)
      console.log(this.curStoreInfo)
      console.log(this.status)
    },
    // 挂断大按钮
    handleBtnOff() {
      // TODO api 退出房间
      this.leave()
      this.settingOffCall()
    },

    initWebSocket() {
      //初始化weosocket
      const wsuri = 'ws://127.0.0.1:8080'
      this.websock = new WebSocket(wsuri)
      this.websock.onmessage = this.websocketonmessage
      this.websock.onopen = this.websocketonopen
      this.websock.onerror = this.websocketonerror
      this.websock.onclose = this.websocketclose
    },
    websocketonopen() {
      //连接建立之后执行send方法发送数据
      let actions = { test: '12345' }
      this.websocketsend(JSON.stringify(actions))
    },
    websocketonerror() {
      //连接建立失败重连
      this.initWebSocket()
    },
    websocketonmessage(e) {
      //数据接收
      const redata = JSON.parse(e.data)
    },
    websocketsend(Data) {
      //数据发送
      this.websock.send(Data)
    },
    websocketclose(e) {
      //关闭
      console.log('断开连接', e)
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
      if (this.isJoined) {
        console.log('已经加入房间，不能重复加入房间')
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
      } catch (e) {
        console.log('加入房间失败', e)
      }
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
      this.localStream.stop()
      this.localStream.close()
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
        // use customized renderer
        // if (remoteStream.hasAudio()) {
        //   updateAudio(id, remoteStream.getAudioTrack());
        // }
        // if (remoteStream.hasVideo()) {
        //   updateVideo(id, remoteStream.getVideoTrack());
        // }
        console.log('stream-subscribed ID: ', id)
      })

      this.client.on('stream-removed', (event) => {
        const remoteStream = event.stream
        const id = remoteStream.getId()
        this.remoteStreamArr = this.remoteStreamArr.filter((id2) => id2 !== id)
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
<style lang="less">
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: url('../assets/img/bg.png') center no-repeat;
  // background: url('../assets/img/9.png');
  background-size: 100% 100%;
  background-attachment: fixed;
}
</style>

<style scoped lang="less">
#local_stream {
  height: 100%;
}
.green {
  background-color: #30dd41;
}
.red {
  background-color: #eb3223;
}
.gray {
  background-color: #ababab;
}

.modal {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);

  .wrap {
    position: relative;
    width: 800px;
    // height: 300px;
    padding: 60px 20px;
    background-color: #fff;
    text-align: center;
    border-radius: 10px;
    background-color: rgba(237, 245, 255, 0.94);
  }
  .close {
    position: absolute;
    right: -10px;
    top: -10px;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    background-color: #dc372a;
    border-radius: 50%;
    font-size: 20px;
    color: #fff;
    cursor: pointer;
  }
  .title {
    font-size: 40px;
    margin-bottom: 60px;
  }
  .btns {
    font-size: 28px;
    .off,
    .on {
      border: none;
      color: #fff;
      font-weight: 500;
      padding: 10px 16px;
      border-radius: 6px;
    }
    .off {
      background-color: #dc372a;
      margin-right: 30px;
    }
    .on {
      background-color: #2faf2c;
    }
  }
}

.container {
  display: flex;
  height: 100%;
  padding: 0 50px;
  margin: 0 auto;
  // grid-template-columns: repeat(24, 1fr);
  // grid-template-rows: repeat(24, 1fr);

  .main {
    position: relative;
    background: url('../assets/img/remote.png') top center no-repeat;
    background-size: 100% 100%;
    width: 1160px;
    height: 977px;
    margin-right: 95px;

    .remoteBox {
      position: absolute;
      top: 96px;
      left: 65px;
      width: 1030px;
      height: 681px;
      background: #0b1333 url('../assets/img/logo-text.png') center no-repeat;
      > div {
        height: 100%;
      }
    }
    .statusList {
      position: absolute;
      top: 517px;
      left: 50%;
      margin-left: -195px;
      width: 390px;
      height: 260px;
      background-color: rgba(23, 20, 65, 0.95);
      border: 1px solid #535071;
      border-radius: 4px 4px 0px 0px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #535071;
      }

      &::-webkit-scrollbar-track {
        background-color: #fff;
      }

      ul {
        padding: 10px 30px;
        li {
          position: relative;
          padding: 15px 0;
          font-size: 22px;
          color: #fff;
          border-bottom: 1px solid #535071;
          cursor: pointer;
          &:hover .text {
            color: #faf51f;
          }
          &:last-child {
            border-bottom: none;
          }
          .text {
            display: inline-block;
            max-width: 240px;
          }
          .zt {
            position: absolute;
            right: 0;
            i {
              display: inline-block;
              margin-right: 5px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
            }
          }
        }
      }
    }
    .remoteTitle {
      position: absolute;
      top: 777px;
      left: 65px;
      width: 1030px;
      height: 78px;
      line-height: 78px;
      background-color: #2b2d55;
      text-align: center;

      .groupItem {
        position: relative;
        display: inline-block;
        padding-right: 50px;
        // background: url('../assets/img/arrow.png') center right -10px no-repeat;
        .dot {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 30px;
          border-radius: 50%;
        }

        .text {
          font-size: 36px;
          color: #fff;
          cursor: pointer;
        }
        .arrow {
          position: absolute;
          right: 0;
          top: 50%;
          margin-top: -12px;
          height: 24px;
          width: 38px;
          background: url('../assets/img/arrow_down.png') no-repeat;
          background-size: 100% 100%;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center 40%;
        }
        .active {
          transform: rotateZ(180deg);
        }
      }
    }
  }
  .side {
    position: relative;
    margin-top: 120px;
    width: 500px;
    height: 760px;
    background: url('../assets/img/local.png') no-repeat;
    background-size: 100% 100%;
    padding: 36px 58px 0 54px;
    .text {
      height: 67px;
      position: relative;

      .fromCall {
        position: relative;
        height: 67px;
        line-height: 67px;
        margin: 0 20px;
        color: #fff;
        font-size: 20px;

        .item {
          display: inline-block;
          width: 290px;
          max-width: 290px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          cursor: pointer;
        }
        .icon {
          cursor: pointer;
          position: absolute;
          right: 0;
          top: 50%;
          margin-top: -12px;
          height: 24px;
          width: 38px;
          background: url('../assets/img/arrow.png') no-repeat;
          background-size: 100% 100%;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .revert {
          // transform: translateY(180deg);
          transform: rotateZ(180deg);
        }
      }
      .fromCallNum {
        position: absolute;
        top: -18px;
        right: -18px;
        width: 36px;
        height: 36px;
        line-height: 36px;
        text-align: center;
        border-radius: 50%;
        background-color: #eb3223;
        color: #fff;
        cursor: pointer;
      }
    }
    .fromCallList {
      position: absolute;
      z-index: 2;
      top: 103px;
      left: 54px;
      width: 388px;
      height: 432px;
      background-color: rgba(23, 20, 65, 0.95);
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #535071;
      }

      &::-webkit-scrollbar-track {
        background-color: #fff;
      }
      ul {
        padding: 10px 30px;
        li {
          position: relative;
          padding: 15px 0;
          font-size: 20px;
          color: #fff;
          border-bottom: 1px solid #535071;

          &:last-child {
            border-bottom: none;
          }
          .text2 {
            display: inline-block;
            max-width: 240px;
          }
          .zt {
            position: absolute;
            right: 0;
            .call,
            .offcall {
              display: inline-block;
              width: 28px;
              height: 28px;
            }
            .call {
              margin-right: 10px;
              background: url('../assets/img/call-icon1.png') no-repeat;
            }
            .offcall {
              background: url('../assets/img/call-icon2.png') no-repeat;
            }
            i {
              display: inline-block;
              margin-right: 5px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
            }
          }
        }
      }
    }
    .video {
      margin-top: 34px;
      height: 398px;
      background: url('../assets/img/photo.png') center bottom no-repeat;
      background-size: auto;
    }
    .title {
      height: 66px;
      line-height: 66px;
      text-align: center;
      font-size: 28px;
      color: #fff;
    }
    .btns {
      height: 158px;
      display: flex;
      align-items: center;
      justify-content: center;

      .call,
      .off {
        width: 152px;
        height: 150px;
        cursor: pointer;
      }
      .call {
        background: url('../assets/img/on.png') no-repeat;
      }
      .off {
        background: url('../assets/img/off.png') no-repeat;
      }
    }
  }
}
</style>
