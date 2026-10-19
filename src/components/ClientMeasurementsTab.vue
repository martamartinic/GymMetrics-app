<!-- sadrži gumb za unos, sažetak napretka, izbor vrste mjerenja, grafikon i zapise mjerenja klijenta -->

<template>
    <!-- Glavni sadržaj kartice mjerenja -->
    <div class="measurements-tab">
        <!-- Gumb za dodavanje novog mjerenja -->
        <div class="add-measurement-container">
            <q-btn
                unelevated
                rounded
                class="add-measurement-button"
                icon="add"
                label="DODAJ MJERENJE"
                @click="addMeasurement"
            />
        </div>

        <!-- Kontejner sa sažetkom i grafikonom -->
        <div class="measurement-statistics-container">
            <!-- Naslov sažetka mjerenja -->
            <div class="statistics-title">REZULTATI MJERENJA KLIJENTA</div>

            <!-- Izbor vrste mjerenja -->
            <div class="measurement-select">
                <!-- Oznaka padajućeg izbornika -->
                <span class="measurement-select-label">Vrsta mjerenja:</span>

                <!-- Izbornik svih vrsta mjerenja -->
                <q-select
                    v-model="selectedMeasurementTypeId"
                    :options="measurementTypes"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    dense
                    rounded
                    dark
                    behavior="menu"
                    popup-content-class="measurement-type-popup"
                    :loading="loading"
                    :disable="loading || measurementTypes.length === 0"
                    :display-value="selectedMeasurementTypeName"
                    aria-label="Odabir vrste mjerenja"
                    class="measurement-select-control"
                />
            </div>

            <!-- Poruka za vrijeme početnog čitanja podataka -->
            <div v-if="loading" class="empty-measurements">
                UČITAVANJE MJERENJA
            </div>

            <!-- Sažetak se prikazuje kada je odabrana vrsta mjerenja -->
            <template v-else-if="selectedMeasurementType">
                <!-- Početni rezultat -->
                <div class="result-row">
                    <span class="result-label">Početni rezultat:</span>
                    <strong class="result-value">
                        {{ formatValue(initialValue) }}
                        {{ selectedMeasurementType.unit }}
                    </strong>
                </div>

                <!-- Posljednji rezultat -->
                <div class="result-row">
                    <span class="result-label">Zadnji rezultat:</span>
                    <strong class="result-value">
                        {{ formatValue(latestValue) }}
                        {{ selectedMeasurementType.unit }}
                    </strong>
                </div>

                <!-- Oznaka napretka -->
                <div class="progress-title">Napredak:</div>

                <!-- Traka i postotak promjene -->
                <div class="progress-row">
                    <!-- Traka prikazuje veličinu promjene -->
                    <q-linear-progress
                        :value="progressBarValue"
                        rounded
                        size="10px"
                        color="primary"
                        track-color="grey-8"
                        class="progress-bar"
                    />

                    <!-- Tekst prikazuje smjer i postotak promjene -->
                    <span class="progress-percent">
                        {{ progressText }}
                    </span>
                </div>

                <!-- Objašnjenje kada se postotak ne može izračunati -->
                <div v-if="progressPercent === null" class="progress-hint"> {{ progressPoruka }} </div>
            </template>

            <!-- Poruka kada nema vrsta mjerenja -->
            <div v-else class="empty-measurements">
                NEMA DOSTUPNIH VRSTA MJERENJA
            </div>

            <!-- Razdjelna crta između sažetka i grafikona -->
            <div class="section-separator"></div>

            <!-- Naslov grafikona -->
            <div class="statistics-title">MJERENJA KLIJENTA KROZ VRIJEME</div>

            <!-- Filteri vremenskog razdoblja -->
            <div class="chart-period-filters">
                <!-- Pojedinačni filter -->
                <button
                    v-for="period in measurementPeriods"
                    :key="period.id"
                    type="button"
                    class="chart-period-filter"
                    :class="{
                        'chart-period-filter-active':
                            selectedMeasurementPeriod === period.id
                    }"
                    @click="selectedMeasurementPeriod = period.id"
                >
                    {{ period.label }}
                </button>
            </div>

            <!-- Grafikon kada postoje zapisi u odabranom razdoblju -->
            <div
                v-if="filteredMeasurementHistory.length > 0"
                class="chart-container"
            >
                <MeasurementLineChart
                    :data="filteredMeasurementHistory"
                    :period="selectedMeasurementPeriod"
                    :unit="selectedMeasurementType?.unit || ''"
                />
            </div>

            <!-- Poruka kada nema podataka za grafikon -->
            <div v-else class="chart-placeholder-empty-text">
                NEMA PODATAKA ZA ODABRANO RAZDOBLJE
            </div>
        </div>

        <!-- Kontejner posljednjih mjerenja -->
        <div class="measurement-history-container">
            <!-- Naslov povijesti -->
            <div class="statistics-title">POSLJEDNJA MJERENJA</div>

            <!-- Poruka kada klijent nema nijedan zapis -->
            <div v-if="allMeasurements.length === 0 && !loading" class="empty-measurements">
                ZA KLIJENTA JOŠ NEMA SPREMLJENIH MJERENJA
            </div>

            <!-- Poruka kada odabrana vrsta nema zapisa -->
            <div
                v-else-if="visibleMeasurements.length === 0 && !loading"
                class="empty-measurements"
            >
                ZA ODABRANU VRSTU MJERENJA NEMA SPREMLJENIH ZAPISA
            </div>

            <!-- Kartica svakog pojedinačnog mjerenja -->
            <div
                v-for="measurement in visibleMeasurements"
                :key="measurement.id"
                class="measurement-card"
            >
                <!-- Zaglavlje kartice -->
                <div class="measurement-card-header">
                    <!-- Naslov kartice -->
                    <div class="measurement-card-title">DETALJI MJERENJA</div>

                    <!-- Gumb za brisanje zapisa -->
                    <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        aria-label="Obriši mjerenje"
                        class="delete-measurement-button"
                        @click="deleteMeasurement(measurement)"
                    />
                </div>

                <!-- Datum zapisa -->
                <div class="measurement-row">
                    <span class="measurement-label">Datum mjerenja:</span>
                    <span class="measurement-value">
                        {{ measurement.date }}
                    </span>
                </div>

                <!-- Vrijednost zapisa -->
                <div class="measurement-row">
                    <span class="measurement-label">Rezultat mjerenja:</span>
                    <span class="measurement-value">
                        {{ formatValue(measurement.value) }}
                        {{ measurement.unit }}
                    </span>
                </div>
            </div>

            <!-- Gumb za prikaz sljedećih pet zapisa -->
            <div
                v-if="visibleMeasurementCount < filteredMeasurements.length"
                class="show-more-container"
            >
                <q-btn
                    flat
                    rounded
                    class="show-more-button"
                    label="PRIKAŽI VIŠE"
                    @click="showMoreMeasurements"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
