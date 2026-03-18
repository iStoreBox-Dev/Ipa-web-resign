import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { signToken } from '../config/jwt';
import { hashPassword, comparePassword } from '../utils/crypto';
import { logger } from '../utils/logger';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      res.status(400).json({ error: 'Email, password, and username are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email or username already in use' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        isAdmin: userCount === 0, // first user is admin
        isSubscribed: userCount === 0,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        isSubscribed: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
    });

    logger.info(`New user registered: ${user.email}`);
    res.status(201).json({ token, user });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account is banned' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      isSubscribed: user.isSubscribed,
    });

    logger.info(`User logged in: ${user.email}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        isSubscribed: user.isSubscribed,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: any, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isAdmin: true,
        isSubscribed: true,
        storageQuota: true,
        usedStorage: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT is stateless; client should discard the token
  res.json({ message: 'Logged out successfully' });
}
