<!-- EKRAN ZA UREĐIVANJE OSOBNIH PODATAKA KLIJENTA -- otvaranje klikom na olovčicu na ekranu CILENTDETAILSPAGE.VUE -->

<template>
  <!-- CIJELI MOBILNI EKRAN -->
  <q-page class="edit-client-page">
    <!-- GLAVNI KONTEJNER EKRANA -->
    <div class="edit-client-content">

      <div class="page-header">
        <!-- NASLOV EKRANA -->
        <div class="page-title"> UREĐIVANJE KLIJENTA </div>

        <q-btn
          flat
          dense
          icon="close"
          aria-label="Zatvori"
          class="close-button"
          @click="closePage"
        />
      </div>

      <!-- SREDINA EKRANA KOJA SE MOŽE SCROLLATI -->
      <div class="page-scroll-area">

        <!-- PRIKAZ LOADINGA DOK SE PODACI UČITAVAJU -->
        <div v-if="loadingClient" class="loading-container" >
          <!-- Tekst učitavanja -->
          <div class="loading-text"> Učitavanje podataka klijenta... </div>
        </div>

        <!-- FORMA SE PRIKAZUJE TEK KADA SU PODACI UČITANI -->
        <div v-else class="inputs-container" >
          <!-- IME -->
          <q-input
            outlined
            rounded
            v-model="ime"
            type="text"
            autocomplete="off"
            label="Ime"
            color="primary"
            dark
          />
          <!-- RAZMAK IZMEĐU POLJA -->
          <q-space class="q-my-sm" />

          <!-- PREZIME -->
          <q-input
            outlined
            rounded
            v-model="prezime"
            type="text"
            autocomplete="off"
            label="Prezime"
            color="primary"
            dark
          />
          <q-space class="q-my-sm" />

          <!-- SPOL -->
          <q-input
            outlined
            rounded
            v-model="spol"
            label="Spol"
            autocomplete="off"
            color="primary"
            dark
          />
          <q-space class="q-my-sm" />

          <!-- KONTAKT -->
          <q-input
            outlined
            rounded
            v-model="kontakt"
            type="text"
            autocomplete="off"
            label="Kontakt"
            color="primary"
            dark
          />
          <q-space class="q-my-sm" />

          <!-- VISINA -->
          <q-input
            outlined
            rounded
            v-model="visina"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            label="Visina (cm)"
            color="primary"
            dark
          />
          <q-space class="q-my-sm" />

          <!-- POČETNA TEŽINA -->
          <q-input
            outlined
            rounded
            v-model="tezina"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            label="Početna težina (kg)"
            color="primary"
            dark
          />
          <q-space class="q-my-sm" />

          <!-- FITNESS ISKUSTVO -->
          <q-input
            outlined
            rounded
            v-model="fitnessIskustvo"
            type="text"
            autocomplete="off"
            label="Fitness iskustvo"
            color="primary"
            dark
          />
          <q-space class="q-my-sm" />

          <!-- NAPOMENA -->
          <q-input
            outlined
            rounded
            v-model="napomena"
            type="text"
            autogrow
            autocomplete="off"
            label="Napomena"
            color="primary"
            dark
          />
        </div>
      </div>

      <!-- OBRUBLJEN KONTEJNER ZA CILJEVE KLIJENTA -->
            <div class="goals-container">
                <!-- UNUTARNJI KONTAJNER ELEMENATA CILJA -->
                <div class="goals-controls">
                    <div class="goals-label"> Cilj klijenta: </div>
                    
                    <q-btn-dropdown
                        rounded
                        :label="selectedGoal ? selectedGoal.name : 'Učitavanje ciljeva...'"
                        aria-haspopup="menu"
                        class="goal-dropdown-button"
                        dropdown-icon="expand_more"
                    >

                        <!-- LISTA CILJEVA (STVARNI PODACI) IZ BAZE (SEED PODACI) -->
                        <q-list class="goal-dropdown-menu">
                            <!-- Kreiranje jedne stavke za svaki cilj iz baze: -->
                            <q-item  
                                v-for="goal in goals"
                                :key="goal.id"
                                clickable
                                v-close-popup 
                                @click="selectGoal(goal)"
                            >          
                             <!-- Sekcija unutar stavke dropdowna. -->               
                                <q-item-section>
                                <q-item-label> {{goal.name}} </q-item-label>
                                </q-item-section>
                            </q-item>

                        </q-list>

                    </q-btn-dropdown>
            
                    <!-- GUMB DODAJ NOVI CILJ ZA OTVARANJE POPUP PROZORA -->
                    <q-btn
                        unelevated
                        rounded
                        color="secondary"
                        class="add-goals-button"
                        label="Dodaj novi cilj"
                        :loading="loading"
                        @click="addGoal"
                    />
            </div>
        </div>

     <!-- DONJI DIO EKRANA -->
      <div class="buttons-container">
            <q-btn
            unelevated
            rounded
            color="primary"
            class="save-button"
            label="Spremi"
            :loading="loading"
            @click="saveClient"
            />
      </div>

    </div>

  </q-page>

  <!-- Popup za dodavanje novog cilja -->
   <q-dialog v-model="showGoalDialog" >
        <!-- Kartica popup-a -->
        <q-card class="goal-dialog">
            <!-- Header popup-a -->
            <q-card-section class="goal-dialog-header">
               <q-btn
                    flat
                    dense
                    icon="close"
                    aria-label="Zatvori"
                    class="goal-dialog-close"
                    @click="closeGoalDialog"
                />
            </q-card-section>

            <q-card-section>
                <q-input
                    outlined
                    rounded
                    v-model="newGoalName"
                    label="Naziv cilja"
                    color="primary"
                    dark
                />
                <q-space class="q-my-sm"/>

                <q-input
                    outlined
                    rounded
                    v-model="newGoalDescription"
                    label="Opis cilja (opcionalno)"
                    color="primary"
                    dark
                    type="textarea"
                />
            </q-card-section>

            <!-- Donji dio popup-a s gumbom spremi cilj -->
             <q-card-actions class="goal-dialog-actions">
                <q-btn 
                    unelevated
                    rounded
                    color="primary"
                    class="goal-dialog-save"
                    label="Spremi"
                    :loading="loading"
                    @click="saveGoal"                
                />
            </q-card-actions>

        </q-card>

   </q-dialog>

</template>

<script setup>

// Uvoz funkcija za rad s Vue Routerom
import { useRouter, useRoute } from 'vue-router'
// Dohvat router instance za navigaciju između ekrana
const router = useRouter()
// Dohvat trenutne rute radi čitanja ID-a klijenta iz URL-a
const route = useRoute()

// Uvoz osnovnih Vue funkcija
import { onMounted, ref } from 'vue'
// Uvoz Quasar Notify funkcije
import { Notify } from 'quasar'

// Uvoz servisa za rad s klijentima
import clientService from '@/services/client.service'
// Uvoz servisa za rad sa ciljevima.
import goalService from '@/services/goal.service'
// Uvoz Pinia store-a za prijavljenog trenera
import { useAuthStore } from '@/stores/auth.store'
// Dohvat instance auth store-a
const authStore = useAuthStore()

// PODACI FORME:
const ime = ref('')
const prezime = ref('')
const spol = ref('')  
const kontakt = ref('')
const visina = ref('')
const tezina = ref('')
const fitnessIskustvo = ref('')
const napomena = ref('')

// Označava učitavaju li se podaci klijenta
const loadingClient = ref(false)
// Označava spremaju li se izmjene
const loading = ref(false)

//CILJEVI:
//niz ciljeva koji postoji u bazi
const goals = ref([])
//trenutno odabrani cilj klijenta
const selectedGoal = ref(null)
//kontrola prikazuje li se popup za dodavanje novog cilj
const showGoalDialog = ref(false)
//naziv novog cilja kojeg korisnik/trener unese na popup ekranu dodavanja cilja
const newGoalName = ref('')
//opis novog cilja kojeg korisnik/trener unese na popup ekranu dodavanja cilja
const newGoalDescription = ref('')

// Funkcija dohvaća ID klijenta iz URL-a.
function getClientId() {
  // route.params vrijednosti dolaze kao tekst, zato ih se pretvara u broj
  const clientId = Number(route.params.id)
  // Provjerava je li ID pozitivan cijeli broj
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null
  }//if zagrada
  // Vraća se ispravan ID klijenta
  return clientId

} //getClient zagrada

// Funkcija zatvaranja ekrana za uređivanje
function closePage() { 
  router.back()   // Vraćamo se na prethodni ekran.
} //closePage zagrada

