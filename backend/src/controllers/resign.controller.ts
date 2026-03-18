import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { resignQueue } from '../services/queue.service';
import { processResignJob } from '../services/resign.service';
import { getOutputPath, fileExists } from '../services/storage.service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { hashPassword } from '../utils/crypto';

let io: any = null;

export function setSocketIO(socketIO: any): void {
  io = socketIO;
}

function emitProgress(jobId: string, progress: number, message: string): void {
  if (io) {
    io.emit(`resign:progress:${jobId}`, { progress, message });
  }
}

async function getOrCreateGuestUserId(): Promise<string> {
  const guestEmail = 'guest@system.local';
  const guestUsername = 'guest_system';

  const existing = await prisma.user.findUnique({
    where: { email: guestEmail },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const password = await hashPassword(crypto.randomUUID());
  const created = await prisma.user.create({
    data: {
      email: guestEmail,
      username: guestUsername,
      password,
      isAdmin: false,
      isSubscribed: false,
      isBanned: false,
    },
    select: { id: true },
  });

  return created.id;
}

function getPublicJobAccessToken(req: AuthRequest): string | null {
  const queryToken = req.query.accessToken;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken;
  }

  const headerToken = req.headers['x-job-access-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken;
  }

  return null;
}

export async function submitResignJob(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'IPA file is required' });
      return;
    }

    const { certificateId } = req.body;
    const isAuthenticated = !!req.user;

    let resolvedCertificateId: string | undefined = certificateId;

    // Guests can only use free/public certificates.
    if (!isAuthenticated) {
      if (certificateId) {
        const cert = await prisma.certificate.findFirst({
          where: { id: certificateId, isPublic: true },
          select: { id: true },
        });

        if (!cert) {
          res.status(403).json({ error: 'Public users can only use free certificates' });
          return;
        }
      } else {
        const defaultPublicCert = await prisma.certificate.findFirst({
          where: { isPublic: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

        if (!defaultPublicCert) {
          res.status(400).json({ error: 'No free certificate available right now' });
          return;
        }

        resolvedCertificateId = defaultPublicCert.id;
      }
    }

    // Verify certificate belongs to user if provided
    if (resolvedCertificateId && isAuthenticated) {
      const cert = await prisma.certificate.findFirst({
        where: {
          id: resolvedCertificateId,
          OR: [{ userId: req.user!.userId }, { isPublic: true }],
        },
      });
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
    }

    const jobOwnerId = req.user?.userId || (await getOrCreateGuestUserId());
    const accessToken = req.user ? null : crypto.randomBytes(24).toString('hex');

    const job = await prisma.resignJob.create({
      data: {
        userId: jobOwnerId,
        ipaFilename: req.file.filename,
        certificateId: resolvedCertificateId || null,
        accessToken,
        status: 'pending',
        fileSize: req.file.size,
      },
    });

    // Queue the resign job
    resignQueue.add(job.id, 'resign', { jobId: job.id }, async () => {
      await processResignJob(
        job.id,
        jobOwnerId,
        req.file!.filename,
        resolvedCertificateId,
        emitProgress
      );

      if (io) {
        const updatedJob = await prisma.resignJob.findUnique({ where: { id: job.id } });
        io.emit(`resign:complete:${job.id}`, { job: updatedJob });
      }
    });

    logger.info(`ResignJob ${job.id} queued for user ${jobOwnerId}`);
    res.status(201).json({
      job,
      accessToken: accessToken || undefined,
      isGuestJob: !req.user,
    });
  } catch (error) {
    logger.error('SubmitResignJob error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getResignJob(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const accessToken = getPublicJobAccessToken(req);

    const job = await prisma.resignJob.findUnique({
      where: { id },
      include: {
        certificate: {
          select: { filename: true, teamName: true },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (req.user) {
      const ownedByUser = job.userId === req.user.userId;
      const hasValidPublicToken = !!job.accessToken && accessToken === job.accessToken;
      if (!ownedByUser && !hasValidPublicToken) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
    } else {
      if (!job.accessToken || accessToken !== job.accessToken) {
        res.status(401).json({ error: 'Valid job access token is required' });
        return;
      }
    }

    res.json({ job });
  } catch (error) {
    logger.error('GetResignJob error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listResignJobs(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.resignJob.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          certificate: {
            select: { filename: true, teamName: true },
          },
        },
      }),
      prisma.resignJob.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({ jobs, total, page, limit });
  } catch (error) {
    logger.error('ListResignJobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function downloadResignedIpa(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const accessToken = getPublicJobAccessToken(req);

    const job = await prisma.resignJob.findUnique({
      where: { id },
    });

    if (!job || job.status !== 'success') {
      res.status(404).json({ error: 'Resigned IPA not found' });
      return;
    }

    if (req.user) {
      const ownedByUser = job.userId === req.user.userId;
      const hasValidPublicToken = !!job.accessToken && accessToken === job.accessToken;
      if (!ownedByUser && !hasValidPublicToken) {
        res.status(404).json({ error: 'Resigned IPA not found' });
        return;
      }
    } else {
      if (!job.accessToken || accessToken !== job.accessToken) {
        res.status(401).json({ error: 'Valid job access token is required' });
        return;
      }
    }

    // Files are named `<jobId>-<originalBase>-resigned.ipa` — look up by jobId prefix
    const resignedDir = path.join(process.env.UPLOAD_DIR || './uploads', 'resigned');
    const files = fs.readdirSync(resignedDir);
    const resignedFile = files.find((f) => f.startsWith(id + '-'));

    if (!resignedFile) {
      res.status(404).json({ error: 'Resigned file not found on disk' });
      return;
    }

    const filePath = getOutputPath(resignedFile);
    if (!fileExists(filePath)) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    res.download(filePath, resignedFile);
  } catch (error) {
    logger.error('DownloadResignedIpa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
