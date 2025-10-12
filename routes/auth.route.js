import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Test API
router.get("/test", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*").limit(5);

  if (error) {
    return res.status(400).json({ error });
  }

  res.json(data);
});

export default router;