// Funkcija za dohvat postojećih podataka klijenta
async function loadClient() {
  // Provjerava postoji li prijavljeni trener
  if (!authStore.trainerId) {
    // Ako trener nije prijavljen,vraća ga na login ekran
    router.push('/login')
    // Prekida funkcije
    return
  } //if zagrada

  // Dohvaćat ID klijenta iz URL-a
  const clientId = getClientId()
  // Provjerava je li ID valjan
  if (!clientId) {
    Notify.create({
      message: 'ID klijenta nije valjan',
      type: 'negative',
      position: 'top'
    }) //notify.create zagrada
    // Vraćanje na prethodni ekran
    router.back()
    // Prekid funkcije
    return
  } //if zagrada

  // Uključivanje loadinga
  loadingClient.value = true

  try {
    // Dohvat klijenta iz baze
    const client = await clientService.getClientById(clientId, authStore.trainerId)

    // Ako klijent ne postoji
    if (!client) {
      Notify.create({
        message: 'Klijent nije pronađen',
        type: 'negative',
        position: 'top'
      }) //notify zagrada
      // Vraća na prethodni ekran
      router.back()
      // Prekid funkcije
      return
    }//if zagrada

    // POPUNJAVANJE FORME:    // Postojeći podaci stavljaju se u definirana polja
    ime.value = client.firstName || ''
    prezime.value = client.lastName || ''
    spol.value = client.gender || ''
    kontakt.value = client.contact || ''
    visina.value = client.height !== null && client.height !== undefined ? String(client.height) : ''
    tezina.value = client.startingWeight !== null && client.startingWeight !== undefined ? String(client.startingWeight) : ''
    fitnessIskustvo.value = client.experience || ''
    napomena.value = client.note || ''
  } //try zagrada
  catch (error) {
    console.error('Greška pri učitavanju podataka klijenta:', error)

    Notify.create({
      message: 'Greška pri učitavanju podataka klijenta',
      type: 'negative',
      position: 'top'
    }) //notify zagrada
  } //catch zagrada
  finally {
    // Bez obzira na rezultat, isključuje se loading
    loadingClient.value = false
  } //finally 
} //loadClient zagrada

//FUNKCIJA ZA UČITAVANJE CILJEVA IZ BAZE NA EKRANU (NE POPUP)
async function loadGoals() {
  // Pokušaj dohvata svih ciljeva
  try {
    // Dohvat svih ciljeva preko GoalService-a
    goals.value = await goalService.getGoals()
  } //try zagrada
  catch (error) {
    console.error('Greška pri učitavanju ciljeva:', error)
    Notify.create({
      message: 'Ciljeve nije moguće učitati',
      type: 'negative',
      position: 'top'
    }) //notify zagrada
  } //catch zagrada

} //loadGoals zagrada
//FUNKCIJA ZA UČITAVANJE TRENUTNOG/POSTOJEĆEG CILJA KLIJENTA (SELEKTIRAN NA DROPDOWN MENU) PRIJE SPREMANJA AŽURIRANJA
async function loadClientGoal() {
// DohvatID klijenta iz URL-a
  const clientId = getClientId()
  // Ako ID nije ispravan, prekid funkcije
  if (!clientId) {
    return
  } //if zagrada

  // Pokušaj dohvata trenutno spremljeng cilja
  try {
    // Dohvat cilja iz tablice Ciljevi_klijenta
    selectedGoal.value = await clientService.getClientGoal(clientId, authStore.trainerId) 
  } //try zagrada
  catch (error) {
    console.error('Greška pri učitavanju cilja klijenta:', error)
    Notify.create({
      message: 'Cilj klijenta nije moguće učitati',
      type: 'negative',
      position: 'top'
    }) //notify zagrada
  } //catch zagrada

} //loadClientGoal zagrada
//FUNKCIJA ZA ODABIR CILJA IZ DROPDOWN MENUA
function selectGoal(goal) {
    //cijeli objekt odabranog cilja sprema se u selectedGoal
    selectedGoal.value = goal
} //selectedGoal zagrada
//FUNKCIJA ZA OTVARANJE POPUP PROZORA DODAVANJA NOVOG CILJA
function addGoal() {
    //čišćenje prethodno unesenog naziva i opisa
    newGoalName.value = ''
    newGoalDescription.value = ''
    //otvaranje popup-a
    showGoalDialog.value = true
} //addGoal zagrada
//FUNCKIJA ZA ZATVARANJE POPUPA
function closeGoalDialog() {
    showGoalDialog.value = false
} //closeGoalDialog zagrada
//FUNKCIJA ZA SPREMANJE NOVOG CILJA
async function saveGoal() {
  //provjera je li naziv cilja prazan
  if(!newGoalName.value.trim()){
    Notify.create({
        message:'Naziv cilja je obavezan',
        type:'warning',
        position:'top'
    }) //notify zagrada
    return
  } //if zagrada
  //uključivanje loading stanja
  loading.value = true;

  try{
    //spremanje novog cilja u bazu
    const newGoalId = await goalService.createGoal(newGoalName.value, newGoalDescription.value)
    //ponovni dohvat svih ciljeva iz baze
    await loadGoals()
    //traženje upravo dodanog cilja na popisu
    const newGoal = goals.value.find(goal => goal.id === newGoalId)
    //ako je pronađen postavlja se automatski kao odabrani cilj
    if(newGoal) {
        selectedGoal.value = newGoal
    } //if zagrada
    //zatvaranje popupa
    showGoalDialog.value = false
    Notify.create({
        message: 'Novi cilj je uspješno dodan',
        type: 'positive',
        position: 'top'
    }) //notify zagrada
  } //try zagrada
  catch(error){
    console.error('Greška pri dodavanju cilja: ', error)
    Notify.create({
        message: 'Greška kod dodavanja cilja',
        type:'negative',
        position:'top'
    }) //notify zagrada
  } //catch zagrada
  finally{
    loading.value = false; //bez obzira na ishod, isključuje se učitavanje
  }//finally zagrada

} //saveGoal zagrada

