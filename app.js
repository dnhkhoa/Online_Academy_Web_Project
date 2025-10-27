import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import dotenv from "dotenv";
import hsb_sections from "express-handlebars-sections";
import authRoutes from "./routes/auth.route.js";
import passport from "passport";
import "./config/passport.google.js";
dotenv.config();

const __dirname = import.meta.dirname;
const app = express();

app.engine(
  "handlebars",
  engine({
    helpers: {
      section: hsb_sections(),
      format_number(value) {
        return new Intl.NumberFormat("en-US").format(value);
      },
      calcOriginal: (price, discount) => (Number(price) || 0) + (Number(discount) || 0),

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

app.use((req, res, next) => {
  // req.user do passport gắn sau deserialize
  res.locals.authUser = req.user || null;
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

app.get("/", function (req, res) {
  res.render("home");
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
