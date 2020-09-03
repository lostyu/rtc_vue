import Vue from 'vue'
import Vuex from 'vuex'
// import createPersistedState from "vuex-persistedstate";
import Cookies from 'js-cookie'

import getTopDomain from '@/utils/getTopDomain'
import { merge, pick } from 'lodash'
Vue.use(Vuex)

const persistedStateKey = '__PersistState__'

const initialState = {
  contextPlatform: '',
  user: {
    auth: {
      accessToken: '',
      refreshToken: ''
    }
  },
  landingUrl: ''
}
const userCookies = {
  accessToken: Cookies.get('accessToken'),
  refreshToken: Cookies.get('refreshToken')
}
const storageState = JSON.parse(localStorage.getItem(persistedStateKey)) || initialState
// userCookies 匹配，直接更新初始state值 为 储存的state值。如果不匹配，直接在更新初始state值的user 为 cookies user。
const finalInitState =
  userCookies.accessToken == storageState.user.auth.accessToken
    ? merge({}, initialState, storageState)
    : merge({}, initialState, { user: userCookies })
const store = new Vuex.Store({
  state: finalInitState,
  mutations: {
    REFRESH_USER: function(state, { accessToken, refreshToken = '' }) {
      state.user.auth = Object.assign({}, state.user.auth, {
        accessToken,
        refreshToken
      })

      const domain = getTopDomain(location.hostname)
      Cookies.set(`accessToken`, accessToken, { domain, expires: 30 })
      Cookies.set(`refreshToken`, refreshToken, { domain, expires: 30 })
    }
  },
  actions: {},
  modules: {},
  plugins: []
})

store.subscribe((mutation, state) => {
  let storeState = pick(state, ['user'])
  localStorage.setItem(persistedStateKey, JSON.stringify(storeState))
})

export default store
