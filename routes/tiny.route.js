import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { PRIVATE_KEY_FILE, SCOPE_USER } from '../tiny.config.js';

const router = express.Router();

router.get('/jwt', (req, res) => {
  const userId = 'admin';
  const fullName = 'Admin';

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: SCOPE_USER ? userId : 'global',
    name: fullName,
    iat: now,
    exp: now + 5 * 60
  };

  try {
    const privateKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf8');
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    return res.json({ token });
  } catch (e) {
    console.error('TinyDrive JWT error:', e.message);
    return res.status(500).json({ error: 'Cannot sign JWT' });
  }
});

export default router;
