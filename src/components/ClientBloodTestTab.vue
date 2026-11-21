<!-- EKRAN TAB-A KRVNE SLIKE NA DETALJIMA KLIJENTA -->

<template>
     <!-- GLAVNI KONTEJNER TABA KRVNE SLIKE -->
  <div class="client-blood-test-tab">

    <!-- GUMB ZA DODAVANJE KRVNE SLIKE -->
    <div class="add-blood-test-container">
      <q-btn
        unelevated
        rounded
        class="add-blood-test-button"
        icon="add"
        label="DODAJ KRVNU SLIKU"
        @click="addBloodTest"
      />
    </div>

    <!-- PRVI KONTEJNER: REZULTATI ODABRANOG PARAMETRA -->
    <div class="blood-test-results-container">

      <div class="blood-test-results-title"> REZULTATI PARAMETRA KROZ VRIJEME </div>

      <!-- ODABIR PARAMETRA KRVNE SLIKE -->
      <div class="blood-test-parameter-select">
        <!-- Oznaka padajućeg izbornika -->
        <span class="blood-test-parametar-select-label">Parametar krvne slike:</span>

        <q-select
          v-model="selectedBloodParametarId"
          :options="bloodTestParameters"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          dense
          rounded
          dark
          behavior="menu"
          popup-content-class="blood-test-parameter-popup"
          :loading="loading"
          :disable="loading || bloodTestParameters.length === 0"
          :display-value="selectedParameter?.name || ''"
          aria-label="Odabir parametra krvne slike"
          class="blood-test-select-control"
        />
      </div>

      <!-- Poruka za vrijeme početnog čitanja podataka -->
      <div v-if="loading" class="empty-blood-tests"> UČITAVANJE KRVNE SLIKE </div>

      <!-- PRIKAZ REFERENTNIH VRIJEDNOSTI -->
      <template v-else-if="selectedParameter">
       <div class="blood-test-reference-values">
        
            <div class="blood-test-info-row">
            <span class="blood-test-info-label"> Preporučena min referentna vrijednost: </span>
            <strong class="blood-test-info-value">
                {{ formatValue(selectedParameter.refMin) }}
                {{ selectedParameter.unit }}
            </strong>
            </div>

            <div class="blood-test-info-row">
            <span class="blood-test-info-label"> Preporučena max referentna vrijednost: </span>
            <strong class="blood-test-info-value">
                {{ formatValue(selectedParameter.refMax) }}
                {{ selectedParameter.unit }}
            </strong>
            </div>
        </div> <!-- <div class="blood-test-reference-values"> -->

        <!-- Filteri vremenskog razdoblja -->
        <div class="chart-period-filters">
          <button
            v-for="period in bloodTestPeriods"
            :key="period.id"
            type="button"
            class="chart-period-filter"
            :class="{
              'chart-period-filter-active':
                selectedBloodTestPeriod === period.id
            }"
            @click="selectedBloodTestPeriod = period.id"
          >
            {{ period.label }}
          </button>
        </div>

      <!-- PROSTOR ZA GRAFIKON -->
        <div
          v-if="filteredBloodTestHistory.length > 0"
          class="chart-container"
         >
         <BloodTestLineChart
            :data="filteredBloodTestHistory"
            :period="selectedBloodTestPeriod"
            :unit="selectedParameter.unit || ''"
          />
        
        </div>
        <!-- Prazan grafikon -->
        <div v-else class="chart-placeholder-empty-text">
          NEMA PODATAKA ZA ODABRANO RAZDOBLJE
        </div>
      </template>
      <!-- Nema dostupnih parametara -->
      <div v-else class="empty-blood-tests">
        NEMA DOSTUPNIH PARAMETARA KRVNE SLIKE
      </div>

   </div>

    <!-- DRUGI KONTEJNER: POSLJEDNJI REZULTATI -->
    <div class="blood-test-history-container">
      <div class="blood-test-history-title"> POSLJEDNJI REZULTATI </div>

      <!-- UČITAVANJE -->
      <div v-if="loading" class="empty-blood-tests">
         UČITAVANJE REZULTATA KRVNE SLIKE
      </div>

      <!-- KLIJENT NEMA REZULTATA -->
      <div
        v-else-if="allBloodTests.length === 0"
        class="empty-blood-tests"> 
        ZA KLIJENTA JOŠ NEMA SPREMLJENIH REZULTATA KRVNE SLIKE
      </div>

       <!-- Odabrani parametar nema rezultata -->
      <div
        v-else-if="selectedParameterRecords.length === 0"
        class="empty-blood-tests">
        ZA ODABRANI PARAMETAR NEMA SPREMLJENIH REZULTATA
      </div>

      <!-- KARTICE POJEDINAČNIH REZULTATA -->
      <div
        v-for="bloodTest in visibleBloodTests"
        :key="bloodTest.id"
        class="blood-test-history-card"
      >

      <!-- Zaglavlje kartice -->
        <div class="blood-test-card-header">
            <!-- Naslov kartice -->
            <div class="blood-test-card-title">DETALJI NALAZA</div>
        </div>

        <!-- DATUM NALAZA -->
        <div class="blood-test-history-row">
          <span class="blood-test-history-label">
            Datum nalaza:
          </span>

          <span class="blood-test-history-value">
            {{ formatDate(bloodTest.date) }}
          </span>
        </div>

        <!-- REZULTAT -->
        <div class="blood-test-history-row">
          <span class="blood-test-history-label">
            Rezultat:
          </span>

          <span class="blood-test-history-value">
            {{ formatValue(bloodTest.value) }}
            {{ bloodTest.unit }}
          </span>
        </div>

      </div>

      <!-- GUMB ZA PRIKAZ DODATNIH REZULTATA -->
      <div
        v-if="visibleBloodTestCount < selectedParameterRecords.length"
        class="blood-test-show-more-container"
      >
        <q-btn
          flat
          rounded
          class="blood-test-show-more-button"
          label="PRIKAŽI VIŠE"
          @click="showMoreBloodTests"
        />
      </div>

    </div>
  </div>
