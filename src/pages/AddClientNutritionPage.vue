<!-- EKRAN ZA DODAVANJE PREHRANE KLIJENTA -->

<template>
    <q-page class="add-client-nutrition-page">
        <div class="add-client-nutrition-content">

            <div class="page-header">
                <!-- NASLOV NA VRHU EKRANA -->
                <div class="page-title">
                    <span> DODAVANJE PREHRANE </span>
                    <span> KLIJENTA </span>
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
                        v-model="kalorije"
                        :rules="[val => validacijaInputa(val, 'Dnevne kalorije u kcal', true)]"
                        autocomplte="off"
                        class="nutrition-input"
                        label="Dnevne kalorije (kcal)"
                        color="primary"
                        dark
                    />

                    <q-input
                        outlined
                        rounded
                        v-model="proteini"
                        :rules="[val => validacijaInputa(val, 'Proteini u g')]"
                        autocomplte="off"
                        class="nutrition-input"
                        label="Proteini (g)"
                        color="primary"
                        dark
                    />

                    <q-input
                        outlined
                        rounded
                        v-model="ugljikohidrati"
                        :rules="[val => validacijaInputa(val, 'Ugljikohidrati u g')]"
                        autocomplte="off"
                        class="nutrition-input"
                        label="Ugljikohidrati (g)"
                        color="primary"
                        dark
                    />

                    <q-input
                        outlined
                        rounded
                        v-model="secer"
                        :rules="[val => validacijaInputa(val, 'Šećer u g')]"
                        autocomplte="off"
                        class="nutrition-input"
                        label="Šećer (g)"
                        color="primary"
                        dark
                    />

                    <q-input
                        outlined
                        rounded
                        v-model="masti"
                        :rules="[val => validacijaInputa(val, 'Masti u g')]"
                        autocomplte="off"
                        class="nutrition-input"
                        label="Masti (g)"
                        color="primary"
                        dark
                    />

                    <q-input
                        outlined
                        rounded
                        v-model="vlakna"
                        :rules="[val => validacijaInputa(val, 'Vlakna u g')]"
                        autocomplte="off"
                        class="nutrition-input"
                        label="Vlakna (g)"
                        color="primary"
                        dark
                    />
    
                </div> <!-- <div class="inputs-container"> -->

            </div> <!-- <div class="page-scroll-area"> -->

            <!-- GUMB SPREMI -->
            <div class="buttons-container">
                <q-btn
                    unelevated
                    rounded
                    color="primary"
                    class="save-button"
                    label="Spremi"
                    :loading="saving"
                    @click="saveClientNutrition" 
                />
            </div>

        </div> <!-- <div class="add-client-nutrition-content"> -->

    </q-page>
</template>

<script setup >

// Vue funkcije za reaktivno stanje i životni ciklus
import { computed, /*onMounted,*/ ref } from 'vue'
// Router omogućuje čitanje ID-a klijenta i navigaciju
import { useRoute, useRouter } from 'vue-router'
const router = useRouter() // Inicijalizacija routera
const route = useRoute() // Inicijalizacija aktivne rute

import { Notify } from 'quasar'
import nutritionService from '@/services/nutrition.service'

//REAKTIVNE VARIJABLE ZA UNOS PODATAKA
const kalorije = ref('')
const proteini = ref('')
const ugljikohidrati = ref('')
const secer = ref('')
const masti = ref('')
const vlakna = ref('')

//oznaka spremanja prehrane klijenta
const saving = ref(false)
// ID klijenta iz parametra rute
const clientId = computed(() => Number(route.params.id))

// Povratak na prethodni ekran detalja klijenta tab mjerenja
function closePage() {
    // Navigacija natrag na detalje klijenta
   // router.back()
   router.replace({
        path: `/dashboard/clients/${clientId.value}`,
        query: { tab: 'prehrana' } //query zagrada
    }) //router.replace zagrada
} // closePage

//FUNKCIJA ZA VALIDACIJU INPUT-A
function validacijaInputa(vrijednost, nazivPolja, obavezno = false){
    // Provjera obaveznog unosa
    if (vrijednost === null || vrijednost === undefined || String(vrijednost).trim() === '') {
        if (obavezno) { return `${nazivPolja} su obavezne` }
        // Ostala polja nisu obavezna
        return true
    } //if zagrada

    // Pretvaranje unesene vrijednosti u broj
    const numericValue = Number(vrijednost)

    // Provjera je li vrijednost broj
    if (!Number.isFinite(numericValue)) { return `${nazivPolja} moraju biti broj` }

    // Provjera je li broj veći ili jednak 0
    if (numericValue < 0) { return `${nazivPolja} moraju biti broj veći ili jednak 0` }

    return true

} //validacijaInputa zagrada

//FUNKCIJA ZA SPREMANJE PREHRANE KLIJENTA
async function saveClientNutrition() {
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

    //provjera validacije inputa prije spremanja
    const validacijaKalorija = validacijaInputa(kalorije.value, 'Dnevne kalorije u kcal', true)
    const validacijaProteina = validacijaInputa(proteini.value,'Proteini u g')
    const validacijaUgljikohidrati = validacijaInputa(ugljikohidrati.value, 'Ugljikohidrati u g')
    const validacijaSecera = validacijaInputa(secer.value, 'Šećer u g')
    const validacijaMasti = validacijaInputa(masti.value, 'Masti u g')
    const validacijaVlakna = validacijaInputa(vlakna.value, 'Vlakna u g')

    //provjera rezultata svih validacija
    const greskaValidacije = [
        validacijaKalorija,
        validacijaProteina,
        validacijaUgljikohidrati,
        validacijaSecera,
        validacijaMasti,
        validacijaVlakna
    ].find(rezultat => rezultat !== true)

    // Prekid spremanja ako postoji neispravna vrijednost
    if (greskaValidacije) {
        Notify.create({
            message: greskaValidacije,
            type: 'warning',
            position: 'top'
        })
        return
    } //if zagrada

    // Uključivanje pokazatelja spremanja nakon uspješnih provjera
    saving.value = true

    //pozivanje nutrition servisa i metode za spremanje
    try{
        await nutritionService.addClientNutrition({
            clientId: clientId.value,
            kalorije: kalorije.value,
            proteini: proteini.value,
            ugljikohidrati: ugljikohidrati.value,
            secer: secer.value,
            masti: masti.value,
            vlakna: vlakna.value
        }) //await zagrada

        Notify.create({
            message: 'Prehrane klijenta je uspješno spremljena.',
            type: 'positive',
            position: 'top'
        }) //notify zagrada

        // Povratak na karticu prehrana i prikaz podataka
        router.replace({
            path: `/dashboard/clients/${clientId.value}`,
            query: { tab: 'prehrana' } //query zagrada
        }) //router.replace zagrada

    } catch(error){
        console.error('Greška pri spremanju prehrane klijenta: ', error)

        Notify.create({
            message: error?.message || 'Greška pri spremanju prehrane kijenta',
            type:'negative',
            position: 'top',
            timeout: 5000
        }) //notify zagrada
    } finally{
        saving.value = false
    } //finally zagrada

} //saveClientNutrition zagrada

</script>

<style scoped>

/* GLAVNA POZADINA EKRANA ZA UNOS PREHRANE KLIJENTA */
.add-client-nutrition-page{
    height: 100%;
    background: var(--q-dark-page);
}
/*GLAVNI RASPORED EKRANA */
.add-client-nutrition-content{
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
.nutrition-input{
    width: 100%;
    margin-bottom: 8px;
}
/* ujednačena visina i pozadina polja */
:deep(.nutrition-input .q.field__control) {
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