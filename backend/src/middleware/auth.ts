import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../config/jwt';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: JwtPayload & { dbUser?: any };
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1] || null;
}

async function loadUserFromToken(token: string) {
  const payload = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      isSubscribed: true,
      isBanned: true,
    },
  });

  return { payload, user };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const { payload, user } = await loadUserFromToken(token);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account is banned' });
      return;
    }

    req.user = { ...payload, isSubscribed: user.isSubscribed, dbUser: user };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function authenticateOptional(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = getBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const { payload, user } = await loadUserFromToken(token);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account is banned' });
      return;
    }

    req.user = { ...payload, isSubscribed: user.isSubscribed, dbUser: user };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
