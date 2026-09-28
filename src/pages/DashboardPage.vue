<template>
  <q-page class="dashboard-page">

    <div class="dashboard-content">

      <!-- DOBRODOŠLICA -->
      <div class="welcome-container">
        <div class="welcome-title">
          Dobrodošli {{ trainerName }}!
        </div>
      </div>

      <!-- PRETRAGA -->
      <div class="search-container">
        <q-input
          v-model="searchText"
          class="client-search"
          rounded
          dense
          label="Pretraži klijenta po imenu i/ili prezimenu"
          clearable
          @clear="clearSearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- DODAJ KLIJENTA -->
      <div class="add-client-container">
        <q-btn
          unelevated
          rounded
          class="ivory-button_add_client"
          icon="person_add"
          label="Dodaj klijenta"
          @click="openAddClient"
        />
      </div>

      <!-- NEAKTIVNI KLIJENTI -->
      <section class="clients-section">

        <div class="section-title-container">
          <span class="status-dot inactive"></span>
          <span class="section-title">
            Neaktivni
          </span>
        </div>

        <div
          v-if="filteredInactiveClients.length"
          class="clients-list"
        >

          <div
            v-for="client in filteredInactiveClients"
            :key="client.id"
            class="client-card"
          >

            <div class="client-icon-container">
              <q-icon
                name="person"
                size="32px"
              />
            </div>

            <div class="client-info">

              <div class="client-name">
                {{ client.firstName }} {{ client.lastName }}
              </div>

              <div class="client-detail">
                {{ client.gender }}
              </div>

              <div class="client-detail">
                {{ client.contact }}
              </div>

            </div>

            <div class="client-actions">
              <q-btn
                unelevated
                rounded
                class="details-button"
                label="Detalji"
                @click="openClientDetails(client)"
              />
            </div>

          </div>

        </div>

        <div
          v-else
          class="empty-state"
        >
          Nema neaktivnih klijenata
        </div>

      </section>

      <!-- AKTIVNI KLIJENTI -->
      <section class="clients-section">

        <div class="section-title-container">
          <span class="status-dot active"></span>
          <span class="section-title">
            Aktivni
          </span>
        </div>

        <div
          v-if="filteredActiveClients.length"
          class="clients-list"
        >

          <div
            v-for="client in filteredActiveClients"
            :key="client.id"
            class="client-card"
          >

            <div class="client-icon-container">
              <q-icon
                name="person"
                size="32px"
              />
            </div>

            <div class="client-info">

              <div class="client-name">
                {{ client.firstName }} {{ client.lastName }}
              </div>

              <div class="client-detail">
                {{ client.gender }}
              </div>

              <div class="client-detail">
                {{ client.contact }}
              </div>

            </div>

            <div class="client-actions">
              <q-btn
                unelevated
                rounded
                class="details-button"
                label="Detalji"
                @click="openClientDetails(client)"
              />
            </div>

          </div>

        </div>

        <div
          v-else
          class="empty-state"
        >
          Nema aktivnih klijenata
        </div>

      </section>

    </div>

  </q-page>

</template>

<script setup>

// Uvoz computed funkcije za stvaranje izvedenih reaktivnih vrijednosti.
import { computed, onMounted, ref } from 'vue'
// Uvoz Vue Router funkcije za navigaciju između ekrana aplikacije.
import { useRouter } from 'vue-router'
// Dohvat trenutno aktivne router instance.
const router = useRouter()

// Uvoz Quasar Notify funkcije za prikaz poruka treneru.
import { Notify } from 'quasar'

// Uvoz Pinia store-a koji sadrži podatke trenutno prijavljenog trenera.
import { useAuthStore } from '@/stores/auth.store'
// Dohvat instance auth store-a.
const authStore = useAuthStore();

// Uvoz servisa koji sadrži operacije vezane uz klijente.
import clientService from '@/services/client.service'

// Reaktivna varijabla koja sadrži tekst koji trener upisuje u tražilicu.
const searchText = ref('')
// Reaktivna varijabla koja sadrži sve klijente trenutno prijavljenog trenera.
const clients = ref([])
// Reaktivna varijabla koja označava traje li trenutno učitavanje klijenata.
const loading = ref(false)

