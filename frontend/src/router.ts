import { createWebHistory, createRouter } from 'vue-router'
import PlanView from './pages/PlanView.vue'


const routes = [
  { 
    path: '/', 
    name: 'plan:new',
    component: PlanView,
  },
  { 
    path: '/:planId', 
    name: 'plan:edit',
    component: PlanView,
    props: true
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})