import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { logger } from '../utils/logger';

export async function getDashboardStats(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      totalResignings,
      totalCertificates,
      recentJobs,
      jobsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.resignJob.count(),
      prisma.certificate.count(),
      prisma.resignJob.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, email: true } },
          certificate: { select: { filename: true } },
        },
      }),
      prisma.resignJob.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const successCount = jobsByStatus.find((j) => j.status === 'success')?._count.status || 0;
    const failedCount = jobsByStatus.find((j) => j.status === 'failed')?._count.status || 0;

    // Calculate total storage used
    const storageResult = await prisma.user.aggregate({
      _sum: { usedStorage: true },
    });

    res.json({
      stats: {
        totalUsers,
        totalResignings,
        totalCertificates,
        successCount,
        failedCount,
        totalStorage: storageResult._sum.usedStorage || 0,
      },
      recentJobs,
    });
  } catch (error) {
    logger.error('GetDashboardStats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { username: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          isAdmin: true,
          isBanned: true,
          isSubscribed: true,
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
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, limit });
  } catch (error) {
    logger.error('ListUsers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isAdmin, isBanned, isSubscribed, storageQuota, password } = req.body;

    if (id === req.user!.userId && isBanned === true) {
      res.status(400).json({ error: 'Cannot ban yourself' });
      return;
    }

    const updateData: any = {};
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    if (isSubscribed !== undefined) updateData.isSubscribed = isSubscribed;
    if (storageQuota !== undefined) updateData.storageQuota = Number(storageQuota);
    if (password) updateData.password = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        isBanned: true,
        isSubscribed: true,
        storageQuota: true,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.userId,
        actionType: 'UPDATE_USER',
        targetId: id,
        details: JSON.stringify(updateData),
        ipAddress: req.ip,
      },
    });

    res.json({ user });
  } catch (error) {
    logger.error('UpdateUser error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.userId,
        actionType: 'DELETE_USER',
        targetId: id,
        ipAddress: req.ip,
      },
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    logger.error('DeleteUser error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listAllCertificates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, email: true } },
        },
      }),
      prisma.certificate.count(),
    ]);

    res.json({ certificates, total, page, limit });
  } catch (error) {
    logger.error('ListAllCertificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { username: true, email: true } },
        },
      }),
      prisma.adminLog.count(),
    ]);

    res.json({ logs, total, page, limit });
  } catch (error) {
    logger.error('GetAdminLogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
