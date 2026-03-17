import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  listRepositories,
  addRepository,
  getRepositoryApps,
  deleteRepository,
} from '../controllers/repository.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

const repoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later' },
});

router.use(repoRateLimit);

router.get('/', listRepositories);
router.get('/:id/apps', getRepositoryApps);
router.post('/', authenticate, addRepository);
router.delete('/:id', authenticate, deleteRepository);

export default router;
