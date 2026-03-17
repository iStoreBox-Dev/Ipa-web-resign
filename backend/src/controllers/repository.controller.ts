import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import https from 'https';
import http from 'http';

export async function listRepositories(_req: Request, res: Response): Promise<void> {
  try {
    const repositories = await prisma.repository.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ repositories });
  } catch (error) {
    logger.error('ListRepositories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addRepository(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { url, name, description } = req.body;

    if (!url || !name) {
      res.status(400).json({ error: 'URL and name are required' });
      return;
    }

    const existing = await prisma.repository.findUnique({ where: { url } });
    if (existing) {
      res.status(409).json({ error: 'Repository already exists' });
      return;
    }

    const repository = await prisma.repository.create({
      data: {
        url,
        name,
        description,
        createdBy: req.user?.userId,
      },
    });

    res.status(201).json({ repository });
  } catch (error) {
    logger.error('AddRepository error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRepositoryApps(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const repository = await prisma.repository.findUnique({ where: { id } });
    if (!repository) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    // Fetch apps from repository URL
    fetchJsonFromUrl(repository.url, async (error, data) => {
      if (error || !data) {
        res.json({ apps: [], repository });
        return;
      }

      // Update last synced and app count
      const apps = data.apps || data.cydia || data.packages || [];
      await prisma.repository.update({
        where: { id },
        data: {
          lastSynced: new Date(),
          appCount: Array.isArray(apps) ? apps.length : 0,
        },
      });

      res.json({ apps, repository });
    });
  } catch (error) {
    logger.error('GetRepositoryApps error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRepository(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const repository = await prisma.repository.findUnique({ where: { id } });
    if (!repository) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    if (repository.isDefault) {
      res.status(400).json({ error: 'Cannot delete default repository' });
      return;
    }

    await prisma.repository.delete({ where: { id } });
    res.json({ message: 'Repository deleted' });
  } catch (error) {
    logger.error('DeleteRepository error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function fetchJsonFromUrl(url: string, callback: (error: Error | null, data: any) => void): void {
  const protocol = url.startsWith('https') ? https : http;
  protocol.get(url, (response) => {
    let data = '';
    response.on('data', (chunk) => (data += chunk));
    response.on('end', () => {
      try {
        callback(null, JSON.parse(data));
      } catch {
        callback(new Error('Invalid JSON'), null);
      }
    });
  }).on('error', (error) => {
    callback(error, null);
  });
}