// Vue funkcije za reaktivno stanje, izračunate vrijednosti i životni ciklus
import { computed, onMounted, ref, watch } from 'vue'
// Router služi za otvaranje obrasca i čitanje query parametara
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()  // Inicijalizacija routera
const route = useRoute() // Inicijalizacija trenutačne rute

import { Notify } from 'quasar'
// Servis za čitanje i spremanje mjerenja
import measurementService from '@/services/measurement.service'
// Komponenta linijskog grafikona
import MeasurementLineChart from '@/components/MeasurementLineChart.vue'

// Podaci klijenta stižu iz roditeljske komponente
const props = defineProps({
    // Objekt klijenta sadrži njegov ID i početnu težinu
    client: {
        type: Object,
        required: true
    }
}) // defineProps

// Popis vrsta mjerenja
const measurementTypes = ref([])
// Svi zapisi mjerenja klijenta
const allMeasurements = ref([])
// Početna težina spremljena na profilu klijenta
const startingWeight = ref(null)
// ID odabrane vrste mjerenja
const selectedMeasurementTypeId = ref(null)
// Trenutačni filter grafikona
const selectedMeasurementPeriod = ref('1m')
// Broj zapisa prikazanih u povijesti
const visibleMeasurementCount = ref(5)
// Oznaka početnog čitanja podataka
const loading = ref(false)
// Filteri dostupnih vremenskih razdoblja
const measurementPeriods = [
    { id: '1m', label: '1 MJ' },
    { id: '6m', label: '6 MJ' },
    { id: '1y', label: '1 GOD' },
    { id: 'all', label: 'SVE' }
]

