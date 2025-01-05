const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const env = require("dotenv").config();
const { User } = require("../model/user/usermodel");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Normalize email to lowercase
        const email = profile.emails[0].value.toLowerCase();

        // First, check if a user exists with the Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If no user found with Google ID, check if the email exists
          user = await User.findOne({ email });

          if (user) {
            // Associate the Google ID with the existing user
            user.googleId = profile.id;
            await user.save();
          } else {
            // Create a new user
            user = new User({
              googleId: profile.id,
              username: profile.displayName,
              email: email,
            });

            await user.save();
          }
        }

        // Pass the user object to the `done` callback
        return done(null, user);
      } catch (error) {
        console.error("Error handling Google login:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.googleId); // Serialize by Google ID
});

passport.deserializeUser(async (googleId, done) => {
  try {
    const user = await User.findOne({ googleId });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
