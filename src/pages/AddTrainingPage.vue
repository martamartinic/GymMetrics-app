<!--EKRAN ZA DODAVANJE NOVOG TRENINGA KLIJENTA -->

<template>
    <!-- CIJELI MOBILNI EKRAN APP -->
  <q-page class="add-training-page">

    <!-- EKRAN KOJI DIJELI APP NA HEADER, SCROLL-ABILNU SREDINU I FOOTER -->
    <div class="add-training-content">

        <!-- FIXAN HEADER -->
        <div class="page-header">

            <!-- NASLOV NA VRHU EKRANA -->
            <div class="page-title">
            DODAVANJE TRENINGA
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

            <!-- POLJA ZA UNOS PODATAKA O TRENINGU -->
            <div class="inputs-container">
                    <!-- Datum -->
                    <q-input
                        outlined
                        rounded
                        v-model="datumTreninga"
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        label="Datum treninga (GGGG-MM-DD)"
                        placeholder="pr. 2026-01-31"
                        :rules="[validacijaDatumaTreninga]"
                        color="primary"
                        dark
                        lazy-rules
                    />
                    <!-- razmak između polja -->
                    <q-space class="q-my-sm"/>
                    
                    <!-- Ocjena treninga -->
                    <q-input
                        outlined
                        rounded
                        v-model="ocjenaTreninga"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        label="Ocjena treninga (1.0 do 5.0)"
                        placeholder="pr. 4.5"
                       :rules="[validacijaOcjeneTreninga]" 
                        color="primary"
                        dark
                        lazy-rules
                    />
                    <q-space class="q-my-sm"/>

                    <!-- Bilješka -->
                    <q-input
                        outlined
                        rounded
                        v-model="biljeskaTreninga"
                        type="text"
                        autogrow
                        autocomplete="off"
                        label="Bilješka treninga (opcionalno)"
                        color="primary"
                        dark
                    />
                    <q-space class="q-my-lg"/>

            </div>

            <!--Odabir vrste treninga dropdown menu -->
            <div class="training-types-container">

                <div class="training-types-controls">

                <!-- Fiksna labela koja ostaje u istom retku s vrijednošću. -->
                <span class="training-types-label"> Vrsta treninga: </span>
                    <!--quasar dropdown za vrste treninga -->
                    <q-select 
                        v-model="selectedTrainingType"
                        :options="trainingTypes"
                        option-label="name"
                        option-value="id"
                        emit-value
                        map-options
                        dense
                        rounded
                        dark
                        behavior="menu"                                    
                        popup-content-class="training-type-popup"
                        menu-anchor="top left"
                        menu-self="bottom left"
                        :loading="loadingTrainingTypes"
                        :display-value="selectedTrainingTypeName"
                        aria-label="Odabir vrste treninga"
                        class="training-types-menu"
                    />
                </div>
                <q-space class="q-my-lg"/>
            </div>

                <!--KONTEJNER ODRAĐENIH VJEŽBI -->
                <div class="exercises-container"> 

                    <!--obrubljen okvir za vježbe sa checkboxom  -->
                    <div class="exercises-label"> Odrađene vježbe: </div>

                    <!-- poruka ako za odabranu vrstu treninga  nema vježbi -->
                    <div
                         v-if="selectedTrainingType && exercises.length === 0"
                         class="exercises-empty"
                    >    Za odabranu vrstu treninga nema dostupnih vježbi. 
                    </div>

                    <!-- CHECKBOX-OVI S VJEŽBAMA -->
                    <div v-else class="exercises-checkboxes" >
                        <!--svaka vježba ima svoj checkbox -->
                        <q-checkbox
                            v-for="exercise in exercises"
                            :key="exercise.id"
                            v-model="selectedExercises"
                            :val="exercise.id"
                            :label="exercise.name"
                            color="primary"
                            dark
                            class="exercise-checkbox"
                        />
                    </div>
                </div>
        </div>

        <!-- GUMB SPREMI KOMPLETAN TRENING -->
        <div class="buttons-container">
            <q-btn
                unelevated
                rounded
                color="primary"
                class="save-button"
                label="Spremi"
                :loading="loading"
                @click="saveTraining" 
            />
        </div>
    </div>

  </q-page>

</template>

<script setup>

//uvoz useRouter za vraćanje korisnika/trenera na prethodni ekran -za navigaciju između ekrana
import { useRouter, useRoute } from 'vue-router'
//dohvat router instance za trenutnu vue komponentu
const router = useRouter() //dohvat router instance
const route = useRoute() //dohvat trenutne rute radi uzimanje ID klijenta iz URL-a

