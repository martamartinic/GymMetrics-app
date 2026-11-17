<!-- EKRAN ZA PRIKAZ TAB-A ZD STANJA KLIJENTA -->

<template>
    <!-- Glavni kontejner za sadržaj tab-a -->
  <div class="client-health-tab">
    <!-- gumb za dodavanje novog zd stanja klijenta -->
    <div class="add-client-health-container">
        <q-btn 
            unelevated
            rounded
            class="add-client-health-button"
            icon="add"
            label="DODAJ ZD STANJE"
            @click="addClientHealth"
        />
    </div>

    <!-- KONTEJNER ZA DROPDOWN MENI I TABLICE -->
    <div class="health-items-container">
        <!-- NASLOV UNUTAR KONTEJNERA -->
        <div class="health-items-title"> POVIJEST ZDRAVSTVENOG STANJA </div>
        <!-- DROPDOWN MENI ZA ODABIR ZDRAVSTVENOG STANJA -->
        <div class="health-items-select">
            <!-- labela padajućeg izbornika -->
            <span class="health-item-select-label"> Kategorija zd. stanja: </span>

            <!-- padajući izbornik za odabir kategorije zd stanja -->
            <q-select
                v-model="selectedHealthTypeId"
                :options="healthTypes"
                option-label="name"
                option-value="id"
                emit-value
                map-options
                dense
                rounded
                dark
                behavior="menu"
                popup-content-class="health-type-popup"
                :loading="loading"
                :disable="loading || healthTypes.length === 0"
                :display-value="selectedHealthTypeName"
                aria-label="Odabir kategorije zd stanja"
                class="health-select-control"
            />            
        </div>

        <!-- poruka za vrijeme početnog čitanja podataka -->
        <div v-if="loading" class="empty-health-items"> UČITAVANJE ZDRAVSTVENOG STANJA </div>
        
        <!-- Poruka kada za odabranu kategoriju nema podataka -->
        <div v-else-if="filteredHealthRows.length === 0" class="empty-health-items"> ZA ODABRANU KATEGORIJU NEMA PODATAKA </div>

        <!-- Kada je odabrana kategorija zd stanja prikazuju se njezina tablica -->
        <q-table
            v-else
            v-model:pagination="pagination"
            class="health-table"
            flat
            bordered
            :rows="filteredHealthRows"
            :columns="columns"
            row-key="id"
          
            separator="horizontal"
            no-data-label="ZA ODABRANU KATEGORIJU NEMA PODATAKA"
        >
            <!-- Prilagođen prikaz datuma -->
            <template #body-cell-datum="slotProps">
                <q-td :props="slotProps">
                    {{ formatDate(slotProps.row.datum) }}
                </q-td>
            </template>

            <!-- VLASTITI DONJI DIO TABLICE -->
            <template #bottom="scope">
                <div class="health-table-bottom">
                    <!-- BROJ ZAPISA PO STRANICI -->
                    <div class="health-rows-control">
                        <span class="health-rows-label"> Zapisa po stranici: </span>
                        <q-select
                            dense
                            borderless
                            emit-value
                            map-options
                            :model-value="pagination.rowsPerPage"
                            :options="rowsPerPageOptions"
                            popup-content-class="health-rows-per-page-popup"
                            class="health-rows-select"
                            aria-label="Broj zapisa po stranici"
                            behavior="menu"
                            menu-anchor="bottom left"
                            menu-self="top left"
                            @update:model-value="changeRowsPerPage"
                        />
                    </div>
                    <!-- RASPON PRIKAZANIH ZAPISA I NAVIGACIJA -->
                    <div class="health-pagination-control">
                        <!-- RASPON PRIKAZANIH ZAPISA -->
                        <span class="health-pagination-label">
                            {{
                                filteredHealthRows.length === 0
                                    ? '0-0'
                                    : (
                                        (scope.pagination.page - 1) *
                                        (scope.pagination.rowsPerPage || filteredHealthRows.length) + 1
                                    ) + '-' +
                                    Math.min(
                                        scope.pagination.page *
                                        (scope.pagination.rowsPerPage || filteredHealthRows.length),
                                        filteredHealthRows.length
                                    )
                            }}
                            od {{ filteredHealthRows.length }}
                        </span>
                        <!-- PRETHODNA STRANICA -->
                        <q-btn
                            flat
                            round
                            dense
                            size="sm"
                            icon="chevron_left"
                            aria-label="Prethodna stranica"
                            class="health-page-arrow"
                            :disable="scope.isFirstPage"
                            @click="scope.prevPage"
                        />
                        <!-- SLJEDEĆA STRANICA -->
                        <q-btn
                            flat
                            round
                            dense
                            size="sm"
                            icon="chevron_right"
                            class="health-page-arrow"
                            aria-label="Sljedeća stranica"
                            :disable="scope.isLastPage"
                            @click="scope.nextPage"
                        />
                    </div>
                </div>
            </template>

        </q-table>
    </div> <!-- <div class="health-items-container"> -->

        <!-- KONTEJNER ZA GRAFIKON TLAKA -->
    <div class="health-chart-container">
        <!-- Naslov grafikona -->
        <div class="health-chart-title"> TLAK KLIJENTA KROZ VRIJEME </div>

        <!-- Filteri vremenskog razdoblja -->
        <div class="chart-period-filters">
            <!--pojedinačni filter -->
            <button 
                v-for="period in healthPeriods"
                :key="period.id"
                type="button"
                class="chart-period-filter"
                :class="{
                    'chart-period-filter-active':
                    selectedHealthPeriod === period.id
                }"
                @click="selectedHealthPeriod = period.id"
            >
                {{ period.label }}
            </button>
        </div>

        <!-- Grafikon kad postoje zapisi tlaka u odabranom razdoblju -->
        <!-- Poruka kada nema podataka za grafikon -->
        <div v-if="filteredHealthHistory.length === 0"
            class="chart-placeholder-empty-text" >
            NEMA PODATAKA ZA ODABRANO RAZDOBLJE
        </div>
        
        <!-- kad ima podataka, prikazuje se grafikon -->
        <div
            v-else class="chart-container" >
          <HealthLineChart 
                :data="filteredHealthHistory"
                :period="selectedHealthPeriod"
            />
            
        </div>

    </div>  <!-- <div class="health-chart-container"> -->

    <!-- KONTEJNER  ZA ZAPISE TLAKA ISPOD GRAFA -->
    <div class="pressure-history-container">
        <!-- naslov povijesti -->
        <div class="pressure-title"> POSLJEDNJI ZAPISI TLAKA </div>

        <!-- poruka kada klijent nema nijedan zapis -->
        <div v-if="allPressures.length === 0 && !loading" class="empty-text">
            ZA KLIJENTA JOŠ NEMA SPREMLJENIH ZAPISA TLAKA
        </div>

        <!-- KARTICA SVAKOG POJEDINAČNOG ZAPISA -->
        <div 
            v-for="pressure in visiblePressures"
            :key="pressure.id"
            class="pressure-card"
         >
            <div class="pressure-card-title"> DETALJI TLAKA </div>

            <!-- DATUM ZAPISA -->
            <div class="pressure-row">
                <span class="pressure-label"> Datum unosa: </span>
                <span class="pressure-value">
                    {{ formatDate(pressure.healthDate) }}
                </span>
            </div>

            <!-- SISTOLIČKI TLAK -->
            <div class="pressure-row"> 
                <span class="pressure-label"> Sistolički tlak: </span>
                <span class="pressure-value">
                    {{ pressure.sistolickiTlak }}
                </span>
            </div>

            <!-- DIJASTOLIČKI TLAK -->
            <div class="pressure-row"> 
                <span class="pressure-label"> Dijastolički tlak: </span>
                <span class="pressure-value">
                    {{ pressure.dijastolickiTlak }}
                </span>
            </div>

        </div>

        <!-- GUMB PRIKAŽI VIŠE -->
        <div
            v-if="visiblePressureCount < allPressures.length"
            class="show-more-container"
          >
            <q-btn
                    flat
                    rounded
                    class="show-more-button"
                    label="PRIKAŽI VIŠE"
                    @click="showMorePressures"
                />
        </div>

    </div> <!-- <div class="pressure-history-container"> -->
  </div> <!-- <div class="client-health-tab"> -->
