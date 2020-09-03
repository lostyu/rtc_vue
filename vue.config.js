const autoprefixer = require('autoprefixer');
module.exports = {
  runtimeCompiler: true,
  css: {
    sourceMap: true,
    loaderOptions: {
      postcss: {
        plugins: [
          autoprefixer()
        ]
      },
      sass:{
        prependData:`@import "@/assets/css/_mixin.scss";`
      }
    }
  },
  configureWebpack: (config) => {
    // console.log(JSON.stringify(config.module.rules));
  },
}