//PORUKE ZA NAPREDAK  PROGRESS BAR
const progressPoruka = computed(() => {
    // Provjera početne vrijednosti
    const initial = initialValue.value
    if (initial === null || initial === undefined) {
        return 'Nema početne vrijednosti za odabranu vrstu mjerenja'
    } //if zagrada
    // Početna vrijednost ne smije biti nula
    if (Number(initial) === 0) {
        return 'Postotak promjene nije moguće izračunati jer je početna vrijednost jednaka nuli'
    } //if zagrada
    // Provjera postoji li spremljeno mjerenje za zadnji rezultat
    if (latestValue.value === null || latestValue.value === undefined) {
        return 'Ne postoji zadnji rezultat odabrane vrste mjerenja za izračun postotne promjene'
    } //if zagrada
    // Rezervna poruka za ostale slučajeve bez postotka
    return 'Postotak promjene trenutačno nije moguće izračunati'
}) //progressPoruka zagrada

// Trenutačno odabrana vrsta mjerenja
const selectedMeasurementType = computed(() => {
    // Traženje vrste prema njezinu ID-u
    return measurementTypes.value.find(
        type => type.id === Number(selectedMeasurementTypeId.value)
    ) || null
}) // selectedMeasurementType

// Naziv odabrane vrste prikazuje se velikim slovima
const selectedMeasurementTypeName = computed(() => {
    // Ako vrsta nije odabrana, tekst ostaje prazan
    return selectedMeasurementType.value
        ? selectedMeasurementType.value.name.toUpperCase()
        : ''
}) // selectedMeasurementTypeName

// Zapisi samo za trenutačno odabranu vrstu mjerenja
const filteredMeasurements = computed(() => {
    // Bez odabrane vrste nema zapisa za prikaz
    if (!selectedMeasurementTypeId.value) {
        return []
    } // if

    // Filtriranje prema ID-u vrste mjerenja
    return allMeasurements.value.filter(
        measurement =>
            Number(measurement.measurementTypeId) ===
            Number(selectedMeasurementTypeId.value)
    )
}) // filteredMeasurements

// Povijest je sortirana kronološki prema datumu i ID-u zapisa
const chronologicalMeasurements = computed(() => {
    // Kopiranje niza prije sortiranja kako se izvorni niz ne bi mijenjao
    return [...filteredMeasurements.value].sort((a, b) => {
        // Usporedba datuma zapisa
        const dateDifference = String(a.date).localeCompare(String(b.date))

        // Ako su datumi jednaki, uspoređuju se ID-evi zapisa
        if (dateDifference === 0) {
            return Number(a.id) - Number(b.id)
        } // if

        // Vraća kronološki poredak
        return dateDifference
    }) // sort
}) // chronologicalMeasurements

// Početni rezultat za trenutačno odabranu vrstu
const initialValue = computed(() => {
    // Bez vrste mjerenja početna vrijednost nije dostupna
    if (!selectedMeasurementType.value) {
        return null
    } // if

    // Težina koristi početnu težinu spremljenu na profilu klijenta
    if (selectedMeasurementType.value.name.toLowerCase() === 'težina') {
        return startingWeight.value
    } // if

    // Ostale vrste koriste najstariji kronološki zapis
    const firstMeasurement = chronologicalMeasurements.value[0]

    // Bez zapisa početna vrijednost nije dostupna
    return firstMeasurement ? firstMeasurement.value : null
}) // initialValue

// Najnoviji rezultat za trenutačno odabranu vrstu
const latestValue = computed(() => {
    // Posljednji element kronološki sortiranog niza je najnoviji zapis
    const lastMeasurement =
        chronologicalMeasurements.value[chronologicalMeasurements.value.length - 1]

    // Bez zapisa najnovija vrijednost nije dostupna
    return lastMeasurement ? lastMeasurement.value : null
}) // latestValue

// Postotna promjena između početne i najnovije vrijednosti
const progressPercent = computed(() => {
    // Čitanje početne i posljednje vrijednosti
    const initial = initialValue.value
    const latest = latestValue.value

    // Ako nedostaje jedna vrijednost, postotak se ne može izračunati
    if (
        initial === null ||
        initial === undefined ||
        latest === null ||
        latest === undefined
    ) {
        return null
    } // if

    // Nulta početna vrijednost ne dopušta dijeljenje
    if (Number(initial) === 0) {
        return null
    } // if

    // Promjena se računa u odnosu na početnu vrijednost
    return ((Number(latest) - Number(initial)) / Number(initial)) * 100
}) // progressPercent

