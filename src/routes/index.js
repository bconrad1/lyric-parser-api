import artists from './artists';
import songs from './songs';

const routerInit = (app) => {
  app.use('/api/artist', artists);
  app.use('/api/songs', songs);
};

module.exports = routerInit;

