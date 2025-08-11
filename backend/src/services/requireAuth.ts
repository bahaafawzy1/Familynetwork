import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });
  req.user = payload;
  return next();
}