// Izvedena reaktivna vrijednost koja dohvaća ime trenutno prijavljenog trenera iz auth store-a.
const trainerName = computed(() => {
    // Vraćamo ime trenera iz Pinia store-a.
  return authStore.trainerName
}) //const trainerName zagrada

// Izvedena reaktivna vrijednost koja normalizira tekst iz tražilice.
const normalizedSearch = computed(() => {
  //uzima se ono što je trener upisao u tražilicu
  return searchText.value
    .trim()                //uklanjanje razmaka s početka i kraja unosa
    .replace(/\s+/g, ' ')  //pretvara više uzastupnih razmaka unutar teksta u jedan razmak
    .toLowerCase()         //pretvorba teksta u mala slova radi pretraživanja neovisnog o velikim/malim slovima.
})

//funkcija da se kod brisanja pretrage (klik na x u tražilici) ponovno prikažu svi klijenti
function clearSearch() {
  //postavlja se teskt tražilice na prazan string
  searchText.value = ''

} //clearSearch() zagrada

//funkcija za provjeru odgovara li klijent unesenom tekstu u tražilici
function matchesSearch(client) {
  //ako je tražiica prazna, svaki klijent odgovara pretrazi -->prikazuju se svi klijenti prikazanog trenera iz baze
  if (!normalizedSearch.value) {
    //vraća true jer nema aktivnog kriterija pretrage - kako bi se klijenti prikazali
    return true
  }

  //spaja se ime i prezime u jedan tekst
  const fullName = `${client.firstName} ${client.lastName}`
    .trim()                 //uklanjanje razmaka
    .replace(/\s+/g, ' ')   //pretvorba više razmaka u jedan razmak
    .toLowerCase()          //pretvorba imena i prezimena u mala slova
  
    //razdvajanje onog što je trener unio u pojedine riječi
    const searchWords = normalizedSearch.value.split(' ')
    //provjera mora li se svaka unesena riječ pronaći u imenu ili prezimenu
    return searchWords.every(word => {
      //provjera nalazi li se trenutna riječ unutar punog imena ili prezimena
      return fullName.includes(word)
    }) //searchWords zagrada

    //return fullName.includes(normalizedSearch.value)

} //matchesSearch zagrada

//izvedeni popis neaktivnih klijenata
const filteredInactiveClients =  computed(() => {
  //iz svih klijenata uzima se samo neaktivne klijente koje odgovaraju pretrazi
    return clients.value.filter(
      client =>!client.active && matchesSearch(client)
    ) //return zagrada
}) //filteredInactiveClients zagrada

//izvedeni popis aktivnih klijenata
const filteredActiveClients =  computed(() => {
  //iz svih klijenata vraća klijente koji su aktivni koji odgovaraju pretrazi
    return clients.value.filter(
        client => client.active && matchesSearch(client)
    ) //return zagrada
}) //redActiveClients zagrada

// FUNKCIJA ZA DOHVAT KLIJENATA
async function loadClients() {
// Provjera postoji li ID trenutno prijavljenog trenera.
  if (!authStore.trainerId) {
    // Ako trener nije prijavljen, vraća se na login ekran.
    router.push('/login')
    //prekida se daljnje izvršavanje funkcije dohvata klijenata
    return
  } //if zagrada

   // Uključivanje loading stanje prije početka dohvaćanja podataka.
  loading.value = true

  //try blok za pokušaje dohvata klijenata
  try {

    //dohvat samo klijenata trenutno prijavljenog trenera
    clients.value = await clientService.getClientsForTrainer(
          authStore.trainerId
    ) //clients.value zagrada

  } catch (error) {

    //ispis u konzolu ukoliko se dogodi greški pri dohvatu klijenta
    console.error('Greška pri dohvaćanju klijenata:', error )

    //prikaz poruke treneru na ekranu ukoliko se dogodi greški pri dohvatu klijenta
    Notify.create({
      type: 'negative',
      message: 'Nije moguće dohvatiti klijente.',
      position: 'top',                              //položaj poruke na ekranu
      timeout: 2500                                 //vrijeme prikaza poruke u milisekundama
    }) //notify create zagrada

    // Blok koji se izvršava bez obzira na uspjeh ili grešku.
  } finally {
    //isključivanje loading stanja nakon završetka dohvaćanja
    loading.value = false
  } //finaly zagrada
} //async function zagrada

