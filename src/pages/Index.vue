<template>
  <!-- userId:
    <input disabled type="text" :value="userId" />
    roomId:
    <input disabled type="text" :value="roomId" />
  <button @click="create">创建房间</button>-->
  <div class="wrapBox">
    <div class="debug">
      status: {{status}}
      <br />
      userId:{{userId}}
      <br />
      <input v-model="userId" />
      <br />
      roomId:{{roomId}}
      <br />
      <input v-model="roomId" />
    </div>
    <div class="contentBox">
      <div class="mainBox">
        <!-- <img src="@/assets/img/rect.png" /> -->
        <div id="remoteBox"></div>
        <div class="text">新仙C果中控</div>
      </div>
      <div class="customerBox">
        <div class="text">111</div>
        <div class="video">
          <div id="local_stream"></div>
        </div>
        <div class="text2">{{userId}}</div>
        <div class="btns">
          <a
            v-if="status===0"
            class="button button-highlight button-pill button-jumbo sendBtn"
            @click="create"
          >发起视频通话</a>
          <a
            v-else
            class="button button-caution button-pill button-jumbo closeBtn"
            @click="close"
          >结束通话</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '@/config'
import Client from '@/utils/client'
import devices from '@/utils/devices'
import TRTC from 'trtc-js-sdk'

let $ = window.$

const userData = {
  departmentName: '铜梁分公司',
  expiresIn: '2592000',
  deptId: '532283991672225792',
  accessToken:
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI5OTk5OSIsInJvbGUiOlsiUk9MRV9VU0VSIl0sImN1cl9kZXB0X2lkIjoiNTMyMjgzOTkxNjcyMjI1NzkyIiwiZW5hYmxlIjp0cnVlLCJleHAiOjE2MDE2ODc5MjcsImlhdCI6MTU5OTA5NTkyNywidXNlcm5hbWUiOiI5OTk5OSJ9.GHb-r3bvor_b_vJAJjl_SlOImMY4jRzD1y2FrTnjbmTBskJ_S2KhKFvIi4EWk0myzpKF8C_UVhu-fiaKX68rCg',
  userId: '727933092550934528',
  userCode: '99999',
  refreshToken:
    'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiI5OTk5OSIsInJvbGUiOm51bGwsImN1cl9kZXB0X2lkIjoiNTMyMjgzOTkxNjcyMjI1NzkyIiwiZW5hYmxlIjpmYWxzZSwiZXhwIjoxNjA0Mjc5OTI3LCJpYXQiOjE1OTkwOTU5MjcsInVzZXJuYW1lIjoiOTk5OTkifQ.AHnTXnfPn2g56b8xKXsNtRn8RHTUEeqgW-v448dvephz0xCF0AhVzs2oZjyvbRXu',
}

