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
  passport.authenticate("google", { 
    failureRedirect: "/account/signin",
    failureMessage: true 
  }),
  (req, res) => {
    console.log("Google auth successful, user:", req.user);
    req.session.isAuthenticated = true;
    req.session.authUser = req.user;
    
    // Ensure session is saved before redirect
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect("/account/signin");
      }
      res.redirect("/");
    });
  }
);


export default router;
