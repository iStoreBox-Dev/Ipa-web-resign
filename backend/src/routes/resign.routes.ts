import { Router } from 'express';
import {
  submitResignJob,
  getResignJob,
  listResignJobs,
  downloadResignedIpa,
} from '../controllers/resign.controller';
import { authenticate } from '../middleware/auth';
import { uploadIpa } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', uploadIpa, submitResignJob);
router.get('/', listResignJobs);
router.get('/:id', getResignJob);
router.get('/download/:id', downloadResignedIpa);

export default router;
