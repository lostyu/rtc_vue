import config from '@/config'
const UrlHandle = require('@/utils/urlHandle')

const userBaseURL = `${config.baseURL}/user`
const weChatBaseURL = `${config.baseURL}/`
const proxyTable = {
  [userBaseURL]: ['/refreshToken'] // proxyTable 内容为正则表达式，满足的情况下转发
}
function getBaseUrl(url) {
  const path = new UrlHandle(url).getPathString()
  for (const i in proxyTable) {
    for (let j = 0; j < proxyTable[i].length; j++) {
      if (path.match(proxyTable[i][j])) {
        return i
      }
    }
  }
  return '/'
}
// 调用多个服务的时候 baseURL，有些需要baseURL 作转发。比如调用本机上的api 服务，baseURL 肯定不再沿用之前默认的baseURL，并且需要以 /api/node 路径作为转发。
export default getBaseUrl
