//uvoz databaseServica radi mogućnosti pristupa otvorenoj sqlite bazi
import databaseService from './database.service'

//kreiranje klase u kojoj se nalaze sve operacije vezane uz klijente
class ClientService {

  //Dohvat trenutno otvorene sqlite baze
  getDatabase() {
    return databaseService.db //vraća referencu na otvorenu bazu iz database.service
  }

  // FUNKCIJA ZA DOHVAT SVIH KLIJENATA TRENERA (DASHBOARD):
  async getClientsForTrainer(trainerId) {

    const db = this.getDatabase() //Dohvat otvorene baze

    //provjera je li baza otvorena
    if (!db) { 
      throw new Error('SQLite baza nije otvorena.' ) //prekid funkcije ako baza nije otvorena
    } //if zagrada

    //provjera postoji li ID trenera
    if (!trainerId) {
      throw new Error('ID trenera nije dostupan.') //prekid funkcija ako trener nije dostupan
    } //if zagrada

    //izvršavanje sql upita za klijente trenera
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
      `, [trainerId]
    ) //const rezultat zagrada

    //pretvaranje sql podataka u objekte koje koristi vue aplikacija
    return (rezultat.values || []).map(
      client => ({
        //mapiranje sql id-a na javascript ID
        id: client.ID_klijenta,
        firstName: client.Ime_klijenta, //mapiranje imena klijenta
        lastName: client.Prezime_klijenta,
        gender: client.Spol,
        contact: client.Kontakt,
        height: client.Visina_cm,
        startingWeight:
          client.Pocetna_tezina_kg,
        experience: client.Iskustvo,
        note: client.Napomena,
        //pretvaranje sqlite flag-a u javascriptov boolean
        active:
          Number(client.Aktivan_flag) === 1
      }) //client zagrada
    ) //return zagrada

  } //getClientsForTrainer zagrada

  // FUNKCIJA ZA DOHVAT JEDNOG KLIJENTA ZA (EKRAN) DETALJE KLIJENTA  
  async getClientById(clientId, trainerId ) {
    //dohvat otvorene baze
    const db = this.getDatabase()

    //provjera je li baza otvorena
    if (!db) {
      throw new Error('SQLite baza nije otvorena.') //prekid funkcije ako baza nije otvorena
    } //if zagrada

    //provjera postoje li ID klijenta i ID trenera
    if (!clientId || !trainerId) {
      //ako fali bilo koji ID klijent se ne more dohvatit
      return null
    } //if zagrada

    //dohvat samo onih klijenata koji pripadaju treneru
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
      [clientId, trainerId]
    ) //rezultat zagrada

    //provjera je li pronađen barem jedan zapis
    if (
      !rezultat.values || rezultat.values.length === 0
    ) {
      //ako klijent ne postoji ili ne pripada treneru vraća se null
      return null
    } //return zagrada

    //uzimanje prvog i jedinog očekivanog rezultata
    const client = rezultat.values[0]

    //vraćanje klijenta u javascript obliku
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
      //pretvaranje sqlite flag vrijenosti u javascript boolean
      active:
        Number(client.Aktivan_flag) === 1
    } //Return zagrada

  } //getClientById zagrada

  // UPRAVLJANJE SPREMANJE NOVOG KLIJENTA I POVEZIVANJE S NJEGOVIM CILJEM:
  //sprema novog klijenta i njegov odabrani cilj u jednoj transakciji
  async createClientWithGoal(client, goalId, trainerId) {
    //dohvat otvorene sqlite baze
    const db = this.getDatabase()

    //provjera postoji li otvorena baza
    if(!db) {
      //ako baza nije otvorena javlja grešku i prekida se spremanje
      throw new Error('Sqlite baza nije otvorena.')
    }//if zagrada

    //provjera postoji li id trenutno prijavljenog trenera
    if(!trainerId) {
      //ako nema podatka o treneru ne mogu se ispravno povezati ni klijenti
      throw new Error('ID trenera nije dostupan.')
    }//if zagrada

    //provjera postoji li ID odabran cilj
    if(!goalId) {
      //bez odabranog cilja ne može se napraviti veza u Ciljevi_Klijenta
      throw new Error('Cilj klijenta nije odabran.')
    } //if zagrada

    //pokretanje jedne sqlite transakcije za oba INSERT-a jer bez uspješnog spremanja i cilja i klijenta ne smije se spremiti uneseni podaci koji nisu problematični
    await db.beginTransaction()

    //korišten try blok kako bi se napravio rollback ako bilo koji INSERT ne prođe
    try{
      //umetanje novog klijenta u tablicu Klijenti
      const rezultatKlijenta = await db.run(
        `INSERT INTO Klijenti (
          ID_trenera, Ime_klijenta, Prezime_klijenta,
          Spol, Kontakt, Visina_cm, Pocetna_tezina_kg,
          Iskustvo, Napomena
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
       `, [trainerId, client.firstName, client.lastName,
          client.gender, client.contact, client.height,
          client.startingWeight, client.experience, client.note 
         ],
          false
      ) //rezultatKlijenta zagrada

      //dohvat ID upravo dodanog klijenta
      const clientId = rezultatKlijenta.changes.lastId
      //provjera je li sqlite stvarno vratio ID novog klijenta
      if(!clientId) {
        //ako ID nije vraćen, prekida se transakcija
        throw new Error('Nije moguće dohvatiti ID novog klijenta.')
      }//if zagrada

      //povezivanje novog klijenta s odabranim ciljem
      await db.run(
        ` INSERT INTO Ciljevi_klijenta (ID_klijenta, ID_ciljeva)
          VALUES (?, ?);
        `, [clientId, goalId], false
      ) //db run zagrada

      //ako su oba INSERT-a uspješna, potvrđuje se transakcija i podaci se spremaju u tablice u bazi
      await db.commitTransaction()
      //vraćamo ID novog klijenta komponenti
      return clientId

    }//try zagrada
    catch (error) {
      //ako je bilo koja operacija neuspješna, poništava se cijela transakcija
      await db.rollbackTransaction()
      //prosljeđivanje stvarne greške komponenti
      throw error
    }//catch zagrada

  } //zagrada createClientWithGoal 

} //ClientService zagrada

//nova instanca clientService klase
const clientService = new ClientService()

//izvoz instance koju će koristiti vue komponente kad se importa goalService
export default clientService