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

    //metoda za dohvat svih vrsta treninga iz baze (za potrebe padajučeg izbornika na detaljima klijenta tab treninzi)
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

} //class trainingTypeService zagrada



//kreiranje jedne instance servisa (ime instance je trainingTypeService) (ime klase je TrainingTypeService)
const trainingTypeService = new TrainingTypeService()

//izvoz instance koje će koristiti vue komponente
export default trainingTypeService