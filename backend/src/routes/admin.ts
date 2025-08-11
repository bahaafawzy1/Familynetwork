import { Router } from 'express';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.use((req, res, next) => {
  if (req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  next();
});

adminRouter.get('/verification/documents', async (req, res) => {
  const status = (req.query.status as string) || 'PENDING';
  const docs = await prisma.document.findMany({ where: { status }, orderBy: { createdAt: 'desc' } });
  res.json({ items: docs });
});