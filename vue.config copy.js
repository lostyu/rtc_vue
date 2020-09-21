const autoprefixer = require('autoprefixer')
const config = require('./src/config/index')

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
        pathRewrite: {
          '^/baseApi/': '/'
        }
      },
      '/erpApi': {
        target: config.erpUrl,
        changeOrigin: true,
        pathRewrite: {
          '^/erpApi/': '/'
        }
        // pathRewrite: function(path) {
        //   console.log(path)
        //   return path.replace('/erpApi', '')
        // }
      },
      '/socket': {
        target: config.socketUrl,
        ws: true,
        pathRewrite: {
          '^/socket/': '/'
        }
      }
    }
  }
}
