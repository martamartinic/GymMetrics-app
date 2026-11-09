<!-- TAB TESTOVI NA EKRANU DETALJA KLIJENTA -->
<!-- sadrži gumb za unos, sažetak napretka, izbor vrste testa, grafikon i zapise testova klijenta -->

<template>
    <!-- Glavni sadržaj kartice testova -->
    <div class="test-tab">
        <!-- Gumb za dodavanje novog testa -->
        <div class="add-test-container">
            <q-btn
                unelevated
                rounded
                class="add-test-button"
                icon="add"
                label="DODAJ TEST"
                @click="addTest"
            />
        </div>

        <!-- Kontejner sa sažetkom i grafikonom -->
        <div class="test-statistics-container">
            <!-- Naslov sažetka testova -->
            <div class="statistics-title">REZULTATI TESTOVA KLIJENTA</div>

            <!-- Izbor vrste testa -->
            <div class="test-select">
                <!-- Oznaka padajućeg izbornika -->
                <span class="test-select-label">Vrsta testa:</span>

                <!-- Izbornik svih vrsta testova -->
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
                    :loading="loading"
                    :disable="loading || testTypes.length === 0"
                    :display-value="selectedTestTypeName"
                    aria-label="Odabir vrste testa"
                    class="test-select-control"
                />
            </div>

            <!-- Poruka za vrijeme početnog čitanja podataka -->
            <div v-if="loading" class="empty-test">
                UČITAVANJE TESTOVA
            </div>

            <!-- Sažetak se prikazuje kada je odabrana vrsta testa -->
            <template v-else-if="selectedTestType">
                <!-- Početni rezultat -->
                <div class="result-row">
                    <span class="result-label">Početni rezultat:</span>
                    <strong class="result-value">
                        {{ formatValue(initialValue) }}
                        {{ selectedTestType.unit }}
                    </strong>
                </div>

                <!-- Posljednji rezultat -->
                <div class="result-row">
                    <span class="result-label">Zadnji rezultat:</span>
                    <strong class="result-value">
                        {{ formatValue(latestValue) }}
                        {{ selectedTestType.unit }}
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

            <!-- Poruka kada nema vrsta testova -->
            <div v-else class="empty-test">
                NEMA DOSTUPNIH VRSTA TESTOVA
            </div>

            <!-- Razdjelna crta između sažetka i grafikona -->
            <div class="section-separator"></div>

            <!-- Naslov grafikona -->
            <div class="statistics-title">TESTOVI KLIJENTA KROZ VRIJEME</div>

            <!-- Filteri vremenskog razdoblja -->
            <div class="chart-period-filters">
                <!-- Pojedinačni filter -->
                <button
                    v-for="period in testPeriods"
                    :key="period.id"
                    type="button"
                    class="chart-period-filter"
                    :class="{
                        'chart-period-filter-active':
                            selectedTestPeriod === period.id
                    }"
                    @click="selectedTestPeriod = period.id"
                >
                    {{ period.label }}
                </button>
            </div>

            <!-- Grafikon kada postoje zapisi u odabranom razdoblju -->
            <div
                v-if="filteredTestHistory.length > 0"
                class="chart-container"
            >
                <TestsLineChart
                    :data="filteredTestHistory"
                    :period="selectedTestPeriod"
                    :unit="selectedTestType?.unit || ''"
                />
            </div>

            <!-- Poruka kada nema podataka za grafikon -->
            <div v-else class="chart-placeholder-empty-text">
                NEMA PODATAKA ZA ODABRANO RAZDOBLJE
            </div>
        </div>

        <!-- Kontejner posljednjih testova -->
        <div class="test-history-container">
            <!-- Naslov povijesti -->
            <div class="statistics-title">POSLJEDNJI TESTOVI </div>

            <!-- Poruka kada klijent nema nijedan zapis -->
            <div v-if="allTests.length === 0 && !loading" class="empty-test">
                ZA KLIJENTA JOŠ NEMA SPREMLJENIH TESTOVA
            </div>

            <!-- Poruka kada odabrana vrsta nema zapisa -->
            <div
                v-else-if="visibleTests.length === 0 && !loading"
                class="empty-test"
            >
                ZA ODABRANU VRSTU TESTA NEMA SPREMLJENIH ZAPISA TESTOVA
            </div>

            <!-- Kartica svakog pojedinačnog testa -->
            <div
                v-for="test in visibleTests"
                :key="test.id"
                class="test-card"
             >
                <!-- Zaglavlje kartice -->
                <div class="test-card-header">
                    <!-- Naslov kartice -->
                    <div class="test-card-title">DETALJI TESTA</div>

                    <!-- Gumb za brisanje zapisa -->
                    <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        aria-label="Obriši test"
                        class="delete-test-button"
                        @click="deleteTest(test)"
                    />
                </div>

                <!-- Datum zapisa -->
                <div class="test-row">
                    <span class="test-label">Datum testa:</span>
                    <span class="test-value"> {{formatDate(test.date) }} </span>
                </div>

                <!-- Vrijednost zapisa -->
                <div class="test-row">
                    <span class="test-label">Rezultat testa:</span>
                    <span class="test-value">
                        {{ formatValue(test.value) }}
                        {{ test.unit }}
                    </span>
                </div>

                <!-- bilješka testa -->
                <div class="test-row test-note-row">
                    <div class="test-label"> Bilješka testa: </div>
                    <div class="test-note-box"> {{ test.note || 'Bilješka testa nije navedena' }} </div>
                </div>
            </div>

            <!-- Gumb PRIKAŽI VIŠE za prikaz sljedećih pet zapisa -->
            <div
                v-if="visibleTestCount < filteredTests.length"
                class="show-more-container"
            >
                <q-btn
                    flat
                    rounded
                    class="show-more-button"
                    label="PRIKAŽI VIŠE"
                    @click="showMoreTests"
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
// Servis za čitanje i spremanje testova
import testsService from '@/services/tests.service'
// Komponenta linijskog grafikona
import TestsLineChart from '@/components/TestsLineChart.vue'

