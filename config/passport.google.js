import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userModel from "../models/user.model.js";
import supabase from "../config/supabase.js";
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback";

passport.serializeUser((user, done) => {
  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log("Serializing user:", user.userid);
  }
  done(null, user.userid); // userid phải đúng tên cột PK trong bảng users
});

passport.deserializeUser(async (id, done) => {
  try {
    // Check cache first
    const cachedUser = userCache.get(id);
    if (cachedUser) {
      return done(null, cachedUser);
    }

    const { data, error } = await userModel.findUserById(id);
    if (error) {
      console.error("Deserialize error:", error);
      return done(error);
    }

    // Cache the user data
    userCache.set(id, data);
    setTimeout(() => userCache.delete(id), CACHE_TTL);

    return done(null, data);
  } catch (err) {
    console.error("Deserialize catch error:", err);
    return done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Check if user exists by email
        const { data: existingUser, error: findError } = await userModel.findUserByEmail(profile.emails[0].value);

        if (findError && findError.code !== "PGRST116") {
          console.error("Find user error:", findError);
          return done(findError);
        }

        // If user exists, return it
        if (existingUser) {
          return done(null, existingUser);
        }

        // If user doesn't exist, create new user
        const newUserData = {
          email: profile.emails[0].value,
          fullname: profile.displayName,
          username: profile.emails[0].value.split("@")[0],
          role: "student"
        };

        const { data: newUser, error: createError } = await userModel.addNewUser(newUserData);

        if (createError) {
          console.error("Create user error:", createError);
          return done(createError);
        }

        return done(null, newUser);
      } catch (error) {
        console.error("Passport Google Strategy error:", error);
        return done(error);
      }
    }
  )
);
