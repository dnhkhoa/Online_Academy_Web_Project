import express from "express";
import supabase from "../config/supabase.js";
import passport from "passport";

const router = express.Router();

// Test API
router.get("/test", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*").limit(5);

  if (error) {
    return res.status(400).json({ error });
  }

  res.json(data);
});

// bắt đầu auth google
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/account/signin" }),
  (req, res) => {
        req.session.isAuthenticated = true;
    req.session.authUser = req.user;
    res.redirect("/");
  }
);


export default router;
