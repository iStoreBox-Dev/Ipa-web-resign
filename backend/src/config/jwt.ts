import jwt from 'jsonwebtoken';

const NODE_ENV = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

if (NODE_ENV === 'production' && !jwtSecret) {
  throw new Error('JWT_SECRET environment variable must be set in production');
}

export const JWT_SECRET = jwtSecret || 'fallback-dev-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  isSubscribed: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
