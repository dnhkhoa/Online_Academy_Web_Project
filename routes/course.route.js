import express from "express";

const router = express.Router();

router.get("/byCat", function (req, res) {
  res.render("vwCourse/byCat");
});

router.get("/details", function (req, res) {
  res.render("vwCourse/details");
});

router.get("/lesson", function (req, res) {
  res.render("vwAdminCourse/listLesson");
});

router.get("/addlesson", function (req, res) {
  res.render("vwAdminCourse/addLesson");
});

router.get("/editlesson", function (req, res) {
  res.render("vwAdminCourse/editLesson");
});

export default router;
