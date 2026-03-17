import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/crypto';
import { logger } from '../utils/logger';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isAdmin: true,
        storageQuota: true,
        usedStorage: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            certificates: true,
            resignJobs: true,
          },
        },
      },
    });

    res.json({ user });
  } catch (error) {
    logger.error('GetProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, avatar } = req.body;
    const updateData: any = {};

    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: req.user!.userId } },
      });
      if (existing) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      updateData.username = username;
    }

    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isAdmin: true,
      },
    });

    res.json({ user });
  } catch (error) {
    logger.error('UpdateProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !(await comparePassword(currentPassword, user.password))) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('ChangePassword error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getResignHistory(req: AuthRequest, res: Response): Promise<void> {
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
    logger.error('GetResignHistory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
