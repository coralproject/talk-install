const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const marked = require('marked');
const fs = require('fs');
const passport = require('./passport');
const debug = require('debug')('talk-install:app');
const RedisStore = require('connect-redis')(session);
const redis = require('./redis');

const index = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'coralLogoMark-1.5.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

const session_opts = {
  secret: process.env.SESSION_SECRET,
  httpOnly: true,
  rolling: true,
  saveUninitialized: false,
  resave: false,
  name: 'talk.sid',
  cookie: {
    secure: false,
    maxAge: 18000000, // 30 minutes for expiry.
  },
  store: new RedisStore({
    ttl: 1800,
    client: redis,
  })
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);

  // Enable the secure cookie when we are in production mode.
  session_opts.cookie.secure = true;
} else if (app.get('env') === 'test') {

  // Add in the secret during tests.
  session_opts.secret = 'keyboard cat';
}

app.use(session(session_opts));
app.use(passport.initialize());
app.use(passport.session());

// Auth callbacks.
app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});
app.get('/auth/heroku', passport.authenticate('heroku'));
app.get('/auth/heroku/callback', passport.authenticate('heroku', {
  failureRedirect: '/',
  successRedirect: '/'
}));

// Create the new renderer that overrides the link generation.
const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  return `<a target="_blank" href="${href}" title="${title}">${text}</a>`;
};

// Add the md local into the template.
app.locals.md = (filename) => {
  let path = `${__dirname}/views/docs/${filename}.md`;

  debug(`Loading markdown template: views/docs/${filename}.md`);

  let include = fs.readFileSync(path, 'utf8');

  return marked(include, {renderer});
};

app.use('/', index);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (req.xhr) {
    res.status(err.status || 500);
    res.json({
      error: req.app.get('env') !== 'production' ? err : {}
    });
    return;
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') !== 'production' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
