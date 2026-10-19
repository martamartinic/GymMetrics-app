//servis služi kao centralno mjesto preko kojeg će aplikacija komunicirati sa svime vezano uz mjerenja i mjerenja klijenta // Servis je zadužen za pristup podacima mjerenja u SQLite bazi -- komponente pozivaju metode u ovom servisu umjessto pisanja SQL upita

// Uvoz servisa koji daje pristup otvorenoj SQLite bazi
import databaseService from './database.service'

class MeasurementService {
  // Dohvat aktivne instancu baze - vraća vezu prema postojećoj sqlite bazi
  getDatabase() { return databaseService.db }

    // Ujednačavanje rezultata SQLite upita u niz zapisa
  async queryRows(sql, params = []) {
    // Izvršavanje SQL upita kroz postojeću vezu
    const rezultat = await this.getDatabase().query(sql, params)

    // Podrška za adaptere koji vraćaju niz ili objekt sa svojstvom values
    if (Array.isArray(rezultat)) {
      return rezultat
    }

    // Vraćanje zapisa iz standardnog rezultata SQLite upita
    if (Array.isArray(rezultat?.values)) {
      return rezultat.values
    }

    // Prazan niz ako rezultat nema očekivani oblik
    return []
  } // queryRows

   // Vraćanje svih vrsta mjerenja za padajući izbornik
  async getMeasurementTypes() {
    // Čitanje vrsta mjerenja iz baze
    const rezultat = await this.queryRows(`
      SELECT
        ID_vrsta_mjerenja,
        Naziv_mjerenja,
        Mjerna_jedinica
      FROM Vrsta_mjerenja
      ORDER BY Naziv_mjerenja COLLATE NOCASE ASC
    `)

    // Prilagodba zapisa svojstvima koja koristi Vue komponenta
    return rezultat.map((red) => ({
      id: Number(red.ID_vrsta_mjerenja),
      name: red.Naziv_mjerenja,
      unit: red.Mjerna_jedinica
    }))
  } // getMeasurementTypes

    // Spremanje nove vrste mjerenja u bazu
  async addMeasurementType({ name, unit }) {
    // Uklanjanje suvišnih razmaka iz unosa
    const naziv = String(name ?? '').trim()
    const jedinica = String(unit ?? '').trim()

    // Provjera obveznog naziva
    if (!naziv) {
      throw new Error('Naziv mjerenja je obavezan')
    }

    // Provjera obvezne mjerne jedinice
    if (!jedinica) {
      throw new Error('Mjerna jedinica je obavezna')
    }

    // Provjera postoji li već vrsta s istim nazivom
    const postojeceVrste = await this.queryRows(
      `SELECT ID_vrsta_mjerenja
       FROM Vrsta_mjerenja
       WHERE Naziv_mjerenja = ? COLLATE NOCASE`,
      [naziv]
    )

    // Sprječavanje stvaranja duplikata
    if (postojeceVrste.length > 0) {
      throw new Error('Vrsta mjerenja s tim nazivom već postoji')
    }

    // Spremanje nove vrste mjerenja
    await this.getDatabase().run(
      `INSERT INTO Vrsta_mjerenja
        (Naziv_mjerenja, Mjerna_jedinica)
       VALUES (?, ?)`,
      [naziv, jedinica],
      false
    )

    // Ponovno čitanje popisa kako bi se vratio stvarni ID iz baze
    const spremljenaVrsta = await this.queryRows(
      `SELECT
         ID_vrsta_mjerenja,
         Naziv_mjerenja,
         Mjerna_jedinica
       FROM Vrsta_mjerenja
       WHERE Naziv_mjerenja = ? COLLATE NOCASE
       ORDER BY ID_vrsta_mjerenja DESC
       LIMIT 1`,
      [naziv]
    )

    // Provjera je li novi zapis dostupan nakon spremanja
    if (spremljenaVrsta.length === 0) {
      throw new Error('Nova vrsta mjerenja nije pronađena nakon spremanja')
    }

    // Vraćanje novog zapisa u obliku koji koristi izbornik
    return {
      id: Number(spremljenaVrsta[0].ID_vrsta_mjerenja),
      name: spremljenaVrsta[0].Naziv_mjerenja,
      unit: spremljenaVrsta[0].Mjerna_jedinica
    }
  } // addMeasurementType

