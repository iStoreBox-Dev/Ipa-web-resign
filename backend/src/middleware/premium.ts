import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const PREMIUM_VALUE_KEYS = ['bundleId', 'appName', 'version', 'minIosVersion', 'displayName'];
const PREMIUM_FLAG_KEYS = ['injectTweaks'];

export function hasPremiumResignOptions(payload: Record<string, any>): boolean {
  const hasValues = PREMIUM_VALUE_KEYS.some((key) => {
    const value = payload[key];
    return typeof value === 'string' && value.trim().length > 0;
  });

  const hasFlags = PREMIUM_FLAG_KEYS.some((key) => payload[key] === true || payload[key] === 'true');

  return hasValues || hasFlags;
}

export function requireSubscription(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.dbUser?.isSubscribed) {
    res.status(403).json({ error: 'Active subscription required' });
    return;
  }

  next();
}

export function guardPremiumResignOptions(req: AuthRequest, res: Response, next: NextFunction): void {
  const payload = (req.body || {}) as Record<string, any>;
  const premiumRequested = hasPremiumResignOptions(payload);

  if (!premiumRequested) {
    next();
    return;
  }

  if (!req.user?.dbUser?.isSubscribed) {
    res.status(403).json({
      error: 'Premium resign options require an active subscription',
    });
    return;
  }

  next();
}
