<!-- EKRAN ZA DODAVANJE VRIJEDNOSTI KRVNE SLIKE KLIJENTA -->

<template>
  <!-- Glavna stranica za unos nalaza krvne slike -->
  <q-page class="add-blood-test-page">
    <!-- Glavni fleksibilni kontejner stranice -->
    <div class="add-blood-test-content">
      <!-- Zaglavlje ekrana -->
      <div class="page-header">
        <!-- Naslov ekrana podijeljen u dva retka -->
        <div class="page-title">
          <span>DODAVANJE KRVNE</span>
          <span>SLIKE KLIJENTA</span>
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

      <!-- Područje obrasca koje se može pomicati -->
      <div class="page-scroll-area">
        <!-- Glavni kontejner datuma i parametara -->
        <div class="blood-test-form-container">
          
          <!-- Polje za datum nalaza -->
          <q-input
            outlined
            rounded
            dark
            v-model="bloodTestDate"
            type="text"
            inputmode="numeric"
            autocomplete="off"            
            class="measurement-input"
            label="Datum nalaza (GGGG-MM-DD)"
            placeholder="pr. 2026-01-31"
            aria-label="Datum nalaza"            
            :rules="[validacijaDatumaNalaza]"
            color="primary"
            lazy-rules
          />

          <!-- Naslov sekcije parametara -->
          <div class="parameters-title">
            PARAMETRI NALAZA
          </div>

          <!-- Prikaz svih kategorija parametara -->
          <div class="categories-container">
            <!-- Ponavljanje kategorija prema definiranom popisu -->
            <div
              v-for="category in categoriesWithParameters"
              :key="category.name"
              class="parameter-category"
            >
              <!-- Zaglavlje kategorije koje otvara ili zatvara sadržaj -->
              <div
                class="category-header"
                @click="toggleCategory(category.name)"
              >
                <!-- Naziv kategorije -->
                <span class="category-name">
                  {{ category.name }}
                </span>

                <!-- Ikona ovisno o stanju kategorije -->
                <q-icon
                  :name="openedCategories.includes(category.name) ? 'remove' : 'add'"
                  class="category-icon"
            />
              </div>

              <!-- Sadržaj kategorije prikazuje se samo kada je otvorena -->
              <div
                v-if="openedCategories.includes(category.name)"
                class="category-content"
              >
                <!-- Ponavljanje parametara koji pripadaju kategoriji -->
                <div
                  v-for="parameter in category.parameters"
                  :key="parameter.id"
                  class="parameter-row"
                >
                  <!-- Naziv parametra iz baze -->
                  <div class="parameter-name">
                    {{ parameter.name }}
                  </div>

                  <!-- Red s unosom vrijednosti i mjernom jedinicom -->
                  <div class="parameter-input-row">
                    <!-- Polje za unos vrijednosti parametra -->
                    <q-input
                      v-model="parameterValues[parameter.id]"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      outlined
                      rounded
                      dark
                      class="parameter-input"
                      :aria-label="parameter.name"
                      color="primary"
                      hide-bottom-space
                    />

                    <!-- Mjerna jedinica parametra dohvaćena iz baze -->
                    <span class="parameter-unit">
                      {{ parameter.unit }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Poruka kada parametri nisu učitani -->
          <div
            v-if="!loadingParameters && parameters.length === 0"
            class="form-empty-text"
          >
            NEMA DOSTUPNIH PARAMETARA
          </div>
        </div>
      </div>

      <!-- Donji dio ekrana s gumbom spremanja -->
      <div class="page-footer">
        <!-- Gumb za spremanje nalaza krvne slike -->
        <q-btn
          unelevated
          rounded
          color="primary"
          class="save-button"
          label="SPREMI"
          :loading="saving"
          :disable="saving || loadingParameters || parameters.length === 0"
          @click="saveBloodTest"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
// Vue funkcije za reaktivno stanje i životni ciklus
import { computed, onMounted, ref } from 'vue'

// Router omogućuje čitanje ID-a klijenta i navigaciju
import { useRoute, useRouter } from 'vue-router'

// Inicijalizacija routera
const router = useRouter()

// Inicijalizacija aktivne rute
const route = useRoute()

// Servis za prikaz obavijesti
import { Notify } from 'quasar'

// Servis za dohvat i spremanje nalaza krvne slike
import bloodTestService from '@/services/bloodTest.service'

// Popis svih parametara krvne slike dohvaćenih iz baze
const parameters = ref([])

// Datum nalaza
const bloodTestDate = ref('')

// Objekt koji čuva unesene vrijednosti prema ID-u parametra
const parameterValues = ref({})

// Popis trenutno otvorenih kategorija
const openedCategories = ref([])

// Oznaka učitavanja parametara
const loadingParameters = ref(false)

// Oznaka spremanja nalaza
const saving = ref(false)

// ID klijenta dohvaćen iz parametra rute
const clientId = computed(() => Number(route.params.id))

// Statički popis kategorija i pripadajućih naziva parametara
// Nazivi parametara moraju odgovarati nazivima u seed podacima baze
const categoryDefinitions = [
  {
    // Kategorija opće krvne slike
    name: 'Opća krvna slika',

    // Parametri koji pripadaju općoj krvnoj slici
    parameterNames: [
      'K Leukociti_Lkc',
      'K Neutrofilni granulociti',
      'K Eozinofilni granulociti',
      'K Bazofilni granulociti',
      'K Monociti',
      'K Limfociti',
      'K Netrofilni granulociti rel',
      'K Eozinofilni granulociti rel',
      'K Bazofilni granulociti rel',
      'K Monociti rel',
      'K Limfociti rel',
      'K Eritrociti Erc',
      'K Hemoglobin Hb',
      'K Hematokrit Hct',
      'K prosječni volumen eritrocita MCV',
      'K prosječna količina hemoglobina u eritrocitu MCH',
      'K prosječna koncentracija hemoglobina u eritrocitima MCHC',
      'K raspodjela eritrocita po volumenu RDW',
      'K Trombociti Trc',
      'K prosječni volumen trombocita MPV'
    ]
  },
  {
    // Kategorija željeza i statusa željeza
    name: 'Željezo i status željeza',

    // Parametri koji pripadaju statusu željeza
    parameterNames: [
      'S Željezo Fe',
      'S Željezo ukupni kapacitet vezanja željeza',
      'S Željezo nezasićeni kapacitet vezanja željeza',
      'S zalihe željeza feritin muško',
      'S zalihe željeza feritin žensko'
    ]
  },
  {
    // Kategorija bubrežne funkcije i glukoze
    name: 'Bubrežna funkcija i glukoza',

    // Parametri koji pripadaju bubrežnoj funkciji i glukozi
    parameterNames: [
      'S glukoza serum', // Parametar koji pripada glukozi
      'S Kreatinin',
      'Urea'
    ]
  },
  {
    // Kategorija elektrolita
    name: 'Elektroliti',

    // Parametri koji pripadaju elektrolitima
    parameterNames: [
      'Elektroliti S natrij serum plazma',
      'Elektroliti S kalij',
      'Elektroliti S kalcij',
      'Elektroliti S magnezij'
    ]
  },
  {
    // Kategorija jetrenih enzima
    name: 'Jetreni enzimi',

    // Parametri koji pripadaju jetrenim enzimima
    parameterNames: [
      'Jetreni enzim S Aspartat aminotransfereza AST',
      'Jetreni enzim S Alanin aminotransfereza ALT',
      'Jetreni enzim S Gama glutamiltransfereza GGT'
    ]
  },
  {
    // Kategorija upalnih parametara
    name: 'Upalni parametri',

    // Parametri koji pripadaju upalnim pokazateljima
    parameterNames: [
      'Upale CRP'
    ]
  },
  {
    // Kategorija lipidnog profila
    name: 'Lipidni profil',

    // Parametri koji pripadaju lipidnom profilu
    parameterNames: [
      'S Kolesterol ukupni',
      'S Kolesterol HDL',
      'S LDL Kolesterol',
      'S trigliceridi'
    ]
  },
  {
    // Zajednička kategorija svih hormona
    name: 'Hormoni',

    // Parametri koji pripadaju svim hormonskim nalazima
    parameterNames: [
      'Kortizol jutarnji sati',
      'Kortizol poslijepodnevni sati',
      'TSH tireotropni hormon štitnjače',
      'FT4 slobodni tiroksin štitnjača',
      'FT3 slobodni trijodotironin štitnjača',
      'Hormoni ukupni testosteron muško',
      'Hormoni ukupni testosteron žensko',
      'DHEAS muško',
      'DHEAS žensko',
      'DHEAS žensko menopauza'
    ]
  },
  {
    // Kategorija vitamina
    name: 'Vitamini',

    // Parametri koji pripadaju vitaminima
    parameterNames: [
      'Vitamin D3',
      'Vitamin B12'
    ]
  }
]

// Kategorije povezane s parametrima koji su stvarno dohvaćeni iz baze
const categoriesWithParameters = computed(() => {
  // Obrada svake statički definirane kategorije
  return categoryDefinitions.map(category => {
    // Dohvaćanje parametara prema njihovim nazivima
    const categoryParameters = parameters.value.filter(parameter =>
      category.parameterNames.includes(parameter.name)
    )

    // Vraćanje kategorije s pripadajućim parametrima
    return {
      name: category.name,
      parameters: categoryParameters
    }
  }).filter(category => category.parameters.length > 0)
})

// Povratak na detalje klijenta i karticu krvne slike
function closePage() {
  // Navigacija na detalje trenutno odabranog klijenta
  router.replace({
    path: `/dashboard/clients/${clientId.value}`,

    // Odabir kartice krvne slike
    query: {
      tab: 'krvnaSlika'
    }
  })
}

// Otvaranje ili zatvaranje odabrane kategorije
function toggleCategory(categoryName) {
  // Provjera je li kategorija već otvorena
  const categoryIsOpen = openedCategories.value.includes(categoryName)

  // Uklanjanje kategorije iz otvorenih ako je već otvorena
  if (categoryIsOpen) {
    openedCategories.value = openedCategories.value.filter(
      name => name !== categoryName
    )

    // Prekid funkcije nakon zatvaranja kategorije
    return
  }

  // Dodavanje kategorije u popis otvorenih kategorija
  openedCategories.value = [
    ...openedCategories.value,
    categoryName
  ]
}

// FUNKCIJA ZA VALIDACIJU DATUMA NALAZA
function validacijaDatumaNalaza(value) {
  // Uklanjanje vanjskih razmaka iz datuma
  const datum = String(value ?? '').trim()

  // Provjera obveznog datuma
  if (!datum) {
    return 'Datum nalaza je obavezan'
  }

  // Provjera formata godine, mjeseca i dana
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    return 'Datum nalaza mora biti u formatu GGGG-MM-DD'
  }

  // Razdvajanje datuma na godinu, mjesec i dan
  const [year, month, day] = datum.split('-').map(Number)

  // Stvaranje datuma u UTC formatu
  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  // Provjera odgovaraju li dijelovi datuma stvarnom kalendarskom datumu
  const isRealDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day

  // Prekid provjere ako datum ne postoji u kalendaru
  if (!isRealDate) {
    return 'Datum nalaza ne postoji u kalendaru'
  }

  // Pretvaranje današnjeg datuma u UTC oblik bez vremena
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  )

  // Prekid unosa ako je datum nalaza u budućnosti
  if (parsedDate > todayUtc) {
    return 'Datum nalaza ne može biti u budućnosti'
  }

  // Potvrda valjanog datuma
  return true
}

