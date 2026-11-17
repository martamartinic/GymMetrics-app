<!-- EKRAN ZA TAB PREHRANA -->

<template>
    <!-- Glavni kontejner za sadržaj tab-a -->
    <div class="client-nutrition-tab">
        <!-- gumb za dodavanje prehrane klijenta -->
        <div 
            v-if="!loading && nutritionRecords.length === 0"
            class="add-client-nutrition-container"
         >
            <q-btn
                unelevated
                rounded
                class="add-client-nutrition-button"
                icon="add"
                label="DODAJ PREHRANU"
                @click="addClientNutrition"
            />
        </div>

        <!-- kontejner za tablicu -->
        <div class="nutrition-table-container">
            <div class="nutrition-table-title"> PREHRANA KLIJENTA </div>
            
            <!-- poruka za učitavanje podataka -->
            <div v-if="loading" class="table-loading-text"> UČITAVANJE PREHRANE KLIJENTA </div>
            
            <div 
                v-else-if="nutritionRecords.length === 0"
                class="empty-nutrition-text" > ZA KLIJENTA JOŠ NIJE UNESENA PREHRANA 
            </div>

            <!-- TABLICA SA UREĐIVANJEM -->
            <q-table
                v-else
                class="nutrition-table"
                flat
                bordered
                :rows="nutritionRows"
                :columns="columns"
                row-key="field"
                hide-bottom
                separator="horizontal"
                :loading="saving"
                :pagination="{ rowsPerPage: 0 }"
                no-data-label="NEMA PODATAKA O PREHRANI"
             >  
              <!-- Prilagođeni prikaz redaka tablice -->
                <template #body="props">
                    <q-tr :props="props">

                        <!-- PRVI STUPAC: NUTRITIVNA VRIJEDNOST -->
                        <q-td
                            key="label"
                            :props="props"
                            class="nutrition-label-cell"
                         >
                            {{ props.row.label }}
                        </q-td>

                        <!-- DRUGI STUPAC: VRIJEDNOST IZ BAZE -->
                        <q-td
                            key="value"
                            :props="props"
                            class="nutrition-value-cell"
                         >
                            <div class="nutrition-value-content">
                                <span>
                                    {{ formatNutritionValue(props.row.value) }}
                                </span>

                                <q-icon
                                    name="edit"
                                    size="16px"
                                    class="nutrition-edit-icon"
                                />
                            </div>

                            <!-- QUASAR POPUP EDITING -->
                            <q-popup-edit
                                v-model="props.row.value"
                                :ref="el => setPopupRef(props.row.field, el)"
                                title="UREDI VRIJEDNOST"
                                buttons
                                persistent
                                label-cancel="Odustani"
                                label-set="Spremi"
                                @show="handlePopupShow(props.row.field)"
                                @save="(value, initialValue) => saveNutritionValue( props.row, value, initialValue )"
                             >
                                <template #default="scope">
                                    <q-input
                                        v-model.number="scope.value"
                                        type="number"
                                        min="0"
                                        step="any"
                                        dense
                                        autofocus
                                        outlined
                                        label="Nova vrijednost"
                                        :suffix="props.row.unit"
                                        @keyup.enter="scope.set"
                                    />
                                </template>
                            </q-popup-edit>

                        </q-td>
                    </q-tr>
                </template>
            </q-table>

        </div> <!-- <div class="nutrition-table-container"> -->
    </div> <!-- <div class="client-nutrition-tab"> -->

</template>

<script setup>

// Vue funkcije za reaktivno stanje i životni ciklus
import { computed, ref, watch } from 'vue'

// Router za otvaranje ekrana za unos prehrane
import { useRouter } from 'vue-router'
const router = useRouter()

// Quasar obavijesti
import { Notify } from 'quasar'

// Servis za dohvat, unos i uređivanje prehrane
import nutritionService from '@/services/nutrition.service'

// Podaci klijenta stižu iz roditeljske komponente
const props = defineProps({
    client: {
        type: Object,
        required: true
    }
})

// REAKTIVNE VARIJABLE
// Zapisi prehrane dohvaćeni iz baze
const nutritionRecords = ref([])
// Oznaka učitavanja
const loading = ref(false)
// Oznaka spremanja promjene
const saving = ref(false)

