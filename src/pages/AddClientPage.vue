<!--EKRAN ZA DODAVANJE KLIJENTA -->

<template>
    <!-- CIJELI MOBILNI EKRAN APP -->
  <q-page class="add-client-page">

    <!-- EKRAN KOJI DIJELI APP NA HEADER, SCROLL-ABILNU SREDINU I FOOTER -->
    <div class="add-client-content">

        <!-- FIXAN HEADER -->
        <div class="page-header">

            <!-- NASLOV NA VRHU EKRANA -->
            <div class="page-title">
            DODAVANJE KLIJENTA
            </div>

            <q-btn
            flat 
            dense
            icon="close"
            aria-label="Zatvori"
            class="close-button"
            @click="closePage"
            />

        </div>

        <!-- SREDINA EKRANA KOJA SE SCROLL-A -->
        <div class="page-scroll-area">

            <!-- POLJA ZA UNOS PODATAKA O KLIJENTU -->
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

                    <!-- Spol -->
                    <q-input
                        outlined
                        rounded
                        v-model="spol"
                        autocomplete="off"
                        label="Spol"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <!-- Kontakt -->
                    <q-input
                        outlined
                        rounded
                        v-model="kontakt"
                        autocomplete="off"
                        label="Kontakt (br. tel ili email)"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <!-- Visina -->
                    <q-input
                        outlined
                        rounded
                        v-model="visina"
                        autocomplete="off"
                        label="Visina cm"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                      <!-- Težina -->
                    <q-input
                        outlined
                        rounded
                        v-model="tezina"
                        autocomplete="off"
                        label="Početna težina kg"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <!-- Fitness iskustvo -->
                    <q-input
                        outlined
                        rounded
                        v-model="fitnessIskustvo"
                        autocomplete="off"
                        label="Fitness iskustvo"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-sm"/>

                    <!-- Napomena -->
                    <q-input
                        outlined
                        rounded
                        v-model="napomena"
                        autocomplete="off"
                        label="Napomena"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-lg"/>

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

    </div>

        <!-- GUMB SPREMI -->
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

            <!-- Donji dio popup-a s gumbom -->
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

//uvoz useRouter za vraćanje korisnika/trenera na prethodni ekran -za navigaciju između ekrana
import { useRouter } from 'vue-router'
//dohvat router instance za trenutnu vue komponentu
const router = useRouter()

//uvoz onMounted za pokretanje učitavanja ciljeva kad se ekran otvori
import {onMounted, ref} from 'vue'

//uvoz servisa za rad s ciljevima
import goalService from '@/services/goal.service'
//uvoz servisa za rad s klijentima
import clientService from '@/services/client.service'

//Uvoz Pinia Store-a za trenutno prijavljenog trenera
import {useAuthStore} from '@/stores/auth.store'
//dohvat auth store instance
const authStore = useAuthStore()

//uvoz Quasar Notify za alertova/poruka korisniku/treneru
import { Notify } from 'quasar'

//podaci o klijentu
const ime = ref('')               //definirana reaktivna varijabla za ime
const prezime = ref('')           //definirana reaktivna varijabla za prezime
const spol = ref('')              //definirana reaktivna varijabla za spol
const kontakt = ref('')           //definirana reaktivna varijabla za kontakt
const visina = ref('')            //definirana reaktivna varijabla za visinu
const tezina = ref('')            //definirana reaktivna varijabla za početnu težinu
const fitnessIskustvo = ref('')   //definirana reaktivna varijabla za fitness iskustvo
const napomena = ref('')          //definirana reaktivna varijabla za napomenu

//definiranje niza svih ciljeva dohvaćenih iz baze
const goals = ref([])
//definiranje trenutno odabranog cilja
const selectedGoal = ref(null)

//definiranje prikazuje li se popup prozor za dodavanje novog cilja
const showGoalDialog = ref(false)
//definiranje reaktivne varijeble za naziv novog cilja
const newGoalName = ref('')
//definiranje reaktivne varijeble za opis novog cilja
const newGoalDescription = ref('')

//definiranje reaktivne varijeble za određivanje prikaza loading stanja
const loading = ref(false)

//funkcija za zatvaranje ekrana za dodavanje novog klijenta (X GUMB)
function closePage() {
  router.back() //vraćanje korisnika na prethodni ekran
}

