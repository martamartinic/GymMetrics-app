//servis služi kao centralno mjesto preko kojeg će aplikacija komunicirati sa svime vezano uz treninge

// Uvoz servisa koji daje pristup otvorenoj SQLite bazi
import databaseService from './database.service'
//uvoz servisa za klijente kako bi se status klijenta ((ne)aktivan) ažurirao nakon spremanja i brisanja treninga
import clientService from './client.service'
import { Notify } from 'quasar'

// Servis zadužen za podatke vezane uz treninge klijenta
class TrainingService {

  // Vraća trenutno otvorenu SQLite bazu
  getDatabase() {
    return databaseService.db
  }//getDatabase zagrada

  // Dohvaća prosječnu ocjenu odabrane vrste treninga za klijenta.
  async getAverageRating(clientId, trainingTypeId) {
    // Dohvaćamo bazu.
    const db = this.getDatabase()

    // Provjera je li baza otvorena
    if (!db) {
      throw new Error('SQLite baza nije otvorena')
    } //if zagrada

    // Dohvaćat prosjeka ocjena iz tablice Trening_klijenta
    const rezultat = await db.query(`
      SELECT AVG(Ocjena_treninga) AS Prosjecna_ocjena
      FROM Trening_klijenta
      WHERE
        ID_klijenta = ?
        AND ID_vrsta_treninga = ?
        AND Ocjena_treninga IS NOT NULL;
    `, [clientId, trainingTypeId])

    // Uzima se prvi rezultat upita
    const redak = (rezultat.values || [])[0]

    // Ako nema niti jednog treninga, prosjek je 0.
    if (!redak || redak.Prosjecna_ocjena === null) {
      return 0
    }//if zagrada

    // SQLite rezultat pretvara u JavaScript broj
    return Number(redak.Prosjecna_ocjena)
  } //getAverageRating zagrada

  //FUNKCIJA ZA DOHVAT OCJENA TRENINGA KROZ VRIJEME (ZA POTREBE GRAFIKONA)
  async getRatingHistory(clientId, trainingTypeId) {
     // Dohvat trenutno otvorene SQLite baze
    const db = this.getDatabase()
    // Provjera je li baza otvorena
    if (!db) {
      throw new Error('SQLite baza nije otvorena')
    } //if zagrada

    // Dohvat datuma i ocjena za odabranog klijenta i vrstu treninga //ASC - od najstarijeg do najnovijeg - prirodno da linija grafikona ide kroz vrijeme
    const rezultat = await db.query(
      `SELECT Datum_treninga, Ocjena_treninga
      FROM Trening_klijenta
      WHERE ID_klijenta = ? AND ID_vrsta_treninga = ? AND Ocjena_treninga IS NOT NULL
      ORDER BY Datum_treninga ASC, ID_treninga_klijenta ASC;                            
      `, [clientId, trainingTypeId]
    ) //rezultat zagrada

    // Pretvaranje SQL rezultata u objekte koje koristi Vue grafikon
    return (rezultat.values || []).map(training => ({
      date: training.Datum_treninga,
      rating: Number(training.Ocjena_treninga)
    })) //return zagrada

  } //getRatingHistory zagrada

