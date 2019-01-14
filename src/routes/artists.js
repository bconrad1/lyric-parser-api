import express from 'express';
import axios from 'axios';
import _ from 'lodash';
import stringSimilarity from 'string-similarity';

let router = express.Router();
let url, auth;

function initializeEnvVariables() {
  url = process.env.API_URL;
  auth = process.env.GENIUS_AUTH_TOKEN;
}

router.get('/', (req, res) => {
  res.status(200).send('ok');
});

router.get('/search/:artist', (req, res) => {
  initializeEnvVariables();
  let searchTerm = req.params.artist;
  axios.get(`${url}/search`, {
    headers: {
      Authorization: 'Bearer ' + auth,
    },
    params: {
      q: searchTerm,
    },
  }).then(response => {
    let geniusRes = response.data.response;
    let songs = geniusRes.hits;
    let artists = _.map(songs, (song) => {
      let artistInfo = song.result.primary_artist;
      let artistName = artistInfo.name.toLowerCase();
      let stringSimilarityValue = stringSimilarity.compareTwoStrings(artistName,
          searchTerm.toLowerCase());
      if (stringSimilarityValue > 0.8 || artistName.includes(searchTerm)) {
        return {
          artist: artistInfo.name,
          artistId: artistInfo.id,
        };
      }
    });
    res.json(_.uniqBy(artists, 'artistId'));
  }).catch(err => console.log(err));
});

router.get('/songs/:id', (req, res) => {
  initializeEnvVariables();
  let artistId = req.params.id;
  let perPage = 50;
  let pageNum = req.query.pageNum ? req.query.pageNum : null;
  axios.get(`${url}/artists/${artistId}/songs`,
      {
        headers: {
          Authorization: 'Bearer ' + auth,
        },
        params: {
          per_page: perPage,
          page: pageNum
        }
      }).then(response => {
        let songList = response.data.response.songs;
        let songs = _.map(songList, song => {
          let songId = song.id;
          let apiPath = song.api_path;
          let title = song.full_title;
          let url = song.url;
          return {
            songId,
            apiPath,
            title,
            url
          };
        });
        res.json(songs);
      });
});

export default router;