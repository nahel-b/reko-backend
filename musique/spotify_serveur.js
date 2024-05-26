const axios = require('axios');

const spotify_client_id = process.env['SPOTIFY_CLIENT_ID']
const spotify_client_secret = process.env['SPOTIFY_CLIENT_SECRET']

const { Buffer } = require('buffer');

function log(string ) {
  console.log("[APP]" + string);  
}


//string musique to spotify musiques
async function envoie_recherche_musique(demande, offset,limit =3) {
  try {
  let res = []
  req = await demande_id( demande, offset,1,limit);

  for (let i = 0; i < req.length; i++) {
    //console.log(req)
    let track = {
    image_urls : [req[i]['album']['images'][0]['url'],req[i]['album']['images'][1]['url'],req[i]['album']['images'][2]['url']],
    titre : req[i]['name'],
    artiste : req[i]['artists'][0]['name'],
    id : req[i]['id'],
    preview_url : req[i]['preview_url']
  }
    res.push(track);
  }
  return res
    }
  catch(error)
  {
    console.log("errr" , error);
    return -1;
  }
}

//id spotify to musique reco
async function recommandation(liste_son_seed_reco, offset, limit, essaie_restant = 1) {
  let spotify_server_token = await get_spotify_server_token();
  
  return new Promise((resolve, reject) => {
      const params = { seed_tracks: liste_son_seed_reco.join(','), limit, market: 'FR', offset };
      const headers = {
          Authorization: `Bearer ${spotify_server_token}`,
          'Content-Type': 'application/json'
      };

      axios.get('https://api.spotify.com/v1/recommendations', { params, headers })
          .then(response => {
              if (response.status === 200) {
                  const data = response.data.tracks;
                  const liste_reco_res = [];

                  data.forEach(track => {
                      if (track.preview_url) {
                          liste_reco_res.push({
                              image_urls: track.album.images.map(image => image.url),
                              titre: track.name,
                              artiste: track.artists[0].name,
                              id: track.id,
                              preview_url: track.preview_url
                          });
                      }
                  });

                  resolve(liste_reco_res);
              } else {
                  if (essaie_restant > 0) {
                      recommandation(liste_son_seed_reco, offset, limit, essaie_restant - 1)
                          .then(resolve)
                          .catch(reject);
                  } else {
                      console.log("[ERR] erreur dans change tracks : " + response.statusText);
                      resolve(-1);
                  }
              }
          })
          .catch(error => {
              if (essaie_restant > 0) {
                  recommandation(liste_son_seed_reco, offset, limit, essaie_restant - 1)
                      .then(resolve)
                      .catch(reject);
              } else {
                  console.log("[ERR] erreur dans change tracks : " + error.message);
                  resolve(-1);
              }
          });
  });
}

async function get_spotify_server_token()
{

  let spotify_server_token = process.env['spotify_token']
  const valid = await isTokenValid(spotify_server_token)
  if(valid)
  {
    return spotify_server_token
  }
  else
  {    
    res = await refresh_spotify_server_token()
    process.env['spotify_token'] = res
    return res
  }
}

async function isTokenValid(access_token) {
  // fais une recherche sur spotify pour voir si le token est valide
  return new Promise((resolve, reject) => {
      const params = { q: "test", type: 'track', market: 'FR', limit: 3, offset: 0 };
      const headers = {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
      };

      axios.get('https://api.spotify.com/v1/search', { params, headers })
          .then(response => {
              if (response.status === 200) {
                  resolve(true);
              } else {
                  resolve(false);
              }
          })
          .catch(error => {
              resolve(false);
          });
  });
}

async function refresh_spotify_server_token() {
  return new Promise((resolve, reject) => {
      const url = 'https://accounts.spotify.com/api/token';
      const headers = {};
      const data = new URLSearchParams();

      const message = `${spotify_client_id}:${spotify_client_secret}`;
      const base64Message = Buffer.from(message).toString('base64');

      headers.Authorization = `Basic ${base64Message}`;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';

      data.append('grant_type', 'client_credentials');

      axios.post(url, data, { headers })
          .then(response => {
              resolve(response.data.access_token);
          })
          .catch(error => {
              console.log(`Error in refresh_token: ${error.response.data}`);
              reject(error);
          });
  });
}