//podaci klijenta stižu iz roditeljske komponente
const props = defineProps({
    ///objekt klijenta sadrži njegov ID
    client: {type: Object, required: true}
}) //const props zagrada

//VARIJABLE:
const testTypes = ref([]) //popis vrsta testova
const allTests = ref([])  //svi zapisi testova klijenta
const selectedTestTypeId = ref(null) //ID odabrane vrste testa
const selectedTestPeriod = ref('1m') //trenutačni filter grafikona
const visibleTestCount = ref(5)  //broj zapisa testova prikazanih u popisu zapisa testova sa detaljima
const loading = ref(false) //oznaka početnog čitanja podataka
//filteri - dostupna vremenska razdoblja (graf)
const testPeriods = [
  {id: '1m', label: '1 MJ'},
  {id: '6m', label: '6 MJ'},
  {id: '1y', label: '1 GOD'},
  {id: 'all', label: 'SVE'}
] //const testPeriods zagrada

//PORUKE ZA NAPREDAK - PROGRESS BAR
const progressPoruka = computed(() => {
    const initial = initialValue.value //provjera početne vrijednosti
    if(initial === null || initial === undefined) {
        return 'Nema početne vrijednosti za odabranu vrstu testa'
    } //if zagrada
    //početna vrijednost ne smije bit 0
    if(Number(initial) === 0){
        return 'Postotak promjene nije moguće izračunati jer je početna vrijednost jednaka nuli'
    } //if zagrada
    //provjera postoji li spremljeno mjerenje za zadnji rezultat
    if(latestValue.value === null || latestValue.value === undefined) {
        return 'Ne postoji zadnji rezultat odabrane vrste testa za izračun postotne promjene'
    } //if zagrada
    //rezervna poruka za ostale slučaje bez postotka
    return 'Postotak promjene trenutno nije moguće izračunati'
}) //const progressPoruka zagrada

