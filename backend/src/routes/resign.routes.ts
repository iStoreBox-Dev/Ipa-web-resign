import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitResignJob,
  getResignJob,
  listResignJobs,
  downloadResignedIpa,
} from '../controllers/resign.controller';
import { authenticate } from '../middleware/auth';
import { uploadIpa } from '../middleware/upload';

const router = Router();

const resignRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later' },
});

router.use(resignRateLimit);
router.use(authenticate);

router.post('/', uploadIpa, submitResignJob);
router.get('/', listResignJobs);
router.get('/:id', getResignJob);
router.get('/download/:id', downloadResignedIpa);

export default router;
