import VueRouter from 'vue-router'

import Index from '@/pages/Index.vue'
import Test from '@/pages/Test.vue'

const routes = [
  { path: '/', component: Index },
  { path: '/test', component: Test }
]
const router = new VueRouter({
  routes
})
export default router
