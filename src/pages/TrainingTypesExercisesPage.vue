<!-- EKRAN S PRIKAZOM PADAJUĆEG IZBORNIKA VRSTE TRENINGA I PRIPADAJUĆIH VJEŽBI + GUMBOVI ZA DOAVANJE NOVE VRSTE TRENINGA I VJEŽBE -->


<!-- EKRAN ZA PREGLED VRSTA TRENINGA I NJIHOVIH VJEŽBI -->

<template>
  <!-- CIJELI MOBILNI EKRAN -->
  <q-page class="training-types-page">

    <!-- EKRAN KOJI DIJELI APP NA HEADER I SCROLL-ABILNU SREDINU -->
    <div class="training-types-content">

      <!-- FIXAN HEADER EKRANA -->
      <div class="page-header">

        <!-- NASLOV EKRANA -->
        <div class="page-title">
          VRSTE TRENINGA I VJEŽBE
        </div>

      </div>

      <!-- SREDINA EKRANA KOJA SE SCROLL-A -->
      <div class="page-scroll-area">
         
        <!-- KONTEJNER ZA ODABIR VRSTE TRENINGA -->
        <div class="training-types-container">

            <!-- RED ZA GUMB DODAJ VRSTU TRENINGA -->
            <div class="add-training-type-row">
                <!-- GUMB ZA OTVARANJE EKRANA DODAVANJA VRSTE TRENINGA -->
                <q-btn
                unelevated
                rounded
                label="DODAJ VRSTU TRENINGA"
                icon="add"
                aria-label="Dodaj vrstu treninga"
                class="add-tType-button"
                @click="addTrainingType"
                />
            </div>

          <!-- RED ZA LABELU I GUMB DODAJ VRSTU TRENINGA -->
          <div class="section-header">

            <!-- LABELA VRSTE TRENINGA -->
            <div class="section-label">
              VRSTA TRENINGA:
            </div>

          </div>

          <!-- DROPDOWN ZA ODABIR VRSTE TRENINGA -->
          <q-select
            v-model="selectedTrainingType"
            :options="trainingTypes"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            outlined
            rounded
            dense
            dark
            behavior="menu"
            popup-content-class="training-types-popup"
            menu-anchor="top left"
            menu-self="bottom left"
            :loading="loadingTrainingTypes"
            :display-value="selectedTrainingTypeName"
            aria-label="Odabir vrste treninga"
            class="training-types-menu"
          />

        </div>

        <!-- KONTEJNER ZA POPIS VJEŽBI -->
        <div class="exercises-container">

          <!-- RED ZA LABELU I GUMB DODAJ VJEŽBU -->
          <div class="section-header exercises-header">

            <!-- LABELA VJEŽBI -->
            <div class="section-label">
              VJEŽBE:
            </div>

            <!-- GUMB ZA OTVARANJE EKRANA DODAVANJA VJEŽBE -->
            <q-btn
              unelevated
              rounded
              label="DODAJ VJEŽBU"
              icon="add"
              aria-label="Dodaj vježbu"
              class="add-button"
              @click="addExercise"
            />

          </div>

          <!-- LOADING PRIKAZ TIJEKOM DOHVATA VJEŽBI -->
          <div
            v-if="loadingExercises"
            class="loading-container"
          >
            <q-spinner
              color="primary"
              size="32px"
            />
          </div>

          <!-- PORUKA AKO NIJE ODABRANA VRSTA TRENINGA -->
          <div
            v-else-if="!selectedTrainingType"
            class="exercises-empty"
          >
            Odaberite vrstu treninga za prikaz pripadajućih vježbi
          </div>

          <!-- PORUKA AKO ODABRANA VRSTA TRENINGA NEMA VJEŽBI -->
          <div
            v-else-if="exercises.length === 0"
            class="exercises-empty"
          >
            Za odabranu vrstu treninga nema dostupnih vježbi
          </div>

          <!-- GRUPIRANI POPIS VJEŽBI -->
          <div
            v-else
            class="exercise-groups"
          >

            <!-- PRIKAZ POJEDINAČNE MIŠIĆNE SKUPINE -->
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

              <!-- NASLOV MIŠIĆNE SKUPINE -->
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

              <!-- POPIS VJEŽBI ZA TRENUTNU MIŠIĆNU SKUPINU -->
              <q-list
                v-if="expandedMuscleGroups.includes(group.name)"
                separator
                class="muscle-group-list"
              >

                <!-- POJEDINAČNA VJEŽBA -->
                <q-item
                  v-for="exercise in group.exercises"
                  :key="exercise.id"
                  class="exercise-item"
                >

                  <!-- IKONA VJEŽBE -->
                  <q-item-section avatar>
                    <q-icon
                      name="fitness_center"
                      color="primary"
                      size="sm"
                    />
                  </q-item-section>

                  <!-- NAZIV VJEŽBE I INFORMACIJE -->
                  <q-item-section>

                    <!-- NAZIV VJEŽBE -->
                    <q-item-label class="exercise-name">
                      {{ exercise.name }}
                    </q-item-label>

                    <!-- OZNAKA DEFAULT VJEŽBE -->
                    <q-item-label
                      v-if="exercise.defaultExercise"
                      caption
                      class="default-exercise-label"
                    >
                      Deafult vježba
                    </q-item-label>

                  </q-item-section>

                </q-item>

              </q-list>

            </div>

          </div>

        </div>

      </div>

    </div>

  </q-page>

