const express = require('express');
const router = express.Router();
const Heroku = require('heroku-client');

router.get('/', function(req, res, next) {
  res.render('index', {
    user: req.user
  });
});

/**
 * Connect middleware for ensuring that requests must be authenticated.
 */
const loginRequired = (req, res, next) => {
  if (!req.user) {
    return next(new Error('not logged in'));
  }

  next();
};

router.post('/deploy', loginRequired, (req, res, next) => {
  const client = new Heroku({
    token: req.user.accessToken
  });

  client
    .post('/app-setups', {
      body: {
        source_blob: {

          // This will select the passed in tarball url as the source for the
          // build.
          url: req.body.tarballUrl
        },
        overrides: {
          env: {
            TALK_FACEBOOK_APP_ID: req.body.facebookAppID,
            TALK_FACEBOOK_APP_SECRET: req.body.facebookAppSecret
          }
        }
      }
    })
    .then((app) => {

      // Send back the created app to the frontend.
      res.status(201).json(app);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/deploy/:id/status', loginRequired, (req, res, next) => {
  const client = new Heroku({
    token: req.user.accessToken
  });

  client
    .get(`/app-setups/${req.params.id}`)
    .then((status) => {

      // Send back the created app to the frontend.
      res.status(201).json(status);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/deploy/:id/finish', loginRequired, (req, res, next) => {
  const client = new Heroku({
    token: req.user.accessToken
  });

  console.log(req.body);

  client
    .patch(`/apps/${req.body.app.id}/config-vars`, {
      body: {
        TALK_ROOT_URL: `https://${req.body.app.name}.herokuapp.com`
      }
    })
    .then(() => {

      // Reply that the modification/update was made.
      res.status(204).end();
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/deploy/:id', loginRequired, (req, res, next) => {
  const client = new Heroku({
    token: req.user.accessToken
  });

  client
    .delete(`/apps/${req.params.id}`)
    .then(() => {

      // Reply that the modification/update was made.
      res.status(204).end();
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
