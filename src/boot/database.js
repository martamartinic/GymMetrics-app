//ova datoteka služi da kada se aplikacija pokrene da se pokrene metoda za inicijalizaciju baze -- initializeDatabase()

//priprema SQLite bazu da aplikacija može raditi s podacima
//uvoz centralnog servisa za SQLite bazu //dohvat kreirane jedne instance databaseService  iz mape services
import databaseService from '../services/database.service';

//pokretanje inicijalizacije SQLite baze prilikom pokretanja aplikacije
export default async () => {

    try{
        console.log('1. Pokretanje inicijalizacije baze...');

        ///poziva se metoda koja prilikom pokretanja aplikacije inicijaliziraj sqlite -- samo ako je cijeli initialize database uspješno završio
        await databaseService.initializeDatabase();

     //poruka se ispisuje ako je inicijalizacija uspješno završila
        console.log('2. GymMetrics SQLite baza uspješno je inicijalizirana.');

    }//try zagrada
    catch(error) {
        //ispisuje grešku ako inicijalizacija baze nije uspjela
        console.error('3. Greška pri inicijalizaciji GymMetrics SQLite baze:', error);
    
        throw error; //baca grešku - tada aplikacija zna da database boot nije uspio i ne nastavlja se dalje - to je posebno bitno sad kad gradim aplikaciju koja ovisi o bazi i ako baza nije inicijalizirana onda se ne može nastaviti dalje

    }//catch zagrada

}; //export default async zagrada