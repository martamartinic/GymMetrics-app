<!-- EKRAN ZA DODAVANJE VJEŽBI VRSTAMA TRENINGA -->
 <!-- EKRAN ZA DODAVANJE NOVE VJEŽBE VRSTAMA TRENINGA -->

<template>

    <!-- Glavna stranica za dodavanje vježbe -->
    <q-page class="add-exercise-page">

        <!-- Glavni sadržaj stranice -->
        <div class="page-content">

            <!-- Zaglavlje stranice -->
            <div class="page-header">

                <!-- Naslov u dva retka -->
                <div class="page-title">
                    <span>DODAVANJE VJEŽBE</span>
                    <span>VRSTAMA TRENINGA</span>
                </div>

                <!-- Gumb za zatvaranje stranice -->
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    aria-label="Zatvori"
                    class="close-button"
                    @click="closePage"
                />

            </div>

            <!-- Područje koje omogućuje pomicanje sadržaja -->
            <div class="page-scroll-area">

                <!-- Obrazac za unos nove vježbe -->
                <q-form @submit.prevent="saveExercise">

                    <!-- Kontejner s podacima nove vježbe -->
                    <div class="exercise-container">

                        <!-- Polje za unos naziva vježbe -->
                        <q-input
                            v-model="exerciseName"
                            outlined
                            rounded
                            dark
                            color="primary"
                            label="Naziv vježbe"
                            aria-label="Naziv vježbe"
                            autocomplete="off"
                            class="exercise-input"
                            :rules="[
                                value => !!String(value ?? '').trim() || 'Naziv vježbe je obavezan'
                            ]"
                        />

                        <!-- Razmak između polja -->
                        <q-space class="q-my-sm" />

                        <!-- Oznaka padajućeg izbornika mišićnih skupina -->
                        <div class="form-label">
                            MIŠIĆNA SKUPINA:
                        </div>

                        <!-- Padajući izbornik postojećih mišićnih skupina -->
                        <q-select
                            v-model="selectedMuscleGroup"
                            :options="muscleGroups"
                            outlined
                            rounded
                            dense
                            dark
                            color="primary"
                            aria-label="Odabir mišićne skupine"
                            class="form-select"
                            popup-content-class="exercise-select-popup"
                            behavior="menu"
                            :loading="loadingMuscleGroups"
                            :disable="loadingMuscleGroups || muscleGroups.length === 0"
                            :display-value="selectedMuscleGroup ? selectedMuscleGroup.toUpperCase() : ''"
                            
                        />

                        <!-- Razmak između polja i popisa vrsta treninga -->
                        <q-space class="q-my-md" />

                        <!-- Oznaka popisa vrsta treninga -->
                        <div class="training-types-label">
                            VRSTE TRENINGA:
                        </div>

                        <!-- Prikaz učitavanja vrsta treninga -->
                        <div
                            v-if="loadingTrainingTypes"
                            class="loading-container"
                        >
                            <q-spinner
                                color="primary"
                                size="32px"
                            />
                            <div>Učitavanje vrsta treninga...</div>
                        </div>

                        <!-- Poruka ako nema dostupnih vrsta treninga -->
                        <div
                            v-else-if="trainingTypes.length === 0"
                            class="empty-message"
                        >
                            Trenutno nema unesenih vrsta treninga
                        </div>

                        <!-- Popis checkboxova za odabir vrsta treninga -->
                        <div
                            v-else
                            class="training-types-checkboxes"
                        >

                            <!-- Pojedinačni checkbox za svaku vrstu treninga -->
                            <q-checkbox
                                v-for="trainingType in trainingTypes"
                                :key="trainingType.id"
                                v-model="selectedTrainingTypeIds"
                                :val="trainingType.id"
                                :label="trainingType.name"
                                color="primary"
                                keep-color
                                dark
                                class="training-type-checkbox"
                            />

                        </div>

                    </div>

                    <!-- Gumb za spremanje nove vježbe -->
                    <q-btn
                        unelevated
                        rounded
                        color="primary"
                        type="submit"
                        label="SPREMI"
                        class="save-button"
                        :loading="saving"
                        :disable="
                            saving ||
                            loadingTrainingTypes ||
                            loadingMuscleGroups ||
                            trainingTypes.length === 0 ||
                            muscleGroups.length === 0
                        "
                    />

                </q-form>

            </div>

        </div>

    </q-page>

</template>


<script setup>

// Uvoz potrebnih Vue funkcija
import { onMounted, ref } from 'vue'

// Uvoz Quasar obavijesti
import { Notify } from 'quasar'

// Uvoz routera za navigaciju
import {  useRoute, useRouter } from 'vue-router'
const router = useRouter() // Stvaranje router instance
const route = useRoute() // Dohvat aktivne rute

// Uvoz servisa za vježbe
import exerciseService from '@/services/exercise.service.js'

// Uvoz servisa za vrste treninga
import trainingTypeService from '@/services/training-type.service.js'


