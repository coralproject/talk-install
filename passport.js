const passport = require('passport');
const HerokuStrategy = require('passport-heroku').Strategy;
const encryptor = require('simple-encryptor')(process.env.SESSION_SECRET);

passport.serializeUser((user, done) => {
  done(null, encryptor.encrypt(user));
});

passport.deserializeUser((user, done) => {
  done(null, encryptor.decrypt(user));
});

passport.use(new HerokuStrategy({
  clientID: process.env.HEROKU_OAUTH_ID,
  clientSecret: process.env.HEROKU_OAUTH_SECRET,
  callbackURL: `${process.env.ROOT_URL}/auth/heroku/callback`
}, (accessToken, refreshToken, profile, done) => {

  // Send back the access token, that's the only thing our user is made of.
  done(null, {profile, accessToken});
}));

module.exports = passport;
