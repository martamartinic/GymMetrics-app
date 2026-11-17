// datoteka koja služi kao centralno mjesto kroz koje aplikacija komunicirati sa svime vezano uz prehranu klijenta

// Uvoz servisa koji daje pristup otvorenoj SQLite bazi
import databaseService from './database.service';

class NutritionService {
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

  //FUNKCIJA ZA DOHVAT PODATAKA O PREHRANI KLIJENTA
  async getClientNutrition(clientId) {
    // Dohvaća se veza prema bazi
    const db = this.getDatabase()
    if(!db){throw new Error('SQLite baza nije otvorena')} //provjera je li baza otvorena

    // Pretvaranje ID-a klijenta u broj
    const numericClientId = Number(clientId)
    // Provjera valjanosti ID-a klijenta
    if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
        throw new Error('ID klijenta nije valjan')
    }//if zagrada

    //dohvat prehrane klijenta
    const rezultat = await this.queryRows(
        `SELECT p.ID_prehrane, p.ID_klijenta, p.Dnevne_kalorije_kcal, p.Proteini_g, p.Ugljikohidrati_g, p.Secer_g, p.Masti_g, p.Vlakna_g
        FROM Prehrana p
        INNER JOIN Klijenti k ON k.ID_klijenta = p.ID_klijenta
        WHERE p.ID_klijenta = ?
        ORDER BY  p.ID_prehrane DESC`,  [numericClientId]
    ) //const rezultat zagrada