// DEFINICIJA STUPACA TABLICE
const columns = [
    { name: 'label', label: 'NUTRITIVNA VRIJEDNOST', field: 'label', align: 'left' },
    { name: 'value', label: 'VRIJEDNOST', field: 'value', align: 'center' }
] //const columns zagrada

// NAJNOVIJI ZAPIS PREHRANE KLIJENTA
const nutritionRecord = computed(() => {
    return nutritionRecords.value.length > 0
        ? nutritionRecords.value[0]
        : null
}) //const nutritionRecord zagrada

// REDCI TABLICE
// Svaka nutritivna vrijednost prikazuje se kao zaseban redak.
// U tablici su uvijek dva stupca: naziv i vrijednost
const nutritionRows = computed(() => {
    if (!nutritionRecord.value) { return [] }

    const record = nutritionRecord.value

    return [
        { field: 'kalorije', label: 'Dnevne kalorije (kcal)', value: record.kalorije, unit: 'kcal' },
        { field: 'proteini', label: 'Proteini (g)', value: record.proteini, unit: 'g' },
        { field: 'ugljikohidrati', label: 'Ugljikohidrati (g)', value: record.ugljikohidrati, unit: 'g' },
        { field: 'secer', label: 'Šećer (g)', value: record.secer, unit: 'g' },
        { field: 'masti', label: 'Masti (g)', value: record.masti, unit: 'g' },
        { field: 'vlakna', label: 'Vlakna (g)', value: record.vlakna, unit: 'g' }
    ] //return zagrada
}) //const nutritionRows zagrada

// REFERENCA NA OTVORENE POPUP PROZORE
const popupEditRefs = new Map()

// POHRANA REFERENCE POJEDINOG POPUP-A
function setPopupRef(field, element) {
    if (element) {
        popupEditRefs.set(field, element)
    } else {
        popupEditRefs.delete(field)
    } //else zagrada
} //setPopupRef zagrada
// ZATVARANJE PRETHODNOG POPUP-A KADA SE OTVORI NOVI
function handlePopupShow(activeField) {
    popupEditRefs.forEach((popup, field) => {
        if (field !== activeField) { popup?.hide?.() }
    })
} //handlePopupShow zagrada

//FUNKCIJA ZA FORMATIRANJE VRIJEDNOSTI ZA PRIKAZ
function formatNutritionValue(value) {
    if (value === null || value === undefined || value === '') {
        return '—'
    } //if zagrada
    return value
} //formatNutritionValue zagrada

// FUNKCIJA ZA DOHVAT PREHRANE KLIJENTA
async function loadClientNutrition() {

    if (!props.client?.id) {
        nutritionRecords.value = []
        return
    } //if zagrada

    loading.value = true

    try {
        const result = await nutritionService.getClientNutrition(
            props.client.id
        ) //const result zagrada

        nutritionRecords.value = result.rows || []

    } catch (error) {
        console.error('Greška pri čitanju prehrane klijenta:',error )

        nutritionRecords.value = []

        Notify.create({
            message: 'Greška pri čitanju prehrane klijenta',
            type: 'negative',
            position: 'top'
        })

    } finally {
        loading.value = false
    } //finally zagrada

} //async function loadClientNutrition zagrada

// FUNKCIJA ZA SPREMANJE PROMIJENJENE VRIJEDNOSTI
async function saveNutritionValue(row, newValue, initialValue) {

    // Provjera postoji li zapis prehrane
    if (!nutritionRecord.value) { return }

    // Pretvaranje unesene vrijednosti u broj
    const numericValue = Number(newValue)

    // Provjera valjanosti unesene vrijednosti
    if (
        newValue === null || newValue === undefined ||
        String(newValue).trim() === '' || !Number.isFinite(numericValue) 
        || numericValue < 0
    ) {
        // Vraćanje prethodne vrijednosti
        row.value = initialValue

        Notify.create({
            message: 'Vrijednost mora biti broj veći ili jednak 0',
            type: 'negative',
            position: 'top'
        })

        return
    } //if zagrada

    saving.value = true

    try {
        // Ažuriranje vrijednosti u SQLite bazi
        await nutritionService.updateClientNutrition({
            clientId: props.client.id,
            nutritionId: nutritionRecord.value.id,
            field: row.field,
            value: numericValue
        }) //await nutritionService zagrada

        // Ažuriranje lokalnog zapisa nakon uspješnog spremanja
        const record = nutritionRecords.value.find(
            item => item.id === nutritionRecord.value.id
        ) //const record zagrada

        if (record) { record[row.field] = numericValue }

        // Ažuriranje retka tablice
        row.value = numericValue

        Notify.create({
            message: 'Podatak o prehrani je uspješno ažuriran',
            type: 'positive',
            position: 'top'
        })

    } catch (error) {
        console.error( 'Greška pri spremanju prehrane klijenta:', error )

        // Vraćanje prethodne vrijednosti ako spremanje nije uspjelo
        row.value = initialValue

        Notify.create({
            message: error.message || 'Greška pri spremanju prehrane klijenta',
            type: 'negative',
            position: 'top'
        })

    } finally {
        saving.value = false
    } //finally zagrada
} //async function saveNutritionValue zagrada