//uvoz onMounted za pokretanje učitavanja ciljeva kad se ekran otvori
import {computed, onMounted, ref, watch} from 'vue'
//uvoz Quasar Notify za alertova/poruka korisniku/treneru
import { Notify } from 'quasar'

//uvoz instance servisa za vrste treninga - za dohvat vrste treninga
import trainingTypeService from '@/services/training-type.service'
// Uvoz servisa za podatke o treninzima - za spremanje treninga
import trainingService from '@/services/training.service'
//uvoz instance servisa za vježbe povezane sa vrstom treninga
import exerciseService from '@/services/exercise.service.js'

//OSNOVNE REAKTIVNE VARIJABLE:
//podaci o novom treningu
const datumTreninga = ref('')               //definirana reaktivna varijabla za datum treninga kojeg unosi korisnik/trener
const ocjenaTreninga = ref('')           //definirana reaktivna varijabla za ocjenu treninga koju unosi korisnik/trener kao tekst kasnije pretvorba u broj prije spremanja
const biljeskaTreninga = ref('')              //definirana reaktivna varijabla za biljesku treninga koju unosi korisnik/trener

//VRSTE TRENINGA
//definiranje niza svih vrsta treninga dohvaćenih iz baze
const trainingTypes = ref([])
//definiranje trenutno odabrane vrste treninga -->ID trenutno odabrane vrste treninga, zbog emit-value u q-select sprema se samo ID a ne cijeli objekt vrste treninga
const selectedTrainingType = ref(null)
//loading stanje za dohvat vrsta treninga
const loadingTrainingTypes = ref(false)

//VJEŽBE
//niz vježbi koje pripadaju trenutno odabranoj vrsti treninga
const exercises = ref([]) //definiranje reaktivne varijable za vježbe
//niz odabranih vježbi koje korisnik/trener označi checkboxom
const selectedExercises = ref([]) //definiranje reaktivne varijable za odabrane vježbe

//definiranje reaktivne varijeble za određivanje prikaza loading stanja gumba SPREMI
const loading = ref(false)

//NAZIV ODABRANE VRSTE TRENINGA
//Computed vrijednost pronalazi naziv vrste treninga na temelju ID koji je spremljen u selectedTrainingType
const selectedTrainingTypeName = computed(() => {
    //tražimo vrstu treninga koja ima odabrani ID
  const selected = trainingTypes.value.find(type => type.id === selectedTrainingType.value)

  //ako vrsta treninga nije pronađena, vraća se prazan string
  if(!selected) {
    return ''
  } //if zagrada

  //naziv prikazuje se velikim slovima
  return selected.name.toUpperCase()

}) //selectedTrainingTypeName zagrada


//funkcija za zatvaranje ekrana za dodavanje novog treninga klijenta (X GUMB)
function closePage() {
  router.back() //vraćanje korisnika na prethodni ekran
}

//VALIDACIJA DATUMA (1. unesen, 2. format GGGG-MM-DD, 3. datum stvarno postoji u kalendaru)
function validacijaDatumaTreninga(value) {
    if (!value || !value.trim()) {
        return 'Datum treninga je obavezan'
    } //if zagrada
    
    //provjera formata datuma godina-mjesec-dan
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'Datum treninga mora biti u formatu GGGG-MM-DD'
    } //if zagrada

    //dijeli datum na godine, mjesece i dane
    const [year, month, day] = value.split('-').map(Number)

    //stvaranje UTC datuma
    const date = new Date(Date.UTC(year, month - 1, day))

    //provjera je li javascript nakon stvaranja datuma zadržao potpuno iste vrijednosti godine, mjeseca i dana
    const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month -1 && date.getUTCDate() === day

    //ako datum ne postoji, vraća poruku greške
    if(!isRealDate) {
        return 'Datum treninga ne postoji u kalendaru'
    } //if zagrada

    //ako su sve provjere uspješne, pravilo je zadovoljeno
    return true

} //validacijaDatumaTreninga zagrada