//trenutno odabrana vrsta testa
const selectedTestType = computed(() => {
    //traženje vrste prema njezinu ID-u
    return testTypes.value.find(
        type => type.id === Number(selectedTestTypeId.value)
    ) || null
}) //selectedTestType zagrada

//naziv odabrane vrste prikazuje se velikim slovima
const selectedTestTypeName = computed(() => {
    //ako nije odabrana vrsta, tekst ostaje prazan
    return selectedTestType.value
    ? selectedTestType.value.name.toUpperCase()
    : ''
}) //selectedTestTypeName zagrada

// Zapisi samo za trenutačno odabranu vrstu testova
const filteredTests = computed(() => {
    //bez odabrane vrste nema zapisa za prikaz
    if(!selectedTestTypeId.value) { return [] }

    //filtriranje prema ID-u vrste testa
    return allTests.value.filter(
        test => Number(test.testTypeId) === Number(selectedTestTypeId.value)
    ) //return zagrada
}) // filteredTest zagrada

//povijest je sortirana kronološki prema datumu i ID-u zapisa
const chronologicalTests = computed(() => {
    //kopiranje niza prije sortiranja kako se izvorni niz ne bi mijenjao
    return [...filteredTests.value].sort((a,b) => {
        //usporedba datuma zapisa
        const dateDifference = String(a.date).localeCompare(String(b.date))

        //ako su datumi jednaki, uspoređuju se ID-evi zapisa
        if(dateDifference === 0) {
            return Number(a.id) - Number(b.id)
        } //if zagrada

        //vraća kronološki poredak
        return dateDifference
    }) //return zagrada
}) //chronologicalTests zagrada

//POČETNI REZULTAT ZA TRENUTAČNO ODABRANU VRSTU
const initialValue = computed(() => {
    //bez vrste mjerenja početna vrijednost nije dostupna
    if(!selectedTestType.value) { return null }
    
    //vrste koriste najstariji kronološki zapis
    const firstTest = chronologicalTests.value[0]
    
    //bez zapisa početna vrijednost nije dostupna
    return firstTest ? firstTest.value : null
}) //initialValue zagrada
//NAJNOVIJI ZAPIS ZA TRENUTAČNO ODABRANU VRSTU JE ZADNJI REZULTAT
const latestValue = computed(() => {
    //posljednji element kronološki sortiranog niza je najnoviji zapis
    const lastTest = chronologicalTests.value[chronologicalTests.value.length - 1]

    //bez zapisa najnovija vrijednost nije dostupna
    return lastTest ? lastTest.value : null
}) //latestValue zagrada
//POSTOTNA PROMJENA IZMEĐU POČETNE I NAJNOVIJE VRIJEDNOSTI
const progressPercent = computed(() => {
    //čitanje početne i posljednje vrijednosti
    const initial = initialValue.value
    const latest = latestValue.value

    //ako nedostaje jedna vrijednosti, postotak se ne može izračunati
    if(
        initial === null || initial === undefined 
        || latest === null || latest === undefined
    ) {return null }

    //nulta početna vrijednost ne dopušta dijeljenje
    if (Number(initial) === 0) { return null }

    //promjena se računa u odnosu na početnu vrijednost
    return ((Number(latest) - Number(initial)) / Number(initial)) * 100
}) //progressPercent zagrada

//TEKST NAPRETKA SA STRELICOM I PREDZNAKOM (-/+)
const progressText = computed(() => {
    //kada nema valjanog postotka, prikazuje se crtica
    if(progressPercent.value === null) {return '-'}

    //promjena se zaokružuje na dvije decimale
    const roundedChange = Math.round(progressPercent.value * 100) / 100

    //jednaka početna i završna vrijednost prikazuju nulti napredak
    if(roundedChange === 0) {return '→ 0%'}

    //pozitivna promjena prikazuju strelicu prema gore
    if(roundedChange > 0) {return `↑ +${roundedChange.toFixed(2)}%` }

    //negativna promjena prikazuje strelicu prema dolje
    return `↓ ${roundedChange.toFixed(2)}%`
}) //progressText zagrada

