// Importarea modulelor necesare
const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sass = require('sass'); // Adăugat modulul sass
const ejs = require('ejs'); // Adăugat modulul ejs

const Client = require('pg').Client




var client = new Client({
    database: "tehniciweb",
    user: "postgres",
    password: "password",
    host: "localhost",
    port: 5432
});
client.connect();


// client.query("SELECT * FROM instrumente", (err, res) => {
//     console.log(err, res);
// })


// Crearea unei instanțe a aplicației Express
const app = express();

// Obiect global pentru stocarea datelor comune
let obGlobal = {
    obErori: null,
    folderScss: path.join(__dirname, "scss"),
    folderCss: path.join(__dirname, "public/css"),
    folderCssDinamica: path.join(__dirname, "public/css/dinamica"), // Folder for dynamically generated CSS
    fisierScssGalerie: path.join(__dirname, "scss", "galerie-animata.scss"), // Specific SCSS for animated gallery
    fisierCssGalerieDinamica: path.join(__dirname, "public/css/dinamica", "galerie-animata.css") // Specific CSS output for animated gallery
};

// Verificare și creare foldere necesare
const vect_foldere = ["temp", "public/resources/galerie", "backup", "public/resources/textures", obGlobal.folderCssDinamica]; // Add dynamic CSS folder here

