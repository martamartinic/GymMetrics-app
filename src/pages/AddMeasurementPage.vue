
<template>
    <!-- Glavna stranica za unos mjerenja -->
    <q-page class="add-measurement-page">
        <!-- Glavni fleksibilni kontejner -->
        <div class="add-measurement-content">
            <!-- Zaglavlje ekrana -->
            <div class="page-header">
                <!-- Naslov ekrana -->
                <div class="page-title">
                    <span> DODAVANJE MJERENJA  </span>
                    <span> KLIJENTA </span>

                </div>

                <!-- Gumb za zatvaranje ekrana -->
                <q-btn
                    flat
                    dense
                    icon="close"
                    aria-label="Zatvori"
                    class="close-button"
                    @click="closePage"
                />
            </div>

            <!-- Područje obrasca -->
            <div class="page-scroll-area">
                <!-- Obrazac za unos -->
                <div class="measurement-form-container">                                       
                    <!-- Labela za odabir vrste mjerenja -->
                    <label class="form-label">Vrsta mjerenja: </label>

                    <!-- Padajući izbornik vrsta mjerenja -->
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
                        :loading="loadingTypes"
                        :disable="loadingTypes || measurementTypes.length === 0"
                        :display-value="selectedMeasurementTypeName"
                        class="form-select"
                        aria-label="Odabir vrste mjerenja"
                    />
                    <q-space class="q-my-sm" />
                    
                    <!-- polje koje prikazuje mjernu jedinicu odabrane vrste mjerenja -->
                    <q-input
                        :model-value="selectedUnit"
                        outlined
                        rounded
                        dark
                        readonly
                        class="measurement-input"
                        label="Mjerna jedinica"
                        aria-label="Mjerna jedinica"
                        color="primary"
                        lazy-rules
                        hide-bottom-space
                    />
                    <q-space class="q-my-sm" />

                    <!-- Polje za brojčanu vrijednost -->
                    <q-input
                        v-model="measurementValue"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        outlined
                        rounded
                        dark
                        class="measurement-input"
                        label="Vrijednost mjerenja"
                        aria-label="Vrijednost mjerenja"                 
                        color="primary"              
                        :rules="[validacijaVrijednostiMjerenja]"
                        lazy-rules
                       
                    />                         
                    <q-space class="q-my-sm" />

                    <!-- Odabir datuma -->
                    <q-input                        
                        outlined
                        rounded
                        dark
                        v-model="measurementDate"
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        class="measurement-input"
                        label="Datum mjerenja (GGGG-MM-DD)"
                        placeholder="pr. 2026-01-31"
                        aria-label="Datum mjerenja"                    
                        :rules="[validacijaDatumaMjerenja]"
                        color="primary"     
                        lazy-rules                        
                    />

                     <!-- Gumb za otvaranje prozora nove vrste mjerenja -->
                    <q-btn
                        unelevated
                        rounded
                        color="secondary"
                        class="new-measurement-type-button"
                        label="NOVA VRSTA MJERENJA"
                        @click="typeDialog = true"
                    />

                    <!-- Poruka kada nema vrsta mjerenja -->
                    <div
                        v-if="!loadingTypes && measurementTypes.length === 0"
                        class="form-empty-text" > NEMA DOSTUPNIH VRSTA MJERENJA
                    </div>
                </div>
            </div>

            <!-- Donji dio ekrana s gumbom spremanja -->
            <div class="page-footer">
                <!-- Gumb za spremanje mjerenja klijenta -->
                <q-btn
                    unelevated
                    rounded
                    color="primary"
                    class="save-button"
                    label="SPREMI"
                    :loading="saving"
                    :disable="saving || loadingTypes || measurementTypes.length === 0"
                    @click="saveMeasurement"
                />
            </div>
        </div>

        <!-- POPUP PROZOR ZA DODAVANJE NOVE VRSTE MJERENJA -->
            <q-dialog v-model="typeDialog">
            <q-card class="new-type-dialog">
                <!-- Polja za naziv i mjernu jedinicu -->
                <q-card-section class="new-type-fields">
                    <q-card-section class="goal-dialog-header">
                        <q-btn
                            flat
                            dense
                            icon="close"
                            aria-label="Zatvori"
                            class="goal-dialog-close"
                            @click="closeDialog"
                        />
            </q-card-section>
                    <!-- Naziv nove vrste mjerenja -->
                    <q-input
                        v-model="newTypeName"
                        outlined
                        rounded
                        dense
                        dark
                        label="Naziv mjerenja"
                        color="primary"
                        autocomplete="off"
                    />

                    <!-- Razmak između polja -->
                    <q-space class="q-my-md" />

                    <!-- Mjerna jedinica nove vrste mjerenja -->
                    <q-input
                        v-model="newTypeUnit"
                        outlined
                        rounded
                        dense
                        dark
                        label="Mjerna jedinica"
                        color="primary"
                        autocomplete="off"
                    />
                </q-card-section>

                <!-- Gumb za spremanje nove vrste -->
                <q-card-actions class="new-type-actions">
                    <q-btn
                        unelevated
                        rounded
                        color="primary"
                        class="new-type-save-button"
                        label="SPREMI"
                        :loading="savingType"
                        :disable="savingType"
                        @click="saveMeasurementType"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>