//DULJINA TRAKE PRATI APSOLUTNU VELIČINU PROMJENE
const progressBarValue = computed(() => {
    //traka ostaje prazna ako se postotak ne može izračunati
    if(progressPercent.value === null) {return 0}

    //prikaz trake ograničen je na raspon od nula do jedan
    return Math.min(Math.abs(progressPercent.value) / 100, 1)
}) //progressBarValue zagrada

//ZAPISI SORTIRANI OD NAJNOVIJEG PREMA NAJSTARIJEM
const newestFirstTests = computed(() => {
    //kopiranje kronološkog niza i obrtanje redoslijeda
    return [...chronologicalTests.value].reverse()
}) //newestFirstTests zagrada

//TRENUTNO VIDLJIV DIO POVIJESTI TESTA
const visibleTests = computed(() => {
    //prikaz prvih 5 zapisa ili slijedećih 5 nakon klika
    return newestFirstTests.value.slice(0, visibleTestCount.value)
}) //visibleTests zagrada

//POVIJEST ZA GRAFIKON UNUTAR ODABRANOG RAZDOBLJA
const filteredTestHistory = computed(() => {
    //grafikonu se šalju samo zapisi odabrane vrste testa
    const history = chronologicalTests.value

    //za opciju SVE vraća se cijela povijest
    if(selectedTestPeriod.value === 'all'){
        return history.map(test => ({
            date: test.date,
            value: test.value
        })) //return zagrada
    } //if zagrada

    //određivanje početka vremenskog razdoblja
    const startDate = getPeriodStartDate(selectedTestPeriod.value)

    //kraj razdoblja postavlja se na kraj današnjeg dana
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    //zadržavaju se samo zapisi unutar odabranog razdoblja
    return history
        .filter(test => {
            //zapis bez datuma nije prikladan za graf
            if(!test.date) {return false}

            //pretvaranje datuma u lokalni Date objekt
            const testDate = new Date (`${test.date}T00:00:00`)
            //neispravan datum isključuje se iz grafa
            if (Number.isNaN(testDate.getTime())) {return false }
            //provjera granica odabranog razdoblja
            return testDate >= startDate && testDate <= endDate
        }) //.filter zagrada
        .map(test => ({
            date: test.date, //datum ostaje stvari datum spremljenog testa
            value: test.value //vrijednost ostaje stvarna spremljena vrijednost
        })) //.map zagrada
}) //filteredTestHistory zagrada

//FUNKCIJA ZA POČETNI DATUM PREMA FILTERU GRAFIKONA
function getPeriodStartDate(period) {
    const today = new Date()  //današnji datum prema lokalnom vremenu
    today.setHours(0, 0, 0, 0) //postavljanje vremena na početak dana

    //početak razdoblja od jednog mjeseca
    if(period === '1m') {
        const startDate = new Date(today)
        startDate.setMonth(startDate.getMonth() - 1)
        return startDate
    } //if zagrada

    //poečetak razdoblja od 6mj
    if(period === '6m') {
        const startDate = new Date(today)
        startDate.setMonth(startDate.getMonth() - 6)
        return startDate
    } //if zagrada

    //početak razdoblja od 1god    
    const startDate = new Date(today)
    startDate.setFullYear(startDate.getFullYear() - 1)
    return startDate   
} //getPeriodStartDate zagrada

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

//FUNKCIJA ZA FORMATIRANJE BROJČANE VRIJEDNOSTI ZA PRIKAZ
function formatValue(value) {
    //ako vrijednost nije dostupna prikazuje se crtica
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return '—'
    } // if zagrada

    // Broj prikazuje se s najviše dvije decimale
    return Number(value).toLocaleString('hr-HR', {
        maximumFractionDigits: 2
    }) //return zagrada
} //formatValue zagrada

//FUNKCIJA ZA OTVARANJE OBRASCA ZA UNOS NOVOG TESTA 
function addTest(){
    //provjera postoji li klijent
    if(!props.client?.id) { return }
    //navigacija na zasebna ekran za unos
    router.push(`/dashboard/clients/${props.client.id}/test/new`)
} //addTest zagrada

