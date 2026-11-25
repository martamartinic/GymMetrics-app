//servis služi kao centralno mjesto preko kojeg će aplikacija komunicirati sa svime vezano uz vježbe
//pr. potreban je kako bi za vrstu treniga dohvatili sve vježbe koje su vezane uz tu vrstu treninga

//uvoz databaseService objekta radi pristupa trenutno otvorenoj bazi
import databaseService from "./database.service";   

//servis koji sadrži sve operacije povezane s vježbama -->zadužen za dohvat i spremanje podataka o vježbama
class ExerciseService {

    //vraća trenutno otvorenu bazu
    getDatabase() {
        return databaseService.db
    } //getDatabase zagrada

    //dohvaća sve vježbe koje su vezane uz odabranu vrstu treninga
    async getExercisesForTrainingType(trainingTypeId) {
        //dohvat trenutno otvorene baze
        const db = this.getDatabase()
        //provjera je li baza otvorena
        if(!db) {
            throw new Error('SQLite baza nije otvorena')
        }//if zagrada

        //provjera je li prosljeđen ID vrste treninga
        if(!trainingTypeId) {
            //  return []
            throw new Error('ID vrste treninga nije proslijeđen')
          
        } //if zagrada

        //izvršavanje SELECT upita za dohvat vježbi iz tablice u bazi preko povezanih tablica vrste treninga i Vjezba_vrste_treninga
        const rezultat = await db.query(
            `SELECT v.ID_vjezbe, v.Naziv_vjezbe, v.Misicna_skupina, v.Default_vjezba
             FROM Vjezbe v
             INNER JOIN Vjezba_vrste_treninga vvt
                    ON vvt.ID_vjezbe = v.ID_vjezbe
             WHERE vvt.ID_vrsta_treninga = ?
             ORDER BY
                    v.Default_vjezba DESC,
                    v.Naziv_vjezbe ASC;`, [trainingTypeId]
        ) //rezultat zagrada

        //pretvaranje rezultata iz sql oblika u javascript oblik
        return (rezultat.values || []).map(exercise => ({
            //ID, naziv, misicna skupina, defaultvjezba iz baze sprema pod jednostavnijim javascript nazivom id, name, muslceGroup, defaultExercise
            id: exercise.ID_vjezbe,
            name: exercise.Naziv_vjezbe,
            muscleGroup: exercise.Misicna_skupina,
            defaultExercise: Number(exercise.Default_vjezba) === 1
        })) //return (rezultat.values) zagrada

    }//async getExercisesForTrainingType zagrada

    //FUNKCIJA ZA DOHVAT SVIH VJEŽBI IZ BAZE BEZ OBZIRA NA VRSTU TRENINGA (ZA EKRAN DODAVANJE NOVIH VJEŽBI)
    // Dohvaća sve postojeće vježbe iz baze za odabir pri dodavanju nove vrste treninga
    async getAllExercises() {
        // Dohvaća trenutno otvorenu SQLite bazu
        const db = this.getDatabase()

        // Provjerava je li baza otvorena
        if (!db) { throw new Error('SQLite baza nije otvorena') }

        // Dohvaća sve vježbe i njihove osnovne podatke
        const rezultat = await db.query(`
            SELECT
                ID_vjezbe,
                Naziv_vjezbe,
                Misicna_skupina,
                Default_vjezba
            FROM Vjezbe
            ORDER BY
                Misicna_skupina ASC,
                Default_vjezba DESC,
                Naziv_vjezbe ASC;
        `)

        // Pretvara rezultate SQL upita u JavaScript objekte
        return (rezultat.values || []).map(exercise => ({
            id: exercise.ID_vjezbe,
            name: exercise.Naziv_vjezbe,
            muscleGroup: exercise.Misicna_skupina,
            defaultExercise: Number(exercise.Default_vjezba) === 1
        }))
    } //getAllExercises zagrada

    // Dohvat svih različitih mišićnih skupina koje već postoje u bazi
    async getMuscleGroups() {
        // Dohvat otvorene SQLite baze
        const db = databaseService.db
        // Provjera je li baza otvorena
        if (!db) { throw new Error('SQLite baza nije otvorena') }

        // Dohvat jedinstvenih naziva mišićnih skupina
        const rezultat = await db.query(
            `SELECT DISTINCT Misicna_skupina
            FROM Vjezbe
            WHERE TRIM(Misicna_skupina) <> ''
            ORDER BY Misicna_skupina COLLATE NOCASE ASC`
        )

        // Podrška za rezultate koji su izravno niz ili objekt sa svojstvom values
        const redovi = Array.isArray(rezultat)
            ? rezultat
            : Array.isArray(rezultat?.values)
                ? rezultat.values
                : []

        // Vraćanje naziva mišićnih skupina u obliku niza tekstualnih vrijednosti
        return redovi.map(red => red.Misicna_skupina)

    } // getMuscleGroups