</template>

<script setup>

// UVOZ REAKTIVNIH FUNKCIJA IZ VUE-A
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()  // Inicijalizacija routera
const route = useRoute() // Dohvaća podatke trenutne rute

// UVOZ QUASAR NOTIFY ZA OBAVIJESTI KORISNIKU
import { Notify } from 'quasar'

// UVOZ SERVISA ZA DOHVAT VRSTA TRENINGA
import trainingTypeService from '@/services/training-type.service.js'
// UVOZ SERVISA ZA DOHVAT VJEŽBI
import exerciseService from '@/services/exercise.service.js'

// VRSTE TRENINGA
// REAKTIVNI NIZ VRSTA TRENINGA DOHVAĆENIH IZ BAZE
const trainingTypes = ref([])

// ID TRENUTNO ODABRANE VRSTE TRENINGA
const selectedTrainingType = ref(null)

// LOADING STANJE DOHVATA VRSTA TRENINGA
const loadingTrainingTypes = ref(false)

// VJEŽBE
// REAKTIVNI NIZ VJEŽBI TRENUTNO ODABRANE VRSTE TRENINGA
const exercises = ref([])

//EXPAND/COLLAPS MIŠIĆNIH SKUPINA --> NIZ NAZIVA MIŠIĆNIH SKUPINA KOJE SU TRENUTNO OTVORENE
const expandedMuscleGroups = ref([])

// LOADING STANJE DOHVATA VJEŽBI
const loadingExercises = ref(false)

// NAZIV ODABRANE VRSTE TRENINGA
// COMPUTED PRONALAZI NAZIV VRSTE TRENINGA NA TEMELJU ODABRANOG ID-A
const selectedTrainingTypeName = computed(() => {

  // PRONALAZAK VRSTE TRENINGA S ID-EM KOJI JE TRENUTNO ODABRAN
  const selected = trainingTypes.value.find(
    type => type.id === selectedTrainingType.value
  )

  // AKO ODABRANA VRSTA TRENINGA NIJE PRONAĐENA, VRAĆA SE PRAZAN TEKST
  if (!selected) {
    return ''
  }

  // NAZIV ODABRANE VRSTE TRENINGA PRETVARA SE U VELIKA SLOVA
  return selected.name.toUpperCase()

})