</template>

<script setup>

// Vue funkcije za reaktivno stanje, izračunate vrijednosti i životni ciklus
import { computed, ref, watch } from 'vue'
// Router služi za otvaranje obrasca za unos zd stanja i čitanje query parametara
import { /*useRoute,*/ useRouter } from 'vue-router'
const router = useRouter()  // Inicijalizacija routera
//const route = useRoute() // Inicijalizacija trenutačne rute

import { Notify } from 'quasar'
// Servis za čitanje i spremanje zd stanja
import healthService from '@/services/health.service'
// Komponenta linijskog grafikona
import HealthLineChart from '@/components/HealthLineChart.vue'

//ZA TABLICU:
const columns = [
    { name: 'naziv', required: true, label: 'NAZIV', field: 'naziv', align: 'left', sortable: true },
    { name: 'datum', label: 'DATUM', field: 'datum', align: 'center', sortable: true },
] //const columns zagrada
//PAGINACIJA:
const pagination = ref({
    sortBy: 'datum',
    descending: true,
    page: 1,
    rowsPerPage: 5
}) //pagination zagrada
// OPCIJE BROJA ZAPISA PO STRANICI
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: 'SVE', value: 0 }
]
// PROMJENA BROJA ZAPISA PO STRANICI
function changeRowsPerPage(value) {
    pagination.value.rowsPerPage = value
    pagination.value.page = 1
}

