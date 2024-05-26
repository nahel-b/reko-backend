const request = require('request');
const database = require('../database.js');
const { platform } = require('os');
const spotify_client_id = process.env['SPOTIFY_CLIENT_ID']
const spotify_client_secret = process.env['SPOTIFY_CLIENT_SECRET']

async function refresh_user_spotify_token(token,refresh_token){

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  return new Promise((resolve, reject) => {
  request.post(authOptions,async function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const tok = {token : response.body.access_token, refresh_token : refresh_token}
      return resolve(tok)
    }
    else 
    {
      console.log("[ERR] impossible de refresh le token spotify,",error);
      return resolve(false)
    }
  });
  })
}

async function get_user_token(username){

  var refresh_token = await database.getUserMusicToken(username);
  return refresh_token[0].access_token
  
}

async function get_user_spotify_id(username){

  let url = "https://api.spotify.com/v1/me"
  let resp = await requete(url,null,"GET",username)
  return resp.id
  
}

async function requete(url, body, method, username, qs = {}, nb_essaie = 1, token, refresh_token) {
  const options = {
    method: method,
    url: url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    qs: method === 'GET' ? qs : {}, // Utilisez 'qs' pour les requêtes GET
    body: method !== 'GET' ? body : undefined, // Utilisez 'body' pour les requêtes POST et PUT
    json: true
  };

  return new Promise((resolve, reject) => {
    request(options, async (error, response, body) => {
      if (body.
        error) {
        if (nb_essaie > 0 && body.error.status === 401) {
          console.log("refreshing token");
          const newTokens = await refresh_user_spotify_token(token, refresh_token);
          const newToken = newTokens.token;
          const newRefreshToken = newTokens.refresh_token;
          const newResponse = await requete(url, body, method, username, qs, nb_essaie - 1, newToken, refresh_token);
          return resolve({ reponse: newResponse.reponse, token: newToken, refresh_token: newRefreshToken,platform: "Spotify"});
        }
        console.error(body.error);
        return resolve({ reponse: -1, token: body.error });
      }
      return resolve({ reponse: body, token: null, refresh_token: null,platform: "Spotify"});
    });
  });
}

async function createSpotifyPlaylist(nom,username) {
  
  let url = "https://api.spotify.com/v1/me/playlists"
  let body = { name: nom }
  let resp = await requete(url, body, "POST", username)
  if (resp[0] == -1){console.log("[ERR] erreur lors de la création d'une playlist : " + resp[1]);return -1;}
  return resp.id;

}

async function addTracksToSpotifyPlaylist(tracks_id, playlist_id,username) {

  let formattedTracks = tracks_id.map(track => 'spotify:track:' + track);
  
  let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
  let body = { uris: formattedTracks }
  let resp = await requete(url,body,'POST',username)
  if (resp[0] === -1) 
  {
    if(resp[1] == {status: 403,message: "You cannot add tracks to a playlist you don't own."})
    {
      console.log("[ERR] erreur lors de l'ajout des tracks (la pl lui appartient pas)");
      return -1;
    }
    console.log("[ERR] erreur lors de l'ajout des tracks");
    return -1;
  }
  return true;
}

async function getRecentSpotifyPlaylists(token,refresh_token){

  let url = 'https://api.spotify.com/v1/me/playlists'
  //let qs = {'limit': nb_prop_playlists,'offset': offset }
  let resp = await requete(url,null,"GET","",{},1,token,refresh_token)
  if (resp[0] == -1) {console.log("[ERR] erreur lors de la recuperation des playlists récentes :" + resp[1]);return -1;}
  return {reponse : resp.reponse.items, token: resp.token, refresh_token: resp.refresh_token,platform: "Spotify"}
  
}

async function getSpotifyPlaylistTracksId(playlist_id,username){

  let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
  let resp = await requete(url,null,"GET",username)
  if (resp[0] == -1) {console.log("[ERR] erreur lors de la recuperation des ids des tracks :" + resp[1]);return -1;}
  resp = resp.items
  let res = []
  resp.forEach(async track => {
      res.push(track.track.id)
  });
  return res
}

async function getSpotifyPlaylist(id_pl,username){

  let url = `https://api.spotify.com/v1/playlists/${id_pl}`
  let resp = await requete(url,null,"GET",username)
  if(resp[0] == -1) {console.log("[ERR] erreur lors de la recuperation de la playlist :" + resp[1]);return -1;}
  let playlist = resp
  const nm = playlist.name.toLowerCase()
  const name = nm.length > 25 ? nm.substring(0, 35) + '...' : nm
  const img_vide = "https://e-cdns-images.dzcdn.net/images/cover/d41d8cd98f00b204e9800998ecf8427e/528x528-000000-80-0-0.jpg"
  const pic = playlist.images ? playlist.images[0] ? [playlist.images[0].url] : [img_vide] : [img_vide] ;
  const id = playlist.id
  return {name,pic,id}
}



module.exports ={getRecentSpotifyPlaylists,createSpotifyPlaylist,getSpotifyPlaylistTracksId,addTracksToSpotifyPlaylist,getSpotifyPlaylist,get_user_spotify_id}