// Vue funkcije za reaktivno stanje i životni ciklus
import { computed, onMounted, ref } from 'vue'
// Router omogućuje čitanje ID-a klijenta i navigaciju
import { useRoute, useRouter } from 'vue-router'
const router = useRouter() // Inicijalizacija routera
const route = useRoute() // Inicijalizacija aktivne rute

import { Notify } from 'quasar'
// Servis za rad s mjerenjima
import measurementService from '@/services/measurement.service'

// Popis dostupnih vrsta mjerenja
const measurementTypes = ref([])
// Odabrana vrsta mjerenja
const selectedMeasurementTypeId = ref(null)
// Unesena vrijednost mjerenja
const measurementValue = ref('')
// Datum mjerenja
const measurementDate = ref()
// Oznaka učitavanja vrsta mjerenja
const loadingTypes = ref(false)
// Oznaka spremanja mjerenja klijenta
const saving = ref(false)
// ID klijenta iz parametra rute
const clientId = computed(() => Number(route.params.id))

// Jedinica odabrane vrste mjerenja
const selectedUnit = computed(() => {
    // Traženje trenutno odabrane vrste mjerenja
    const odabranaVrsta = measurementTypes.value.find(
        type => Number(type.id) === Number(selectedMeasurementTypeId.value)
    )
    // Ako nema odabrane vrste, jedinica ostaje prazna
    return odabranaVrsta?.unit ?? ''
}) // selectedUnit

//IZRAČUN NAZIVA ODABRANE VRSTE MJERENJA DROPDOWN MENI
const selectedMeasurementTypeName = computed(() => {
    // Pronalaženje odabrane vrste mjerenja
    const odabranaVrsta = measurementTypes.value.find(
        type => Number(type.id) === Number(selectedMeasurementTypeId.value)
    )
    // Prikaz naziva velikim slovima
    return odabranaVrsta ? odabranaVrsta.name.toUpperCase() : ''
}) // selectedMeasurementTypeName

//prikaz popup prozora za novu vrstu mjerenja
const typeDialog = ref(false)
const newTypeName = ref('') //naziv nove vrste mjerenja
const newTypeUnit = ref('') //mjerna jedinica nove vrste mjerenja
const savingType = ref(false) //oznaka spremanja nove vrste mjerenja

// Povratak na prethodni ekran
function closePage() {
    // Navigacija natrag na detalje klijenta
   // router.back()
   router.replace({
        path: `/dashboard/clients/${clientId.value}`,
        query: {
            tab: 'mjerenja',
            measurementTypeId: String(selectedMeasurementTypeId.value)
        }
    })
} // closePage

//VALIDACIJA VRIJEDNOSTI MJERENJA KLIJENTA
function validacijaVrijednostiMjerenja(value) {
    // Obvezan unos vrijednosti
    const tekstVrijednosti = String(value ?? '').trim()

    if (!tekstVrijednosti) {
        return 'Vrijednost mjerenja je obavezna'
    } // if

    // Decimalni separator mora biti točka
    if (tekstVrijednosti.includes(',')) {
        return 'Decimalni broj vrijednosti mjerenja odvaja se točkom (.)'
    } // if

    // Prihvaćaju se cijeli i decimalni brojevi
    if (!/^\d+(?:\.\d+)?$/.test(tekstVrijednosti)) {
        return 'Vrijednost mjerenja mora biti broj veći od nule'
    } // if

    // Vrijednost mora biti konačan broj veći od nule
    const brojVrijednosti = Number(tekstVrijednosti)

    if (!Number.isFinite(brojVrijednosti) || brojVrijednosti <= 0) {
        return 'Vrijednost mjerenja mora biti broj veći od nule'
    } // if

    // Unos je valjan
    return true
} // validacijaVrijednostiMjerenja