// Tekst napretka sa strelicom i predznakom
const progressText = computed(() => {
    // Kada nema valjanog postotka, prikazuje se crtica
    if (progressPercent.value === null) {
        return '—'
    } // if

    // Promjena se zaokružuje na dvije decimale
    const roundedChange = Math.round(progressPercent.value * 100) / 100

    // Jednaka početna i završna vrijednost prikazuju nulti napredak
    if (roundedChange === 0) {
        return '→ 0%'
    } // if

    // Pozitivna promjena prikazuje strelicu prema gore
    if (roundedChange > 0) {
        return `↑ +${roundedChange.toFixed(2)}%`
    } // if

    // Negativna promjena prikazuje strelicu prema dolje
    return `↓ ${roundedChange.toFixed(2)}%`
}) // progressText

// Duljina trake prati apsolutnu veličinu promjene
const progressBarValue = computed(() => {
    // Traka ostaje prazna ako se postotak ne može izračunati
    if (progressPercent.value === null) {
        return 0
    } // if

    // Prikaz trake ograničen je na raspon od nula do jedan
    return Math.min(Math.abs(progressPercent.value) / 100, 1)
}) // progressBarValue

// Zapisi sortirani od najnovijeg prema najstarijem
const newestFirstMeasurements = computed(() => {
    // Kopiranje kronološkog niza i obrtanje redoslijeda
    return [...chronologicalMeasurements.value].reverse()
}) // newestFirstMeasurements

// Trenutačno vidljiv dio povijesti mjerenja
const visibleMeasurements = computed(() => {
    // Prikazuje se prvih pet zapisa ili sljedećih pet nakon klika
    return newestFirstMeasurements.value.slice(0, visibleMeasurementCount.value)
}) // visibleMeasurements

// Povijest za grafikon unutar odabranog razdoblja
const filteredMeasurementHistory = computed(() => {
    // Grafikonu se šalju samo zapisi odabrane vrste mjerenja
    const history = chronologicalMeasurements.value

    // Za opciju SVE vraća se cijela povijest
    if (selectedMeasurementPeriod.value === 'all') {
        return history.map(measurement => ({
            date: measurement.date,
            value: measurement.value
        }))
    } // if

    // Određivanje početka vremenskog razdoblja
    const startDate = getPeriodStartDate(selectedMeasurementPeriod.value)

    // Kraj razdoblja postavlja se na kraj današnjeg dana
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    // Zadržavaju se samo zapisi unutar odabranog razdoblja
    return history
        .filter(measurement => {
            // Zapis bez datuma nije prikladan za grafikon
            if (!measurement.date) {
                return false
            } // if

            // Pretvaranje datuma u lokalni Date objekt
            const measurementDate = new Date(`${measurement.date}T00:00:00`)

            // Neispravan datum isključuje se iz grafikona
            if (Number.isNaN(measurementDate.getTime())) {
                return false
            } // if

            // Provjera granica odabranog razdoblja
            return measurementDate >= startDate && measurementDate <= endDate
        }) // filter
        .map(measurement => ({
            // Datum ostaje stvarni datum spremljenog mjerenja
            date: measurement.date,
            // Vrijednost ostaje stvarna spremljena vrijednost
            value: measurement.value
        })) // map
}) // filteredMeasurementHistory

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

// Formatiranje brojčane vrijednosti za prikaz
function formatValue(value) {
    // Ako vrijednost nije dostupna, prikazuje se crtica
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return '—'
    } // if

    // Broj prikazuje se s najviše dvije decimale
    return Number(value).toLocaleString('hr-HR', {
        maximumFractionDigits: 2
    })
} // formatValue

// Otvaranje obrasca za unos novog mjerenja
function addMeasurement() {
    // Provjera postoji li klijent
    if (!props.client?.id) {
        return
    } // if

    // Navigacija na zaseban ekran za unos
    router.push(`/dashboard/clients/${props.client.id}/measurement/new`)
} // addMeasurement

