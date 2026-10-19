<!-- EKRAN ZA DETALJE KLIJENTA -->

<template>
    <!--cijeli sadržaj ekrana detalja klijenta. 
    Visina 100% omogućavat će da ekran koristi prostor između glavnog headera i donje navigacije-->
    <q-page class="client-details-page">
        <!-- glavni kontejner ekrana - zaglavlje je fiksno, sredina je scrollabilna kao i kod addclientpage -->
        <div class="client-details-content">
            <!-- HEADER EKRANA -->
             <div class="page-header">
                <div class="page-title"> DETALJI KLIJENTA </div>
                <q-btn
                    flat
                    dense
                    icon="close"
                    aria-label="Zatvori"
                    class="close-button"
                    @click="closePage"
                />
            </div>

            <!-- SREDINA KOJA SE SCROLLA -->
             <div class="page-scroll-area" >
                <!-- TAB-OVI -->
                 <div class="tabs-scroll-container">
                    <!-- svaki tab je poseban gumb radi označavanja trenutno aktivnog tab-a -->
                    <button
                        type="button"
                        class="client-tab"
                        :class="{'client-tab-active': activeTab === 'treninzi' }"
                        @click="activeTab = 'treninzi' "
                        > Treninzi 
                    </button>
                        
                    <button
                        type="button"
                        class="client-tab"
                        :class="{ 'client-tab-active': activeTab === 'mjerenja' }"
                        @click="activeTab = 'mjerenja'"
                        > Mjerenja
                    </button>

                     <button
                        type="button"
                        class="client-tab"
                        :class="{ 'client-tab-active': activeTab === 'testovi' }"
                        @click="activeTab = 'testovi'"
                        > Testovi
                    </button>

                    <button
                        type="button"
                        class="client-tab"
                        :class="{ 'client-tab-active': activeTab === 'zdravstveno' }"
                        @click="activeTab = 'zdravstveno'"
                        > ZD stanje
                    </button>

                    <button
                        type="button"
                        class="client-tab"
                        :class="{ 'client-tab-active': activeTab === 'krvnaSlika' }"
                        @click="activeTab = 'krvnaSlika'"
                        > K slika
                    </button>

                    <button
                        type="button"
                        class="client-tab"
                        :class="{ 'client-tab-active': activeTab === 'prehrana' }"
                        @click="activeTab = 'prehrana'"
                        > Prehrana
                    </button>
                </div>

                <!-- UČITAVANJE KLIJENTA-->
                <div v-if="loadingClient" class="loading-container" >
                    <!-- Quasar spinner koji se prikazuje dok se dohvaća klijent -->
                     <q-spinner color="primary" size="40px" />
                     <div class="loading-text"> Učitavanje podataka o klijentu... </div>
                </div>

                <!-- PODACI O KLIJENTU -->
                 <template v-else-if="client">
                    <!--glavni obrubljeni kontejner s podacima klijenta -->
                    <div class="client-main-container">
                        <div class="client-status-row">
                            <div class="client-status">
                                <!--točka mijenja boju ovisno o tome je li klijent aktivan -->
                                <span class="status-dot" :class="client.active ? 'active' : 'inactive'" > </span>
                                <!--tekst status klijenta -->
                                <span class="status-text"> {{ client.active ? 'AKTIVAN' : 'NEAKTIVAN' }} </span>
                            </div>
                            <!-- desni dio s akcijama uređivanje/brisanje -->
                             <div class="client-actions">
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="edit"
                                    aria-label="Uredi klijenta"
                                    class="action-button"
                                    @click="editClient" 
                                />
                                <q-btn
                                    flat
                                    round
                                    dense
                                    icon="delete"
                                    aria-label="Obriši klijenta"
                                    class="action-button delete-action"
                                    @click="confirmDeleteClient"
                                />
                             </div>
                        </div>
                        <!-- OSNOVNI PODACI -->
                         <div class="client-info-container">
                            <div class="client-identity">
                                <div class="client-icon-container">
                                    <q-icon
                                        name="person"
                                        size="32px"                                        
                                    />
                                </div>
                                <div class="client-basic-text">
                                    <div class="client-name">
                                        {{ client.firstName }} {{ client.lastName }}
                                    </div>
                                    <div class="client-detail">
                                        {{ client.gender || 'Spol nije naveden'  }}
                                    </div>
                                    <div class="client-detail">
                                        {{ client.contact ||'Kontakt nije naveden' }}
                                    </div>
                                </div>
                            </div>

                            <div class="client-measurements">
                                <div class="measurement-item">
                                    <div class="measurement-label"> Visina </div>
                                    <div class="measurement-value" > {{client.height }} cm </div>
                                </div>
                                <div class="measurment-item">
                                    <div class="measurement-label"> Težina </div>
                                    <div class="measurement-value"> {{ client.startingWeight }} kg </div>
                                </div>
                            </div>
                         </div>

                         <div class="client-extra-container">
                            <div class="extra-row inline-row">
                                <span class="extra-label">Fitness iskustvo: </span>
                                <span class="extra-value">{{ client.experience || 'Fitness iskustvo nije navedeno'}} </span>
                            </div>
                            <div class="extra-row">
                                <div class="extra-label">Napomena: </div>
                                <div class="extra-value">{{ client.note || 'Napomena nije navedena' }}</div>
                            </div>

                            <!-- vizualna razdjeljna linija -->
                             <div class="section-separator"></div>
                             <div class="extra-row inline-row">
                                <span class="extra-label"> Cilj: </span>
                                <span class="extra-value"> {{ clientGoal ? clientGoal.name : 'Cilj nije dodijeljen' }} </span>
                             </div>
                             <div class="extra-row">
                                <div class="extra-label"> Opis cilja: </div>
                                <div class="extra-value"> {{ clientGoal ? clientGoal.description || 'Opis cilja nije naveden' : 'Opis cilja nije dostupan' }} </div>
                             </div>
                         </div>

                    </div>

                    <!-- TAB TRENINZI -->
                     <template v-if="activeTab === 'treninzi' ">
                        <div class="add-training-container">
                            <q-btn 
                                unelevated
                                rounded
                                class="add-training-button"
                                icon="add"
                                label="DODAJ TRENING"
                                @click="addTraining"
                            />
                        </div>

                        <!-- PROSJEK OCJENA VRSTE TRENINGA -->
                         <div class="training-statistics-container"> 
                            <div class="statistics-title">PROSJEK OCJENA VRSTE TRENINGA </div>
                            
                            <!--Odabir vrste treninga dropdown menu -->
                            <div class="training-select">

                                <!-- Fiksna labela koja ostaje u istom retku s vrijednošću. -->
                                 <span class="training-select-label"> Vrsta treninga: </span>
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
                                    class="training-select-control"
                                />
                            </div>

                            <div class="rating-summary-block">
                                
                                    <div class="rating-title"> <span> Prosječna ocjena: </span>
                                        <!--prosjek iz baze za odabranu vrstu treninga -->
                                        <strong>{{ averageRating.toFixed(1) }} </strong>
                                    </div>
                                  <!--  <div class="rating-progress-text"> {{ averageRating.toFixed(1) }} / 5 </div> -->
                                
                                    <div class="rating-stars">
                                        <q-icon 
                                            v-for="star in 5"
                                            :key="star"
                                            name="star"
                                            size="20px"
                                            :class="getStarClass(averageRating, star)"
                                        />
                                    </div>
                                 </div>

                                <div class="progress-title"> Napredak: </div>
                                <!--progress bar prosječne ocjene // bar i postotak u istom redu -->
                                <div class="progress-row">
                                    <!--progress bar -->
                                    <q-linear-progress 
                                        :value="ratingProgress"
                                        rounded
                                        size="10px"
                                        color="primary"
                                        track-color="grey-8"
                                        class="progress-bar"
                                    />
                                    <!-- prostotak - prosječne ocjene od max ocjene 5-->
                                    <span class="progress-percent"> {{ ratingPercent }}% </span>
                                </div>
                           
                            <!-- razdjelna linija -->
                             <div class="section-separator"></div>

                             <!-- GRAFIKON -->
                              <div class="statistics-title">OCJENE TRENINGA KROZ VRIJEME </div>
                              <!-- FILTRI VREMENSKOG RAZDOBLJA PRIKAZA OCJENA TRENINGA -->
                               <div class="chart-period-filters">
                                  <!--pojedinačni filter vremenskog razdoblja -->
                                  <button 
                                    v-for="period in ratingPeriods"
                                    :key="period.id"
                                    type="button"
                                    class="chart-period-filter"
                                    :class="{'chart-period-filter-active' : selectedRatingPeriod === period.id}"
                                    @click="selectedRatingPeriod = period.id"
                                  > {{ period.label }}
                                  </button>
                               </div>
                                <!-- PROSTOR GRAFIKONA  -->
                                    <div v-if="filteredRatingHistory.length > 0" class="chart-container">
                                      <RatingLineChart :data="filteredRatingHistory" :period="selectedRatingPeriod" />
                                    </div>
                                    <div v-else class="chart-placeholder-empty-text"> NEMA PODATAKA ZA ODABRANO RAZDOBLJE </div>
                            </div>

                            <!-- DETALJI TRENINGA -->
                             <div class="training-history-container">
                                <div class="statistics-title"> POSLJEDNJI TRENINZI  </div>
                                <!-- ako nema treninga za klijenta na keranu se prikazuje naveden tekst -->
                                <div v-if="trainings.length === 0" class="empty-trainings"> Za ovog klijenta još nema spremljenih treninga </div>
                                <!--ako nema treninga za klijenta za odabranu vrstu treninga na ekranu se prikazuje informativna poruka -->
                                <div v-else-if="visibleTrainings.length === 0" class="empty-trainings"> Za odabranu vrstu treninga nema spremljenih treninga </div>
                                
                                <!-- prikaz kartice treninga -->
                                 <div
                                    v-for="training in visibleTrainings"
                                    :key="training.id"
                                    class="training-card"
                                >
                                <div class="training-card-header">
                                    <div class="training-card-title" >DETALJI TRENINGA </div>
                                    <q-btn 
                                        flat
                                        round
                                        dense
                                        icon="delete"
                                        aria-label="Obriši trening"
                                        class="delete-training-button"
                                        @click="deleteTraining(training)"
                                        
                                    />
                                </div> 
                                <div class="training-row">
                                    <span class="training-label" >Datum treninga: </span>
                                    <span class="training-value"> {{ training.date }}</span>
                                </div>
                                <div class="training-row training-rating-row">
                                    <span class="training-label"> Ocjena treninga: </span>
                                    <span class="training-rating-number">    {{ training.rating.toFixed(1) }} </span>
                                      <div class="training-rating"> 
                                        <q-icon 
                                              v-for="star in 5"
                                              :key="star"
                                              name="star"
                                              size="20px"
                                              :class="getStarClass(training.rating, star)"
                                          />
                                      </div>
                                </div>

                                <div class="training-row">
                                    <div class="training-label"> Bilješka treninga: </div>
                                    <div class="training-note-box">{{ training.note || 'Bilješka treninga nije navedena' }} </div>
                                </div>

                                <div class="training-row">
                                    <span class="training-label"> Vrsta treninga: </span>
                                    <span class="training-value"> {{ training.trainingType }} </span>
                                </div>

                                <div class="training-row">
                                    <div class="training-label"> Odrađene vježbe: </div>
                                    <div class="exercise-list"> 
                                        <div
                                            v-for="exercise in training.exercises"
                                            :key="exercise.id"
                                            class="exercise-item"
                                            > {{exercise.name}}  
                                        </div>                  
                                    </div>
                                </div>
                                    
                             </div>

                             <!-- gumb prikaži više kod popisa detalja treninga prikazat će se kad postoji više od 5 treninga -->
                              <div 
                                v-if="visibleTrainingCount < filteredTrainings.length"
                                class="show-more-container"                              
                              >
                              <!-- svaki klik na prikaži više dodaje max još 5 zapisa po kliku na gumb-->
                              <q-btn
                                flat
                                rounded
                                class="show-more-button"
                                label="Prikaži više"
                                @click="showMoreTrainings" 
                              />
                              </div>
                        </div>

                     </template>

                     <!-- TAB MJERENJA: -->
                      <template v-else-if="activeTab === 'mjerenja'">
                        <ClientMeasurementsTab v-if="client" :client="client" />
                      </template>

                     <!--OSTALI TABOVI -->
                     <template v-else>
                        <!-- privremeni sadržaj ostalih tabova Kasnije se povezuje sa odgovarajućim tablicama i servisima -->
                         <div class="coming-soon-container">
                            <div class="coming-soon-title"> {{ activeTabLabel }} </div>
                            <div class="coming-soon-text" >SADRŽAJ OVOG TAB-A BIT ĆE IMPLEMENTIRAN KASNIJE </div>
                         </div>
                     </template>

                 </template>

                 <!-- AKO KLIJENT NIJE PRONAĐEN -->
                  <div v-else class="empty-state"> Klijent nije pronađen </div>

            </div>

        </div>
    
    </q-page>