//VALIDACIJA DATUMA (1. unesen, 2. format GGGG-MM-DD, 3. datum stvarno postoji u kalendaru)
function validacijaDatumaMjerenja(value) {
    if (!value || !value.trim()) {
        return 'Datum mjerenja je obavezan'
    } //if zagrada
    
    //provjera formata datuma godina-mjesec-dan
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'Datum mjerenja mora biti u formatu GGGG-MM-DD'
    } //if zagrada

    //dijeli datum na godine, mjesece i dane
    const [year, month, day] = value.split('-').map(Number)

    //stvaranje UTC datuma
    const date = new Date(Date.UTC(year, month - 1, day))

    //provjera je li javascript nakon stvaranja datuma zadržao potpuno iste vrijednosti godine, mjeseca i dana
    const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month -1 && date.getUTCDate() === day

    //ako datum ne postoji, vraća poruku greške
    if(!isRealDate) {
        return 'Datum mjerenja ne postoji u kalendaru'
    } //if zagrada

    //ako su sve provjere uspješne, pravilo je zadovoljeno
    return true

} //validacijaDatumaMjerenja zagrada

//POPUP --> SPREMANJE NOVE VRSTE MJERENJA I AUTOMATSKI ODABIR U DROPDOWN-U NAKON
async function saveMeasurementType() {
    // Provjera obveznog naziva
    if (!newTypeName.value.trim()) {
        Notify.create({
            message: 'Naziv mjerenja je obavezan',
            type: 'warning',
            position: 'top'
        })
        return
    }

    // Provjera obvezne mjerne jedinice
    if (!newTypeUnit.value.trim()) {
        Notify.create({
            message: 'Mjerna jedinica je obavezna',
            type: 'warning',
            position: 'top'
        })
        return
    }

    // Uključivanje pokazatelja spremanja
    savingType.value = true

    try {
        // Spremanje nove vrste preko servisne metode
        const novaVrsta = await measurementService.addMeasurementType({
            name: newTypeName.value,
            unit: newTypeUnit.value
        })

        // Osvježavanje popisa vrsta iz baze
        await loadMeasurementTypes()

        // Automatski odabir upravo spremljene vrste
        selectedMeasurementTypeId.value = novaVrsta.id

        // Brisanje teksta iz polja novog unosa
        newTypeName.value = ''
        newTypeUnit.value = ''

        // Zatvaranje prozora nakon spremanja
        typeDialog.value = false

        // Potvrda uspješnog unosa
        Notify.create({
            message: 'Nova vrsta mjerenja je spremljena',
            type: 'positive',
            position: 'top'
        })
    } catch (error) {
        // Zapis detalja greške u konzolu
        console.error('Greška pri spremanju vrste mjerenja', error)

        // Prikaz razumljive poruke
        Notify.create({
            message: error?.message || 'Greška pri spremanju vrste mjerenja',
            type: 'negative',
            position: 'top'
        })
    } finally {
        // Isključivanje pokazatelja spremanja
        savingType.value = false
    }
} // saveMeasurementType
//funkcija koja zatvara popup dodavanja nove vrste mjerenja bez spremanja podataka
function closeDialog() {
    //popup se zatvara
    typeDialog.value = false
} //closeGoalDialog zagrada


// Čitanje dostupnih vrsta mjerenja
async function loadMeasurementTypes() {
    // Uključivanje pokazatelja učitavanja
    loadingTypes.value = true

    // Pokušaj čitanja vrsta mjerenja
    try {
        // Poziv servisne metode
        measurementTypes.value = await measurementService.getMeasurementTypes()

        // Ako postoje vrste mjerenja, odabire se prva
        if (measurementTypes.value.length > 0) {
            // Prva vrsta postaje početni odabir
            selectedMeasurementTypeId.value = measurementTypes.value[0].id
        } // if
    } catch (error) {
        // Zapis greške u razvojnu konzolu
        console.error('Greška pri čitanju vrsta mjerenja', error)

        // Poruka korisniku
        Notify.create({
            message: 'Greška pri čitanju vrsta mjerenja',
            type: 'negative',
            position: 'top'
        })
    } finally {
        // Isključivanje pokazatelja učitavanja
        loadingTypes.value = false
    } // try/catch/finally
} // loadMeasurementTypes

