<template>
  <div :id="id" :style="{width: width, height: height}"></div>
</template>

<script>
export default {
  props: {
    id:{
      type: String,
      default: "animation"
    },
    width: {
      type: String,
      default: '100%',
    },
    height: {
      type: String,
      default: '100%',
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    start() {
      bodymovin.loadAnimation({
        // animationData: '',
        path: '/js/data2.json', //json文件路径
        loop: true,
        autoplay: true,
        renderer: 'canvas', //渲染方式，有"html"、"canvas"和"svg"三种
        container: document.getElementById(this.id),
      })
    },
  },
}
</script>
<style scoped>
</style>