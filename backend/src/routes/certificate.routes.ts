import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  uploadCertificate,
  listCertificates,
  getCertificate,
  deleteCertificate,
  updateCertificate,
} from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { uploadCertificate as uploadMiddleware } from '../middleware/upload';

const router = Router();

const certRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later' },
});

router.use(certRateLimit);
router.use(authenticate);

router.get('/', listCertificates);
router.post('/', uploadMiddleware, uploadCertificate);
router.get('/:id', getCertificate);
router.patch('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);

export default router;
