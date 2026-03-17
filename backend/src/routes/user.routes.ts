import { Router } from 'express';
import { getProfile, updateProfile, changePassword, getResignHistory } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);
router.get('/resign-history', getResignHistory);

export default router;
