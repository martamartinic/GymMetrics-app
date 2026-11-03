//ova datoteka služi kao centralno mjesto kroz koje će aplikacija komunicirati sa svime vezano uz testove i testove klijenta

//uvoz servisa koji daje pristup otvorenoj SQLite bazi
import databaseService from "./database.service";

class TestsService {

    //dohvat aktivne instance baze - vraća vezu prema postojećoj SQLIte bazi
    getDatabase() {return databaseService.db }

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

    //FUNKCIJA ZA DOHVAT VRSTE TESTOVA ZA PADAJUĆI IZBORNIK
    async getTestTypes() {

        //SQL upit za dohvat vrste testova iz baze
        const rezultat = await this.queryRows(
            `SELECT ID_vrsta_testa, Naziv_testa, Mjerna_jedinica_testa
            FROM Vrsta_testova 
            ORDER BY Naziv_testa COLLATE NOCASE ASC `
        ) //const rezultat zagrada
        //pretvaranje rezultata iz sql oblika u javascript oblik
        return rezultat.map((testType) => ({
            id: Number(testType.ID_vrsta_testa),
            name: testType.Naziv_testa,
            unit: testType.Mjerna_jedinica_testa
        })) //return (rezultat.values) zagrada

    } // getTestTypes zagrada

    //FUNKCIJA ZA SPREMANJE NOVE VRSTE TESTA U BAZU
    async addTestType({ name, unit }) {
        //uklanjanje razmaka iz unosa
        const naziv = String(name ?? '').trim()
        const jedinica = String(unit ?? '').trim()

        //provjera obaveznog naziva
        if(!naziv) { throw new Error('Naziv testa je obavezan') }
        //provjera obavezne mjerne jedinice
        if(!jedinica) {throw new Error('Mjerna jedinica testa je obavezna') }

        //provjera postoji li već vrsta testa sa istim nazivom
        const postojeceVrste = await this.queryRows(
            `SELECT ID_vrsta_testa
            FROM Vrsta_testova 
            WHERE Naziv_testa = ? COLLATE NOCASE `, [naziv]
        )
        //javljanje greške ako postoji već test sa istim nazivom
        if(postojeceVrste.length > 0) {throw new Error('Vrsta testa s tim nazivom već postoji') }

        //spremanje nove vrste testa
        await this.getDatabase().run(
            `INSERT INTO Vrsta_testova (Naziv_testa, Mjerna_jedinica_testa)
             VALUES (?, ?) `,
             [naziv, jedinica], false
        ) //const rezultatiVrsteTestova zagrada
        //ponovno čitanje popisa kako bi se vratio stvarni id iz baze
        const spremljenaVrsta = await this.queryRows(
             `SELECT ID_vrsta_testa, Naziv_testa, Mjerna_jedinica_testa
            FROM Vrsta_testova WHERE Naziv_testa = ? COLLATE NOCASE
            ORDER BY ID_vrsta_testa DESC LIMIT 1`, [naziv]
        ) //const spremljenaVrsta zagrada
        //provjera je li novi zapis dostupan nakon spremanja
        if(spremljenaVrsta.length === 0){
            throw new Error('Nova vrsta testa nije pronađena') 
        } //if zagrada
        //vraćanje novog zapisa u obliku koji koristi padajući izbornik
        return {
            id: Number(spremljenaVrsta[0].ID_vrsta_testa),
            name: spremljenaVrsta[0].Naziv_testa,
            unit: spremljenaVrsta[0].Mjerna_jedinica_testa
        } //return zagrada
    } //addTestType zagrada

    //FUNKCIJA ZA DOHVAT ZAPISA TESTOVA KLIJENTA
    async getClientTests(clientId) {
        //dohvat veze prema bazi
        const db = this.getDatabase()
        //provjera je li baza otvorena
        if(!db){throw new Error('SQLite baza nije otvorena') }

         // Pretvaranje ID-a klijenta u broj
        const numericClientId = Number(clientId)
        // Provjera valjanosti ID-a klijenta
        if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
            throw new Error('ID klijenta nije valjan')
        }//if zagrada

        //dohvat testova klijenta
        const rezultat = await this.queryRows(
             `SELECT ct.ID_testa_klijenta, ct.ID_klijenta, ct.ID_vrsta_testa, ct.Rezultat_testa, ct.Datum_testa, ct.Biljeska_testa,
                    t.Naziv_testa, t.Mjerna_jedinica_testa
            FROM Testovi_klijenta ct
            INNER JOIN Vrsta_testova t
            ON t.ID_vrsta_testa = ct.ID_vrsta_testa
            WHERE ct.ID_klijenta = ?
            ORDER BY date(ct.Datum_testa) DESC, ct.ID_vrsta_testa DESC;`, [numericClientId]
        ) //const rezultat zagrada

