<!-- EKRAN ZA DODAVANJE NOVE VRSTE TRENINGA -->


<template>
    <q-page class="add-training-type-page">

        <!-- Glavni sadržaj stranice -->
        <div class="page-content">

            <!-- Zaglavlje stranice -->
            <div class="page-header">

                <!-- Naslov stranice -->
                <div class="page-title">
                    DODAVANJE VRSTE TRENINGA
                </div>

                <!-- Gumb za povratak na popis vrsta treninga -->
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    class="close-button"
                    @click="closePage"
                />

            </div>

            <!-- Područje koje omogućuje pomicanje sadržaja -->
            <div class="page-scroll-area">

                <!-- Obrazac za unos nove vrste treninga -->
                <q-form @submit.prevent="saveTrainingType">

                    <!-- Kontejner s podacima nove vrste treninga -->
                    <div class="training-type-container">

                        <!-- Polje za unos naziva nove vrste treninga -->
                        <q-input
                            v-model="trainingTypeName"
                            outlined
                            rounded                            
                            dark
                            color="primary"
                            label="Naziv vrste treninga"
                            aria-label="Naziv vrste treninga"
                            class="training-type-input"
                            :rules="[
                                value => !!value.trim() || 'Naziv vrste treninga je obavezan'
                            ]"
                        />

                        <!-- RED S OZNAKOM POPISA VJEŽBI I GUMBIMA ZA EXPAND/COLLAPSE ALL -->
                        <div class="exercises-section-header">

                            <!-- Oznaka popisa vježbi -->
                            <div class=" exercises-label">
                                VJEŽBE VRSTE TRENINGA:
                            </div>

                        </div>

                        <!-- Prikaz učitavanja vježbi -->
                        <div v-if="loadingExercises" class="loading-container">
                            <q-spinner
                                color="primary"
                                size="32px"
                            />
                            <div>Učitavanje vježbi...</div>
                        </div>

                        <!-- Poruka ako u bazi nema vježbi -->
                        <div
                            v-else-if="groupedExercises.length === 0"
                            class="empty-message"
                        >
                            Trenutno nema unesenih vježbi
                        </div>

                        <!-- Popis vježbi grupiranih prema mišićnim skupinama -->
                        <div v-else class="exercise-groups">

                            <!-- Ponavlja grupu za svaku mišićnu skupinu -->
                            <div
                                v-for="group in groupedExercises"
                                :key="group.name"
                                class="muscle-group"
                            >

                                <!-- NASLOV MIŠIĆNE SKUPINE S GUMBOM ZA EXPAND/COLLAPSE -->
                                <div
                                    class="muscle-group-header"
                                    @click="toggleMuscleGroup(group.name)"
                                >

                                <!-- Naslov mišićne skupine -->
                                <span class="muscle-group-title">
                                    {{ group.name }}
                                </span>

                                <!-- IKONA KOJA PRIKAZUJE STANJE MIŠIĆNE SKUPINE -->
                                <q-icon
                                    :name="expandedMuscleGroups.includes(group.name)
                                    ? 'keyboard_arrow_up'
                                    : 'keyboard_arrow_down'"
                                    size="24px"
                                    class="muscle-group-toggle-icon"
                                />

                            </div>

                                <!-- Popis checkboxova za odabir vježbi -->
                                <div 
                                    v-if="expandedMuscleGroups.includes(group.name)"
                                    class="exercises-checkboxes"
                                >

                                    <!-- Ponavlja checkbox za svaku vježbu -->
                                    <q-checkbox
                                        v-for="exercise in group.exercises"
                                        :key="exercise.id"
                                        v-model="selectedExercises"
                                        :val="exercise.id"
                                        :label="exercise.name"
                                        color="primary"
                                        keep-color
                                        dark
                                        class="exercise-checkbox"
                                    />

                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gumb za spremanje nove vrste treninga -->
                    <q-btn
                        unelevated
                        rounded
                        color="primary"
                        type="submit"
                        label="SPREMI"                        
                        class="save-button"
                        :loading="saving"
                        :disable="loadingExercises || saving"
                    />

                </q-form>

            </div>

        </div>

    </q-page>
</template>

<script setup>
// Uvoz potrebnih Vue funkcija
import { computed, onMounted, ref } from 'vue'

// Uvoz Quasar obavijesti
import { Notify } from 'quasar'

// Uvoz routera za navigaciju između stranica
import { useRouter } from 'vue-router'
// Stvaranje router instance
const router = useRouter()

// Uvoz servisa za vrste treninga
import trainingTypeService from '@/services/training-type.service.js'

// Uvoz servisa za vježbe
import exerciseService from '@/services/exercise.service.js'

// Sprema naziv nove vrste treninga
const trainingTypeName = ref('')

// Sprema sve dohvaćene vježbe iz baze
const exercises = ref([])

// Sprema ID-eve označenih vježbi
const selectedExercises = ref([])
const expandedMuscleGroups = ref([]) // Sprema nazive trenutno otvorenih mišićnih skupina

// Prati učitavanje vježbi
const loadingExercises = ref(false)

// Prati spremanje nove vrste treninga
const saving = ref(false)

// Grupira vježbe prema mišićnim skupinama
const groupedExercises = computed(() => {
    // Stvara mapu za grupiranje vježbi
    const groups = new Map()

    // Prolazi kroz sve dohvaćene vježbe
    for (const exercise of exercises.value) {

        // Određuje naziv mišićne skupine
        const groupName = exercise.muscleGroup || 'Ostale vježbe'

        // Provjerava postoji li grupa u mapi
        if (!groups.has(groupName)) {
            // Stvara novu grupu ako još ne postoji
            groups.set(groupName, [])
        }

        // Dodaje vježbu u odgovarajuću grupu
        groups.get(groupName).push(exercise)
    }

    // Pretvara mapu u niz grupa
    return Array.from(groups, ([name, groupExercises]) => ({
        name,
        exercises: groupExercises
    })).sort((a, b) => a.name.localeCompare(b.name, 'hr'))
})

