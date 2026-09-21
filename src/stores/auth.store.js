//datoteka koja služi za čuvanje stanja autentifikacije kako bi se dobio odgovor je li trener prijavljen, ime trenera, id trenera, email itd. kkao bi svaka stranica znala tko je prijavljen
//služi kako bi bilo koja stranica mogla dobiti odgvor na pitanje je li trener prijavljen ili kako se trener zove bez ikakvog sql-a
//Treba pamtiti trenutno stanje prijave - pamti tko je trenutno prijavljen

import { defineStore, acceptHMRUpdate } from 'pinia'
import authService from '@/services/auth.service'

const STORAGE_KEY = 'gymmetrics_auth' //ključ za spremanje podataka u localStorage

export const useAuthStore = defineStore('auth', {

  state: () => ({
    isLoggedIn: false,
    trainerId: null,
    trainerName: '',
    trainerSurname: '',
    trainerEmail: ''
  }),

  getters: {
    fullName: (state) =>
      `${state.trainerName} ${state.trainerSurname}`.trim()
  },

  actions: {

    /**
     * Sprema podatke trenutno prijavljenog trenera u Pinia Store i LocalStorage, lozinke se ne spremaju
     */
    setTrainer(trainer) {
      this.isLoggedIn = true
      this.trainerId = trainer.id
      this.trainerName = trainer.ime
      this.trainerSurname = trainer.prezime
      this.trainerEmail = trainer.email

      this.saveSession()

    }, //setTrainer zagrada

    /**
     * Prijava trenera. AuthService provjerava email i lozinku te vraća podatke o treneru.
     */
    async login(email, lozinka) {
      const rezultat = await authService.login(
        email, lozinka
      ) //const rezultat zagrada

      if (rezultat.success) {
        this.setTrainer(rezultat.trener)
      } //if zagrada

      return rezultat
    }, //async login zagrada

    /*
       Registracija trenera.
     */
    async signup(ime, prezime, email, lozinka) {
      const rezultat = await authService.signup(
        ime,
        prezime,
        email,
        lozinka
      )

      if (rezultat.success && rezultat.trener) {
        this.setTrainer(rezultat.trener)
      }

      return rezultat
    },

    /*
       sprema trenutno prijavljenog trenera u localstorage
     */
    saveSession() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isLoggedIn: this.isLoggedIn,
          trainerId: this.trainerId,
          trainerName: this.trainerName,
          trainerSurname: this.trainerSurname,
          trainerEmail: this.trainerEmail
        })
      )
    },

    /*
       Obnavlja prijavu nakon refreshanja aplikacije.
     */
    restoreSession() {
      const savedSession =
        localStorage.getItem(STORAGE_KEY)

      if (!savedSession) {
        return false
      }

      try {
        const session = JSON.parse(savedSession)

        if (!session.trainerId) {
          this.logout()
          return false
        }

        this.isLoggedIn = true
        this.trainerId = session.trainerId
        this.trainerName = session.trainerName || ''
        this.trainerSurname = session.trainerSurname || ''
        this.trainerEmail = session.trainerEmail || ''

        return true

      } catch (error) {
        console.error(
          'Greška pri obnavljanju prijave:',
          error
        )

        this.logout()
        return false
      }
    },

    /*
       Odjava.
     */
    logout() {
      this.isLoggedIn = false
      this.trainerId = null
      this.trainerName = ''
      this.trainerSurname = ''
      this.trainerEmail = ''

      localStorage.removeItem(STORAGE_KEY)
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(
      useAuthStore,
      import.meta.hot
    )
  )
}