    // Čita mjerenja klijenta i početnu težinu iz tablice Klijenti
    async getClientMeasurements(clientId) {
        // Dohvaća se veza prema bazi
        const db = this.getDatabase()
        if(!db){throw new Error('SQLite baza nije otvorena')} //provjera je li baza otvorena

        // Pretvaranje ID-a klijenta u broj
        const numericClientId = Number(clientId)
        // Provjera valjanosti ID-a klijenta
        if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
            throw new Error('ID klijenta nije valjan')
        }//if zagrada

        // čita podatke o klijentu i njegovu početnu težinu
        const clientRows = await this.queryRows(
            `SELECT ID_klijenta, Pocetna_tezina_kg
            FROM Klijenti
            WHERE ID_klijenta = ?`, [numericClientId]
            ) // clientRows zagrada

        // Ako klijent ne postoji, vraća se prazan rezultat
        if (!clientRows || clientRows.length === 0) {
            // Prazni popisi omogućuju siguran prikaz praznog stanja
            return { startingWeight: null, measurements: []  }
        } // if zagrada

        // Početna težina pretvara se u broj ili null
        const pocetnaTezina = clientRows[0].Pocetna_tezina_kg
        const startingWeight = pocetnaTezina === null || pocetnaTezina === undefined ? null : Number(pocetnaTezina)

        // čita sve zapise mjerenja odabranog klijenta
        const rows = await this.queryRows(
            `SELECT mc.ID_mjere_klijenta, mc.ID_klijenta,  mc.ID_vrsta_mjerenja, mc.Vrijednost_mjerenja, mc.Datum_mjerenja, 
                    vm.Naziv_mjerenja,   vm.Mjerna_jedinica
            FROM Mjerenja_klijenta mc
            INNER JOIN Vrsta_mjerenja vm  ON vm.ID_vrsta_mjerenja = mc.ID_vrsta_mjerenja
            WHERE mc.ID_klijenta = ?
            ORDER BY date(mc.Datum_mjerenja) ASC,  mc.ID_mjere_klijenta ASC`, [numericClientId]
            ) // rows zagrada

        // Svaki zapis pretvara se u objekt prilagođen prikazu
        const measurements = rows.map(row => ({           
            id: Number(row.ID_mjere_klijenta),  // ID pojedinačnog zapisa
            clientId: Number(row.ID_klijenta),             // ID klijenta
            measurementTypeId: Number(row.ID_vrsta_mjerenja), // ID vrste mjerenja            
            measurementType: row.Naziv_mjerenja,            
            unit: row.Mjerna_jedinica,           
            value: Number(row.Vrijednost_mjerenja),  
            date: row.Datum_mjerenja
        })) // map zagrada