// FUNKCIJA ZA OTVARANJE I ZATVARANJE POJEDINAČNE MIŠIĆNE SKUPINE
function toggleMuscleGroup(groupName) {

  // PROVJERA JE LI MIŠIĆNA SKUPINA VEĆ OTVORENA
  const categoryIsOpen = expandedMuscleGroups.value.includes(groupName)

  // AKO JE SKUPINA OTVORENA, UKLANJA SE IZ POPISA OTVORENIH
  if (categoryIsOpen) {
    // ZATVARANJE SAMO ODABRANE MIŠIĆNE SKUPINE
    expandedMuscleGroups.value = expandedMuscleGroups.value.filter(
      name => name !== groupName
    )
    // PREKID FUNKCIJE NAKON ZATVARANJA SKUPINE
    return
  }

  // OTVARANJE ODABRANE SKUPINE BEZ ZATVARANJA OSTALIH
  expandedMuscleGroups.value = [
    ...expandedMuscleGroups.value,
    groupName
  ]

} //toggleMuscleGroup zagrada


// GRUPIRANJE VJEŽBI PO MIŠIĆNOJ SKUPINI
// COMPUTED AUTOMATSKI GRUPIRA VJEŽBE KAD SE PROMIJENE DOHVAĆENE VJEŽBE
const groupedExercises = computed(() => {

  // DEFINIRANJE OBJEKTA U KOJI SE SPREMAJU GRUPE VJEŽBI
  const groups = {}

  // PROLAZAK KROZ SVE DOHVAĆENE VJEŽBE
  exercises.value.forEach(exercise => {

    // DOHVAT NAZIVA MIŠIĆNE SKUPINE ILI ZAMJENSKI NAZIV AKO NIJE DEFINIRANA
    const groupName = exercise.muscleGroup || 'Ostale vježbe'

    // AKO MIŠIĆNA SKUPINA JOŠ NE POSTOJI, STVARA SE NOVA GRUPA
    if (!groups[groupName]) {
      groups[groupName] = []
    }

    // DODAVANJE VJEŽBE U ODGOVARAJUĆU MIŠIĆNU SKUPINU
    groups[groupName].push(exercise)

  })

  // PRETVARANJE OBJEKTA GRUPA U NIZ RADI VUE PRIKAZA
  return Object.entries(groups)

    // SVAKA GRUPA DOBIVA NAZIV I NIZ PRIPADAJUĆIH VJEŽBI
    .map(([name, exercises]) => ({
      name,
      exercises
    }))

    // SORTIRANJE MIŠIĆNIH SKUPINA ABECEDNO PO NAZIVU
    .sort((a, b) => a.name.localeCompare(b.name, 'hr'))

})

// FUNKCIJA ZA DOHVAT VRSTA TRENINGA IZ BAZE
async function loadTrainingTypes() {
  // UKLJUČIVANJE LOADING STANJA DROPDOWN MENIJA
  loadingTrainingTypes.value = true

  // TRY ZA HVATANJE MOGUĆIH GREŠAKA PRI DOHVATU
  try {
    // DOHVAT SVIH VRSTA TRENINGA PREKO TRAINING TYPE SERVISA
    trainingTypes.value = await trainingTypeService.getTrainingTypes()

    // AKO POSTOJI BAREM JEDNA VRSTA TRENINGA, ODABIRE SE PRVA
   /* if (trainingTypes.value.length > 0) {
      // ID PRVE VRSTE TRENINGA POSTAVLJA SE KAO TRENUTNO ODABRANI ID
      selectedTrainingType.value = trainingTypes.value[0].id
    }*/

    // Dohvaća ID vrste treninga proslijeđen preko URL-a
    const requestedTrainingTypeId = Number(route.query.trainingTypeId)

    // Provjerava postoji li proslijeđeni ID među dohvaćenim vrstama
    const requestedTrainingType = trainingTypes.value.find(
        trainingType => trainingType.id === requestedTrainingTypeId
    )

    // Odabire upravo dodanu vrstu ako postoji
    if (requestedTrainingType) {
        selectedTrainingType.value = requestedTrainingType.id
    } else {
        // Inače odabire prvu vrstu treninga s popisa
        selectedTrainingType.value = trainingTypes.value[0]?.id ?? null
    }

  } catch (error) {
    // ISPIS GREŠKE U KONZOLI
    console.error('Greška pri učitavanju vrsta treninga:', error)

    // PRIKAZ OBAVIJESTI KORISNIKU
    Notify.create({
      message: 'Greška pri dohvaćanju vrsta treninga',
      type: 'negative',
      position: 'top'
    })

  } finally {
    // ISKLJUČIVANJE LOADING STANJA NAKON DOHVATA
    loadingTrainingTypes.value = false
  } //finally zagrada

} //async function loadTrainingTypes zagrada

