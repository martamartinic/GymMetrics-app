<!-- EKRAN ZA UNOS ZD STANJA KLIJENTA -->

<template>
    <q-page class="add-client-health-page">

        <div class ="add-client-health-content">

            <div class="page-header">
                <!-- NASLOV NA VRHU EKRANA -->
                <div class="page-title"> 
                    <span> DODAVANJE ZDRAVSTVENOG  </span>
                    <span> STANJA KLIJENTA </span>
                </div>
                <!-- GUMB ZA ZATVARANJE EKRANA -->
                <q-btn
                    flat
                    dense
                    icon="close"
                    aria-label="Zatvori"
                    class="close-button"
                    @click="closePage"
                />                
            </div>

            <q-space class="q-my-sm"/>

            <!-- SREDINA EKRANA KOJA SE SCROLL-A -->
            <div class="page-scroll-area">

                <!-- POLJA ZA UNOS PODATAKA -->
                <div class="inputs-container">
                    <q-input
                        outlined
                        rounded
                        v-model="dijagnoza"
                        autocomplte="off"
                        class="health-input"
                        label="Dijagnoza"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <q-input
                        outlined
                        rounded
                        v-model="lijek"
                        autocomplte="off"
                        class="health-input"
                        label="Lijek"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <q-input
                        outlined
                        rounded
                        v-model="ozljeda"
                        autocomplte="off"
                        class="health-input"
                        label="Ozljeda"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <q-input
                        outlined
                        rounded
                        v-model="bolovi"
                        autocomplte="off"
                        class="health-input"
                        label="Bolovi"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <q-input
                        outlined
                        rounded
                        v-model="sistolickiTlak"
                        :rules="[validacijaTlaka]"
                        autocomplte="off"
                        class="health-input"
                        label="Sistolicki tlak"
                        color="primary"
                        dark
                    />

                    <q-input
                        outlined
                        rounded
                        v-model="dijastolickiTlak"
                        :rules="[validacijaTlaka]"
                        autocomplte="off"
                        class="health-input"
                        label="Dijastolicki tlak"
                        color="primary"
                        dark
                    />

                    <q-input                        
                        outlined
                        rounded
                        dark
                        v-model="datumUnosa"
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        class="health-input"
                        label="Datum unosa (GGGG-MM-DD)"
                        placeholder="pr. 2026-01-31"
                        aria-label="Datum unosa"                    
                        :rules="[validacijaDatumaUnosa]"
                        color="primary"     
                        lazy-rules                        
                    />
                    <q-space class="q-my-lg"/>

                </div> <!-- <div class="inputs-container"> -->

            </div> <!--  <div class="page-scroll-area"> -->
            
             <!-- GUMB SPREMI -->
            <div class="buttons-container">
                <q-btn
                    unelevated
                    rounded
                    color="primary"
                    class="save-button"
                    label="Spremi"
                    :loading="saving"
                    @click="saveClientHealth" 
                />
            </div>

        </div>

    </q-page>
</template>

<script setup>


// Vue funkcije za reaktivno stanje i životni ciklus
import { computed, /*onMounted,*/ ref } from 'vue'
// Router omogućuje čitanje ID-a klijenta i navigaciju
import { useRoute, useRouter } from 'vue-router'
const router = useRouter() // Inicijalizacija routera
const route = useRoute() // Inicijalizacija aktivne rute

import { Notify } from 'quasar'
import healthService from '@/services/health.service'

// Reaktivne varijable za unos podataka
const dijagnoza = ref('')
const lijek = ref('')
const ozljeda = ref('')
const bolovi = ref('')
const sistolickiTlak = ref('')
const dijastolickiTlak = ref('')
const datumUnosa = ref()

//oznaka spremanja zd stanja klijenta
const saving = ref(false)
// ID klijenta iz parametra rute
const clientId = computed(() => Number(route.params.id))

// Povratak na prethodni ekran detalja klijenta tab mjerenja
function closePage() {
    // Navigacija natrag na detalje klijenta
   // router.back()
   router.replace({
        path: `/dashboard/clients/${clientId.value}`,
        query: {
            tab: 'zdravstveno' //,
        } //query zagrada
    }) //router.replace zagrada
} // closePage

//VALIDACIJA DATUMA (1. unesen, 2. format GGGG-MM-DD, 3. datum stvarno postoji u kalendaru, 4. datum nije u budućnosti)
function validacijaDatumaUnosa(value) {
    if (!value || !value.trim()) { return 'Datum unosa je obavezan.' }

    //provjera formata datuma GGGG-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'Datum unosa mora biti u formatu godina-mjesec-dan (GGGG-MM-DD)'
    } //if zagrada

    //dijeli datum na godine, mjesece i dane
    const [year, month, day] = value.split('-').map(Number)

    //stvaranje UTC datuma
    const date = new Date(Date.UTC(year, month - 1, day))

    //provjera je li javascript nakon stvaranja datuma zadržao potpuno iste vrijednosti godine, mjeseca i dana
    const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month -1 && date.getUTCDate() === day
    //ako datum ne postoji, vraća poruku greške
    if(!isRealDate) { return 'Datum unosa ne postoji u kalendaru' } //if zagrada

    if(value > new Date().toISOString().split('T')[0]) {
        return 'Datum unosa ne može biti u budućnosti'
    } //if zagrada

    //ako su sve provjere uspješne, vraća true
    return true
} //validacijaDatumUnosa zagrada

