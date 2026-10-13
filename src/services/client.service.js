//uvoz databaseServica radi mogućnosti pristupa otvorenoj sqlite bazi
import databaseService from './database.service'

//kreiranje klase u kojoj se nalaze sve operacije vezane uz klijente
class ClientService {

  //Dohvat trenutno otvorene sqlite baze
  getDatabase() {
    return databaseService.db //vraća referencu na otvorenu bazu iz database.service
  }

  //FUNKCIJA ZA AŽURIRANJE STATUS KLIJENTA ((NE)AKTIVAN) PREMA TRENINGU U ZADNJIH 30 DANA
  async updateClientActivityStatus(trainerId = null, clientId = null) {
     const db = this.getDatabase() // Dohvat otvorene baze

    if (!db) {
      throw new Error('SQLite baza nije otvorena.')
    } // if zagrada

    // Status je aktivan ako postoji trening danas ili u prethodnih 29 kalendarskih dana.
    let sql = ` UPDATE Klijenti  SET Aktivan_flag = CASE
        WHEN EXISTS (
          SELECT 1
          FROM Trening_klijenta t
          WHERE t.ID_klijenta = Klijenti.ID_klijenta
            AND date(t.Datum_treninga) >= date('now', 'localtime', '-29 days')
            AND date(t.Datum_treninga) <= date('now', 'localtime')
        ) THEN 1
        ELSE 0
      END
    `

    const params = [] // Parametri za neobavezne filtre

    // Ako je proslijeđen ID klijenta, ažurira se samo taj klijent
    if (clientId !== null && clientId !== undefined) {
      sql += ' WHERE ID_klijenta = ?'
      params.push(clientId)
    } // if zagrada
    // Inače se, ako je zadan trener, ažuriraju samo njegovi klijenti
    else if (trainerId !== null && trainerId !== undefined) {
      sql += ' WHERE ID_trenera = ?'
      params.push(trainerId)
    } // else if zagrada

    await db.run(sql, params) // Spremanje izračunatih statusa u bazu
  } //updateClientActivityStatus zagrada

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

    //prije dohvata popisa klijenta usklađuju se statusi ((ne)aktivan) s datumima treninga
    await this.updateClientActivityStatus(trainerId)

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
      ORDER BY Ime_klijenta, Prezime_klijenta;
      `, [trainerId]
    ) //const rezultat zagrada

    //pretvaranje sql podataka u objekte koje koristi vue aplikacija
    return (rezultat.values || []).map( client => ({
        //mapiranje sql id-a na javascript ID
        id: client.ID_klijenta,
        firstName: client.Ime_klijenta, //mapiranje imena klijenta
        lastName: client.Prezime_klijenta,
        gender: client.Spol,
        contact: client.Kontakt,
        height: client.Visina_cm,
        startingWeight: client.Pocetna_tezina_kg,
        experience: client.Iskustvo,
        note: client.Napomena,
        //pretvaranje sqlite flag-a u javascriptov boolean
        active: Number(client.Aktivan_flag) === 1 // SQLite 1/0 pretvara se u boolean
      })) //return zagrada

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

    //ažuriranje statusa ((ne)aktivan) odabranog klijenta prije čitanja podataka
    await this.updateClientActivityStatus(null, clientId)

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
      WHERE ID_klijenta = ? AND ID_trenera = ?;
      `, [clientId, trainerId]
    ) //rezultat zagrada

    //provjera je li pronađen barem jedan zapis
    if ( !rezultat.values || rezultat.values.length === 0 ) {
      //ako klijent ne postoji ili ne pripada treneru vraća se null
      return null
    } //if  zagrada

    //uzimanje prvog pronađenog klijenta
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
      startingWeight: client.Pocetna_tezina_kg,
      experience: client.Iskustvo,
      note: client.Napomena,
      //pretvaranje sqlite flag vrijenosti u javascript boolean
      active: Number(client.Aktivan_flag) === 1
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

  } //zagrada async createClientWithGoal funkcija

  //METODA ZA DOHVAT CILJA KLIJENTA (EKRAN DETALJI KLIJENTA)
  //dohvat cilja koji je dodijeljen odabranom klijentu
  async getClientGoal(clientId, trainerId) {
    //dohvat trenutno otvorene sqlite baze
    const db = this.getDatabase()
    //provjera je li baza otvorena
    if(!db) {
      //prikaz greške ako baza nije otvorena
      throw new Error('SQLite baza nije otvorena')
    } //if zagrada

    //dohvat cilja odabranog klijenta //klijenta još povezujemo s trenerom kako se ne bi mogao dohvatiti cilj tuđeg klijenta
    const rezultat = await db.query( 
      ` SELECT Grupa_ciljeva.ID_ciljeva, Grupa_ciljeva.Naziv_cilja, Grupa_ciljeva.Opis_cilja
      FROM Grupa_ciljeva INNER JOIN Ciljevi_klijenta
      ON Ciljevi_klijenta.ID_ciljeva = Grupa_ciljeva.ID_ciljeva
      INNER JOIN Klijenti ON Klijenti.ID_klijenta = Ciljevi_klijenta.ID_klijenta
      WHERE
      Klijenti.ID_klijenta = ? AND Klijenti.ID_trenera = ?
      ORDER BY Grupa_ciljeva.ID_ciljeva ASC LIMIT 1; `,
      [clientId, trainerId]
    ) //const rezultat zagrada

    //dohvat prvog pronađenog cilja
    const goal = (rezultat.values || [])[0]
    //ako cilj ne postoji, vraća se null
    if(!goal) {
      return null
    } //if zagrada

    //pretvorba sql podataka u javascript objekt
    return {
      id: goal.ID_ciljeva,
      name: goal.Naziv_cilja,
      description: goal.Opis_cilja
    } //return zagrada
    
  } //async getClientGoal zagrada

  //METODA ZA BRISANJE KLIJENTA (EKRAN DETALJI KLIJENTA)
  //Brisanje preko ID klijenta
  async deleteClient(clientId, trainerId) {
    //dohvat trenutno otvorene baze
    const db = this.getDatabase()
    //provjera je li baza otvorena
    if(!db) {
      //javlja grešku ako baza nije otvorena
      throw new Error('SQLite baza nije otvorena')
    } //if zagrada

    //brisanje klijenta samo ako pripada treneru
    const rezultat = await db.run(
      ` DELETE FROM Klijenti
        WHERE ID_klijenta = ? AND ID_trenera = ?; `,
        [clientId, trainerId]
    ) //const rezultat zagrada

    //vraćamo broj promijenjenih redaka
    return rezultat.changes?.changes || 0

  } //async deleteClient

  //FUNKCIJA ZA UREĐIVANJE PODATAKA O KLIJENTU (PR. EKRAN EDITCLIENTPAGE.VUE)
