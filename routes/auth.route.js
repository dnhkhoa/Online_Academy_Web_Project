const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Test API
router.get("/test", async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("*").limit(5);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

module.exports = router;