async function demande_id(query, offset, essaie_restant = 1, limit = 3) {
  let spotify_server_token = await get_spotify_server_token();

  return new Promise((resolve, reject) => {
      const params = { q: query, type: 'track', market: 'FR', limit, offset };
      const headers = {
          Authorization: `Bearer ${spotify_server_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
      };

      axios.get('https://api.spotify.com/v1/search', { params, headers })
          .then(response => {
              const searchData = response.data;
              resolve(searchData.tracks.items);
          })
          .catch(async error => {
              if (error.response && error.response.status === 200) {
                  resolve(JSON.parse(error.response.data).tracks.items);
              } else if (essaie_restant > 0) {
                  let res = await demande_id(query, offset, essaie_restant - 1, limit);
                  resolve(res);
              } else {
                  resolve(-1);
              }
          });
  });
}


async function s_to_d(spotifyId,essaie_restant = 1) {

  let spotify_server_token = await get_spotify_server_token();


  try {
    // Recherche la musique sur Spotify
    const spotifyResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
      headers: {
        Authorization: `Bearer ${spotify_server_token}`,
      'Content-Type': 'application/json'
      }
    });

    const spotifyTrack = spotifyResponse.data;

    // Recherche la musique sur Deezer
    let newTitre = spotifyTrack.name.replace(/\[.*?\]/g, '').trim();
    newTitre = newTitre.replace(/\(.*?\)/g, '').trim()
    let query = spotifyTrack.artists[0].name + " " + newTitre;
    query = query.split("'").join(' ');

    let url = `http://api.deezer.com/search?q=${query}&limit=1`
    //url = encodeURIComponent(url)

    const deezerResponse = await axios.get(url);


    const deezerTrack = deezerResponse.data.data[0];
    if (deezerTrack == null)
    {
      log("[ERR-RECO] s_to_d n'a pas marché pour l'id spotify: " + spotifyId);
    }
    return deezerTrack ? String(deezerTrack.id) : null;
  } catch (error) {

    if(essaie_restant>0)
      {

        let res = await s_to_d(spotifyId, essaie_restant-1)
        return res;
      }
    log("[ERR-RECO] s_to_d n'a pas marché pour l'id spotify: " + spotifyId + "erreur : " + error);
    return null;
  }
}

async function liste_s_to_d(spotifyIds) {
  const promises = spotifyIds.map(spotifyId => s_to_d(spotifyId));
  const deezerIds = await Promise.all(promises);

  return deezerIds;
}

async function d_to_s(deezerId, essaie_restant = 1) {
  let spotify_server_token = await get_spotify_server_token();

  return new Promise(async (resolve, reject) => {
      try {
          // Recherche la musique sur Deezer
          const deezerResponse = await axios.get(`http://api.deezer.com/track/${deezerId}`);
          const deezerTrack = deezerResponse.data;

          // Recherche la musique sur Spotify
          let titre = deezerTrack.title;
          const newTitre = titre.replace(/\(feat\.\s[^\)]+\)/, "");
          let query = encodeURIComponent(`"${newTitre}" artist:"${deezerTrack.artist.name}"`);

          const headers = {
              Authorization: `Bearer ${spotify_server_token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
          };

          axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track`, { headers })
              .then(response => {
                  if (response.status === 200) {
                      try {
                          const res = response.data.tracks.items[0].id;
                          resolve(res);
                      } catch (err) {
                          if (essaie_restant > 0) {
                              d_to_s(deezerId, essaie_restant - 1)
                                  .then(resolve)
                                  .catch(reject);
                          } else {
                              resolve(null);
                          }
                      }
                  } else {
                      if (essaie_restant > 0) {
                          d_to_s(deezerId, essaie_restant - 1)
                              .then(resolve)
                              .catch(reject);
                      } else {
                          resolve(null);
                      }
                  }
              })
              .catch(error => {
                  if (essaie_restant > 0) {
                      d_to_s(deezerId, essaie_restant - 1)
                          .then(resolve)
                          .catch(reject);
                  } else {
                      resolve(null);
                  }
              });
      } catch (err) {
          if (essaie_restant > 0) {
              d_to_s(deezerId, essaie_restant - 1)
                  .then(resolve)
                  .catch(reject);
          } else {
              resolve(null);
          }
      }
  });
}

async function liste_d_to_s(deezerIds) {

  const promises = deezerIds.map(deezerId => d_to_s(deezerId));
  const spotifyIds = await Promise.all(promises);
  return spotifyIds;
}



// async function addAutoTracks(playlist_id,seed,number,access_token,platform)
// {
//   return new Promise((resolve, reject) => {
//     const params = { seed_tracks: seed.join(','), limit: number, market: 'FR', offset };
//     const headers = {
//       Authorization: `Bearer ${access_token}`,
//       'Content-Type': 'application/json'
//     };

//     request.get({ url: 'https://api.spotify.com/v1/recommendations', qs: params, headers }, (error, response, body) => {
//       if (response.statusCode === 200) {
//         const jsonBody = JSON.parse(body);
//         const tracks = jsonBody.tracks;
//         const trackIds = tracks.map(track => track.id);
//         console.log('musiques choisies : ' + trackIds)
//         resolve(trackIds)


//       } else {
//         console.log(`Error in searchkk: ${body}`);
//         resolve(-1);
//       }
//     });
//   });

// }



//module.exports = { addAutoTracks, refresh_token, demande_id,change_tracks,liste_s_to_d,s_to_d,d_to_s,liste_d_to_s};



module.exports ={get_spotify_server_token,isTokenValid,demande_id,s_to_d,liste_s_to_d,d_to_s,liste_d_to_s,envoie_recherche_musique,recommandation}