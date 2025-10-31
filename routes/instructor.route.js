import express from "express";

const router = express.Router();

router.get("/infor", function (req, res) {
  res.render("vwInstructor/infor");
});

export default router;
