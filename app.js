const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const { engine } = require("express-handlebars");
const hbs_sections = require("express-handlebars-sections");
const path = require("path");

dotenv.config();

const app = express();

// Template engine
app.engine(
  "handlebars",
  engine({
    helpers: {
      section: hbs_sections(),
      format_number(value) {
        return new Intl.NumberFormat("en-US").format(value);
      },
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

const supabase = require("./config/supabase");
const authRoutes = require("./routes/auth.route");
const accountRouter = require("./routes/account.route");

app.use("/auth", authRoutes);
app.use("/account", accountRouter);

app.get("/", (req, res) => {
  res.render("home");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