</template>

<script setup>

//import computed funkcije za izvedene reaktivne vrijednosti
import {computed, onMounted, ref, watch} from 'vue'
//uvoz useRoute za čitanje ID-ja klijenta iz URL-a
import {useRoute, useRouter } from 'vue-router'
//dohvat trenutne router instance
const router = useRouter()
//dohvat trenutne route instance
const route = useRoute()

//uvoz quasar notify funkcije za prikaz poruka
import {Notify } from 'quasar'

//uvoz servisa za rad s klijentima
import clientService from '@/services/client.service'
//uvoz instance servisa za vrste treninga
import trainingTypeService from '@/services/training-type.service'
// Uvoz servisa za podatke o treninzima.
import trainingService from '@/services/training.service'
//uvoz pinia store za trenutno prijavljenog trenera
import {useAuthStore} from '@/stores/auth.store'
//dohvat auth store instance
const authStore = useAuthStore()
// Komponenta za prikaz mjerenja odabranog klijenta
import ClientMeasurementsTab from '@/components/ClientMeasurementsTab.vue'

//uvoz komponente za linijski grafikon ocjena kroz vrijeme
import RatingLineChart from '@/components/RatingLineChart.vue'

//OSNOVNE REAKTIVNE VARIJABLE:

//trenutno otvoren tab
const activeTab = ref( route.query.tab === 'mjerenja' ? 'mjerenja' : 'treninzi')
//podaci trenutno otvorenog klijenta
const client = ref(null)
//cilj trenutno otvorenog klijenta
const clientGoal = ref(null)
//označava traje li učitavanje klijenta
const loadingClient = ref(false)
//označava traje li učitavanje vrste treninga
const loadingTrainingTypes = ref(false)
//popis svih vrsta treninga iz baze
const trainingTypes = ref([])
//ID trenutno odabrane vrste treninga
const selectedTrainingType = ref(null)
//prosječna ocjena trenutno odabrane vrste treninga // za sada nema podataka jer trainingService nije napravljen
const averageRating = ref(0)
//popis ocjena treninga kroz vrijeme za odabranu vrstu treninga
const ratingHistory = ref([])
//filteri -->trenutno odabrano vremensko razdoblje grafikona
const selectedRatingPeriod = ref('1m')
//filteri - dostupna vremenska razdoblja grafikona
const ratingPeriods = [{id: '1m', label: '1 MJ'}, {id:'6m', label:'6 MJ'}, {id:'1y', label:'1 GOD'}, {id:'all', label:'SVE'}]
//popis svih treninga //za sada preazna jer trainingService nije implementiran
const trainings = ref([])
//broj treninga koji se trenutno prikazuje
const visibleTrainingCount = ref(5)

