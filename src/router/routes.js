const routes = [

  //EKRANI BEZ MAIN LAYOUT (LOGIN, SIGNUP I INDEXPAGE):

  {
      path: '/', component: () => import('@/pages/IndexPage.vue'),
      //{ path: 'second', component: () => import('@/pages/SecondPage.vue') },
  },
  
  {
      //ruta za registraciju:
      path: '/signup', component: () => import('@/pages/SignupPage.vue'),
  },
  {
      //ruta za prijavu:
      path: '/login', component: () => import('@/pages/LoginPage.vue'),
  },

    //EKRANI NAKON PRIJAVE/SIGNUP 
    //SVI UNUTAR MAINLAYOUT-A 
  
  {
      path: '/dashboard', component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        //ruta za dashboard
        { 
          path: '', component: () => import('@/pages/DashboardPage.vue'), 
              //  meta: { requiresAuth: true }
        },
    
         // OVE RUTE ĆE SE POPUNITI KADA SE NAPRAVE EKRANI

      // {
      //   path: 'training', component: () => import('@/pages/TrainingPage.vue'),
      // },

      // {
      //   path: 'calendar',
      //   component: () => import('@/pages/CalendarPage.vue'),
      // },

      // {
      //   path: 'profile',
      //   component: () => import('@/pages/ProfilePage.vue'),
      // },

      // {
      //   path: 'add-client',
      //   component: () => import('@/pages/AddClientPage.vue'),
     //    //meta: {requiresAuth: true}  //radi zaštite rute
      // },

      // {
      //   path: 'clients/:id',
      //   component: () => import('@/pages/ClientDetailsPage.vue'),
      //   //meta: {requiresAuth: true} //radi zaštite rute
      // },

      ], //Children zagrada
  },

    // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
] //const routes zagrada

export default routes
