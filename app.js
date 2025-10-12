import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import { engine } from "express-handlebars";
import hbs_sections from "express-handlebars-sections";
import path from "path";
import { fileURLToPath } from "url";

import supabase from "./config/supabase.js";
import authRoutes from "./routes/auth.route.js";
import accountRouter from "./routes/account.route.js";

dotenv.config();

// __dirname fix cho ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/auth", authRoutes);
app.use("/account", accountRouter);

app.get("/", (req, res) => {
  res.render("home");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
 