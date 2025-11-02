import express from "express";
import bcryptjs, { compareSync } from "bcryptjs";
import bcrypt from "bcryptjs";
import * as userModel from "../models/user.model.js";
import supabase from "../config/supabase.js";
import crypto from "crypto";
import { transporter } from "../utils/mail.js";
import * as authMiddleware from "../middlewares/auth.mdw.js";
import axios from "axios";
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

router.get("/signin", function (req, res) {
  const locked = (req.query.locked || "").toString();
  res.render("vwAccount/signin", {
    error: false,
    locked: locked === '1' || locked === 'true',
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

  // Check lock status
  if (user.islocked) {
    return res.render('vwAccount/signin', { error: false, locked: true });
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
        username: user.username, // <- dùng 'username' (khớp với view)
        email: user.email,
      },
      SECRET_KEY,
      { expiresIn: '30d' } // 30 ngày
    );
  
    res.cookie('remember_token', token, {
      httpOnly: true,
      secure: false, // true nếu deploy HTTPS
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
  const page = parseInt(req.query.page) || 1; 
  const limit = 3; 
  const offset = (page - 1) * limit; 
  const courses = await courseModel.watchlistCoursesByUID(userID, limit, offset);

  const total = await courseModel.countWatchlistByUID(userID);
  const totalPages = Math.ceil(total / limit);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      value: i,
      isCurrent: i === page,
    });
  }
  res.render('vwCourse/watchlist'
    , {
      courses: courses,
      pages,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
      prevPage: page > 1 ? page - 1 : 1,
      nextPage: page < totalPages ? page + 1 : totalPages,
    }
  );
});

router.post('/del' ,async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.removeWatchlistItem(userID, courseID);
  res.redirect('/account/watchlist');
});

router.post('/del-enroll',async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.removeEnrolledItem(userID, courseID);
  res.redirect('/account/enrolled');
});

router.post('/add' ,async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.addWatchlistItem(userID, courseID);
  res.redirect('/account/watchlist');
});

router.post('/add-enroll' ,async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.addEnrolledItem(userID, courseID);
  res.redirect('/account/enrolled');
});

router.get('/enrolled',async function (req, res) {
  const userID = req.session.userid;
  const page = parseInt(req.query.page) || 1; 
  const limit = 3; 
  const offset = (page - 1) * limit; 
  const courses = await courseModel.enrolledCoursesByUID(userID, limit, offset); ;

  const total = await courseModel.countEnrolledByUID(userID);
  const totalPages = Math.ceil(total / limit);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      value: i,
      isCurrent: i === page,
    });
  }
  res.render('vwCourse/enrolled'
    , {
      courses: courses,
      pages,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
      prevPage: page > 1 ? page - 1 : 1,
      nextPage: page < totalPages ? page + 1 : totalPages,
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


router.get('/profile', authMiddleware.requireAuth, async function (req, res) {
  const userID = req.session.userid;
  const user = await userModel.userbyID(userID);

  res.render('vwAccount/profile', { users: user });
});

router.post('/profile', authMiddleware.requireAuth, async function (req, res) {
  const userID = req.session.userid;
  const user = await userModel.userbyID(userID);

  const { currentPassword, username, full_name, email } = req.body;

  const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
  if (!isPasswordValid) {
    return res.render('vwAccount/profile', {
      users: user,
      error: 'Sai mật khẩu hiện tại. Vui lòng thử lại.',
    });
  }

  const userUpdate = {
    username,
    full_name,
    email,
  };

  await userModel.updateUserProfile(userID, userUpdate);

  const updatedUser = await userModel.userbyID(userID);

  res.render('vwAccount/profile', {
    users: updatedUser,
    success: 'Cập nhật thông tin thành công!',
  });
});


router.get('/change-pwd', authMiddleware.requireAuth, async function (req, res) {
  const userID = req.session.userid;
  const user = await userModel.userbyID(userID);
  res.render('vwAccount/change-pwd', { users: user });
});

router.post('/change-pwd', async function (req, res) {
  const id = req.session.userid;
  const user = await userModel.userbyID(id);
  const currentPwd = req.body.currentPassword;
  const newPwd = req.body.newPassword;

  const ret = bcrypt.compareSync(currentPwd, user.password);
  if (ret === false){
    return res.render('vwAccount/change-pwd', {
      user: user,
      error: true
    });
  }
  const hash_newPwd = bcrypt.hashSync(newPwd, 10);
  const userUpdate = {
    password: hash_newPwd
  }
  await userModel.updateUserProfile(id, userUpdate);
  user.password = hash_newPwd;

  res.redirect('/account/profile');
});

router.post('/add-cart',async function (req, res) {
  const tax = 5000;
  const courses = await courseModel.findById(req.body.courseid);
  console.log(courses);
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  const status = 'pending';
  await courseModel.addCartItem(userID, courseID, status, courses.price, courses.discount, tax);
  res.redirect('/account/cart');
});

router.post('/del-cart',async function (req, res) {
  const userID = req.session.userid;
  const courseID = req.body.courseid;
  await courseModel.removeCartItem(userID, courseID);
  res.redirect('/account/cart');
});

router.post('/del-all-cart' ,async function (req, res) {
  const userID = req.session.userid;
  await courseModel.removeCartByUserID(userID);
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

router.post('/create-order',  async (req, res) => {
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