// Podaci klijenta stižu iz roditeljske komponente
const props = defineProps({
    // Objekt klijenta sadrži njegov ID i početnu težinu
    client: {
        type: Object,
        required: true
    }
}) // defineProps

// Reaktivne varijable za pohranu stanja komponente
const healthTypes = ref([]) // Lista kategorija zd stanja
const allHealthRows = ref([]) //svi zapisi zd stanja dohvaćeni za klijenta
const selectedHealthTypeId = ref(null) // ID odabrane kategorije
const selectedHealthPeriod = ref('1m') // trenutačni filter grafikona
const loading = ref(false) //oznaka učitavanja podataka

// Filteri dostupnih vremenskih razdoblja
const healthPeriods = [
    { id: '1m', label: '1 MJ' },
    { id: '6m', label: '6 MJ' },
    { id: '1y', label: '1 GOD' },
    { id: 'all', label: 'SVE' }
] //const healthPeriods zagrada

//DIO ZA ZAPISE DETALJA TLAKA
// Broj zapisa tlaka koji su trenutačno prikazani
const visiblePressureCount = ref(5)

// Svi zapisi koji sadrže obje vrijednosti krvnog tlaka
const allPressures = computed(() => {
    return allHealthRows.value
        .filter(health => {
            const systolic = health.sistolickiTlak
            const diastolic = health.dijastolickiTlak

            // Zapis mora sadržavati obje vrijednosti
            if (
                systolic === null ||
                systolic === undefined ||
                String(systolic).trim() === '' ||
                diastolic === null ||
                diastolic === undefined ||
                String(diastolic).trim() === ''
            ) {
                return false
            }

            // Obje vrijednosti moraju biti valjani brojevi
            return (
                Number.isFinite(Number(systolic)) &&
                Number.isFinite(Number(diastolic))
            )
        })
        // Najnoviji zapis prikazuje se prvi
        .sort((a, b) => {
            const dateDifference = String(b.healthDate).localeCompare(String(a.healthDate))

            if (dateDifference !== 0) { return dateDifference }

            // Ako su datumi jednaki, noviji ID ide prvi
            return Number(b.id) - Number(a.id)
        })
}) // allPressures

// Zapisi koji se trenutačno prikazuju u karticama
const visiblePressures = computed(() => {
    return allPressures.value.slice(0, visiblePressureCount.value)
}) // visiblePressures

// Prikaz sljedećih najviše pet zapisa
function showMorePressures() {
    visiblePressureCount.value = Math.min(
        visiblePressureCount.value + 5,
        allPressures.value.length
    )
} // showMorePressures

