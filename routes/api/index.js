const express = require('express');
const router = express.Router();

// Each of the API's are mounted here.
[
  'heroku',
  'github'
].forEach((api) => {
  router.use(`/${api}`, require(`./${api}`));
});

module.exports = router;
