// scripts/init-images.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorul sursă pentru imagini (în acest exemplu, folosim imagini din galerie)
const sourceDir = path.join(__dirname, '..', 'public', 'resources', 'galerie');
// Directorul destinație pentru imaginile instrumentelor
const destDir = path.join(__dirname, '..', 'public', 'resources', 'instrumente');

// Asigură-te că directorul destinație există
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`Directorul ${destDir} a fost creat`);
}

// Asocierea între numele imaginilor sursă și numele de ieșire pentru instrumente
const imageMapping = [
    { source: 'chitara-acustica.jpg', dest: 'chitara-acustica.jpg' },
    { source: 'pian.jpg', dest: 'pian-digital.jpg' },
    { source: 'vioara.jpg', dest: 'vioara.jpg' },
    { source: 'saxofon.png', dest: 'saxofon.jpg' },
    { source: 'banjo.png', dest: 'chitara-electrica.jpg' },
    { source: 'tobe.png', dest: 'tobe.jpg' },
    { source: 'ukulele.png', dest: 'sintetizator.jpg' },
    { source: 'flaut.png', dest: 'muzicuta.jpg' },
    { source: 'trompeta.png', dest: 'cinele.jpg' },
    { source: 'xilofon.png', dest: 'pian-digital2.jpg' },
    { source: 'harpa.png', dest: 'acordeon.jpg' },
    { source: 'orga.png', dest: 'djembe.jpg' }
];

// Funcție asincronă pentru procesarea imaginilor
async function processImages() {
    try {
        console.log('Începerea procesării imaginilor...');

        for (const img of imageMapping) {
            // Construiește căile complete
            const sourcePath = path.join(sourceDir, img.source);
            const destPath = path.join(destDir, img.dest);

            // Verifică dacă imaginea sursă există
            if (!fs.existsSync(sourcePath)) {
                console.log(`Imaginea sursă nu există: ${sourcePath}`);
                continue;
            }

            try {
                // Procesează și salvează imaginea
                await sharp(sourcePath)
                    .resize(800) // Redimensionează la lățimea de 800px, păstrând aspect ratio
                    .jpeg({ quality: 85 }) // Convertește în JPEG cu calitate bună
                    .toFile(destPath);

                console.log(`Imagine procesată cu succes: ${img.dest}`);
            } catch (error) {
                console.error(`Eroare la procesarea imaginii ${img.source}:`, error);
            }
        }

        console.log('Procesarea imaginilor s-a încheiat cu succes!');
    } catch (error) {
        console.error('Eroare generală la procesarea imaginilor:', error);
    }
}

// Rulează procesarea imaginilor
processImages();