// Provjera unosa i spremanje mjerenja
async function saveMeasurement() {
    // Provjera valjanosti ID-a klijenta
    if (!Number.isInteger(clientId.value) || clientId.value <= 0) {
        // Poruka o neispravnom ID-u
        Notify.create({
            message: 'ID klijenta nije valjan',
            type: 'negative',
            position: 'top'
        })        
        return // Prekid spremanja
    } // if

    // Provjera postoji li odabrana vrsta mjerenja
    if (!Number.isInteger(Number(selectedMeasurementTypeId.value)) || Number(selectedMeasurementTypeId.value) <= 0) {
        // Poruka o nedostajućoj vrsti mjerenja
        Notify.create({
            message: 'Odaberite vrstu mjerenja',
            type: 'warning',
            position: 'top'
        })        
        return  // Prekid spremanja
    } // if

    //čišćenje vanjskih razmaka bez mijenjanja decimalnog separatora
    const unesenaVrijednost = String(measurementValue.value ?? '').trim()
    const validacijaVrijednosti = validacijaVrijednostiMjerenja(unesenaVrijednost)
    //provjera je li vrijednost mjerenja ispravna
     if (validacijaVrijednosti !== true) {
        Notify.create({
            message: validacijaVrijednosti,
            type: 'warning',
            position: 'top'
        })
        return //prekid spremanja
    } // if zagrada
    // Pretvaranje provjerenog teksta u broj
    const numericValue = Number(unesenaVrijednost)

     // Provjera datuma prije spremanja
    const validacijaDatuma = validacijaDatumaMjerenja(measurementDate.value )
    // Prekid spremanja ako datum nije ispravan
    if (validacijaDatuma !== true) {
        Notify.create({
            message: validacijaDatuma,
            type: 'warning',
            position: 'top'
        })
        return
    } //if zagrada

    // Uključivanje pokazatelja spremanja nakon uspješnih provjera
    saving.value = true

    // Pokušaj spremanja zapisa
    try {
        // Poziv servisne metode za unos u bazu
        await measurementService.addMeasurement({
            clientId: clientId.value,
            measurementTypeId: Number(selectedMeasurementTypeId.value),
            value: numericValue,
            date: measurementDate.value.trim()
        })

        // Poruka o uspješnom spremanju
        Notify.create({
            message: 'Mjerenje klijenta je uspješno spremljeno',
            type: 'positive',
            position: 'top'
        })

        // Povratak na karticu mjerenja i prikaz mjerenja
        router.replace({
            path: `/dashboard/clients/${clientId.value}`,
            query: {
                tab: 'mjerenja',
                measurementTypeId: String(selectedMeasurementTypeId.value)
            }
        })
    } catch (error) {
        console.error('Greška pri spremanju mjerenja: ', error)

        // Poruka greške koju je vratio servis ili baza
        Notify.create({
            message: error?.message || error?.error?.message || 'Greška pri spremanju mjerenja',
            type: 'negative',
            position: 'top',
            timeout: 5000
        })
    } finally {
        // Isključivanje pokazatelja spremanja bez obzira na ishod
        saving.value = false
    } // try/catch/finally
} // saveMeasurement

// Početno čitanje vrsta mjerenja pri otvaranju ekrana
onMounted(async () => {
    // Provjera valjanosti ID-a klijenta prije čitanja vrsta
    if (!Number.isInteger(clientId.value) || clientId.value <= 0) {
        // Poruka o neispravnoj ruti
        Notify.create({
            message: 'ID klijenta nije valjan',
            type: 'negative',
            position: 'top'
        })

        // Povratak na prethodni ekran
        router.back()

        // Prekid početnog postupka
        return
    } // if

    // Čitanje vrsta mjerenja
    await loadMeasurementTypes()
}) // onMounted
</script>

<style scoped>
/* Glavna pozadina ekrana za unos mjerenja */
.add-measurement-page {
    height: 100%;
    background: var(--q-dark-page);
}

/* Glavni raspored ekrana */
.add-measurement-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

