import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getDashboardStats,
  listUsers,
  updateUser,
  deleteUser,
  listAllCertificates,
  getAdminLogs,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later' },
});

router.use(adminRateLimit);
router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/certificates', listAllCertificates);
router.get('/logs', getAdminLogs);

export default router;
