import express from "express";
import bcryptjs, { compareSync } from "bcryptjs";
import bcrypt from "bcryptjs";
import * as userModel from "../models/user.model.js";
import supabase from "../config/supabase.js";
import crypto from "crypto";
import { transporter } from "../utils/mail.js";
import * as authMiddleware from "../middlewares/auth.mdw.js";
import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { error } from "console";

const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY;

router.get("/signup", (req, res) => {
  res.render("vwAccount/signup", {
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY
  });
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password, userName } = req.body;

  const hash_password = bcryptjs.hashSync(req.body.password, 10);

  const recaptchaToken = req.body["g-recaptcha-response"];
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify`;

  const { data } = await axios.post(
    verifyURL,
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
        remoteip: req.ip,
      },
    }
  );

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


router.post('/signin', async function (req, res) {
  const { userName, password, remember } = req.body;

  const user = await userModel.findUserByUsername(userName);
  if (!user) {
    return res.render('vwAccount/signin', { error: true });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.render('vwAccount/signin', { error: true });
  }

  // === Session login ===
  req.session.isAuthenticated = true;
  req.session.authUser = user;
  req.session.userid = user.userid;

  // === Remember Me (JWT cookie) ===
  if (remember) {
    const token = jwt.sign(
      {
        userid: user.userid,
        userName: user.username,
        email: user.email,
      },
      SECRET_KEY,
      { expiresIn: '30d' } // 30 ngày
    );

    res.cookie('remember_token', token, {
      httpOnly: true,
      secure: false, // đổi true nếu deploy HTTPS
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  const retUrl = req.session.retUrl || '/';
  delete req.session.retUrl;
  res.redirect(retUrl);
});


import * as courseModel from "../models/course.model.js";
import { create } from "domain";
import db from "../utils/db.js";

router.get('/watchlist', authMiddleware.requireAuth ,async function (req, res) {
  const userID = req.session.userid;
  console.log(userID);
  const courses = await courseModel.watchlistCoursesByUID(userID);
  res.render('vwCourse/watchlist'
    , {
      courses: courses
    }
  );
});

router.post('/del', async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.removeWatchlistItem(userID, courseID);
  res.redirect('/account/watchlist');
});

router.post('/del-enroll', async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.removeEnrolledItem(userID, courseID);
  res.redirect('/account/enrolled');
});

router.post('/add',authMiddleware.requireAuth ,async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.addWatchlistItem(userID, courseID);
  res.redirect('/account/watchlist');
});

router.post('/add-enroll',authMiddleware.requireAuth ,async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.addEnrolledItem(userID, courseID);
  res.redirect('/account/enrolled');
});

router.get('/enrolled',authMiddleware.requireAuth ,async function (req, res) {
  const userID = req.session.userid;
  const courses = await courseModel.enrolledCoursesByUID(userID);
  res.render('vwCourse/enrolled'
    , {
      courses: courses
    }
  );
});

router.post('/signout', function (req, res) {
  // Xoá cookie remember_token nếu có
  res.clearCookie('remember_token');

  // Xoá session
  req.session.isAuthenticated = false;
  req.session.userid = null;
  delete req.session.authUser;

  // Xoá hẳn session trong store để tránh leak
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect('/');
  });
});

router.post('/add-cart', authMiddleware.requireAuth ,async function (req, res) {
  const tax = 5000;
  const courses = await courseModel.findById(req.body.courseid);
  console.log(courses);
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  const status = 'pending';
  await courseModel.addCartItem(userID, courseID, status, courses.price, courses.discount, tax);
  res.redirect('/account/cart');
});

router.post('/del-cart', authMiddleware.requireAuth ,async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.removeCartItem(userID, courseID);
  res.redirect('/account/cart');
});

router.get('/cart', authMiddleware.requireAuth ,async function (req, res) {
  const userID = req.session.userid;
  const cartItems = await courseModel.cartItemsByUID(userID);
  console.log(cartItems);
  for (const item of cartItems) {
    console.log(item.courseid);
    const instructorName = await courseModel.InstructorName(item.courseid);
    item.instructorName = instructorName;
  }
  res.render('vwCart/cart'
    , {
      cartItems: cartItems,
    }
  );
});

router.post('/create-order', authMiddleware.requireAuth, async (req, res) => {
  try {
    const userId = req.session.userid;
    const courseId = req.body.orderId;

    // Lấy thông tin khóa học
    const course = await db('courses').where({ courseid: courseId }).first();
    if (!course) return res.json({ success: false, message: 'Course not found' });

    const subtotal = Number(course.price);
    const discount = Number(course.discount || 0);
    const tax = 5000;
    const total = subtotal - discount + tax;

    // Tạo đơn hàng
    const [newOrder] = await db('orders')
      .insert({
        userid: userId,
        courseid: courseId,
        subtotal,
        discount,
        total,
        status: 'pending',
      })
      .returning('orderid');

    return res.json({ success: true, newOrderId: newOrder.orderid });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

export default router;
