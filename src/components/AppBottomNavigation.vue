<!-- donja navigacija aplikacije -- ikone za dashboard/popis klijenata, popis vrsta treninga/vježbi, kalendar i profil trenera -->


<template>
    <!-- Donja navigacija aplikacije -->
    <q-footer class="app-footer">

        <!-- Kartica se određuje prema aktivnoj ruti -->
        <q-tabs
            :model-value="activeTab"
            no-caps
            active-color="secondary"
            inactive-color="tertiary"
            indicator-color="secondary"
            class="bottom-navigation"
            @update:model-value="navigateToTab"
        >

            <!-- Kartica za početni ekran i popis klijenata -->
            <q-tab
                name="dashboard"
                icon="groups"
                aria-label="Klijenti"
            />

            <!-- Kartica za popis vrsta treninga i vježbi -->
            <q-tab
                name="vrste-treninga"
                icon="fitness_center"
                aria-label="Vrste treninga"
            />

            <!-- Kartica za kalendar -->
            <q-tab
                name="calendar"
                icon="calendar_month"
                aria-label="Termini"
            />

            <!-- Kartica za profil trenera -->
            <q-tab
                name="profile"
                icon="person"
                aria-label="Profil"
            />

        </q-tabs>

    </q-footer>
</template>

<script setup>

// Uvoz computed funkcije za praćenje aktivne kartice
import { computed } from 'vue'

// Uvoz router funkcija za čitanje rute i navigaciju
import { useRoute, useRouter } from 'vue-router'

// Dohvat aktivne rute
const route = useRoute()

// Dohvat router instance
const router = useRouter()

// Određivanje aktivne kartice prema trenutačnoj ruti
const activeTab = computed(() => {

    // Sve stranice unutar odjeljka vrsta treninga pripadaju drugoj kartici
    if (route.path.startsWith('/dashboard/vrste-treninga')) {
        return 'vrste-treninga'
    }

    // Stranice kalendara pripadaju trećoj kartici
    if (route.path.startsWith('/dashboard/calendar')) {
        return 'calendar'
    }

    // Profil pripada četvrtoj kartici
    if (route.path.startsWith('/dashboard/profile')) {
        return 'profile'
    }

    // Sve ostale dashboard stranice pripadaju prvoj kartici
    return 'dashboard'

}) // activeTab

// Navigacija nakon odabira kartice
function navigateToTab(tabName) {

    // Određivanje odredišne rute prema odabranoj kartici
    const routes = {
        dashboard: '/dashboard',
        'vrste-treninga': '/dashboard/vrste-treninga',
        calendar: '/dashboard/calendar',
        profile: '/dashboard/profile'
    }

    // Otvaranje odabrane stranice
    if (routes[tabName]) {
        router.push(routes[tabName])
    }

} // navigateToTab

</script>

<style scoped>

/* Pozadina donje navigacije */
.app-footer {
    background: #111827;
}

/* Visina donje navigacije */
.bottom-navigation {
    min-height: 64px;
}

</style>
