const express = require('express');
const session = require('express-session');
const apiRoutes = require('./api');
require('dotenv').config();
const { connectToDatabase } = require('./database');


const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(express.json());
connectToDatabase();

// Routes
app.get('/', (req, res) => {
  // big hello world
  res.send('<h1>Hello leila!</h1> <p>Le serveur fonctionne correctement</p>');
});

app.use('/api', apiRoutes);


function log(string) {
  console.log("[APP]" + string);
}


// Écoutez le port
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});

