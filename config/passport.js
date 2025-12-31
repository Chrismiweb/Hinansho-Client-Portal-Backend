// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const User = require('../model/user');
const { createAGW } = require('../utilis/walletFactory');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            referral_code: crypto.randomBytes(4).toString('hex'), // e.g., "9f2dca3e"
            profile: {
              name: profile.displayName,
              avatar: profile.photos[0]?.value
            }
          });

          // Generate AGW (first time)
          const agwAddress = await createAGW(user._id);
          user.walletAddress = agwAddress;
          await user.save();
        } else if (!user.walletAddress) {
          // Existing user, no AGW yet → create
          const agwAddress = await createAGW(user._id);
          user.walletAddress = agwAddress;
          await user.save();
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;