// DOHVAT VJEŽBI ZA ODABRANU VRSTU TRENINGA
// FUNKCIJA DOHVAĆA VJEŽBE PREKO ID-A ODABRANE VRSTE TRENINGA
async function loadExercises(trainingTypeId) {
    // ZATVARANJE SVIH MIŠIĆNIH SKUPINA PRI PROMJENI VRSTE TRENINGA
  expandedMuscleGroups.value = []

  // PRAŽNJENJE TRENUTNOG POPISA PRIJE DOHVATA NOVIH VJEŽBI
  exercises.value = []

  // AKO ID VRSTE TRENINGA NIJE ODABRAN, PREKIDA SE DOHVAT
  if (!trainingTypeId) { return }

  // UKLJUČIVANJE LOADING STANJA POPISA VJEŽBI
  loadingExercises.value = true

  // TRY ZA HVATANJE MOGUĆIH GREŠAKA
  try {
    // DOHVAT VJEŽBI ZA ODABRANU VRSTU TRENINGA PREKO EXERCISE SERVISA
    exercises.value = await exerciseService.getExercisesForTrainingType(
      trainingTypeId
    )

  } catch (error) {
    // ISPIS GREŠKE U KONZOLI
    console.error('Greška pri učitavanju vježbi:', error)

    // PRAŽNJENJE POPISA AKO DOHVAT NIJE USPJEŠAN
    exercises.value = []

    Notify.create({
      message: 'Greška pri učitavanju vježbi',
      type: 'negative',
      position: 'top'
    })

  } finally {
    // ISKLJUČIVANJE LOADING STANJA NAKON DOHVATA
    loadingExercises.value = false
  } //finally zagrada
} //async function loadExercises zagrada

// PRAĆENJE PROMJENE ODABRANE VRSTE TRENINGA // WATCH AUTOMATSKI DOHVAĆA VJEŽBE KAD SE PROMIJENI ODABRANA VRSTA TRENINGA
watch(selectedTrainingType, async (newTrainingTypeId) => {
  // DOHVAT VJEŽBI ZA NOVO ODABRANU VRSTU TRENINGA
  await loadExercises(newTrainingTypeId)
})

// FUNKCIJA ZA OTVORANJE EKRANA DODAVANJA VRSTE TRENINGA
function addTrainingType() {
// Navigacija na zaseban ekran za unos
    router.push('/dashboard/vrste-treninga/newTrainingType')
}

// FUNKCIJA ZA  OTVORANJE EKRANA DODAVANJA VJEŽBE
function addExercise() {
    // Otvaranje ekrana za dodavanje nove vježbe
    router.push('/dashboard/vrste-treninga/newExercise')
}

// POČETNO UČITAVANJE EKRANA // NAKON OTVARANJA EKRANA DOHVAĆAJU SE VRSTE TRENINGA
onMounted(async () => {
  // DOHVAT VRSTA TRENINGA
  await loadTrainingTypes()
})

</script>

<style scoped>

/* CIJELI EKRAN */
.training-types-page {
  height: 100%;
  background: var(--q-dark-page);
}

/* EKRAN KOJI DIJELI APP NA HEADER I SCROLL-ABILNU SREDINU */
.training-types-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* FIXAN HEADER */
.page-header {
  position: relative;
  flex-shrink: 0;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

/* NASLOV EKRANA */
.page-title {
  color: #BDC4D4;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

/* SREDINA EKRANA KOJA SE SCROLL-A */
.page-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 24px;
  box-sizing: border-box;
}

/* KONTEJNER ZA ODABIR VRSTE TRENINGA */
.training-types-container {
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  margin-bottom: 16px;
}

/* RED S LABELOM I GUMBOM */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 12px;
}

/* LABELA VRSTE TRENINGA I VJEŽBI */
.section-label {
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 12px;
}

