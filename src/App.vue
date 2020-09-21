<template>
  <div id="app">
    <router-view v-if="!error"></router-view>
    <error-page v-else :error="error"></error-page>
    <app-progress ref="progress"></app-progress>
  </div>
</template>

<script>
import '@/assets/css/app.scss'
import ErrorPage from '@/components/ErrorPage'
import AppProgress from '@/components/Progress'
import router from './router'

/* 路由发生变化修改页面title */
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default {
  data() {
    return {
      error: null,
    }
  },
  components: {
    ErrorPage,
    AppProgress,
  },
  name: 'app',
  watch: {
    $route() {
      this.error = null
    },
  },
  methods: {
    errorHandle(error) {
      this.error = error
    },
  },
}
</script>

<style lang="less">
#app {
  width: 100%;
  height: 100%;
}
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: url('./assets/img/bg.png') center no-repeat;
  // background: url('../assets/img/9.png');
  background-size: 100% 100%;
  background-attachment: fixed;
}
</style>
