//komunicira sa SQLite bazom
//ova datoteka služi kao centralno mjesto kroz koje će aplikacija komunicirati sa sqlite bazom

//uvoz SQLite plugina
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

    await this.db.execute('PRAGMA foreign_keys = ON'); //uključuje provjeru FK ograničenja
    console.log('F.1 FK provjera uključena');

    await this.createTables(); //kreira tablice

    console.log('G. Sve SQLite tablice uspješno kreirane/provjerene.');

    //poziv metode koja provjerava postoje li seed podaci i unosi ih u bazu ako ne postoje
    await this.insertSeedData(); //this -- insertSeedData() pripada istoj klasi kao i initializeDatabase() //poziva se metoda ove klase

    //privremena provjera ako su seed podaci stvarno upisani
    const result = await this.db.query(
        'SELECT COUNT(*) AS broj FROM Vjezbe'
    ); //const result zagrada
    console.log('Broj vježbi:', result.values);
    const result1 = await this.db.query(
        'SELECT COUNT(*) AS broj FROM Grupa_ciljeva'
    ); //result1 zagrada
    console.log('Broj grupa ciljeva:', result1.values);
     const result2 = await this.db.query(
        'SELECT COUNT(*) AS broj FROM Vrsta_treninga'
    ); //result1 zagrada
    console.log('Broj vrsta treninga:', result2.values);
     const result3 = await this.db.query(
        'SELECT COUNT(*) AS broj FROM Vrsta_mjerenja'
    ); //result1 zagrada
    console.log('Broj vrsta mjerenja:', result3.values);
     const result4 = await this.db.query(
        'SELECT COUNT(*) AS broj FROM Parametar_krvne_slike'
    ); //result1 zagrada
    console.log('Broj parametara krvne slike:', result4.values);

   //console od prije dodane privremene provjere
    console.log('H. Seed podaci uspješno provjereni/uneseni.');

    // Dohvaćamo popis tablica koje postoje u bazi iz SQLite plugin-a
    const tables = await this.db.getTableList();

    console.log('I. Tablice u bazi:', tables);

    console.log('J. SQLite inicijalizacija završena.');

  } //async initializeDatabase zagrada
  

   /*         KREIRANJE TABLICA BAZE       */
  
  async createTables() {

    //TRENERI
    await this.db.execute(` 

        CREATE TABLE IF NOT EXISTS Treneri (
            ID_trenera INTEGER PRIMARY KEY AUTOINCREMENT,
            Ime_trenera TEXT NOT NULL,
            Prezime_trenera TEXT NOT NULL,
            Email TEXT NOT NULL UNIQUE,
            Lozinka TEXT NOT NULL
        
        ); 
    `);  //trener tablica zagrada


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
                Aktivan_flag INTEGER NOT NULL DEFAULT 1,

                FOREIGN KEY (ID_trenera)
                    REFERENCES Treneri(ID_trenera)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            );

       ` ); //zagrada await this.db.execute tablica klijenti

        await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Grupa_ciljeva (
                ID_ciljeva INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_cilja TEXT NOT NULL UNIQUE,              -- Naziv cilja mora biti jedinstven u tablici Grupa_ciljeva kako bi se u seed podacima izbjeglo duplikate (pr. da se kod stvaranja ne ponovi ponovno da se kreira isti cilj) 
                Opis_cilja TEXT
            ); 

       ` ); //zagrada await this.db.execute tablica GRUPA CILJEVA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrsta_mjerenja (
                ID_vrsta_mjerenja INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_mjerenja TEXT NOT NULL UNIQUE,                   -- Naziv mjerenja mora biti jedinstven u tablici Vrsta_mjerenja kako bi se u seed podacima izbjeglo duplikate (pr. da se kod stvaranja ne ponovi ponovno da se kreira isti naziv mjerenja) 
                Mjerna_jedinica TEXT NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica VRSTA MJERENJA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrsta_testova (
                ID_vrsta_testa INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_testa TEXT NOT NULL UNIQUE,                   -- Naziv testa mora biti jedinstven u tablici Vrsta_testova kako bi se u seed podacima izbjeglo duplikate (pr. da se kod stvaranja ne ponovi ponovno da se kreira isti naziv testa) 
                Mjerna_jedinica_testa TEXT NOT NULL
            ); 

       ` ); //zagrada await this.db.execute tablica VRSTA TESTOVA

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vrsta_treninga (
                ID_vrsta_treninga INTEGER PRIMARY KEY AUTOINCREMENT, 
                Vrsta_treninga TEXT NOT NULL UNIQUE                    -- Vrsta treninga mora biti jedinstvena u tablici Vrsta_treninga kako bi se u seed podacima izbjeglo duplikate (pr. da se kod stvaranja ne ponovi ponovno da se kreira ista vrsta treninga) 
            ); 

       ` ); //zagrada await this.db.execute tablica VRSTA TRENINGA

        await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Vjezbe (
                ID_vjezbe INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_vjezbe TEXT NOT NULL UNIQUE,                   -- Naziv vježbe mora biti jedinstven u tablici Vjezbe kako bi se u seed podacima izbjeglo duplikate (pr. da se kod stvaranja ne ponovi ponovno da se kreira isti naziv vježbe) 
                Misicna_skupina TEXT NOT NULL,
                Default_vjezba INTEGER NOT NULL DEFAULT 0
            ); 

       ` ); //zagrada await this.db.execute tablica VJEŽBE

       await this.db.execute( `
            CREATE TABLE IF NOT EXISTS Parametar_krvne_slike (
                ID_parametra_krvne_slike INTEGER PRIMARY KEY AUTOINCREMENT, 
                Naziv_parametra_ks TEXT NOT NULL UNIQUE,                      -- Naziv parametra krvne slike mora biti jedinstven u tablici Parametar_krvne_slike kako bi se u seed podacima izbjeglo duplikate (pr. da se kod stvaranja ne ponovi ponovno da se kreira isti naziv parametra krvne slike) 
                Jedinica_parametra_ks TEXT NOT NULL,
                Ref_min REAL,
                Ref_max REAL
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
                    ON DELETE RESTRICT,

                UNIQUE (ID_klijenta, ID_ciljeva)  -- Dodano ograničenje jedinstvenosti za kombinaciju ID_klijenta i ID_ciljeva kako bi se spriječilo dupliciranje ciljeva za istog klijenta (SEED PODACI) - da se za istog klijenta ne bi unio dvaput isti cilj
                
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
                ID_vjezba_vrsta_treninga INTEGER PRIMARY KEY AUTOINCREMENT, 
                ID_vrsta_treninga INTEGER NOT NULL,
                ID_vjezbe INTEGER NOT NULL,
                
                FOREIGN KEY (ID_vrsta_treninga)
                    REFERENCES Vrsta_treninga(ID_vrsta_treninga)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT,

                FOREIGN KEY (ID_vjezbe)
                    REFERENCES Vjezbe(ID_vjezbe)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT,

                UNIQUE (ID_vrsta_treninga, ID_vjezbe)  -- Dodano ograničenje jedinstvenosti za kombinaciju ID_vrsta_treninga i ID_vjezbe kako bi se spriječilo dupliciranje vježbi za istu vrstu treninga (SEED PODACI) - da se za istu vrstu treninga ne bi unijela dvaput ista vježba (pr. bench press, gornji dio, bench press gornji dio)
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
                    ON DELETE RESTRICT,

                UNIQUE (ID_treninga_klijenta, ID_vjezbe)  -- Dodano ograničenje jedinstvenosti za kombinaciju ID_treninga_klijenta i ID_vjezbe kako bi se spriječilo dupliciranje vježbi za isti trening klijenta (SEED PODACI) - da se za isti trening klijenta ne bi unijela dvaput ista vježba 
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
                    ON DELETE CASCADE,
                
                UNIQUE (ID_termina, ID_klijenta)  -- Dodano ograničenje jedinstvenosti za kombinaciju ID_termina i ID_klijenta kako bi se spriječilo dupliciranje termina za istog klijenta (SEED PODACI) - da se za isti termin ne bi unio dvaput isti klijent
            ); 

       ` ); //zagrada await this.db.execute tablica TERMINI KLIJENTA

  } //async createTables zagrada

  //metoda za provjeru i unos početnih seed podataka
    async insertSeedData() {

        //ispisuje poruku da je pokrenut postupak provjere seed podataka
        console.log('H.1 Pokretanje provjere seed podataka...');

        //metoda za unos grupe ciljeva
        await this.insertSeedGrupaCiljeva();
        
        //metoda za unos vrste mjerenja
        await this.insertSeedVrstaMjerenja();   

        //metoda za unos vrste testova
        await this.insertSeedVrstaTestova();

        //metoda za unos vrste treninga
        await this.insertSeedVrstaTreninga();

        //metoda za unos vježbi
        await this.insertSeedVjezbe();

        //metoda za unos vježbi po vrsti treninga
        await this.insertSeedVjezbaVrsteTreninga();

        //metoda za unos parametara krvne slike
        await this.insertSeedParametarKrvneSlike();

        console.log('H.2 Seed podaci provjereni i uneseni ako je potrebno.');

    }; //async insertSeedData zagrada

    async insertSeedGrupaCiljeva() {
         //insert or ignore -- ako već postoji, neće se unositi duplikat
        await this.db.execute(`
            INSERT OR IGNORE INTO Grupa_ciljeva (Naziv_cilja, Opis_cilja) VALUES
            ('Gubitak masnog tkiva', 'Smanjenje postotka masti u tijelu'),
            ('Hipertrofija', 'Izgradnja mišićne mase.'),
            ('Rekompozicija tijela', 'Istovremeno smanjenje masnog tkiva i povećanje mišićne mase.'),
            ('Mobilnost i fleksibilnost', 'Proširenje aktivnog i pasivnog opsega pokreta'),
            ('Sportska rehabilitacija', 'Povratak punoj funkciji zgloba ili mišića nakon ozljede.');
    
         `); //insert zagrada
    } //async insertSeedGrupaCiljeva zagrada

    async insertSeedVrstaMjerenja() {
        await this.db.execute(`
            INSERT OR IGNORE INTO Vrsta_mjerenja (Naziv_mjerenja, Mjerna_jedinica) VALUES 
            ('Težina', 'kg'),
            ('Obujam bokova', 'cm'),
            ('Obujam struka', 'cm'),
            ('Obujam prsa', 'cm'),
            ('Obujam nadlaktice', 'cm');

         `); //insert zagrada
    } //async insertSeedVrstaMjerenja zagrada

    async insertSeedVrstaTestova() {
        await this.db.execute(`
            INSERT OR IGNORE INTO Vrsta_testova (Naziv_testa, Mjerna_jedinica_testa) VALUES 
            ('Skok u dalj', 'm'),
            ('Skok u vis', 'cm'),
            ('Sprint 50m', 'm'),
            ('Sprint 100m', 'm'),
            ('Plank', 'sec'),
            ('Izdržaj mrtvo vješanje', 'sec');
            `); //insert zagrada
    } //async insertSeedVrstaTestova zagrada

    async insertSeedVrstaTreninga() {
        await this.db.execute(`
            INSERT OR IGNORE INTO Vrsta_treninga (Vrsta_treninga) VALUES 
            ('Gornji dio'),          --ID 1
            ('Donji dio'),           --ID 2
            ('Cijelo tijelo'),       --ID 3
            ('Kondicijski trening'), --ID 4
            ('Ciklički trening'),    --ID 5
            ('Trening mobilnosti');  --ID 6
            `); //insert zagrada
    } //async insertSeedVrstaTreninga zagrada

    async insertSeedVjezbe() {
        await this.db.execute(`
            INSERT OR IGNORE INTO Vjezbe (Naziv_vjezbe, Misicna_skupina, Default_vjezba) VALUES 
            ('Bench press', 'Prsa', 1),
            ('Incline bench press', 'Prsa', 1),
            ('Dumbell bench press', 'Prsa', 1),
            ('Chest fly', 'Prsa', 1),
            ('Cable fly', 'Prsa', 1),
            ('Push up', 'Prsa', 1),
            ('Smith machine push up', 'Prsa', 1),
            ('Pull up', 'Leđa', 1),
            ('Smith machine pull up', 'Leđa', 1),
            ('Chin up', 'Leđa', 1),
            ('Lat pulldown', 'Leđa', 1),
            ('Seated cable row', 'Leđa', 1),
            ('Barbell row', 'Leđa', 1),
            ('One arm dumbell row', 'Leđa', 1),
            ('TRX row', 'Leđa', 1),
            ('Overhead shoulder press', 'Ramena', 1),
            ('Arnold shoulder press', 'Ramena', 1),
            ('Lateral raise', 'Ramena', 1),
            ('Front raise', 'Ramena', 1),
            ('Rear delt fly', 'Ramena', 1),
            ('Face pull', 'Ramena', 1),
            ('Bicep barbell curl', 'Biceps', 1),
            ('Ez bar bicep curl', 'Biceps', 1),
            ('Bicep dumbell curl', 'Biceps', 1),
            ('Bicep hammer curl', 'Biceps', 1),
            ('Preacher bicep curl', 'Biceps', 1),
            ('Tricep pushdown', 'Triceps', 1),
            ('Tricep skull crusher', 'Triceps', 1),
            ('Tricep overhead extension', 'Triceps', 1),
            ('Tricep dips', 'Triceps', 1),
            ('Plank', 'Core/abs', 1),
            ('Reverse plank', 'Core/abs', 1),
            ('Side plank', 'Core/abs', 1),
            ('Hanging leg raise', 'Core/abs', 1),
            ('Lying leg raise', 'Core/abs', 1),
            ('Russian twist', 'Core/abs', 1),
            ('Dead bug', 'Core/abs', 1),
            ('Flutter kicks', 'Core/abs', 1),
            ('Side bend obliques', 'Core/abs', 1),
            ('Barbell back squat', 'Kvadriceps', 1),
            ('Smith machine back squat', 'Kvadriceps', 1),
            ('Front squat', 'Kvadriceps', 1),
            ('Goblet squat', 'Kvadriceps', 1),
            ('Leg press', 'Kvadriceps', 1),
            ('Leg extension', 'Kvadriceps', 1),
            ('Walking lunge', 'Kvadriceps', 1),
            ('Standing front lunge', 'Kvadriceps', 1),
            ('Standing front lunge rotation', 'Kvadriceps', 1),
            ('Barbell between legs split squat', 'Kvadriceps', 1),
            ('Bulgarian split squat', 'Kvadriceps', 1),
            ('Step ups', 'Kvadriceps', 1),
            ('Deadlift', 'Zadnja loža', 1),
            ('Romanian deadlift', 'Zadnja loža', 1),
            ('Single leg RDL', 'Zadnja loža', 1),
            ('B-stance RDL', 'Zadnja loža', 1),
            ('Hamstring curl', 'Zadnja loža', 1),
            ('Good morning', 'Zadnja loža', 1),
            ('Nordic hamstring curl', 'Zadnja loža', 1),
            ('Hip thrust', 'Gluteus', 1),
            ('Glute bridge', 'Gluteus', 1),
            ('Single leg glute bridge', 'Gluteus', 1),
            ('Cable kickback', 'Gluteus', 1),
            ('Squat kettlebell', 'Gluteus', 1),
            ('Single leg squat stepper', 'Gluteus', 1),
            ('Reverse lunge', 'Gluteus', 1),
            ('Reverse lunge rotation', 'Gluteus', 1),
            ('Reverse lunge stepper', 'Gluteus', 1),
            ('Reverse lunge smith machine', 'Gluteus', 1),
            ('Curtsy lunge dumbell', 'Gluteus', 1),
            ('Curtsy lunge smith machine', 'Gluteus', 1),
            ('Sumo squat', 'Gluteus', 1),
            ('Walking with band', 'Gluteus', 1),
            ('Standing calf raises', 'Listovi', 1),
            ('Seated calf raises', 'Listovi', 1),
            ('Farmers carry', 'Tijelo', 1),
            ('Suitcase carry', 'Tijelo', 1),
            ('Burpee', 'Tijelo', 1),
            ('Squat to shoulder press', 'Tijelo', 1),
            ('Kettlebell swing', 'Tijelo', 1),
            ('Man maker', 'Tijelo', 1),
            ('Trčanje na traci', 'cardio', 1),
            ('Sprint na traci', 'cardio', 1),
            ('Hodanje uz nagib', 'cardio', 1),
            ('Sobni bicikl', 'cardio', 1),
            ('Air bike', 'cardio', 1),
            ('Eliptični trenažer', 'cardio', 1),
            ('Veslački ergometar', 'cardio', 1),
            ('Stair master', 'cardio', 1),
            ('Ski erg', 'cardio', 1),
            ('Box jump', 'Tijelo', 1),
            ('Jump Squat', 'Tijelo', 1),
            ('Medicine ball slam', 'Tijelo', 1),
            ('Cone drill', 'Tijelo', 1),
            ('Battle ropes', 'Tijelo', 1),
            ('Sled push', 'Tijelo', 1),
            ('Sled pull', 'Tijelo', 1),
            ('Mountain climbers', 'Tijelo', 1),
            ('Jumping jacks', 'Tijelo', 1),
            ('Skater jumps', 'Tijelo', 1),
            ('90/90 hip rotation', 'Gluteus', 1),
            ('Clamshells', 'Gluteus', 1),
            ('Couch stretch', 'Tijelo', 1),
            ('Deep squat', 'Tijelo', 1),
            ('The worlds greatest stretch', 'Tijelo', 1),
            ('Shoulder stretch with band', 'Ramena', 1),
            ('Bird dog', 'Tijelo', 1),
            ('Cat cow', 'Tijelo', 1),
            ('banded hip abduction', 'Gluteus', 1),
            ('Wall angles', 'Tijelo', 1),
            ('Thread the needle stretch', 'Tijelo', 1),
            ('Shoulder pass-throughs štap', 'Ramena', 1);

            `); //insert zagrada
    } //async insertSeedVjezbe zagrada

    async insertSeedVjezbaVrsteTreninga() {
        await this.db.execute(`
            INSERT OR IGNORE INTO Vjezba_vrste_treninga (ID_vrsta_treninga, ID_vjezbe) VALUES 
            (1, 1), -- Bench press za Gornji dio 
            (3, 1), -- Bench press za cijelo tijelo 
            (1, 2), -- incline bench press za gornji dio
            (3, 2), -- incline bench press za cijelo tijelo
            (1, 3), -- dumbell bench press za gornji dio
            (3, 3), -- dumbell bench press za cijelo tijelo
            (1, 4), -- chest fly za gornji dio
            (3, 4), -- chest fly za cijelo tijelo
            (1, 5), -- cable fly za gornji dio
            (3, 5), -- cable fly za cijelo tijelo
            (1, 6), -- push up za gornji dio
            (3, 6), -- push up za cijelo tijelo
            (1, 7), -- smith machine push up za gornji dio
            (3, 7), -- smith machine push up za cijelo tijelo
            (1, 8), -- pull up za gornji dio
            (3, 8), -- pull up za cijelo tijelo
            (1, 9), -- smith machine pull up za gornji dio
            (3, 9), -- smith machine pull up za cijelo tijelo
            (1, 10), -- chin up za gornji dio
            (3, 10), -- chin up za cijelo tijelo
            (1, 11), -- lat pulldown za gornji dio
            (3, 11), -- lat pulldown za cijelo tijelo
            (1, 12), -- seated cable row za gornji dio
            (3, 12), -- seated cable row za cijelo tijelo
            (1, 13), -- barbell row za gornji dio
            (3, 13), -- barbell row za cijelo tijelo
            (1, 14), -- one arm dumbell row za gornji dio
            (3, 14), -- one arm dumbell row za cijelo tijelo
            (1, 15), -- trx row za gornji dio
            (3, 15),  -- trx row za cijelo tijelo
            (1, 16), -- overhead shoulder press za gornji dio
            (3, 16), -- overhead shoulder press za cijelo tijelo
            (1, 17), -- arnold shoulder press za gornji dio
            (3, 17),  -- arnold shoulder press za cijelo tijelo
            (1, 18), -- lateral raise za gornji dio
            (3, 18),  -- lateral raise za cijelo tijelo
            (1, 19), -- front raise za gornji dio
            (3, 19),  -- front raise za cijelo tijelo
            (1, 20), -- rear delt fly za gornji dio
            (3, 20),  -- rear delt fly za cijelo tijelo
            (1, 21), -- face pull za gornji dio
            (3, 21),  -- face pull za cijelo tijelo
            (1, 22), -- bicep barbell curl za gornji dio
            (3, 22),  -- bicep barbell curl za cijelo tijelo
            (1, 23), -- ez bar bicep curl za gornji dio
            (3, 23),  -- ez bar bicep curl za cijelo tijelo
            (1, 24), -- bicep dumbell curl za gornji dio
            (3, 24),  -- bicep dumbell curl za cijelo tijelo
            (1, 25), -- bicep hammer curl za gornji dio
            (3, 25),  -- bicep hammer curl za cijelo tijelo
            (1, 26), -- preacher bicep curl za gornji dio
            (3, 26),  -- preacher bicep curl za cijelo tijelo
            (1, 27), -- tricep pushdown za gornji dio
            (3, 27),  -- tricep pushdown za cijelo tijelo
            (1, 28), -- tricep skull crusher za gornji dio
            (3, 28),  -- tricep skull crusher za cijelo tijelo
            (1, 29), -- tricep overhead extension za gornji dio
            (3, 29),  -- tricep overhead extension za cijelo tijelo
            (1, 30), -- tricep dips za gornji dio
            (3, 30),  -- tricep dips za cijelo tijelo
            (1, 31), -- plank za gornji dio
            (3, 31),  -- plank za cijelo tijelo
            (1, 32), -- reverse plank za gornji dio
            (3, 32),  -- reverse plank za cijelo tijelo
            (1, 33), -- side plank za gornji dio
            (3, 33),  -- side plank za cijelo tijelo
            (1, 34), -- hanging leg raise za gornji dio
            (3, 34),  -- hanging leg raise za cijelo tijelo
            (1, 35), -- lying leg raise za gornji dio
            (3, 35),  -- lying leg raise za cijelo tijelo
            (1, 36), -- Russian twist za gornji dio
            (3, 36),  -- Russian twist za cijelo tijelo
            (1, 37), -- dead bug za gornji dio
            (3, 37),  -- dead bug za cijelo tijelo
            (1, 38), -- flutter kicks za gornji dio
            (3, 38),  -- flutter kicks za cijelo tijelo
            (1, 39), -- side bend obliques za gornji dio
            (3, 39),  -- side bend obliques za cijelo tijelo
            (2, 40), -- barbell back squat za donji dio
            (3, 40),  -- barbell back squat za cijelo tijelo
            (2, 41), -- smith machine back squat za donji dio
            (3, 41),  -- smith machine back squat za cijelo tijelo
            (2, 42), -- front squat za donji dio
            (3, 42),  -- front squat za cijelo tijelo
            (2, 43), -- goblet squat za donji dio
            (3, 43),  -- goblet squat za cijelo tijelo
            (2, 44), -- leg press za donji dio
            (3, 44),  -- leg press za cijelo tijelo
            (2, 45), -- leg extension za donji dio
            (3, 45),  -- leg extension za cijelo tijelo
            (2, 46), -- walking lunge za donji dio
            (3, 46),  -- walking lunge za cijelo tijelo
            (2, 47), -- standing front lunge za donji dio
            (3, 47),  -- standing front lunge za cijelo tijelo
            (2, 48), -- standing front lunge rotation za donji dio
            (3, 48),  -- standing front lunge rotation za cijelo tijelo
            (2, 49), -- barbell between legs split squat za donji dio
            (3, 49),  -- barbell between legs split squat za cijelo tijelo
            (2, 50), -- bulgarian split squat za donji dio
            (3, 50),  -- bulgarian split squat za cijelo tijelo
            (2, 51), -- step ups za donji dio
            (3, 51),  -- step ups za cijelo tijelo
            (2, 52), -- deadlift za donji dio
            (3, 52),  -- deadlift za cijelo tijelo
            (2, 53), -- romanian deadlift za donji dio
            (3, 53),  -- romanian deadlift za cijelo tijelo
            (2, 54), -- single leg RDL za donji dio
            (3, 54),  -- single leg RDL za cijelo tijelo
            (2, 55), -- b-stance RDL za donji dio
            (3, 55),  -- b-stance RDL za cijelo tijelo
            (2, 56), -- hamstring curl za donji dio
            (3, 56),  -- hamstring curl za cijelo tijelo
            (2, 57), -- good morning za donji dio
            (3, 57),  -- good morning za cijelo tijelo
            (2, 58), -- nordic hamstring curl za donji dio
            (3, 58),  -- nordic hamstring curl za cijelo tijelo
            (2, 59), -- hip thrust za donji dio
            (3, 59),  -- hip thrust za cijelo tijelo
            (2, 60), -- glute bridge za donji dio
            (3, 60),  -- glute bridge za cijelo tijelo
            (2, 61), -- single leg glute bridge za donji dio
            (3, 61),  -- single leg glute bridge za cijelo tijelo
            (2, 62), -- cable kickback za donji dio
            (3, 62),  -- cable kickback za cijelo tijelo
            (2, 63), -- squat kettlebell za donji dio
            (3, 63),  -- squat kettlebell za cijelo tijelo
            (2, 64), -- single leg squat stepper za donji dio
            (3, 64),  -- single leg squat stepper za cijelo tijelo
            (2, 65), -- reverse lunge za donji dio
            (3, 65),  -- reverse lunge za cijelo tijelo
            (2, 66), -- reverse lunge rotation za donji dio
            (3, 66),  -- reverse lunge rotation za cijelo tijelo
            (2, 67), -- reverse lunge stepper za donji dio
            (3, 67),  -- reverse lunge stepper za cijelo tijelo
            (2, 68), -- reverse lunge smith machine za donji dio
            (3, 68),  -- reverse lunge smith machine za cijelo tijelo
            (2, 69), -- curtsy lunge dumbell za donji dio
            (3, 69),  -- curtsy lunge dumbell za cijelo tijelo
            (2, 70), -- curtsy lunge smith machine za donji dio
            (3, 70),  -- curtsy lunge smith machine za cijelo tijelo
            (2, 71), -- sumo squat za donji dio
            (3, 71),  -- sumo squat za cijelo tijelo
            (2, 72), -- walking with band za donji dio
            (3, 72),  -- walking with band za cijelo tijelo
            (4, 72), -- walking with band za kondicijski trening
            (2, 73), -- standing calf raises za donji dio
            (3, 73),  -- standing calf raises za cijelo tijelo
            (2, 74), -- seated calf raises za donji dio
            (3, 74),  -- seated calf raises za cijelo tijelo
            (3, 75), -- farmer's carry za cijelo tijelo
            (4, 75), -- farmer's carry za kondicijski trening
            (3, 76), -- suitcase carry za cijelo tijelo
            (4, 76), -- suitcase carry za kondicijski trening
            (3, 77), -- burpee za cijelo tijelo
            (4, 77), -- burpee za kondicijski trening
            (3, 78), -- squat to shoulder press za cijelo tijelo
            (4, 78), -- squat to shoulder press za kondicijski trening
            (3, 79), -- kettlebell swing za cijelo tijelo
            (4, 79), -- kettlebell swing za kondicijski trening
            (3, 80), -- man maker za cijelo tijelo
            (4, 80), -- man maker za kondicijski trening
            (5, 81), -- trčanje na traci za ciklički trening
            (2, 81), -- trčanje na traci za donji dio
            (3, 81), -- trčanje na traci za cijelo tijelo
            (5, 82), -- sprint na traci za ciklički trening
            (2, 82), -- sprint na traci za donji dio
            (3, 82), -- sprint na traci za cijelo tijelo
            (5, 83), -- hodanje uz nagib za ciklički trening
            (2, 83), -- hodanje uz nagib za donji dio
            (3, 83), -- hodanje uz nagib za cijelo tijelo
            (5, 84), -- sobni bicikl za ciklički trening
            (2, 84), -- sobni bicikl za donji dio
            (3, 84), -- sobni bicikl za cijelo tijelo
            (5, 85), -- air bike za ciklički trening
            (2, 85), -- air bike za donji dio
            (3, 85), -- air bike za cijelo tijelo
            (5, 86), -- eliptični trenažer za ciklički trening
            (2, 86), -- eliptični trenažer za donji dio
            (3, 86), -- eliptični trenažer za cijelo tijelo
            (5, 87), -- veslački ergometar za ciklički trening
            (1, 87), -- veslački ergometar za gornji dio
            (3, 87), -- veslački ergometar za cijelo tijelo
            (5, 88), -- stair master za ciklički trening
            (2, 88), -- stair master za donji dio
            (3, 88), -- stair master za cijelo tijelo
            (5, 89), -- ski erg za ciklički trening
            (1, 89), -- ski erg za gornji dio
            (3, 89),  -- ski erg za cijelo tijelo
            (4, 90), -- box jump za kondicijski trening
            (4, 91), -- jump squat za kondicijski trening
            (4, 92), -- medicine ball slam za kondicijski trening
            (4, 93), -- cone drill za kondicijski trening
            (4, 94), -- battle ropes za kondicijski trening
            (4, 95), -- sled push za kondicijski trening
            (4, 96), -- sled pull za kondicijski trening
            (4, 97), -- mountain climbers za kondicijski trening
            (1, 97), -- mountain climbers za gornji dio
            (4, 98), -- jumping jacks za kondicijski trening
            (5, 98), -- jumping jacks za ciklički trening
            (4, 99), -- skater jumps za kondicijski trening
            (6, 100), -- 90/90 hip rotation za trening mobilnosti
            (2, 100), -- 90/90 hip rotation za donji dio
            (3, 100), -- 90/90 hip rotation za cijelo tijelo
            (6, 101), -- clamshells za trening mobilnosti
            (2, 101), -- clamshells za donji dio
            (3, 101), -- clamshells za cijelo tijelo
            (6, 102), -- couch stretch za trening mobilnosti
            (2, 102), -- couch stretch za donji dio
            (3, 102), -- couch stretch za cijelo tijelo
            (6, 103), -- deep squat za trening mobilnosti
            (2, 103), -- deep squat za donji dio
            (3, 103), -- deep squat za cijelo tijelo
            (6, 104), -- the world's greatest stretch za trening mobilnosti
            (2, 104), -- the world's greatest stretch za donji dio
            (3, 104), -- the world's greatest stretch za cijelo tijelo
            (6, 105), -- shoulder stretch with band za trening mobilnosti
            (1, 105), -- shoulder stretch with band za gornji dio
            (3, 105), -- shoulder stretch with band za cijelo tijelo
            (6, 106), -- bird dog za trening mobilnosti
            (1, 106), -- bird dog za gornji dio
            (3, 106), -- bird dog za cijelo tijelo
            (6, 107), -- cat cow za trening mobilnosti
            (1, 107), -- cat cow za gornji dio
            (3, 107), -- cat cow za cijelo tijelo
            (6, 108), -- banded hip abduction za trening mobilnosti
            (2, 108), -- banded hip abduction za donji dio
            (3, 108), -- banded hip abduction za cijelo tijelo
            (6, 109), -- wall angles za trening mobilnosti
            (1, 109), -- wall angles za gornji dio
            (3, 109), -- wall angles za cijelo tijelo
            (6, 110), -- Thread the needle stretch za trening mobilnosti
            (1, 110), -- Thread the needle stretch za gornji dio
            (3, 110), -- Thread the needle stretch za cijelo tijelo
            (6, 111), -- shoulder pass-throughs štap za trening mobilnosti
            (1, 111), -- shoulder pass-throughs štap za gornji dio
            (3, 111);  -- shoulder pass-throughs štap za cijelo tijelo
            `); //insert zagrada
    } //async insertSeedVjezbaVrsteTreninga zagrada

    async insertSeedParametarKrvneSlike() {
        await this.db.execute(`
            INSERT OR IGNORE INTO Parametar_krvne_slike (Naziv_parametra_ks, Jedinica_parametra_ks, Ref_min, Ref_max) VALUES 
            ('K Leukociti_Lkc', 'x 10e9/L', 3.4, 9.7),
            ('K Neutrofilni granulociti', 'x 10e9/L', 2.1, 6.5),
            ('K Eozinofilni granulociti', 'x 10e9/L', 0.0, 0.43),
            ('K Bazofilni granulociti', 'x 10e9/L', 0.0, 0.06),
            ('K Monociti', 'x 10e9/L', 0.12, 0.84),
            ('K Limfociti', 'x 10e9/L', 1.2, 3.4),
            ('K Netrofilni granulociti rel', '%', 44, 72),
            ('K Eozinofilni granulociti rel', '%', 0, 7),
            ('K Bazofilni granulociti rel', '%', 0, 1),
            ('K Monociti rel', '%', 2, 12),
            ('K Limfociti rel', '%', 20, 46),
            ('K Eritrociti Erc', 'x 10e12/L', 4.34, 5.72),
            ('K Hemoglobin Hb', 'g/L', 138, 175),
            ('K Hematokrit Hct', 'L/L', 0.415, 0.530),
            ('K prosječni volumen eritrocita MCV', 'fL', 83, 97),
            ('K prosječna količina hemoglobina u eritrocitu MCH', 'pg', 27, 34),
            ('K prosječna koncentracija hemoglobina u eritrocitima MCHC', 'g/L', 320, 345),
            ('K raspodjela eritrocita po volumenu RDW', '%', 9.0, 15.0),
            ('K Trombociti Trc', 'x 10e9/L', 158, 424),
            ('K prosječni volumen trombocita MPV', 'fL', 6.8, 10.4),
            ('S Željezo Fe', 'μmol/L', 8, 30),
            ('S Željezo ukupni kapacitet vezanja željeza', 'μmol/L', 49, 75),
            ('S Željezo nezasićeni kapacitet vezanja željeza', 'μmol/L', 26, 59),
            ('S zalihe željeza feritin muško', 'μg/L', 30, 300),
            ('S zalihe željeza feritin žensko', 'μg/L', 15, 200),
            ('S glukoza serum', 'mmol/L', 4.4, 6.4),
            ('S Kreatinin', 'μmol/L', 64, 104),
            ('Elektroliti S natrij serum plazma', 'mmol/L', 137, 146),
            ('Elektroliti S kalij', 'mmol/L', 3.9, 5.1),
            ('Elektroliti S kalcij', 'mmol/L', 2.14, 2.53),
            ('Elektroliti S magnezij', 'mmol/L', 0.65, 1.05),
            ('Jetreni enzim S Aspartat aminotransfereza AST', 'U/L', 11, 38),
            ('Jetreni enzim S Alanin aminotransfereza ALT', 'U/L', 12, 48),
            ('Jetreni enzim S Gama glutamiltransferezsa GGT', 'U/L', 11, 55),
            ('Upale CRP', 'mg/L', NULL, 5),
            ('S Kolesterol ukupni', 'mmol/L', NULL, 5.0),
            ('S Kolesterol HDL', 'mmol/L', 1.0, NULL),
            ('S LDL Kolesterol', 'mmol/L', NULL, 3.0),
            ('S trigliceridi', 'mmol/L', NULL, 1.7),
            ('Urea', 'mmol/L', 2.8, 8.3),
            ('Kortizol jutarnji sati', 'mmol/L', 171, 536),
            ('Kortizol poslijepodnevni sati', 'mmol/L', 64, 340),
            ('TSH tireotropni hormon štitnjače', 'mIU/L', 0.40, 4.00),
            ('FT4 slobodni tiroksin štitnjača', 'pmol/L', 11.5, 22.7),
            ('FT3 slobodni trijodtironin štitnjača', 'pmol/L', 2.7, 9.7),
            ('Hormoni ukupni testosteron muško', 'nmol/L', 10, 42),
            ('Hormoni ukupni testosteron žensko', 'nmol/L', 0.7, 2.6),
            ('DHEAS muško', 'μmol/L', 2.6, 7.7),
            ('DHEAS žensko', 'μmol/L', 1.8, 7.7),
            ('DHEAS žensko menopauza', 'μmol/L', 0.5, 2.6),
            ('Vitamin D3', 'nmol/L', 75, 150),
            ('Vitamin B12', 'pmol/L', 200, 900);

            `); //insert zagrada
    } //async insertSeedParametarKrvneSlike zagrada
    
} //Class DatabaseService zagrada

// Jedna instanca servisa za cijelu aplikaciju.
const databaseService = new DatabaseService();

// Omogućuje drugim datotekama da koriste isti databaseService objekt.
export default databaseService;