import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { resignQueue } from '../services/queue.service';
import { processResignJob } from '../services/resign.service';
import { getOutputPath, fileExists } from '../services/storage.service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

let io: any = null;

export function setSocketIO(socketIO: any): void {
  io = socketIO;
}

function emitProgress(jobId: string, progress: number, message: string): void {
  if (io) {
    io.emit(`resign:progress:${jobId}`, { progress, message });
  }
}

export async function submitResignJob(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'IPA file is required' });
      return;
    }

    const { certificateId } = req.body;

    // Verify certificate belongs to user if provided
    if (certificateId) {
      const cert = await prisma.certificate.findFirst({
        where: {
          id: certificateId,
          OR: [{ userId: req.user!.userId }, { isPublic: true }],
        },
      });
      if (!cert) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
    }

    const job = await prisma.resignJob.create({
      data: {
        userId: req.user!.userId,
        ipaFilename: req.file.filename,
        certificateId: certificateId || null,
        status: 'pending',
        fileSize: req.file.size,
      },
    });

    // Queue the resign job
    resignQueue.add(job.id, 'resign', { jobId: job.id }, async () => {
      await processResignJob(
        job.id,
        req.user!.userId,
        req.file!.filename,
        certificateId,
        emitProgress
      );

      if (io) {
        const updatedJob = await prisma.resignJob.findUnique({ where: { id: job.id } });
        io.emit(`resign:complete:${job.id}`, { job: updatedJob });
      }
    });

    logger.info(`ResignJob ${job.id} queued for user ${req.user!.userId}`);
    res.status(201).json({ job });
  } catch (error) {
    logger.error('SubmitResignJob error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getResignJob(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const job = await prisma.resignJob.findFirst({
      where: { id, userId: req.user!.userId },
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

    res.json({ job });
  } catch (error) {
    logger.error('GetResignJob error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listResignJobs(req: AuthRequest, res: Response): Promise<void> {
  try {
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

    const job = await prisma.resignJob.findFirst({
      where: { id, userId: req.user!.userId, status: 'success' },
    });

    if (!job) {
      res.status(404).json({ error: 'Resigned IPA not found' });
      return;
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
