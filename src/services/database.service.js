/*

//ova datoteka služi kao centralno mjesto kroz koje će aplikacija komunicirati sa sqlite bazom

//uvoz SQLite plugina
import { CapacitorSQLite } from '@capacitor-community/sqlite'; //CapacitorSQLite je objekt koji daje plugin. //sav razgovor sa SQLite pluginom ide preko CapacitorSQLite objekta.

//klasa je kao nacrt, opisuje što objekt ima
class DatabaseService { //stvaranje klase u kojoj će biti funkcije create tables, getExercise, insertExercise...
    
    db=null; //objekt koji predstavlja otvorenu vezu prema SQLite bazi trenutno ima praznu varijablu, nije spojena na bazu još  //varijabla objekta koja će nakon inicijalizacije sadržavati vezu prema SQLite bazi

    //metoda za inicijalizaciju baze, u kojoj se kreira konekcija sprema se u this.db, otvara se konekcija, uključuje se FK provjera i poziva se metoda createTables
    async initializeDatabase() {

        console.log('A. Kreiranje konekcije...');

        //varijabla koja će pamtit vezu kad se otvori baza //ova varijabla je veza s bazom imamo databaseService --> db -->SQLite baza //db varijabla koja pripada ovom objektu, ne znači neka globalna varijabla nego varijabla ovog objekta //riječ this znači moj -->moja konekcija s SQLite bazom (konekcija s bazom ovog objekta ne nekog drugog)
        this.db= await CapacitorSQLite.createConnection( //stvara vezu prema bazi gymMetrics ili dohvaća vezu prema toj bazi 
            "gymMetrics", //ime baze //na android uređaju nastat će gymMetrics.db
            false, //ne koristi se šifrirana baza
            "no-encryption", //potvrda da se ne koristi šifirirana baza
            1, //verzija baze
            false //nije riječ o read-only nego će se baza moći mijenjati (upistivati, ažurirati, brisati podatke)
        ); //zagrada this.db 

        console.log('B. Konekcija kreirana.');

        await this.db.open(); //otvaranje prethodno kreirane veze prema bazi //Bez open() nijedan SQL neće raditi. ////otvara vezu prema bazi kako bi se nad njom mogli izvršavati SQL upiti
    
       console.log('C. Baza otvorena.');
       
        //uključivanje provjere FK ograničenja u SQLite-u za konkretnu konekciju --da se lakše testira pr. on delete restrict da sqlite stvarno provodi to ograničenje
        await this.db.execute("PRAGMA foreign_keys = ON");

        console.log('D. FK provjera uključena.');

        //kreiranje tablica ako još ne postoje sada kada je baza otvorena
        await this.createTables();

        console.log('E. CREATE TABLE naredbe završene.');
    
    } //zagrada async initializeDatabase()

    //metoda za kreiranje svih tablica baze - dodana prije linija koda uključivanja provjere FK i kreiranja tablica ako ne postoje
    async createTables() {
        //SQL naredba za kreiranje svih tablica //izvršava se nad otvorenom vezom s bazom (db varijabla ima spremljenu vezu)
        await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Treneri (
                ID_trenera INTEGER PRIMARY KEY AUTOINCREMENT, 
                Ime_trenera TEXT NOT NULL,
                Prezime_trenera TEXT NOT NULL,
                Email TEXT NOT NULL UNIQUE,
                Lozinka TEXT NOT NULL
            );

       ` ); //zagrada await this.db.execute tablica treneri

        await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Klijenti (
                ID_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_trenera INTEGER NOT NULL,
                Ime_klijenta TEXT NOT NULL,
                Prezime_klijenta TEXT NOT NULL,
                Spol TEXT NOT NULL,
                Kontakt TEXT NOT NULL,
                Visina_cm REAL NOT NULL,
                Pocetna_tezina_kg REAL NOT NULL,
                Iskustvo TEXT NOT NULL,
                Napomena TEXT,
                Aktivan_flag BOOLEAN NOT NULL,

                FOREIGN KEY (ID_trenera)
                    REFERENCES Treneri(ID_trenera)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            );

       ` ); //zagrada await this.db.execute tablica klijenti

        await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Grupa_ciljeva (
                ID_ciljeva INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_cilja TEXT NOT NULL,
                Opis_cilja TEXT
            ); 

       ` ); //zagrada await this.db.execute tablica GRUPA CILJEVA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrsta_mjerenja (
                ID_vrsta_mjerenja INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_mjerenja TEXT NOT NULL,
                Mjerna_jedinica TEXT NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica VRSTA MJERENJA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrsta_testova (
                ID_vrsta_testa INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_testa TEXT NOT NULL,
                Mjerna_jedinica_testa TEXT NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica VRSTA TESTOVA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrsta_treninga (
                ID_vrsta_treninga INTEGER PRIMARY KEY AUTOINCREMENT, 
                Vrsta_treninga TEXT NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica VRSTA TRENINGA

        await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vjezbe (
                ID_vjezbe INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_vjezbe TEXT NOT NULL,
                Misicna_skupina TEXT NOT NULL,
                Default_vjezba BOOLEAN NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica VJEŽBE

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Parametar_krvne_slike (
                ID_parametra_krvne_slike INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_parametra_ks TEXT NOT NULL,
                Jedinica_parametra_ks TEXT NOT NULL,
                Ref_min REAL NOT NULL,
                Ref_max REAL NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica PARAMETAR KS

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Prehrana (
                ID_prehrane INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                Dnevne_kalorije_kcal INTEGER NOT NULL,
                Proteini_g INTEGER,
                Ugljikohidrati_g INTEGER,
                Secer_g INTEGER,
                Masti_g INTEGER,
                Vlakna_g INTEGER,

                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            ); 

       ` ); //zagrada await this.db.execute tablica PREHRANA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Zdravstveno_stanje (
                ID_zd_stanja INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                Dijagnoza TEXT,
                Lijek TEXT,
                Ozljeda TEXT,
                Bolovi TEXT,
                Sistolicki_tlak INTEGER,
                Dijastolicki_tlak INTEGER,
                Datum_zd_stanja TEXT NOT NULL,

                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            ); 

       ` ); //zagrada await this.db.execute tablica ZD STANJE

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Ciljevi_klijenta (
                ID_ciljeva_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                ID_ciljeva INTEGER NOT NULL,

                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                
                FOREIGN KEY (ID_ciljeva)
                    REFERENCES Grupa_ciljeva(ID_ciljeva)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica CILJEVI KLIJENTA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Mjerenja_klijenta (
                ID_mjere_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                ID_vrsta_mjerenja INTEGER NOT NULL,
                Vrijednost_mjerenja REAL NOT NULL,
                Datum_mjerenja TEXT NOT NULL,

                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                
                FOREIGN KEY (ID_vrsta_mjerenja)
                    REFERENCES Vrsta_mjerenja(ID_vrsta_mjerenja)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica MJERENJA KLIJENTA

         await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Testovi_klijenta (
                ID_testa_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                ID_vrsta_testa INTEGER NOT NULL,
                Rezultat_testa REAL NOT NULL,
                Datum_testa TEXT NOT NULL,
                Biljeska_testa TEXT,

                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                
                FOREIGN KEY (ID_vrsta_testa)
                    REFERENCES Vrsta_testova(ID_vrsta_testa)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica TESTOVI KLIJENTA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Trening_klijenta (
                ID_treninga_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                ID_vrsta_treninga INTEGER NOT NULL,
                Datum_treninga TEXT NOT NULL,
                Ocjena_treninga REAL NOT NULL,
                Biljeska_treninga TEXT,

                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                
                FOREIGN KEY (ID_vrsta_treninga)
                    REFERENCES Vrsta_treninga(ID_vrsta_treninga)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica TRENING KLIJENTA

          await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vjezba_vrste_treninga (
                ID_vjezba_vrste_treninga INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_vrsta_treninga INTEGER NOT NULL,
                ID_vjezbe INTEGER NOT NULL,
                
                FOREIGN KEY (ID_vrsta_treninga)
                    REFERENCES Vrsta_treninga(ID_vrsta_treninga)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT,

                FOREIGN KEY (ID_vjezbe)
                    REFERENCES Vjezbe(ID_vjezbe)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica VJEŽBA VRSTE TRENINGA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vjezbe_treninga_klijenta (
                ID_vjezbe_treninga_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_treninga_klijenta INTEGER NOT NULL,
                ID_vjezbe INTEGER NOT NULL,
                
                FOREIGN KEY (ID_treninga_klijenta)
                    REFERENCES Trening_klijenta(ID_treninga_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                FOREIGN KEY (ID_vjezbe)
                    REFERENCES Vjezbe(ID_vjezbe)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica VJEŽBE TRENINGA KLIJENTA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrijednost_krvne_slike (
                ID_vrijednosti_krvne_slike INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_klijenta INTEGER NOT NULL,
                ID_parametra_krvne_slike INTEGER NOT NULL,
                Datum_nalaza_ks TEXT NOT NULL,
                Vrijednost_krvne_slike REAL,
                
                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                FOREIGN KEY (ID_parametra_krvne_slike)
                    REFERENCES Parametar_krvne_slike(ID_parametra_krvne_slike)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica VRIJEDNOST KS

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Termini (
                ID_termina INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_trenera INTEGER NOT NULL,
                Datum_termina TEXT NOT NULL,
                Vrijeme_termina TEXT NOT NULL,
                
                FOREIGN KEY (ID_trenera)
                    REFERENCES Treneri(ID_trenera)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ); 

       ` ); //zagrada await this.db.execute tablica TERMINI

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Termini_klijenta (
                ID_termina_klijenta INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_termina INTEGER NOT NULL,
                ID_klijenta INTEGER NOT NULL,
                
                FOREIGN KEY (ID_termina)
                    REFERENCES Termini(ID_termina)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                
                FOREIGN KEY (ID_klijenta)
                    REFERENCES Klijenti(ID_klijenta)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            ); 

       ` ); //zagrada await this.db.execute tablica TERMINI KLIJENTA

    } //zagrada async createTables()  

} //zagrada class DatabaseService --> kraj klase kojoj se opisuje kako izgleda DatabaseService


//primjerak - objekt 
//objekt je ono što stvarno postoji u memoriji
const databaseService = new DatabaseService(); // Kreiramo jedanput jednu instancu DatabaseService koju će koristiti cijela aplikacija kako je ne bismo trebali kreirati više puta --jedna instancu koju će koristit cijela app //ovo je konkretna instanca klase

export default databaseService; //export koji omogućuje da se bilo gdje u aplikaciji preko import databaseService from 'src/services/database.service'; pozove kreiran database servis //omogućuje drugim datotekama da importaju ovu jednu instancu DatabaseService servisa


//initializeDatabase() je metoda kojom se otvara veza s bazom i potrebna je prije izvršavanja SQL upita (select, insert...) //poziva se pri pokretanju aplikacije 

*/