    //pretvorba svakog zapisa u bojekt prilagođen prikazu
    const rows = rezultat.map(row => ({
        id: Number(row.ID_prehrane),  //ID POJEDINAČNOG ZAPISA PREHRANE KLIJENTA
        clientId: Number(row.ID_klijenta), //ID KLIJENTA kojem pripada prehrana
        kalorije: row.Dnevne_kalorije_kcal,
        proteini: row.Proteini_g,
        ugljikohidrati: row.Ugljikohidrati_g,
        secer: row.Secer_g, 
        masti: row.Masti_g, 
        vlakna: row.Vlakna_g
    })) //const rows zagrada
    //vraća zapis
    return { rows } //vraća objekt sa svojstvom rows koje sadrži niz zapisa
    
  } //funkcija getClientNutrition zagrada

  //FUNKCIJA ZA SPREMANJE PODATAKA O PREHRANI KLIJENTA
  async addClientNutrition({ clientId, kalorije, proteini, ugljikohidrati, secer, masti, vlakna }) {

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

    //PROVJERA DA SU UNESENE VRIJEDNOSTI BROJ VEĆI OD NULA
    // PROVJERA OBAVEZNIH I NEOBAVEZNIH VRIJEDNOSTI
    // Kalorije su jedina obavezna vrijednost
    if (kalorije === null || kalorije === undefined || String(kalorije).trim() === '') {
        throw new Error('Dnevne kalorije u kcal su obavezne')
    } //if zagrada
    // Pretvaranje kalorija u broj
    const numericKalorije = Number(kalorije)
    // Provjera kalorija
    if (!Number.isFinite(numericKalorije) || numericKalorije < 0) {
        throw new Error('Kalorije u kcal moraju biti broj veći ili jednak 0')
    } //if zagrada

    // Pomoćna funkcija za provjeru neobaveznih vrijednosti
    function provjeriNeobaveznuVrijednost(vrijednost, nazivPolja) {
        // Ako vrijednost nije unesena, vraća se NULL
        if ( vrijednost === null || vrijednost === undefined || String(vrijednost).trim() === '' ) {
            return null
        } //if zagrada
        // Pretvaranje unesene vrijednosti u broj
        const numericValue = Number(vrijednost)
        // Provjera je li vrijednost broj veći ili jednak 0
        if (!Number.isFinite(numericValue) || numericValue < 0) {
            throw new Error(`${nazivPolja} moraju biti broj veći ili jednak 0`)
        } //if zagrada
        return numericValue
    } //function provjeriNeobaveznuVrijednost zagrada
    // Provjera preostalih pet, neobaveznih vrijednosti
    const numericProteini = provjeriNeobaveznuVrijednost(proteini, 'Proteini u g')
    const numericUgljikohidrati = provjeriNeobaveznuVrijednost(ugljikohidrati,'Ugljikohidrati u g')
    const numericSecer = provjeriNeobaveznuVrijednost(secer, 'Šećer u g')
    const numericMasti = provjeriNeobaveznuVrijednost(masti, 'Masti u g')
    const numericVlakna = provjeriNeobaveznuVrijednost(vlakna, 'Vlakna u g')

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
      INSERT INTO Prehrana
      (ID_klijenta, Dnevne_kalorije_kcal, Proteini_g, Ugljikohidrati_g, Secer_g, Masti_g, Vlakna_g)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [numericClientId, numericKalorije, numericProteini, numericUgljikohidrati, numericSecer, numericMasti, numericVlakna], false
    ) //db.run zagrada    

  } //funkcija addClientNutrition zagrada

  // FUNKCIJA ZA UREĐIVANJE I SPREMANJE POJEDINAČNE VRIJEDNOSTI PREHRANE

  async updateClientNutrition({ clientId, nutritionId, field, value }) {

    // Dohvaćanje veze prema bazi
    const db = this.getDatabase()

    if (!db) { throw new Error('SQLite baza nije otvorena') }

    // Pretvaranje ID-jeva u brojeve
    const numericClientId = Number(clientId)
    const numericNutritionId = Number(nutritionId)

    // Provjera ID-a klijenta
    if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
        throw new Error('ID klijenta nije valjan')
    } //if zagrada

    // Provjera ID-a zapisa prehrane
    if (!Number.isInteger(numericNutritionId) || numericNutritionId <= 0) {
        throw new Error('ID zapisa prehrane nije valjan')
    } //if zagrada

    // Dopušteni stupci tablice Prehrana // Naziv stupca se određuje sa ovim AllowedFields - tako se ne umeće proizvoljan naziv stupca u donji SQL upit, nego se dopuštaju samo točno definirana polja iz tablice Prehrana
    const allowedFields = {
        kalorije: 'Dnevne_kalorije_kcal',
        proteini: 'Proteini_g',
        ugljikohidrati: 'Ugljikohidrati_g',
        secer: 'Secer_g',
        masti: 'Masti_g',
        vlakna: 'Vlakna_g'
    } //allowedFields zagrada

    // Provjera dopuštenog polja
    const databaseField = allowedFields[field]

    if (!databaseField) {
        throw new Error('Odabrana nutritivna vrijednost nije valjana')
    } //if zagrada

    // Provjera unesene vrijednosti
    const numericValue = Number(value)

    if (
        value === null || value === undefined ||
        String(value).trim() === '' || !Number.isFinite(numericValue) 
        || numericValue < 0
    ) {
        throw new Error('Vrijednost mora biti broj veći ili jednak 0')
    } //if zagrada

    // Provjera pripada li zapis prehrane odabranom klijentu
    const existingRows = await this.queryRows(
        ` SELECT ID_prehrane FROM Prehrana
            WHERE ID_prehrane = ? AND ID_klijenta = ?
            `, [numericNutritionId, numericClientId]
    ) //existingRows zagrada

    if (existingRows.length === 0) {
        throw new Error('Zapis prehrane nije pronađen za odabranog klijenta')
    } //if zagrada

    // Ažuriranje samo odabrane nutritivne vrijednosti
    return db.run(
        ` UPDATE Prehrana
        SET ${databaseField} = ?
        WHERE ID_prehrane = ? AND ID_klijenta = ?
        `, [numericValue, numericNutritionId, numericClientId],
        false
    ) //return zagrada

  } // updateClientNutrition

} //class NutritionService zagrada

//izvoz instance servicsa koju će koristiti Vue stranice
const nutritionService = new NutritionService()

export default nutritionService