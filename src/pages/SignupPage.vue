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
                class="signup-logo"
            >
        </div>

        <!-- NASLOV REGISTRACIJA-->
        <div class="title-container">
            <div class="signup-title">
                REGISTRACIJA
            </div>
        </div>

        <!-- POLJA ZA UNOS -->
        <div class="inputs-container">
                <!-- Ime -->
                <q-input
                    outlined
                    rounded
                    v-model="ime"
                    autocomplete="off"
                    label="Ime"
                    color="primary"
                    dark
                />
                <q-space class="q-my-sm"/>
                
                <!-- Prezime -->
                <q-input
                    outlined
                    rounded
                    v-model="prezime"
                    autocomplete="off"
                    label="Prezime"
                    color="primary"
                    dark
                />
                <q-space class="q-my-sm"/>

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
                    autocomplete="new-password"
                    label="Lozinka"
                    color="primary"
                    dark
                />

                <q-space class="q-my-sm"/>

                <!-- Potvrda lozinke -->
                <q-input
                    outlined
                    rounded
                    v-model="potvrdaLozinke"
                    type="password"
                    autocomplete="new-password"
                    label="Potvrda lozinke"
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
                class="signup-button"
                label="Registriraj se"
                :loading="loading"
                @click="register"
            />

            <q-btn
                flat
                rounded
                color="secondary"
                class="signup-login-button"
                label="Imate račun? Prijavite se"
                @click="openLogin"
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

import { useRouter } from 'vue-router' //uvozi router
const router = useRouter();            //stvara router objekt

import {useAuthStore} from '@/stores/auth.store'
const authStore = useAuthStore()

const ime = ref('')              //pohranjuje ime
const prezime = ref('')          //pohranjuje prezime
const email = ref('')            //pohranjuje email
const lozinka = ref('')          //pohranjuje lozinku
const potvrdaLozinke = ref('')   //pohranjuje potvrdu lozinke

const loading = ref(false) //služi za :loading="loading  //kad je true vrti spinner i blokira višestruki klik 

//metoda za registraciju
async function register() {

   // loading.value = true;
   //zaštita od dvostrukog klika
   if (loading.value) {
        return;
    } //if zagrada

    //Provjera obaveznih polja
    if (
        !ime.value.trim() ||
        !prezime.value.trim() ||
        !email.value.trim() ||
        !lozinka.value.trim() ||
        !potvrdaLozinke.value.trim()
    ){
       // alert("Sva polja su obavezna");
       Notify.create({
            type: 'warning',
            message: 'Sva polja su obavezna',
            position: 'top',
            timeout: 2000
        })
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email.value)){               //provjera formata emaila
       // alert("Format email adrese nije ispravan");

       Notify.create({
            type: 'warning',
            message: 'Format email adrese nije ispravan',
            position: 'top',
            timeout: 2000
        })
        return;
    }

    if(lozinka.value.length < 8){
       // alert("Lozinka mora imati najmanje 8 znakova");

       Notify.create({
            type: 'warning',
            message: 'Lozinka mora imati najmanje 8 znakova',
            position: 'top',
            timeout: 2000
        })
        return;
    }

    if(lozinka.value !== potvrdaLozinke.value){
        //alert("Lozinke se ne podudaraju");

        Notify.create({
            type: 'warning',
            message: 'Lozinke se ne podudaraju.',
            position: 'top',
            timeout: 2000
        })
        return;
    }

    loading.value=true;

    try{
        const rezultat = await authStore.signup(
            ime.value,
            prezime.value,
            email.value,
            lozinka.value
        ) //await authService.signup zagrada

        //loading.value = false;

        if(rezultat.success) {
            //alert(rezultat.message);
            Notify.create({
                type: 'positive',
                message: rezultat.message,
                position: 'top',
                timeout: 2000
            }) //q.notify zagrada

            //čišćenje polja nakon uspješne registracije
            ime.value = "";
            prezime.value = "";
            email.value = "";
            lozinka.value = "";
            potvrdaLozinke.value = "";

            setTimeout(() => {     //nakon uspješne registracije otvara se dashboard
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
        console.error('Greška prilikom registracije:', error) 
        Notify.create({ 
            type: 'negative', 
            message: 'Došlo je do greške prilikom registracije.', 
            position: 'top', timeout: 2500 
        }) //notify zagrada
    } //catch error
    finally{
        loading.value = false;
    } //finally zagrada
    
} //async function zagrada

function openLogin() {
    router.push('/login')   //za otvaranje ekrana za prijavu klikom na gumb Imate račun?...
}

</script>

<style scoped>

.logo-container{
    display:flex;
    justify-content:center;
}

.signup-logo{
    /*width:500px;*/
    /*height:200px;*/
    width: 100%;
    max-width: 320px;
    height: 128px;
    object-fit: contain;
}

.title-container{
    text-align:center;
    margin-top: 5px;
    margin-bottom:18px;
}

.signup-title{
    font-size:30px;
    font-weight:bold;
    color:#BDC4D4;
}

.inputs-container{
    margin-bottom:20px;
}

.buttons-container{
    display:flex;
    flex-direction:column;
}

.signup-button{
    height:52px;
    font-size:18px;
}

.signup-login-button{
    height:48px;
    margin-top:10px;
}

@media (max-height: 800px) {
    :deep(.auth-card) { /* auth card style definiran u app.scss */ /* deep se koristi za nadjačavanje stilova - s obzirom da je scoped ovaj selektor neće dohvatiti globalni .auth-card bez :deep(). */
        padding: 20px;
    }
}

</style>
