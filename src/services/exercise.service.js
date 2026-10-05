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
} //class exerciseService zagrada

//kreiranje jedne instance servisa (ime instance je exerciseService) (ime klase je ExerciseService)
const exerciseService = new ExerciseService()

//izvoz instance koje će koristiti vue komponente
export default exerciseService