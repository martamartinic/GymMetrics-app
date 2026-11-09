<!-- EKRAN ZA DODAVANJE TESTOVA KLIJENTA -->

<template>
    <q-page  class="add-test-page">
        <!-- glavni fleksiblni kontejner -->
         <div class="add-test-content">
            <div class="page-header">
                <div class="page-title">
                    <span> DODAVANJE TESTA </span>
                    <span> KLIJENTA </span>
                </div>

                <!-- GUMB ZA ZATVARANJE GLAVNOG EKRANA -->
                 <q-btn 
                    flat
                    dense
                    icon="close"
                    aria-label="Zatvori"
                    class="close-button"
                    @click="closePage"
                 />
            </div> <!-- page header class -->

            <!-- PODRUČJE OBRASCA - SCROLL AREA -->
             <div class="page-scroll-area">
                <!-- obrazac za unos -->
                 <div class="test-form-container">
                    <label class="form-label"> Vrsta testa: </label>
                    <!-- padajući izbornik za odabir vrste testa -->
                    <q-select 
                        v-model="selectedTestTypeId"
                        :options="testTypes"
                        option-label="name"
                        option-value="id"
                        emit-value
                        map-options
                        dense
                        rounded
                        dark
                        behavior="menu"
                        popup-content-class="test-type-popup"
                        :loading="loadingTypes"
                        :disable="loadingTypes || testTypes.length === 0"
                        :display-value="selectedTestTypeName"
                        class="form-select"
                        aria-label="Odabir vrste testa"                        
                    />
                    <q-space class="q-my-sm" />

                    <!--polje koje prikazuje mjernu jedinicu odabrane vrste testa -->
                    <q-input
                        :model-value="selectedUnit"
                        outlined
                        rounded
                        dark
                        readonly
                        class="test-input"
                        label="Mjerna jedinica"
                        aria-label="Mjerna jedinica"
                        color="primary"
                        lazy-rules
                        hide-bottom-space
                    />
                    <q-space class="q-my-sm" />

                    <!-- polje za rezultat testa -->
                     <q-input
                        v-model="testValue"
                        type="text"
                        input-mode="decimal"
                        autocomplete="off"
                        outlined
                        rounded
                        dark
                        class="test-input"
                        label="Rezultat testa"
                        aria-label="Rezultat testa"
                        color="primary"
                        :rules="[validacijaRezultataTesta]"
                        lazy-rules
                    />
                    <q-space class="q-my-sm" />

                    <!-- datum testa -->
                     <q-input
                        outlined
                        rounded
                        dark
                        v-model="testDate"
                        type="text"
                        input-mode="numeric"
                        autocomplete="off"
                        class="test-input"
                        label="Datum testa (GGGG-MM-DD)"
                        placeholder="pr. 2026-01-31"
                        aria-label="Datum testa"
                        :rules="[validacijaDatumaTesta]"
                        color="primary"
                        lazy-rules
                     />

                     <!-- BILJEŠKA TESTA -->
                     <q-input
                        outlined
                        rounded
                        dark
                        v-model="testNote"
                        type="text"
                        autogrow
                        autocomplete="off"
                        class="test-input"
                        label="Bilješka testa (opcionalno)"
                        color="primary"
                      />

                      <!-- GUMB ZA OTVARANJE POPUP PROZORA ZA DODAVANJE NOVE VRSTE TESTA -->
                      <q-btn 
                        unelevated
                        rounded
                        color="secondary"
                        class="new-test-type-button"
                        label="NOVA VRSTA TESTA "
                        @click="typeDialog = true "
                      />

                      <!-- PORUKA KAD NEMA VRSTE TESTA -->
                       <div
                            v-if="!loadingTypes && testTypes.length === 0"
                            class="form-empty-text" > NEMA DOSTUPNIH VRSTA TESTOVA
                       </div>
                </div>  <!-- test-form-container -->
            </div> <!-- page-scroll-area -->

            <!-- DONJI DIO EKRANA SA GUMBOM SPREMANJA ZAPISA TESTA KLIJENTA -->
             <div class="page-footer">
                <!-- gumb za spremanje zapisa testa klijenta -->
                <q-btn
                    unelevated
                    rounded
                    color="primary"
                    class="save-button"
                    label="SPREMI"
                    :loading="saving"
                    :disable="saving || loadingTypes || testTypes.length === 0"
                    @click="saveTest"
                />
            </div>
        </div>   <!-- add-test-content -->

        <!-- POPUP PROZOR ZA DODAVANJE NOVE VRSTE TESTA -->
         <q-dialog v-model="typeDialog">
            <q-card class="new-type-dialog">
                <!--polja za naziv i mjernu jedinicu -->
                <q-card-section class="new-type-fields">
                    <q-card-section class="goal-dialog-header">
                        <q-btn 
                            flat
                            dense
                            icon="close"
                            aria-label="Zatvori"
                            class="goal-dialog-close"
                            @click="closeDialog"
                        />
                    </q-card-section>
                    <!--naziv nove vrste testa -->
                    <q-input
                        v-model="newTypeName"
                        outlined
                        rounded
                        dense
                        dark
                        label="Naziv testa"
                        color="primary"
                        autocomplete="off"
                    />
                    <q-space class="q-my-sm" />
                    <!--mjerna jedinica nove vrste testa -->
                    <q-input
                        v-model="newTypeUnit"
                        outlined
                        rounded
                        dense
                        dark
                        label="Mjerna jedinica"
                        color="primary"
                        autocomplete="off"
                    />
                </q-card-section>
                <!--gumb za spremanje nove vrste testa -->
                <q-card-actions class="new-type-actions">
                    <q-btn
                        unelevated
                        rounded
                        color="primary"
                        class="new-type-save-button"
                        label="SPREMI"
                        :loading="savingType"
                        :disable="savingType"
                        @click="saveTestType"
                    />
                </q-card-actions>
            </q-card>
         </q-dialog>
        
    </q-page>