</template>

<script setup>

// Vue funkcije za reaktivno stanje, izračunate vrijednosti i životni ciklus
import { computed, ref, watch } from 'vue'
// Router služi za otvaranje obrasca i čitanje query parametara
import { useRouter } from 'vue-router'
const router = useRouter()  // Inicijalizacija routera

import { Notify } from 'quasar'
// Servis za čitanje i spremanje k slike klijenta
import bloodTestService from '@/services/bloodTest.service'
//komponenta linijskog grafa
import BloodTestLineChart from '@/components/BloodTestLineChart.vue'

// PODACI KLIJENTA STIŽU IZ RODITELJSKE KOMPONENTE
const props = defineProps({
  client: {
    type: Object,
    required: true
  }
})

//REAKTIVNE VARIJABLE:
const bloodTestParameters = ref([]) // PARAMETRI KRVNE SLIKE
const allBloodTests = ref([]) // SVI REZULTATI KRVNE SLIKE KLIJENTA
const selectedBloodParametarId = ref(null) // ID ODABRANOG PARAMETRA

const loading = ref(false) // OZNAKA UČITAVANJA
const visibleBloodTestCount = ref(5)  // BROJ TRENUTAČNO PRIKAZANIH REZULTATA

const selectedBloodTestPeriod = ref('1m') // Zadani filter grafikona
// Dostupni filteri grafikona
const bloodTestPeriods = [
  { id: '1m', label: '1 MJ' },
  { id: '6m', label: '6 MJ' },
  { id: '1y', label: '1 GOD' },
  { id: 'all', label: 'SVE' }
]

// DOHVAT TRENUTNO ODABRANOG PARAMETRA
const selectedParameter = computed(() => {
  return bloodTestParameters.value.find(
    parameter =>
        Number(parameter.id) === Number(selectedBloodParametarId.value)
  ) || null
})

// REZULTATI ODABRANOG PARAMETRA  // Sortiranje je od najstarijeg prema najnovijem rezultatu
const selectedParameterRecords = computed(() => {
  if (!selectedBloodParametarId.value) { return [] } //if zagrada

  return allBloodTests.value
    .filter(bloodTest =>
      Number(bloodTest.bloodParametarId) === Number(selectedBloodParametarId.value)
    )
    .slice()
    .sort((a, b) => {
      const dateDifference = String(a.date).localeCompare(String(b.date))

      if (dateDifference !== 0) { return dateDifference }
      return Number(a.id) - Number(b.id)
    }) //.sort zagrada
}) //const selectedParameterRecords zagrada

// Rezultati za grafikon unutar odabranog razdoblja
const filteredBloodTestHistory = computed(() => {
  const history = selectedParameterRecords.value

  // Filter SVE prikazuje cijelu povijest
  if (selectedBloodTestPeriod.value === 'all') {
    return history
      .filter(record =>  record.date && Number.isFinite(Number(record.value)) )
      .map(record => ({
        date: record.date, value: Number(record.value)
      }))
  } //if zagrada

  const startDate = getPeriodStartDate( selectedBloodTestPeriod.value )

  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  return history
    .filter(record => {
      if (!record.date) { return false }

      if (
        record.value === null ||
        record.value === undefined ||
        !Number.isFinite(Number(record.value))
      ) {
        return false
      } //if zagrada

      const resultDate = new Date(`${record.date}T00:00:00`)

      if (Number.isNaN(resultDate.getTime())) { return false }

      return resultDate >= startDate && resultDate <= endDate
    })
    .map(record => ({ date: record.date, value: Number(record.value) }))
}) //const filteredBloodTestHistory zagrada