//IZGLED ZVJEZDICA PREMA OCJENI -->PR. AKO JE OCJENA 4.5 ČETIRI ZVJEZDICE SU ISPUNJENE I PETAK JE POLUISPUNJENA, UMJESTO DA BUDU SAMO 4 PUNE I 5. PRAZNA
function getStarClass(rating, star) {
  const numericRating = Number(rating) || 0
  //puna zvjezdica
  if(star <= Math.floor(numericRating)) {
    return 'star-filled'
  } //if zagrada
  //polupopunjena zvjezdica kod decimalne ocjene
  if(star === Math.ceil(numericRating) && numericRating % 1 !== 0) {
    return 'star-half'
  } //if zagrada
  //prazna zvjezdica
  return 'star-empty'
} //function getStarClass zagrada

//IZVEDENE VRIJEDNOSTI:

//pretvaranje prosječne ocjene iz raspona od 0-5 u raspon od 0-1 koji koristi progress komponenta
const ratingProgress = computed(() => {
    //ako nema ocjene, progress je 0
    if(averageRating.value <= 0) {
        return 0
    } //if zagrada

    //prosječnu ocjenu dijelimo s max ocjenom 5
    return Math.min(Math.max(averageRating.value /5, 0), 1) //,1 osigurava da napredak ne prelazi 100%
}) //const ratingProgress zagrada

//pretvorba napretka u cijeli postotak
const ratingPercent = computed(() => {
    //zaokruživanje postotka na cijeli broj
    return Math.round(ratingProgress.value * 100)
}) //ratingPercent zagrada

//PRIKAZ POPISA TRENINGA FILTRIRANIH PREMA ODABRANOJ VRSTI TRENINGA
const filteredTrainings = computed(() => {
   //ako nema odabrane vrste treninga ne prikazuje se niti jedan trening
   if(!selectedTrainingType.value) {
      return[]
   } //if zagrada

   //iz svih treninga klijenta izdavajaju se samo oni koji pripadaju trenutno odabranoj vrsti treninga --samo one koji imaju isti ID vrste treninga kao dropdown
   return trainings.value.filter(training => 
      //traži se vrsta treninga
      //{ const trainingType = trainingTypes.value.find(type => type.id === selectedTrainingType.value)
      Number(training.trainingTypeId) === Number(selectedTrainingType.value))   //Number radi izbjegavanja problema ako SQLite vrati broj a quasar ili route query parametar privremeno da string
}) //const filteredTrainings zagrada
//POPIS TRENINGA KOJI SU TRENUTNO VIDLJIVI
const visibleTrainings = computed(() => {
  //iz filtriranih treninga uzima se samo prvih n -->vrijednost n je vrijednost visibleTrainingCount
  return filteredTrainings.value.slice(0, visibleTrainingCount.value)
}) //const visibleTrainings zagrada

//tekst trenutno aktivnog tab-a
const activeTabLabel = computed(() => {
    //pr. ako je otvoren tab treninzi onda se prikazuje values za treninge, ako je za mjerenja onda mjerenja itd.
    if(activeTab.value === 'treninzi') {
        return 'Treninzi'
    } //if zagrada
    if(activeTab.value === 'mjerenja') {
        return 'Mjerenja'
    } //if zagrada
    if(activeTab.value === 'testovi') {
        return 'Testovi'
    }//if zagrada
    if(activeTab.value === 'zdravstveno') {
        return 'ZD stanje'
    }//if zagrada
    if(activeTab.value === 'krvnaSlika') {
        return 'K slika'
    }//if zagrada
    //u suprotnom je odabrana prehrana
    return 'Prehrana'

}) //const activeTabLabel zagrada

//ZATVARANJE EKRANA:
//funkcija za povrat na prethodni ekran
function closePage() {
    //vraća trenera na prethodnu rutu
    router.back()
} //function closePage zagrada

//DOHVAT KLIJENTA:
//funkcija koja dohvaća podatke o klijentu iz sqlite baze
async function loadClient() {
    //provjera postoji li ID trenutno prijavljenog trenera
    if(!authStore.trainerId) {
        //ako trener nije prijavljen vraća ga se na ekran za prijavu
        router.push('/login')
        //prekid funkcije 
        return
    } //if zagrada

    //dohvat ID klijenta iz URL-a
    const clientId = Number(route.params.id)
    //provjera je li ID valjan broj
    if(!Number.isInteger(clientId) || clientId <= 0) {
        Notify.create({
            message: 'ID klijenta nije valjan',
            type:'negative',
            position: 'top'
        }) //notify create zagrada
        //vraćanje na prethodni ekran
        router.back()
        //prekid funkcije 
        return
    }//if zagrada

    //uključivanje loading stanja
    loadingClient.value = true

    //pokušaj dohvata klijenta
    try{
        //dohvat klijenta iz clientService
        client.value = await clientService.getClientById(clientId, authStore.trainerId)
        
        //ako klijent nije pronađen javlja se poruka
        if(!client.value) {
            Notify.create({
                message:'Klijent nije pronađen',
                type:'negative',
                position:'top'
            }) //notify zagrada
            //povratak na prethodni ekran
            router.back()
            //prekid funkcije
            return
        } //if zagrada

        //nakon uspješnog dohvaćanja klijenta dohvaćanjamo njegov cilj
      // clientGoal.value = await clientService.getClientGoal(clientId, authStore.trainerId)
    
    } //try zagrada
    catch(error) {
        console.error('Greška pri dohvaćanju detalja klijenta', error)
        
        Notify.create({
            message:'Greška pri dohvaćanju detalja klijenta',
            type:'negative',
            position:'top'
        }) //notify zagrada
    } //catch zagrada
    finally {
        //isključivanje loading stanja bez obzira na ishod
        loadingClient.value = false
    } //finally zagrada

    //dohvat cilja klijenta odvojeno
    try{
        //dohvat cilja klijenta
        clientGoal.value = await clientService.getClientGoal(clientId, authStore.trainerId)
    } //try zagrada
    catch(error){
        console.error('Greška pri dohvatu cilja klijenta: ', error)

        //ako cilj ne uspije, ostavlja ga se kao null
        clientGoal.value = null

        Notify.create({
            message: 'Greška pri dohvatu cilja klijenta',
            type: 'negative',
            position:'top'
        }) //notify zagrada
    } //catch zagrada    

} //function loadClient

//FUNKCIJA ZA DOHVAT VRSTE TRENINGA
async function loadTrainingTypes() {
    //uključivanje loading stanja
    loadingTrainingTypes.value = true

    //pokušaj pri dohvaćivanju vrsta treninga
    try{
        //poziv servisa
        trainingTypes.value = await trainingTypeService.getTrainingTypes()

        //provjera postoji li barem jedna vrsta treninga
        if(trainingTypes.value.length > 0) {
            //sprema se ID prve vrste treninga -->nema dijela automatskog mijenjanja na vrstu treninga koju je trener unio kod spremanja treninga - to je dodano ispod, ovo je dodano u else
            //selectedTrainingType.value=trainingTypes.value[0].id

            //uzimanje trainingTypeId koji je poslan iz AddTrainingPage.vue -->vrijednost iz URL-a dolazi kao tekst pa se pretvara kao broj
            const returnedTrainingTypeId = Number(route.query.trainingTypeId)
            //provjera postoji li u dohvaćenim vrstama treninga ta vrsta treninga koja je poslana nakon spremanja treninga
            const returnedTrainingTypeExists = trainingTypes.value.some(type => type.id === returnedTrainingTypeId)
            //ako je ID ispravan i ta vrsta treninga postoji nju se postavlja kao trenutno odabranu u dropdown meniju na ovom ekranu detalja klijenta
            if(Number.isInteger(returnedTrainingTypeId) && returnedTrainingTypeExists) {
              //dropdown automatski prikazuje spremljenu vrstu treninga kod unosa novog treninga
              selectedTrainingType.value = returnedTrainingTypeId
            } //if zagrada
            else {
              //ako nema ID iz ADDTRAININGPAGE.VUE ili taj ID ne postoji, automatski se odabire prva vrsta treninga 
              selectedTrainingType.value = trainingTypes.value[0].id
            } //else zagrada

        } //if zagrada
    } //try zagrada
    catch(error){
        console.error('Greška pri dohvatu vrste treninga: ', error)
        Notify.create({
            message: 'Greška pri dohvatu vrste treninga',
            type:'negative',
            position:'top'
        }) //notify zagrada
    } //catch zagrada
    finally {
        //isključivanje loading stanja bez obzira na ishod
        loadingTrainingTypes.value = false
    } //finally zagrada

} //function loadTrainingTypes zagrada

