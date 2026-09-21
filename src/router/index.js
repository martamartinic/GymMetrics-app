import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'

import { useAuthStore } from '@/stores/auth.store.js'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  }) //const Router zagrada
  //do tuda je originalni sadržaj datoteke

  //dodano novo
  Router.beforeEach((to) => {

    const authStore = useAuthStore()

    // Ako stranica zahtijeva prijavu, a trener nije prijavljen -> login
    if (
      to.meta.requiresAuth &&
      !authStore.isLoggedIn
    ) {
      return '/login'
    }

    // Ako je trener već prijavljen, ne otvara se login nego dashboard
    if (
      to.path === '/login' &&
      authStore.isLoggedIn
    ) {
      return '/dashboard'
    }

    // Ako je trener već prijavljen, ne otvara se signup
    if (
      to.path === '/signup' &&
      authStore.isLoggedIn
    ) {
      return '/dashboard'
    }

    return true
  })

  return Router //ovaj return je tu originalno

}) //export default defineRouter zagrada
