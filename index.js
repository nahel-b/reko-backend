const express = require('express');
const session = require('express-session');
const request = require('request');

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
const REDIRECT_SPOTIFY_URI = 'https://reko-backend.onrender.com/spotifycallback';
const MOBILE_APP_REDIRECT_URI = 'exp://172.20.10.7:8081/--/callback';


app.get('/spotifycallback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code is missing');
  }

  try {
    request.post({
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_SPOTIFY_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      },
    }, (error, response, body) => {
      if (error) {
        console.error('Error getting Spotify token:', error);
        return res.status(500).send('Internal Server Error');
      }
      const { access_token, refresh_token } = JSON.parse(body);
      // Redirect back to the mobile app with the token
      res.redirect(`null?access_token=${access_token}&refresh_token=${refresh_token}`);
    });
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    res.status(500).send('Internal Server Error');
  }
});


const DEEZER_CLIENT_ID = process.env.DEEZER_CLIENT_ID;
const DEEZER_CLIENT_SECRET = process.env.DEEZER_CLIENT_SECRET;
const REDIRECT_DEEZER_URI = 'https://reko-backend.onrender.com/deezercallback';

app.get('/deezercallback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code is missing');
  }

  try {
    // request.post({
    //   url: 'https://connect.deezer.com/oauth/access_token.php',
    //   form: {
    //     app_id: DEEZER_CLIENT_ID,
    //     secret: DEEZER_CLIENT_SECRET,
    //     code,
    //     output: 'json',
    //   },
    // }, (error, response, body) => {
    //   if (error) {
    //     console.error('Error getting Deezer token:', error);
    //     return res.status(500).send('Internal Server Error');
    //   }
      
    //   // console.log("body",response);
    //   // const { access_token } = JSON.parse(body);
    //   // Redirect back to the mobile app with the token
    //   res.redirect(`null?access_token=${access_token}`);
    // });
    request.get({
      url: `https://connect.deezer.com/oauth/access_token.php?app_id=${DEEZER_CLIENT_ID}&secret=${DEEZER_CLIENT_SECRET}&code=${code}`
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log("body", body);
        const access_token = body.slice(13).split('&')[0];
        res.redirect(`null?access_token=${access_token}`);
      }
      });


  } catch (error) {
    console.error('Error getting Deezer token:', error);
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

