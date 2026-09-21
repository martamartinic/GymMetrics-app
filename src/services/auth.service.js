//datpteka koja služi za komunikaciju s sqlite bazom --> služi kao jedino mjesto koje razgovara s bazom za autentifikaciju
//niti jedna vue stranica ne piše direktno sql nego sve ide kroz authservice
//sadrži metode za registraciju i prijavu trenera, za odjavu, za dohvat trenutnog trenera itd.
//pva datoteka služi kako bi app znala kako prijaviti i registrirati trenera koristeći otvorenu bazu podataka

// Uvoz databaseService objekta koji upravlja SQLite bazom. preko njega se pristupa već otvorenoj bazi.
import databaseService from './database.service'; 
//uvoz bycript za upravljanje hashiranim lozinkama --> radi hashiranje i provjera hasnirane lozinke
import bcrypt from 'bcryptjs';

// klasa Servis zadužen za autentikaciju trenera. // Sadrži metode za registraciju, prijavu i odjavu trenera.
//koristi se klasa radi grupiranja svih metoda vezanih uz autentifikaciju na jednom mjestu
class AuthService {

    //S obzirom da se poziva dataservice koji ima podatke o bazi koja se koristi, kreira se konstruktor u koji se sprema referenca na njega
    //poziva se automatski prilikom stvaranja AuthService objekta
    constructor () {
        //sprema referencu na postojeći databaseservice kako bi authservice mogao koristiti već otvorenu sql bazu
        this.databaseService = databaseService;
    } //constructor zagrada

    //metoda koja vraća otvorenu sqlite bazu
    getDatabase() {
        //vraća sqlite objekt kojim upravlja databaseservice 
        return this.databaseService.db; //db je varijabla u databaseService u kojoj se sprema konekcija prema bazi
    } //getDatabase zagrada

                    //          METODA ZA HASHIRANJE LOZINKE

    //metoda se koristi za registraciju trenera prije spremanja u bazu, prima plain text lozinku i vraća bycript hash
    async hashPassword(lozinka) {
        const saltRounds = 10; //salt rounds označava broj ponavljanja za raspršivanje, dodaju se slučajni nizovi znakova na lozinku prije obrade
        //bcrypt.hash() iz obične lozinke stvara hash koji se sprema u bazu
        //const hash = await bcrypt.hash(lozinka, saltRounds);
        //vraća gotov hash pozivatelju metode
        //return hash;
        return await bcrypt.hash (lozinka, saltRounds)

    }//async hashPassword(lozinka) zagrada

                            ///     METODA ZA PROVJERU LOZINKE

    //prima 1. lozinku koju je korisnik upisao, 2. hash koji je spremljen u sqlite bazi, vraća: true ako lozinka odgovara hashu i false ako ne
    async verifyPassword(upisanaLozinka, hashLozinke) 
    {
        //bcrypt.compare() sam uspoređuje običnu lozinku s hashom, hash se nikad ne pretvara natrag u običan tekst
      /*  const rezultat = await bcrypt.compare(
            upisanaLozinka,
            hashLozinke
        ) //const rezultat zagrada
    */
        //vraća true ili false
        //return rezultat;

        return await bcrypt.compare(upisanaLozinka, hashLozinke)
    } //async verifyPassword(...) zagrada

                    /// METODA ZA REGISTRACIJU TRENERA   ////

