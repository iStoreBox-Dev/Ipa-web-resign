import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { encrypt, decrypt } from '../utils/crypto';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export async function uploadCertificate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files['p12'] || files['p12'].length === 0) {
      res.status(400).json({ error: 'P12 certificate file is required' });
      return;
    }

    const p12File = files['p12'][0];
    const provisionFile = files['mobileprovision']?.[0];

    const { teamName, teamId, bundleId, expiryDate, isPublic } = req.body;

    // Read and encrypt certificate data
    const p12Buffer = fs.readFileSync(p12File.path);
    const encryptedCertData = encrypt(p12Buffer.toString('base64'));

    let encryptedProvisionData: string | undefined;
    if (provisionFile) {
      const provisionBuffer = fs.readFileSync(provisionFile.path);
      encryptedProvisionData = encrypt(provisionBuffer.toString('base64'));
    }

    // Clean up uploaded files (stored in DB encrypted)
    fs.unlinkSync(p12File.path);
    if (provisionFile) fs.unlinkSync(provisionFile.path);

    const certificate = await prisma.certificate.create({
      data: {
        userId: req.user!.userId,
        filename: p12File.originalname,
        certData: encryptedCertData,
        provisionData: encryptedProvisionData,
        certificateType: 'p12',
        teamName: teamName || null,
        teamId: teamId || null,
        bundleId: bundleId || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isPublic: isPublic === 'true',
      },
    });

    res.status(201).json({
      certificate: {
        id: certificate.id,
        filename: certificate.filename,
        teamName: certificate.teamName,
        teamId: certificate.teamId,
        bundleId: certificate.bundleId,
        expiryDate: certificate.expiryDate,
        isPublic: certificate.isPublic,
        usageCount: certificate.usageCount,
        createdAt: certificate.createdAt,
      },
    });
  } catch (error) {
    logger.error('UploadCertificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listCertificates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        certificateType: true,
        expiryDate: true,
        bundleId: true,
        teamId: true,
        teamName: true,
        isPublic: true,
        usageCount: true,
        createdAt: true,
      },
    });

    res.json({ certificates });
  } catch (error) {
    logger.error('ListCertificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listPublicCertificates(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        certificateType: true,
        expiryDate: true,
        bundleId: true,
        teamId: true,
        teamName: true,
        isPublic: true,
        usageCount: true,
        createdAt: true,
      },
    });

    res.json({ certificates });
  } catch (error) {
    logger.error('ListPublicCertificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCertificate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        id,
        OR: [{ userId: req.user!.userId }, { isPublic: true }],
      },
      select: {
        id: true,
        filename: true,
        certificateType: true,
        expiryDate: true,
        bundleId: true,
        teamId: true,
        teamName: true,
        isPublic: true,
        usageCount: true,
        createdAt: true,
      },
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    res.json({ certificate });
  } catch (error) {
    logger.error('GetCertificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCertificate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    await prisma.certificate.delete({ where: { id } });

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    logger.error('DeleteCertificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCertificate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { teamName, teamId, bundleId, isPublic } = req.body;

    const certificate = await prisma.certificate.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        teamName: teamName !== undefined ? teamName : certificate.teamName,
        teamId: teamId !== undefined ? teamId : certificate.teamId,
        bundleId: bundleId !== undefined ? bundleId : certificate.bundleId,
        isPublic: isPublic !== undefined ? isPublic === 'true' || isPublic === true : certificate.isPublic,
      },
      select: {
        id: true,
        filename: true,
        certificateType: true,
        expiryDate: true,
        bundleId: true,
        teamId: true,
        teamName: true,
        isPublic: true,
        usageCount: true,
        createdAt: true,
      },
    });

    res.json({ certificate: updated });
  } catch (error) {
    logger.error('UpdateCertificate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
