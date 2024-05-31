const axios = require('axios');
const database = require('../database.js');
const { platform } = require('os');
const spotify_client_id = process.env['SPOTIFY_CLIENT_ID']
const spotify_client_secret = process.env['SPOTIFY_CLIENT_SECRET']

async function refresh_user_spotify_token(token, refresh_token) {
  const url = 'https://accounts.spotify.com/api/token';
  const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')
  };
  const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
  });

  return new Promise((resolve, reject) => {
      axios.post(url, data, { headers })
          .then(response => {
              if (response.status === 200) {
                  const tok = { token: response.data.access_token, refresh_token: refresh_token };
                  resolve(tok);
              } else {
                  console.log("[ERR] impossible de refresh le token spotify,", response.statusText);
                  resolve(false);
              }
          })
          .catch(error => {
              console.log("[ERR] impossible de refresh le token spotify,", error.message);
              resolve(false);
          });
  });
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
      params: method === 'GET' ? qs : {}, // Utilisez 'params' pour les requêtes GET
      data: method !== 'GET' ? body : undefined, // Utilisez 'data' pour les requêtes POST et PUT
  };

  return new Promise((resolve, reject) => {
      axios(options)
          .then(response => {
              resolve({ reponse: response.data, token: null, refresh_token: null, platform: "Spotify" });
          })
          .catch(async error => {
              if (error.response && error.response.data && error.response.data.error && nb_essaie > 0 && error.response.data.error.status === 401) {
                  const newTokens = await refresh_user_spotify_token(token, refresh_token);
                  const newToken = newTokens.token;
                  const newRefreshToken = newTokens.refresh_token;
                  const newResponse = await requete(url, body, method, username, qs, nb_essaie - 1, newToken, refresh_token);
                  return resolve({ reponse: newResponse.reponse, token: newToken, refresh_token: newRefreshToken, platform: "Spotify" });
              }
              console.error(error.response ? error.response.data.error : error.message);
              resolve({ reponse: -1, token: error.response ? error.response.data.error : error.message });
          });
  });
}

async function createSpotifyPlaylist(nom,token,refresh_token) {
  
  let url = "https://api.spotify.com/v1/me/playlists"
  let body = { name: nom }
  let resp = await requete(url,body,"POST","",{},1,token,refresh_token)
  if (resp == -1){console.log("[ERR] erreur lors de la création d'une playlist : " + resp[1]);return -1;}
  return {reponse : resp.reponse.id, token: resp.token, refresh_token: resp.refresh_token,platform: "Spotify"};

}

async function addTracksToSpotifyPlaylist(tracks_id, playlist_id,token,refresh_token) {

  let formattedTracks = tracks_id.map(track => 'spotify:track:' + track);
  
  let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
  let body = { uris: formattedTracks }
  let resp = await requete(url,body,"POST","",{},1,token,refresh_token)
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

async function getSpotifyPlaylistTracksId(playlist_id,token,refresh_token){

  let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
  let resp = await requete(url,null,"GET","",{},1,token,refresh_token)
  if (resp[0] == -1) {console.log("[ERR] erreur lors de la recuperation des ids des tracks :" + resp[1]);return -1;}
  resp = resp.reponse.items
  let res = []
  resp.forEach(async track => {
      res.push(track.track.id)
  });
  return {reponse : res, token: resp.token, refresh_token: resp.refresh_token,platform: "Spotify"}
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


async function deleteSpotifyTrackPlaylist(playlist_id,track_id,token,refresh_token){

  let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
  let body = { tracks: [{ "uri": `spotify:track:${track_id}` }] }
  let resp = await requete(url,body,"DELETE","",{},1,token,refresh_token)
  return resp;
}

async function likeSpotifyTrack(track_id,token,refresh_token){

  let url = `https://api.spotify.com/v1/me/tracks`
  let body = { ids: [track_id] }
  let resp = await requete(url,body,"PUT","",{},1,token,refresh_token)
  return resp;
} 

async function dislikeSpotifyTrack(track_id,token,refresh_token){

  let url = `https://api.spotify.com/v1/me/tracks`
  let body = { ids: [track_id] }
  let resp = await requete(url,body,"DELETE","",{},1,token,refresh_token)
  return resp;
}



module.exports ={getRecentSpotifyPlaylists,createSpotifyPlaylist,getSpotifyPlaylistTracksId,addTracksToSpotifyPlaylist,getSpotifyPlaylist,get_user_spotify_id,deleteSpotifyTrackPlaylist,likeSpotifyTrack,dislikeSpotifyTrack}