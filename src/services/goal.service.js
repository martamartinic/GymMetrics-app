// Uvoz databaseService radi mogućnosti pristupa otvorenoj SQLite bazi
import databaseService from './database.service'

//kreirana klasa koja će sadržavati sve operacije povezane s ciljevima
class GoalService {

    //vraća trenutno otvorenu sqlite bazu iz database service objekta
  getDatabase() { //metoda za dohvat baze
    return databaseService.db  //vraća aktivnu vezu prema bazi
  }

  //dohvat svih ciljeva iz tablice Grupa_ciljeva
  async getGoals() {
    const db = this.getDatabase() //dohvaća otvorenu bazu

    if (!db) { //ako baza nije otvorena, baca grešku i prekida radnju funkcije
      throw new Error('SQLite baza nije otvorena.')
    }

    //ako je otvorena dohvaćaju se svi ciljevi iz tablice Grupa_ciljeva preko select upita
    const rezultat = await db.query(`
      SELECT
        ID_ciljeva,
        Naziv_cilja,
        Opis_cilja
      FROM Grupa_ciljeva
      ORDER BY Naziv_cilja ASC;
    `)

    //pretvorba dobivenih rezultata iz baze (sql nazive) u javascropt nazive --u oblik koji će koristit vue komponenta //kako cijela Vue aplikacija ne bi stalno morala znati da se u SQLite bazi stupac zove Naziv_cilja.
    return (rezultat.values || []).map(goal => ({
        //mapiranje sql id-ja na javascript id, dalje mapiranje naziva cilja i mapiranje opisa cilja
      id: goal.ID_ciljeva,          //id se sprema po jednostavnijim Javascript nazivom id
      name: goal.Naziv_cilja,       //naziv cilja iz baze se sprema po jednostavnijim Javascript nazivom name
      description: goal.Opis_cilja  //opis cilja iz baze se sprema po jednostavnijim Javascript nazivom description
    }) )
  } //getGoals zagrada

  //dodavanje novog cilja u tablicu Grupa_ciljeva
  async createGoal(name, description) {
    const db = this.getDatabase() //dohvaća otvorenu bazu

    if (!db) { //ako baza nije otvorena, baca grešku i prekida radnju funkcije
        throw new Error('SQLite baza nije otvorena.')
    } //if zagrada

    //uklanjanje nepotrebnih razmaka s početka i kraja stringa naziva i opisa cilja
    const nazivCilja = name.trim()
    const opisCilja = description?.trim() || '' //napisano tako kako bi servis poštivao to što je opis opcionalan //ako opis nije napisan koristi se prazan string

    //provjera da li je korisnik unio naziv cilja 
    if (!nazivCilja) {
        throw new Error('Naziv cilja je obavezan.') //ako naziv ne postoji javlja grešku
    } //if zagrada

    //provjera postoji li već cilj s istim nazivom u bazi
    const postojeciCilj = await db.query(
        //dohvat ID cilja ako postoji isti naziv cilja u bazi
        `SELECT ID_ciljeva FROM Grupa_ciljeva WHERE Naziv_cilja = ?;`, [nazivCilja] 
    ) //postojeciCilj zagrada

    //provjera je li pronađen postojeći cilj s istim nazivom
    if ((postojeciCilj.values || []).length > 0) {
        //prekida se spremanje jer je Naziv_cilja UNIQUE
        throw new Error ('Cilj s tim nazivom već postoji.') 
    }//if zagrada

    //ako je sve u redu dodajemo novi zapis u bazu
    const rezultat = await db.run (
        `INSERT INTO Grupa_ciljeva (
        Naziv_cilja,
        Opis_cilja
      )
      VALUES (?, ?);`, [nazivCilja, opisCilja] /* string koji je unio korisnik u polje za unos */
    ) //rezultat zagrada

    // Vraća se ID novog cilja koji je SQLite generirao jer je autoincrement definiran kod create table naredbi u database.service.js
    //novi id nam treba jer je redoslijed spremanja klijent (kako bi dobili klijent ID) i onda spremanje cilja (id cilja) jer postoji agregirana tablica ciljevi klijenta koja s prema ta dva podatka (id klijenta i id cilja)
    return rezultat.changes.lastId
    
  } //createGoal zagrada

} //class goalservice zagrada

//nova instanca GoalService klase
const goalService = new GoalService()

//izvoz instance koju će koristiti vue komponente kad se importa goalService (pr. clientPage.vue)
export default goalService