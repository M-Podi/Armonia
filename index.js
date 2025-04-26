// Importarea modulelor necesare
const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Crearea unei instanțe a aplicației Express
const app = express();

// Obiect global pentru stocarea datelor comune
let obGlobal = {
    obErori: null
};

// Verificare și creare foldere necesare
const vect_foldere = ["temp", "public/resources/galerie"];

// Iterăm prin vector și verificăm/creăm fiecare folder
for (let folder of vect_foldere) {
    // Construim calea completă folosind path.join()
    const folderPath = path.join(__dirname, folder);

    // Verificăm dacă folderul există
    if (!fs.existsSync(folderPath)) {
        // Dacă nu există, îl creăm
        console.log(`Folderul ${folder} nu există. Se creează...`);
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folderul ${folder} a fost creat cu succes!`);
    } else {
        console.log(`Folderul ${folder} există deja.`);
    }
}

console.log('Procesul de verificare/creare a folderelor s-a finalizat.');

// Setarea motorului de template la EJS
app.set('view engine', 'ejs');

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

// Blocare acces la anumite rute în directorul public
app.use(/^\/public(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
    afiseazaEroare(res, 403);
});

// Ruta pentru favicon
app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "resources", "favicon", "favicon.ico"));
});

// Încărcăm configurația de erori
try {
    obGlobal.obErori = JSON.parse(fs.readFileSync(path.join(__dirname, "erori.json")));

    // Procesăm căile imaginilor pentru erori, dar NU modificăm calea în obiect
    // Vom construi calea completă doar când renderăm pagina
} catch (err) {
    console.error("Eroare la încărcarea fișierului de erori:", err);
}

// Helper function to determine current season
function getCurrentSeason() {
    const date = new Date();
    const month = date.getMonth();

    if (month >= 2 && month <= 4) return "primavara";
    if (month >= 5 && month <= 7) return "vara";
    if (month >= 8 && month <= 10) return "toamna";
    return "iarna"; // months 11, 0, 1 (December, January, February)
}

// Helper function for generating resized images
async function generateResizedImages(imagePath, outputDir) {
    try {
        const filename = path.basename(imagePath);
        const fileNameWithoutExt = path.parse(filename).name;
        const fileExt = path.parse(filename).ext;

        const sizes = [
            { name: 'medium', width: 300 },
            { name: 'small', width: 200 }
        ];

        for (const size of sizes) {
            const outputPath = path.join(outputDir, `${fileNameWithoutExt}_${size.name}${fileExt}`);

            // Only generate if it doesn't exist
            if (!fs.existsSync(outputPath)) {
                await sharp(imagePath)
                    .resize(size.width)
                    .toFile(outputPath);
                console.log(`Generated: ${outputPath}`);
            }
        }
    } catch (err) {
        console.error(`Error resizing image ${imagePath}:`, err);
    }
}

// Function to prepare gallery data
async function prepareGalleryData() {
    try {
        // Read gallery data
        const galerieData = JSON.parse(fs.readFileSync(path.join(__dirname, 'galerie.json')));
        const currentSeason = getCurrentSeason();

        // Filter images by season and limit to 10
        const filteredImages = galerieData.imagini
            .filter(img => img.anotimp === currentSeason)
            .slice(0, 10);

        // Ensure the gallery directory exists
        const galerieDir = path.join(__dirname, 'public', galerieData.cale_galerie);
        if (!fs.existsSync(galerieDir)) {
            fs.mkdirSync(galerieDir, { recursive: true });
        }

        // Process images
        const processPromises = filteredImages.map(img => {
            const imgPath = path.join(__dirname, 'public', galerieData.cale_galerie, img.cale_fisier);
            if (fs.existsSync(imgPath)) {
                return generateResizedImages(imgPath, galerieDir);
            }
            return Promise.resolve();
        });

        await Promise.all(processPromises);

        return {
            cale_galerie: galerieData.cale_galerie,
            imagini: filteredImages
        };
    } catch (err) {
        console.error('Error preparing gallery data:', err);
        return {
            cale_galerie: '',
            imagini: []
        };
    }
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

    // Setăm statusul răspunsului dacă eroarea definește status și identificator
    if (eroare.status && eroare.identificator) {
        res.status(eroare.identificator);
    }

    // Construim calea către imagine - important pentru afișarea corectă
    const caleImagine = obGlobal.obErori ?
        ("/" + obGlobal.obErori.cale_baza + imagineFinal) :
        ("/resources/" + imagineFinal);

    console.log("Calea imaginii de eroare:", caleImagine); // Log pentru debugging

    // Randăm pagina de eroare cu datele finale
    res.render("pages/eroare", {
        pageTitle: titluFinal,
        titlu: titluFinal,
        text: textFinal,
        caleImagine: caleImagine,
        currentPage: "eroare"
    });
}

// Blocare acces direct la fișierele .ejs
app.get("/*.ejs", function (req, res) {
    afiseazaEroare(res, 400);
});

// Ruta pentru pagina principală
app.get(['/', '/index', '/home'], async (req, res) => {
    try {
        const galleryData = await prepareGalleryData();

        res.render('pages/index', {
            pageTitle: 'Armonia - Magazin de Instrumente Muzicale',
            currentPage: 'home',
            ip: req.ip,
            ...galleryData
        });
    } catch (err) {
        console.error('Error processing home page:', err);
        res.render('pages/index', {
            pageTitle: 'Armonia - Magazin de Instrumente Muzicale',
            currentPage: 'home',
            ip: req.ip,
            cale_galerie: '',
            imagini: []
        });
    }
});

// Add a route for the gallery page
app.get('/galerie', async (req, res) => {
    try {
        const galleryData = await prepareGalleryData();

        // Render gallery page
        res.render('pages/galerie', {
            pageTitle: 'Galerie - Armonia',
            currentPage: 'galerie',
            ...galleryData
        });
    } catch (err) {
        console.error('Error processing gallery:', err);
        afiseazaEroare(res);
    }
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

// Rută generică pentru alte pagini - trebuie să fie ultima
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

// Handler pentru toate rutele neasociate - afișează eroare 404
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