        //pretvorba svakog zapisa u objekt prilagođen prikazu
        const tests = rezultat.map(row => ({
            id: Number(row.ID_testa_klijenta), //ID pojedinačnog zapisa
            clientId: Number(row.ID_klijenta),
            testTypeId: Number(row.ID_vrsta_testa),
            testType: row.Naziv_testa,
            unit: row.Mjerna_jedinica_testa,
            value: Number(row.Rezultat_testa),
            date: row.Datum_testa,
            note: row.Biljeska_testa
        })) //const tests zagrada
        //vraća zapis testa
        return {tests}
    } //getClientTests zagrada

    //FUNKCIJA ZA DODAVANJE NOVOG TESTA KLIJENTA
    async addClientTest({clientId, testTypeId, value, date, note}) {
        //dohvat otvorene baze
        const db = this.getDatabase()
        //provjera je li baza otvorena
        if(!db){throw new Error('SQLite baza nije otvorena') }

        //pretvorba ID klijenta i vrste testa u brojeve
        const numericClientId = Number(clientId)
        const numericTestId = Number(testTypeId)

        //provjera ID klijenta
        if(!Number.isInteger(numericClientId) || numericClientId <=0) {
            throw new Error('ID klijenta nije valjan')
        } //if zagrada
        //provjera ID vrste testa
        if(!Number.isInteger(numericTestId) || numericTestId <=0) {
            throw new Error('ID vrste testa nije valjan')
        } //if zagrada

        //provjera datuma i rezultata testa prije upisa u bazu --> KAKO BI SERVIS ODBIO NEISPRAVAN DATUM/REZULTAT KAD GA POZOVE NEKA KOMPONENTA 
        //pretvorba u tekst radi provjere decimalnog separatora
        const valueText = String(value ?? '').trim()
        //prihvaćanje cijelih i decimalnih brojeva s točkom
        if(!/^\d+(?:\.\d+)?$/.test(valueText)){
            if(valueText.includes(',')) {
                throw new Error('Decimalni broj rezultata testa odvaja se točkom (.)')
            } //if zagrada
        } //if zagrada
        //pretvorba provjerenog unosa u broj
        const numericValue = Number(valueText)
        //provjera je li vrijednost broj veći od 0
        if(!Number.isFinite(numericValue) || numericValue <= 0 ){
            throw new Error('Rezultat testa mora biti broj veći od nule')
        } //if zagrada
        //pretvaranje datuma u tekst i uklanjanje vanjskih razmaka
        const testDate = String(date ?? '').trim()
        //provjera obaveznog datuma i traženog formata
        if(!/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
            throw new Error('Datum testa mora biti u formatu godina-mjesec-dan (GGGG-MM-DD)')
        } //if zagrada
        //razdvajanje datuma na godinu, mjesec i dan
        const [year, month, day] = testDate.split('-').map(Number)
        //stvaranje datuma u UTC formatu radi provjere kalendarskog datuma
        const parsedDate = new Date(Date.UTC(year, month - 1, day))
        //provjera postoji li datum u kalendaru
        const isRealDate = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day
        //prekid spremanja ako datum ne postoji u kalendaru
        if(!isRealDate) {
            throw new Error('Datum testa ne postoji u kalendaru')
        } //if zagrada

        //provjera postoji li klijent
        const clientRows = await this.queryRows(
            `SELECT ID_klijenta  FROM Klijenti WHERE ID_klijenta = ?`,  [numericClientId]
        ) //const clientRows zagrada
        //nepostojeći klijent ne može imati zapis testa
        if(!clientRows.length === 0) {
            throw new Error('Klijent nije pronađen')
        } //if zagrada

        //provjera postoji li vrsta testa
        const testTypeRows = await this.queryRows(
             `SELECT ID_vrsta_testa  FROM Vrsta_testova WHERE ID_vrsta_testa = ?`,  [numericTestId]
        ) //const testTypeRows zagrada
        if(testTypeRows.length === 0) {
            throw new Error('Vrsta testa nije pronađena')
        } //if zagrada

        //spremanje novog zapisa testa
        return db.run(
             `INSERT INTO Testovi_klijenta(ID_klijenta, ID_vrsta_testa, Rezultat_testa, Datum_testa, Biljeska_testa)
             VALUES (?, ?, ?, ?, ?)`,  
             [numericClientId, numericTestId, numericValue, testDate, note && String(note).trim() ? String(note).trim() : null],
             false
        ) //return zagrada

    } //addClientTest zagrada

    //FUNKCIJA ZA BRISANJE POJEDINAČNOG ZAPISA TESTA
    async deleteTest(testId) {
        //dohvat veze prema bazi
        const db = this.getDatabase()
        //provjera je li otvorena veza prema bazi
        if(!db){throw new Error('SQLite baza nije otvorena') }

        //brisanje je ograničeno na ID konkretnog zapisa
        return db.run(
            `DELETE FROM Testovi_klijenta WHERE ID_testa_klijenta = ?`,
                [Number(testId)], false
        ) //return db.run zagrada

    } //deleteTest zagrada

} //class zagrada

//kreiranje jedne instance servisa (ime instance je testsService)
const testsService = new TestsService()

//izvoz instance koju će koristiti vue komponente
export default testsService