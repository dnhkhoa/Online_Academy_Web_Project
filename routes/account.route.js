import express from "express";
import bcryptjs from "bcryptjs";
import * as userModel from "../models/user.model.js";
import supabase from "../config/supabase.js";

const router = express.Router();

router.get("/signup", (req, res) => {
  res.render("vwAccount/signup");
});

router.post("/signup", async (req, res) => {
  const hash_password = bcryptjs.hashSync(req.body.password, 10);
  const user = {
    fullname: req.body.fullName,
    username: req.body.userName,
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

router.get("/check-email", async (req, res) => {
  const email = req.query.email;
  const { data, error } = await supabase
    .from("users")
    .select("userid")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ error: "Server error" });
  }

  return res.json({ available: !data });
});

router.get("/signin", (req, res) => {
  res.render("vwAccount/signin", {
    error: false,
  });
});

router.post("/signin", async (req, res) => {
  const username = req.body.userName;
  const user = await userModel.findUserByUsername(username);
  if (user.error || !user.data) {
    return res.render("vwAccount/signin", {
      error: "Invalid username or password.",
    });
  }

  const isValidPassword = bcryptjs.compareSync(
    req.body.password,
    user.data.password
  );
  if (!isValidPassword) {
    return res.render("vwAccount/signin", {
      error: "Invalid username or password.",
    });
  }

  req.session.isAuthenticated = true;
  req.session.user = user.data;

  //console.log(req.session);

  res.redirect("/");
});

export default router;
