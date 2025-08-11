// routes/authRoutes.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken, verifyAppleToken } from '../services/oauthService';

const router = Router();

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);

    const jwtToken = jwt.sign(
      { sub: payload.sub, email: payload.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({ token: jwtToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

router.post('/apple', async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyAppleToken(token);

    const jwtToken = jwt.sign(
      { sub: payload.sub, email: payload.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({ token: jwtToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Apple token' });
  }
});

export default router;