// Učitavanje parametara krvne slike iz baze
async function loadParameters() {
  // Uključivanje oznake učitavanja
  loadingParameters.value = true

  // Pokušaj dohvaćanja parametara
  try {
    // Poziv postojeće servisne metode
    parameters.value = await bloodTestService.getBloodTestParametars()
  } catch (error) {
    // Zapis greške u razvojnu konzolu
    console.error('Greška pri dohvaćanju parametara krvne slike', error)

    // Obavijest o neuspješnom učitavanju
    Notify.create({
      message: error?.message || 'Greška pri dohvaćanju parametara krvne slike',
      type: 'negative',
      position: 'top',
      timeout: 5000
    })
  } finally {
    // Isključivanje oznake učitavanja
    loadingParameters.value = false
  }
}

// Provjera unesenih vrijednosti i spremanje nalaza
async function saveBloodTest() {
  // Provjera valjanosti ID-a klijenta
  if (!Number.isInteger(clientId.value) || clientId.value <= 0) {
    // Obavijest o neispravnom ID-u
    Notify.create({
      message: 'ID klijenta nije valjan',
      type: 'negative',
      position: 'top'
    })

    // Prekid spremanja
    return
  }

    // Provjera datuma nalaza
  const dateValidation = validacijaDatumaNalaza(bloodTestDate.value)

  // Prekid spremanja ako datum nije valjan
  if (dateValidation !== true) {
    // Prikaz poruke o neispravnom datumu
    Notify.create({
      message: dateValidation,
      type: 'warning',
      position: 'top'
    })

    // Prekid spremanja
    return
  }

  // Priprema popisa parametara koji imaju unesenu vrijednost
  const enteredParameters = parameters.value
    .map(parameter => {
      // Dohvaćanje vrijednosti unesenog parametra
      const enteredValue = String(
        parameterValues.value[parameter.id] ?? ''
      ).trim()

      // Vraćanje parametra i unesene vrijednosti
      return {
        parameter,
        enteredValue
      }
    })
    // Preskakanje praznih polja
    .filter(item => item.enteredValue !== '')

  // Provjera postoji li barem jedna unesena vrijednost
  if (enteredParameters.length === 0) {
    // Obavijest o praznom unosu parametara
    Notify.create({
      message: 'Unesite barem jednu vrijednost krvne slike',
      type: 'warning',
      position: 'top'
    })

    // Prekid spremanja
    return
  }

  // Provjera svih unesenih vrijednosti prije spremanja
  for (const item of enteredParameters) {
    // Tekst unesene vrijednosti
    const valueText = item.enteredValue

    // Provjera decimalnog separatora
    if (valueText.includes(',')) {
      // Obavijest o decimalnoj točki
      Notify.create({
        message: `Decimalni broj vrijednosti parametra ${item.parameter.name} odvaja se točkom (.)`,
        type: 'warning',
        position: 'top'
      })

      // Prekid spremanja
      return
    }

    // Provjera oblika cijelog ili decimalnog broja
    if (!/^\d+(?:\.\d+)?$/.test(valueText)) {
      // Obavijest o neispravnoj vrijednosti
      Notify.create({
        message: `Vrijednost parametra ${item.parameter.name} mora biti broj veći ili jednak nuli`,
        type: 'warning',
        position: 'top'
      })

      // Prekid spremanja
      return
    }

    // Pretvaranje tekstualnog unosa u broj
    const numericValue = Number(valueText)

    // Provjera je li vrijednost konačan broj i nije negativna
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      // Obavijest o neispravnoj brojčanoj vrijednosti
      Notify.create({
        message: `Vrijednost parametra ${item.parameter.name} mora biti veća ili jednaka nuli`,
        type: 'warning',
        position: 'top'
      })

      // Prekid spremanja
      return
    }
  }

  // Uključivanje oznake spremanja nakon provjera
  saving.value = true

  // Pokušaj spremanja svih unesenih parametara
  try {
    // Ponavljanje svih parametara s unesenim vrijednostima
    for (const item of enteredParameters) {
      // Spremanje pojedinačnog parametra kroz postojeću servisnu metodu
      await bloodTestService.SaveClientBloodTest({
        // ID klijenta
        clientId: clientId.value,

        // ID parametra dohvaćenog iz baze
        bloodParametarId: item.parameter.id,

        // Pretvaranje provjerene vrijednosti u broj
        value: Number(item.enteredValue),

        // Datum zajednički svim parametrima nalaza
        date: bloodTestDate.value.trim()
      })
    }

    // Obavijest o uspješnom spremanju nalaza
    Notify.create({
      message: 'Nalaz krvne slike uspješno je spremljen',
      type: 'positive',
      position: 'top'
    })

    // Povratak na detalje klijenta
    router.replace({
      path: `/dashboard/clients/${clientId.value}`,

      // Odabir kartice krvne slike
      query: {
        tab: 'krvnaSlika'
      }
    })
  } catch (error) {
    // Zapis detalja greške u razvojnu konzolu
    console.error('Greška pri spremanju nalaza krvne slike', error)

    // Prikaz poruke o neuspješnom spremanju
    Notify.create({
      message: error?.message || 'Greška pri spremanju nalaza krvne slike',
      type: 'negative',
      position: 'top',
      timeout: 5000
    })
  } finally {
    // Isključivanje oznake spremanja bez obzira na ishod
    saving.value = false
  }
}