// Funkcija SPREMANJE IZMJENA
async function saveClient() {
  // Dohvat ID klijenta
  const clientId = getClientId()

  // Provjera ID-a
  if (!clientId) {
    Notify.create({
      message: 'ID klijenta nije valjan',
      type: 'negative',
      position: 'top'
    }) //notify zagrada
    return //prekid
  } //if zagrada

  // OSNOVNA VALIDACIJA
  if (!ime.value.trim()) {
    Notify.create({
      message: 'Ime klijenta je obavezno',
      type: 'warning',
      position: 'top'
    }) //notify zagrada
    return
  } //if zagrada

  if (!prezime.value.trim()) {
    Notify.create({
      message: 'Prezime klijenta je obavezno',
      type: 'warning',
      position: 'top'
    }) //notify zagrada
    return
  } //if zagrada

  if(!spol.value.trim()) {
    Notify.create({
        message:'Spol klijenta je obavezan',
        type: 'warning',
        position:'top'
    }) //notify zagrada
    return //prekid funkcije da se onemogući spremanje
  } //if zagrada

  if(!kontakt.value.trim()){
    Notify.create({
        message:'Kontakt klijenta je obavezan',
        type:'warning',
        position:'top'
    }) //notify zagrada
    return
  }//if zagrada

  if(!visina.value.trim()){
    Notify.create({
        message: 'Visina klijenta u cm je obavezna',
        type: 'warning',
        position:'top'
    }) //notify zagrada
    //obavezan return za prekid funkcije spremanja jer je visina obavezna
    return
  } //if zagrada
    // Pretvara tekst u broj
    const visinaBroj = Number(visina.value)
    // Provjera je li broj valjan
    if (!Number.isFinite(visinaBroj) || visinaBroj <= 0) {
      Notify.create({
        message: 'Visina mora biti broj veći od 0.',
        type: 'warning',
        position: 'top'
      }) //notify zagrada
      return
    } //if zagrada

  if(!tezina.value.trim()){
    Notify.create({
        message:'Početna težina klijenta u kg je obavezna',
        type:'warning',
        position:'top'
    }) //notify zagrada
    return //prekid spremanja
  } //if zagrada
    //pretvaranje težine iz stringa u broj
    const tezinaBroj = Number(tezina.value)
    // Provjerava je li broj valjan
    if (!Number.isFinite(tezinaBroj) || tezinaBroj <= 0) {
      Notify.create({
        message: 'Početna težina mora biti broj veći od 0.',
        type: 'warning',
        position: 'top'
      }) //notify zagrada
      return
  } //if zagrada

  if(!fitnessIskustvo.value.trim()){
    Notify.create({
        message:'Fitness iskustvo klijenta je obavezno',
        type:'warning',
        position:'top'
    }) //notify zagrada
    return
  } //if zagrada

  if(!selectedGoal.value) {
     Notify.create({
      message: 'Odaberite cilj klijenta',
      type: 'warning',
      position: 'top'
    }) // notify zagrada
    return //prekid spremanja
  } //if zagrada

  // Uključivanje loading gumba
  loading.value = true

  try {
    // Poziv metode clientService-a
    await clientService.updateClient({
      clientId: clientId,             // ID klijenta kojeg se uređuje
      trainerId: authStore.trainerId,  // ID trenutno prijavljenog trenera
      firstName: ime.value.trim(),     //novo ime
      lastName: prezime.value.trim(),  //novo prezime
      gender: spol.value.trim(),
      contact: kontakt.value.trim(),
      height: visina.value.trim() ? Number(visina.value) : null,     
      startingWeight: tezina.value.trim() ? Number(tezina.value) : null,   // Početna težina pretvorena u broj
      experience: fitnessIskustvo.value.trim(),
      note: napomena.value.trim()
    }) //await updateClient zagrada

    //spremanje odabranog cilja klijenta nakon uspješnog spremanja osobnih podataka klijenta
    await clientService.updateClientGoal(clientId, authStore.trainerId, selectedGoal.value.id)

    Notify.create({
      message: 'Podaci o klijentu su uspješno ažurirani',
      type: 'positive',
      position: 'top'
    }) // notify zagrada 

    // Nakon spremanja vraća se na ClientDetailsPage // ClientDetailsPage ponovno dohvaća podatke iz baze
    router.back()
  } //try zagrada
  catch (error) {
    console.error('GREŠKA PRI AŽURIRANJU KLIJENTA:', error )
    // Dohvat poruke greške ako postoji
    const porukaGreske = error?.message || error?.error?.message || String(error)

    Notify.create({
      message: `Greška pri ažuriranju klijenta: ${porukaGreske}`,
      type: 'negative',
      position: 'top',
      timeout: 5000
    }) //notify zagrada
  } //catch zagrada
  finally {
    // Isključuje loading bez obzira na rezultat
    loading.value = false
  } //finally zagrada

} //saveClient zagrada

