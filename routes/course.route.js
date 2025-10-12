import express from "express";

const router = express.Router();

router.get("/byCat", function (req, res) {
  res.render("vwCourse/byCat");
});

router.get("/details", function (req, res) {
  res.render("vwCourse/details");
});

export default router;