//dohvat naziva trenutno odabrane vrste treninga u dropdown meniju
const selectedTrainingTypeName = computed(() => {
    //pronalazak objekta vrste treninga prema ID-u
    const selected = trainingTypes.value.find(
        type => type.id === selectedTrainingType.value
    ) //const selected zagrada

    //ako nema odabrane vrste treninga, prikazuje se prazan tekst
    if(!selected) {
        return ''
    } //if zagrada
    //naziv prikazujemo velikim slovima
    return selected.name.toUpperCase()

}) //const selectedTrainingTypeName zagrada

//DOHVAT PROSJEČNE OCJENE ZA TRENUTNO ODABRANU VRSTU TRENINGA
async function loadAverageRating() {
    //ako nije odabrana vrsta treninga, nema dohvata prema bazi - nema slanja upita prema bazi jer nema smisla
    if(!selectedTrainingType.value || !client.value) {
        averageRating.value = 0
        return
    } //if zagrada

    try {
        //dohvat prosjeka iz baze za odabranog klijenta i odabranu vrstu treninga
        averageRating.value = await trainingService.getAverageRating( client.value.id, selectedTrainingType.value)
    } //try zagrada
    catch(error) {
        console.error('Greška pri dohvatu prosječne ocjene: ', error)

        //ako dohvat ne uspje, prikazuje se 0
        averageRating.value = 0

        Notify.create({
            message: 'Grepka pri dohvatu prosječne ocjene',
            type: 'negative',
            position: 'top'
        }) //notify zagrada

    }//catch zagrada

}//loadAverageRating zagrada
//FUNKCIJA ZA DOHVAT OCJENA TRENINGA KROZ VRIJEME (ZA GRAFIKON)
async function loadRatingHistory() {
   // Ako nije odabrana vrsta treninga ili klijent nije učitan, grafikon nema podatke
    if(!selectedTrainingType.value || !client.value) {
        ratingHistory.value = []
        return
    } //if zagrada
    try {
        console.log('RATING HISTORY:', ratingHistory.value)
        // Dohvat svih ocjena za odabranog klijenta i odabranu vrstu treninga
        ratingHistory.value = await trainingService.getRatingHistory(
            client.value.id,
            selectedTrainingType.value
        ) //ratingHistory zagrada
    } //try zagrada
    catch(error) {
        console.error('Greška pri dohvatu povijesti ocjena: ', error)
        // Ako dohvat ne uspije, grafikon ostaje bez podataka
        ratingHistory.value = []
        Notify.create({
            message: 'Greška pri dohvatu ocjena treninga kroz vrijeme',
            type: 'negative',
            position: 'top'
        }) //Notify zagrada
    } //catch zagrada  
} //loadRatingHistory zagrada
//watch za promjenu vrste treninga --> kada trener promijeni vrstu treninga, ponovno se dohvaća prosjek iz baze
watch(selectedTrainingType, async () => {
  //vraća se prikaz na prvih 5 treninga kad se odabere nova vrsta treninga u padajućem izborniku
  visibleTrainingCount.value = 5
  //vraćanje grafikna na filter 1MJ
  selectedRatingPeriod.value = '1m'
  //ponovni dohvat prosječne ocjene za novo odabranu vrstu treninga
  await loadAverageRating()
  //ponovni dohvat povijesti ocjene treninga za novo odabranu vrstu treninga
  await loadRatingHistory()

}) //watch zagrada

//FUNKCIJA ZA ODREĐIVANJE POČETNOG DATUMA PREMA ODABRANOM VREMENSKOM RAZDOBLJU (GRAFIKON)
function getRatingPeriodStartDate(period){
  //dohvat današnjeg datuma
  const today = new Date()
  //postavljanje vremena na početak dana
  today.setHours(0,0,0,0)

  //ako je odabrano posljednjih mjesec dana
  if(period === '1m'){
    //vraćanje datuma mjesec dana unatrag
    const startDate = new Date(today) 
    startDate.setMonth(startDate.getMonth() -1 )
    return startDate
  } //if zagrada
  //ako je odabrano posljednjih 6 mjeseci
  if(period === '6m') {
    //vraćanje datuma 6 mjeseci unatrag
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() -6 )
    return startDate
  } //if zagrada
  //ako je odabrana godina dana
  if(period === '1y') {
    //vraćanje datuma lito dan unatrag
    const startDate = new Date(today)
    startDate.setFullYear(startDate.getFullYear() -1)
    return startDate
  } //if zagrada
  //za opciju SVE nema početnog ograničenja
  return null
} //getRatingPeriodStartDate zagrada

//OCJENE KOJE PRIPADAJU TRENUTNO ODABRANOM VREMENSKOM RAZDOBLJU NA GRAFIKONU
const filteredRatingHistory = computed(() => {
  //ako nema podataka iz baze, vraća se prazna lista
  if(ratingHistory.value.length === 0){return []}
  //ako je odabrano razdoblje sve, vraćaju je svi dohvaćeni pdoaci
  if(selectedRatingPeriod.value === 'all') {
    return ratingHistory.value
  } //if azgrada

  //dohvat početnog datuma odabranog razdoblja
  const startDate = getRatingPeriodStartDate(selectedRatingPeriod.value)
 
  //ako početni datum nije dostupan, vraćaju se svi podaci
  if(!startDate) {return ratingHistory.value}

  //postavljanje krajnjeg datuma na kraj današnjeg dana
  const endDate = new Date()
  endDate.setHours(23,59,59,999)

  //filtriranje zapisa prema stvarnom datumu treninga
  return ratingHistory.value.filter(training => {
    //provjera postoji li datum treninga
    if(!training.date) {return false}
    //pretvaranje datuma treninga u Date objekt
    const trainingDate = new Date(`${training.date}T00:00:00`)
    //provjera je li datum valjan
    if(Number.isNaN(trainingDate.getTime())) { return false }
    //trening mora biti unutar odabranog vremenskog razdoblja
    return trainingDate >= startDate && trainingDate <= endDate
  }) //return ratingHistory zagrada

}) //filteredRatingHistory zagrada

//FUNKCIJA DODAVANJE TRENINGA --> ODLAZAK NA EKRAN ADDTRAININGPAGE.VUE KAD SE KLIKNE NA GUMB DODAJ TRENING
function addTraining() {
  //provjera postoji li trenutno otvoren klijent
  if(!client.value) {
    return
  } //if zagrada
  //otvaranje ekrana za dodaavanje novog treninga za odabranog klijenta (tj. za klijenta koji se nalazi na ekranu detalji klijenta)
  router.push(`/dashboard/clients/${client.value.id}/training/new`)
} //function addTraining zagrada