    // Spremanje nove vježbe i njezinih poveznica s odabranim vrstama treninga
    async createExercise({ name, muscleGroup, trainingTypeIds = [] }) {
        // Dohvat otvorene SQLite baze
        const db = databaseService.db
        // Provjera je li baza otvorena
        if (!db) { throw new Error('SQLite baza nije otvorena') }

        // Uklanjanje suvišnih razmaka iz naziva vježbe
        const nazivVjezbe = String(name ?? '').trim()

        // Uklanjanje suvišnih razmaka iz naziva mišićne skupine
        const nazivMisicneSkupine = String(muscleGroup ?? '').trim()

        // Provjera obveznog naziva vježbe
        if (!nazivVjezbe) {
            throw new Error('Naziv vježbe je obavezan')
        } //if zagrada

        // Provjera obvezne mišićne skupine
        if (!nazivMisicneSkupine) {
            throw new Error('Mišićna skupina je obavezna')
        } //if zagrada

        // Provjera je li popis vrsta treninga niz
        if (!Array.isArray(trainingTypeIds)) {
            throw new Error('Odabrane vrste treninga nisu valjane')
        } //if zagrada

        // Pretvaranje ID-eva u brojeve i uklanjanje eventualnih duplikata
        const numericTrainingTypeIds = [
            ...new Set(trainingTypeIds.map(id => Number(id)))
        ]

        // Provjera je li odabrana barem jedna vrsta treninga
        if (numericTrainingTypeIds.length === 0) {
            throw new Error('Odaberite barem jednu vrstu treninga')
        } //if zagrada

        // Provjera jesu li svi ID-evi pozitivni cijeli brojevi
        if (
            numericTrainingTypeIds.some(
                id => !Number.isInteger(id) || id <= 0
            )
        ) {
            throw new Error('Odabrana vrsta treninga nije valjana')
        } //if zagrada

        // Pokretanje transakcije kako bi se vježba i njezine poveznice spremile zajedno
        await db.beginTransaction()

        try {
            // Spremanje nove vježbe u tablicu Vjezbe
            const rezultatVjezbe = await db.run(
                `INSERT INTO Vjezbe
                    (Naziv_vjezbe, Misicna_skupina, Default_vjezba)
                VALUES (?, ?, 0)`,
                [nazivVjezbe, nazivMisicneSkupine],
                false
            )

            // Dohvat ID-a upravo spremljene vježbe
            const exerciseId = Number(rezultatVjezbe?.changes?.lastId)

            // Provjera je li baza vratila ID nove vježbe
            if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
                throw new Error('Nije moguće dohvatiti ID spremljene vježbe')
            } //if zagrada

            // Prolazak kroz sve odabrane vrste treninga
            for (const trainingTypeId of numericTrainingTypeIds) {
                // Povezivanje nove vježbe s pojedinom vrstom treninga
                await db.run(
                    `INSERT INTO Vjezba_vrste_treninga
                        (ID_vrsta_treninga, ID_vjezbe)
                    VALUES (?, ?)`,
                    [trainingTypeId, exerciseId],
                    false
                )
            } // for zagrada

            // Potvrda transakcije nakon uspješnog spremanja svih zapisa
            await db.commitTransaction()

            // Vraćanje ID-a nove vježbe
            return exerciseId

        } catch (error) {
            // Poništavanje svih promjena ako spremanje vježbe ili poveznica nije uspjelo
            try {
                await db.rollbackTransaction()
            } catch (rollbackError) {
                // Zapis greške poništavanja u razvojnu konzolu
                console.error('Greška pri poništavanju spremanja vježbe:', rollbackError)
            }
            // Prosljeđivanje izvorne greške komponenti
            throw error
        } //catch zagrada
    } // createExercise

} //class exerciseService zagrada

//kreiranje jedne instance servisa (ime instance je exerciseService) (ime klase je ExerciseService)
const exerciseService = new ExerciseService()

//izvoz instance koje će koristiti vue komponente
export default exerciseService