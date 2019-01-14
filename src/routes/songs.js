import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash';

let router = express.Router();
let url, auth;

function initializeEnvVariables() {
  url = process.env.API_URL;
  auth = process.env.GENIUS_AUTH_TOKEN;
}

function parseHtml (html){
  let $ = cheerio.load(html);
  let lyrics = $('.lyrics').text().trim();
  lyrics = lyrics
  .replace(/\[(.+?)\]/g,'').replace(/\n/g,' ').replace(/[{)},(]/g, ' ').split(' ');

  let lyricCount = _.countBy(lyrics);
  return lyricCount;
}
router.get('/', (req, res) => {
  res.status(200).send('ok');
});

router.get('/lyrics/:id', (req, res) => {
  initializeEnvVariables();
  let songId = req.params.id;
  axios.get(`${url}/songs/${songId}`,
      {
        headers: {
          Authorization: 'Bearer ' + auth,
        },
      })
  .then(response => {
        let songInfo = response.data.response.song;
        let url = songInfo.url;
        return Promise.resolve(url);
  })
  .then(url => {
    axios.get(url).then(html => {
      let lyricArray = parseHtml(html.data);
      res.json({test:lyricArray})
    });
  });
});

export default router;