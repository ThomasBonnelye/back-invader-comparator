import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken } from '../services/oauthService';

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

export default router;
