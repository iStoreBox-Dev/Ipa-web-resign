import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import {
  generateOutputFilename,
  getFilePath,
  getOutputPath,
  copyFile,
  getFileSize,
  deleteFile,
} from './storage.service';

export interface ResignOptions {
  jobId: string;
  userId: string;
  ipaPath: string;
  ipaFilename: string;
  certificateId?: string;
  onProgress?: (progress: number, message: string) => void;
}

async function simulateResigning(options: ResignOptions): Promise<string> {
  const { onProgress } = options;

  const steps = [
    { progress: 10, message: 'Unpacking IPA archive...', delay: 500 },
    { progress: 30, message: 'Validating certificate...', delay: 700 },
    { progress: 50, message: 'Applying new signature...', delay: 800 },
    { progress: 70, message: 'Updating entitlements...', delay: 600 },
    { progress: 85, message: 'Repacking IPA archive...', delay: 700 },
    { progress: 95, message: 'Verifying signature...', delay: 500 },
    { progress: 100, message: 'Resigning complete!', delay: 200 },
  ];

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, step.delay));
    if (onProgress) onProgress(step.progress, step.message);
  }

  const outputFilename = generateOutputFilename(options.ipaFilename);
  const outputPath = getOutputPath(outputFilename);

  // Simulate by copying the original IPA
  copyFile(options.ipaPath, outputPath);

  return outputFilename;
}

export async function processResignJob(
  jobId: string,
  userId: string,
  ipaFilename: string,
  certificateId: string | undefined,
  emitProgress: (jobId: string, progress: number, message: string) => void
): Promise<void> {
  const ipaPath = getFilePath(ipaFilename);

  try {
    await prisma.resignJob.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    const outputFilename = await simulateResigning({
      jobId,
      userId,
      ipaPath,
      ipaFilename,
      certificateId,
      onProgress: (progress, message) => emitProgress(jobId, progress, message),
    });

    const outputPath = getOutputPath(outputFilename);
    const fileSize = getFileSize(outputPath);

    await prisma.resignJob.update({
      where: { id: jobId },
      data: {
        status: 'success',
        completedAt: new Date(),
        downloadUrl: `/api/resign/download/${jobId}`,
        fileSize,
      },
    });

    // Update certificate usage count
    if (certificateId) {
      await prisma.certificate.update({
        where: { id: certificateId },
        data: { usageCount: { increment: 1 } },
      });
    }

    logger.info(`ResignJob ${jobId} completed successfully`);
  } catch (error: any) {
    logger.error(`ResignJob ${jobId} failed:`, error);
    await prisma.resignJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message || 'Unknown error',
      },
    });
    throw error;
  } finally {
    // Clean up original uploaded IPA
    deleteFile(ipaPath);
  }
}
