import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

const startSchema = z.object({
  provider: z.enum(['PAYMOB', 'FAWRY']),
  amountEgp: z.number().int().positive(),
  bookingId: z.string().optional(),
});

paymentsRouter.post('/start', async (req, res) => {
  if (req.user!.role !== 'FAMILY') return res.status(403).json({ error: 'forbidden' });
  const parse = startSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const family = await prisma.familyProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!family) return res.status(400).json({ error: 'family_profile_required' });
  const { provider, amountEgp, bookingId } = parse.data;
  const payment = await prisma.payment.create({ data: { familyId: family.id, bookingId, provider, amountEgp } });

  // Sandbox stub responses
  if (provider === 'PAYMOB') {
    return res.json({ payment, redirectUrl: `https://accept.paymob.com/sandbox/pay/${payment.id}` });
  } else {
    return res.json({ payment, fawryReference: `FAWRY-${payment.id}` });
  }
});

const webhookSchema = z.object({ provider: z.string(), ref: z.string(), status: z.string() });
paymentsRouter.post('/webhook', async (req, res) => {
  const parse = webhookSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'bad_payload' });
  const { ref, status } = parse.data;
  await prisma.payment.updateMany({ where: { id: ref }, data: { status: status.toUpperCase(), providerRef: ref } });
  res.json({ ok: true });
});