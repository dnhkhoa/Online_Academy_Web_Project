const express = require("express");

const router = express.Router();

router.get("/signup", function (req, res) {
  res.render("vwAccount/signup");
});

router.get("/signin", function (req, res) {
  res.render("vwAccount/signin");
});

module.exports = router;
