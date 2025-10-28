import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import dotenv from "dotenv";
import hsb_sections from "express-handlebars-sections";
import authRoutes from "./routes/auth.route.js";
import passport from "passport";
import "./config/passport.google.js";
import { renderStars } from './utils/rating.js';
import * as courseModel from "./models/course.model.js";
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
      renderStars,
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
// passport init
app.use(passport.initialize());
app.use(passport.session());

// Persistent login middleware
app.use((req, res, next) => {
  if (!req.session.isAuthenticated && req.cookies.remember_token) {
    try {
      const payload = jwt.verify(req.cookies.remember_token, SECRET_KEY);

      // tái tạo session từ token
      req.session.isAuthenticated = true;
      req.session.authUser = {
        userid: payload.userid,
        userName: payload.username,
        email: payload.email,
      };
      req.session.userid = payload.userid;

      res.locals.isAuthenticated = true;
      res.locals.authUser = req.session.authUser;
    } catch (err) {
      // token sai hoặc hết hạn thì xóa cookie
      res.clearCookie('remember_token');
    }
  }
  next();
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

import courseRoute from './routes/course.route.js';
app.use("/course", courseRoute);

import categoryRouter from "./routes/category.route.js";
import * as authMiddleware from './middlewares/auth.mdw.js';
app.use("/admin/categories",authMiddleware.requireAuth ,authMiddleware.restrictAdmin ,categoryRouter);


import tinyRouter from './routes/tiny.route.js';
app.use('/tiny', tinyRouter);

import paymentsRouter from './routes/payment.route.js';
app.use('/payments', paymentsRouter);

app.use(function (req, res) {
  res.status(404).render("404");
});

app.listen(3000, function () {
  console.log("Server is running on http://localhost:3000");
});