// SPREMANJE PODATAKA O NOVOJ VJEŽBI

// Naziv nove vježbe koju unosi korisnik
const exerciseName = ref('')

// Odabrana mišićna skupina
const selectedMuscleGroup = ref(null)

// Popis svih postojećih mišićnih skupina
const muscleGroups = ref([])

// Popis svih postojećih vrsta treninga
const trainingTypes = ref([])

// ID-evi svih označenih vrsta treninga
const selectedTrainingTypeIds = ref([])


// STANJA UČITAVANJA I SPREMANJA

// Prati učitavanje mišićnih skupina
const loadingMuscleGroups = ref(false)

// Prati učitavanje vrsta treninga
const loadingTrainingTypes = ref(false)

// Prati spremanje nove vježbe
const saving = ref(false)


// FUNKCIJA ZA DOHVAT POSTOJEĆIH MIŠIĆNIH SKUPINA
async function loadMuscleGroups() {
    // Uključivanje pokazatelja učitavanja
    loadingMuscleGroups.value = true

    try {
        // Dohvat postojećih mišićnih skupina iz baze
        muscleGroups.value = await exerciseService.getMuscleGroups()
        
        // Automatski odabir prve mišićne skupine ako postoje dostupne opcije
        if (muscleGroups.value.length > 0) {
            selectedMuscleGroup.value = muscleGroups.value[0]
        } //if zagrada

    } catch (error) {

        // Zapis greške u razvojnu konzolu
        console.error('Greška pri dohvaćanju mišićnih skupina:', error)

        // Obavijest o neuspješnom dohvaćanju
        Notify.create({
            message: 'Greška pri dohvaćanju mišićnih skupina',
            type: 'negative',
            position: 'top'
        })

    } finally {

        // Isključivanje pokazatelja učitavanja
        loadingMuscleGroups.value = false

    }

} // loadMuscleGroups


// DOHVAT POSTOJEĆIH VRSTA TRENINGA

async function loadTrainingTypes() {

    // Uključivanje pokazatelja učitavanja
    loadingTrainingTypes.value = true

    try {

        // Dohvat svih vrsta treninga iz baze
        trainingTypes.value = await trainingTypeService.getTrainingTypes()

    } catch (error) {

        // Zapis greške u razvojnu konzolu
        console.error('Greška pri dohvaćanju vrsta treninga:', error)

        // Obavijest o neuspješnom dohvaćanju
        Notify.create({
            message: 'Greška pri dohvaćanju vrsta treninga',
            type: 'negative',
            position: 'top'
        })

    } finally {

        // Isključivanje pokazatelja učitavanja
        loadingTrainingTypes.value = false

    }

} // loadTrainingTypes


// FUNKCIJA ZA ZATVARANJE EKRANA BEZ SPREMANJA
function closePage() {
    // Povratak na popis vrsta treninga bez prosljeđivanja prethodno odabrane vrste
    //router.push('/dashboard/vrste-treninga')

    // Povratak na popis i zadržavanje vrste treninga s koje je otvoren ekran
    router.push({
        path: '/dashboard/vrste-treninga',
        query: route.query.trainingTypeId
            ? { trainingTypeId: String(route.query.trainingTypeId) }
            : {}
    })

} // closePage

// FUNKCIJA ZA SPREMANJE NOVE VJEŽBE
async function saveExercise() {
    // Uklanjanje suvišnih razmaka iz naziva vježbe
    const name = exerciseName.value.trim()

    // Provjera obveznog naziva vježbe
    if (!name) {
        Notify.create({
            message: 'Naziv vježbe je obavezan',
            type: 'warning',
            position: 'top'
        })
        return
    } //if zagrada

    // Provjera obvezne mišićne skupine
    if (!selectedMuscleGroup.value) {
        Notify.create({
            message: 'Odaberite mišićnu skupinu',
            type: 'warning',
            position: 'top'
        })
        return
    } // if zagrada

    // Provjera je li odabrana barem jedna vrsta treninga
    if (selectedTrainingTypeIds.value.length === 0) {
        Notify.create({
            message: 'Odaberite barem jednu vrstu treninga',
            type: 'warning',
            position: 'top'
        })
        return
    } // if zagrada

    // Sprječavanje višestrukog pokretanja spremanja
    if (saving.value) { return }

    // Uključivanje pokazatelja spremanja
    saving.value = true

    try {
        // Spremanje vježbe i poveznica s odabranim vrstama treninga
        await exerciseService.createExercise({
            // Naziv nove vježbe
            name: name,
            // Odabrana mišićna skupina
            muscleGroup: selectedMuscleGroup.value,
            // ID-evi označenih vrsta treninga
            trainingTypeIds: selectedTrainingTypeIds.value
        })

        // Obavijest o uspješnom spremanju
        Notify.create({
            message: 'Vježba je uspješno spremljena',
            type: 'positive',
            position: 'top'
        })

        // Prva odabrana vrsta treninga postaje odabrana nakon povratka na popis
        const trainingTypeIdToShow = selectedTrainingTypeIds.value[0]

        // Povratak na popis i prosljeđivanje ID-a prve odabrane vrste treninga
        await router.replace({
            path: '/dashboard/vrste-treninga',
            query: {
                trainingTypeId: String(trainingTypeIdToShow)
            }
        })

    } catch (error) {
        // Zapis stvarne greške u razvojnu konzolu
        console.error('Greška pri spremanju vježbe:', error)

        // Dohvat teksta greške radi prepoznavanja duplikata
        const errorMessage = String(error?.message || '').toLowerCase()

        // Određivanje poruke za korisnika
        const message =
            errorMessage.includes('unique') ||
            errorMessage.includes('constraint')
                ? 'Vježba s tim nazivom već postoji'
                : error?.message || 'Greška pri spremanju vježbe'

        // Prikaz obavijesti o grešci
        Notify.create({
            message,
            type: 'negative',
            position: 'top',
            timeout: 5000
        })

    } finally {
        // Isključivanje pokazatelja spremanja
        saving.value = false
    } // finally zagrada

} // saveExercise