// FUNKCIJA ZA DOHVAT KATEGORIJA ZDRAVSTVENOG STANJA
async function loadHealthTypes() {
    // Dohvaćanje kategorija iz strukture baze
    try {
        healthTypes.value = await healthService.getHealthTypes()

        // Početno se odabire prva dostupna kategorija
        if (healthTypes.value.length > 0) {
            selectedHealthTypeId.value = healthTypes.value[0].id
        }
    } catch (error) {
        // Zapis greške za razvoj
        console.error('Greška pri čitanju kategorija zdravstvenog stanja:', error)

        // Prazan niz omogućuje siguran prikaz izbornika
        healthTypes.value = []

        // Obavijest o neuspješnom dohvaćanju kategorija
        Notify.create({
            message: 'Greška pri čitanju kategorija zdravstvenog stanja',
            type: 'negative',
            position: 'top'
        }) //notify zagrada

    } //catch zagrada

} // loadHealthTypes

//TRENUTNO ODABRANA KATEGORIJA ZD STANJA
const selectedHealthType = computed(() => {
    //traženje kategorije prema odabranom ID-u
    return healthTypes.value.find(
        type => type.id === selectedHealthTypeId.value
    ) || null
}) //selectedHealthType zagrada
//NAZIV TRENUTNO ODABRANE KATEGORIJE ZD STANJA PRIKAZUJE SE VELIKIM SLOVIMA
const selectedHealthTypeName = computed(() => {
    //vraćanje naziva odabrane kategorije
    return selectedHealthType.value 
    ? selectedHealthType.value.name.toUpperCase() 
    : ''
}) //selectedHealthTypeName zagrada

//ZAPISI TABLICE FILTRIRAJU SE PREMA ODABRANOJ KATEGORIJI
const filteredHealthRows = computed(() => {
    // Dohvaćat stupca koji odgovara odabranoj kategoriji
    const selectedField = selectedHealthType.value?.field
    // Prazan niz vraća se ako kategorija nije odabrana
    if (!selectedField) { return [] } // if

    // Zadržavaju se samo zapisi koji imaju vrijednost odabrane kategorije
    return allHealthRows.value
        .filter(health => {
            // Uklanjanje zapisa s praznom vrijednosti kategorije
            return String(health[selectedField] ?? '').trim() !== ''
        }) //filter zagrada
        .map(health => ({
            id: health.id, // ID zapisa koristi se kao jedinstveni ključ tablice
            naziv: health[selectedField], // Vrijednost odabrane kategorije prikazuje se u stupcu Naziv          
            datum: health.healthDate  // Datum zdravstvenog stanja prikazuje se u stupcu Datum
        })) //map zagrada
}) //filteredHealthRows zagrada

// Povijest mjerenja tlaka priprema se iz svih zapisa zdravstvenog stanja
const chronologicalHealth = computed(() => {
    // Zadržavaju se zapisi koji imaju vrijednost tlaka
    return allHealthRows.value
        .filter(health => {
           /* return health.sistolickiTlak !== null && 
                health.sistolickiTlak !== undefined &&
                health.dijastolickiTlak !== null &&
                health.dijastolickiTlak !== undefined
                */
            //provjera postoje li obje vrijednosti
            const sistolicki = health.sistolickiTlak
            const dijastolicki = health.dijastolickiTlak

            // Prazna ili nedostajuća vrijednost isključuje zapis
            if (
                sistolicki === null || sistolicki === undefined || String(sistolicki).trim() === '' ||
                dijastolicki === null || dijastolicki === undefined || String(dijastolicki).trim() === ''
            ) { return false }

            // Obje vrijednosti moraju biti brojevi
            return Number.isFinite(Number(sistolicki)) && Number.isFinite(Number(dijastolicki))
        })
        .map(health => ({
            id: health.id,      ///potreban za prepoznavanje pojedinačnih mjerenja na grafu pogotovo ako postoji više mjerenja tlaka u istom danu      
            date: health.healthDate, // Datum ostaje spremljeni datum zdravstvenog stanja
            sistolickiTlak: Number(health.sistolickiTlak),
            dijastolickiTlak: Number(health.dijastolickiTlak)
            
            // Sistolički tlak pretvara se u broj ili null
          //  sistolickiTlak: health.sistolickiTlak == null ? null : Number(health.sistolickiTlak),

            // Dijastolički tlak pretvara se u broj ili null
           // dijastolickiTlak: health.dijastolickiTlak == null ? null : Number(health.dijastolickiTlak)
        }))
        // Zapisi se sortiraju kronološki od najstarijeg prema najnovijem
        .sort((a, b) => {
            return new Date(`${a.date}T00:00:00`) -
                new Date(`${b.date}T00:00:00`)
        })
}) // chronologicalHealth

