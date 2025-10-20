import express from "express";
import bcryptjs from "bcryptjs";
import * as userModel from "../models/user.model.js";
import supabase from "../config/supabase.js";
import crypto from "crypto";
import { transporter } from "../utils/mail.js";

const router = express.Router();

router.get("/signup", (req, res) => {
  res.render("vwAccount/signup");
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password, userName } = req.body;

  const hash_password = bcryptjs.hashSync(req.body.password, 10);

  // create OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otp_exp = Date.now() + 3 * 60 * 1000; // 3 phút

  // save pending user + otp vào session
  req.session.pendingUser = { fullName, email, userName, hash_password };
  req.session.otp = otp;
  req.session.otpExp = otp_exp;

  // send mail
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Your OTP code",
    text: `Your OTP is: ${otp}`
  });

  res.render("vwAccount/verify-otp");


});


//POST: /verify-otp
router.post("/verify-otp", async (req, res) => {
  const userOtp = req.body.otp;

  if (!req.session.otp || !req.session.pendingUser) {
    return res.render("vwAccount/verify-otp", { error: "Session expired" });
  }

  if (Date.now() > req.session.otpExp) {
    return res.render("vwAccount/verify-otp", { error: "OTP expired" });
  }

  if (userOtp !== req.session.otp) {
    return res.render("vwAccount/verify-otp", { error: "Invalid OTP" });
  }

  // OTP hợp lệ -> insert user vào DB bằng hàm userModel
  const pending = req.session.pendingUser;
  const { data, error } = await userModel.addNewUser({
    fullname: pending.fullName,
    username: pending.userName,            
    email: pending.email,
    password: pending.hash_password,
  });

  if (error) {
    console.log("ADD USER ERROR:", error);
    return res.render("vwAccount/verify-otp", { error: "Database error" });
  }

  // clear session otp
  delete req.session.otp;
  delete req.session.otpExp;
  delete req.session.pendingUser;

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
