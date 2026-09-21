//služi za obnovu sesije prilikom pokretanja aplikacije
//provjera postoji li spremljena prijava i obnovi pinia stanje

import { useAuthStore } from '@/stores/auth.store'

export default async () => {
  const authStore = useAuthStore()

  authStore.restoreSession()
  
} //export default async zagrada