/* Zaglavlje ekrana */
.page-header {
    flex-shrink: 0;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    position: relative;
}

/* Naslov ekrana */
.page-title {
    color: #BDC4D4;
    font-size: 21px;
    font-weight: 600;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* Gumb za zatvaranje */
.close-button {
    position: absolute;
    right: 12px;
    color: #BDC4D4;
    padding: 0;
    min-width: 0;
}

/* Područje koje se može pomicati */
.page-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px 28px;
    box-sizing: border-box;
}

/* Kontejner polja obrasca */
.measurement-form-container {
    border: 1px solid rgba(189, 196, 212, 0.45);
    border-radius: 16px;
    padding: 16px;
    box-sizing: border-box;
}
.new-measurement-type-button{
    width: 100%;
    min-height: 42px;
    margin-bottom: 4px;
    font-weight: 700;
    margin-top: 14px;
}

/* Oznake polja */
.form-label {
    display: block;
    color: #BDC4D4;
    font-size: 14px;
    font-weight: 800;
    margin: 10px 0 8px;
}
/* Izbornik i polje unosa */
.form-select {
    width: 100%;
    margin-bottom: 18px;    
}
/* Pozadina izbornika */
:deep(.measurement-type-popup) {
    background: #1C2E4A;
    color: #BDC4D4;
    border-radius: 12px;
    border: none;
    padding: 4px 0;
}
/* Opcije izbornika */
:deep(.measurement-type-popup .q-item) {
    color: #BDC4D4;
    font-size: 14px;
}
/* Označena opcija u izborniku */
:deep(.measurement-type-popup .q-item--active) {
    background: rgba(168, 185, 204, 0.18);
    color: #BDC4D4;
}
/* Centrirani tekst u otvorenom padajućem izborniku */
:deep(.measurement-type-popup .q-item__section) {
    text-align: center;
    justify-content: center;
    align-items: center;
}
/* Pozadina kontrola */
:deep(.form-select .q-field__control){
    background: #A8B9CC;
    border-radius: 12px;
    min-height: 42px;
}
/* Tekst unutar polja */
:deep(.form-select .q-field__native) {
    color: #0F1A2B;
    font-weight: 600;
    justify-content: center;
    text-align: center;
}
/* Ikone kontrola */
:deep(.form-select .q-icon) {
    color: #0F1A2B;
}
/* Jedinica uz unesenu vrijednost */
.input-unit {
    color: #0F1A2B;
    font-size: 14px;
    font-weight: 700;
}
/*INPUT POLJA (MJERNA JEDINICA, DATUM, VRIJEDNOST MJERENJA) */
/* Razmak između polja za unos mjerenja */
.measurement-input {
    width: 100%;
    margin-bottom: 12px;
}
/* Ujednačena visina i pozadina polja */
:deep(.measurement-input .q-field__control) {
    min-height: 56px;
    border-radius: 12px;
}

/* Poruka kada nema dostupnih vrsta */
.form-empty-text {
    color: rgba(189, 196, 212, 0.65);
    text-align: center;
    font-size: 13px;
    padding: 16px 0;
}

/* Donji dio ekrana */
.page-footer {
    flex-shrink: 0;
    padding: 12px 16px 20px;
}

/* Gumb spremanja */
.save-button {
    width: 100%;
    min-height: 46px;
    background: #BDC4D4;
    font-weight: 700;
}

/* POPUP PROZOR ZA NOVU VRSTU MJERENJA */
/*pozadina i okvir popupa */
.new-type-dialog{
  width: calc(100vw - 32px);
  max-width: none;
  background: #1C2E4A;
  color: #BDC4D4;
  border-radius: 16px;
}
/*raspored polja u popupu */
.new-type-fields{
  padding: 15px 16px;
}
/* Header popupa. */
.goal-dialog-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* X gumb popupa. */
.goal-dialog-close {
  position: absolute;
  right: 0;
  color: #BDC4D4;
  margin-bottom: 20px;
}
/* Donji dio popupa. */
.new-type-actions {
  padding: 0 16px 16px;
}
/* Gumb za spremanje mjerenja. */
.new-type-save-button {
  width: 100%;
}
/* Jednaki puni obrubi i na polju koje je samo za čitanje */
:deep(.q-field--readonly .q-field__control::before) {
    border-style: solid;
}

</style>