// Početno učitavanje parametara pri otvaranju stranice
onMounted(async () => {
  // Provjera valjanosti ID-a klijenta
  if (!Number.isInteger(clientId.value) || clientId.value <= 0) {
    // Obavijest o neispravnom ID-u
    Notify.create({
      message: 'ID klijenta nije valjan',
      type: 'negative',
      position: 'top'
    })

    // Povratak na prethodnu stranicu
    router.back()

    // Prekid početnog postupka
    return
  }

  // Učitavanje parametara krvne slike
  await loadParameters()
})
</script>

<style scoped>
/* Glavna pozadina ekrana za unos nalaza krvne slike */
.add-blood-test-page {
  height: 100%;
  background: var(--q-dark-page);
}

/* Glavni raspored ekrana */
.add-blood-test-content {
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

/* Gumb za zatvaranje ekrana */
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
  margin-top: 12px;
}

/* Glavni kontejner datuma i kategorija */
.blood-test-form-container {
  border: 1px solid rgba(189, 196, 212, 0.45);
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
}

/* Polje datuma nalaza */
.measurement-input {
  width: 100%;
  margin-bottom: 18px;
}

/* Visina i pozadina polja datuma */
:deep(.measurement-input .q-field__control) {
  min-height: 56px;
  border-radius: 12px;
}