//VALIDACIJA OCJENE (1. unesen, 2. decimalni separator je točka, 3. ocjene između 1.0 i 5.0)
function validacijaOcjeneTreninga(value) {
    if (value === null || value === undefined || !String(value).trim()) {
        return 'Ocjena treninga je obavezna'
    } //if zagrada

    //pretvorba vrijednosti u tekst radi provjere formata
    const ratingText = String(value).trim()

    //provjera koristi li se točka, a ne zarez
    if(!/^(?:[1-5](?:\.\d+)?)$/.test(ratingText)) {
        //ako postoji zarez, javlja se poruka upozorenja
        if(ratingText.includes(',')) {
            return 'Decimalni broj ocjene odvaja se točkom (.)'
        } //if zagrada
        return 'Ocjena mora biti broj između 1.0 i 5.0'
    } //if zagrada

    //pretvorba tekstualne vrijednosti u broj
    const rating = Number(ratingText)

    //provjera je li ocjena između 1.0 i 5.0
    if(rating < 1.0 || rating > 5.0) {
        return 'Ocjena mora biti između 1.0 i 5.0'
    } //if zagrada  
    //ocjena je ispravna
    return true
} //validacijaOcjeneTreninga zagrada

//DOHVAT VRSTE TRENINGA
// funkcija za dohvat vrsta treninga iz baze i postavljanje prvog vrsta treninga kao odabranog u dropdown menu
async function loadTrainingTypes() {
    //uključivanje loading stanja dropdown menu vrsta treninga
    loadingTrainingTypes.value = true

    //try radi dohvata mogućih grešaka
  try {
    //dohvat vrste treninga preko servisa TrainingTypeService
    trainingTypes.value = await trainingTypeService.getTrainingTypes() 

    //ako postoji baren jedna dohvaćena vrsta treninga, prva vrsta treningaautomatski postaje odabrana vrsta treninga
    if (trainingTypes.value.length > 0) { 
        //zbog emit value sprema se samo ID, a ne {id:1, name: 'Gornji dio'}
      selectedTrainingType.value = trainingTypes.value[0].id 
    } //if zagrada
  } catch (error) {
    console.error('Greška pri učitavanju vrsta treninga:', error) //ispis greške u konzoli
    //prikaz obavijesti korisniku/treneru
    Notify.create({
        message: 'Vrste treninga nije moguće učitati', //poruka koja se prikazuje korisniku/treneru na ekranu
        type:'negative', //tip obavijesti
        position: 'top' //pozicija obavijesti na ekranu
    }) //notify zagrada
  } //catch zagrada
  finally {
    loadingTrainingTypes.value = false //isključivanje loading stanja dropdown menu vrsta treninga nakon učitavanja
  } //finally zagrada

} //loadTrainingTypes zagrada

//DOHVAT VJEŽBI ZA ODABRANU VRSTU TRENINGA

// Funkcija dohvaća vježbe koje pripadaju trenutno odabranoj vrsti treninga.
async function loadExercises() {

  // Prije novog učitavanja brišemo trenutno označene vježbe.
  selectedExercises.value = []

  // Ako nema odabrane vrste treninga, nema ni vježbi koje možemo dohvatiti.
  if (!selectedTrainingType.value) {
    // Pražnjenje popisa vježbi
    exercises.value = []
    // Prekid funkcije
    return
  }

  try {
    // Dohvat ID odabrane vrste treninga
    const trainingTypeId = selectedTrainingType.value

    // Preko ExerciseService dohvaćaju se sve vježbe povezane s tom vrstom treninga
    exercises.value = await exerciseService.getExercisesForTrainingType(trainingTypeId)

  } catch (error) {
    console.error('Greška pri učitavanju vježbi:',error)

    // U slučaju greške prazni se popis
    exercises.value = []

    Notify.create({
      message: 'Greška pri učitavanju vježbi',
      type: 'negative',
      position: 'top'
    }) //notify zagrada

  } //catch zagrada

} //loadExercises zagrada
//PRAĆENJE PROMJENE VRSTE TRENINGA // Kada korisnik promijeni vrstu treninga u dropdownu, automatski učitava nove vježbe
watch(
  selectedTrainingType,  async () => {
    // Dohvat vježbe za novu vrstu treninga
    await loadExercises()
  } //selectedTrainingType zagrada
) //watch zagrada

//PROVJERA ID KLIJENTA
// Funkcija pretvara ID klijenta iz URL-a u broj i provjerava je li valjan.
function getClientId() {

  // route.params vrijednosti dolaze iz URL-a kao tekst
  const clientId = Number(route.params.id)

  // Provjerava je li cijeli pozitivan broj
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null
  } //if zagrada
  // Vraća ispravan ID
  return clientId

} //getClientId zagrada

