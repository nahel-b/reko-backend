const express = require("express");
const router = express.Router();
const database = require("./database.js");
const spotify_serveur = require("./musique/spotify_serveur.js");
const spotify_client = require("./musique/spotify_client.js");
const deezer_client = require("./musique/deezer_client.js");

const { login, signup,authMiddleware } = require("./authController.js");
const { createPost} = require("./post.js");
const { platform } = require("os");

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

  console.log("/recherche");

  const song_name = req.query.song_name;
  const offset = req.query.offset;
  const limit = req.query.limit !== undefined ? req.query.limit : 3;


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
    return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Spotify"});
  }
});

router.get("/recherche_precis", async (req, res) => {
  // Récupérer les paramètres de la requête

  console.log("/recherche_precis");

  const song_name = req.query.song_name;
  const offset = req.query.offset;
  const limit = req.query.limit !== undefined ? req.query.limit : 3;


  if (!song_name || !offset) {
    res.json(-1);
  } else {
    const donnee = await spotify_serveur.envoie_recherche_musique_precis(
      song_name,
      offset,
      limit,
    );
    if(donnee == -1){
      return res.json([]);
    }
    return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Spotify"});
  }
});

router.get("/user_playlist", async (req, res) => {

  console.log("/user_playlist");

  const plateform = req.query.plateform;
  const token = req.query.token;
  const refresh_token = req.query.refresh_token;

  // console.log("plateform", plateform,"token", token,"refresh", refresh_token);


  if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
    res.json(-1);
  } else if(plateform == "Spotify"){
    const donnee = await spotify_client.getRecentSpotifyPlaylists(token,refresh_token);
    if(donnee == -1){
      return res.json({reponse : []});
    }
    const transformedPlaylists = donnee.reponse.map((playlist) => {
      return  {

          id: playlist.id,
          name: playlist.name,
          image: playlist.images ? (playlist.images[0] ? playlist.images[0].url : null) : null,
          nb_tracks: playlist.tracks.total,
          platform: "Spotify"
      };
    });
    return res.json({reponse : transformedPlaylists, token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});

  }
  else if(plateform == "Deezer"){
    const donnee = await deezer_client.getRecentDeezerPlaylists( token);
    if(donnee == -1|| donnee == undefined|| donnee == null){
      return res.json({reponse : []});
    }
    const transformedPlaylists = donnee.map((playlist) => {
      return  {

          id: playlist.id,
          name: playlist.title,
          image: playlist.picture_medium ? playlist.picture_medium : null,
          nb_tracks: playlist.nb_tracks,
          platform: "Deezer"
      };
  });
  // console.log("transformedPlaylists",transformedPlaylists);
    return res.json({reponse : transformedPlaylists, token: null, refresh_token: null,platform: "Deezer"});
  }

});


router.get("/get_playlist_tracks_id", async (req, res) => {

  console.log("/get_playlist_tracks_id");


  const plateform = req.query.plateform;
  const playlistId = req.query.playlistId;
  const token = req.query.token;
  const refresh_token = req.query.refresh_token;

  if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
    res.json(-1);
  } else if(plateform == "Spotify"){

    const donnee = await spotify_client.getSpotifyPlaylistTracksId(playlistId,token,refresh_token);
    if(donnee == -1 || donnee == undefined|| donnee == null){
      return res.json({reponse : []});
    }
    if(donnee.reponse && donnee.reponse.length > 0){
      //melanger les tracks
      donnee.reponse.sort(() => Math.random() - 0.5);
    }

    return res.json({reponse : donnee.reponse.slice(0, 5), token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});

  }
  else if(plateform == "Deezer"){

    const donnee = await deezer_client.getDeezerPlaylistTracksId(playlistId,token);
    if(donnee == -1 || donnee == undefined|| donnee == null){
      return res.json({reponse : []});
    }
    if(donnee && donnee.length > 0){
      //melanger les tracks
      donnee.sort(() => Math.random() - 0.5);
    }


    const ids_spotify =  await spotify_serveur.liste_d_to_s(donnee.slice(0, 20));
    if(ids_spotify == -1 || ids_spotify == undefined|| ids_spotify == null|| ids_spotify.length == 0){
      return res.json({reponse : []});
    }
    return res.json({reponse : ids_spotify.slice(0, 5), token: null, refresh_token: null,platform: "Deezer"});

  }


});