//FUNKCIJA ZA VALIDACIJU SUSTOLIČKOG I DIASTOLIČKOG TLAKA
function validacijaTlaka(value) {
    // Prazna vrijednost dopuštena je ako se tlak uopće ne unosi
    if (value === null || value === undefined || String(value).trim() === '') {
        return true
    } //if zagrada

    // Provjera je li vrijednost broj
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) {
        return 'Vrijednost tlaka mora biti broj'
    } //if zagrada

    // Provjera je li vrijednost veća ili jednaka 0
    if (numericValue < 0 ) {
        return 'Vrijednost tlaka mora biti veća ili jednaka 0.'
    } //if zagrada

    // Ako su sve provjere prošle, vraća true
    return true
} //validacijaTlaka zagrada

//FUNKCIJA ZA SPREMANJE ZDRAVSTVENOG STANJA KLIJENTA
async function saveClientHealth() {
     // Provjera valjanosti ID-a klijenta
    if (!Number.isInteger(clientId.value) || clientId.value <= 0) {
        // Poruka o neispravnom ID-u
        Notify.create({
            message: 'ID klijenta nije valjan',
            type: 'negative',
            position: 'top'
        })        
        return // Prekid spremanja
    } // if zagrada

    // Provjera unosa para vrijednosti krvnog tlaka
    const imaSistolickiTlak = String(sistolickiTlak.value ?? '').trim() !== ''
    const imaDijastolickiTlak = String(dijastolickiTlak.value ?? '').trim() !== ''

    // Ako je unesena samo jedna vrijednost tlaka, prekida se spremanje
    if (imaSistolickiTlak !== imaDijastolickiTlak) {
        Notify.create({
            message: 'Za unos krvnog tlaka potrebno je unijeti i sistoličku i dijastoličku vrijednost',
            type: 'warning',
            position: 'top',
            timeout: 2000
        })
        return
    } //if zagrada

    //provjera datuma unosa prije spremanja
    const validacijaDatuma = validacijaDatumaUnosa(datumUnosa.value)
   //prekid spremanja ako datum nije ispravan 
    if (validacijaDatuma !== true) {
        Notify.create({
            message: validacijaDatuma,
            type: 'warning',            
            position: 'top'
        }) //notify zagrada
        return
    } //if zagrada

    //provjera validacije tlaka prije spremanja
    const validacijaSistolickogTlaka = validacijaTlaka(sistolickiTlak.value)
    const validacijaDijastolickogTlaka = validacijaTlaka(dijastolickiTlak.value)
    //prekid spremanja ako tlak nije ispravan   
    if (validacijaSistolickogTlaka !== true) {
        Notify.create({
            message: validacijaSistolickogTlaka,
            type: 'warning',            
            position: 'top'
        }) //notify zagrada
        return
    } //if zagrada
    if (validacijaDijastolickogTlaka !== true) {
        Notify.create({
            message: validacijaDijastolickogTlaka,
            type: 'warning',            
            position: 'top'
        }) //notify zagrada
        return
    } //if zagrada

    // Uključivanje pokazatelja spremanja nakon uspješnih provjera
    saving.value = true

    //pozivanje healthService i metode za spremanje podataka u bazu
    try {
        await healthService.addClientHealth({
            clientId: clientId.value,
            dijagnoza: dijagnoza.value,
            lijek: lijek.value,
            ozljeda: ozljeda.value,
            bolovi: bolovi.value,
            sistolickiTlak: sistolickiTlak.value,
            dijastolickiTlak: dijastolickiTlak.value,
            healthDate: datumUnosa.value.trim()
        }) //await zagrada

        Notify.create({
            message: 'Zdravstveno stanje klijenta je uspješno spremljeno.',
            type: 'positive',            
            position: 'top'
        }) //notify zagrada

        // Povratak na karticu zdravstveno i prikaz podataka
        router.replace({
            path: `/dashboard/clients/${clientId.value}`,
            query: {
                tab: 'zdravstveno' //,
            } //query zagrada
        }) //router.replace zagrada

    } catch (error) {
        console.error('Greška prilikom spremanja zdravstvenog stanja:', error)
        
        Notify.create({
            message: error?.message || 'Greška pri spremanju zdravstvenog stanja.',
            type: 'negative',            
            position: 'top',
            timeout: 5000
        }) //notify zagrada
    } //catch zagrada
    finally{
        saving.value = false
    } //finally zagrada

} //saveClientHealth zagrada

</script>

<style scoped>

/*GLAVNA POZADINA EKRANA ZA UNOS ZDRAVSTVENOG STANJA KLIJENTA */
.add-client-health-page {
    height: 100%;
    background: var(--q-dark-page);
}
/* GLAVNI RASPORED EKRANA */
.add-client-health-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}
/* Zaglavlje ekrana */
.page-header {
    flex-shrink: 0;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    position: relative;
}
/* Naslov ekrana */
.page-title {
    color: #BDC4D4;
    font-size: 21px;
    font-weight: 600;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
/* Gumb za zatvaranje */
.close-button {
    position: absolute;
    right: 12px;
    color: #BDC4D4;
    padding: 0;
    min-width: 0;
}
/* Područje koje se može pomicati */
.page-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px 20px;
    box-sizing: border-box;
}

/* KONTEJNER SA POLJIMA ZA UNOS */
.inputs-container {
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 16px;
    padding: 16px;
    box-sizing: border-box;
}
/* RAZMAK IZMEĐU POLJA ZA UNOS */
.health-input{
    width: 100%;
    margin-bottom: 12px;
}
/*ujednačena visina i pozadina polja */
:deep(.health-input .q.field__control) {
    min-height: 56px;
    border-radius: 12px;
}

/* KONTEJNER ZA GUMB SPREMANJA */
.buttons-container {
    flex-shrink: 0;
    padding: 12px 16px 20px;
}
/* Gumb spremanja */
.save-button {
    width: 100%;
    min-height: 46px;
    background: #BDC4D4;
    font-weight: 700;
}

</style>