// POČETNO UČITAVANJE KAD SE OTVORI EKRAN PODATKA O KLIJENTU
onMounted(async () => {
  // 1. Poziv funkcije za dohvat podataka o klijentu
  await loadClient()
  //2. učitavanje ciljeva koji postoje u bazi
  await loadGoals()
  //3. učitavanje cilja koji je trenutno spremljen za odabranog klijenta
  await loadClientGoal()
}) //onMounted zagrada

</script>

<style scoped>

/* CIJELI EKRAN */
.edit-client-page {
  height: 100%;
  background: var(--q-dark-page);
}
/* GLAVNI KONTEJNER */
.edit-client-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
/* HEADER */
.page-header {
  position: relative;
  flex-shrink: 0;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}
/* NASLOV */
.page-title {
  color: #BDC4D4;
  font-size: 21px;
  font-weight: 600;
  text-align: center;
}
/* X GUMB */
.close-button {
  position: absolute;
  right: 12px;
  color: #BDC4D4;
  padding: 0;
  min-width: 0;
}

/* SCROLL PODRUČJE */
.page-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  box-sizing: border-box;
}
/* KONTEJNER S POLJIMA (OSOBNI PODACI KLIJENTA) */
.inputs-container {
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

/* KONTEJNER ZA CILJ KLIJENTA */
.goals-container {
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
/* ELEMENTI UNUTAR KONTEJNERA CILJEVA */
.goals-controls {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}
/* LABELA CILJA */
.goals-label {
  color: #BDC4D4;
  font-size: 16px;
  font-weight: 600;
}
/* GUMB DROPDOWNA ZA CILJ */
.goal-dropdown-button {
  width: 100%;
  background: #A8B9CC;
  color: #0F1A2B;
}
/* POPIS CILJEVA U DROPDOWNU */
.goal-dropdown-menu {
  background: #1C2E4A;
  color: #BDC4D4;
  min-width: 220px;
}
/* TEKST POJEDINOG CILJA */
.goal-dropdown-menu .q-item {
  color: #BDC4D4;
}
/* GUMB ZA DODAVANJE NOVOG CILJA */
.add-goals-button {
  width: 100%;
  background: #BDC4D4;
  color: #0F1A2B;
  flex-shrink: 0;
}

/* DONJI DIO S GUMBOM SPREMI (KOMPLETNO AŽURIRANJE) */
.buttons-container {
  flex-shrink: 0;
  padding: 8px 12px 12px;
  box-sizing: border-box;
}
/* GUMB SPREMI */
.save-button {
  width: 100%;
  height: 52px;
  font-size: 18px;
}

/* POZADINA POPUPA ZA DODAVANJE NOVOG CILJA */
.goal-dialog {
  width: calc(100vw - 32px);
  max-width: none;
  background: #1C2E4A;
  color: #BDC4D4;
  border-radius: 16px;
}
/* HEADER POPUPA */
.goal-dialog-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* X GUMB POPUPA */
.goal-dialog-close {
  position: absolute;
  right: 0;
  color: #BDC4D4;
}
/* DONJI DIO POPUPA */
.goal-dialog-actions {
  padding: 0 16px 16px;
}
/* GUMB SPREMI NOVI CILJ */
.goal-dialog-save {
  width: 100%;
}

/* LOADING KONTEJNER */
.loading-container {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
/* TEKST LOADINGA */
.loading-text {
  color: #BDC4D4;
  font-size: 15px;
}

</style>