//učitavanje klijenata pri otvaranju ekrana/kda se dashboard otvori
onMounted(() => {
  //pokretanje funkcije za dohvat klijenata
  loadClients()
})

//funkcija za otvaranje ekrana za dodavanje klijenta
function openAddClient() {
  //navigacija na ekran za dodavanje klijenta
  router.push('/dashboard/add-client')
} //openAddClient zagrada

//funkcija za otvaranje ekrana detalja odabranog klijenta
function openClientDetails(client) {
  //navigacija na ekran detalja odabranog klijenta pomoću ID-ja klijenta
  router.push(`/dashboard/clients/${client.id}`)
} // openClientDetails zagrada

</script>

<style scoped>

.dashboard-page {
  background: var(--q-dark-page);
}

/* SADRŽAJ DASHBOARD EKRANA */
.dashboard-content {
  width: 100%;                 /*zauzima cijelu širinu mobilnom ekrana */
  max-width: none;
  margin: 0;                   /* Uklanjanje automatskog centriranja desktop sadržaja. */
  padding: 16px 12px 28px;     /* Unutarnji razmak sadržaja od rubova mobilnog ekrana. */
 box-sizing: border-box;      /* Sprječavanje problema s box modelom kod širine i paddinga. */
}

/* DOBRODOŠLICA */

.welcome-container {
  margin-bottom: 20px;
}

.welcome-title {
  color: #BDC4D4; /* ivory */
  font-size: 21px;
  font-weight: 600;
}

/* PRETRAGA */

.search-container {
  margin-top: 25px;
  margin-bottom: 30px;
}

/* DODAJ KLIJENTA */

.add-client-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
}

.client-search {
  background: #fffff0;
  border-radius: 14px;
}

.client-search :deep(.q-field__control) {
  background: #fffff0;
  border-radius: 14px;
  color: #111111;
}

.client-search :deep(.q-field__label),
.client-search :deep(.q-field__native),
.client-search :deep(.q-icon) {
  color: #222222;
}

.ivory-button_add_client {
  background: #fffff0;
  color: #111111;
}

.details-button {
  min-width: 78px;
  background: #fffff0;
  color: #111111;
  
}

/* GLAVNI KONTEJNER KLIJENATA */

.clients-section {
  border: 1px solid rgba(189, 196, 212, 0.35);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

/* NASLOV SEKCIJE */

.section-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.active {
  background: #21ba45;
}

.status-dot.inactive {
  background: #c10015;
}

.section-title {
  color: #BDC4D4;
  font-size: 18px;
  font-weight: 600;
}

/* POPIS KARTICA */

.clients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* KARTICA KLIJENTA */

.client-card { 
  display: flex;                                   /* Kartica koristi horizontalni raspored. */
  align-items: center;                             /* Vertikalno centriranje sadržaja kartice. */
  gap: 10px;                                       /* Razmak između elemenata kartice. */

  border: 1px solid rgba(189, 196, 212, 0.25);   /* Obrub kartice. */
  border-radius: 12px;                             /* Zaobljenje rubova kartice. */

  padding: 12px;                                   /* Unutarnji razmak kartice. */
  min-height: 90px;                                /* Minimalna visina kartice. */
}

/* IKONA */

.client-icon-container {
  flex: 0 0 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* PODACI */

.client-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.client-name {
  color: #BDC4D4;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;   /* Razmak ispod imena. */
}

.client-detail {
  color: rgba(189, 196, 212, 0.8);   /* Boja dodatnih podataka klijenta. */
  font-size: 13px;
  margin-top: 2px;                     /* Mali razmak iznad podatka. */
}

/* GUMB */

.client-actions {
  flex: 0 0 auto;  
}

/* PRAZNO */

.empty-state {
  text-align: center;
  padding: 20px 10px;
  color: rgba(189, 196, 212, 0.65);
}

 .client-actions .q-btn {
    padding: 4px 8px;       /* Vertikalni unutarnji razmak gumba. */
    font-size: 12px;        /* Veličina teksta gumba. */
  }

</style>