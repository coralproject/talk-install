const express = require('express');
const router = express.Router();
const Heroku = require('heroku-client');

/**
 * Connect middleware for ensuring that requests must be authenticated.
 */
const loginRequired = (req, res, next) => {
  if (!req.user) {
    return next(new Error('not logged in'));
  }

  // Create the Heroku client on the user object.
  req.user.client = new Heroku({
    token: req.user.accessToken
  });

  next();
};

router.use(loginRequired);

router.post('/app-setups', (req, res, next) => {
  req.user.client
    .post('/app-setups', {
      body: {
        source_blob: {

          // This will select the passed in tarball url as the source for the
          // build.
          url: req.body.tarballUrl,

          // This will tag the release with the version.
          version: req.body.version
        },
        overrides: {
          env: {
            TALK_FACEBOOK_APP_ID: req.body.facebookAppID,
            TALK_FACEBOOK_APP_SECRET: req.body.facebookAppSecret
          }
        }
      }
    })
    .then((setup) => {

      // Send back the created app to the frontend.
      res.status(201).json(setup);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/app-setups/:app_setup_id', (req, res, next) => {
  req.user.client
    .get(`/app-setups/${req.params.app_setup_id}`)
    .then((status) => {
      res.json(status);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/apps/builds', (req, res, next) => {
  req.user.client
    .post(`/apps/${req.body.app_name}/builds`, {
      body: {
        source_blob: {

          // This will select the passed in tarball url as the source for the
          // build.
          url: req.body.tarballUrl,

          // This will tag the release with the version.
          version: req.body.version
        }
      }
    })
    .then((build) => {

      // Send back the created build to the frontend.
      res.status(201).json(build);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/apps/builds', (req, res, next) => {
  req.user.client
    .get(`/apps/${req.query.app_name}/builds/${req.query.build_id}`)
    .then((status) => {
      res.json(status);
    })
    .catch((err) => {
      next(err);
    });
});

router.patch('/apps/:app_name/config-vars', (req, res, next) => {
  req.user.client
    .patch(`/apps/${req.params.app_name}/config-vars`, {body: req.body})
    .then(() => {

      // Reply that the modification/update was made.
      res.status(204).end();
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/apps/:app_name/addons', (req, res, next) => {
  req.user.client
    .get(`/apps/${req.params.app_name}/addons`)
    .then((addons) => {

      // Send back the addons.
      res.json(addons);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/apps', (req, res, next) => {
  req.user.client
    .get('/apps')
    .then((apps) => {

      res.status(200).json(apps);
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/apps/:app_name', (req, res, next) => {
  req.user.client
    .delete(`/apps/${req.params.app_name}`)
    .then(() => {

      // Reply that the modification/update was made.
      res.status(204).end();
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