// funkcija za dohvat ciljeva iz baze i postavljanje prvog cilja kao odabranog u dropdown menu
async function loadGoals() {
    //try radi dohvata mogućih grešaka
  try {
    goals.value = await goalService.getGoals() //dohvat ciljeva iz Goalservice

    if (goals.value.length > 0) { //ako postoji baren jedan dohvaćen cilj, prvi cilj automatski postaje odabrani cilj
      selectedGoal.value = goals.value[0] //prvi dohvaćen cilj postaje početno odabran cilj na dropdown menu koji se prikazuje prije klika na menu  //selectedGoal nije samo ID zato jer može biti  {id: 2, name: 'Hipertrofija', description: 'izgradnja mišićne mase'} //kasnije se može koristiti selectedGoal.value.id da bi se moglo spremati u tablicu ciljevi klijenta ili selectedGoal.value.name na ekranu
    } //if zagrada
  } catch (error) {
    console.error('Greška pri učitavanju ciljeva:', error) //ispis greške u konzoli
    //prikaz obavijesti korisniku/treneru
    Notify.create({
        message: 'Ciljeve nije moguće učitati', //poruka koja se prikazuje korisniku/treneru na ekranu
        type:'negative' //tip obavijesti
    }) //notify zagrada
  } //catch zagrada
} //loadGoals zagrada

//funkcija za postavljanje kliknutog cilja kao trenutno odabrani cilj
function selectGoal(goal) {
    //cijeli objekt cilja sprema se u selectedGoal
    selectedGoal.value = goal
} //selectedGoal zagrada

//funkcija za otvaranje popupa za dodavanje novog cilja
function addGoal() {
    //brišemo prethodni naziv iz popupa
    newGoalName.value = ''
    //brišemo prethodni opis iz popupa
    newGoalDescription.value = ''
    //otvara se popup
    showGoalDialog.value = true
} //addGoal zagrada

//funkcija koja zatvara popup dodavanja novog cilja bez spremanja podataka
function closeGoalDialog() {
    //popup se zatvara
    showGoalDialog.value = false
} //closeGoalDialog zagrada

//funkcija za spremanje novog cilja u bazu
async function saveGoal() {
    //provjera je li naziv cilja prazan ili sastavljen od razmaka
    if(!newGoalName.value.trim() ) {
        //prikaz upozorenja na ekranu korisniku/treneru
        Notify.create({
            message:'Naziv cilja je obvezan.',
            type: 'warning'
        }) //notify zagrada
        return //prekid funckije jer je naziv cilja obavezan
    }//if zagrada

    //aktivirano loading stanje
    loading.value = true

    //try blok zbog hvaćanja grešaka
    try{
        //spremanje novog cilja i dobivanje novog ID
        const newGoalId = await goalService.createGoal(
            //prosljeđuje se naziva i opisa cilja
            newGoalName.value,
            newGoalDescription.value
        )//newGoalId zagrada

        //ponovno dohvaćanje svih ciljeva iz baze (za potrebe prikaza u dropdown meniju i samim time i mogućnost dodjele cilja klijentu)
        await loadGoals()
        //Pronalazak novododanog cilja u novom popisu
        const newGoal = goals.value.find(
            //usporedba ID svakog cilja s novim ID-jem
            goal => goal.id === newGoalId
        ) //newGoal zagrada

        //provjera je li novi cilj pronađen
        if(newGoal) {
            //novi cilj postaje trenutno odabran cilj
            selectedGoal.value = newGoal
        }//if zagrada

        //zatvaranje popup-a nakon uspješnog spremanja
        showGoalDialog.value = false

        //prikaz poruke korisniku o uspješnom dodavanju cilj(eva)
        Notify.create({
            message: 'Novi cilj je uspješno dodan.',
            type: 'positive'
        }) //notify zagrada

    }//try zagrada
    //hvatanje pogrešaka
    catch(error){
        //ispis u konzoli
        console.error('Greška pri dodavanju cilja.', error);
        //prikaz alerta/poruke na ekranu korisnika/trenera
        Notify.create({
            message: 'Greška kod dodavanja cilja.',
            type: 'negative'
        }) //notify zagrada

    } //catch zagrada
    finally {
        //isključivanja loading stanja nakon uspjeha ili greške
        loading.value = false
    } //finally zagrada

} //saveGoal zagrada

