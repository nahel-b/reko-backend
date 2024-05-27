const axios = require('axios');

async function non_valide_deezer_user_token(token) {
  if (token == null || token == "-1" || token == "0") {
      return true;
  }

  return new Promise((resolve, reject) => {
      const url = 'https://api.deezer.com/user/me';
      const params = { access_token: token };

      axios.get(url, { params })
          .then(response => {
              resolve(false);
          })
          .catch(error => {
              console.log("errr=" + error.message);
              resolve(true);
          });
  });
}


//playlistId to tracks id
async function getDeezerPlaylistTracksId(playlist_id, user_token) {
  return new Promise(async (resolve, reject) => {
      const nonvalide = await non_valide_deezer_user_token(user_token);

      if (nonvalide) {
          return reject(-1);
      }

      const url = `https://api.deezer.com/playlist/${playlist_id}`;
      const params = { access_token: user_token };

      axios.get(url, { params })
          .then(response => {
              const tracks = response.data.tracks.data;
              const trackIds = tracks.map(track => track.id) || [];
              resolve(trackIds);
          })
          .catch(error => {
              console.log("erreur ds getdeezerplaylisttrack :" + error.message);
              reject(-1);
          });
  });
}

//playlistId to info playlist
async function getDeezerPlaylist(playlistId, user_token) {
  const nonvalide = await non_valide_deezer_user_token(user_token);
  if (nonvalide) {
      return -1;
  }

  return new Promise((resolve, reject) => {
      const url = `https://api.deezer.com/playlist/${playlistId}`;
      const params = { access_token: user_token };

      axios.get(url, { params })
          .then(response => {
              if (response.status !== 200) {
                  console.log("erreur ds getdeezerplaylist :" + response.statusText);
                  return resolve(-1);
              }

              const playlist = response.data;
              if (!playlist.title) {
                  return resolve(null);
              }

              const nm = playlist.title.toLowerCase();
              const name = nm.length > 25 ? nm.substring(0, 35) + '...' : nm;
              const pic = [playlist.picture_small, playlist.picture_medium, playlist.picture_big];
              const id = playlist.id;

              resolve({ name, pic, id });
          })
          .catch(error => {
              console.log("erreur ds getdeezerplaylist :" + error.message);
              resolve(-1);
          });
  });
}

async function getRecentDeezerPlaylists(user_token) {
  const nonvalide = await non_valide_deezer_user_token(user_token);

  if (nonvalide) {
    return -1;
  }

  try {
    const response = await axios.get('https://api.deezer.com/user/me/playlists', {
      params: {
        access_token: user_token,
        limit: 50
      }
    });

    const playlists = response.data.data;
    return playlists;
  } catch (error) {
    throw error;
  }
}

async function createDeezerPlaylist(nom, access_token) {
  const nonvalide = await non_valide_deezer_user_token(access_token);

  if (nonvalide) {
    return -1;
  }

  try {
    const response = await axios.post('https://api.deezer.com/user/me/playlists', null, {
      params: {
        access_token: access_token,
        title: nom
      }
    });

    const p = response.data;
    const playlistId = p.id;
    return playlistId;
  } catch (error) {
    console.error("Erreur dans créer playlist Deezer=" + error);
    return -1;
  }
}

//add track to playlist
async function addTracksToDeezerPlaylist(playlistId, tracksId, access_token) {
  const nonvalide = await non_valide_deezer_user_token(access_token);
  if (nonvalide) {
    return -1;
  }

  const options = {
    method: "POST",
    url: `https://api.deezer.com/playlist/${playlistId}/tracks`,
    params: {
      access_token: access_token,
      songs: tracksId.join(',')
    }
  };
  try {
    const response = await axios(options);
    console.log(response.data);
    return true;
  } catch (error) {
    console.error(`[ERR] dans ajout des sons ${tracksId.join(',')} dans la playlist ${playlistId}: ${error}`);
    return -1;
  }
}

module.exports ={getRecentDeezerPlaylists,createDeezerPlaylist,getDeezerPlaylistTracksId,getDeezerPlaylist,addTracksToDeezerPlaylist}