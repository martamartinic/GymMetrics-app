//ova datoteka služi kao centralno mjesto kroz koje će aplikacija komunicirati sa svime vezano uz zd stanje i zd stanja klijenta

//uvoz servisa koji daje pristup otvorenoj SQLite bazi
import databaseService from "./database.service";

class HealthService {
    // Dohvat aktivne instancu baze - vraća vezu prema postojećoj sqlite bazi
  getDatabase() { return databaseService.db }

    // Ujednačavanje rezultata SQLite upita u niz zapisa
  async queryRows(sql, params = []) {
    // Izvršavanje SQL upita kroz postojeću vezu
    const rezultat = await this.getDatabase().query(sql, params)

    // Podrška za adaptere koji vraćaju niz ili objekt sa svojstvom values
    if (Array.isArray(rezultat)) { return rezultat }

    // Vraćanje zapisa iz standardnog rezultata SQLite upita
    if (Array.isArray(rezultat?.values)) { return rezultat.values }

    // Prazan niz ako rezultat nema očekivani oblik
    return []
  } // queryRows

  // FUNKCIJA ZA DOHVAT KATEGORIJA ZDRAVSTVENOG STANJA IZ STRUKTURE BAZE
    async getHealthTypes() {

        // Dohvaća se veza prema bazi
        const db = this.getDatabase()

        // Provjera je li baza otvorena
        if (!db) { throw new Error('SQLite baza nije otvorena') }

        // Dohvaćanje stupaca tablice Zdravstveno_stanje
        const columns = await this.queryRows(
            `PRAGMA table_info(Zdravstveno_stanje)`
        )

        // Nazivi kategorija povezuju se s nazivima stupaca u bazi
        const categoryNames = {
            Dijagnoza: 'Dijagnoza',
            Lijek: 'Lijek',
            Ozljeda: 'Ozljeda',
            Bolovi: 'Bolovi'
        }

        // Izdvajanje kategorija koje postoje u strukturi tablice
        const healthTypes = columns
            .filter(column => Object.hasOwn(categoryNames, column.name))
            .map(column => ({
                id: column.name.toLowerCase(),
                name: categoryNames[column.name],
                field: column.name.toLowerCase()
            }))

        // Vraćanje kategorija za padajući izbornik
        return healthTypes

    } // getHealthTypes


  //FUNKCIJA ZA DOHVAT PODATAKA O ZDRAVSTVENOM STANJU KLIJENTA IZ BAZE
  async getClientHealth(clientId) {
    // Dohvaća se veza prema bazi
    const db = this.getDatabase()
    if(!db){throw new Error('SQLite baza nije otvorena')} //provjera je li baza otvorena

    // Pretvaranje ID-a klijenta u broj
    const numericClientId = Number(clientId)
    // Provjera valjanosti ID-a klijenta
    if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
        throw new Error('ID klijenta nije valjan')
    }//if zagrada

    //dohvat zd stanja klijenta 
    const rezultat = await this.queryRows(
        `SELECT zd.ID_zd_stanja, zd.ID_klijenta, zd.Dijagnoza, zd.Lijek, zd.Ozljeda, zd.Bolovi, zd.Sistolicki_tlak, zd.Dijastolicki_tlak, zd.Datum_zd_stanja
        FROM Zdravstveno_stanje zd
        INNER JOIN Klijenti k ON k.ID_klijenta = zd.ID_klijenta
        WHERE zd.ID_klijenta = ?
        ORDER BY zd.Datum_zd_stanja DESC , zd.ID_zd_stanja DESC`,  [numericClientId]
    ) //const rezultat zagrada

