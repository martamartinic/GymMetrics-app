<!-- header aplikacije -- logo, naziv app i logout gumb -->

<template>

  <!-- GORNJA TRAKA -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">

        <!-- Logo -->
        <div 
            class="header-left"
            role="button"
            tabindex="0"
            aria-label="Otvori popis klijenata"
            @click="goToDashboard"
            @keydown.enter="goToDashboard"
        
        >
          <img
            :src="logo"
            alt="Gym Metrics logo"
            class="header-logo"
          />

          <div class="app-name">
            GYM
          </div>
           <div class="app-name2">
            METRICS
          </div>
        </div>

        <q-space />

        <!-- Odjava -->
        <q-btn
          flat
          round
          dense
          class="logout"
          icon="logout"
          color="black"
          aria-label="Odjava"
          @click="logout"
        />

      </q-toolbar>

    </q-header>

</template>

<script setup> 

import logo from '@/assets/logo/LOGO_APP_finalno_WHITE_BEZ_pozadine_croppedName.png'

import { useRouter } from 'vue-router'
const router = useRouter()

import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()

//funkcija da se na klik na logo otvara dashboard/popis klijenata
function goToDashboard() {
  router.replace('/dashboard')
}

//funkcija za odjavu
function logout() {
  authStore.logout()      //  čišćenje auth store-a.
  router.replace('/login')  // vraćamo korisnika na ekran za prijavu.
}

</script> 

<style scoped>

.app-header {
  background: #111827;
}

.app-toolbar {
  min-height: 64px;
  padding: 0 16px;
}

/* klikabilan logo */
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
  user-select: none;
}

.header-logo {
  width: 42px;
  height: 60px;
  object-fit: contain;
}

/*gumb za odjavu*/
.logout {
  background: #fffff0; 
}

/* GYM */
.app-name {
  color: #BDC4D4;
  font-size: 18px;
  font-weight: 700;
 /* letter-spacing: 1.5px; */
}
/* METRICS */
.app-name2 {
  color: #52677D;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

@media (max-width: 480px) {
  .app-name {
    font-size: 15px;
  }

  .header-logo {
    width: 38px;
    height: 38px;
  }

  .app-toolbar {
    padding: 0 10px;
  }
}

</style>