<template>
  <q-layout view="hHh Lpr lFf">

    <AppHeader />   <!-- HEADER KOMPONENTA -->

    <!-- SADRŽAJ EKRANA CHILDREN IZ ROUTES KOJI SE PRIKAZUJE IZMEĐU HEADERA I FOOTERA OVISNO O ODABIRU KLIJENTA (PR. DETALJI KLIJENTA, TERMINI ITD.)-->
    <q-page-container>
      <router-view />
    </q-page-container>

    <AppBottomNavigation />   <!-- FOOTER KOMPONENTA -->

  </q-layout>

</template>

<script setup>

import AppHeader from '@/components/AppHeader.vue'
import AppBottomNavigation from '@/components/AppBottomNavigation.vue'

</script>