async updateClient({clientId,trainerId,firstName,lastName,gender,contact,height,startingWeight,experience,note}) {
  // Dohvaćaz otvorene SQLite baze
  const db = this.getDatabase()
  // UPDATE mijenja postojeći zapis klijenta osim ID-a klijenta provjera i ID trenera -- na taj način trener može mijenjati samo svog klijenta
  const rezultat = await db.run(
    `UPDATE Klijenti SET Ime_klijenta = ?, Prezime_klijenta = ?, Spol = ?, Kontakt = ?,
      Visina_cm = ?, Pocetna_tezina_kg = ?, Iskustvo = ?, Napomena = ?
    WHERE ID_klijenta = ? AND ID_trenera = ?;
    `,[firstName,lastName,gender,contact,height,startingWeight,experience,note,clientId,trainerId ]
  ) //const rezultat zagrada

  // Provjerava je li UPDATE stvarno promijenio jedan zapis
  if (!rezultat.changes || rezultat.changes.changes === 0) {
    // Ako nije promijenjen nijedan zapis, vraća grešku
    throw new Error('Klijent nije pronađen ili nije moguće ažurirati njegove podatke.')
  } //if zagrada

  // Vraćam broj promijenjenih zapisa
  return rezultat.changes.changes  

} //updateClient zagrada

//FUNKCIJA ZA AŽURIRANJE CILJA KLIJENTA
async updateClientGoal(clientId, trainerId, goalId) {
  // Dohvat trenutno otvorene SQLite baze
  const db = this.getDatabase()
  // Provjerava postoji li otvorena baza
  if (!db) {
    throw new Error('SQLite baza nije otvorena.')
  } //if zagrada

  // Provjera postoje li svi potrebni podaci
  if (!clientId || !trainerId || !goalId) {
    throw new Error('Podaci za ažuriranje cilja nisu potpuni')
  } //if zagrada

  // Prvo provjerapostoji li već povezan cilj za klijenta, dodatna provjera klijenta preko ID trenera kako trener ne bi mogao mijenjati cilj tuđeg klijenta.
  const postojećiCilj = await db.query(
    `SELECT Ciljevi_klijenta.ID_klijenta
    FROM Ciljevi_klijenta
    INNER JOIN Klijenti
      ON Klijenti.ID_klijenta = Ciljevi_klijenta.ID_klijenta
    WHERE
      Ciljevi_klijenta.ID_klijenta = ? AND Klijenti.ID_trenera = ?;
    `, [clientId, trainerId]
  ) //postojećiCilj zagrada

  // Provjerava postoji li već redak u tablici Ciljevi_klijenta
  if ((postojećiCilj.values || []).length > 0) {
    // Ako postoji, samo se mijenja ID cilja
    const rezultat = await db.run(
      ` UPDATE Ciljevi_klijenta SET ID_ciljeva = ? WHERE ID_klijenta = ?; `, [goalId, clientId]
    ) //rezultat zagrada

    // Vraća broj promijenjenih redaka
    return rezultat.changes?.changes || 0
  } //if zagrada
  else {
    // Ako klijent još nema cilj, kreira se nova veza između klijenta i cilja
    const rezultat = await db.run(
      `INSERT INTO Ciljevi_klijenta (ID_klijenta, ID_ciljeva) VALUES (?, ?); `, [clientId, goalId]
    ) //rezultat zagrada

    // Vraća broj promijenjenih/dodanih redaka
    return rezultat.changes?.changes || 0
  }//else zagrada

} //updateClientGoal zagrada

} //class ClientService zagrada

//nova instanca clientService klase
const clientService = new ClientService()

//izvoz instance koju će koristiti vue komponente kad se importa goalService
export default clientService