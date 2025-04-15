// Importarea modulelor necesare
const express = require('express');
const path = require('path');

// Crearea unei instanțe a aplicației Express
const app = express();

// Setarea motorului de template la EJS
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

// Configurarea directorului pentru vizualizări
app.set('views', path.join(__dirname, 'views'));


// Afișarea căilor cerute
console.log('Calea folderului în care se găsește fișierul index.js (__dirname):', __dirname);
console.log('Calea fișierului (__filename):', __filename);
console.log('Folderul curent de lucru (process.cwd()):', process.cwd());

// Explicație: __dirname și process.cwd() nu sunt întotdeauna același lucru
console.log('Sunt __dirname și process.cwd() același lucru?', __dirname === process.cwd() ? 'Da' : 'Nu');
console.log('__dirname reprezintă directorul în care se află fișierul executat');
console.log('process.cwd() reprezintă directorul din care a fost pornit procesul Node.js');

// Configurare pentru fișiere statice
app.use(express.static(path.join(__dirname, 'public')));


const fs = require('fs');

// Încărcăm configurația de erori
let obGlobal = {
    obErori: null
};

// Citim fișierul de erori
try {
    obGlobal.obErori = JSON.parse(fs.readFileSync(path.join(__dirname, "erori.json")));
} catch (err) {
    console.error("Eroare la încărcarea fișierului de erori:", err);
}

// Funcție pentru afișarea paginii de eroare
function afiseazaEroare(res, identificator = undefined, titluArg = undefined, textArg = undefined, imagineArg = undefined) {
    let eroare;
    
    if (obGlobal.obErori) {
        if (identificator) {
            // Căutăm eroarea cu identificatorul dat
            const eroareGasita = obGlobal.obErori.info_erori.find(err => err.identificator === identificator);
            eroare = eroareGasita || obGlobal.obErori.eroare_default;
        } else {
            // Dacă nu este dat identificatorul, folosim eroarea default
            eroare = obGlobal.obErori.eroare_default;
        }
    } else {
        // Fallback în caz că nu avem configurație JSON
        eroare = {
            titlu: "Eroare",
            text: "A apărut o eroare!",
            imagine: "error-default.jpg"
        };
    }
    
    // Pentru fiecare proprietate, dacă argumentul este dat, are prioritate
    const titluFinal = titluArg !== undefined ? titluArg : eroare.titlu;
    const textFinal = textArg !== undefined ? textArg : eroare.text;
    const imagineFinal = imagineArg !== undefined ? imagineArg : eroare.imagine;
    
    // Setăm statusul răspunsului dacă errorul definește status și identificator
    if (eroare.status && eroare.identificator) {
        res.status(eroare.identificator);
    }
    
    // Construim calea către imagine
    const caleImagine = obGlobal.obErori ? 
        (obGlobal.obErori.cale_baza + imagineFinal) : 
        ("/resources/" + imagineFinal);
    
    // Randăm pagina de eroare cu datele finale
    res.render("pages/eroare", {
        pageTitle: titluFinal,
        titlu: titluFinal,
        text: textFinal,
        caleImagine: caleImagine,
        currentPage: "eroare"
    });
}


// Ruta pentru pagina principală
app.get(['/', '/index', '/home'], (req, res) => {
  res.render('pages/index', {
    pageTitle: 'Armonia - Magazin de Instrumente Muzicale',
    currentPage: 'home'
  });
});

// Rute pentru alte pagini menționate în navigare
app.get('/magazin', (req, res) => {
  res.render('pages/magazin', {
    pageTitle: 'Magazin Online - Armonia',
    currentPage: 'magazin'
  });
});

app.get('/eveniment', (req, res) => {
  res.render('pages/eveniment', {
    pageTitle: 'Evenimente - Armonia',
    currentPage: 'eveniment'
  });
});

app.get('/blog', (req, res) => {
  res.render('pages/blog', {
    pageTitle: 'Blog Muzical - Armonia',
    currentPage: 'blog'
  });
});



app.get("/*", (req, res) => {
    // Remove the initial "/" to get the page name
    const pagina = req.path.substring(1);
    res.render(`pages/${pagina}`, {
        pageTitle: `${pagina.charAt(0).toUpperCase() + pagina.slice(1)} - Armonia`,
        currentPage: pagina
    }, (err, rezultatRandare) => {
        if (err) {
            if (err.message.startsWith("Failed to lookup view")) {
                afiseazaEroare(res, 404);
            } else {
                afiseazaEroare(res);
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

app.use((req, res) => {
    afiseazaEroare(res, 404);
});


// Definirea portului pe care va asculta serverul
const port = 8080;

// Pornirea serverului
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
  console.log(`Calea folderului: ${__dirname}`);
  console.log(`Calea fișierului: ${__filename}`);
  console.log(`Folderul curent de lucru: ${process.cwd()}`);
});