//funkcija za resetiranje forme za dodavanje klijenta nakon spremanja klijenta
function resetClientForm() {
    //brisanje unsenih podataka o klijentu (ime, prezime, spol, kontakt...)
    ime.value = ''
    prezime.value = ''
    spol.value = ''
    kontakt.value = ''
    visina.value = ''
    tezina.value = ''
    fitnessIskustvo.value = ''
    napomena.value = ''
} //resetClientForm zagrada

//funkcija koja sprema novog klijenta i cilj
async function saveClient() {
    //provjera jesu li obavezna polja prazna ili sastavljena od razmaka ili točnog formata (ime, prezime, spol, visina...)
    if(!ime.value.trim() ) {
        Notify.create({
            message: 'Ime klijenta je obavezno',
            type: 'warning'
        }) //notify zagrada
        //obavezan return za prekid funkcije spremanja jer je ime obavezno
        return
    } //if zagrada
    if(!prezime.value.trim()) {
        Notify.create({
            message: 'Prezime klijenta je obavezno',
            type: 'warning'
        }) //notify zagrada
        //obavezan return za prekid funkcije spremanja jer je prezime obavezno
        return
    } //if zagrada
    if(!spol.value.trim()) {
        Notify.create({
            message: 'Spol klijenta je obavezan',
            type: 'warning'
        }) //notify zagrada
         //obavezan return za prekid funkcije spremanja jer je spol obavezan
        return
    } //if zagrada
   
    if(!kontakt.value.trim()) {
        Notify.create({
            message: 'Kontakt klijenta je obavezan',
            type: 'warning'
        }) //notify zagrada
         //obavezan return za prekid funkcije spremanja jer je kontakt obavezan
        return
    } //if zagrada
    if(!visina.value) {
        Notify.create({
            message: 'Visina klijenta u cm je obavezna',
            type: 'warning'
        }) //notify zagrada
         //obavezan return za prekid funkcije spremanja jer je visina obavezna
        return
    } //if zagrada
    //pretvaranje visine iz string-a u broj
    const visinaBroj = Number(visina.value)
    //provjera je li visina broj veći od nule
    if(!Number.isFinite(visinaBroj) || visinaBroj <= 0) {
        Notify.create({
            message: 'Visina mora biti broj veći od 0.',
            type: 'warning'
        }) //notify zagrada
        //obavezan return za prekid funkcije spremanja jer je visina obavezna (kao broj veći od 0)
        return 
    }//if zagrada
    if(!tezina.value) {
        Notify.create({
            message: 'Početna težina klijenta u kg je obavezna',
            type: 'warning'
        }) //notify zagrada
        //obavezan return za prekid funkcije spremanja jer je težina obavezna
        return
    } //if zagrada
    //pretvaranje težine iz stringa u broj
    const tezinaBroj = Number(tezina.value)
    //provjera je li težina valjan broj veći od nule
    if(!Number.isFinite(tezinaBroj) || tezinaBroj <= 0) {
        Notify.create({
            message: 'Početna težina mora biti broj veći od 0.',
            type: 'warning'
        }) //notify zagrada
        //obavezan return za prekid funkcije spremanja jer je težina obavezna (kao broj veći od 0)
        return
    }//if zagrada
    if(!fitnessIskustvo.value.trim()) {
        Notify.create({
            message: 'Fitness iskustvo klijenta je obavezno',
            type: 'warning'
        }) //notify zagrada
        //obavezan return za prekid funkcije spremanja jer je fitness iskustvo obavezno
        return
    } //if zagrada

    //provjera postoji li odabran cilj
    if(!selectedGoal.value){
        //prikazuje se upozorenje na ekranu korisnika/trenera
        Notify.create({
            message: 'Odaberite cilj klijenta.',
            type: 'warning'
        }) //notify zagrada
        //prekid spremanje jer svi obavezni podaci nisu spremni
        return
    } //if zagrada

    //uključivanje loading stanja
    loading.value = true

    try{
        //kreiranje objekta koji sadrži podatke o klijentu
        //spremamo ime, prezime, spol, kontakt, visinu (pretvorba u broj), težinu (isto broj), fitness iskustvo i napomenu
        const client = {
            firstName: ime.value.trim(),
            lastName: prezime.value.trim(),
            gender: spol.value.trim(),
            contact: kontakt.value.trim(),
            height: visinaBroj,
            startingWeight: tezinaBroj,
            experience: fitnessIskustvo.value.trim(),
            note: napomena.value.trim()
        } //const client zagrada

        //spremanje klijenta i cilja u bazu
        await clientService.createClientWithGoal(
            //prosljeđivanje podataka o klijentu
            client,
            selectedGoal.value.id, //prosljeđivanje ID odabranog cilja
            authStore.trainerId //prosljeđivanje ID prijavljenog trenera
        ) //clientService.createClientWithGoal zagrada

        //poruka uspješnog spremanja
        Notify.create({
            message: 'Klijent je uspješno spremljen.',
            type: 'positive',
            position: 'top'
        }) //notify zagrada

        //poziv fumkcije za restiranje forme nakon uspješnog spremanja klijenta
        resetClientForm()

        //vraćanje korisnika/trenera natrag na dashboard
       // router.back()

    } //try zagrada
    //hvatanje pogrešaka
    catch(error) {
        console.error('Greška pri spremanju klijenta: ', error)

        Notify.create({
            message: 'Greška pri spremanju klijenta ',
            type: 'negative'
        }) //notify zagrada
    } //catch zagrada
    finally{
        //isključivanje loading stanja
        loading.value = false
    } //finally zagrada

} //saveClient zagrada

