import { Router } from 'express';
import verifyTokenMiddleware from '../middleware/authMiddleware';
import { saveUserData, getUser } from '../controllers/userController';

const router = Router();

router.use(verifyTokenMiddleware);

router.post('/save', saveUserData);

router.get('/', getUser);

export default router;