//FUNKCIJA ZA SPREMANJE TRENINGA
async function saveTraining() {
 // PRVO PROVJERA DATUMA
  const validacijaDatuma = validacijaDatumaTreninga(
    datumTreninga.value
  ) //const validacijaDatuma zagrada

  // Ako datum nije ispravan, prikazuje se upozorenje i ne pokreće se spremanje
  if (validacijaDatuma !== true) {
    Notify.create({
      message: validacijaDatuma,
      type: 'warning',
      position: 'top'
    }) //notify zagrada
    return
  } //if zagrada

 //  PROVJERAVA OCJENE
  const validacijaOcjene = validacijaOcjeneTreninga(
    ocjenaTreninga.value
  ) //const validacijaOcjene zagrada

  // Ako ocjena nije ispravna, prekida spremanja
  if (validacijaOcjene !== true) {
    Notify.create({
      message: validacijaOcjene,
      type: 'warning',
      position: 'top'
    }) //notify zagrada
    return
  } //if zagrada

  // PROVJERAVA VRSTE TRENINGA
  if (!selectedTrainingType.value) {
    Notify.create({
      message: 'Vrsta treninga je obavezna',
      type: 'warning',
      position: 'top'
    }) //notify zagrada
    return //prekid 
  } //if zagrada

  // DOHVAT I PROVJERA ID-A KLIJENTA.
  const clientId = getClientId()

  // Ako ID klijenta nije valjan, ne sprema se trening
  if (!clientId) {
    Notify.create({
      message: 'ID klijenta nije valjan',
      type: 'negative',
      position: 'top'
    }) //notify zagrada
    return //prekid
  } //if zagrada

  // PRETVARANJE OCJENE IZ TEKSTA U BROJ
  const rating = Number(
    String(ocjenaTreninga.value).trim()
  )

  // POKRETANJE SPREMANJA.

  // Tek sada uključuje se loading // Ovo je važno jer kod neispravnog unosa više se gumb ne ostavlja trajno u loading stanju
  loading.value = true

  try {

    // Poziva se TrainingService koji radi transakciju: 1. INSERT u Trening_klijenta 2. dohvat ID-a novog treninga 3. INSERT odabranih vježbi u Vjezbe_treninga_klijenta 4. COMMIT --> Ako nešto ne uspije, servis radi ROLLBACK
    await trainingService.createTraining({
      // ID trenutno otvorenog klijenta
      clientId: clientId,
      // ID odabrane vrste treninga
      trainingTypeId: selectedTrainingType.value,
      // Datum u obliku GGGG-MM-DD
      date: datumTreninga.value.trim(),
      // Ocjena je sada pravi JavaScript broj
      rating: rating,
      // Bilješka se šalje kao tekst
      note: biljeskaTreninga.value.trim(),
      // Šalju se ID-evi svih označenih checkboxova
      exerciseIds: selectedExercises.value
    }) //await trainingService.createTraining zagrada

    // Ako je sve uspješno spremljeno, prikazuje poruku
    Notify.create({
      message: 'Trening je uspješno spremljen',
      type: 'positive',
      position: 'top'
    }) //notify zagrada

    //router.back()  //-_> samo povratak na ekran detalja klijenta bez promjene vrsta treninga u dropdown meniju
    
    // Vraćanje na ClientDetailsPage //osim povratka na taj ekran, šalje se i ID odabrane vrste treninga kod unosa treninga 
    // --> clientDetailsPage taj ID iskorištava kako bi se automatski izmijenila vrsta treninga u meniju i samim time statistika da se treneru prikaže novo stanje i utjecaj na napredak nakon dodanog treninga umjesto da bude selektiran defaultna vrsta treninga iz baze (kao kod tek dolaska na ekran detalja klijenta) pa da trener mora ručno mijenjati da bi vidio novo stanje
       router.replace({
        path: `/dashboard/clients/${clientId}`, 
        query: {trainingTypeId: String(selectedTrainingType.value)}
    }) //router replace 

  } //try zagrada
  catch (error) {
    console.error('GREŠKA PRI SPREMANJU TRENINGA:', error)

    // Pokušavamo dohvatiti stvarnu tekstualnu poruku greške.
    const porukaGreske =
    error?.message ||
    error?.error?.message ||
    String(error)

    Notify.create({
      message: `Greška pri spremanju treninga: ${porukaGreske}`,
      type: 'negative',
      position: 'top',
      timeout:5000
    }) //notify zagrada
  } //catch zagrada
  finally {
    // Bez obzira na rezultat spremanja, gasi se loading stanje
    loading.value = false
  } //finally zagrada

} //saveTraining zagrada

//POČETNO UČITAVANJE EKRANA
// Kada se ekran otvori, dohvaća vrste treninga
onMounted(async () => {
    // Dohvat vrste treninga
  await loadTrainingTypes()
}) //onMounted zagrada

</script>

<style scoped>

