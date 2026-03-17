import { Router } from 'express';
import {
  listRepositories,
  addRepository,
  getRepositoryApps,
  deleteRepository,
} from '../controllers/repository.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', listRepositories);
router.get('/:id/apps', getRepositoryApps);
router.post('/', authenticate, addRepository);
router.delete('/:id', authenticate, deleteRepository);

export default router;
