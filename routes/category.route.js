import express from "express";

const router = express.Router();

router.get("/add", function (req, res) {
  res.render("vwAdminCategory/add");
});

router.get("/edit", function (req, res) {
  res.render("vwAdminCategory/edit");
});

router.get("/list", function (req, res) {
  res.render("vwAdminCategory/list");
});

export default router;
