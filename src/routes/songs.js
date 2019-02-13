import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash';
import {words} from '../config/common-words';

let router = express.Router();
let url, auth;

function initializeEnvVariables() {
  url = process.env.API_URL;
  auth = process.env.GENIUS_AUTH_TOKEN;
}

function parseHtml(html, removeCommonWords) {
  let $ = cheerio.load(html);
  let lyrics = $('.lyrics').text().trim();
  lyrics = lyrics.replace(/\[(.+?)\]/g, '').
      replace(/\n/g, ' ').
      replace(/[{)},(]/g, ' ').
      split(' ');
  let lyricCount = _.countBy(lyrics);
  let lyricCountRemoved = [];
  Object.keys(lyricCount).map((word) => {
    if (removeCommonWords && !words.includes(word.toLowerCase())) {

      lyricCountRemoved.push(
          {
            word: word,
            count: lyricCount[word],
          });
    }
    if (!removeCommonWords) {
      console.log('word',word)
      lyricCountRemoved.push(
          {
            word: word,
            count: lyricCount[word],
          });
    }
  });
  return _.orderBy(lyricCountRemoved, ['count'], ['desc']);
}

router.get('/', (req, res) => {
  res.status(200).send('ok');
});

router.get('/search/:songName', (req, res) => {
  initializeEnvVariables();
  let songName = req.params.songName;
  axios.get(`${url}/search`, {
    headers: {
      Authorization: 'Bearer ' + auth,
    },
    params: {
      q: songName,
    },
  }).then(response => {
    let geniusRes = response.data.response;
    let songs = geniusRes.hits;
    let songList = _.map(songs, (song) => {
      let songTitle = song.result.title;
      if (songTitle.toLowerCase().includes(songName.toLowerCase())) {
        return {
          songName: songTitle,
          url: song.result.url,
          fullTitle: song.result.full_title,
          id: song.result.id
        };
      }
    });
    res.json({songs:_.compact(songList)});
  }).catch(err => console.log(err));
});

router.get('/lyrics/:id', (req, res) => {
  initializeEnvVariables();
  let songId = req.params.id;
  let removeWords = req.query.removeCommonWords;
  let removeCommonWords = removeWords === 'true';
  axios.get(`${url}/songs/${songId}`,
      {
        headers: {
          Authorization: 'Bearer ' + auth,
        },
      }).then(response => {
    let songInfo = response.data.response.song;
    let info = {
      url: songInfo.url,
      title: songInfo.title,
      fullTitle: songInfo.full_title,
    };
    return Promise.resolve(info);
  }).then(songInfo => {
    axios.get(songInfo.url).then(html => {
      let lyricArray = parseHtml(html.data, removeCommonWords);
      res.json({
        songTitle: songInfo.title,
        songFullTitle: songInfo.fullTitle,
        words: lyricArray,
      });
    });
  });
});

export default router;