//POVIJEST TLAKA ZA GRAFIKON FILTRIRA SE PREMA ODABRANOM RAZDOBLJU
const filteredHealthHistory = computed(() => {
    //grafu se šalju samo zapisi odabrane kategorije
   // const history = chronologicalHealth.value

    //za opciju SVE vraća se cijela povijest
    if(selectedHealthPeriod.value === 'all') {
       /* return history.map(health => ({
            date: health.date,
            value: health.value
        })) */
       return chronologicalHealth.value
    } //if zagrada

    //određivanje početnog vremenskog razdoblja
    const startDate = getPeriodStartDate(selectedHealthPeriod.value)
    //kraj razdoblja postavlja se na kraj današnjeg dana
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    //zadržavanje samo zapisa unutar odabranog razdoblja
    return chronologicalHealth.value.filter(health => {  //history
       // .filter(health => {
            if(!health.date) { return false } //zapis bez datuma nije za grafikon

            //pretvaranje datuma u lokalni Date objekt
            const healthDate = new Date(`${health.date}T00:00:00`)

            //neispravan datum isključuje se iz grafikona
            if(Number.isNaN(healthDate.getTime())) { return false }

            //provjera granica odabranog razdoblja
            return healthDate >= startDate && healthDate <= endDate
       // }) //filter zagrada
    })

}) //filteredHealthHistory zagrada
// Početni datum prema filteru grafikona
function getPeriodStartDate(period) {
    // Današnji datum prema lokalnom vremenu
    const today = new Date()
    // Postavljanje vremena na početak dana
    today.setHours(0, 0, 0, 0)

    // Početak razdoblja od jednog mjeseca
    if (period === '1m') {
        const startDate = new Date(today)
        startDate.setMonth(startDate.getMonth() - 1)
        return startDate
    } // if

    // Početak razdoblja od šest mjeseci
    if (period === '6m') {
        const startDate = new Date(today)
        startDate.setMonth(startDate.getMonth() - 6)
        return startDate
    } // if

    // Početak razdoblja od jedne godine
    const startDate = new Date(today)
    startDate.setFullYear(startDate.getFullYear() - 1)

    return startDate
} // getPeriodStartDate
// FUNKCIJA - DATUM IZ BAZE FORMATIRA SE ZA PRIKAZ U TABLICI I U ZAPISIMA TLAKA
function formatDate(value) {
    // Ako vrijednost nije dostupna, prikazuje se crtica
    if ( !value ) {   return '—'  } // if

    // Datum se razdvaja na godinu, mjesec i dan
    const dateParts = String(value).split('-')

   // Izvorna vrijednost vraća se ako datum nema očekivani format
    if (dateParts.length !== 3) { return value  } // if

    // Datum se prikazuje u hrvatskom formatu
    return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}.`
} // formatValue

//FUNKCIJA ZA ČITANJE ZAPISA ZD STANJA ODABRANOG KLIJENTA
async function loadClientHealth() {
    // Provjera postoji li ID klijenta
    if (!props.client?.id) {
        allHealthRows.value = []
        return
    } // if

    // Uključivanje oznake učitavanja
    loading.value = true

    // Pokušaj čitanja zdravstvenog stanja klijenta
    try {
        // Dohvaćanje svih zapisa zdravstvenog stanja iz servisa
        const result = await healthService.getClientHealth(props.client.id)

        // Spremanje dohvaćenih zapisa u reaktivnu varijablu
        allHealthRows.value = result.rows || []

        visiblePressureCount.value = 5 // Nakon učitavanja ponovno se prikazuje prvih pet zapisa tlaka

        // Vraćanje tablice na prvu stranicu nakon učitavanja
        pagination.value.page = 1
    } catch (error) {
        // Zapis greške za razvoj
        console.error('Greška pri čitanju zdravstvenog stanja klijenta:', error)

        // Prazan niz omogućuje prikaz sigurnog praznog stanja
        allHealthRows.value = []

        visiblePressureCount.value = 5

        // Obavijest o neuspješnom čitanju podataka
        Notify.create({
            message: 'Greška pri čitanju zdravstvenog stanja klijenta',
            type: 'negative',
            position: 'top'
        })
    } finally {
        // Isključivanje oznake učitavanja
        loading.value = false
    } // try/catch/finally
} // loadClientHealth

// Promjena kategorije vraća tablicu na prvu stranicu
watch(selectedHealthTypeId, () => {
    pagination.value.page = 1
}) //watch zagrada

// Dohvaćanje kategorija prilikom kreiranja komponente
loadHealthTypes()

// Promjena ID-a klijenta pokreće ponovno čitanje njegovih podataka
watch(
    () => props.client?.id,
    () => {
        loadClientHealth()
    },
    { immediate: true }
) //watch zagrada


//FUNKCIJA ZA OTVARANJE EKRANA ZA UNOS NOVOG ZD STANJA KLIJENTA
function addClientHealth() {
    // Provjera postoji li klijent
    if (!props.client?.id) { return } // if

    // Navigacija na zaseban ekran za unos zd stanja
    router.push(`/dashboard/clients/${props.client.id}/health/new`)
} //function addClientHealth zagrada

</script>

<style scoped>

/* Glavni kontejner sadržaja zdravstvenog stanja */
.client-health-tab {
    width: 100%;
    min-width: 0;
}

/* Gumb za dodavanje poravnava se na desnu stranu */
.add-client-health-container {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    margin-bottom: 22px;
}
/* GUMB ZA DODAVANJE ZD STANJA - OTVARA EKRAN */
.add-client-health-button {
    background: #BDC4D4;
    color: #0F1A2B;
    font-weight: 600;
}

/* Kontejner povijesti zdravstvenog stanja */
.health-items-container {
    width: 100%;
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(189, 196, 212, 0.35);
    border-radius: 16px;
    overflow: hidden;
    box-sizing: border-box;
    margin-bottom: 30px;
}

/* Naslov povijesti zdravstvenog stanja */
.health-items-title {
    color: #BDC4D4;
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 16px;
}

/* Redak oznake i padajućeg izbornika */
.health-items-select {
    display: flex;
    align-items: center;
    gap: 14px;
   /* width: 100%;*/
  /*  margin-bottom: 16px;*/
    min-width: 0;
    margin: 20px 0;
}

/* labela prije padajućeg izbornika */
.health-item-select-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
    flex-shrink: 0;
}

/* Padajući izbornik prilagođava se širini mobilnog prikaza */
.health-select-control {
    flex: 1;
    min-width: 0;
    min-height: 42px;
  /*  max-width: 100%;*/
}
/* Pozadina izbornika */
:deep(.health-type-popup) {
    background: #1C2E4A;
    color: #BDC4D4;
    border-radius: 12px;
    border: none;
    padding: 4px 0;
}

/* Tekst opcija izbornika */
:deep(.health-type-popup .q-item) {
    color: #BDC4D4;
    font-size: 14px;
    border: none;
}

/* Trenutačno odabrana opcija */
:deep(.health-type-popup .q-item--active) {
    background: rgba(168, 185, 204, 0.18);
    color: #BDC4D4;
    border: none;
}

/* Izgled izbornika */
:deep(.health-select-control .q-field__control) {
    background: #A8B9CC;
    border-radius: 12px;
    border: none;
    min-height: 42px;
}

/* Tekst odabrane vrste */
:deep(.health-select-control .q-field__native),
:deep(.health-select-control .q-field__input) {
    color: #0F1A2B;
    font-weight: 600;
    justify-content: center;
}

/* Strelica izbornika */
:deep(.health-select-control .q-icon) {
    color: #0F1A2B;
    margin-right: 6px;
}

/* Tablica zauzima dostupnu širinu kontejnera */
.health-table {
    width: 100%;
    min-width: 0;
    background: transparent;
    color: #BDC4D4; /* boja teksta u tablici */
    border-color: rgba(189, 196, 212, 0.25);
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
}

/* DONJI DIO TABLICE */
.health-table-bottom {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    width: 100%;
    min-height: 52px;
    padding: 8px 0;
    color: #BDC4D4;
    background: transparent;
    border-top: 1px solid rgba(189, 196, 212, 0.35);
    box-sizing: border-box;
}

/* IZBORNIK BROJA ZAPISA */
.health-rows-control {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

/* TEKST ZAPISA PO STRANICI */
.health-rows-label {
    color: #BDC4D4;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

/* POLJE ODABIRA BROJA ZAPISA */
.health-rows-select {
    width: 65px;
    color: #BDC4D4;
    font-size: 13px;
    font-weight: 600;
}
/* Uklanjanje donje crte polja */
.health-rows-select :deep(.q-field__control::before),
.health-rows-select :deep(.q-field__control::after) {
    display: none;
}
/* Odabrani broj zapisa */
.health-rows-select :deep(.q-field__native),
.health-rows-select :deep(.q-field__input) {
    color: #BDC4D4 !important;
    font-weight: 600;
}
/* Strelica izbornika */
.health-rows-select :deep(.q-icon) {
    color: #BDC4D4 !important;
}

/* POZADINA POLJA S ODABRANOM VRIJEDNOSTI */
.health-rows-select :deep(.q-field__control) {
    background: transparent !important;
}

/* POZADINA UNUTARNJEG POLJA */
.health-rows-select :deep(.q-field__native),
.health-rows-select :deep(.q-field__input),
.health-rows-select :deep(.q-field__marginal),
.health-rows-select :deep(.q-field__append) {
    background: transparent !important;
}

/* TEKST ODABRANE VRIJEDNOSTI */
.health-rows-select :deep(.q-field__native span),
.health-rows-select :deep(.q-field__native),
.health-rows-select :deep(.q-field__input) {
    color: #BDC4D4 !important;
    background: transparent !important;
}

/* UKLANJANJE SVIH SJENA I OKVIRA POLJA */
.health-rows-select :deep(.q-field__control::before),
.health-rows-select :deep(.q-field__control::after) {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
}


/* SAMO POPUP IZBORNIKA BROJA ZAPISA U OVOJ TABLICI */

/* Vanjska površina otvorenog Quasar izbornika */
:global(.q-menu.health-rows-per-page-popup),
:global(.health-rows-per-page-popup) {
    background: #000000 !important;
    color: #BDC4D4 !important;
    border: 1px solid rgba(189, 196, 212, 0.35) !important;
    border-radius: 12px !important;
    padding: 4px 0 !important;
    overflow: hidden !important;
    box-shadow: none !important;
}
/* Unutarnji popis opcija */
:global(.health-rows-per-page-popup .q-list),
:global(.health-rows-per-page-popup .q-virtual-scroll) {
    background: #000000 !important;
    color: #BDC4D4 !important;
}
/* Pojedinačne opcije 5, 10, 20 i SVE */
:global(.health-rows-per-page-popup .q-item) {
    background: #000000 !important;
    color: #BDC4D4 !important;
    font-size: 14px;
    font-weight: 600;
    min-height: 36px;
}
/* Trenutačno odabrana opcija */
:global(.health-rows-per-page-popup .q-item--selected) {
    background: #52677D !important;
    color: #BDC4D4 !important;
}
/* Opcija na koju se trenutačno prelazi pokazivačem */
:global(.health-rows-per-page-popup .q-item--active) {
    background: #52677D !important;
    color: #BDC4D4 !important;
}
/* Tekst svih opcija */
:global(.q-menu.health-rows-per-page-popup .q-item__label) {
    color: #BDC4D4 !important;
}
/* Uklanjanje mogućih svijetlih slojeva unutar opcija */
:global(.q-menu.health-rows-per-page-popup .q-focus-helper) {
    /*background: transparent !important;*/
    display: none !important;
}
/* Uklanjanje mogućeg bijelog sadržaja pseudoelemenata */
:global(.q-menu.health-rows-per-page-popup::before),
:global(.q-menu.health-rows-per-page-popup::after) {
    background: transparent !important;
    box-shadow: none !important;
}
/* */

/* RASPON ZAPISA I NAVIGACIJA */
.health-pagination-control {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #BDC4D4;
}

/* Tekst primjerice 1-5 od 12 */
.health-pagination-label {
    color: #BDC4D4;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

/* Strelice za promjenu stranice */
.health-pagination-control :deep(.q-btn) {
    color: #BDC4D4;
}
/* Unutarnji dio tablice omogućuje vertikalno i horizontalno pomicanje */
.health-table :deep(.q-table__middle) {
    max-height: 280px;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    background: transparent;
}
/* Minimalna širina tablice omogućuje horizontalno pomicanje na uskim ekranima */
.health-table :deep(table) {
    min-width: 250px;
    background: transparent;
}
/* Zaglavlje tablice ostaje vidljivo tijekom vertikalnog pomicanja */
.health-table :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #52677D;
    color: #FFFFFF; 
    font-size: 14px;
    font-weight: 800;
    border-bottom: 1px solid rgba(189, 196, 212, 0.35);
}

/* Poruka kada nema zapisa ili kada se podaci učitavaju */
.empty-health-items {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90px;
    padding: 18px 8px;
    color: #BDC4D4;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
}

/* Kontejner grafikona tlaka */
.health-chart-container {
    width: 100%;
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(189, 196, 212, 0.35);
    border-radius: 16px;
    overflow: hidden;
    box-sizing: border-box;
    margin-bottom: 30px
}

/* Naslov grafikona */
.health-chart-title {
    color: #BDC4D4;
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 16px;
}

/* Kontejner filtera vremenskog razdoblja */
.chart-period-filters {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    width: 100%;
    margin-bottom: 14px;
    overflow: hidden;
    padding-bottom: 2px;
}

/* Pojedinačni filter vremenskog razdoblja */
.chart-period-filter {
    flex: 1;
    min-width: 0;
    min-height: 40px;
    padding: 8px 4px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba(189, 196, 212, 0.55);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    transition: background-color 0.2s ease, color 0.2s ease;
}

/* Aktivni filter vremenskog razdoblja */
.chart-period-filter-active {
    background: rgba(189, 196, 212, 0.12);
    color: #BDC4D4;
    font-weight: 800;
}

/* Kontejner grafikona sprječava prelijevanje sadržaja */
.chart-container {
    width: 100%;
    min-width: 0;
    overflow: hidden;
}

/* Poruka kada nema podataka za prikaz grafikona */
.chart-placeholder-empty-text {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 110px;
    padding: 18px 8px;
    color: #BDC4D4;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
}

/* STILOVI ZA KARTICE ZAPISA TLAKA ISPOD GRAFA */
/* Kontejner povijesti zapisa tlaka */
.pressure-history-container {
    width: 100%;
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(189, 196, 212, 0.35);
    border-radius: 16px;
    box-sizing: border-box;
}

/* Naslov povijesti tlaka */
.pressure-title {
    color: #BDC4D4;
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 16px;
}

/* Kartica pojedinačnog zapisa tlaka */
.pressure-card {
    border: 1px solid rgba(189, 196, 212, 0.25);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
    box-sizing: border-box;
}

/* Naslov kartice */
.pressure-card-title {
    color: #BDC4D4;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 16px;
}

/* Red pojedinog podatka */
.pressure-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
}

/* Oznaka podatka */
.pressure-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
}

/* Vrijednost podatka */
.pressure-value {
    color: #BDC4D4;
    font-size: 14px;
    overflow-wrap: anywhere;
}

/* Poruka kada nema zapisa tlaka */
.empty-pressures {
    color: rgba(189, 196, 212, 0.65);
    font-size: 13px;
    text-align: center;
    padding: 20px 10px;
}

</style>