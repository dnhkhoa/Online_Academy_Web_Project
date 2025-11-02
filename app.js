import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import dotenv from "dotenv";
import hsb_sections from "express-handlebars-sections";
import authRoutes from "./routes/auth.route.js";
import passport from "passport";
import "./config/passport.google.js";
import paymentRouter from "./routes/payment.route.js"; 
import { renderStars } from "./utils/rating.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
dotenv.config();

const __dirname = import.meta.dirname;
const app = express();

const SECRET_KEY = process.env.SECRET_KEY;

app.use(cookieParser());

app.engine(
  "handlebars",
  engine({
    helpers: {
      section: hsb_sections(),
      format_number(value) {
        return new Intl.NumberFormat("en-US").format(value);
      },
      calcOriginal: (price, discount) => (Number(price) || 0) + (Number(discount) || 0),
      calcPrice: (price, discount) => (Number(price) || 0) - (Number(discount) || 0),
      renderStars,
      eq: (a, b) => Number(a) === Number(b),
      is: (a, b) => String(a) === String(b),
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");
app.use('/static', express.static('static'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    rolling: true, // Extends session on activity
  })
);
// passport init
app.use(passport.initialize());
app.use(passport.session());

// Persistent login middleware
app.use((req, res, next) => {
  try {
    // Nếu đã có session thì không cần làm gì
    if (req.session.isAuthenticated) {
      res.locals.isAuthenticated = true;
      res.locals.authUser = req.session.authUser || null;
      return next();
    }

    const token = req.cookies.remember_token;
    if (!token) {
      res.locals.isAuthenticated = false;
      res.locals.authUser = null;
      return next();
    }

    // verify token
    const payload = jwt.verify(token, SECRET_KEY);

    // rebuild session from payload
    req.session.isAuthenticated = true;
    // nếu payload có đủ trường, dùng payload; nếu muốn đầy đủ user từ DB có thể fetch ở đây
    req.session.authUser = {
      userid: payload.userid,
      username: payload.username,
      email: payload.email,
    };
    req.session.userid = payload.userid;

    // expose to views
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;

    return next();
  } catch (err) {
    // token sai hoặc hết hạn -> clear cookie & reset locals
    console.error("remember middleware:", err.message);
    res.clearCookie('remember_token');
    res.locals.isAuthenticated = false;
    res.locals.authUser = null;
    return next();
  }
});


app.use(async function (req, res, next) {
  if (req.session.isAuthenticated) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.isAuthenticated = false;
  }
  next();
});

app.use("/auth", authRoutes);
app.use("/account", accountRouter);
import* as courseModel from "./models/course.model.js";
app.get("/", async function (req, res) {
  // by views
  const topCourses = await courseModel.getTop10ByViews();

  const top3Courses = await courseModel.get3TopCourses();
  await courseModel.updateNumEnrolled();
  //by enrolled
  const topEnrolledCourses = await courseModel.getTop10ByEnrolled();

  //by latest
  const topLatestCourses = await courseModel.get10NewestCourses();

  res.render("home",{
    topcourses : topCourses,
    topenrolledcourses: topEnrolledCourses,
    toplatestcourses: topLatestCourses,
    top3courses: top3Courses
  });
});
import accountRouter from "./routes/account.route.js";
app.use("/account", accountRouter);

import courseRouter from "./routes/course.route.js";
app.use("/course", courseRouter);

import categoryRouter from "./routes/category.route.js";
import * as authMiddleware from './middlewares/auth.mdw.js';
app.use("/admin/categories",authMiddleware.requireAuth ,authMiddleware.restrictAdmin, categoryRouter);

import adminUsersRouter from "./routes/admin.users.route.js";
app.use("/admin/users", authMiddleware.requireAuth, authMiddleware.restrictAdmin, adminUsersRouter);


import tinyRouter from './routes/tiny.route.js';
app.use('/tiny', tinyRouter);

import termRouter from "./routes/term.route.js";
app.use("/legal", termRouter);

import instructorRouter from "./routes/instructor.route.js";
app.use("/instructor", instructorRouter);


app.use("/payments", paymentRouter);

app.use(function (req, res) {
  res.status(404).render("404");
});

app.listen(3000, function () {
  console.log("Server is running on http://localhost:3000");
});
