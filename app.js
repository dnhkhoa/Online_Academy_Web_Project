import express from "express";
import { engine } from "express-handlebars";
import hsb_sections from "express-handlebars-sections";

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
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static("static"));

app.get("/", function (req, res) {
  res.render("home");
});

import accountRouter from "./routes/account.route.js";
app.use("/account", accountRouter);

import courseRouter from "./routes/course.route.js";
app.use("/course", courseRouter);

import categoryRouter from "./routes/category.route.js";
app.use("/admin/categories", categoryRouter);

import cartRouter from "./routes/cart.route.js";
app.use("/cart", cartRouter);

app.use(function (req, res) {
  res.status(404).render("404");
});

app.listen(3000, function () {
  console.log("Server is running on http://localhost:3000");
});
