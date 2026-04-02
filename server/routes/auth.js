import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return res.json({ valid: true, message: 'JWT verification skipped (dev mode)' });
  }

  try {
    const payload = jwt.verify(token, secret);
    res.json({ valid: true, userId: payload.sub });
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export default router;
