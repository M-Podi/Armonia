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

// Definirea portului pe care va asculta serverul
const port = 8080;

// Pornirea serverului
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
  console.log(`Calea folderului: ${__dirname}`);
  console.log(`Calea fișierului: ${__filename}`);
  console.log(`Folderul curent de lucru: ${process.cwd()}`);
});