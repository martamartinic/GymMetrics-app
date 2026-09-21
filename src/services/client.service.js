import databaseService from './database.service'

class ClientService {

  getDatabase() {
    return databaseService.db
  }

  // =====================================================
  // DOHVAT SVIH KLIJENATA TRENERA
  // =====================================================

  async getClientsForTrainer(trainerId) {

    const db = this.getDatabase()

    if (!db) {
      throw new Error(
        'SQLite baza nije otvorena.'
      )
    }

    if (!trainerId) {
      throw new Error(
        'ID trenera nije dostupan.'
      )
    }

    const rezultat = await db.query(
      `
      SELECT
        ID_klijenta,
        Ime_klijenta,
        Prezime_klijenta,
        Spol,
        Kontakt,
        Visina_cm,
        Pocetna_tezina_kg,
        Iskustvo,
        Napomena,
        Aktivan_flag
      FROM Klijenti
      WHERE ID_trenera = ?
      ORDER BY Ime_klijenta,
               Prezime_klijenta;
      `,
      [trainerId]
    )

    return (rezultat.values || []).map(
      client => ({
        id: client.ID_klijenta,
        firstName: client.Ime_klijenta,
        lastName: client.Prezime_klijenta,
        gender: client.Spol,
        contact: client.Kontakt,
        height: client.Visina_cm,
        startingWeight:
          client.Pocetna_tezina_kg,
        experience: client.Iskustvo,
        note: client.Napomena,
        active:
          Number(client.Aktivan_flag) === 1
      })
    )
  }

  // =====================================================
  // DOHVAT JEDNOG KLIJENTA
  // =====================================================

  async getClientById(
    clientId,
    trainerId
  ) {

    const db = this.getDatabase()

    if (!db) {
      throw new Error(
        'SQLite baza nije otvorena.'
      )
    }

    if (!clientId || !trainerId) {
      return null
    }

    const rezultat = await db.query(
      `
      SELECT
        ID_klijenta,
        ID_trenera,
        Ime_klijenta,
        Prezime_klijenta,
        Spol,
        Kontakt,
        Visina_cm,
        Pocetna_tezina_kg,
        Iskustvo,
        Napomena,
        Aktivan_flag
      FROM Klijenti
      WHERE ID_klijenta = ?
        AND ID_trenera = ?;
      `,
      [
        clientId,
        trainerId
      ]
    )

    if (
      !rezultat.values ||
      rezultat.values.length === 0
    ) {
      return null
    }

    const client = rezultat.values[0]

    return {
      id: client.ID_klijenta,
      trainerId: client.ID_trenera,
      firstName: client.Ime_klijenta,
      lastName: client.Prezime_klijenta,
      gender: client.Spol,
      contact: client.Kontakt,
      height: client.Visina_cm,
      startingWeight:
        client.Pocetna_tezina_kg,
      experience: client.Iskustvo,
      note: client.Napomena,
      active:
        Number(client.Aktivan_flag) === 1
    }
  }
}

const clientService = new ClientService()

export default clientService