</template>

<script setup>

//vue funkcije za reaktivno stanje i životni ciklus
import {computed, onMounted, ref} from 'vue'
//router omogućuje čitanje ID klijenta i navigaciju
import {useRoute, useRouter } from 'vue-router'
const router = useRouter() //inicijalizacija routera
const route = useRoute() //inicijalizacija aktivne rute

import {Notify} from 'quasar'
//servis za rad s testovima
import testsService from '@/services/tests.service'

//REAKTIVNE VARIJABLE: 
//popis dostupnih vrsta testova
const testTypes = ref([])
const selectedTestTypeId = ref(null) //odabrana vrsta testa
const testValue = ref('') //unesen rezultat testa
const testDate = ref() //datum testa
const testNote = ref('') //rekativna varijabla biljeska testa
const loadingTypes = ref(false) //oznaka učitavanja vrsta testova
const saving = ref(false) //oznaka spremanja testa klijenta
const clientId = computed(() => Number(route.params.id)) //ID klijenta iz parametra rute

//mjerna jedinica odabrane vrste testa
const selectedUnit = computed(() => {
    //traženje odabrane vrste testa
    const odabranaVrsta = testTypes.value.find(
        type => Number(type.id) === Number(selectedTestTypeId.value)
    ) //const odabranaVrsta zagrada
    //ako nema odabrane vrste, jedinica ostaje prazna
    return odabranaVrsta?.unit ?? ''
}) //const selectedUnit zagrada

//IZRAČUN NAZIVA ODABRANE VRSTE TESTA ZA PRIKAZ U DROPDOWN MENIJU
const selectedTestTypeName = computed(() => {
    //pronalaženje odabrane vrste testa
    const odabranaVrsta = testTypes.value.find(
        type => Number(type.id) === Number(selectedTestTypeId.value)
    ) //const odabranaVrsta zagrada
    //prikaz naziva vrste testa
    return odabranaVrsta ? odabranaVrsta.name.toUpperCase() : ''
}) //const selectedTestTypeName zagrada

//prikaz popup prozora za novu vrstu testa
const typeDialog = ref(false)
const newTypeName = ref('') //naziv nove vrste testa
const newTypeUnit = ref('') //mjerna jedinica nove vrste testa
const savingType = ref(false) //oznaka spremanja nove vrste testa

//funkcija za povratak na prethodni ekran detalja klijenta tab testovi
function closePage() {
    router.replace({
        path: `/dashboard/clients/${clientId.value}`,
        query: {
            tab: 'testovi',
            testTypeId: String(selectedTestTypeId.value)
        } //query zagrada
    }) //router.replace
} //closePage() zagrada