/* Naslov parametara nalaza */
.parameters-title {
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 800;
  margin: 12px 0;
}

/* Kontejner svih kategorija */
.categories-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Okvir pojedine kategorije */
.parameter-category {
  border: 1px solid rgba(189, 196, 212, 0.35);
  border-radius: 12px;
  overflow: hidden;
}

/* Zaglavlje kategorije */
.category-header {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: rgba(168, 185, 204, 0.08);
}

/* Naziv kategorije */
.category-name {
  color: #BDC4D4;
  font-size: 14px;
  font-weight: 700;
}

/* Ikona otvaranja i zatvaranja kategorije */
.category-icon {
  color: #BDC4D4;
  font-size: 22px;
}

/* Sadržaj otvorene kategorije */
.category-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Red pojedinog parametra */
.parameter-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Naziv parametra */
.parameter-name {
  color: #BDC4D4;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

/* Red polja i mjerne jedinice */
.parameter-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Polje za brojčanu vrijednost parametra */
.parameter-input {
  flex: 1;
  min-width: 0;
}
/* Ujednačena visina polja parametra */
:deep(.parameter-input .q-field__control) {
  min-height: 42px;
  height: 38px;
  border-radius: 10px;
  background: transparent;
}
/* Tekst unesene vrijednosti */
:deep(.parameter-input .q-field__native) {
  color: #BDC4D4;
  font-weight: 600;
}

/* Mjerna jedinica parametra */
.parameter-unit {
  color: #BDC4D4;
  font-size: 12px;
  font-weight: 700;
  min-width: 65px;
  max-width: 100px;
  text-align: left;
  overflow-wrap: anywhere;
}

/* Poruka kada nema parametara */
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

/* Gumb spremanja nalaza */
.save-button {
  width: 100%;
  min-height: 46px;
  background: #BDC4D4;
  font-weight: 700;
}
</style>