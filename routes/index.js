const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', {
    user: req.user
  });
});

router.use('/api', require('./api'));

module.exports = router;
