import Vue from 'vue'
import VueRouter from 'vue-router'
import { Dialog, Toast, Button, Popup } from 'vant'
import AutoImg from '@/components/AutoImg'
import App from './App.vue'
import store from './store'
import router from './router'
import axiosWrapper from './plugins/axios'

function getCurrentContext() {
  return {
    app: app || Vue.prototype,
    store,
    router
  }
}
// if (process.env.NODE_ENV !== 'production') {
//   const VConsole = require('vconsole')
//   const vConsole = new VConsole({
//     defaultPlugins: ['system', 'network', 'element', 'storage']
//   })
// }
Vue.config.productionTip = false

Vue.use(VueRouter)

Vue.use(Toast)
Vue.use(Button)
Vue.use(Popup)
Vue.use(Dialog)
Vue.component('auto-img', AutoImg)
Vue.config.errorHandler = function(err, vm, info) {
  vm.$root.$children[0].errorHandle(err)
}

Vue.prototype.$axios = axiosWrapper(getCurrentContext())
// 挂载顺序 晚于app实例mounted;
const app = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

Vue.prototype.$progress = app.$root.$children[0].$refs.progress
