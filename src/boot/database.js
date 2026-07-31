//ova datoteka služi da kada se aplikacija pokrene da se pokrene metoda za inicijalizaciju baze -- initializeDatabase()

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

    }//catch zagrada

}; //export default async zagrada