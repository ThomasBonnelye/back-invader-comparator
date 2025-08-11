import { Request, Response, NextFunction } from 'express';
import { verifyGoogleToken } from '../services/oauthService';

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
    }catch (err: any) {
    return res.status(401).json({ error: 'Token invalide : ' + err.message });
  }
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