//FUNKCIJA ZA ČITANJE VRSTA I ZAPISA TESTOVA
async function loadTests() {
    //uključivanje oznake učitavanja
    loading.value = true

    //pokušaj čitanja potrebnih podataka
    try{
        //čitanje vrsta testova iz servisa
        testTypes.value = await testsService.getTestTypes()
        //čitanje zapisa testova iz servisa
        const rezultat = await testsService.getClientTests(props.client.id)

        //spremanje svih zapisa testova
        allTests.value = rezultat.tests

        //zadržavanje odabrane vrste testa iz query parametra ako je valjana
        const queryTypeId = Number(route.query.testTypeId)
        const queryTypeExists = testTypes.value.some(
            type => type.id === queryTypeId
        )

        //primjena vrste poslane s obrasca za unos
        if(Number.isInteger(queryTypeId) && queryTypeExists) {
            selectedTestTypeId.value = queryTypeId
        } else if (!testTypes.value.some(
            type => type.id === Number(selectedTestTypeId.value)
        )) {
            //početni odabir je prva dostupna vrsta testa
            selectedTestTypeId.value = testTypes.value[0]?.id ?? null
        } //else if zagrada
    } catch(error){
        console.error('Greška pri čitanju testova klijenta: ', error)

        //prazne vrijednosti omogućuju prikaz sigurnog praznog stanja
        allTests.value = []
        testTypes.value = []
        
        Notify.create({
            message: 'Greška pri čitanju testova klijenta',
            type: 'negative',
            position: 'top'
        }) //notify zagrada

    }finally{
        loading.value = false //isključivanje oznake učitavanja
    } //finally zagrada

} //loadTests zagrada

//FUNKCIJA ZA PRIKAZ DODATNIH ZAPISA POVIJESTI
function showMoreTests() {
    visibleTestCount.value += 5 //povećanje broja vidljiv zapisa za još 5

    //broj vidljivih zapisa ne prelazi ukupan broj zapisa
    if(visibleTestCount.value > filteredTests.value.length) {
        visibleTestCount.value = filteredTests.value.length
    } //if zagrada
} //showMoreTests zagrada

//FUNKCIJA ZA BRISANJE POJEDINAČNOG ZAPISA TESTA KLIJENTA
async function deleteTest(test){
    if(!test) {return } //provjera postoji li zapis testa klijenta

    //potvrda prije trajnog brisanja
    const confirmed = window.confirm(
        'Jeste li sigurni da želite obrisati ovaj test klijenta?'
    ) //confirmed zagrada
    if(!confirmed) { return } //prekid brisanja ako nije potvrđeno

    //pokušaj brisanja
    try{
        //poziv metode iz servisa
        const rezultat = await testsService.deleteTest(test.id)

        //provjera rezultata prema formatu povratne vrijednosti adaptera
        if(rezultat === 0 || rezultat?.changes === 0) {
            Notify.create({
                message: 'Test klijenta nije pronađen ili nije obrisan',
                type: 'negative',
                position:'top'
            }) //notify zagrada
            return //prekid postupka
        } //if zagrada

        //poziv funkcije za ponovno čitanje podataka nakon brisanja
        await loadTests()

        Notify.create({
            message: 'Uspješno brisanje testa klijenta',
            type: 'positive',
            position: 'top'
        }) //notify zagrada

    } catch(error){
        console.error('Greška kod brisanje testa klijenta: ', error)

        Notify.create({
            message: 'Greška pri brisanju testa klijenta',
            type: 'negative',
            positon: 'top'
        }) //notify zagrada
    } //catch zagrada
} //deleteTest zagrada

//PONOVNO POSTAVLJANJE BROJA KARTICA NAKON PROMJENE VRSTE
watch(selectedTestTypeId, () => {
    visibleTestCount.value = 5 //postavljanje najviše 5 broja zapisa testa klijenta kod početnog prikaza
    selectedTestPeriod.value = '1m' //nakon promjene vrste, grafikon se vraća na filter 1 mjesec (to je uključen filter kod početnog prikaza)
}) //watch zagrada

