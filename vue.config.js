const autoprefixer = require('autoprefixer')
const config = require('./src/config/index')

process.on('uncaughtException', function(err) {
  //打印出错误
  console.log(err)
  //打印出错误的调用栈方便调试
  console.log(err.stack)
})

module.exports = {
  runtimeCompiler: true,
  css: {
    sourceMap: true,
    loaderOptions: {
      postcss: {
        plugins: [autoprefixer()]
      },
      sass: {
        prependData: `@import "@/assets/css/_mixin.scss";`
      }
    }
  },
  configureWebpack: config => {
    // console.log(JSON.stringify(config.module.rules));
  },
  devServer: {
    port: 80,
    https: true,
    proxy: {
      '/baseApi': {
        target: config.baseUrl,
        changeOrigin: true,
        pathRewrite: function(path) {
          const result = path.replace('/baseApi', '')
          console.log('baseApi:', result)
          return result
        }
      },
      '/erpApi': {
        target: config.erpUrl,
        changeOrigin: true,
        pathRewrite: function(path) {
          const result = path.replace('/erpApi', '')
          console.log('erpApi', result)
          return result
        }
      },
      '/socket': {
        target: config.socketUrl,
        ws: true,
        // pathRewrite: {
        //   '^/socket/': '/'
        // }
        pathRewrite: function(path) {
          const result = path.replace('/socket', '')
          console.log('socket', result)
          return result
        }
      }
    }
  }
}
