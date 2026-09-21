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
          Nema neaktivnih klijenata.
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
          Nema aktivnih klijenata.
        </div>

      </section>

    </div>

  </q-page>

</template>

<script setup>

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

import { Notify } from 'quasar'

import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore();

import clientService from '@/services/client.service'

const searchText = ref('')
const clients = ref([])
const loading = ref(false)

const trainerName = computed(() => {
  return authStore.trainerName
})

/*
 * PRIVREMENI TESTNI PODACI
 *
 * Ovo će se kasnije zamijeniti podacima
 * iz database.service.js.
 */
/*
const clients = ref([
  {
    id: 1,
    firstName: 'Ana',
    lastName: 'Anić',
    gender: 'Ž',
    contact: '098-123-45678',
    active: false,
  },
  {
    id: 2,
    firstName: 'Ivo',
    lastName: 'Ivić',
    gender: 'M',
    contact: '098-123-45678',
    active: false,
  },
  {
    id: 3,
    firstName: 'Pero',
    lastName: 'Perić',
    gender: 'M',
    contact: '098-123-45678',
    active: true,
  },
  {
    id: 4,
    firstName: 'Ivana',
    lastName: 'Ivanić',
    gender: 'Ž',
    contact: '098-123-45678',
    active: true,
  },
  {
    id: 5,
    firstName: 'Marko',
    lastName: 'Marić',
    gender: 'M',
    contact: '098-123-45678',
    active: true,
  },
  {
    id: 6,
    firstName: 'Petra',
    lastName: 'Perić',
    gender: 'Ž',
    contact: '098-123-45678',
    active: true,
  },
])
  */

const normalizedSearch = computed(() => {
  return searchText.value
    .trim()
    .toLowerCase()
})

function matchesSearch(client) {
  if (!normalizedSearch.value) {
    return true
  }

  const fullName = `${client.firstName} ${client.lastName}`
    .toLowerCase()
  return fullName.includes(normalizedSearch.value)
}

const filteredInactiveClients =  computed(() => {
    return clients.value.filter(
      client =>!client.active && matchesSearch(client)
    )
  })

const filteredActiveClients =  computed(() => {
    return clients.value.filter(
        client => client.active && matchesSearch(client)
    )
  })

// DOHVAT KLIJENATA
async function loadClients() {

  if (!authStore.trainerId) {
    router.push('/login')
    return
  }

  loading.value = true

  try {

    clients.value = await clientService.getClientsForTrainer(
          authStore.trainerId
    )

  } catch (error) {

    console.error(
      'Greška pri dohvaćanju klijenata:',
      error
    )

    Notify.create({
      type: 'negative',
      message: 'Nije moguće dohvatiti klijente.',
      position: 'top',
      timeout: 2500
    })

  } finally {
    loading.value = false
  }
} //async function zagrada

onMounted(() => {
  loadClients()
})

function openAddClient() {
  router.push('/dashboard/add-client')
}

function openClientDetails(client) {
  router.push(`/dashboard/clients/${client.id}`)
}

</script>

<style scoped>

.dashboard-page {
  background: var(--q-dark-page);
}

.dashboard-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 32px;
}

/* DOBRODOŠLICA */

.welcome-container {
  margin-bottom: 20px;
}

.welcome-title {
  color: #BDC4D4; /* ivory */
  font-size: 24px;
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
  display: flex;
  align-items: center;
  gap: 12px;

  border: 1px solid rgba(189, 196, 212, 0.25);
  border-radius: 12px;

  padding: 14px;
  min-height: 90px;
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
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.client-detail {
  color: rgba(189, 196, 212, 0.8);
  font-size: 14px;
  margin-top: 2px;
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

/* MOBITEL */

@media (max-width: 500px) {
  .dashboard-content {
    padding: 16px 12px 28px;
  }

  .welcome-title {
    font-size: 21px;
  }

  .client-card {
    padding: 12px;
    gap: 10px;
  }

  .client-name {
    font-size: 15px;
  }

  .client-detail {
    font-size: 13px;
  }

  .client-actions .q-btn {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>