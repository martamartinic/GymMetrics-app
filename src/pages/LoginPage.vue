<template>
<q-layout view="lHh Lpr lFf">
<q-page-container>
    <q-page class="page-background flex flex-center" >

    <q-card
        flat
        class="auth-card"
    >

        <!-- Logo -->
        <div class="logo-container">
            <img
                :src="logo"
                class="login-logo"
                alt="GymMetric logo"
            >
        </div>

        <!-- NASLOV PRIJAVA-->
        <div class="title-container">
            <div class="login-title">
                PRIJAVA
            </div>
        </div>

        <!-- POLJA ZA UNOS -->
        <div class="inputs-container">
                
                <!-- Email -->
                <q-input
                    outlined
                    rounded
                    v-model="email"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    label="Email"
                    color="primary"
                    dark
                />
                <q-space class="q-my-sm"/>

                <!-- Lozinka -->
                <q-input
                    outlined
                    rounded
                    v-model="lozinka"
                    type="password"
                    autocomplete="current-password"
                    label="Lozinka"
                    color="primary"
                    dark
                />
        </div>

        <q-space class="q-my-lg"/>

        <div class="buttons-container">

            <q-btn
                unelevated
                rounded
                color="primary"
                class="login-button"
                label="Prijavi se"
                :loading="loading"
                @click="login"
            />

            <q-btn
                flat
                rounded
                color="secondary"
                class="login-signup-button"
                label="Nemate račun? Registrirajte se"
                @click="openSignup"
            />

        </div>

    </q-card>

</q-page>

</q-page-container>

</q-layout>

</template>

<script setup>

import { ref } from 'vue'
import logo from '@/assets/logo/LOGO_APP_finalno_WHITE_BEZ_pozadine_cropped.png'

import { Notify } from 'quasar' //za obavijest (quasar notify)

import { useRouter } from 'vue-router'  //uvozi router
const router = useRouter();             //stvara router objekt

import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore();

const email = ref('')      //pohranjuje email
const lozinka = ref('')    //pohranjuje lozinku

const loading = ref(false) //služi za :loading="loading  //kad je true vrti spinner i blokira višestruki klik 

//metoda za prijavu
async function login() {

   // loading.value = true;
   //zaštita od dvostrukog klika -- ako je prijava već krenula izlazi iz funkcije
   if (loading.value) {
        return;
    } //if zagrada

    if(!email.value.trim()){  //provjera praznog maila 
       Notify.create({
            type: 'warning',
            message: 'Email je obavezan!',
            position: 'top',
            timeout: 2000
        })
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email.value)){   //provjera formata emaila
        Notify.create({
            type:'warning',
            message:'Format email adrese nije ispravan.',
            position:'top',
            timeout:2000
        })
        return;
    }

    if(!lozinka.value.trim()){    //provjera da lozinka nije prazna
        Notify.create({
            type: 'warning',
            message: 'Lozinka je obavezna!',
            position: 'top',
            timeout: 2000
        })
        return;
    }

    loading.value=true; //loading učitavanje --prikazuje se spinner

    try{
        const rezultat = await authStore.login( 
            email.value,
            lozinka.value
        ) //await authService.signup zagrada

        //loading.value = false;

        if(rezultat.success) {          //ako je prijava uspješna znači da je email postoji i da je bcrypt potvrdio lozinku
            //alert(rezultat.message);
            Notify.create({
                type: 'positive',
                message: rezultat.message,
                position: 'top',
                timeout: 2000
            }) //q.notify zagrada

            //čišćenje polja nakon uspješne prijave
            email.value = "";
            lozinka.value = "";

            setTimeout(() => {   //nakon uspješne prijave otvara se dashboard
                router.push('/dashboard')
            },1200)
        }//if zagrada
        else {
            //alert(rezultat.message);
            Notify.create({
                type: 'negative',
                message: rezultat.message,
                position: 'top',
                timeout: 2500
            })//q.notify zagrada
        }//else zagrada
    }//try zagrada
    catch (error) { 
        console.error('Greška prilikom prijave:', error) 
        Notify.create({ 
            type: 'negative', 
            message: 'Došlo je do greške prilikom prijave.', 
            position: 'top', 
            timeout: 2500 
        }) //notify zagrada
    } //catch zagrada
    finally{
        loading.value = false;    //loading spinner se gasi
    } //finally zagrada
    
} //async function zagrada

function openSignup() {
    router.push('/signup')   //za otvaranje ekrana za registraciju klikom na gumb "Nemate račun?..."
}

</script>

<style scoped>

.logo-container{
    display:flex;
    justify-content:center;
}

.login-logo{
    width:500px;
    height:200px;
}

.title-container{
    text-align:center;
    margin-top:10px;
    margin-bottom:30px;
}

.login-title{
    font-size:34px;
    font-weight:bold;
    color:#BDC4D4;
}

.inputs-container{
    margin-bottom:35px;
}

.buttons-container{
    display:flex;
    flex-direction:column;
}

.login-button{
    height:56px;
    font-size:18px;
}

.login-signup-button{
    height:52px;
    margin-top:14px;
}

</style>
