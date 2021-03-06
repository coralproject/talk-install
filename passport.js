const passport = require('passport');
const HerokuStrategy = require('passport-heroku').Strategy;

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('Please provide a SESSION_SECRET environment variable for encrypting serialized passport users');

}
const encryptor = require('simple-encryptor')(SESSION_SECRET);

passport.serializeUser((user, done) => {
  done(null, encryptor.encrypt(user));
});

passport.deserializeUser((user, done) => {
  done(null, encryptor.decrypt(user));
});

['HEROKU_OAUTH_ID', 'HEROKU_OAUTH_SECRET'].forEach(function (envVar) {
  if (!process.env[envVar]) {throw new Error(`Please provide required environment variable ${  envVar}. See README.`);}
});

passport.use(new HerokuStrategy({
  clientID: process.env.HEROKU_OAUTH_ID,
  clientSecret: process.env.HEROKU_OAUTH_SECRET,
  callbackURL: `${process.env.ROOT_URL}/auth/heroku/callback`
}, (accessToken, refreshToken, profile, done) => {

  // Ensure that the user has their account verified. If they don't it'll fail
  // on the deployment step.
  if (!profile.heroku.verified) {
    return done(null, false, {
      message: `Your Heroku account is not verified, please
                see https://devcenter.heroku.com/categories/billing.
                Verify now at https://heroku.com/verify.`
    });
  }

  // Send back the access token, that's the only thing our user is made of.
  done(null, {profile, accessToken});
}));

module.exports = passport;
