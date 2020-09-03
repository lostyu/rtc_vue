<template>
  <div id="app">
    <router-view v-if="!error"></router-view>
    <error-page v-else :error="error"></error-page>
    <app-progress ref="progress"></app-progress>
  </div>
</template>

<script>
import '@/assets/css/app.scss'
import '@/assets/css/buttons.css'
import ErrorPage from '@/components/ErrorPage'
import AppProgress from '@/components/Progress'

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
</style>