//PRIVREMENO OVA VERZIJA RADI TESTIRANJA NA EMULATORU DAL DELA OVAJ DIO:

import {
  CapacitorSQLite,  //stvarni capacitor plugin koji komunicira s native sqlite dijelom androida
  SQLiteConnection  //pomoćna klasa koja olakšava upravljanje sqlite konekcijama
} from '@capacitor-community/sqlite';


class DatabaseService {

 //spremat će se otvorena konekcija prema bazi
  db = null;  //trenutno ovaj servis nema konekciju prema bazi

  // SQLiteConnection je pomoćni objekt koji upravlja konekcijama.
  sqlite = new SQLiteConnection(CapacitorSQLite);  //objekt koji upravlja sql konekcijama

  // INICIJALIZACIJA BAZE

  async initializeDatabase() {   ///glavna metoda koju poziva src/boot/database.js

    console.log('A. Pokretanje SQLite inicijalizacije...');


    // Provjera stanja postojećih sql konekcija
    //Provjera jesu li postojeće sqlite konekcije i dalje konzistentne, znači da javascript/quasar dio app uspješno komunicira s native capacitor sqlite pluginom
    const consistency = await this.sqlite.checkConnectionsConsistency();    //await radi čekanja da se prvo ovo izvrši prije nastavljanja na druge operacije

    console.log('B. Provjera SQLite konekcije:', consistency);

    //provjera postoji li već konekcija prema gymMetrics bazi //provjera postoji li gymMetrics
    const connectionExists =
      await this.sqlite.isConnection(
        'gymMetrics',
        false  //označava da se ne traži read-only konekcija
      );

    console.log('C. Postoji li već konekcija:', connectionExists);


     //ako konekcija već postoji, ne stvara se nova konkecija umjesto toga dohvaća se postojeća
    if (connectionExists.result) {

      console.log(
        'D. Dohvaćanje postojeće konekcije...'
      );

      this.db =                                //tu se sprema stvarna/postojeća konekcija 
        await this.sqlite.retrieveConnection(   //retrieve connection služi za dohvat postojeće konekcije za gymMetrics
          'gymMetrics',
          false
        );

    } //if zagrada
    else {  //ako konekcija uopće ne postoji onda se stvara nova konekcija

      console.log(
        'D. Kreiranje nove konekcije...'
      );

      this.db =    //nova konekcija s parametrima:
        await this.sqlite.createConnection(   //createConnection kreira novu konekciju
          'gymMetrics',     //ime baze
          false,            ///nije read-only
          'no-encryption', //baza nije šifrirana
          1,                ///verzija baze
          false             ///nije read-only
        );
    } //else zagrada


    console.log('E. Konekcija kreirana/dohvaćena.');

     //otvara se baza
    await this.db.open();   //sad tek se stvarno otvara baza kako bi se nad njom izvršale sql naredbe --> prethodno je samo izrada/dohvat konekcije

    console.log(
      'F. Baza gymMetrics otvorena.'
    );

    //izvršavaju se naredbe za kreiranje tablica

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS Testna_tablica (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Poruka TEXT NOT NULL
      );
    `); 

    //await this.db.execute('PRAGMA foreign_keys = ON'); //uključuje provjeru FK ograničenja
    //console.log('F.1 FK provjera uključena');

    //await this.createTables();

    console.log('G. CREATE TABLE naredbe završene.');

    // Dohvaćamo popis tablica koje postoje u bazi iz SQLite plugin-a
    const tables = await this.db.getTableList();

    console.log('H. Tablice u bazi:', tables);

    console.log('I. SQLite inicijalizacija završena.');

  } //async initializeDatabase zagrada
  

   /*         KREIRANJE TABLICA BAZE       */
  /*
  async createTables() {

    //CREATE TABLE NAREDBE.

  } //async createTables zagrada
   */

} //Class DatabaseService zagrada

// Jedna instanca servisa za cijelu aplikaciju.
const databaseService = new DatabaseService();

// Omogućuje drugim datotekama da koriste isti databaseService objekt.
export default databaseService;