// Čitanje vrsta i zapisa mjerenja
async function loadMeasurements() {
    // Uključivanje oznake učitavanja
    loading.value = true

    // Pokušaj čitanja potrebnih podataka
    try {
        // Čitanje vrsta mjerenja
        measurementTypes.value = await measurementService.getMeasurementTypes()

        // Čitanje zapisa mjerenja i početne težine
        const result = await measurementService.getClientMeasurements(props.client.id)

        // Spremanje početne težine klijenta
        startingWeight.value = result.startingWeight

        // Spremanje svih zapisa mjerenja
        allMeasurements.value = result.measurements

        // Zadržavanje odabrane vrste iz query parametra ako je valjana
        const queryTypeId = Number(route.query.measurementTypeId)
        const queryTypeExists = measurementTypes.value.some(
            type => type.id === queryTypeId
        )

        // Primjena vrste poslane s obrasca za unos
        if (Number.isInteger(queryTypeId) && queryTypeExists) {
            selectedMeasurementTypeId.value = queryTypeId
        } else if (
            !measurementTypes.value.some(
                type => type.id === Number(selectedMeasurementTypeId.value)
            )
        ) {
            // Početni odabir je prva dostupna vrsta mjerenja
            selectedMeasurementTypeId.value = measurementTypes.value[0]?.id ?? null
        } // if/else
    } catch (error) {
        // Zapis greške za razvoj
        console.error('Greška pri čitanju mjerenja klijenta', error)

        // Prazne vrijednosti omogućuju prikaz sigurnog praznog stanja
        allMeasurements.value = []
        measurementTypes.value = []
        startingWeight.value = null

        // Obavijest o neuspješnom čitanju
        Notify.create({
            message: 'Greška pri čitanju mjerenja klijenta',
            type: 'negative',
            position: 'top'
        })
    } finally {
        // Isključivanje oznake učitavanja
        loading.value = false
    } // try/catch/finally
} // loadMeasurements

// Prikaz dodatnih zapisa povijesti
function showMoreMeasurements() {
    // Povećanje broja vidljivih zapisa za pet
    visibleMeasurementCount.value += 5

    // Broj vidljivih zapisa ne prelazi ukupan broj zapisa
    if (visibleMeasurementCount.value > filteredMeasurements.value.length) {
        visibleMeasurementCount.value = filteredMeasurements.value.length
    } // if
} // showMoreMeasurements

// Brisanje pojedinačnog zapisa mjerenja
async function deleteMeasurement(measurement) {
    // Provjera postoji li zapis
    if (!measurement) {
        return
    } // if

    // Potvrda prije trajnog brisanja
    const confirmed = window.confirm(
        'Jeste li sigurni da želite obrisati ovo mjerenje?'
    )

    // Prekid ako brisanje nije potvrđeno
    if (!confirmed) {
        return
    } // if

    // Pokušaj brisanja zapisa
    try {
        // Poziv servisne metode
        const result = await measurementService.deleteMeasurement(measurement.id)

        // Provjera rezultata prema formatu povratne vrijednosti adaptera
        if (result === 0 || result?.changes === 0) {
            // Poruka ako zapis nije obrisan
            Notify.create({
                message: 'Mjerenje nije pronađeno ili nije obrisano',
                type: 'negative',
                position: 'top'
            })

            // Prekid daljnjeg postupka
            return
        } // if

        // Ponovno čitanje podataka nakon brisanja
        await loadMeasurements()

        // Poruka o uspješnom brisanju
        Notify.create({
            message: 'Mjerenje je uspješno obrisano',
            type: 'positive',
            position: 'top'
        })
    } catch (error) {
        // Zapis greške za razvoj
        console.error('Greška pri brisanju mjerenja', error)

        // Obavijest o neuspješnom brisanju
        Notify.create({
            message: 'Greška pri brisanju mjerenja',
            type: 'negative',
            position: 'top'
        })
    } // try/catch
} // deleteMeasurement

// Ponovno postavljanje broja kartica nakon promjene vrste
watch(selectedMeasurementTypeId, () => {
    // Početni prikaz sadrži najviše pet zapisa
    visibleMeasurementCount.value = 5

    // Nakon promjene vrste grafikon se vraća na jedan mjesec
    selectedMeasurementPeriod.value = '1m'
}) // watch

// Početno čitanje mjerenja pri prikazu kartice
onMounted(async () => {
    // Čitanje podataka klijenta
    await loadMeasurements()
}) // onMounted
</script>

<style scoped>
/* Glavni kontejner kartice mjerenja */
.measurements-tab {
    width: 100%;
    min-width: 0;
}

/* Kontejner gumba za unos */
.add-measurement-container {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 22px;
}

/* Gumb za dodavanje mjerenja */
.add-measurement-button {
    background: #BDC4D4;
    color: #0F1A2B;
    font-weight: 600;
}

/* Kontejner sa sažetkom i grafikonom */
.measurement-statistics-container {
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 30px;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    min-height: 580px;
}

/* Kontejner povijesti mjerenja */
.measurement-history-container {
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 16px;
    padding: 16px;
    box-sizing: border-box;
}

/* Naslovi sekcija */
.statistics-title {
    color: #BDC4D4;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 16px;
}

/* Red s oznakom i izbornikom */
.measurement-select {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 20px 0;
    min-width: 0;
}

/* Oznaka izbornika */
.measurement-select-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
    flex-shrink: 0;
}

