//servis služi kao centralno mjesto preko kojeg će aplikacija komunicirati sa svime vezano uz krvnu sliku klijenta // Servis je zadužen za pristup podacima krvne slike u SQLite bazi -- komponente pozivaju metode u ovom servisu umjessto pisanja SQL upita

// Uvoz servisa koji daje pristup otvorenoj SQLite bazi
import databaseService from './database.service'

class BloodTestService {
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

  ///FUNKCIJA ZA DOHVAT SVIH PARAMETARA KRVNE SLIKE (za padajući izbornik)
  async getBloodTestParametars() {

    const rezultat = await this.queryRows(`
        SELECT
            ID_parametra_krvne_slike,
            Naziv_parametra_ks,
            Jedinica_parametra_ks,
            Ref_min,
            Ref_max
        FROM Parametar_krvne_slike
        ORDER BY Naziv_parametra_ks COLLATE NOCASE ASC
    `)

    // Prilagodba podataka svojstvima koja koristi Vue komponenta
    return rezultat.map(red => ({
        id: Number(red.ID_parametra_krvne_slike),
        name: red.Naziv_parametra_ks,
        unit: red.Jedinica_parametra_ks,
        refMin: red.Ref_min == null ? null : Number(red.Ref_min),
        refMax: red.Ref_max == null ? null : Number(red.Ref_max)
    }))

  } //async getBloodTestParametars

  //FUNKCIJA ZA DOHVAT VRIJEDNOSTI KRVNE SLIKE KLIJENTA
  async getClientBloodTests(clientId) {

    const db = this.getDatabase()
    if(!db) { throw new Error('SQLite baza nije otvorena ') }

    const numericClientId = Number(clientId)

    // Provjera valjanosti ID-a klijenta
    if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
        throw new Error('ID klijenta nije valjan')
    } //if zagrada

    // Provjera postoji li klijent
    const clientRows = await this.queryRows(
      `SELECT ID_klijenta
       FROM Klijenti
       WHERE ID_klijenta = ?`,
      [numericClientId]
    )
    if (clientRows.length === 0) {  return [] }

    //DOHVAT REZULTATA KRVNE SLIKE I PRIPADAJUĆIH PARAMETARA
    const rows = await this.queryRows(`
        SELECT
        vk.ID_vrijednosti_krvne_slike, vk.ID_klijenta,
        vk.ID_parametra_krvne_slike, vk.Datum_nalaza_ks, vk.Vrijednost_krvne_slike,
        pk.Naziv_parametra_ks, pk.Jedinica_parametra_ks,
        pk.Ref_min, pk.Ref_max

        FROM Vrijednost_krvne_slike vk
        INNER JOIN Parametar_krvne_slike pk
        ON pk.ID_parametra_krvne_slike = vk.ID_parametra_krvne_slike

        WHERE vk.ID_klijenta = ?
        ORDER BY date(vk.Datum_nalaza_ks) DESC, vk.ID_vrijednosti_krvne_slike DESC
        `, [numericClientId]
    )

    // Prilagodba zapisa za korištenje u Vue komponenti
    return rows.map(red => ({
      id: Number(red.ID_vrijednosti_krvne_slike),
      clientId: Number(red.ID_klijenta),
      bloodParametarId: Number(red.ID_parametra_krvne_slike),
      parameterName: red.Naziv_parametra_ks,
      unit: red.Jedinica_parametra_ks,
      refMin: red.Ref_min == null ? null : Number(red.Ref_min),
      refMax: red.Ref_max == null ? null : Number(red.Ref_max),
      date: red.Datum_nalaza_ks,
      value: red.Vrijednost_krvne_slike == null ? null : Number(red.Vrijednost_krvne_slike)
    }))

  } //getClientBloodTests zagrada

  ///FUNKCIJA ZA SPREMANJE VRIJEDNOSTI NALAZA KRVNE SLIKE U BAZU
  async SaveClientBloodTest({ clientId, bloodParametarId, value, date }) {
   
    const db = this.getDatabase()
    if(!db) { throw new Error('SQLite baza nije otvorena ') }

    const numericClientId = Number(clientId)
    const numericParametarId = Number(bloodParametarId)

    // Provjera ID-a klijenta
    if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
        throw new Error('ID klijenta nije valjan')
    } //if zagrada

    // Provjera ID-a parametra
    if (!Number.isInteger(numericParametarId) || numericParametarId <= 0) {
        throw new Error('Parametar krvne slike nije valjan')
    } //if zagrada

    // Provjera vrijednosti nalaza
    const valueText = String(value ?? '').trim()

    if (!/^\d+(?:\.\d+)?$/.test(valueText)) {
        if (valueText.includes(',')) {
            throw new Error('Decimalni broj odvaja se točkom (.)' )
        } //if zagrada

        throw new Error('Vrijednost nalaza nije valjana')
    } //if zagrada

    const numericValue = Number(valueText)

    if (!Number.isFinite(numericValue) || numericValue < 0) {
        throw new Error('Vrijednost nalaza mora biti broj veći ili jednak nuli')
    } //if zagrada

    // Provjera datuma
    const bloodTestDate = String(date ?? '').trim()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bloodTestDate)) {
        throw new Error( 'Datum nalaza mora biti u formatu GGGG-MM-DD' )
    } //if zagrada

    const [year, month, day] = bloodTestDate.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(year, month - 1, day))
    const isRealDate = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day

    if (!isRealDate) {
        throw new Error('Datum nalaza ne postoji u kalendaru')
    } //if zagrada

    if (parsedDate > new Date()) {
        throw new Error('Datum nalaza ne može biti u budućnosti')
    } //if zagrada

    // Provjera postoji li klijent
    const clientRows = await this.queryRows(
        `SELECT ID_klijenta FROM Klijenti
         WHERE ID_klijenta = ?`,
         [numericClientId]
    )

    if (clientRows.length === 0) {
        throw new Error('Klijent nije pronađen')
    } //if zagrada

    // Provjera postoji li parametar krvne slike
    const parameterRows = await this.queryRows(
        `SELECT ID_parametra_krvne_slike
         FROM Parametar_krvne_slike
         WHERE ID_parametra_krvne_slike = ?`,
        [numericParametarId]
    )

    if (parameterRows.length === 0) {
        throw new Error('Parametar krvne slike nije pronađen')
    } //if zagrada

    // Spremanje rezultata u bazu
    return db.run(
        `INSERT INTO Vrijednost_krvne_slike ( ID_klijenta, ID_parametra_krvne_slike,
            Datum_nalaza_ks, Vrijednost_krvne_slike
        )
        VALUES (?, ?, ?, ?)`,
        [ numericClientId, numericParametarId, bloodTestDate, numericValue ],
        false
    )

  } //async SaveClientBloodTest zagrada

} //class BloodTestService zagrada

// Izvoz jedne instance servisa koju će koristiti Vue stranice
const bloodTestService = new BloodTestService()

export default bloodTestService