//VALIDACIJA REZULTATA TESTA KLIJENTA
function validacijaRezultataTesta(value) {
    //obavezan unos
    const UnesenRezultat = String(value ?? '').trim()
    if(!UnesenRezultat) {
        return 'Rezultat testa je obavezan'
    } //if zagrada

    //decimalni separator mora biti točka
    if(UnesenRezultat.includes(',')) {
        return 'Decimalni broj rezultata testa odvaja se točkom (.)'
    } //if zagrada

    //prihvat samo cijelih i decimalnih brojeva
    if(!/^\d+(?:\.\d+)?$/.test(UnesenRezultat)) {
        return 'Rezultat testa mora biti broj veći od nule'
    } //if zagrada

    //rezultat mora bit konačan broj veći od nule
    const brojRezultata = Number(UnesenRezultat)
    if(!Number.isFinite(brojRezultata) || brojRezultata <= 0) {
        return 'Rezultat testa mora biti broj veći od nule'
    } //if zagrada
    //ako je unos valjan
    return true
} //validacijaRezultataTesta zagrada

//FUNKCIJA ZA VALIDACIJU DATUMA TESTA (1. unesen, 2. format GGGG-MM-DD, 3. datum stvarno postoji u kalendaru, 4. datum nije u budućnosti)
function validacijaDatumaTesta(value) {
     if (!value || !value.trim()) {
        return 'Datum testa je obavezan'
    } //if zagrada
    
    //provjera formata datuma godina-mjesec-dan
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'Datum testa mora biti u formatu godina-mjesec-dan (GGGG-MM-DD)'
    } //if zagrada

    //dijeli datum na godine, mjesece i dane
    const [year, month, day] = value.split('-').map(Number)

    //stvaranje UTC datuma
    const date = new Date(Date.UTC(year, month - 1, day))

    //provjera je li javascript nakon stvaranja datuma zadržao potpuno iste vrijednosti godine, mjeseca i dana
    const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month -1 && date.getUTCDate() === day
    //ako datum ne postoji, vraća poruku greške
    if(!isRealDate) {
        return 'Datum testa ne postoji u kalendaru'
    } //if zagrada

    if(date > new Date().toISOString().split('T')[0]) {
        return 'Datum testa ne može biti u budućnosti'
    } //if zagrada

    //ako su sve provjere uspješne, vraća true
    return true

} // validacijaDatumaTesta zagrada

//POPUP -SPREMANJE NOVE VRSTE TESTA I AUTOMATSKI ODABRAN U DROPDOWN MENIJU NAKON SPREMANJA
async function saveTestType() {
    //provjera obaveznog naziva
    if(!newTypeName.value.trim()) {
        Notify.create({
            message:'Naziv vrste testa je obavezan',
            type:'warning',
            position:'top'
        }) // Notify zagrada
        return //prekid spremanja ako je naziv prazan
    } //if zagrada

    //provjera obavezne mjerne jedinice
    if(!newTypeUnit.value.trim()) {
        Notify.create({
            message:'Mjerna jedinica je obavezna',
            type:'warning',
            position:'top'
        }) //Notify zagrada
        return //prekid spremanja ako je mjerna jedinica prazna
    } //if zagrada

    //uključivanje pokazatelja spremanja
    savingType.value = true

    try{
        //spremanje nove vrste testa preko servisa
        const novaVrsta = await testsService.addTestType({
            name: newTypeName.value,
            unit: newTypeUnit.value
        }) //const novaVrsta zagrada

        //osvježavanje popisa vrsta testova
        await loadingTestTypes()
        //automatski odabir upravo spremljene vrste testa
        selectedTestTypeId.value = novaVrsta.id

        //brisanje teksta iz polja novog unosa
        newTypeName.value = ''
        newTypeUnit.value = ''
        //zatvaranje popup prozora nakon spremanja
        typeDialog.value = false

        //potvrda uspješnog spremanja nove vrste testa
        Notify.create({
            message:'Nova vrsta testa je uspješno spremljena',
            type:'positive',
            position:'top'
        }) //notify zagrada

    } //try zagrada
    catch(error){
        console.error('Greška pri spremanju vrste testa: ',error)
        Notify.create({
            message: error?.message || 'Greška pri spremanju vrste testa',
            type:'negative',
            position:'top'
        }) //notify zagrada
    } //catch zagrada
    finally{
        savingType.value = false //isključivanje pokazatelja spremanja bez obzira na ishod
    } //finally zagrada

} //saveTestType zagrada

