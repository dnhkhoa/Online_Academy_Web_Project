import express from "express";

const router = express.Router();

router.get("/term-of-use", function (req, res) {
  res.render("vwLegal/term");
});

router.get("/privacy", function (req, res) {
  res.render("vwLegal/privacy");
});

export default router;