// OTVARANJE EKRANA ZA UNOS NOVE PREHRANE
function addClientNutrition() {
    if (!props.client?.id) { return }

    router.push(`/dashboard/clients/${props.client.id}/nutrition/new`)
}

// PONOVNO UČITAVANJE KOD PROMJENE KLIJENTA
watch(
    () => props.client?.id,
    () => {
        loadClientNutrition()
    },
    { immediate: true }
)

</script>

<style scoped>

/* GLAVNI KONTEJNER TABA */
.client-nutrition-tab {
    width: 100%;
    min-width: 0;
}

/* GUMB ZA DODAVANJE PREHRANE */
.add-client-nutrition-container {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    margin-bottom: 22px;
}
.add-client-nutrition-button {
    background: #BDC4D4;
    color: #0F1A2B;
    font-weight: 600;
}

/* KONTEJNER TABLICE */
.nutrition-table-container {
    width: 100%;
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(189, 196, 212, 0.35);
    border-radius: 16px;
    box-sizing: border-box;
    overflow: hidden;
}

/* NASLOV KONTEJNERA */
.nutrition-table-title {
    color: #BDC4D4;
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 16px;
}

/* TABLICA */
.nutrition-table {
    width: 100%;
    min-width: 0;
    background: transparent;
    color: #BDC4D4;
    font-size: 13px;
    font-weight: 600;
}

/* ZAGLAVLJE TABLICE */
.nutrition-table :deep(thead tr th) {
    background: #52677D;
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 800;
    white-space: normal;
}

/* PRVI STUPAC */
.nutrition-label-cell {
    width: 65%;
    color: #BDC4D4;
    white-space: normal;
}

/* DRUGI STUPAC */
.nutrition-value-cell {
    width: 35%;
    color: #BDC4D4;
    text-align: center;
}

/* VRIJEDNOST I IKONA ZA UREĐIVANJE */
.nutrition-value-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 30px;
}
.nutrition-edit-icon {
    color: #A8B9CC;
    opacity: 0.75;
}

/* PORUKE */
.table-loading-text, .empty-nutrition-text {
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

/* POPUP ZA UREĐIVANJE */
:global(.q-popup-edit) {
    min-width: 220px;
    background: #000000 !important;
    color: #BDC4D4 !important;
    border: 1px solid rgba(189, 196, 212, 0.35);
    border-radius: 12px;
}
/* Naslov popup prozora */
:global(.q-popup-edit .q-popup-edit__title),
:global(.q-popup-edit__title) {
    color: #A8B9CC !important;
    font-size: 12px !important;
    font-weight: 600 !important;
}
/* Dodatno ciljanje prvog dijela popup prozora u kojem je naslov */
:global(.q-popup-edit > .q-card__section:first-child) {
    color: #BDC4D4 !important;
    font-size: 12px !important;
    font-weight: 600 !important;
}
/* Oznaka polja za unos */
:global(.q-popup-edit .q-field__label) {
    color: #A8B9CC !important;
}
/* Tekst unesene vrijednosti */
:global(.q-popup-edit .q-field__native) {
    color: #BDC4D4 !important;
}
/* Jedinica mjere uz unesenu vrijednost: kcal ili g */
:global(.q-popup-edit .q-field__suffix) {
    color: #BDC4D4 !important;
    opacity: 1 !important;
}
/* Gumbi Odustani i Spremi */
:global(.q-popup-edit .q-btn) {
    color: #A8B9CC !important;
    font-weight: 600;
}

</style>