import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getProfile, updateProfile, changePassword, getResignHistory } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later' },
});

router.use(userRateLimit);
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);
router.get('/resign-history', getResignHistory);

export default router;