//FUNKCIJA ZA ZATVARNJE POPUP PROZORA BEZ SPREMANJA
function closeDialog(){
    typeDialog.value = false
} //closeDialog zagrada

//FUNKCIJA ZA UČITAVANJE VRSTA TESTOVA
async function loadingTestTypes() {
    loadingTypes.value = true //uključivanje pokazatelja učitavanja

    //pokušaj čitanja vrsta testova
    try{
        //poziv metode iz servisa
        testTypes.value = await testsService.getTestTypes()

        //ako postoje vrste testova odabire se prva vrsta
        if(testTypes.value.length > 0){
            //prva vrsta postaje početni odabir
            selectedTestTypeId.value = testTypes.value[0].id
        } //if zagrada
    } //try zagrada
    catch(error){
        console.error('Greška pri čitanju vrste testova: ', error)
        Notify.create({
            message:'Greška pri čitanju vrste testova',
            type:'negative',
            position:'top'
        }) //notify zagrada
    } //catch zagrada
    finally{
        loadingTypes.value = false //isključivanje pokazatelja učitavanja bez obzira na ishod
    }//finally zagrada

} //loadTestTypes zagrada

//FUNKCIJA ZA PROVJERU UNOSA I SPREMANJE TESTA KLIJENTA
async function saveTest() {
    //provjera valjanosti ID klijenta
    if(!Number.isInteger(clientId.value) || clientId.value <=0) {
        Notify.create({
            message:'ID klijenta nije valjan',
            type:'negative',
            position:'top'
        }) //notify zagrada
        return //prekid spremanja
    } //if zagrada

    //provjera postoji li odabrana vrsta testa
    if(!Number.isInteger(Number(selectedTestTypeId.value)) || Number(selectedTestTypeId.value) <= 0) {
        Notify.create({
            message:'Odaberite vrstu testa',
            type:'warning',
            position:'top'
        }) //notify zagrada
        return //prekid spremanja
    } //if zagrada

    //čišćenje vanjskih razmaka bez mijenjanja decimalnog separatora
    const unesenaVrijednost = String(testValue.value ?? '').trim()
    const validacijaVrijednosti = validacijaRezultataTesta(unesenaVrijednost)
    //provjera je li vrijednost mjerenja ispravna
    if(validacijaVrijednosti !== true) {
        Notify.create({
            message:'validacijaVrijednosti',
            type:'warning',
            position:'top'
        }) //notify zagrada
        return //prekid spremanja
    } //if zagrada
    //pretvaranje provjerenog teksta u broj
    const numericValue = Number(unesenaVrijednost)

    //provjera datuma prije spremanja
    const validacijaDatuma = validacijaDatumaTesta(testDate.value)
    if(validacijaDatuma !== true) {
        Notify.create({
            message: validacijaDatuma,
            type: 'warning',
            position: 'top'
        }) //notify zagrada
        return //prekid spremanja
    } //if zagrada

    //uključivanje pokazatelja spremanja nakon uspješnih provjera
    saving.value = true

    //pokušaj spremanja
    try{
        //poziv metode iz servisa
        await testsService.addClientTest({
            clientId: clientId.value,
            testTypeId: Number(selectedTestTypeId.value),
            value: numericValue,
            date: testDate.value.trim(),
            note: testNote.value.trim()
        }) //notify zagrada

        //uspješno spremanje
        Notify.create({
            message:'Test klijenta je uspješno spremljen',
            type:'positive',
            position:'top'
        }) //notify zagrada

        //povratak na tab testova i prikaz testova
        router.replace({
            path: `/dashboard/clients/${clientId.value}`,
            query: {
                tab: 'testovi',
                testTypeId: String(selectedTestTypeId.value)
            } //query zagrada
        }) //notify zagrada

    } catch(error) {
        console.error('Greška pri spremanju testa klijenta: ', error)

        Notify.create({
            message: error?.message || error?.error?.message || 'Greška pri spremanju testa klijenta',
            type:'negative',
            position:'top',
            timeput: 5000
        }) //notify zagrada
    } //catch zagrada
    finally{
        saving.value = false //isključivanje pokazatelja spremanja bez obzira na ishod
    } //finally zagrada
} //saveTest zagrada

