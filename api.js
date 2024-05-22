const express = require("express");
const router = express.Router();
const database = require("./database.js");
const spotify_serveur = require("./musique/spotify_serveur.js");
// const spotify_client = require("./musique/spotify_client.js");
// const deezer_client = require("./musique/deezer_client.js");

const { login, signup,authMiddleware } = require("./authController.js");

router.get("/public", async (req, res) => {
  res.json({ message: "Hello from a public endpoint! You don't need to be authenticated to see this." });
});


router.post('/login', login);

router.post('/signup', signup);

router.get('/status', (req, res) => {
  res.json( "true" );
});

router.use(authMiddleware);

router.get("/checktoken", (req, res) => {
  res.json( "true" );
});

router.get("/recherche", async (req, res) => {
  // Récupérer les paramètres de la requête

  const song_name = req.query.song_name;
  const offset = req.query.offset;
  const limit = req.query.limit !== undefined ? req.query.limit : 3;

  console.log("song_name", song_name);

  if (!song_name || !offset) {
    res.json(-1);
  } else {
    const donnee = await spotify_serveur.envoie_recherche_musique(
      song_name,
      offset,
      limit,
    );
    if(donnee == -1){
      return res.json([]);
    }
    return res.json(donnee);
  }
});

router.get("/user_playlist", async (req, res) => {

  const plateform = req.query.plateform;
  const token = req.query.token;
  const refresh_token = req.query.refresh_token;

  console.log("plateform", plateform,"token", token,"refresh", refresh_token);

  if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
    res.json(-1);
  } else if(plateform == "Spotify"){
    // const donnee = await spotify_client.getSpotifyPlaylist(token,refresh_token);
    if(donnee == -1){
      return res.json([]);
    }
    return res.json(donnee);


  }

});


module.exports = router;