// POČETNO UČITAVANJE PODATAKA PRI OTVARANJU EKRANA

onMounted(async () => {

    // Istovremeni dohvat mišićnih skupina i vrsta treninga
    await Promise.all([
        loadMuscleGroups(),
        loadTrainingTypes()
    ])

}) // onMounted

</script>


<style scoped>

/* Glavna pozadina stranice */
.add-exercise-page {
    background: var(--q-dark-page);
    height: 100%;
    overflow: hidden;
}

/* Glavni raspored sadržaja stranice */
.page-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
}

/* Zaglavlje stranice */
.page-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 58px;
    flex-shrink: 0;
}

/* Naslov stranice u dva retka */
.page-title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: #BDC4D4;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.25;
    text-align: center;
    padding: 0 42px;
}

/* Gumb za zatvaranje stranice */
.close-button {
    position: absolute;
    right: 0;
    color: #BDC4D4;
}

/* Područje za pomicanje sadržaja */
.page-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px 28px;
    box-sizing: border-box;
}

/* Kontejner za unos vježbe i odabir pripadajućih podataka */
.exercise-container {
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 12px;
    padding: 16px 12px;
    box-sizing: border-box;
}

/* Polje za unos naziva vježbe */
.exercise-input {
    margin-top: 6px;
    margin-bottom: 10px;
}

/* Oznaka polja i popisa */
.form-label,
.training-types-label {
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
    margin: 8px 0 12px;
}

/* Padajući izbornik mišićnih skupina */
.form-select {
    width: 100%;
    margin-bottom: 8px;
}
/* Pozadina kontrola padajućeg izbornika */
:deep(.form-select .q-field__control) {
    background: #A8B9CC;
    border-radius: 12px;
    min-height: 42px;
}
/* Tekst odabrane opcije - padajućeg izbornika */
:deep(.form-select .q-field__native) {
    color: #0F1A2B;
    font-weight: 600;
    justify-content: center;
    text-align: center;
}
/* Ikona strelice padajućeg izbornika */
:deep(.form-select .q-icon) {
    color: #0F1A2B;
}

/* Pozadina otvorenog padajućeg izbornika */
:deep(.exercise-select-popup) {
    background: #1C2E4A;
    color: #BDC4D4;
    border-radius: 12px;
    border: none;
    padding: 4px 0;
}
/* Pojedinačne opcije otvorenog izbornika */
:deep(.exercise-select-popup .q-item) {
    color: #BDC4D4;
    font-size: 14px;
}
/* Označena opcija u padajućem izborniku */
:deep(.exercise-select-popup .q-item--active) {
    background: rgba(168, 185, 204, 0.18);
    color: #BDC4D4;
}
/* Centriranje teksta opcija u otvorenom izborniku */
:deep(.exercise-select-popup .q-item__section) {
    text-align: center;
    justify-content: center;
    align-items: center;
}

/* Raspored checkboxova vrsta treninga */
.training-types-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px 12px;
    width: 100%;
}

/* Pojedinačni checkbox vrste treninga */
.training-type-checkbox {
    color: #BDC4D4;
    min-width: 0;
}

/* Omogućavanje prijeloma dugih naziva vrsta treninga */
:deep(.training-type-checkbox .q-checkbox__label) {
    white-space: normal;
    line-height: 1.3;
}

/* Prikaz učitavanja podataka */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #BDC4D4;
    padding: 24px 0;
}

/* Poruka kada nema dostupnih podataka */
.empty-message {
    color: #A8B9CC;
    text-align: center;
    padding: 20px 8px;
    font-size: 14px;
}

/* Gumb za spremanje nove vježbe */
.save-button {
    width: 100%;
    min-height: 46px;
    background: #BDC4D4;
    font-weight: 700;
    margin-top: 22px;
}


</style>