//POČETNO UČITAVANJE TESTOVA PRI PRIKAZU KARTICE
onMounted(async () => {
    await loadTests() //poziv funkcije za čitanje podataka testova klijenta
}) //onMounted zagrada

</script>

<style scoped>

/* Glavni kontejner kartice testova */
.test-tab {
    width: 100%;
    min-width: 0;
}

/* Kontejner gumba za unos */
.add-test-container {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 22px;
}

/* Gumb za dodavanje testova */
.add-test-button {
    background: #BDC4D4;
    color: #0F1A2B;
    font-weight: 600;
}

/* Kontejner sa sažetkom i grafikonom */
.test-statistics-container {
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

/* Kontejner povijesti testova */
.test-history-container {
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
.test-select {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 20px 0;
    min-width: 0;
}

/* Oznaka izbornika */
.test-select-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
    flex-shrink: 0;
}

/* Izbornik zauzima preostali prostor */
.test-select-control {
    flex: 1;
    min-width: 0;
    min-height: 42px;
}

/* Pozadina izbornika */
:deep(.test-type-popup) {
    background: #1C2E4A;
    color: #BDC4D4;
    border-radius: 12px;
    border: none;
    padding: 4px 0;
}

/* Tekst opcija izbornika */
:deep(.test-type-popup .q-item) {
    color: #BDC4D4;
    font-size: 14px;
    border: none;
}

/* Trenutačno odabrana opcija */
:deep(.test-type-popup .q-item--active) {
    background: rgba(168, 185, 204, 0.18);
    color: #BDC4D4;
    border: none;
}

/* Izgled izbornika */
:deep(.test-select-control .q-field__control) {
    background: #A8B9CC;
    border-radius: 12px;
    border: none;
    min-height: 42px;
}

/* Tekst odabrane vrste */
:deep(.test-select-control .q-field__native),
:deep(.test-select-control .q-field__input) {
    color: #0F1A2B;
    font-weight: 600;
    justify-content: center;
}

/* Strelica izbornika */
:deep(.test-select-control .q-icon) {
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
.empty-test {
    text-align: center;
    padding: 20px 10px;
    color: rgba(189, 196, 212, 0.65);
    font-size: 13px;
}

/* Kartica pojedinačnog testa */
.test-card {
    border: 1px solid rgba(189, 196, 212, 0.25);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
    box-sizing: border-box;
}

/* Naslov kartice i gumb brisanja */
.test-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;
}

/* Naslov detalja testa */
.test-card-title {
    color: #BDC4D4;
    font-size: 16px;
    font-weight: 700;
}

/* Gumb brisanja zapisa */
.delete-test-button {
    color: #52677D;
}

/* Red pojedinog podatka */
.test-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
}

/* Oznaka datuma ili rezultata */
.test-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
}

/* Stvarna vrijednost datuma ili rezultata */
.test-value {
    color: #BDC4D4;
    font-size: 14px;
    overflow-wrap: anywhere;
}
/*RED BILJEŠKE - LABELA IZNAD OKVIRA */
.test-note-row {
    display: block;
}
/* KONKRETNA VRIJEDNOST BILJEŠKE (OKVIR) */
.test-note-box {
  border: 1px solid rgba(189, 196, 212, 0.25);  /* Obrub bilješke. */
  border-radius: 10px;    /* Zaobljeni rubovi. */
  padding: 10px;       /* Unutarnji razmak. */
  color: #BDC4D4;
  min-height: 40px;     /* Minimalna visina. */
  box-sizing: border-box;    /* Box model. */
  overflow-wrap: anywhere;    /* Omogućuje prijelom dugog teksta. */
  margin-top: 10px;          /* gornji razmak između teksta bilješke/kontejnera i labele Bilješka testa: */
  width: 100%;          /* Širina okvira bilješke zauzima cijeli raspoloživi prostor. */
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