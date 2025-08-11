import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret-change';
const JWT_TTL: SignOptions['expiresIn'] = (process.env.JWT_TTL as any) || '7d';

export type JwtPayload = { sub: string; role: 'FAMILY' | 'CAREGIVER' | 'ADMIN' };

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      log: any;
    }
  }
}