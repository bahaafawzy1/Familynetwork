import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';

export const supportRouter = Router();
supportRouter.use(requireAuth);

const createSchema = z.object({ subject: z.string(), description: z.string(), priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'), tags: z.array(z.string()).optional() });

supportRouter.post('/', async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { subject, description, priority, tags } = parse.data;
  const ticket = await prisma.supportTicket.create({ data: { openedByUserId: req.user!.sub, subject, description, priority, tags: tags ? JSON.stringify(tags) : undefined } });
  res.json({ ticket });
});

supportRouter.get('/', async (req, res) => {
  if (req.user!.role === 'ADMIN') {
    const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ items: tickets });
  }
  const mine = await prisma.supportTicket.findMany({ where: { openedByUserId: req.user!.sub }, orderBy: { createdAt: 'desc' } });
  res.json({ items: mine });
});