// Iterăm prin vector și verificăm/creăm fiecare folder
for (let folder of vect_foldere) {
    // Construim calea completă folosind path.join() - check if already absolute
    const folderPath = path.isAbsolute(folder) ? folder : path.join(__dirname, folder);

    // Verificăm dacă folderul există
    if (!fs.existsSync(folderPath)) {
        // Dacă nu există, îl creăm
        console.log(`Folderul ${path.basename(folderPath)} nu există. Se creează...`);
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folderul ${path.basename(folderPath)} a fost creat cu succes!`);
    } else {
        console.log(`Folderul ${path.basename(folderPath)} există deja.`);
    }
}

console.log('Procesul de verificare/creare a folderelor s-a finalizat.');

// Create the views/partials directory if it doesn't exist
const partialsDir = path.join(__dirname, "views", "partials");
if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
    console.log(`Created partials directory at ${partialsDir}`);
}


/**
 * Funcția pentru compilarea unui fișier SCSS în CSS
 * @param {string} caleScss - Calea către fișierul SCSS (poate fi absolută sau relativă la folderScss)
 * @param {string} caleCss - Calea către fișierul CSS rezultat (poate fi absolută sau relativă la folderCss)
 */
function compileazaScss(caleScss, caleCss) {
    // Verifică dacă calea către scss este absolută sau relativă
    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(obGlobal.folderScss, caleScss);
    }

    // Skip the dynamic gallery file in the general compilation
    if (caleScss === obGlobal.fisierScssGalerie) {
        console.log(`Skipping dynamic file in general compilation: ${path.basename(caleScss)}`);
        return;
    }

    // Verificăm dacă fișierul scss există
    if (!fs.existsSync(caleScss)) {
        console.error(`Fișierul scss nu există: ${caleScss}`);
        return;
    }

    // Dacă nu avem cale css specificată, o generăm din caleScss
    if (!caleCss) {
        // Extragem numele fișierului scss
        const numeFisierScss = path.basename(caleScss);
        // Înlocuim extensia .scss cu .css
        const numeFisierCss = numeFisierScss.replace(/\.scss$/, '.css');
        // Construim calea completă pentru fișierul css
        caleCss = path.join(obGlobal.folderCss, numeFisierCss);
    } else if (!path.isAbsolute(caleCss)) {
        // Dacă avem cale css relativă, o facem absolută
        caleCss = path.join(obGlobal.folderCss, caleCss);
    }

    // Creăm folderul pentru css dacă nu există
    const dirCaleCss = path.dirname(caleCss);
    if (!fs.existsSync(dirCaleCss)) {
        try {
            fs.mkdirSync(dirCaleCss, { recursive: true });
            console.log(`Folderul CSS a fost creat: ${dirCaleCss}`);
        } catch (err) {
            console.error(`Eroare la crearea folderului pentru css: ${dirCaleCss}`, err);
            return; // Oprim execuția dacă nu putem crea folderul
        }
    }

    // Verificăm dacă fișierul css există deja pentru a face backup
    if (fs.existsSync(caleCss)) {
        // Creăm calea pentru backup
        const numeFisierCss = path.basename(caleCss);
        // Make backup path more robust
        const backupDir = path.join(__dirname, "backup", "resurse", "css");
        const caleCssBackup = path.join(backupDir, numeFisierCss);

        // Creăm folderele necesare pentru backup
        if (!fs.existsSync(backupDir)) {
            try {
                fs.mkdirSync(backupDir, { recursive: true });
                console.log(`Folderul pentru backup CSS a fost creat: ${backupDir}`);
            } catch (err) {
                console.error(`Eroare la crearea folderului pentru backup: ${backupDir}`, err);
            }
        }

        // Copiem fișierul css în folderul de backup
        try {
            fs.copyFileSync(caleCss, caleCssBackup);
            console.log(`Backup creat pentru ${numeFisierCss} la ${caleCssBackup}`);
        } catch (err) {
            console.error(`Eroare la copierea fișierului css pentru backup: ${caleCss}`, err);
        }
    }

    // Compilăm scss în css
    try {
        // Folosim sass pentru compilare
        const rezCompilare = sass.renderSync({
            file: caleScss,
            outputStyle: 'compressed'
        });

        // Scriem rezultatul în fișierul css
        fs.writeFileSync(caleCss, rezCompilare.css);
        console.log(`Compilare reușită a fișierului ${path.basename(caleScss)} în ${path.basename(caleCss)}`);
    } catch (err) {
        console.error(`Eroare la compilarea fișierului: ${caleScss}`, err);
    }
}


/**
 * Funcție pentru compilarea tuturor fișierelor scss (statice)
 */
function compileazaToateScssurile() {
    // Verificăm dacă folderul scss există
    if (fs.existsSync(obGlobal.folderScss)) {
        // Citim conținutul folderului scss
        let fisiere = fs.readdirSync(obGlobal.folderScss);

        // Filtrăm doar fișierele cu extensia .scss
        let fisiereSCSS = fisiere.filter(f => path.extname(f).toLowerCase() === '.scss');

        let compiledCount = 0;
        // Compilăm fiecare fișier scss (funcția compileazaScss va sări peste cel dinamic)
        fisiereSCSS.forEach(fisier => {
            // Check if it's the dynamic file before compiling
             if (path.join(obGlobal.folderScss, fisier) !== obGlobal.fisierScssGalerie) {
                compileazaScss(fisier);
                compiledCount++;
            }
        });

        console.log(`S-au compilat ${compiledCount} fișiere scss statice.`);
    } else {
        console.error(`Folderul scss nu există: ${obGlobal.folderScss}`);
        // Creăm folderul scss dacă nu există
        try {
            fs.mkdirSync(obGlobal.folderScss, { recursive: true });
            console.log(`Folderul scss a fost creat: ${obGlobal.folderScss}`);
        } catch (err) {
            console.error(`Eroare la crearea folderului scss: ${obGlobal.folderScss}`, err);
        }
    }
}

/**
 * Funcție pentru urmărirea modificărilor în folderul scss (pentru fișiere statice)
 */
function urmaresteFolderScss() {
    // Verificăm dacă folderul scss există
    if (fs.existsSync(obGlobal.folderScss)) {
        console.log(`Urmărirea modificărilor în folderul: ${obGlobal.folderScss}`);

        // Folosim fs.watch pentru a monitoriza modificările
        fs.watch(obGlobal.folderScss, (eveniment, numeFisier) => {
            // Verificăm dacă este un fișier scss și NU este cel dinamic
            const fullPath = path.join(obGlobal.folderScss, numeFisier);
            if (numeFisier && path.extname(numeFisier).toLowerCase() === '.scss' && fullPath !== obGlobal.fisierScssGalerie) {
                console.log(`Modificare detectată la fișierul static: ${numeFisier}`);
                // Recompilăm fișierul modificat (static)
                compileazaScss(numeFisier);
            } else if (numeFisier && fullPath === obGlobal.fisierScssGalerie) {
                 console.log(`Modificare detectată la fișierul dinamic ${numeFisier}, dar recompilarea se face la request.`);
            }
        });
    } else {
        console.error(`Folderul scss nu există: ${obGlobal.folderScss}`);
    }
}

// Apelăm compilarea inițială și pornirea monitorizării modificărilor
compileazaToateScssurile();
urmaresteFolderScss();


/**
 * Compilează SCSS-ul specific pentru galeria animată, injectând variabile.
 * @param {number} numarImagini - Numărul de imagini din galerie.
 * @param {number} slideDurationSeconds - Durata afișării unei imagini (în secunde).
 * @returns {string|null} Calea relativă către fișierul CSS generat sau null în caz de eroare.
 */
function compileazaGalerieDinamicaScss(numarImagini, slideDurationSeconds) {
    try {
        console.log(`Compiling dynamic gallery CSS for ${numarImagini} images.`);
        if (!fs.existsSync(obGlobal.fisierScssGalerie)) {
            console.error(`ERROR: Gallery SCSS file not found: ${obGlobal.fisierScssGalerie}`);
            return null;
        }

        // Define SASS variables to prepend
        const sassVariables = `
            $numar-imagini: ${numarImagini};
            $slide-duration: ${slideDurationSeconds}s;
        `;

        // Read the base SCSS content
        const sassContent = fs.readFileSync(obGlobal.fisierScssGalerie, 'utf8');

        // Combine variables and base content
        const finalSass = sassVariables + sassContent;

        // Compile the combined SASS data
        const rezCompilare = sass.renderSync({
            data: finalSass,
            outputStyle: 'compressed',
            includePaths: [obGlobal.folderScss] // Allow imports from the main scss folder if needed
        });

        // Write the result to the dynamic CSS file
        fs.writeFileSync(obGlobal.fisierCssGalerieDinamica, rezCompilare.css);
        console.log(`Dynamic gallery CSS compiled successfully to: ${obGlobal.fisierCssGalerieDinamica}`);

        // Return the relative path for use in HTML
        const publicDir = path.join(__dirname, 'public');
        const relativePath = path.relative(publicDir, obGlobal.fisierCssGalerieDinamica).replace(/\\/g, "/"); // Ensure forward slashes
        return "/" + relativePath; // Prepend '/' for root-relative path

    } catch (err) {
        console.error(`ERROR compiling dynamic gallery SCSS:`, err);
        return null;
    }
}


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
    // Setăm un obiect de erori minimal dacă fișierul lipsește sau e invalid
     obGlobal.obErori = {
        cale_baza: "resources/images/errors/", // Cale default
        eroare_default: {
            titlu: "Eroare server",
            text: "Ne cerem scuze, a apărut o problemă.",
            imagine: "error-default.png",
            identificator: 500
        },
        info_erori: []
    };
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

// Function to prepare *static* gallery data (seasonal)
async function prepareStaticGalleryData() { // Renamed for clarity
    try {
        // Read gallery data
        const galerieDataPath = path.join(__dirname, 'galerie.json');
         if (!fs.existsSync(galerieDataPath)) {
             console.warn("galerie.json not found for static gallery.");
             return { cale_galerie: '', imagini: [] };
         }
        const galerieData = JSON.parse(fs.readFileSync(galerieDataPath));
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

        // Process images (generate thumbnails)
        const processPromises = filteredImages.map(img => {
            const imgPath = path.join(__dirname, 'public', galerieData.cale_galerie, img.cale_fisier);
            if (fs.existsSync(imgPath)) {
                // Pass the base directory where thumbnails should be saved
                return generateResizedImages(imgPath, galerieDir);
            }
            return Promise.resolve(); // Resolve immediately if image doesn't exist
        });

        await Promise.all(processPromises);

        return {
            cale_galerie: galerieData.cale_galerie,
            imagini: filteredImages
            // Removed animation params as they belong to the animated gallery logic now
        };
    } catch (err) {
        console.error('Error preparing static gallery data:', err);
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
         let eroareGasita = null;
        if (identificator) {
            // Căutăm eroarea cu identificatorul dat (care este un cod de status numeric)
            eroareGasita = obGlobal.obErori.info_erori.find(err => err.identificator === identificator);
        }
        eroare = eroareGasita || obGlobal.obErori.eroare_default;

    } else {
        // Fallback minimal dacă obGlobal.obErori nu a fost setat (improbabil după corecția de mai sus)
        eroare = {
            titlu: "Eroare",
            text: "A apărut o eroare!",
            imagine: "error-default.png",
            identificator: 500,
            status: 500 // Adaugam status explicit
        };
    }

    // Folosim identificatorul numeric și ca status HTTP
    const statusFinal = identificator || eroare.identificator || 500;
    res.status(statusFinal);


    // Pentru fiecare proprietate, dacă argumentul este dat, are prioritate
    const titluFinal = titluArg !== undefined ? titluArg : eroare.titlu;
    const textFinal = textArg !== undefined ? textArg : eroare.text;
    // Imaginea e relativă la calea de bază
    const imagineFinal = imagineArg !== undefined ? imagineArg : eroare.imagine;

    // Construim calea către imagine - important pentru afișarea corectă
    const caleImagine = "/" + path.join(obGlobal.obErori.cale_baza || "resources/images/errors/", imagineFinal).replace(/\\/g, "/");

    console.log(`Eroare ${statusFinal}: Titlu='${titluFinal}', Imagine='${caleImagine}'`); // Log pentru debugging

    // Randăm pagina de eroare cu datele finale
    res.render("pages/eroare", {
        pageTitle: titluFinal,
        titlu: titluFinal,
        text: textFinal,
        caleImagine: caleImagine,
        currentPage: "eroare" // Poate fi util pentru stilizare
    });
}

// Blocare acces direct la fișierele .ejs
app.get("/*.ejs", function (req, res) {
    afiseazaEroare(res, 403, "Acces Interzis", "Nu aveți permisiunea să accesați direct fișierele șablon.");
});

// Ruta pentru pagina principală
app.get(['/', '/index', '/home'], async (req, res) => {
    try {
        // --- Prepare Static (Seasonal) Gallery Data ---
        const staticGalleryData = await prepareStaticGalleryData();

        // --- Animated Gallery Logic ---
        let imaginiAnimate = [];
        let galerieDinamicaCssPath = null;
        const galerieJsonPath = path.join(__dirname, 'galerie.json');
        const defaultSlideDuration = 4; // seconds per slide

        if (fs.existsSync(galerieJsonPath)) {
            const galerieData = JSON.parse(fs.readFileSync(galerieJsonPath));

            // 1. Filter for even indices
            const imaginiEven = galerieData.imagini.filter((img, index) => index % 2 === 0);

            // 2. Generate random number of images (power of 2, 2 <= N <= 16)
            const puteriPosibile = [2, 4, 8, 16];
            const nrImaginiAles = puteriPosibile[Math.floor(Math.random() * puteriPosibile.length)];

            // 3. Select the first N images from the even-indexed list
            const nrImaginiFinal = Math.min(nrImaginiAles, imaginiEven.length);
             if(nrImaginiFinal < 2 && imaginiEven.length >= 2){
                 // Ensure at least 2 images if possible, even if random choice was smaller
                 imaginiAnimate = imaginiEven.slice(0, 2);
             } else if (nrImaginiFinal >= 2) {
                 imaginiAnimate = imaginiEven.slice(0, nrImaginiFinal);
             } else {
                 imaginiAnimate = []; // Not enough even images
             }


            console.log(`Selected ${imaginiAnimate.length} images for animated gallery.`);

            // 4. Compile dynamic CSS if we have enough images
            if (imaginiAnimate.length > 0) {
                galerieDinamicaCssPath = compileazaGalerieDinamicaScss(imaginiAnimate.length, defaultSlideDuration);
            }

             // Add base path to selected images for easier use in EJS
             imaginiAnimate = imaginiAnimate.map(img => ({
                ...img,
                // Construct full relative path for src attribute
                cale_completa: "/" + path.join(galerieData.cale_galerie, img.cale_fisier).replace(/\\/g, "/")
            }));

        } else {
            console.warn("galerie.json not found for animated gallery.");
        }
        // --- End Animated Gallery Logic ---

        res.render('pages/index', {
            pageTitle: 'Armonia - Acasă',
            currentPage: 'home',
            ip: req.ip,
            // Static gallery data
            cale_galerie: staticGalleryData.cale_galerie,
            imagini: staticGalleryData.imagini, // Renamed from ...galleryData
            // Animated gallery data
            imaginiAnimate: imaginiAnimate,
            galerieDinamicaCssPath: galerieDinamicaCssPath,
        });
    } catch (err) {
        console.error('Error processing home page:', err);
        afiseazaEroare(res, 500, "Eroare Server", "A apărut o problemă la procesarea paginii principale.");
    }
});


// Add a route for the static gallery page
app.get('/galerie', async (req, res) => {
    try {
        // Use the function specifically for static/seasonal gallery data
        const staticGalleryData = await prepareStaticGalleryData();

        // Render gallery page using static data
        res.render('pages/galerie', {
            pageTitle: 'Galerie Sezonieră - Armonia', // Adjusted title
            currentPage: 'galerie',
            cale_galerie: staticGalleryData.cale_galerie,
            imagini: staticGalleryData.imagini
        });
    } catch (err) {
        console.error('Error processing static gallery page:', err);
        afiseazaEroare(res, 500, "Eroare Server", "Nu am putut încărca galeria.");
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



// Rută pentru pagina de produse
app.get('/produse', async (req, res) => {
    try {
        // Parametri pentru filtrare
        const filtru = {};
        const categorie_selectata = req.query.categorie || null;
        if (categorie_selectata) filtru.categorie = categorie_selectata;
        if (req.query.tip) filtru.tip = req.query.tip;
        if (req.query.pret_min) filtru.pret_min = parseFloat(req.query.pret_min);
        if (req.query.pret_max) filtru.pret_max = parseFloat(req.query.pret_max);
        if (req.query.an_fabricatie) filtru.an_fabricatie = parseInt(req.query.an_fabricatie);
        if (req.query.electric === 'true') filtru.electric = req.query.electric;

        // Parametri pentru sortare
        const sortare = req.query.sortare || 'data_adaugare_desc';
        
        // Parametri pentru paginare
        const produsePerPagina = 9;
        const paginaCurenta = parseInt(req.query.pagina) || 1;
        const offset = (paginaCurenta - 1) * produsePerPagina;
        
        // Obținem toate categoriile de instrumente din ENUM categ_instrument
        const categoriiResult = await client.query(`SELECT unnest(enum_range(NULL::categ_instrument)) AS categorie`);
        const categorii_instrumente = categoriiResult.rows.map(row => row.categorie);
        
        // Obținem toate tipurile de instrumente din ENUM tip_instrument
        const tipuriResult = await client.query(`SELECT unnest(enum_range(NULL::tip_instrument)) AS tip`);
        const tipuri_instrumente = tipuriResult.rows.map(row => row.tip);
        
        // Construiește interogarea SQL pentru numărul total de produse
        let countQuery = 'SELECT COUNT(*) FROM instrumente WHERE 1=1';
        let queryParams = [];
        let paramIndex = 1;
        
        // Adaugă condiții pentru filtrare în query-ul de numărare
        if (filtru.categorie) {
            countQuery += ` AND categorie = $${paramIndex++}`;
            queryParams.push(filtru.categorie);
        }
        
        if (filtru.tip) {
            countQuery += ` AND tip = $${paramIndex++}`;
            queryParams.push(filtru.tip);
        }
        
        if (filtru.pret_min) {
            countQuery += ` AND pret >= $${paramIndex++}`;
            queryParams.push(filtru.pret_min);
        }
        
        if (filtru.pret_max) {
            countQuery += ` AND pret <= $${paramIndex++}`;
            queryParams.push(filtru.pret_max);
        }
        
        if (filtru.an_fabricatie) {
            countQuery += ` AND an_fabricatie >= $${paramIndex++}`;
            queryParams.push(filtru.an_fabricatie);
        }
        
        if (filtru.electric === 'true') {
            countQuery += ` AND electric = $${paramIndex++}`;
            queryParams.push(true);
        }
        
        // Execută interogarea pentru numărare
        const countResult = await client.query(countQuery, queryParams);
        const totalInstrumente = parseInt(countResult.rows[0].count);
        const totalPagini = Math.ceil(totalInstrumente / produsePerPagina);
        
        // Construiește interogarea SQL principală pentru instrumente
        let mainQuery = 'SELECT * FROM instrumente WHERE 1=1';
        
        // Reutilizează aceleași condiții pentru filtrare
        // Resetăm indexul parametrilor și array-ul de parametri pentru interogarea principală
        queryParams = [];
        paramIndex = 1;
        
        if (filtru.categorie) {
            mainQuery += ` AND categorie = $${paramIndex++}`;
            queryParams.push(filtru.categorie);
        }
        
        if (filtru.tip) {
            mainQuery += ` AND tip = $${paramIndex++}`;
            queryParams.push(filtru.tip);
        }
        
        if (filtru.pret_min) {
            mainQuery += ` AND pret >= $${paramIndex++}`;
            queryParams.push(filtru.pret_min);
        }
        
        if (filtru.pret_max) {
            mainQuery += ` AND pret <= $${paramIndex++}`;
            queryParams.push(filtru.pret_max);
        }
        
        if (filtru.an_fabricatie) {
            mainQuery += ` AND an_fabricatie >= $${paramIndex++}`;
            queryParams.push(filtru.an_fabricatie);
        }
        
        if (filtru.electric === 'true') {
            mainQuery += ` AND electric = $${paramIndex++}`;
            queryParams.push(true);
        }
        
        // Adaugă sortarea
        switch(sortare) {
            case 'nume_asc':
                mainQuery += ' ORDER BY nume ASC';
                break;
            case 'nume_desc':
                mainQuery += ' ORDER BY nume DESC';
                break;
            case 'pret_asc':
                mainQuery += ' ORDER BY pret ASC';
                break;
            case 'pret_desc':
                mainQuery += ' ORDER BY pret DESC';
                break;
            case 'an_asc':
                mainQuery += ' ORDER BY an_fabricatie ASC NULLS LAST';
                break;
            case 'an_desc':
                mainQuery += ' ORDER BY an_fabricatie DESC NULLS LAST';
                break;
            case 'data_adaugare_desc':
            default:
                mainQuery += ' ORDER BY data_adaugare DESC';
                break;
        }
        
        // Adaugă paginarea
        mainQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(produsePerPagina, offset);
        
        // Execută interogarea principală
        const instrumenteResult = await client.query(mainQuery, queryParams);
        
        // Funcție helper pentru a construi URL-ul pentru paginare
        const getPaginaURL = (pagina) => {
            const urlParams = new URLSearchParams(req.query);
            urlParams.set('pagina', pagina);
            return `/produse?${urlParams.toString()}`;
        };
        
        // Randează pagina cu datele obținute
        res.render('pages/produse', {
            pageTitle: 'Produse - Armonia',
            currentPage: 'produse',
            instrumente: instrumenteResult.rows,
            totalInstrumente,
            paginaCurenta,
            totalPagini,
            produsePerPagina,
            filtru,
            sortare,
            getPaginaURL,
            categorii_instrumente,
            tipuri_instrumente,
            categorie_selectata
        });
    } catch (err) {
        console.error('Eroare la interogarea bazei de date pentru produse:', err);
        afiseazaEroare(res, 500, "Eroare Server", "A apărut o problemă la încărcarea produselor. Te rugăm să încerci din nou mai târziu.");
    }
});

// Rută pentru pagina de detalii produs
app.get('/detalii-produs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return afiseazaEroare(res, 400, "Cerere invalidă", "ID-ul produsului este invalid.");
        }
        
        // Obținem toate categoriile de instrumente din ENUM categ_instrument
        const categoriiResult = await client.query(`SELECT unnest(enum_range(NULL::categ_instrument)) AS categorie`);
        const categorii_instrumente = categoriiResult.rows.map(row => row.categorie);
        
        // Interogare pentru obținerea detaliilor instrumentului
        const result = await client.query('SELECT * FROM instrumente WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.render('pages/detalii-produs', {
                pageTitle: 'Produs Negăsit - Armonia',
                currentPage: 'produse',
                instrument: null,
                categorii_instrumente
            });
        }
        
        const instrument = result.rows[0];
        
        // Randează pagina cu datele instrumentului
        res.render('pages/detalii-produs', {
            pageTitle: `${instrument.nume} - Armonia`,
            currentPage: 'produse',
            instrument,
            categorii_instrumente,
            categorie_selectata: instrument.categorie
        });
    } catch (err) {
        console.error('Eroare la obținerea detaliilor produsului:', err);
        afiseazaEroare(res, 500, "Eroare Server", "A apărut o problemă la încărcarea detaliilor produsului. Te rugăm să încerci din nou mai târziu.");
    }
});

// API endpoint for getting product details
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID-ul produsului este invalid.' });
        }
        
        const result = await client.query('SELECT * FROM instrumente WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produsul nu a fost găsit.' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Eroare la obținerea detaliilor produsului:', err);
        res.status(500).json({ error: 'A apărut o eroare la obținerea detaliilor produsului.' });
    }
});

// API endpoint to get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await client.query('SELECT DISTINCT categorie FROM instrumente');
        const categories = result.rows.map(row => row.categorie);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get current offers
app.get('/api/offers', (req, res) => {
    try {
        const offersData = fs.readFileSync('oferte.json', 'utf8');
        res.json(JSON.parse(offersData));
    } catch (error) {
        console.error('Error reading offers file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to update offers
app.post('/api/offers', (req, res) => {
    try {
        const offersData = JSON.stringify(req.body, null, 2);
        fs.writeFileSync('oferte.json', offersData);
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing offers file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rută generică pentru alte pagini - trebuie să fie ultima
app.get("/*", (req, res) => {
    // Remove the initial "/" to get the page name
    const pagina = req.path.substring(1);
    // Basic security check - avoid directory traversal etc.
    if (pagina.includes("..") || pagina.includes("/") || pagina.startsWith(".")) {
         afiseazaEroare(res, 400, "Cerere Invalidă", "Calea solicitată nu este validă.");
         return;
    }

    res.render(`pages/${pagina}`, {
        pageTitle: `${pagina.charAt(0).toUpperCase() + pagina.slice(1)} - Armonia`,
        currentPage: pagina
    }, (err, rezultatRandare) => {
        if (err) {
            if (err.message.includes("Failed to lookup view") || err.code === 'ENOENT') {
                afiseazaEroare(res, 404, "Pagină Negăsită", `Pagina "${pagina}" nu a fost găsită.`);
            } else {
                console.error(`Eroare la randarea paginii ${pagina}:`, err);
                afiseazaEroare(res, 500); // Generic server error for other render issues
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

// Handler pentru toate rutele neasociate (care nu se potrivesc cu /* de mai sus, ex. POST la o rută GET)
app.use((req, res) => {
    afiseazaEroare(res, 404, "Resursă Negăsită", "Metoda sau resursa solicitată nu există.");
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