import { Cancel } from 'axios'
const redirectMap = {
  // 未登录
  // '001001':{
  //     msg:'您不登录，我实在是无法为您服务啊',
  //     to:'/test'
  // },
  // 未实名认证
}
class AxiosError {
  constructor(error, errorAdaptor = v => v) {
    this.originMessage = error.message
    if (error instanceof Cancel) {
      // 取消的时候传了message,将唤起showError
      this.errNo = 1
      this.originMessage = 'Request Cancel'
      this.displayMessage = error.message || '请求已取消'
    } else {
      if (error.response) {
        const resData = errorAdaptor(error.response.data)
        this.config = error.config
        // 理论上只有2种类型的错误，数据格式不匹配，和没通过validate校验
        if (error.message === 'Unexpected Response') {
          // 服务器返回数据格式不匹配
          const { code, message } = resData
          // displayMessage为服务器返回的msg
          this.errNo = 3
          this.displayMessage = message || '服务器异常'
          this.code = code
          this.data = resData
          if (redirectMap[this.code]) {
            // 如果重定向，此时displayMessage为重定向msg;
            this.displayMessage = redirectMap[this.code]['msg']
            this.redirect = redirectMap[this.code]['to']
          }
        } else {
          // 其他服务器返回错误
          this.errNo = 2
          this.status = error.response.status
          switch (this.status) {
            case 401:
              this.displayMessage = '登录凭证过期'
              break
            case 403:
              this.displayMessage = (resData && resData.message) || '禁止访问，请联系管理员！'
              break

            default:
              this.displayMessage = (resData && resData.message) || '服务小哥开小差了，请稍后重试！'
          }
        }
      } else {
        this.config = error.config
        if (error.message === 'Network Error') {
          this.errNo = 4
          this.displayMessage = '网络异常'
        } else if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') > -1) {
          this.errNo = 5
          this.displayMessage = '请求超时'
        } else {
          this.errNo = -1
          this.displayMessage = '未定义的请求错误类型'
        }
      }
    }
    this.message = this.displayMessage || this.originMessage
  }
}
export default AxiosError