//METODA ZA DOHVAT SVIH ZAPISA TRENINGA KLIJENTA
async function loadClientTrainings() {
    // Ako klijent nije učitan, prekid dohvata
    if (!client.value) {
        return
    } //if zagrada

    //pokušaj dohvata treninga
    try {
        // Dohvat svih treninga iz baze
        trainings.value = await trainingService.getClientTrainings(client.value.id)
        //nakon dohvata prikazuju se prvih 5 zapisa treninga (ili manje ako ih je manje od 5 u bazi) 
        visibleTrainingCount.value = 5
    } //try zagrada
    catch(error) {
        console.error('Greška pri dohvatu treninga: ', error)
        //ako dohvat ne uspje, koristi se prazna lista
        trainings.value = []
        Notify.create({
            message: 'Greška pri dohvatu zapisa detalja treninga klijenta',
            type:'negative',
            position: 'top'
        }) //Notify zagrada
    }//catch zagrada
} //loadClientTrainings zagrada

//FUNKCIJA PRIKAZA VIŠE TRENINGA
function showMoreTrainings() {

  // Dodaje se još pet vidljivih treninga.
  visibleTrainingCount.value += 5

  // ako se prođe stvarni broj filtriranih treninga (po odabranoj vrsti treninga), broj vidljiv treninga postavlja se na stvarni broj
  if (visibleTrainingCount.value > filteredTrainings.value.length) {
    // Postavljamo broj na stvarni broj treninga.
    visibleTrainingCount.value = filteredTrainings.value.length
  } //if zagrada
} //Function showMoreTrainings zagrada

//FUNKCIJA ZA BRISANJE POJEDINOG/JEDNOG ZAPISA TRENINGA
async function deleteTraining(training) {
    // Provjera postoji li trening koji želimo obrisati
    if(!training) {
        return //prekid
    } //if zagrada

    // Prikaz potvrde prije trajnog brisanja.
    const confirmed = window.confirm(
      'Jeste li sigurni da želite obrisati ovaj trening?'
    ) //const confirmed zagrada

    // Ako trener ne potvrdi brisanje, prekid funkcije
    if(!confirmed) {
        return
    } //if zagrada

    // Pokušaj brisanja treninga
    try {
        // Poziv metode servisa koja briše trening iz SQLite baze
        const deletedRows = await trainingService.deleteTraining(training.id)

        // Provjerava je li stvarno obrisan jedan zapis
        if(deletedRows === 0) {
            // Ako nije obrisan niti jedan zapis, prikazuje se poruku o grešci
            Notify.create({
                message: 'Trening nije pronađen ili nije obrisan',
                type: 'negative',
                position: 'top'
            })//notify zagrada
            // Prekid funkcije.
            return
        } //if zagrada

        // nakon brisanja zapisa treninga ponovni dohvat ostalih treninga iz baze - Time će se iz popisa treninga ukloniti obrisani trening
        await loadClientTrainings()
        // nakon brisanja zapisa treninga ponovni dohvat prosječne ocjene za trenutno odabranu vrstu treninga //time će se osvježiti: prosjek zvjezdice progress bar postotak napretka
        await loadAverageRating()
        //nakon brisanja zapisa treninga, ponovni dohvat povijesti ocjena ostalih treninga za grafikon
        await loadRatingHistory()
        
        Notify.create({
            message: 'Trening je uspješno obrisan',
            type: 'positive',
            position: 'top'
        }) //notify zagrada
    } //try zagrada
    catch(error) {
        console.error('Greška pri brisanju treninga: ', error)
        Notify.create({
            message: 'Greška pri brisanju treninga',
            type: 'negative',
            position: 'top'
        }) //notify zagrada
    } //catch zagrada
} //deleteTraining zagrada

//UREĐIVANJE KLIJENTA
function editClient() {
    //provjera postoji li učitani klijent, ako ne prekid funkcije
    if(!client.value) {
      return
    }//if zagrada
    //otvaranje ekrana za uređivanje podataka -->ID klijenta šalje se kroz URL
    router.push(`/dashboard/clients/${client.value.id}/edit`)
  } //function editClient zagrada

//FUNKCIJA KOJA BRIŠE KLIJENTA IZ BAZE
async function deleteClient() {
    //provjera ako ne postoji klijent, prekid
    if(!client.value) {
        return
    } //if zagrada
    //pokušaj brisanja
    try{
        //poziv clientService metode
        const deletedRows = await clientService.deleteClient(client.value.id, authStore.trainerId )

        //provjera je li stvarno obrisan 1 zapis
        if(deletedRows === 0) {
            //ako nije izbrisan zapis, prikaz greške
            Notify.create({
                message:'Neuspješno brisanje klijenta',
                type:'negative',
                position:'top'
            }) //notify zagrada
            //prekid 
            return
        } //if zagrada
        //poruka o uspješnom brisanju
        Notify.create({
            message:'Klijent je uspješno obrisan',
            type:'positive',
            position:'top'
        }) //notify zagrada
        //povratak na dashboard
        router.push('/dashboard')
    }//try zagrada
    catch(error) {
        console.error('Greška pri brisanju klijenta: ', error)
        Notify.create({
            message:'Greška pri brisanju klijenta',
            type:'negative',
            position:'top'
        }) //notify zagrada
    } //catch zagrada
} //function deleteClient zagrada

//Funkcija koja prikazuje POTVRDU prije brisanja klijenta
function confirmDeleteClient() {
    //native confirm dijalog koristimo privremeno
    const confirmed = window.confirm(
        'Brisanjem klijenta TRAJNO se brišu  i SVI podaci treninga, mjerenja, testova, prehrane, zd stanja, k slike i termina. \n \n Jeste li sigurni da želite nastaviti?'
    ) //Const confirmed
    //ako korisnik nije potvrdio, prekida se funkcija
    if(!confirmed) {
        return
    }//if zagrada
    //ako je korisnik potvrdio, pokreće se stvarno brisanje
    deleteClient()
} //function confirmDeleteClient zagrada

//UČITAVANJE/DOHVAT PODATAKA PRI OTVARANJU EKRANA
// onMounted se izvršava kada se komponenta učita.
onMounted(async () => {
  // Prvo dohvat stvarnih podataka klijenta jer sve ostalo dolazi nakon toga
  await loadClient()

  //ako je klijent uspješno dohvaćen, dohvaćaju se vrste treninga
  if(client.value) {
    // Dohvat vrsta treninga iz baze.
    await loadTrainingTypes()
    //nakon dohvata klijenta i vrsta treninga, dohvat prosječne ocjene za početno odabranu vrstu treninga 
    await loadAverageRating()
    //dohvat ocjena kroz vrijeme za početno odabranu vrstu treninga
    await loadRatingHistory()

    //nakon što postoji klijent i odabrana je vrsta treninga, dohvaćaju se njegovi treninzi
    await loadClientTrainings()
  } //if zagrada
}) //onMounted zagrada

</script>

<style scoped>

/* CIJELI EKRAN  */
.client-details-page {
  height: 100%;  /* Stranica zauzima raspoloživu visinu između headera i footera. */
  background: var(--q-dark-page);
}
/* GLAVNI KONTEJNER   */
.client-details-content {
  width: 100%;                /* Zauzima cijelu dostupnu širinu. */
  height: 100%;               /* Zauzima cijelu dostupnu visinu. */
  display: flex;             /* odvojanje header i scroll područja */
  flex-direction: column;    /* Elementi se slažu jedan ispod drugog */
  box-sizing: border-box;   /* Padding i širina računaju se unutar elementa */
}
/* HEADER EKRANA   */
.page-header {
  flex-shrink: 0;                 /* Header se ne smije smanjivati kada sadržaj raste. */
  height: 58px;                  /* Visina internog naslova stranice. */
  display: flex;                /* Elementi se vertikalno centriraju. */
  align-items: center;         /* Vertikalno centriranje. */
  justify-content: center;    /* Naslov ide u sredinu. */
  padding: 0 12px;           /* Unutarnji horizontalni razmak. */
  position: relative;       /* Omogućuje apsolutno pozicioniranje X gumba. */
}
/* Naslov DETALJI KLIJENTA */
.page-title {
  color: #BDC4D4;
  font-size: 21px;
  font-weight: 600;
  text-align: center;
}
/* Gumb za zatvaranje ekrana */
.close-button {
  position: absolute;    /* Pozicioniramo ga desno od naslova. */
  right: 12px;         /* Razmak od desnog ruba. */ 
  color: #BDC4D4;
  padding: 0;        /* Uklanjanje paddinga. */
  min-width: 0;      /* Minimalna širina. */
}

