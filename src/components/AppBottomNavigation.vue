<!-- donja navigacija aplikacije -- ikone za dashboard/popis klijenata, popis vrsta treninga/vježbi, kalendar i profil trenera -->

<template>

  <!-- DONJA NAVIGACIJA -->
    <q-footer class="app-footer">
     
        <q-tabs
        no-caps
        active-color="secondary"
        inactive-color="tertiary"
        indicator-color="secondary"
        class="bottom-navigation"
      >

        <q-route-tab
          name="dashboard"
          to="/dashboard"
          icon="groups"
          aria-label="Klijenti"  
        />

        <q-route-tab
          name="vrste-treninga"
          to="/dashboard/vrste-treninga"
          icon="fitness_center"
          aria-label="Vrste treninga"
        />

        <q-route-tab
          name="calendar"
          to="/dashboard/calendar"
          icon="calendar_month"
          aria-label="Termini"
        />

        <q-route-tab
          name="profile"
          to="/dashboard/profile"
          icon="person"
          aria-label="Profil"
        />

      </q-tabs>
      
    </q-footer>

</template>

<style scoped>

.app-footer {
  background: #111827;
}

.bottom-navigation {
  min-height: 64px;
}

</style>