router.get("/creer_playlist", async (req, res) => {

  console.log("/creer_playlist");

  const plateform = req.query.plateform;
  const playlistName = req.query.playlistName;
  const token = req.query.token;
  const refresh_token = req.query.refresh_token;

  if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
    res.json(-1);
  } else if(plateform == "Spotify"){

    const donnee = await spotify_client.createSpotifyPlaylist(playlistName,token,refresh_token);
    if(donnee == -1 || donnee == undefined|| donnee == null){
      return res.json({reponse : -1});
    }
    
    return res.json({reponse : donnee.reponse, token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});

  }
  else if(plateform == "Deezer"){

    const donnee = await deezer_client.createDeezerPlaylist(playlistName,token);
    if(donnee == -1 || donnee == undefined|| donnee == null){
      return res.json({reponse : []});
    }
    
    return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Deezer"});

  }


});

router.get("/recommandation", async (req, res) => {

  console.log("/recommandation");


  var liste_son_seed_reco = req.query.liste_son_seed_reco.split(",");
  const offset = req.query.offset;
  const limit = req.query.limit !== undefined ? req.query.limit : 50;

  if(!liste_son_seed_reco || !offset  ){
    return res.json(-1);
  }

  const donnee = await spotify_serveur.recommandation(
    liste_son_seed_reco,
    offset,
    limit
  );
  if(donnee == -1){
    return res.json({reponse : []});
  }
  return res.json({reponse : donnee, token: null, refresh_token: null,platform: null});

});

router.get("/ajouter_tracks_playlist", async (req, res) => {

    console.log("/ajouter_tracks_playlist");
  
    const plateform = req.query.plateform;
    const tracks_id = req.query.tracks_id.split(",");
    const playlist_id = req.query.playlist_id;
    const token = req.query.token;
    const refresh_token = req.query.refresh_token;
  
    if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
      res.json(-1);
    } else if(plateform == "Spotify"){
  
      const donnee = await spotify_client.addTracksToSpotifyPlaylist(tracks_id,playlist_id,token,refresh_token);
      if(donnee == -1){
        return res.json(-1);
      }
      return res.json({reponse : donnee, token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});
  
    }
    else if(plateform == "Deezer"){

      let ids_spotify =  await spotify_serveur.liste_s_to_d(tracks_id);
      //supprimer les element null
      ids_spotify = ids_spotify.filter(function (el) {
        return el != null;
      });
  
      const donnee = await deezer_client.addTracksToDeezerPlaylist(playlist_id,ids_spotify,token);
      if(donnee == -1){
        return res.json(-1);
      }
      return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Deezer"});
  
    }
  
  });


  router.get("/delete_track_playlist", async (req, res) => {
      
      console.log("/delete_track_playlist");
    
      const plateform = req.query.plateform;
      const track_id = req.query.track_id;
      const playlist_id = req.query.playlist_id;
      const token = req.query.token;
      const refresh_token = req.query.refresh_token;
    
      if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
        res.json(-1);
      } else if(plateform == "Spotify"){
    
        const donnee = await spotify_client.deleteSpotifyTrackPlaylist(playlist_id,track_id,token,refresh_token);
        if(donnee == -1){
          return res.json(-1);
        }
        return res.json({reponse : donnee.reponse, token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});
    
      }
      else if(plateform == "Deezer"){

        const id_deezer =  await spotify_serveur.s_to_d(track_id);
        if(id_deezer == null){
          return res.json(-1);
        }
    
        const donnee = await deezer_client.deleteDeezerTrackPlaylist(id_deezer,playlist_id,token);
        if(donnee == -1){
          return res.json(-1);
        }
        return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Deezer"});
    
      }
    
    });


  router.get("/like_track", async (req, res) => {
        
        console.log("/like_track");
      
        const plateform = req.query.plateform;
        const track_id = req.query.track_id;
        const token = req.query.token;
        const refresh_token = req.query.refresh_token;
      
        if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
          res.json(-1);
        } else if(plateform == "Spotify"){
      
          const donnee = await spotify_client.likeSpotifyTrack(track_id,token,refresh_token);
          if(donnee == -1){
            return res.json(-1);
          }
          return res.json({reponse : donnee.reponse, token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});
      
        }
        else if(plateform == "Deezer"){
  
          const id_deezer =  await spotify_serveur.s_to_d(track_id);
          if(id_deezer == null){
            return res.json(-1);
          }
      
          const donnee = await deezer_client.likeDeezerTrack(id_deezer,token);
          if(donnee == -1){
            return res.json(-1);
          }
          return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Deezer"});
      
        }
      
      });

