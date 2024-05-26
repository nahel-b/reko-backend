const express = require('express');
const session = require('express-session');
const axios = require('axios');

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
const REDIRECT_SPOTIFY_URI = process.env.BACKEND_URL +  '/spotifycallback';
//https://reko-backend.onrender.com/spotifycallback
// https://reko-backend-production.up.railway.app


app.get('/spotifycallback', async (req, res) => {
  console.log("red_URI", REDIRECT_SPOTIFY_URI);
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code is missing');
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_SPOTIFY_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token } = response.data;
    // Redirect back to the mobile app with the token
    res.redirect(`null?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    res.status(500).send('Internal Server Error');
  }
});


const DEEZER_CLIENT_ID = process.env.DEEZER_CLIENT_ID;
const DEEZER_CLIENT_SECRET = process.env.DEEZER_CLIENT_SECRET;


app.get('/deezercallback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code is missing');
  }

  try {
    console.log("url",`https://connect.deezer.com/oauth/access_token.php?app_id=${DEEZER_CLIENT_ID}&secret=${DEEZER_CLIENT_SECRET}&code=${code}`);

    const response = await axios.get('https://connect.deezer.com/oauth/access_token.php', {
      params: {
        app_id: DEEZER_CLIENT_ID,
        secret: DEEZER_CLIENT_SECRET,
        code: code,
        output: 'json'
      }
    });
    //print url

    if (response.status === 200 && response.data.access_token) {
      const access_token = response.data.access_token;
      res.redirect(`null?access_token=${access_token}`);
    } else {
      console.error('Error getting Deezer token:', response.status, response.data);
      res.status(500).send('Internal Server Error');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      res.status(error.response.status).send(error.response.data);
    } else {
      console.error('Error getting Deezer token:', error.message);
      res.status(500).send('Internal Server Error');
    }
  }
});

// app.get('/deezercallback', async (req, res) => {
//   const code = req.query.code;
//   if (!code) {
//     return res.status(400).send('Code is missing');
//   }

//   try {
//     // request.post({
//     //   url: 'https://connect.deezer.com/oauth/access_token.php',
//     //   form: {
//     //     app_id: DEEZER_CLIENT_ID,
//     //     secret: DEEZER_CLIENT_SECRET,
//     //     code,
//     //     output: 'json',
//     //   },
//     // }, (error, response, body) => {
//     //   if (error) {
//     //     console.error('Error getting Deezer token:', error);
//     //     return res.status(500).send('Internal Server Error');
//     //   }
      
//     //   // console.log("body",response);
//     //   // const { access_token } = JSON.parse(body);
//     //   // Redirect back to the mobile app with the token
//     //   res.redirect(`null?access_token=${access_token}`);
//     // });
//     request.get({
//       url: `https://connect.deezer.com/oauth/access_token.php?app_id=${DEEZER_CLIENT_ID}&secret=${DEEZER_CLIENT_SECRET}&code=${code}`
//     }, (error, response, body) => {
//       if (!error && response.statusCode === 200) {
//         console.log("body", body);
//         const access_token = body.slice(13).split('&')[0];
//         res.redirect(`null?access_token=${access_token}`);
//       }
//       else {
//         console.error('Error getting Deezer token:', error);
//         console.error('Error getting Deezer token:', response);
//         return res.status(500).send('Internal Server Error');
//       }
//       });


//   } catch (error) {
//     console.error('Error getting Deezer token:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });


app.use('/api', apiRoutes);


function log(string) {
  console.log("[APP]" + string);
}


// Écoutez le port
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});