/* Izbornik zauzima preostali prostor */
.measurement-select-control {
    flex: 1;
    min-width: 0;
    min-height: 42px;
}

/* Pozadina izbornika */
:deep(.measurement-type-popup) {
    background: #1C2E4A;
    color: #BDC4D4;
    border-radius: 12px;
    border: none;
    padding: 4px 0;
}

/* Tekst opcija izbornika */
:deep(.measurement-type-popup .q-item) {
    color: #BDC4D4;
    font-size: 14px;
    border: none;
}

/* Trenutačno odabrana opcija */
:deep(.measurement-type-popup .q-item--active) {
    background: rgba(168, 185, 204, 0.18);
    color: #BDC4D4;
    border: none;
}

/* Izgled izbornika */
:deep(.measurement-select-control .q-field__control) {
    background: #A8B9CC;
    border-radius: 12px;
    border: none;
    min-height: 42px;
}

/* Tekst odabrane vrste */
:deep(.measurement-select-control .q-field__native),
:deep(.measurement-select-control .q-field__input) {
    color: #0F1A2B;
    font-weight: 600;
    justify-content: center;
}

/* Strelica izbornika */
:deep(.measurement-select-control .q-icon) {
    color: #0F1A2B;
    margin-right: 6px;
}

/* Red početne i posljednje vrijednosti */
.result-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
}

/* Oznake početnog i posljednjeg rezultata */
.result-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
}

/* Brojčani rezultat */
.result-value {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 600;
}

/* Oznaka napretka */
.progress-title {
    color: #BDC4D4;
    font-size: 15px;
    font-weight: 800;
    margin: 18px 0 6px;
}

/* Traka i tekst napretka */
.progress-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* Traka zauzima raspoloživi prostor */
.progress-bar {
    flex: 1;
    min-width: 0;
}

/* Tekst napretka */
.progress-percent {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
}

/* Objašnjenje neizračunljivog postotka */
.progress-hint {
    color: rgba(189, 196, 212, 0.65);
    font-size: 12px;
    line-height: 1.45;
    margin-top: 8px;
}

/* Razdjelna crta */
.section-separator {
    height: 1px;
    background: rgba(189, 196, 212, 0.25);
    margin: 20px 0;
}

/* Kontejner grafikona */
.chart-container {
    width: 100%;
    min-width: 0;
    overflow: hidden;
}

/* Red filtera grafikona */
.chart-period-filters {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    width: 100%;
    margin-bottom: 14px;
    margin-top: -4px;
    overflow: hidden;
    padding-bottom: 2px;
}

/* Pojedinačni filter */
.chart-period-filter {
    flex: 1;
    border: none;
    background: transparent;
    color: rgba(189, 196, 212, 0.55);
    font-size: 12px;
    font-weight: 600;
    padding: 8px 4px;
    border-radius: 8px;
    white-space: nowrap;
    min-height: 40px;
}

/* Aktivni filter */
.chart-period-filter-active {
    background: rgba(189, 196, 212, 0.12);
    color: #BDC4D4;
    font-weight: 800;
}

/* Poruka kada nema podataka */
.chart-placeholder-empty-text {
    color: rgba(189, 196, 212, 0.65);
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    margin-top: 80px;
    margin-bottom: 40px;
}

/* Poruke praznog stanja */
.empty-measurements {
    text-align: center;
    padding: 20px 10px;
    color: rgba(189, 196, 212, 0.65);
    font-size: 13px;
}

/* Kartica pojedinačnog mjerenja */
.measurement-card {
    border: 1px solid rgba(189, 196, 212, 0.25);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
    box-sizing: border-box;
}

/* Naslov kartice i gumb brisanja */
.measurement-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;
}

/* Naslov detalja mjerenja */
.measurement-card-title {
    color: #BDC4D4;
    font-size: 16px;
    font-weight: 700;
}

/* Gumb brisanja zapisa */
.delete-measurement-button {
    color: #52677D;
}

/* Red pojedinog podatka */
.measurement-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
}

/* Oznaka datuma ili rezultata */
.measurement-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
}

/* Stvarna vrijednost datuma ili rezultata */
.measurement-value {
    color: #BDC4D4;
    font-size: 14px;
    overflow-wrap: anywhere;
}

/* Kontejner gumba za prikaz više zapisa */
.show-more-container {
    display: flex;
    justify-content: center;
    margin-top: 12px;
}

/* Gumb za prikaz dodatnih zapisa */
.show-more-button {
    color: #BDC4D4;
    font-weight: 600;
}
</style>