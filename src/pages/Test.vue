<template>
  <div class="container">
    <div class="side">
      userId:
      <input v-model="userId" />
      <br />roomId:
      <input v-model="roomId" />
      <br />

      <button @click="join">创建房间</button>
      <button @click="leave">离开房间</button>
      <button @click="publish">publish</button>
      <button @click="unpublish">unpublish</button>
    </div>
    <div class="main">
      <div id="local_stream"></div>
      <div class="remoteBox">
        <div v-for="item in remoteStreamArr" :key="item" :id="'remote_stream_'+item"></div>
      </div>
    </div>
  </div>
</template>

<script>
import TRTC from 'trtc-js-sdk'

export default {
  data() {
    return {
      roomId: 500,
      sdkAppId: '',
      userId: 'tony',
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
  mounted() {
    this.logger()
  },
  methods: {
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
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.container {
  display: flex;
  height: 100%;
}
.side {
  width: 300px;
  background-color: #ddd;
}
.main {
  flex: 1;
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  grid-template-columns: repeat(6, 1fr);

  .remoteBox {
    grid-row-start: 1;
    grid-row-end: 4;
    grid-column-start: 2;
    grid-column-end: 7;
  }
  .remoteBox > div {
    width: 100%;
    height: 100%;
  }
}
#local_stream {
  width: 500px;
  height: 300px;
}
</style>
