export const errorHandler = app => {
  app.get('*', function(req, res, next) {
    setImmediate(() => { next(new Error('woops')); });
  });

  app.use(function(error, req, res, next) {
    res.json({ message: error.message });
  });
};
