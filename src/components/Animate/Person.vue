<template>
  <div style="width: 100%; height:100%" id="animation"></div>
</template>

<script>
export default {
  data() {
    return {}
  },
  mounted() {
    bodymovin.loadAnimation({
      path: '/js/data2.json', //json文件路径
      loop: true,
      autoplay: true,
      renderer: 'canvas', //渲染方式，有"html"、"canvas"和"svg"三种
      container: document.getElementById('animation'),
    })
  },
}
</script>
<style scoped>
</style>