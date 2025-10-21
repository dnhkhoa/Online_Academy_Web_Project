import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userModel from "../models/user.model.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback";

passport.serializeUser((user, done) => {
  done(null, user.userid); // userid phải đúng tên cột PK trong bảng users
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data, error } = await userModel.findUserById(id);
    if (error) return done(error);
    return done(null, data);
  } catch (err) {
    return done(err);
  }
});

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const fullName = profile.displayName || "";

      // tìm user theo email
      let { data: existing, error: findErr } = await userModel.findUserByEmail(email);

      // Nếu lỗi khác PGRST116 thì mới fail
      if (findErr && findErr.code !== "PGRST116") {
        console.error("Error finding user by email", findErr);
        return done(findErr);
      }

      // nếu đã tồn tại -> login
      if (existing) return done(null, existing);

      // === chưa tồn tại -> tạo account mới ===
      let baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      let username = baseUsername;
      let attempt = 0;
      while (attempt < 5) {
        const { data: udata } = await userModel.findUserByUsername(username);
        if (!udata) break;
        username = `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;
        attempt++;
      }

      const newUserPayload = {
        fullname: fullName,
        username,
        email,
        password: null, // social login không có password
      };

      const { error: addErr } = await userModel.addNewUser(newUserPayload);
      if (addErr) {
        console.error("Error adding new user", addErr);
        return done(addErr);
      }

      // lấy user vừa tạo để login
      const { data: created } = await userModel.findUserByEmail(email);
      return done(null, created);

    } catch (err) {
      console.error("Passport Google Strategy error:", err);
      return done(err);
    }
  }
));