  // Dohvat svih treninga klijenta, od najnovijeg prema najstarijem
  async getClientTrainings(clientId) {
    // Dohvat bazu
    const db = this.getDatabase()

    // Provjera je li baza otvorena
    if (!db) {
      throw new Error('SQLite baza nije otvorena.')
    }//if zagrada

    // Dohvat treninge i njihoveih vježbi
    const rezultat = await db.query(`
      SELECT
        t.ID_treninga_klijenta,
        t.Datum_treninga,
        t.Ocjena_treninga,
        t.Biljeska_treninga,

        vt.ID_vrsta_treninga,
        vt.Vrsta_treninga,

        v.ID_vjezbe,
        v.Naziv_vjezbe

      FROM Trening_klijenta t

      INNER JOIN Vrsta_treninga vt
        ON vt.ID_vrsta_treninga = t.ID_vrsta_treninga

      LEFT JOIN Vjezbe_treninga_klijenta vtc
        ON vtc.ID_treninga_klijenta = t.ID_treninga_klijenta

      LEFT JOIN Vjezbe v
        ON v.ID_vjezbe = vtc.ID_vjezbe

      WHERE
        t.ID_klijenta = ?

      ORDER BY
        t.Datum_treninga DESC,
        t.ID_treninga_klijenta DESC;
    `, [clientId])

    // Objekt u kojem će se grupirati vježbe prema treningu
    const groupedTrainings = new Map()

    // Prolaz kroz sve retke SQL rezultata
    for (const row of rezultat.values || []) {

      // Provjeravamo postoji li trening već u mapi
      if (!groupedTrainings.has(row.ID_treninga_klijenta)) {

        // Ako ne postoji, stvaramo novi JavaScript objekt treninga
        groupedTrainings.set(row.ID_treninga_klijenta, {
          id: row.ID_treninga_klijenta,
          date: row.Datum_treninga,
          rating: Number(row.Ocjena_treninga || 0),
          note: row.Biljeska_treninga || '',
          trainingTypeId: row.ID_vrsta_treninga,
          trainingType: row.Vrsta_treninga,
          exercises: []
        }) //groupedTrainings zagrada
      } //if zagrada

      // Dohvaćamo već stvoreni trening
      const training = groupedTrainings.get(row.ID_treninga_klijenta)

      // Ako trening ima vježbu, dodajemo je u njegov popis
      if (row.ID_vjezbe) {
        training.exercises.push({
          id: row.ID_vjezbe,
          name: row.Naziv_vjezbe
        }) //training.exercises zagrada
      } //if zagrada
    } //for zagrada

    // Map pretvaramo u običan array
    return Array.from(groupedTrainings.values())

  } //getClientTrainings zagrada

  //METODA ZA BRISANJE POJEDINOG ZAPISA TRENINGA
  async deleteTraining(trainingId) {
    //dohvat otvorene baze
    const db = this.getDatabase()

    //provjera postoji li otvorena baza 
    if (!db) {
      throw new Error('SQLite baza nije otvorena')
    } //if zagrada

    //pretvorba ID treninga u broj
    const numericTrainingId = Number(trainingId)

    //provjera je li ID valjan
    if (!Number.isInteger(numericTrainingId) || numericTrainingId <= 0) {
      throw new Error('ID treninga nije valjan')
    } //if zagrada

    //prije brisanja dohvat klijenta kojemu trening pripada kako bi se mogao ažurirati status jer se zna kojem klijentu pripada trening
    const rezultatKlijenta = await db.query(`
      SELECT ID_klijenta
      FROM Trening_klijenta
      WHERE ID_treninga_klijenta = ?;
    `, [numericTrainingId]
    ) //rezultatiKlijenta zagrada
    const trening = (rezultatKlijenta.values || [])[0] //pronađen trening
    if(!trening){ return 0} //ako ne postoji trening nema se što brisati

    //brisanje treninga po njegovom ID-u //u bazi zbog delete cascade vježbe treninga se automatski brišu
    const rezultat = await db.run(
        ` DELETE FROM Trening_klijenta WHERE ID_treninga_klijenta = ? `,
        [numericTrainingId],
        false
    )//const rezultat zagrada

    //vraća broj izbrisanih redaka
   // return rezultat?.changes?.changes || 0

   const deletedRows = rezultat?.changes?.changes || 0 // Broj obrisanih redaka

    if (deletedRows > 0) {
      // Nakon brisanja ponovno izračunavamo status klijenta.
      await clientService.updateClientActivityStatus(null, trening.ID_klijenta)
    } // if zagrada

    return deletedRows

  } // async deleteTraining zagrada

