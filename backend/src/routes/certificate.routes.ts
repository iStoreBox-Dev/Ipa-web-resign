import { Router } from 'express';
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

router.use(authenticate);

router.get('/', listCertificates);
router.post('/', uploadMiddleware, uploadCertificate);
router.get('/:id', getCertificate);
router.patch('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);

export default router;
