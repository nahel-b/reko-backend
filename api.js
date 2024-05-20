const express = require("express");
const router = express.Router();
const database = require("./database.js");
const spotify_serveur = require("./musique/spotify_serveur.js");

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




module.exports = router;