  // METODA ZA SPREMANJE NOVOG TRENINGA KLIJENTA U BAZU
// ZAJEDNO SA ODABRANIM VJEŽBAMA.
async createTraining({clientId, trainingTypeId, date,  rating,  note,  exerciseIds }) {

  // Dohvaćat trenutno otvorene SQLite baze
  const db = this.getDatabase()

  // Provjerava postoji li otvorena baza
  if (!db) {
    throw new Error('SQLite baza nije otvorena')
  } //if zagrada

  // Pretvara ID klijenta u broj
  const numericClientId = Number(clientId)
  // Pretvara ID vrste treninga u broj
  const numericTrainingTypeId = Number(trainingTypeId)
  // Pretvara ocjenu u broj
  const numericRating = Number(rating)

  // Provjera ID-a klijenta
  if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
    throw new Error('ID klijenta nije valjan')
  } //if zagrada
  // Provjera ID-a vrste treninga
  if (
    !Number.isInteger(numericTrainingTypeId) ||
    numericTrainingTypeId <= 0
  ) {
    throw new Error('ID vrste treninga nije valjan')
  } //if zagrada
  // Provjera datuma
  if (!date || !String(date).trim()) {
    throw new Error('Datum treninga je obavezan')
  } //if zagrada
  // Provjera ocjene
  if (
    !Number.isFinite(numericRating) ||
    numericRating < 1 || numericRating > 5  )
    {
      throw new Error('Ocjena mora biti između 1.0 i 5.0')
    } //if zagrada

  // Ako nema vježbi, koristi se prazan niz
  const exercisesToSave = Array.isArray(exerciseIds) ? exerciseIds : []

    // Pokreće se jedna transakcija --> ili svi INSERT-i uspješni ili se sve poništava
    await db.beginTransaction()

    //try sadrži sve operacije koje moraju uspjeti unutar iste transakcije
    try{
    // Sprema osnovne podatke treninga
    const rezultatTreninga = await db.run(
      ` INSERT INTO Trening_klijenta
        (ID_klijenta, ID_vrsta_treninga,  Datum_treninga, Ocjena_treninga, Biljeska_treninga )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        numericClientId,
        numericTrainingTypeId,
        String(date).trim(),
        numericRating,
        note && String(note).trim()
          ? String(note).trim()
          : null
      ], false
    ) //const rezultatTreninga zagrada

    console.log('Rezultat INSERT-a treninga:', rezultatTreninga )

    // Dohvaćat ID upravo spremljenog treninga
    const trainingId = rezultatTreninga?.changes?.lastId

    // Ako SQLite nije vratio ID, prekida se transakcija
    if (!trainingId) {
      throw new Error('SQLite nije vratio ID novog treninga' )
    } //if zagrada

    // Prolaz kroz sve označene vježbe //svaki označeni checkbox daje jedan ID vježbe
    for (const exerciseId of exercisesToSave) {
      // Pretvara ID vježbe u broj
      const numericExerciseId = Number(exerciseId)

      // Preskače nevaljane ID-eve
      if (!Number.isInteger(numericExerciseId) || numericExerciseId <= 0 ) {
        throw new Error( `ID vježbe nije valjan: ${exerciseId}` )
      } //if zagrada

      // Sprema vezu treninga i vježbe //ID treninga i ID vježbe spremaju se u agregiranu tablicu
      await db.run(
        ` INSERT INTO Vjezbe_treninga_klijenta
          ( ID_treninga_klijenta, ID_vjezbe )
          VALUES (?, ?)
        `,
        [ trainingId, numericExerciseId], 
        false
      ) //await zagrada
    } // for zagrada

    // Ako su svi INSERT-i uspjeli, potvrđuje se transakcija
    await db.commitTransaction()

    try{
      //nakon spremanja treninga ponovno se izračunava status klijenta ((ne)aktivan)
      await clientService.updateClientActivityStatus(null, numericClientId)
    } //try zagrada
    catch(error){
      console.log('Greška pri ažuriranju statusa klijenta nakon spremanja treninga: ', error)
      Notify.create({
        message: 'Greška pri ažuriranju statusa klijenta nakon spremanja treninga',
        type: 'negative',
        position: 'top'
      }) //notify zagrada
      throw error
    } //catch zagrada

    // Vraća ID novog treninga
    return trainingId

  } catch (error) {
    console.error('Stvarna greška u createTraining():', error )

    // Pokušavaj poništenja transakcije
    try {
      await db.rollbackTransaction()
    } catch (rollbackError) {
      console.error( 'Greška pri rollbacku:', rollbackError )
    } //catch zagrada

    // Šalje originalnu grešku natrag u AddTrainingPage.
    throw error
  } //catch zagrada
}//CRETETRAINING ZAGRADA 

} //TrainingService zagrada

// Stvaranje jedne instance servisa
const trainingService = new TrainingService()

// Izvoz servisa koji će koristiti Vue stranica
export default trainingService