/*CIJELI EKRAN */
.add-training-page{
  height: 100%;
  background: var(--q-dark-page);
}
/* EKRAN KOJI DIJELI APP NA HEADER, SCROLL-ABILNU SREDINU I FOOTER */
.add-training-content{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
/*FIXAN HEADER */
.page-header{
  position: relative;
  flex-shrink: 0;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}
/* NASLOV NA VRHU EKRANA "DODAJ TRENING" */
.page-title{
  color: #BDC4D4;
  font-size: 21px;
  font-weight: 600;
  text-align: center;
}
/*GUMB ZA ZATVARANJE EKRANA (X) */
.close-button{
  position: absolute;
  right: 12px;
  color: #BDC4D4;
  padding: 0;
  min-width: 0;
}

/*SREDINA EKRANA KOJA SE SCROLL-A */
.page-scroll-area{
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  box-sizing: border-box;
}

/*POLJA ZA UNOS DATUMA, OCJENE I BILJESKE */
.inputs-container{
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  margin-bottom:20px;

}
/* KONTEJNER ODABIR VRSTE TRENINGA DROPDOWN MENU */
.training-types-container{
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
/* DROPDDOWN MENI + LABELA */
.training-types-controls{
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}
/*LABELA VRSTE TRENINGA */
.training-types-label{
  color: #BDC4D4;
  font-size: 16px;
  font-weight: 600;
}
/*DROPDOWN MENU VRSTE TRENINGA */
.training-types-menu{
  background: #1C2E4A; 
 /* background: #0F1A2B;*/
  color: #BDC4D4;
  min-width: 220px;
}
/* VIZUAL SAMOG DROPDOWN GUMBA */
:deep(.training-types-menu .q-field__control) {
  background: #A8B9CC; /*plavo-sivkasta boja */
  border-radius: 12px;   /* Zaobljeni rubovi dropdowna. */
  border: none; /* Uklanjanje obruba */
  min-height: 42px; /* Visina dropdowna */
}
/*TEKST NA GUMBU DROPDOWN MENIJA */
:deep(.training-types-menu .q-field__native) {
  color:#1C2E4A;
  font-weight: 600;
  justify-content: center;
}
/* STRELICA DROPDOWNA */
:deep(.training-types-menu .q-field__append){
  /* Boja strelice. */
  color: #1C2E4A;
  margin-right: 6px;
}
/* TEKST POJEDINAČNE OPCIJE U OTVORENOM DROPDOWN MENU */
/*q-select popup quasar renderira izvan komponente, :deep služi da bi scoped CSS došao do elementa izvan izbornika */
:deep(.training-types-popup .q-item) {
  color: #BDC4D4;
}
/* KADA JE POJEDINAČNA OPCIJA DODIRNUTA ILI OZNAČENA/HOVER */
:deep(.training-types-popup .q-item:hover) {
    background: #52677D;
    color:#FFFFFF; /*bijeli tekst kada je opcija označena */
}

/*KONTEJNER ZA POPIS VJEŽBI */
.exercises-container{
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 16px;
    padding: 16px;
    box-sizing: border-box;
    margin-bottom: 20px;
}
/*LABELA ODRAĐENE VJEŽBE */
.exercises-label{
  color: #BDC4D4;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 14px;
}
/*CHECKBOX POLJE ZA ODABIR VJEŽBI */
.exercises-checkboxes{
    /*grid omogućuje da se checkbox-ovi automatski rasporede u 1 ili 2 stupca oviso o dostupnoj širini --> na užim ekranima bit će 1 stupac, a kad ima više širine dva stupca */
    display: grid;
    /*minimalna širina jednog stupca je 220px, ako nema dosta mjesta za dva takva stupca grid automatski koristi jedan stupac */
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px 12px; /* razmak između stupca i redaka */
    width: 100%; /*širina checkbox kontejnera */
}
/*POJEDINAČNI CHECKBOX */
.exercise-checkbox{
    /*omogućuje da naziv vježbe zauzme raspoloživu širinu */
    min-width: 0;
    padding: 4px;
}
/*prijelom naziva vježbe ako naziv stvarno ne stane */
:deep(.exercise-checkbox .q-checkbox__label) {
  white-space: normal;   /* Omogućuje prijelom dugog naziva vježbe */
  line-height: 1.3;
}
.exercises-empty{
  color:#BDC4D4;
  font-size: 14px;
  line-height: 1.4;
  padding: 8px 0;
}

/*GUMB SPREMI KOMPLETAN TRENING */
.buttons-container{
  flex-shrink: 0;
  padding: 8px 12px 12px;
  box-sizing: border-box;
}
.save-button{
  width: 100%;
  height:52px;
  font-size:18px;
}

</style>