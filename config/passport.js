const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const env = require("dotenv").config();
const {User} = require("../model/user/usermodel");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ googleId: profile.id });
    if (user) {
      return done(null, user);
    } else {
      const newUser = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value
      });
      await newUser.save();
      return done(null, newUser);
    }
  } catch (error) {
    console.error("Error fetching user data", error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser(async (googleId, done) => {
  try {
    const user = await User.findOne({ googleId: googleId });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport
