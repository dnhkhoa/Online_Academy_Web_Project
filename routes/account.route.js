import express from 'express';
import bcryptjs from 'bcryptjs';
import * as userModel from '../models/user.model.js';
import supabase from '../config/supabase.js';

const router = express.Router();

router.get("/signup", (req, res) => {
  res.render("vwAccount/signup");
});

router.get("/signin", (req, res) => {
  res.render("vwAccount/signin");
});

router.post("/signup", async (req, res) => {
  const hash_password = bcryptjs.hashSync(req.body.password, 10);
  const user = {
    fullname: req.body.fullname,
    username: req.body.username,
    email: req.body.email,
    password: hash_password,
  };

  await userModel.addNewUser(user);
  res.redirect("/account/signin");
});

router.get("/is-available", async (req, res) => {
  const username = req.query.u;
  const { data, error } = await supabase
    .from("users")
    .select("userid")
    .eq("username", username)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ available: false });
  }

  return res.json({ available: !data });
});

export default router;