    //pretvorba svakog zapisa u objekt prilagođen prikazu
    const rows = rezultat.map(row => ({
        id: Number(row.ID_zd_stanja),       //ID POJEDINAČNOG ZAPISA ZD STANJA
        clientId: Number(row.ID_klijenta), // ID klijenta kojem pripada zapis
        dijagnoza: row.Dijagnoza,
        lijek: row.Lijek,
        ozljeda: row.Ozljeda,
        bolovi: row.Bolovi,
        sistolickiTlak: row.Sistolicki_tlak,
        dijastolickiTlak: row.Dijastolicki_tlak,    
        healthDate: row.Datum_zd_stanja, //datum unosa
    })) //const tests zagrada
    //vraća zapis testa
    return {rows}  //vraća objekt sa svojstvom rows koje sadrži niz zapisa

  } //async getClientHealth zagrada

  //FUNKCIJA ZA SPREMANJE ZDRAVSTVENOG STANJA KLIJENTA U BAZU
  async addClientHealth({ clientId, dijagnoza, lijek, ozljeda, bolovi, sistolickiTlak, dijastolickiTlak, healthDate }) {
   // Dohvaća se veza prema bazi
    const db = this.getDatabase()
    if(!db){throw new Error('SQLIte baza nije otvorena')} //provjera je li baza otvorena
   
    // Pretvaranje ID-a klijenta u brojeve
   const numericClientId = Number(clientId)
   // Provjera ID klijenta
    if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
        // Neispravan ID klijenta prekida spremanje
        throw new Error('ID klijenta nije valjan')
    } // if zagrada

    //PROVJERA DATUMA ZDRAVSTVENOG STANJA PRIJE UNOSA U BAZU --> KAKO BI SERVIS ODBIO NEISPRAVAN DATUM KAD GA POZOVE NEKA KOMPONENTA
    //Pretvaranje datuma unosa u tekst i uklanjanje vanjskih razmaka
    const normalizedHealthDate = String(healthDate ?? '').trim()
    //provjera obaveznog datuma i traženog formata
    if(!/^\d{4}-\d{2}-\d{2}$/.test(normalizedHealthDate)){
        throw new Error('Datum zdravstvenog stanja mora biti u formatu godina-mjesec-dan (GGGG-MM-DD)')
    } //if zagrada
    // Razdvajanje datuma na godinu, mjesec i dan
    const [year, month, day] = normalizedHealthDate.split('-').map(Number)
    // Stvaranje datuma u UTC formatu radi provjere kalendarskog datuma
    const parsedDate = new Date(Date.UTC(year, month - 1, day))
    // Provjera postoji li uneseni datum u kalendaru
    const isRealDate = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 &&  parsedDate.getUTCDate() === day
    // Prekid spremanja ako datum ne postoji
    if (!isRealDate) { throw new Error('Datum unosa ne postoji u kalendaru') } //if zagradda
    //prekid spremanja ako je datum u budućnosti
    if (parsedDate > new Date()) { throw new Error('Datum unosa ne može biti u budućnosti') }

    //PROVJERE ZA TLAK:
    // Provjera unosa para vrijednosti krvnog tlaka
    const imaSistolickiTlak = String(sistolickiTlak ?? '').trim() !== ''
    const imaDijastolickiTlak = String(dijastolickiTlak ?? '').trim() !== ''

    // Obje vrijednosti moraju biti unesene zajedno ili obje izostavljene
    if (imaSistolickiTlak !== imaDijastolickiTlak) {
        throw new Error('Za unos krvnog tlaka potrebno je unijeti i sistoličku i dijastoličku vrijednost')
    } //if zagrada

    // Provjera vrijednosti sistoličkog i dijastoličkog tlaka
    const numericSistolickiTlak = imaSistolickiTlak
        ? Number(sistolickiTlak)
        : null

    const numericDijastolickiTlak = imaDijastolickiTlak
        ? Number(dijastolickiTlak)
        : null

    // Provjera sistoličkog tlaka
    if ( numericSistolickiTlak !== null &&
        (!Number.isFinite(numericSistolickiTlak) || numericSistolickiTlak < 0)
    ) {
        throw new Error('Sistolički tlak mora biti broj veći ili jednak 0')
    }

    // Provjera dijastoličkog tlaka
    if ( numericDijastolickiTlak !== null &&
        (!Number.isFinite(numericDijastolickiTlak) || numericDijastolickiTlak < 0)
    ) {
        throw new Error('Dijastolički tlak mora biti broj veći ili jednak 0')
    }

    //OD PRIJE: PROVJERA DA JE VRIJEDNOST SISTOLIČKOG I DIJASTOLIČKOG TLAKA BROJ VEĆI ILI JEDNAK 0 PRIJE UNOSA U BAZU --> KAKO BI SERVIS ODBIO NEISPRAVAN TLAK KAD GA POZOVE NEKA KOMPONENTA
   /* const numericSistolickiTlak = Number(sistolickiTlak)     //pretvorba sistoličkog tlaka u broj
    const numericDijastolickiTlak = Number(dijastolickiTlak) //pretvorba dijastoličkog tlaka u broj
    if (isNaN(numericSistolickiTlak) || numericSistolickiTlak < 0) {
        throw new Error('Sistolički tlak mora biti broj veći ili jednak 0')
    } //if zagrada
    if (isNaN(numericDijastolickiTlak) || numericDijastolickiTlak < 0) {
        throw new Error('Dijastolički tlak mora biti broj veći ili jednak 0')
    } //if zagrada   
     */
    
    // Provjera postoji li klijent u bazi
    const clientRows = await this.queryRows(
        `SELECT ID_klijenta FROM Klijenti WHERE ID_klijenta = ?`,  [numericClientId]
    ) // clientRows zagrada
    // Nepostojeći klijent ne može imati zapis zd stanja
    if ( clientRows.length === 0) {
        // Prekid spremanja uz jasnu poruku
        throw new Error('Klijent nije pronađen')
    } // if zagrada
    
    //SPREMANJE NOVOG ZAPISA ZD STANJA KLIJENTA U BAZU
    return db.run( `
      INSERT INTO Zdravstveno_stanje 
      (ID_klijenta, Dijagnoza, Lijek, Ozljeda, Bolovi, Sistolicki_tlak, Dijastolicki_tlak, Datum_zd_stanja)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [numericClientId, dijagnoza, lijek, ozljeda, bolovi, numericSistolickiTlak, numericDijastolickiTlak, normalizedHealthDate], false
    ) //db.run zagrada    
 
  } //async addClientHealth zagrada

} //class HealthService zagrada

//instanca klase HealthService koja se koristi za pristup metodama i funkcionalnostima servisa
const healthService = new HealthService();  

export default healthService;  //izvoz instance HealthService za korištenje u drugim dijelovima aplikacije