// Otvara ili zatvara pojedinačnu mišićnu skupinu
function toggleMuscleGroup(groupName) {
    // Provjerava je li odabrana mišićna skupina već otvorena
    const categoryIsOpen = expandedMuscleGroups.value.includes(groupName)

    // Ako je skupina otvorena, uklanja je iz popisa otvorenih skupina
    if (categoryIsOpen) {
        // Zatvara samo odabranu mišićnu skupinu
        expandedMuscleGroups.value = expandedMuscleGroups.value.filter(
            name => name !== groupName
        )
        // Prekida funkciju nakon zatvaranja skupine
        return
    }

    // Otvara odabranu skupinu bez zatvaranja ostalih
    expandedMuscleGroups.value = [
        ...expandedMuscleGroups.value,
        groupName
    ]
}

// Dohvaća sve postojeće vježbe iz baze
async function loadExercises() {
    // Uključuje prikaz učitavanja
    loadingExercises.value = true

    try {
        // Dohvaća sve vježbe bez obzira na vrstu treninga
        exercises.value = await exerciseService.getAllExercises()

    } catch (error) {
        // Bilježi grešku pri dohvaćanju vježbi
        console.error('Greška pri dohvaćanju vježbi:', error)

        // Prikazuje obavijest o grešci
        Notify.create({
            message: 'Greška pri dohvaćanju vježbi',
            type: 'negative',
            position: 'top'
        })

    } finally {
        // Isključuje prikaz učitavanja
        loadingExercises.value = false
    }
}

// Vraća korisnika na popis vrsta treninga
function closePage() {
    router.push('/dashboard/vrste-treninga')
}

// Sprema novu vrstu treninga i odabrane vježbe
async function saveTrainingType() {
    // Uklanja razmake s početka i kraja naziva
    const name = trainingTypeName.value.trim()

    // Provjerava je li naziv unesen
    if (!name) {
        Notify.create({
            message: 'Unesite naziv vrste treninga',
            type: 'warning',
            position: 'top'
        })
        return
    }

    // Sprječava višestruko pokretanje spremanja
    if (saving.value) {
        return
    }

    // Uključuje prikaz spremanja
    saving.value = true

    try {
        // Sprema vrstu treninga i njezine odabrane vježbe
        const newTrainingTypeId = await trainingTypeService.createTrainingType({
            name,
            exerciseIds: selectedExercises.value
        })

        // Prikazuje obavijest o uspješnom spremanju
        Notify.create({
            message: 'Vrsta treninga uspješno je spremljena',
            type: 'positive',
            position: 'top'
        })

        // Vraća se na popis i prosljeđuje ID nove vrste treninga
        await router.replace({
            path: '/dashboard/vrste-treninga',
            query: {
                trainingTypeId: String(newTrainingTypeId)
            }
        })

    } catch (error) {
        // Bilježi stvarnu grešku pri spremanju
        console.error('Greška pri spremanju vrste treninga:', error)

        // Provjerava radi li se o pokušaju unosa postojećeg naziva
        const errorMessage = String(error?.message || '').toLowerCase()

        // Određuje poruku za prikaz korisniku
        const message = errorMessage.includes('unique')
            ? 'Vrsta treninga s tim nazivom već postoji'
            : error?.message || 'Greška pri spremanju vrste treninga'

        // Prikazuje obavijest o grešci
        Notify.create({
            message,
            type: 'negative',
            position: 'top'
        })

    } finally {
        // Isključuje prikaz spremanja
        saving.value = false
    }
}

// Nakon učitavanja stranice dohvaća sve vježbe
onMounted(async () => {
    await loadExercises()
})

</script>

<style scoped>

/* Glavna pozadina stranice */
.add-training-type-page {
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

/* Naslov stranice */
.page-title {
    color: #BDC4D4;
    font-size: 18px;
    font-weight: 600;
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

/* Kontejner za unos vrste treninga i odabir vježbi */
.training-type-container {
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 12px;
    padding: 16px 12px;
}

/* Polje za unos naziva vrste treninga */
.training-type-input {
    margin-top: 6px;
    margin-bottom: 10px;
}

/* Oznaka popisa vježbi */
.exercises-label {
    margin-top: 4px;
    margin-bottom: 14px;
    font-size: 14px;
    font-weight: 800;
}

/* Grupe mišićnih skupina */
.exercise-groups {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Pojedinačna mišićna skupina */
.muscle-group {
    width: 100%;
}

/* Naslov mišićne skupine */
.muscle-group-header {
    color: #A8B9CC;
    background: #263B59;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
}

/* Raspored checkboxova u dvije ili više kolona, ovisno o širini ekrana */
.exercises-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px 12px;
    width: 100%;
}

/* Pojedinačni checkbox vježbe */
.exercise-checkbox {
    color: #BDC4D4;
    min-width: 0;
}

/* Prikaz učitavanja vježbi */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #BDC4D4;
    padding: 24px 0;
}

/* Poruka ako nema vježbi */
.empty-message {
    color: #A8B9CC;
    text-align: center;
    padding: 20px 8px;
    font-size: 14px;
}

/* Gumb za spremanje */
.save-button {
    width: 100%;
    min-height: 46px;
    background: #BDC4D4;
    font-weight: 700;
    margin-top: 22px;
}

</style>