router.get("/dislike_track", async (req, res) => {
              
              console.log("/dislike_track");
            
              const plateform = req.query.plateform;
              const track_id = req.query.track_id;
              const token = req.query.token;
              const refresh_token = req.query.refresh_token;
            
              if ( !plateform || !token || (plateform == "Spotify" && !refresh_token) ) {
                res.json(-1);
              } else if(plateform == "Spotify"){
            
                const donnee = await spotify_client.dislikeSpotifyTrack(track_id,token,refresh_token);
                if(donnee == -1){
                  return res.json(-1);
                }
                return res.json({reponse : donnee.reponse, token: donnee.token, refresh_token: donnee.refresh_token,platform: "Spotify"});
            
              }
              else if(plateform == "Deezer"){
      
                const id_deezer =  await spotify_serveur.s_to_d(track_id);
                if(id_deezer == null){
                  return res.json(-1);
                }
            
                const donnee = await deezer_client.dislikeDeezerTrack(id_deezer,token);
                if(donnee == -1){
                  return res.json(-1);
                }
                return res.json({reponse : donnee, token: null, refresh_token: null,platform: "Deezer"});
            
              }
            
            });

const { getDB } = require('./database');



router.post("/posts", authMiddleware, async (req, res) => {
  try {
      const db = getDB();
      const postsCollection = db.collection('posts');

      // Générer un nouvel ID pour le post
      const lastPost = await postsCollection.find().sort({ id: -1 }).limit(1).toArray();
      const newId = lastPost.length > 0 ? lastPost[0].id + 1 : 1;

      // Générer la date actuelle
      const currentDate = new Date();

      const newPost = {
          id: newId,
          album: req.body.track_album,
          artiste: req.body.track_artist,
          user: req.user.username, // Utilisez le username de l'utilisateur connecté
          duration: req.body.track_duration,
          id_spotify: req.body.track_id,
          image_urls: req.body.track_image,
          popularity: req.body.track_popularity,
          preview_url: req.body.track_preview_url,
          titre: req.body.track_title,
          date: currentDate
      };

      await postsCollection.insertOne(newPost);
      res.status(201).json({reponse : { message: "Post created", post: newPost }});
  } catch (error) {
      console.error("Error while creating post:", error);
      res.status(500).json({ message: "Error while creating post" });
  }
});

// Route pour obtenir tous les posts de musique
router.get("/posts", async (req, res) => {
  try {
      const db = getDB();
      const postsCollection = db.collection('posts');
      const posts = await postsCollection.find().sort({ date: -1 }).toArray();
      res.status(200).json({reponse : posts, username : req.user.username});
  } catch (error) {
      console.error("Error while fetching posts:", error);
      res.status(500).json({ message: "Error while fetching posts" });
  }
});

// Route pour obtenir un post de musique spécifique par ID
router.get("/posts/:id", async (req, res) => {
  try {
      const db = getDB();
      const postsCollection = db.collection('posts');
      const post = await postsCollection.findOne({ id: parseInt(req.params.id) });

      if (!post) {
          return res.status(404).json({ message: "Post not found" });
      }

      res.status(200).json(post);
  } catch (error) {
      console.error("Error while fetching post:", error);
      res.status(500).json({ message: "Error while fetching post" });
  }
});

// Route pour supprimer un post de musique par ID
router.delete("/posts/:id", authMiddleware, async (req, res) => {
  try {
      
      const db = getDB();
      const postsCollection = db.collection('posts');

      //verifier que l'user du post est le meme que celui connecté

      const post = await postsCollection.findOne({ id: parseInt(req.params.id) });
      if (post.user !== req.user.username) {
          return res.status(403).json({ message: "You are not allowed to delete this post" });
      }
      

      const result = await postsCollection.deleteOne({ id: parseInt(req.params.id) });

      if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Post not found" });
      }

      res.status(200).json({ message: "Post deleted" });
  } catch (error) {
      console.error("Error while deleting post:", error);
      res.status(500).json({ message: "Error while deleting post" });
  }
});


module.exports = router;