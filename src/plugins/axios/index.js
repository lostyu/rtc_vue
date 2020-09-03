import _ from 'lodash'
import qs from 'qs'
import getBaseUrl from './getBaseUrl'
import AxiosError from './axiosError'
import { eventProxy } from '@/utils/event'
import axios from 'axios'

export default function (context) {
  let { app, store } = context
  let loading
  let instance = axios.create()
  async function axiosErrorHandle(error) {
    const axiosError = new AxiosError(error, function errorAdaptor(res) {
      // 对error 的数据 标准化处理
      const { msg, ...rest } = res
      res = {
        message: msg,
        ...rest,
      }
      return res
    })
    console.log(axiosError.config)
    if (axiosError.config && axiosError.config.interceptors.error) {
      if (axiosError.status === 401) {
        const { accessToken, refreshToken } = store.state.user.auth
        if (accessToken && refreshToken) {
          try {
            await tryRefreshToken(refreshToken)
            console.log(axiosError.config)
            const result = await instance.request(axiosError.config)

            return Promise.resolve(result)
          } catch (e) {
            // 特殊处理码
            e.exceptionCode = 'E_REFRESH_FAIL'
            e.message = '刷新token失败，请重新登陆~'
            return doLogin(e)
          }
        } else {
          // 特殊处理码
          axiosError.exceptionCode = 'E_NO_REFRESHTOKEN'
          axiosError.message = 'token已过期，请重新登陆~'
          return doLogin(axiosError)
        }
      }

      if (axiosError.config.showError) {
        app.$toast(axiosError.message)
      }
      if (axiosError.redirect) {
        doRedirect(axiosError.redirect)
      }
    }
    return Promise.reject(axiosError)
  }
  function doRedirect(src) {
    console.log(`redirectTo:${src}`)
  }
  function doLogin(e) {
    // 默认的重定向操作，需要节流
    console.log(e)

    // 每个请求都需要及时返回错误
    return Promise.reject(e)
  }
  let refreshTokenLock = false
  function tryRefreshToken(refreshToken) {
    return new Promise((resolve, reject) => {
      if (!refreshTokenLock) {
        // 一次session 内只会做一次refresh 操作
        refreshTokenLock = true
        return instance
          .post(
            '/oauth/token',
            {
              grant_type: 'refresh_token',
              client_id: 'client_1',
              client_secret: '123456',
              refresh_token: refreshToken,
            },
            {
              interceptors: { error: false }, // 这里的error 不再走默认的onError;
            }
          )
          .then((res) => {
            store.commit('SET_TOKEN', res.data)
            eventProxy.trigger('refreshToken', true)
            resolve()
          })
          .catch((e) => {
            console.warn(`[refresh token fail] ${e.message}`)
            reject(e)
          })
      } else {
        eventProxy.one('refreshToken', function () {
          resolve()
        })
      }
    })
  }
  instance.interceptors.request.use(
    (req) => {
      _.defaultsDeep(req, {
        showError: true, // 展示错误的类型
        redirect: true, // 重定向的处理类型
        showLoading: false, //
        showProgress: true,
        postDataType: 'form',
        interceptors: {
          // 为false 时，不再经过某个interceptor
          request: true,
          response: true,
          error: true,
        },
      })
      if (req.interceptors.request) {
        if (req.showProgress) {
          app.$progress.start()
        }
        if (req.showLoading) {
          loading.clear()
        }
        console.log(req)
        if (req.interceptors.request) {
          if (req.method === 'post') {
            if (req.postDataType === 'form') {
              req.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
              req.transformRequest = (data) => {
                return qs.stringify(data)
              }
            }
          }

          const { accessToken } = store.state.user.auth
          if (accessToken) {
            req.headers['Authorization'] = `Bearer ${accessToken}`
          }
          req.baseURL = getBaseUrl(req.url)
        }
      }
      return req
    },
    (error) => {
      return axiosErrorHandle(error)
    }
  )
  instance.interceptors.response.use(
    (res) => {
      // 优先处理进度条和loading的显示
      if (res.config.showProgress) {
        app.$progress.finish()
      }
      if (res.config.showLoading) {
        loading.clear()
      }
      if (res.config.interceptors.response) {
        if (res.data.status === 0) {
          return Promise.resolve(res.data)
        } else {
          const error = new Error('Unexpected Response')
          error.response = res
          error.request = res.request
          error.config = res.config
          return axiosErrorHandle(error)
        }
      } else {
        return Promise.resolve(res)
      }
    },
    (error) => {
      // 优先处理进度条和loading的显示
      console.log(error)
      if (error.config.showProgress) {
        app.$progress.fail()
        app.$progress.finish()
      }
      if (error.config.showLoading) {
        loading.clear()
      }
      return axiosErrorHandle(error)
    }
  )
  return instance
}
