// scripts/seed.js
const mongoose = require('mongoose');
const Instrument = require('../models/Instrument');
const connectDB = require('../db');

// Date pentru instrumente
const instrumente = [
    {
        id: 1,
        nume: "Chitară Acustică Yamaha F310",
        descriere: "O chitară acustică perfectă pentru începători. Yamaha F310 oferă o calitate excelentă a sunetului și ușurință în utilizare la un preț accesibil. Construită din lemn de calitate, această chitară produce un sunet cald și plin, ideal pentru primii pași în lumea muzicii.",
        imagine: "/resources/instrumente/chitara-acustica.jpg",
        categorie: "Coarde",
        tipPrezentare: "Solo",
        pret: 799,
        greutate: 2200, // 2.2 kg
        dataAdaugare: new Date("2024-01-15"),
        culoare: "Natural",
        materiale: "Molid, Meranti, Palisandru",
        esteElectric: false
    },
    {
        id: 2,
        nume: "Pian Digital Roland FP-30X",
        descriere: "Pianul Digital Roland FP-30X oferă performanțe excepționale pentru pianiștii de toate nivelurile. Cu motorul de sunet SuperNATURAL Piano și claviatura PHA-4 Standard cu 88 de note, FP-30X oferă un touch și un ton de pian autentic într-un pachet portabil și accesibil.",
        imagine: "/resources/instrumente/pian-digital.jpg",
        categorie: "Claviatură",
        tipPrezentare: "Solo",
        pret: 3299,
        greutate: 14500, // 14.5 kg
        dataAdaugare: new Date("2023-11-20"),
        culoare: "Negru",
        materiale: "Plastic, Metal, Clape cu Greutate",
        esteElectric: true
    },
    {
        id: 3,
        nume: "Vioară Stentor Student II 4/4",
        descriere: "Vioara Stentor Student II este un pas înainte față de Stentor Student I și oferă o calitate a tonului ușor îmbunătățită. Acest instrument este ideal pentru elevii avansați care au nevoie de un instrument de calitate superioară.",
        imagine: "/resources/instrumente/vioara.jpg",
        categorie: "Coarde",
        tipPrezentare: "Orchestră",
        pret: 1250,
        greutate: 450, // 0.45 kg
        dataAdaugare: new Date("2024-02-05"),
        culoare: "Maro",
        materiale: "Arțar, Molid, Abanos",
        esteElectric: false
    },
    {
        id: 4,
        nume: "Saxofon Alto Yamaha YAS-280",
        descriere: "Yamaha YAS-280 este un excelent model de saxofon alto pentru studenți. Dispune de un suport reglabil pentru degetul mare pentru a se adapta la diferite dimensiuni ale mâinii, făcându-l ideal pentru elevii în creștere.",
        imagine: "/resources/instrumente/saxofon.jpg",
        categorie: "Suflat",
        tipPrezentare: "Trupă",
        pret: 4399,
        greutate: 2350, // 2.35 kg
        dataAdaugare: new Date("2023-09-10"),
        culoare: "Auriu",
        materiale: "Alamă Galbenă, Clape Nichelate",
        esteElectric: false
    },
    {
        id: 5,
        nume: "Chitară Electrică Fender Player Stratocaster",
        descriere: "Fender Player Stratocaster este un instrument impresionant cu un profil confortabil al gâtului în formă de 'C Modern' cu o finisare mată netedă - ideal pentru aproape orice stil de interpretare.",
        imagine: "/resources/instrumente/chitara-electrica.jpg",
        categorie: "Coarde",
        tipPrezentare: "Trupă",
        pret: 3499,
        greutate: 3600, // 3.6 kg
        dataAdaugare: new Date("2023-12-18"),
        culoare: "Roșu",
        materiale: "Arin, Arțar, Pau Ferro",
        esteElectric: true
    },
    {
        id: 6,
        nume: "Set Tobe Pearl Export EXX725S",
        descriere: "Seria Pearl Export continuă să stabilească standardul pentru calitate, valoare și, cel mai important, utilitate muzicală. Acest set de 5 piese include tobe, hardware și vine gata de cântat.",
        imagine: "/resources/instrumente/tobe.jpg",
        categorie: "Percuție",
        tipPrezentare: "Trupă",
        pret: 6299,
        greutate: 32000, // 32 kg
        dataAdaugare: new Date("2024-01-28"),
        culoare: "Roșu",
        materiale: "Plop, Hardware din Oțel",
        esteElectric: false
    },
    {
        id: 7,
        nume: "Sintetizator Korg Minilogue XD",
        descriere: "Korg Minilogue XD este un sintetizator analog polifonic cu patru voci cu un multi-motor digital, efecte, un sequencer și micro tuning. Este perfect pentru producători și artiști care caută capabilități unice de design sonor.",
        imagine: "/resources/instrumente/sintetizator.jpg",
        categorie: "Electronic",
        tipPrezentare: "Studio",
        pret: 2899,
        greutate: 2800, // 2.8 kg
        dataAdaugare: new Date("2023-10-05"),
        culoare: "Negru",
        materiale: "Metal, Plastic, Panouri Laterale din Lemn",
        esteElectric: true
    },
    {
        id: 8,
        nume: "Muzicuță Hohner Marine Band (Cheie C)",
        descriere: "Hohner Marine Band este arhetipul muzicuței de blues. Această muzicuță a fost prima alegere a muzicienilor profesioniști din întreaga lume timp de peste 100 de ani.",
        imagine: "/resources/instrumente/muzicuta.jpg",
        categorie: "Suflat",
        tipPrezentare: "Solo",
        pret: 299,
        greutate: 60, // 60 g
        dataAdaugare: new Date("2024-02-20"),
        culoare: "Natural",
        materiale: "Lemn de Păr, Lame Metalice",
        esteElectric: false
    },
    {
        id: 9,
        nume: "Set Cinele Meinl HCS",
        descriere: "Acest set de cinele Meinl HCS include hi-hat de 14\", crash de 16\" și ride de 20\". Fabricate din aliaj de alamă MS63, aceste cinele oferă sunete strălucitoare și focalizate cu un spectru de frecvență echilibrat.",
        imagine: "/resources/instrumente/cinele.jpg",
        categorie: "Percuție",
        tipPrezentare: "Trupă",
        pret: 1499,
        greutate: 5000, // 5 kg
        dataAdaugare: new Date("2023-08-15"),
        culoare: "Auriu",
        materiale: "Aliaj de Alamă MS63",
        esteElectric: false
    },
    {
        id: 10,
        nume: "Pian Digital Kawai CA49",
        descriere: "Pianul digital Kawai CA49 combină touch și ton excepționale într-un dulap frumos și compact. Cu o acțiune autentică a clapelor din lemn și un sunet uimitor de pian de concert SK-EX, acest instrument oferă o experiență de interpretare remarcabilă.",
        imagine: "/resources/instrumente/pian-digital2.jpg",
        categorie: "Claviatură",
        tipPrezentare: "Solo",
        pret: 7999,
        greutate: 57000, // 57 kg
        dataAdaugare: new Date("2023-07-10"),
        culoare: "Alb",
        materiale: "Lemn, Plastic, Metal",
        esteElectric: true
    },
    {
        id: 11,
        nume: "Acordeon Weltmeister Cassotto 414",
        descriere: "Acordeonul Weltmeister Cassotto 414 oferă un sunet bogat și cald, perfect pentru muzica populară și clasică. Cu 41 de clape și 120 de bași, acest instrument oferă versatilitate și expresivitate muzicală.",
        imagine: "/resources/instrumente/acordeon.jpg",
        categorie: "Claviatură",
        tipPrezentare: "Ansamblu",
        pret: 8499,
        greutate: 9500, // 9.5 kg
        dataAdaugare: new Date("2023-09-25"),
        culoare: "Negru",
        materiale: "Lemn, Metal, Plastic",
        esteElectric: false
    },
    {
        id: 12,
        nume: "Djembe African Remo",
        descriere: "Djembe-ul Remo combină designul tradițional african cu materialele moderne durabile. Acest instrument de percuție portabil oferă tonuri bogate și bași profunzi, ideal pentru cercurile de ritm și spectacolele live.",
        imagine: "/resources/instrumente/djembe.jpg",
        categorie: "Percuție",
        tipPrezentare: "Ansamblu",
        pret: 799,
        greutate: 2300, // 2.3 kg
        dataAdaugare: new Date("2024-01-05"),
        culoare: "Maro",
        materiale: "Lemn, Piele Sintetică, Corzi",
        esteElectric: false
    }
];

// Conectarea la baza de date
const seedDB = async () => {
    try {
        await connectDB();
        
        // Ștergerea tuturor instrumentelor existente
        await Instrument.deleteMany({});
        console.log('Toate instrumentele existente au fost șterse');
        
        // Inserarea noilor instrumente
        await Instrument.insertMany(instrumente);
        console.log('Baza de date a fost populată cu instrumente de probă');
        
        // Închiderea conexiunii
        mongoose.connection.close();
    } catch (error) {
        console.error('Eroare la popularea bazei de date:', error);
        process.exit(1);
    }
};

// Rularea funcției de populare
seedDB();