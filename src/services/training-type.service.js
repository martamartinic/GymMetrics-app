//servis služi kao centralno mjesto preko kojeg će aplikacija komunicirati sa svime vezano uz vrste treninga

//uvoz databaseService objekta radi pristupa trenutno otvorenoj bazi
import databaseService from "./database.service";

//klasa koja sadrži sve operacije povezane s vrstama treninga
class TrainingTypeService {
    
    //metoda za dohvat trenutno otvorene sqlite baze
    getDatabase() {
        //vraća aktivnu vezu prema sqlite bazi iz databaseservice objekta
        return databaseService.db
    } //getDatabase zagrada

    //metoda za dohvat svih vrsta treninga iz baze (pr. za potrebe padajučeg izbornika na detaljima klijenta tab treninzi)
    async getTrainingTypes() {
        //dohvat trenutno otvorene baze
        const db = this.getDatabase()
        //provjera je li baza otvorena
        if(!db) {
            //prikaz greške i prekid izvršavanja ako baza nije otvorena
            throw new Error('SQLite baza nije otvorena')
        }//if zagrada

        //izvršavanje SELECT upita za dohvat vrste treninga iz tablice u bazi
        const rezultat = await db.query(
            `SELECT ID_vrsta_treninga, Vrsta_treninga 
            FROM Vrsta_treninga 
            ORDER BY Vrsta_treninga ASC `
        ) //rezultat zagrada

        //Pretvaranje rezultata iz sql oblika u javascript oblik
        return (rezultat.values || []).map(trainingType => ({
            //ID iz baze sprema pod jednostavnijim javascript nazivom id
            id: trainingType.ID_vrsta_treninga,
            //naziv vrste treninga iz baze sprema pod nazivom name
            name: trainingType.Vrsta_treninga
        })) //return (rezultat.values) zagrada

    }//getTrainingTypes zagrada

    //FUNKCIJA ZA SPREMANJE NOVE VRSTE TRENIGA (SAMO NAZIV ILI SA VJEŽBAMA) (EKRAN ZA DODAVANJE NOVE VRSTE TRENINGA)
     async createTrainingType({ name, exerciseIds = [] }) {
        // Dohvaća trenutno otvorenu bazu
        const db = this.getDatabase()

        // Provjerava je li baza otvorena
        if (!db) {
            throw new Error('SQLite baza nije otvorena')
        }

        // Uklanja nepotrebne razmake s početka i kraja naziva
        const trainingTypeName = String(name ?? '').trim()

        // Provjerava je li naziv vrste treninga unesen
        if (!trainingTypeName) {
            throw new Error('Naziv vrste treninga je obavezan')
        }

        // Provjerava jesu li ID-evi vježbi predani u obliku niza
        const exercisesToSave = Array.isArray(exerciseIds) ? exerciseIds : []

        // Uklanja eventualne duplikate ID-eva vježbi
        const uniqueExerciseIds = [...new Set(exercisesToSave.map(Number))]

        // Provjerava jesu li svi ID-evi vježbi valjani
        for (const exerciseId of uniqueExerciseIds) {
            if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
                throw new Error(`ID vježbe nije valjan: ${exerciseId}`)
            }
        }

        // Pokreće transakciju kako bi se svi podaci spremili zajedno
        await db.beginTransaction()

        try {
            // Sprema naziv nove vrste treninga
            const rezultatVrste = await db.run(
                `
                    INSERT INTO Vrsta_treninga (Vrsta_treninga)
                    VALUES (?);
                `,
                [trainingTypeName],
                false
            )

            // Dohvaća ID upravo spremljene vrste treninga
            const trainingTypeId = rezultatVrste?.changes?.lastId

            // Prekida spremanje ako SQLite nije vratio ID
            if (!trainingTypeId) {
                throw new Error('SQLite nije vratio ID nove vrste treninga')
            }

            // Prolazi kroz sve odabrane vježbe
            for (const exerciseId of uniqueExerciseIds) {
                // Sprema vezu između nove vrste treninga i odabrane vježbe
                await db.run(
                    `
                        INSERT INTO Vjezba_vrste_treninga
                            (ID_vrsta_treninga, ID_vjezbe)
                        VALUES (?, ?);
                    `,
                    [trainingTypeId, exerciseId],
                    false
                )
            }

            // Potvrđuje transakciju nakon uspješnog spremanja svih podataka
            await db.commitTransaction()

            // Vraća ID nove vrste treninga stranici
            return trainingTypeId

        } catch (error) {
            // Poništava sve promjene ako je došlo do greške
            try {
                await db.rollbackTransaction()
            } catch (rollbackError) {
                // Bilježi grešku ako nije uspjelo poništavanje transakcije
                console.error('Greška pri rollbacku:', rollbackError)
            }

            // Prosljeđuje izvornu grešku stranici
            throw error
        }
    } //createTrainingType zagrada


} //class trainingTypeService zagrada

//kreiranje jedne instance servisa (ime instance je trainingTypeService) (ime klase je TrainingTypeService)
const trainingTypeService = new TrainingTypeService()

//izvoz instance koje će koristiti vue komponente
export default trainingTypeService