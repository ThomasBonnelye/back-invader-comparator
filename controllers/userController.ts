import { Request, Response } from 'express';
import { upsertUser, getUserData } from '../db';

export const saveUserData = async (req: Request, res: Response) => {
  const { userUid, friends } = req.body;

  if (!userUid || !Array.isArray(friends)) {
    return res.status(400).json({ error: 'userUid et friends sont requis' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  try {
    await upsertUser(req.user.id, req.user.email, req.user.provider, userUid, friends);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  try {
    const data = await getUserData(req.user.id);
    if (!data) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
