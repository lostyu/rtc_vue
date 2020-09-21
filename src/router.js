import VueRouter from 'vue-router'

// import Index from '@/pages/Index.vue'
// import Test from '@/pages/Test.vue'
import Admin from '@/pages/Admin.vue'
import Customer from '@/pages/Customer.vue'
// import All from '@/pages/All'

const routes = [
  // { path: '/', component: Index },
  // { path: '/test', component: Test },
  { path: '/admin', component: Admin, meta: { title: '新仙C果-视频客服' } },
  { path: '/customer', component: Customer, meta: { title: '新仙C果-视频客服' } }
]
const router = new VueRouter({
  routes
})
export default router