/* SCROLL PODRUČJE   */
.page-scroll-area {
  flex: 1;                      /* Sredina zauzima sav preostali prostor. */
  overflow-y: auto;            /* Omogućuje vertikalni scroll. */
  overflow-x: hidden;         /* Sprječava horizontalni scroll cijele stranice. */
  padding: 12px 16px 28px;   /* Unutarnji razmak. */
  box-sizing: border-box;   /* box model. */
}

/* TABOVI  */
.tabs-scroll-container {
  display: flex;          /* Tabovi su poredani horizontalno. */
  flex-wrap: nowrap;      /* Tabovi se ne smiju prebacivati u novi red. */
  overflow-x: auto;       /* Ako ih ima više nego što stane, omogućujemo horizontalni scroll. */
  gap: 8px;                /* Razmak između tabova. */
  margin-bottom: 16px;     /* Razmak ispod tabova. */
  padding-bottom: 4px;    /* Razmak unutar reda. */
}
/* Pojedinačni tab. */
.client-tab {
  flex: 0 0 auto;        /* Tab se ne smije smanjiti na premalu širinu. */
  border: none;          /* Uklanjanje defaultnog obruba. */
  border-radius: 12px;   /* Zaobljeni rubovi. */
  padding: 10px 14px;    /* Unutarnji razmak. */
  color: #BDC4D4;
  background: rgba(189, 196, 212, 0.08);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;  /* Pokazivač prsta na mobitelu. */
}
/* Aktivni tab. */
.client-tab-active {
  background: #BDC4D4;
  color: #0F1A2B;
  font-weight: 700;
}

/* LOADING  */
.loading-container {
  display: flex;              /* Centriranje sadržaja. */
  flex-direction: column;    /* Elementi idu jedan ispod drugog. */
  align-items: center;      /* Horizontalno centriranje. */
  gap: 12px;               /* Vertikalni razmak. */
  padding: 40px 16px;    /* Unutarnji razmak. */
}
.loading-text {
  color: #BDC4D4;
  font-size: 14px;
}

/* GLAVNI KONTEJNER KLIJENTA   */
.client-main-container {
  border: 1px solid rgba(189, 196, 212, 0.45);  /* Obrub glavnog kontejnera. */
  border-radius: 16px;         /* Zaobljeni rubovi. */
  padding: 16px;               /* Unutarnji razmak. */
  box-sizing: border-box;     /* Box model. */
  margin-bottom: 40px;       /* Razmak prema prije gumba dodaj trening */
}

/* STATUS + AKCIJE  */
.client-status-row {
  display: flex;                        /* Status i akcije idu u isti red. */
  align-items: center;               /* Vertikalno centriranje. */
  justify-content: space-between;     /* Razmak između lijeve i desne strane. */
  margin-bottom: 14px;   /* Razmak ispod statusa. */
}
.client-status {
  display: flex;           /* Statusni elementi idu horizontalno. */
  align-items: center;   /* Vertikalno centriranje. */
  gap: 8px;   /* Razmak između točke i teksta. */
}
.status-dot {
  width: 10px;              /* Širina točke. */
  height: 10px;            /* Visina točke. */
  border-radius: 50%;     /* Pretvara kvadrat u krug. */
  display: inline-block;   /* Omogućuje pravilno prikazivanje točke. */
}

.status-dot.active {     /* Zelena točka aktivan */
  background: #21ba45;
}
.status-dot.inactive {   /* Crvena točka neaktivan */
  background: #c10015;
}
.status-text {
  color: #BDC4D4;
  font-size: 15px;
  font-weight: 600;
}
.client-actions {
  display: flex;  /* Akcije ikona uređivanje/brisanje idu vodoravno. */
  gap: 2px;        /* Mali razmak između ikona. */
}
.action-button {
  color: #BDC4D4;   /* Boja ikone olovčice za uređivanje klijenta */
}
.delete-action {
  color: #52677D;    /*  boja kante za smeće */
}

/** OSNOVNI PODACI KLIJENTA - KONTEJNER UNUTAR GLAVNOG KONTEJNERA */
.client-info-container {
  border: 1px solid rgba(189, 196, 212, 0.30);   /* Unutarnji obrubljeni kontejner. */
  border-radius: 12px;   /* Zaobljeni rubovi. */
  padding: 14px;   /* Unutarnji razmak. */
  display: flex;   /* Raspored lijevo/desno. */
  gap: 12px;   /* Razmak između lijeve i desne strane. */
  align-items: flex-start;   /* Elementi desne strane (sve osim visine/težine) su vertikalno centrirani. */
  box-sizing: border-box;   /* Box model. */
}
.client-identity {
  flex: 1;   /* Lijevi dio zauzima preostali prostor. */
  display: flex;   /* Unutarnji raspored ikone i teksta. */
  align-items: center;   /* Vertikalno centriranje samo ikone. */
  gap: 10px;   /* Razmak između ikone i podataka. */
  min-width: 0;   /* Sprječavanje prelijevanja teksta. */
}
.client-icon-container { /* Ikonica user-a (skroz lijeva strana ekrana) */
  flex: 0 0 20px;   /* Ikona ima fiksnu širinu. */
  display: flex;    /* Vertikalno centriranje. */
  justify-content: center;   /* Horizontalno centriranje. */
  color: #BDC4D4;
}
.client-basic-text { 
  min-width: 0;  /* Omogućuje da tekst koristi raspoloživi prostor. */
}
.client-name {
  color: #BDC4D4;
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 6px;  /* Razmak ispod imena. */
}
.client-detail {
  color: rgba(189, 196, 212, 0.82);
  font-size: 13px;
  margin-top: 3px;          /* Razmak između podataka. */
  overflow-wrap: anywhere;  /* Omogućuje lomljenje dugog kontakta. */
}
.client-measurements { /*VISINA I ŠIRINA -- PROSTOR */
  flex: 0 0 55px;   /* Desna strana ima fiksnu širinu. */
  display: flex;            /* Elementi se slažu vertikalno --> Visina i težina slažu se jedna ispod druge */
  flex-direction: column;   /* Vertikalni raspored. */
  gap: 12px;               /* Razmak između visine i težine. */
  text-align: left;       /* Poravnanje prema lijevoj strani. */
}
.measurement-label { /*Tekst Visina/Težina */
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
}
.measurement-value { /*Konkretna vrijednost visina/težina */
  color: #BDC4D4;
  font-size: 14px;
  line-height: 1.45;   /* Razmak između redova teksta. */
}

/* ISKUSTVO, NAPOMENA I CILJ    */
.client-extra-container {
  /* Unutarnji obrubljeni kontejner. */
  border: 1px solid rgba(189, 196, 212, 0.30);
  /* Zaobljeni rubovi. */
  border-radius: 12px;
  /* Unutarnji razmak. */
  padding: 14px;
  /* Razmak od osnovnih podataka. */
  margin-top: 12px;
}
.extra-row {
  /* Razmak ispod svakog podatka. */
  margin-bottom: 12px;
}
.inline-row{
   /* Razmak između labele i vrijednosti. */
  gap: 12px;
}
.extra-row:last-child {
  /* Zadnji element nema nepotreban donji razmak. */
  margin-bottom: 0;
}
.extra-label {      /* Labele Fitness iskustvo/napomena/cilj/opis cilja */
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
  /* Razmak ispod oznake. */
  flex-shrink: 0;   /* Labela se ne smije nepotrebno smanjivati. */
  margin-bottom: 3px;
}
.extra-value {           /*Konkretne vrijednosti iskustvo/napomena/cilj/opis cilja */
  color: #BDC4D4;
  font-size: 14px;
  line-height: 1.45;  /* Razmak između redova teksta. */
  overflow-wrap: anywhere;  /* Dugi tekst može se prelomiti. */
}