/* RED ZA GUMB DODAJ VRSTU TRENINGA */
.add-training-type-row {
  margin-top: 4px;
  margin-bottom: 12px;
}
.add-tType-button {        /* GUMB ZA DODAVANJE VRSTE TRENINGA */
  background: #BDC4D4;
  color: #0F1A2B;
  font-weight: 600;

}
/* GUMB ZA DODAVANJE VJEŽBE */
.add-button {
  background: #BDC4D4;
  color: #0F1A2B;
  font-size: 12px;
  font-weight: 600;
}

/* DROPDOWN VRSTE TRENINGA */
.training-types-menu {
  background: #1C2E4A;
  color: #BDC4D4;
  width: 100%;
}

/* VIZUAL DROPDOWN GUMBA */
:deep(.training-types-menu .q-field__control) {
  background: #A8B9CC;
  border-radius: 12px;
  border: none;
  min-height: 42px;
}

/* TEKST ODABRANE VRSTE TRENINGA */
:deep(.training-types-menu .q-field__native) {
  color: #1C2E4A;
  font-weight: 600;
  justify-content: center;
}

/* STRELICA DROPDOWN MENIJA */
:deep(.training-types-menu .q-field__append) {
  color: #1C2E4A;
  margin-right: 6px;
}

/* OPCIJE OTVORENOG DROPDOWN MENIJA */
:deep(.training-types-popup .q-item) {
  color: #BDC4D4;
}

/* HOVER I OZNAČENA OPCIJA DROPDOWN MENIJA */
:deep(.training-types-popup .q-item:hover) {
  background: #52677D;
  color: #FFFFFF;
}

/* KONTEJNER VJEŽBI */
.exercises-container {
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
}

/* RED LABELA VJEŽBI I GUMB DODAJ VJEŽBU */
.exercises-header {
  margin-bottom: 18px;
}

/* LOADING KONTEJNER */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

/* PORUKA PRAZNOG POPISA */
.exercises-empty {
  color: #BDC4D4;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 4px;
  text-align: center;
}

/* KONTEJNER GRUPIRANIH VJEŽBI */
.exercise-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* POJEDINAČNA MIŠIĆNA SKUPINA */
.muscle-group {
  width: 100%;
  overflow: hidden;
}

/* NASLOV MIŠIĆNE SKUPINE */
.muscle-group-header {
  color: #A8B9CC;
  background: #263B59;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;

  /* OMOGUĆUJE RASPORED NAZIVA I IKONE U ISTOM RETKU */
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;   /* POKAZUJE DA JE NASLOV MOGUĆE KLIKNUTI */
  user-select: none;  /* SPRJEČAVA OZNAČAVANJE TEKSTA PRI UČESTALOM KLIKANJU */
}
/* NAZIV MIŠIĆNE SKUPINE */
.muscle-group-title {
  flex: 1;
}
/* IKONA ZA OTVARANJE I ZATVARANJE MIŠIĆNE SKUPINE */
.muscle-group-toggle-icon {
  color: #BDC4D4;
  flex-shrink: 0;
}

/* LISTA VJEŽBI MIŠIĆNE SKUPINE */
.muscle-group-list {
  background: transparent;
}

/* POJEDINAČNI RED VJEŽBE */
.exercise-item {
  min-height: 48px;
  padding: 6px 4px;
}

/* NAZIV VJEŽBE */
.exercise-name {
  color: #BDC4D4;
  font-size: 14px;
  white-space: normal;
  line-height: 1.4;
}

/* OZNAKA DEFAULT VJEŽBE */
.default-exercise-label {
  color: #8198B3;
  font-size: 11px;
}

/* PRILAGODBA ZA USKE MOBILNE EKRANE */
@media (max-width: 360px) {

  /* SMANJENJE RAZMAKA UNUTAR KONTEJNERA */
  .page-scroll-area {
    padding-left: 10px;
    padding-right: 10px;
  }

  /* SMANJENJE PADDINGA KONTEJNERA */
  .training-types-container,
  .exercises-container {
    padding: 12px;
  }

  /* SMANJENJE FONT LABELA */
  .section-label {
    font-size: 14px;
  }

}

</style>