export default {
  data() {
    return {
      deptId: '',
      deptName: '',
      sid: this.$route.query.sid,
      userInfo: null,
      status: 0,
      app: null,

      userId: '',
      roomId: '',
      isJoined: false,
      isPublished: false,
      localStream: null,
      remoteStreamArr: [],
      sdkAppId: '',
      userSig: '',
      client: null,
    }
  },

  async created() {
    const res = await this.$axios.get(`/user/getAdminLoginInfo`, {
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
      this.userInfo = data.data
      this.userId = data.data.departmentName
      this.deptId = data.data.deptId
      this.deptName = data.data.departmentName
      this.randomRoomId()
      devices()
      this.app = new Client(this.userId, this.roomId)
      console.log(this.app)
    }

    // test
    // const { accessToken, refreshToken } = userData
    // this.$store.commit('REFRESH_USER', { accessToken, refreshToken })
    // this.userInfo = userData
    // this.userId = userData.departmentName
    // this.deptId = userData.deptId
    // this.deptName = userData.departmentName
    // this.randomRoomId()
    // devices()
    // this.app = new Client(this.userId, this.roomId)
    // console.log(this.app)
  },
  methods: {
    // 1加入房间
    async join() {
      if (this.isJoined) {
        console.log('已经加入房间，不能重复加入房间')
        return
      }

      const { sdkAppId, userSig } = window.genTestUserSig(this.userId)
      this.sdkAppId = sdkAppId
      this.userSig = userSig

      this.client = TRTC.createClient({
        mode: 'rtc',
        sdkAppId: this.sdkAppId,
        userId: this.userId,
        userSig: this.userSig,
      })

      // 绑定事件
      this.handleEvents()

      try {
        await this.client.join({ roomId: this.roomId })
        console.log('加入房间成功')
        this.isJoined = true

        this.localStream = TRTC.createStream({
          video: true,
          audio: true,
        })
        // this.localStream.setVideoProfile("1080p");

        try {
          await this.localStream.initialize()
          console.log('initialize local stream success')

          // 初始化视频成功，请求接口创建房间
          // this.api_createRoom(this.userId, this.roomId)
          // this.toggleRoom()

          this.localStream.on('player-state-changed', (event) => {
            console.log(`local stream ${event.type} player is ${event.state}`)
          })
          this.localStream.play('local_stream')

          await this.publish()
        } catch (e) {
          console.error('failed to initialize local stream - ' + e)
        }
      } catch (e) {
        console.error('join room failed!', e)
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

    addView(id) {
      $('#remoteBox').append($('<div id="remote_stream_' + id + '"></div>'))
    },

    removeView(id) {
      if ($('#' + id)[0]) {
        $('#' + id).remove()
      }
    },

    // 监听事件
    handleEvents() {
      this.client.on('error', (err) => {
        console.error(err)
        alert(err)
      })
      this.client.on('client-banned', (err) => {
        console.error('client has been banned for ' + err)
        alert('视频通话已结束')
        window.location.reload()
      })
      // fired when a remote peer is joining the room
      this.client.on('peer-join', (evt) => {
        const userId = evt.userId
        console.log('peer-join ' + userId)
      })
      // fired when a remote peer is leaving the room
      this.client.on('peer-leave', (evt) => {
        const userId = evt.userId
        console.log('peer-leave ' + userId)
      })

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
        this.remoteStreamArr.push(remoteStream)
        this.addView(id)
        remoteStream.play('remote_stream_' + id + '')
        // use customized renderer
        // if (remoteStream.hasAudio()) {
        //   updateAudio(id, remoteStream.getAudioTrack());
        // }
        // if (remoteStream.hasVideo()) {
        //   updateVideo(id, remoteStream.getVideoTrack());
        // }
        console.log('stream-subscribed ID: ', id)
      })
      // fired when the remote stream is removed, e.g. the remote user called Client.unpublish()
      this.client.on('stream-removed', (evt) => {
        const remoteStream = evt.stream
        const id = remoteStream.getId()
        // remoteStream.stop();
        this.remoteStreamArr = this.remoteStreamArr.filter((stream) => {
          return stream.getId() !== id
        })
        this.removeView('remote_stream_' + id)
        console.log(`stream-removed ID: ${id}  type: ${remoteStream.getType()}`)
      })

      this.client.on('stream-updated', (evt) => {
        const remoteStream = evt.stream
        const id = remoteStream.getId()
        console.log(
          'type: ' +
            remoteStream.getType() +
            ' stream-updated hasAudio: ' +
            remoteStream.hasAudio() +
            ' hasVideo: ' +
            remoteStream.hasVideo()
        )

        // use customized renderer
        // updateAudio(id, remoteStream.getAudioTrack());
        // updateVideo(id, remoteStream.getVideoTrack());
      })

      this.client.on('mute-audio', (evt) => {
        console.log(evt.userId + ' mute audio')
      })
      this.client.on('unmute-audio', (evt) => {
        console.log(evt.userId + ' unmute audio')
      })
      this.client.on('mute-video', (evt) => {
        console.log(evt.userId + ' mute video')
      })
      this.client.on('unmute-video', (evt) => {
        console.log(evt.userId + ' unmute video')
      })

      this.client.on('connection-state-changed', (evt) => {
        console.log(`RtcClient state changed to ${evt.state} from ${evt.prevState}`)
      })
    },

    query(name) {
      const match = window.location.search.match(new RegExp('(\\?|&)' + name + '=([^&]*)(&|$)'))
      return !match ? '' : decodeURIComponent(match[2])
    },

    async create() {
      if (this.isJoined) {
        return
      }
      // console.log(`${config.baseUrl}/personalCenter/createVideoRoom`)
      const res = await this.$axios.get(`${config.baseUrl}/app/personalCenter/createVideoRoomByMd`, {
        params: {
          roomId: this.roomId,
          deptId: this.deptId,
          deptName: this.deptName,
        },
      })
      if (res.status === 0) {
        this.join()
        this.status = 1
        // console.log(this.app)
      }
    },
    close() {
      if (!this.isJoined) {
        return
      }
      this.$axios
        .get(`${config.baseUrl}/app/personalCenter/closeVideoRoom`, {
          params: {
            roomId: this.roomId,
          },
        })
        .then((res) => {
          this.leave()
          this.status = 0
        })
    },
    randomRoomId() {
      this.roomId = parseInt(Math.random() * 100000)
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: url('../assets/img/bg.png') center no-repeat;
  // background: url('../assets/img/9.png');
  background-size: 100% 100%;
  background-attachment: fixed;
}
.debug {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #fff;
}

.wrapBox {
  box-sizing: border-box;
  height: 100%;
  padding: 0 50px;
}

.contentBox {
  width: 100%;
  height: 100%;
  display: grid;
  // grid-template-rows: repeat(24, 1fr);
  grid-template-columns: 1fr 1fr;
}

.mainBox {
  position: relative;
  width: 1111px;
  height: 912px;
  background: url('../assets/img/remote.png') no-repeat;
  background-size: 100% 100%;
  // grid-row-start: 1;
  // grid-row-end: 25;
  // grid-column-start: 1;
  // grid-column-end: 16;
  // // background-color: bisque;
  // background: url('../assets/img/remote.png') no-repeat;
  // background-size: cover;
  // min-width: 1099px;

  // position: relative;
  // width: 1176px;
  // height: 800px;
  // background: url('../assets/img/remote.png') no-repeat;
  // background-size: cover;
}

.mainBox .text {
  position: absolute;
  width: 100%;
  height: 50px;
  line-height: 50px;
  left: 0;
  bottom: 70px;
  text-align: center;
  font-size: 20px;
  color: #fff;
  // background-color: rgba(255, 255, 255, 0.5);
}

.customerBox {
  margin-left: 82px;
  margin-top: 109px;
  width: 554px;
  height: 774px;
  box-sizing: border-box;
  padding: 37px 64px 0 59px;
  background: url('../assets/img/local.png') no-repeat;
  background-size: 100% 100%;
  // grid-row-start: 3;
  // grid-row-end: 23;
  // grid-column-start: 18;
  // grid-column-end: 25;

  // background-color: antiquewhite;

  display: flex;
  flex-direction: column;
}

.customerBox .text {
  background-color: rgba(255, 255, 255, 0.5);
  height: 68px;
  margin-bottom: 34px;
}

.customerBox .video {
  flex: 1;
  background-color: #ccc;
}

.customerBox .text2 {
  height: 68px;
  line-height: 68px;
  text-align: center;
  font-size: 30px;
  color: #fff;
}

.customerBox .btns {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.customerBox .sendBtn {
  width: 70%;
}
.customerBox .closeBtn {
  width: 70%;
}

// .btn {
//   /* 默认为button 但是在<a>上依然有效 */
//   display: inline-block;
//   text-align: center;
//   text-decoration: none;

//   /* 创造上下间距一定的空间 */
//   margin: 2px 0;

//   /* border透明 (当鼠标悬停时上色) */
//   border: solid 1px transparent;
//   border-radius: 4px;

//   /* padding大小与字体大小相关 (no width/height) */
//   // padding: 0.5em 1em;

//   /* 确保字体颜色和背景色有足够区分度! */
//   color: #ffffff;
//   background-color: #9555af;
// }

#local_stream {
  height: 100%;
}

#remoteBox {
  // padding: 50px;
  position: absolute;
  top: 89px;
  left: 62px;
  width: 987px;
  height: 709px;
  background-color: rgba(255, 255, 255, 0.5);
  > div {
    height: 100%;
  }
}
</style>
