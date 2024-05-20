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



const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://reko-backend.onrender.com/spotifycallback';
const MOBILE_APP_REDIRECT_URI = 'exp://172.20.10.7:8081/--/callback';


app.get('/spotifycallback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Code is missing');
  }

  try {
    console.log("code",code);
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: queryString.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await response.json();
    console.log("data",data);
    const access_token = data.access_token;
    console.log("access_token",access_token);
    if (access_token) {
      // Redirect back to the mobile app with the token
      res.redirect(`${MOBILE_APP_REDIRECT_URI}?access_token=${access_token}`);
    } else {
      res.status(500).send('Failed to retrieve access token');
    }
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/api', apiRoutes);


function log(string) {
  console.log("[APP]" + string);
}


// Écoutez le port
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});