//učitavanje ciljeva iz baze pri otvaranju ekrana 
onMounted(() => {
    //pokretanje dohvata ciljeva
  loadGoals()
})

</script>

<style scoped>

/* CIJELI EKRAN */
.add-client-page {
  height: 100%;
  background: var(--q-dark-page);
}

/* GLAVNI KONTAJNER */
.add-client-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* ZAGLAVLJE */
.page-header {
  position: relative;
  flex-shrink: 0;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

.page-title {
  color: #BDC4D4;
  font-size: 21px;
  font-weight: 600;
  text-align: center;
}

/* X GUMB EKRAN DODAVANJE KLIJENTA */
.close-button {
  position: absolute;
  right: 12px;
  color: #BDC4D4;
  padding: 0;
  min-width: 0;
}

/* SREDINA KOJA SE SCROLL-A */
.page-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  box-sizing: border-box;
}

/* KONTEJNER POLJA ZA UNOS PODATAKA O KLIJENTU */
.inputs-container{
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  margin-bottom:20px;
}

/* KONTJENER CILJEVA */
.goals-container {
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
/* DROPDOWN MENI + GUMB DODAJ NOVI CILJ (SLAGANJE VERTIKALNO) */
.goals-controls {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}
.goals-label {
    color: #BDC4D4;
    font-size: 16px;
    font-weight: 600;
}
/* DROPDOWN GUMB*/
.goal-dropdown-button {
  width: 100%;
  background: #A8B9CC;
  color: #0F1A2B;
 /* flex: 1; */
}
/* DROPDOWM MENI */
.goal-dropdown-menu {
  background: #1C2E4A; 
 /* background: #0F1A2B;*/
  color: #BDC4D4;
  min-width: 220px;
}
/* TEKST POJEDINAČNE OPCIJE DROPDOWN MENU */
.goal-dropdown-menu .q-item {
  color: #BDC4D4;
}
/* KADA JE POJEDINAČNA OPCIJA DODIRNUTA ILI OZNAČENA */
.goal-dropdown-button .q-item:hover {
    background: #52677D;
    color:#FFFFFF;
}

/* GUMB DODAJ NOVI CILJ */
.add-goals-button {
  width: 100%;
  background: #BDC4D4;
  color: #0F1A2B;
  flex-shrink: 0;
}

/* KONTEJNER GUMBA SPREMI */
.buttons-container{
  flex-shrink: 0;
  padding: 8px 12px 12px;
  box-sizing: border-box;
}

/* GUMB SPREMI */
.save-button{
  width: 100%;
  height:52px;
  font-size:18px;
}

/* POZADINA POPUPA ZA NOVI CILJ */
.goal-dialog {
  width: calc(100vw - 32px);
  max-width: none;
  background: #1C2E4A;
  color: #BDC4D4;
  border-radius: 16px;
}
/* Header popupa. */
.goal-dialog-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Naslov popupa. */
/*.goal-dialog-title {
  color: #BDC4D4;
  font-size: 18px;
  font-weight: 600;
} */

/* X gumb popupa. */
.goal-dialog-close {
  position: absolute;
  right: 0;
  color: #BDC4D4;
}

/* Donji dio popupa. */
.goal-dialog-actions {
  padding: 0 16px 16px;
}

/* Gumb za spremanje cilja. */
.goal-dialog-save {
  width: 100%;
}

</style>