    //Prima ime, prezime, email i plain text lozinku trenera, metoda provjera postoji li otvorena sqlite baza, jesu li sva polja ispunjena, 
    //postoji li trener s istim emailom, hashira lozinku, sprema trenera u sqlite bazu, vraća rezultat registracije
    async signup(ime, prezime, email, lozinka) {

         try {
            
            const db = this.getDatabase(); // Dohvaća otvorenu SQLite bazu. --> uzima se otvorena sqlite baza, ne otvara se nova nego se koristi ona koju je databaseService otvorio

            // Ako baza nije otvorena, registracija se ne izvršava.
            if (!db) {
                return {
                    success: false, message: 'SQLite baza nije otvorena.'
                }; //return zagrada

            } //if zagrada

            // Brišu se praznine s početka i kraja teksta.
            ime = ime.trim();
            prezime = prezime.trim();
            email = email.trim().toLowerCase(); //pr. MARTA@gmail.com pretvori u marta@gmail.com radi sprječavanja duplikata
           // lozinka = lozinka.trim(); //da ne budu dopušteni razmaci kod lozinke

            // Provjera obaveznih polja -->ako jedno od ovih polja ostane prazno onda se šalje poruka da je x polje obavezno.
            if (
                !ime ||
                !prezime ||
                !email ||
                !lozinka
            ) {
                return {
                    success: false, message: 'Sva polja su obavezna.'
                }; //return zagrada
            } //if zagrada

            // Provjera postoji li već trener s istim emailom.
            const postojiEmail = await db.query(                `
                SELECT ID_trenera FROM Treneri
                WHERE Email = ?;
                `,
                [ email ]
            ); //const postojiEmail zagrada

            // Ako postoji barem jedan rezultat, email je već zauzet.
            if (postojiEmail.values && postojiEmail.values.length > 0) {
                return {
                    success: false, message: 'Email je već registriran.'
                }; //return zagrada

            } //if zagrada

            // Hashiranje lozinke prije spremanja u bazu -->pr. trener upiše gym123, u bazu ide $2a$06...
            const hashLozinke = await this.hashPassword(lozinka);

            // Dodavanje novog trenera, sprema se ime, prezime, email i hash lozinke
            await db.run(         `
                INSERT INTO Treneri
                (
                    Ime_trenera,
                    Prezime_trenera,
                    Email,
                    Lozinka
                )
                VALUES
                (
                    ?,
                    ?, 
                    ?, 
                    ? 
                );
                `,
                [
                    ime,
                    prezime,
                    email,
                    hashLozinke
                ]
            ); //await db.run zagrada

            //privremeno dodano za provjeru što se sprema u bazu:
            //obrisat prije pusha završne verzije
            /*const trener = await db.query(
                `SELECT Ime_trenera, Prezime_trenera, Email, Lozinka FROM Treneri`
            )//const trener zagrada
            console.log(trener.values);
            */

            //novo
            const noviTrener = await db.query(
                `
                SELECT
                    ID_trenera,
                    Ime_trenera,
                    Prezime_trenera,
                    Email
                FROM Treneri
                WHERE Email = ?;
                `,
                [email]
            ) //const noviTrener zagrada    
            

            if(!noviTrener.values || noviTrener.values.length===0) {
                return {success: false, message: 'Trener je registriran, ali podaci nisu dohvaćeni'}
            } //if zagrada

            const trener = noviTrener.values[0]
            return {
                success: true, message: 'Registracija je uspješna!',
                trener: {
                    id: trener.ID_trenera,
                    ime: trener.Ime_trenera,
                    prezime: trener.Prezime_trenera,
                    email: trener.Email
                }//trener zagrada
            } //return zagrada
           
            //ovo je ostalo od prije:
            // Ako je sve prije uspješno prošlo vraća se poruka za uspješnu registraciju.
        /*    return {
                success: true, message: 'Registracija je uspješna!'
            }; //return zagrada
            */

        } //try zagrada

        catch (error) {
            console.error(
                'Greška kod registracije:', error
            ); //console error zagrada

            // Vraća poruku pozivatelju metode.
            return {
                success: false, message: 'Greška kod registracije. \n Registracije neuspješna!'
            }; //return zagrada

        } //catch error zagrada

    }//async signup zagrada

    //                      METODA ZA PRIJAVU TRENERA

    async login(email, lozinka){

    try{
        const db = this.getDatabase();   //dohvaća bazu

        if(!db){    //provjera baze, ako baza nije otvorena šalje se poruka
            return{
                success:false, message:'SQLite baza nije otvorena.'
            }; //return zagrada
        } //if zagrada

        //kako bi se sprječilo da MARTA@gmail.com i marta@gmail.com budu različiti korisnici
        email = email.trim().toLowerCase();
        //lozinka = lozinka.trim();

        const rezultat = await db.query(   //uzima trenera //dohvat trenera po emailu
            `
            SELECT
                ID_trenera,
                Ime_trenera,
                Prezime_trenera,
                Email,
                Lozinka
            FROM Treneri
            WHERE Email = ?;
            `,
        [email]
        ); //const rezultat zagrada

        if(!rezultat.values || rezultat.values.length === 0){   //ako email ne postoji javlja se poruka
            return{
                success:false, message:'Email ili lozinka nije ispravna!' //kako bi se zaštitilo znanje postoji li određeni email u bazi ili ne
            };

        } //if zagrada

        const trener = rezultat.values[0];  //dohvaća trenera (uzima prvi i jedini red)

        const ispravnaLozinka = await this.verifyPassword(   //provjera lozinke -->ako bcrypt vrati true trener je prijavljen
            lozinka,
            trener.Lozinka
        ); //const ispravnalozinka zagrada

        if(!ispravnaLozinka){
            return{
                success:false, message:'Email ili lozinka nije ispravna' 
            };
        } //if zagrada

        return{  //vraća podatke o treneru kako bi kasnije spremili trenutnog trenera u pinia store
            success:true, message:'Prijava uspješna.',
            trener:{
                id:trener.ID_trenera,
                ime:trener.Ime_trenera,
                prezime:trener.Prezime_trenera,
                email:trener.Email
            } //trener zagrada
        }; //return zagrada

    } //try zagrada
    catch(error){
        console.error('Greška kod prijave:', error);
        return{
            success:false, message:'Greška kod prijave.'
        };
    } //catch error zagrada

} //async login zagrada


} //class authservice zagrada

// Jedna instanca AuthService servisa za cijelu aplikaciju.
//prilikom ovoga automatski se izvrši constructor() i unutra se napravi this.databaseService = databaseService te tada AuthService "zna" gje je baza
const authService = new AuthService();

// Omogućuje drugim datotekama/cijeloj aplikaciji korištenje (iste) instance.
export default authService;
