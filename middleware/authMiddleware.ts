import { Request, Response, NextFunction } from 'express';
import { verifyGoogleToken, verifyAppleToken } from '../services/tokenVerifier';

export default async function verifyTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    try {
      const decoded = await verifyGoogleToken(token);
      req.user = {
        id: decoded.sub as string,
        email: decoded.email as string,
        provider: 'google',
      };
      return next();
    } catch {
      // Essaye Apple
      const decoded = await verifyAppleToken(token);
      req.user = {
        id: decoded.sub as string,
        email: decoded.email as string,
        provider: 'apple',
      };
      return next();
    }
  } catch (err: any) {
    return res.status(401).json({ error: 'Token invalide : ' + err.message });
  }
}