        // Vraća se početna težina zajedno sa svim zapisima mjerenja
        return {startingWeight,  measurements }
    } // getClientMeasurements

    // Sprema novi zapis mjerenja klijenta u bazu
    async addMeasurement({ clientId, measurementTypeId, value, date }) {
        // Dohvaća se veza prema bazi
        const db = this.getDatabase()
        if(!db){throw new Error('SQLIte baza nije otvorena')} //provjera je li baza otvorena

        // Pretvaranje ID-a klijenta i vrste mjerenja u brojeve
        const numericClientId = Number(clientId)
        const numericMeasurementTypeId = Number(measurementTypeId)
        
        // Provjera ID klijenta
        if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
            // Neispravan ID klijenta prekida spremanje
            throw new Error('ID klijenta nije valjan')
        } // if zagrada

        // Provjera ID-a vrste mjerenja
        if (!Number.isInteger(numericMeasurementTypeId) || numericMeasurementTypeId <= 0) {
            // Neispravna vrsta mjerenja prekida spremanje
            throw new Error('Vrsta mjerenja nije valjana')
        } // if zagrada

        //PROVJERA DATUMA I VRIJEDNOSTI MJERENJA PRIJE UPISA U BAZU --> KAKO BI SERVIS ODBIO NEISPRAVAN DATUM/VRIJEDNOST KAD GA POZOVE NEKA KOMPONENTA 
        // Pretvaranje vrijednosti u tekst radi provjere decimalnog separatora
        const valueText = String(value ?? '').trim()
         // Prihvaćanje cijelih i decimalnih brojeva s točkom
        if (!/^\d+(?:\.\d+)?$/.test(valueText)) {
            if (valueText.includes(',')) {
                throw new Error('Decimalni broj vrijednosti mjerenja odvaja se točkom (.)')
            } //if zagrada          
        } //if zagrada
        // Pretvaranje provjerenog unosa u broj
        const numericValue = Number(valueText)
        // Provjera je li vrijednost konačan broj veći od nule
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            throw new Error('Vrijednost mjerenja mora biti broj veći od nule')
        } //if zagrada

        // Pretvaranje datuma u tekst i uklanjanje vanjskih razmaka
        const measurementDate = String(date ?? '').trim()
        // Provjera obveznog datuma i traženog formata
        if (!/^\d{4}-\d{2}-\d{2}$/.test(measurementDate)) {
            throw new Error('Datum mjerenja mora biti u formatu GGGG-MM-DD')
        } //if zagrada
        // Razdvajanje datuma na godinu, mjesec i dan
        const [year, month, day] = measurementDate.split('-').map(Number)
        // Stvaranje datuma u UTC formatu radi provjere kalendarskog datuma
        const parsedDate = new Date(Date.UTC(year, month - 1, day))
        // Provjera postoji li uneseni datum u kalendaru
        const isRealDate = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 &&  parsedDate.getUTCDate() === day
        // Prekid spremanja ako datum ne postoji
        if (!isRealDate) {
            throw new Error('Datum mjerenja ne postoji u kalendaru')
        } //if zagradda

        // Provjera postoji li klijent
        const clientRows = await this.queryRows(
            `SELECT ID_klijenta  FROM Klijenti WHERE ID_klijenta = ?`,  [numericClientId]
        ) // clientRows zagrada
        // Nepostojeći klijent ne može imati zapis mjerenja
        if ( clientRows.length === 0) {
            // Prekid spremanja uz jasnu poruku
            throw new Error('Klijent nije pronađen')
        } // if zagrada
        // Provjera postoji li vrsta mjerenja
        const typeRows = await this.queryRows(
            `SELECT ID_vrsta_mjerenja FROM Vrsta_mjerenja WHERE ID_vrsta_mjerenja = ?`,  [numericMeasurementTypeId]
        ) //typeRows zagrada
        // Nepostojeća vrsta mjerenja ne može se spremiti
        if ( typeRows.length === 0) {
            // Prekid spremanja 
            throw new Error('Vrsta mjerenja nije pronađena')
        } // if zagrada

        // Spremanje novog zapisa mjerenja
        return db.run(
            `INSERT INTO Mjerenja_klijenta (ID_klijenta, ID_vrsta_mjerenja, Vrijednost_mjerenja, Datum_mjerenja) 
            VALUES (?, ?, ?, ?)`, 
            [ numericClientId,  numericMeasurementTypeId,  numericValue,  measurementDate ],
            false
            ) //db. run zagrada
    } // addMeasurement zagrada

// Briše pojedinačni zapis mjerenja
    async deleteMeasurement(measurementId) {
        // Dohvaća se veza prema bazi
        const db = this.getDatabase()

        // Brisanje je ograničeno na ID konkretnog zapisa
        return db.run(
            `DELETE FROM Mjerenja_klijenta WHERE ID_mjere_klijenta = ?`,
                [Number(measurementId)],false
            ) //db. run zagrada
    } // deleteMeasurement

} //class MeasurementService zagrada

// Izvoz jedne instance servisa koju će koristiti Vue stranice
const measurementService = new MeasurementService()

export default measurementService