// Početni datum prema odabranom filteru
function getPeriodStartDate(period) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (period === '1m') {
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 1)
    return startDate
  }

  if (period === '6m') {
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 6)
    return startDate
  }

  const startDate = new Date(today)
  startDate.setFullYear(startDate.getFullYear() - 1)

  return startDate
}

// Rezultati za prikaz u karticama, najnoviji prvi
const newestFirstBloodTests = computed(() => {
  return [...selectedParameterRecords.value].reverse()
})

// Trenutačno vidljivi rezultati
const visibleBloodTests = computed(() => {
  return newestFirstBloodTests.value.slice(
    0,
    visibleBloodTestCount.value
  )
})

// FORMATIRANJE DATUMA
function formatDate(value) {
  if (!value) { return '—' }
  const dateParts = String(value).split('-')
  if (dateParts.length !== 3) { return value }
  return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}.`
}
// FORMATIRANJE BROJČANIH VRIJEDNOSTI
function formatValue(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value)) ) {
    return '—'
  } //if zagrada
  //return String(value)
  return Number(value).toLocaleString('hr-HR', {
    maximumFractionDigits: 2
  })
}

//FUNKCIJA ZA OTVARANJE EKRANA ZA DODAVANJE KRVNE SLIKE KLIJENTA
function addBloodTest() {
  // Provjera postoji li klijent
  if (!props.client?.id) { return } // if

  // Navigacija na zaseban ekran za unos
  router.push(`/dashboard/clients/${props.client.id}/bloodTest/new`)
} //addBloodTest zagrada

// PRIKAZ SLJEDEĆIH PET REZULTATA
function showMoreBloodTests() {
  visibleBloodTestCount.value = Math.min(
    visibleBloodTestCount.value + 5,
    selectedParameterRecords.value.length
  )
} //function showMoreBloodTests zagrada

// FUNKCIJA ZA UČITAVANJE PARAMETARA I REZULTATA KRVNE SLIKE
async function loadBloodTests() {
  if (!props.client?.id) {
    bloodTestParameters.value = []
    allBloodTests.value = []
    selectedBloodParametarId.value = null
    return
  } //if zagrada

  loading.value = true

  try {
    // Dohvat parametara iz baze
    bloodTestParameters.value =
    await bloodTestService.getBloodTestParametars()

    // Dohvat rezultata klijenta
    allBloodTests.value =
    await bloodTestService.getClientBloodTests(props.client.id)

    // Zadržavanje trenutačnog parametra ako još postoji
    const selectedParameterExists =
      bloodTestParameters.value.some(
        parameter =>
          Number(parameter.id) ===
          Number(selectedBloodParametarId.value)
      )

    // Ako odabrani parametar više ne postoji, bira se prvi
    if (!selectedParameterExists) {
      selectedBloodParametarId.value =
        bloodTestParameters.value[0]?.id ?? null
    } //if zagrada

    visibleBloodTestCount.value = 5
    selectedBloodTestPeriod.value = '1m'

  } catch (error) {
    console.error('Greška pri čitanju krvne slike klijenta:', error )

    bloodTestParameters.value = []
    allBloodTests.value = []
    selectedBloodParametarId.value = null
    visibleBloodTestCount.value = 5

    Notify.create({
      message: 'Greška pri čitanju krvne slike klijenta',
      type: 'negative',
      position: 'top'
    })

  } finally {
    loading.value = false
  } //finally zagrada
} //async function loadBloodTests() zagrada

// PROMJENA PARAMETRA VRAĆA KARTICE NA PRVIH PET REZULTATA I POSTAVLJA FILTER GRAFA NA 1MJ
watch(selectedBloodParametarId, () => {
  visibleBloodTestCount.value = 5
  selectedBloodTestPeriod.value = '1m'
})
// PROMJENA KLIJENTA POKREĆE PONOVNO UČITANJE PODATAKA
watch(
  () => props.client?.id,
  () => {
    //loadClientBloodTests()
    loadBloodTests()
  },
  { immediate: true }
) //watch zagrada

</script>

<style scoped>

/* Glavni kontejner */
.client-blood-test-tab {
  width: 100%;
  min-width: 0;
}

/* Gumb za dodavanje */
.add-blood-test-container {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 22px;
}

.add-blood-test-button {
  max-width: 100%;
  background: #BDC4D4;
  color: #0F1A2B;
  font-weight: 600;
  white-space: normal;
}

/* Prvi kontejner */
.blood-test-results-container {
  width: 100%;
  min-width: 0;
  min-height: 580px;
  padding: 16px;
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  box-sizing: border-box;
  margin-bottom: 30px;
  overflow: hidden;
}

/* Naslov */
.blood-test-results-title,
.blood-test-history-title {
  color: #BDC4D4;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
}

/* Izbornik parametara */
.blood-test-parameter-select {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  width: 100%;
  margin: 20px 0 18px;
  min-width: 0;
}

/* Oznaka izbornika */
.measurement-select-label {
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
}

/* Polje izbornika */
.blood-test-select-control {
  width: 100%;
  min-width: 0;
  min-height: 42px;
}

/* Pozadina polja */
:deep(.blood-test-select-control .q-field__control) {
  background: #A8B9CC;
  border-radius: 12px;
  min-height: 42px;
}

/* Tekst odabranog parametra */
:deep(.blood-test-select-control .q-field__native),
:deep(.blood-test-select-control .q-field__input),
:deep(.blood-test-select-control .q-field__display-value) {
  color: #0F1A2B;
  font-size: 12px;
  font-weight: 600;
  text-transform: none;
  text-align: left;
}

/* Strelica izbornika */
:deep(.blood-test-select-control .q-icon) {
  color: #0F1A2B;
}

/* Popup izbornika */
:global(.blood-test-parameter-popup) {
  background: #1C2E4A !important;
  color: #BDC4D4 !important;
  border-radius: 12px !important;
  padding: 4px 0;
}

/* Opcije izbornika */
:global(.blood-test-parameter-popup .q-item) {
  color: #BDC4D4;
  font-size: 13px;
  min-height: 38px;
}

/* Odabrana opcija */
:global(.blood-test-parameter-popup .q-item--active) {
  background: rgba(168, 185, 204, 0.18);
  color: #BDC4D4;
}

/* Referentne vrijednosti */
.blood-test-reference-values {
  margin: 8px 0 18px;
}

.blood-test-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px; /*razmak između labele preporučene min/max referentne vrijednosti: i stvarne vrijednosti */
  margin-bottom: 12px; /*razmak između labele preporučene min i max referentne vrijednosti */
}

.blood-test-info-label {
  color: #BDC4D4;
  font-size: 13px;
  font-weight: 700;
}

.blood-test-info-value {
  color: #BDC4D4;
  font-size: 13px;
  font-weight: 600;
}

/* Filteri grafikona */
.chart-period-filters {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  width: 100%;
  margin-bottom: 14px;
  overflow: hidden;
  padding-bottom: 2px;
}

.chart-period-filter {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  border: none;
  background: transparent;
  color: rgba(189, 196, 212, 0.55);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 4px;
  border-radius: 8px;
  white-space: nowrap;
}

.chart-period-filter-active {
  background: rgba(189, 196, 212, 0.12);
  color: #BDC4D4;
  font-weight: 800;
}

/* Grafikon */
.chart-container {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* Poruka kada nema podataka za grafikon */
.chart-placeholder-empty-text {
  color: rgba(189, 196, 212, 0.65);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-top: 80px;
  margin-bottom: 40px;
}

/* Poruke učitavanja i praznog stanja */
.empty-blood-tests {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
  padding: 16px 8px;
  color: rgba(189, 196, 212, 0.65);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

/* Drugi kontejner */
.blood-test-history-container {
  width: 100%;
  min-width: 0;
  padding: 16px;
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

/* Kartica rezultata */
.blood-test-history-card {
  width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(189, 196, 212, 0.25);
  border-radius: 12px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
/* naslov DETALJI NALAZA */
.blood-test-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;
}
.blood-test-card-title{
    color: #BDC4D4;
    font-size: 16px;
    font-weight: 700;
}

/* Redak kartice */
.blood-test-history-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.blood-test-history-row:last-child {
  margin-bottom: 0;
}

/* Oznake */
.blood-test-history-label {
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
}

/* Vrijednosti */
.blood-test-history-value {
  color: #BDC4D4;
  font-size: 14px;
  overflow-wrap: anywhere;
}

/* Gumb prikaži više */
.blood-test-show-more-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 16px;
}

.blood-test-show-more-button {
  background: #263B54;
  color: #BDC4D4;
  font-weight: 700;
  padding: 4px 18px;
}

</style>