.section-separator { /*CRTA IZMEĐU SEKCIJA U KONTEJNERIMA */
  height: 1px;          /*debljina crte */
  background: rgba(189, 196, 212, 0.25); /* Boja linije. */
  margin: 14px 0;   /* Razmak iznad i ispod linije. */
}

/* DODAJ TRENING  */
.add-training-container {   
  display: flex;   /* Gumb ide desno. */
  justify-content: flex-end;  /* Poravnanje prema desnoj strani. */
  margin-bottom: 22px;  /* Razmak ispod gumba. */
}
.add-training-button {   /* DODAJ TRENING GUMB */
  background: #BDC4D4;
  color: #0F1A2B;
  font-weight: 600;
}

/* STATISTIKA TRENINGA    */
.training-statistics-container {
  border: 1px solid rgba(189, 196, 212, 0.45);  /* Obrub kontejnera */
  border-radius: 16px;    /* Zaobljeni rubovi */
  padding: 16px;    /* Unutarnji razmak */ 
  margin-bottom: 30px;   /* Razmak prema sljedećem kontejneru zapisa treninga */
  box-sizing: border-box; /*box model */
  width: 100%; /*kontejner zauzima dostupnu širinu */
  min-width: 0; /*omogućuje pravilno smanjivanje sdržaja */
  overflow: hidden; /*zbog grafikona --> ništa iz grafikona ne smije prijeći obrub statistike */
  min-height: 580px; /*minimalna visina --> da grafikon bude pregledniji */
}
.training-history-container{
     /* Glavni vidljivi obrub povijesti treninga. */
  border: 1px solid rgba(189, 196, 212, 0.45);
  /* Zaobljeni rubovi kao na ostalim glavnim kontejnerima. */
  border-radius: 16px;
  /* Unutarnji razmak. */
  padding: 16px;
  /* Box model. */
  box-sizing: border-box;
}
.statistics-title {    /* LABELE PROSJEK OCJENA VRSTE TRENINGA I OCJENE TRENINGA KROZ VRIJEME I*/
  color: #BDC4D4;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;  /* Razmak ispod naslova. */
}
.training-select{  /* DROPDOWN MENI I LABELA VRSTE TRENINGA */
  display: flex;  /* Labela i dropdown ostaju u istom retku. */
  align-items: center;   /* Vertikalno poravnanje labele i dropdowna. */
  gap: 14px; /* Razmak između labele i dropdowna. */
  margin-bottom: 20px; /* Razmak ispod cijelog reda. */
  margin-top: 20px; /*Razmak iznad sekcije label+menu i labele Prosjek ocjena vrste treninga */
  min-width: 0; /* Omogućuje da dropdown zauzme preostali prostor. */
}
.training-select-label { /*TEKST LABELE VRSTE TRENINGA KOD DROPDOWN MENU */
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;  
  flex-shrink: 0; /* Labela se ne smije smanjivati.+ zbog manjka prostora */
}
.training-select-control {
  /* QSelect zauzima sav preostali prostor desno od labele */
  flex: 1;
  min-width: 0;   /* sprječava prelijevanje dugih naziva */
  min-height: 42px; /* visina gumba */
}
/* Popup QSelecta je Quasar portal pa se mora dohvatiti preko :deep(). */
:deep(.training-type-popup) {
  /* Tamnoplava pozadina dropdown menija. */
  background: #1C2E4A;
  /* Tekst dropdown menija. */
  color: #BDC4D4;
  /* Zaobljeni rubovi. */
  border-radius: 12px;
 border: none;
 /*unutarnji prostor */
 padding: 4px 0;
}
/* Pojedinačne opcije u dropdownu. */
:deep(.training-type-popup .q-item) {
  color: #BDC4D4;
  font-size: 14px;
  border: none;
}
/* Trenutno odabrana opcija. */
:deep(.training-type-popup .q-item--active) {
 background: rgba(168, 185, 204, 0.18);
 color: #BDC4D4;
 border: none;
}
/* VIZUAL SAMOG DROPDOWN GUMBA */
:deep(.training-select-control .q-field__control) {
  background: #A8B9CC;
  border-radius: 12px;   /* Zaobljeni rubovi dropdowna. */
  border: none; /* Uklanjanje obruba */
  min-height: 42px; /* Visina dropdowna */
}
/* TEKST ODABRANE VRSTE TRENINGA */
:deep(.training-select-control .q-field__native),
:deep(.training-select-control .q-field__input) {
  color: #0F1A2B;
  font-weight: 600;
  justify-content: center; /*poravnanje teksta unutar dropdown menu */
}
/* STRELICA DROPDOWNA */
:deep(.training-select-control .q-icon) {
  color: #0F1A2B;
  margin-right: 6px;
}