//FUNKCIJA ZA POČETNO ČITANJE VRSTA TESTOVA PRI OTVARANJU EKRANA
onMounted(async () => {
    //provjera valjanosti ID klijenta prije čitanja vrsta
    if(!Number.isInteger(clientId.value) || clientId.value <= 0) {
        Notify.create({
            message:'ID klijenta nije valjan',
            type:'warning',
            position:'top'
        }) //notify zagrada
        //povratak na prethodni ekran
        router.back()
        return //prekid postupka
    } //if zagrada

    //poziv funkcije za čitanje vrsta testova
    await loadingTestTypes()
}) //onMounted zagrada

</script>

<style scoped>

/* GLAVNA POZADINA EKRANA ZA UNOS TESTA KLIJENTA */
.add-test-page {
    height: 100%;
    background: var(--q-dark-page);
}
/* GLAVNI RASPORED EKRANA */
.add-test-content{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}
/* ZAGLAVLJE EKRANA */
.page-header{
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
    padding: 12px 16px 28px;
    box-sizing: border-box;
}
/* Kontejner polja obrasca */
.test-form-container{
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 16px;
    padding: 16px;
    box-sizing: border-box;
}
/* gumb za otvaranje popup prozora za dodavanje nove vrste testa */
.new-test-type-button{
    width: 100%;
    min-height: 42px;
    margin-bottom: 4px;
    font-weight: 700;
    margin-top: 14px;
}
/* Oznake polja */
.form-label {
    display: block;
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
    margin: 10px 0 8px;
}
/* Izbornik i polje unosa */
.form-select {
    width: 100%;
    margin-bottom: 18px;    
}
/*Pozadina izbornika */
:deep(.test-type-popup) {
    background: #1C2E4A;
    color: #BDC4D4;
    border-radius: 12px;
    border: none;
    padding: 4px 0;
}
/* Opcije izbornika */
:deep(.test-type-popup .q-item) {
    color: #BDC4D4;
    font-size: 14px;
}
/* Označena opcija u izborniku */
:deep(.test-type-popup .q-item--active) {
    background: rgba(168, 185, 204, 0.18);
    color: #BDC4D4;
}
/* Centrirani tekst u otvorenom padajućem izborniku */
:deep(.test-type-popup .q-item__section) {
    text-align: center;
    justify-content: center;
    align-items: center;
}
/* Pozadina kontrola */
:deep(.form-select .q-field__control){
    background: #A8B9CC;
    border-radius: 12px;
    min-height: 42px;
}
/* Tekst unutar polja */
:deep(.form-select .q-field__native) {
    color: #0F1A2B;
    font-weight: 600;
    justify-content: center;
    text-align: center;
}
/* Ikone kontrola */
:deep(.form-select .q-icon) {
    color: #0F1A2B;
}
/* Jedinica uz unesenu vrijednost */
.input-unit {
    color: #0F1A2B;
    font-size: 14px;
    font-weight: 700;
}
/*INPUT POLJA (MJERNA JEDINICA, DATUM, REZULTAT TESTA, BILJEŠKA) */
/* Razmak između polja za unos testa */
.test-input{
    width: 100%;
    margin-bottom: 12px;
}
/* Ujednačena visina i pozadina polja */
:deep(.test-input .q-field__control) {
    min-height: 56px;
    border-radius: 12px;
}
/* Poruka kada nema dostupnih vrsta */
.form-empty-text {
    color: rgba(189, 196, 212, 0.65);
    text-align: center;
    font-size: 13px;
    padding: 16px 0;
}

/* Donji dio ekrana */
.page-footer {
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

/* POPUP PROZOR ZA NOVU VRSTU TESTA */
/*pozadina i okvir popupa */
.new-type-dialog{
  width: calc(100vw - 32px);
  max-width: none;
  background: #1C2E4A;
  color: #BDC4D4;
  border-radius: 16px;
}
/*raspored polja u popupu */
.new-type-fields{
  padding: 15px 16px;
}
/* Header popupa. */
.goal-dialog-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* X gumb popupa. */
.goal-dialog-close {
  position: absolute;
  right: 0;
  color: #BDC4D4;
  margin-bottom: 20px;
}
/* Donji dio popupa. */
.new-type-actions {
  padding: 0 16px 16px;
}
/* Gumb za spremanje mjerenja. */
.new-type-save-button {
  width: 100%;
}
/* Jednaki puni obrubi i na polju koje je samo za čitanje */
:deep(.q-field--readonly .q-field__control::before) {
    border-style: solid;
}

</style>