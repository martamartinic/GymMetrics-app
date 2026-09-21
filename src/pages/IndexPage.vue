<template>

 <q-layout view="lHh Lpr lFf">

<q-page-container>

  <q-page class="page-background flex flex-center">
    <div class="column items-center welcome-content">

      <div class="logo-container">
        <img
            :src="logo"
            class="logo"
        >
      </div>

    <div class="title-container">
      <div class="welcome-title">
          TRACK & ANALYSE PROGRESS
      </div>
    </div>

    <div class="buttons-container">
      <q-btn
          unelevated
          rounded
          color="primary"
          class="welcome-button"
          label="REGISTRIRACIJA"
          @click="openSignup"
      />
      <q-btn
          unelevated
          rounded
          color="secondary"
          text-color="black"
          class="welcome-button q-mt-sm"
          label="PRIJAVA"
          @click="openLogin"
      />
    </div>
    
    </div>

  </q-page>

</q-page-container>
</q-layout>

</template>


<script setup>

import { useRouter } from 'vue-router'
import logo from '@/assets/logo/LOGO_APP_finalno_WHITE_BEZ_pozadine.png'

const router = useRouter()

function openSignup() {
    router.push('/signup')
}

function openLogin() {
    router.push('/login')
}  
//
</script>

<style scoped>

.welcome-content {
    transform: translateY(-10vh); /* mijenja cijeli sadržaj (logo, naslov, gumbovi) prema gore za 10% visine ekrana bez mijenjanja njihovog međusobnog rasporeda*/
}

.logo-container{
    display:flex;
    justify-content:center;
}

.title-container{
    margin-top:-30px;
    margin-bottom:50px;
}

.buttons-container{
    display:flex;
    flex-direction:column;
    align-items:center;
}

.logo{
    width:500px;
    height:350px;
}

.welcome-title{
    color:#BDC4D4;
    font-size:18px;
    font-weight:500;
    letter-spacing:2px;
    text-align:center;
}

.welcome-button{
    width:280px;
    height:58px;
    font-size:18px;
    margin-bottom: 10px;
}

</style>