.rating-summary-block { /* labela prosječna ocjena + zvjezdice */
  display: flex; /* Zvjezdice i tekst su u istom retku. */
  align-items: center;   /* Vertikalno centriranje. */
 /* justify-content: space-between; *//* Razmak između lijevog i desnog dijela. */
  gap: 30px;   /* Razmak između zvjezdica i labele (+ocjena). */
  margin-bottom: 10px;   /* Razmak ispod retka. */
}
.rating-title {  /*LABELA PROSJEČNA OCJENA */
  display: flex; /* labela i broj su u istom redu */
 /* align-items: baseline; *//*vertikalno poravnjanje teksta */
  gap: 9px; /*razmak između broja i teksta */
  color: #BDC4D4; 
  font-size: 15px;
  font-weight: 800;
}
.rating-title strong { /*BROJ DO LABELE PROSJEČNE OCJENE */
    color:#BDC4D4;
    font-size: 14px;
    font-weight: 600;
}
.rating-stars { /*ZVJEZDICE */  
  display: flex; /* Zvjezdice idu horizontalno */
  gap: 1px;   /* Razmak između zvjezdica */
  /*margin-top: 5px;  */ /* Mali razmak ispod prosjeka. */
  margin-bottom: 14px;   /* Razmak prije Napretka. */
}
.star-filled {
 /* color: #BDC4D4; /* Boja popunjene zvjezdice. */
 color: #52677D; 
}
.star-half {
  color:#52677D;
  background: linear-gradient(
    90deg,
    #52677D 50%,
    rgba(189, 196, 212, 0.22) 50%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.star-empty {
  color: rgba(189, 196, 212, 0.22);    /* Boja prazne zvjezdice. */                       
}

.progress-title{ /* LABELA NAPREDAK:  */
  color: #BDC4D4;
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 6px; /* Razmak ispod labele. */
}
.progress-row {     /*PROGRESS BAR I POSTOTAK */
  display: flex;        /* Progress i postotak su u istom retku. */
  align-items: center; /* Vertikalno poravnanje. */
  gap: 12px;          /* razmak između bara i postotka. */
}
.progress-bar {
  flex: 0.95; /* Progress bar zauzima skoro sav raspoloživi prostor. */ 
}
.progress-percent { /*POSTOTAK KOD PROGRESS BAR-A */
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;   /* Postotak se ne smije smanjivati. */
}

.chart-container{
  width: 100%; /*graf zauzima cijelu površinu prostora */
  min-width: 0; /*omogućeno skupljanje sadržaja bez širenja roditelja */
  overflow: hidden; /*sprječavanje prelijevanja izvan obruba */
}
/*FILTERI VREMENSKOG RAZDOBLJA GRAFIKONA */
.chart-period-filters{
  display: flex; /*filteri se slažu vodoravno */
  flex-wrap: nowrap; /*filteri ostaju u jednom retku */
  gap: 4px;  /*razmak između filtera */
  width: 100%; /*filteri zauzimaju dostupnu širinu */ 
  margin-bottom: 14px; /*razmak ispod filtera */ 
  margin-top: -4px; /* razmak iznad filtera */
  overflow: hidden; /* sprječavanje prelijevanja */
  padding-bottom: 2px; /* unutarnji donji prostor */
}
/*POJEDINAČNI FILTER */
.chart-period-filter{
  flex: 1; /*filter ne zauzima više prostora nego što treba */
  border: none; /*uklanjanje defaultnog obruba */
  background: transparent; /*uklanjanje defaultne pozadine */
  color: rgba(189, 196, 212, 0.55); /*boja NEaktivnog filtera */
  font-size: 12px;
  font-weight: 600;
  padding: 8px 4px; /* unutarnji razmak */
  border-radius: 8px; /*zaobljeni rubovi */
  white-space: nowrap; /*spriječavanje prijeloma teksta */
  min-height: 40px; /*minimalna visina na tap */
  transition: background-color 0.2s ease, color 0.2s ease; /* vizualna tranzicija */
}
/*AKTIVNI FILTER */
.chart-period-filter-active{
  background: rgba(189, 196, 212, 0.12);
  color:#BDC4D4;
  font-weight: 800;
}
.chart-placeholder-empty-text {
  /* Boja teksta. */
  color: rgba(189, 196, 212, 0.65);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-top: 100px;
}

/* ZADNJI TRENINZI */
.empty-trainings {  /*AKO NE POSTOJE ZAPISI O TRENINGU KLIJENTA POJAVLJUJE SE PORUKA ZA OVOG KLIJENTA JOŠ NEMA SPREMLJENIH TRENINGA */
  text-align: center; /* Centriranje poruke. */
  padding: 20px 10px; /* Unutarnji razmak. */
  color: rgba(189, 196, 212, 0.65);
  font-size: 14px;
}

/* KARTICA/KONTEJNER DETALJA TRENINGA  */
.training-card {
  /* Obrub kartice. */
  border: 1px solid rgba(189, 196, 212, 0.25);
  /* Zaobljeni rubovi. */
  border-radius: 12px;
  /* Unutarnji razmak. */
  padding: 14px;
  /* Razmak između kartica. */
  margin-bottom: 12px;
  box-sizing: border-box;
}
.training-card-header { /*NASLOV DETALJI TRENINGA + IKONA KANTE ZA SMEĆE */
  /* Naslov i brisanje su u istom retku. */
  display: flex;
  /* Vertikalno centriranje. */
  align-items: center;
  /* Razmak između naslova i gumba. */
  justify-content: space-between;
  /* Razmak ispod zaglavlja. */
  margin-bottom: 16px;
}
.training-card-title { /*NASLOV DETALJI TRENINGA */
  color: #BDC4D4;
  font-size: 16px;
  font-weight: 700;
}
.delete-training-button { /* KANTA ZA SMEĆE ZA BRISANJE ZAPISA TRENINGA (JEDNOG) */
  color: #52677D;
}
.training-row { /*DIJELI DATUM, OCJENA, BILJEŠKA TRENIGA, VJEŽBE ITD. */
  margin-bottom: 14px; /* Razmak ispod svakog retka. */
}
.training-label { /*LABELA DATUM, OCJENA, BILJEŠKA ITD. */
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 4px;   /* Razmak ispod oznake. */
}
.training-value { /*KONKRETNA VRIJEDNOST DO LABELE DATUM, OCJENA, BILJEŠKA...  */
  color: #BDC4D4;
  font-size: 14px;
}
.training-rating-row { /*ZVJEZDICE OCJENE TRENINGA */
  display: flex; /* Zvjezdice i broj ocjene su u jednom redu. */
  align-items: right; /* Vertikalno centriranje. */
  gap: 4px;   /* Razmak između zvjezdica i broja. */
}
.training-rating-number { /**KONKRETNA BROJKA OCJENE TRENINGA */
  margin-left: 4px;  /* Razmak od zadnje zvjezdice. */
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 600;
}
.training-rating { /*SAMO ZVJEZDICE U ZAPISU DETALJA TRENINGA */
  margin-left: 12px;
}

.training-note-box { /* KONKRETNA VRIJEDNOST/TEKST BILJEŠKE TRENINGA */
  border: 1px solid rgba(189, 196, 212, 0.25);  /* Obrub bilješke. */
  border-radius: 10px;    /* Zaobljeni rubovi. */
  padding: 10px;       /* Unutarnji razmak. */
  color: #BDC4D4;
  min-height: 40px;     /* Minimalna visina. */
  box-sizing: border-box;    /* Box model. */
  overflow-wrap: anywhere;    /* Omogućuje prijelom dugog teksta. */
  margin-top: 10px;          /* gornji razmak između teksta bilješke/kontejnera i labele Bilješka treninga: */
}
.exercise-list { /*KONKRETAN POPIS VJEŽBI TRENINGA */
 /* display: flex; /* Vježbe se slažu jedna ispod druge. */
 /* flex-direction: column;  /* Vertikalni raspored. */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));    /* dva stupca kada širina ekrana to dopušta */
  gap: 8px 24px;   /* Razmak između redova i stupaca */
  border: 1px solid rgba(189, 196, 212,0.25);       /*jedan glavni obrub oko svih vježbi */
  border-radius: 10px;                               /*zaobljeni rubovi obruba */
  padding: 6px;                                   /*unutarnji prostor kontejnera */
  box-sizing: border-box;
  margin-top: 10px;                    /* gornji razmak između početka liste/kontejnera i labele Odrađene vježbe: */
}
.exercise-item { /*KONKRETAN NAZIV POJEDINAČNE VJEŽBE NA POPISU VJEŽBI ZAPISA TRENINGA */
 /* border: 1px solid rgba(189, 196, 212, 0.25); /* Obrub pojedinačne vježbe. */
/*  border-radius: 10px;    /* Zaobljeni rubovi. */
 /* padding: 8px 10px;        /* Unutarnji razmak. */
  border: none;
  border-radius: 0;   /* nema zasebnih zaobljenih kutova */
  color: #BDC4D4;
  font-size: 13px;
  overflow-wrap: anywhere;   /* Omogućuje prijelom dugog teksta. */
}

.show-more-container {  /*KONTJENER GUMBA PRIKAŽI VIŠE ISPOD ZAPISA TRENINGA */
  /* Gumb centriramo. */
  display: flex;
  /* Horizontalno centriranje. */
  justify-content: center;
  /* Razmak iznad gumba. */
  margin-top: 12px;
}
.show-more-button { /* TEKST GUMBA PRIKAŽI VIŠE */
  color: #BDC4D4;
  font-weight: 600;
}

/* OSTALI TABOVI  */
.coming-soon-container {
  /* Obrub privremenog sadržaja. */
  border: 1px solid rgba(189, 196, 212, 0.45);
  /* Zaobljeni rubovi. */
  border-radius: 16px;
  /* Unutarnji razmak. */
  padding: 24px 16px;
  /* Centriranje teksta. */
  text-align: center;
}
.coming-soon-title {
  /* Boja naslova. */
  color: #BDC4D4;
  /* Veličina naslova. */
  font-size: 18px;
  /* Naglašeni tekst. */
  font-weight: 700;
  /* Razmak ispod naslova. */
  margin-bottom: 8px;
}
.coming-soon-text {
  /* Boja opisa. */
  color: rgba(189, 196, 212, 0.65);
  /* Veličina opisa. */
  font-size: 13px;
}

/* PRAZNO STANJE */
.empty-state {
  /* Centriranje teksta. */
  text-align: center;
  /* Unutarnji razmak. */
  padding: 30px 10px;
  /* Boja teksta. */
  color: rgba(189, 196, 212, 0.65);
}

</style>