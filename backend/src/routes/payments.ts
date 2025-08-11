import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';
import { paymobStart, fawryStart } from '../services/payments';

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

  if (provider === 'PAYMOB') {
    const { iframeUrl } = await paymobStart(amountEgp, payment.id);
    return res.json({ payment, redirectUrl: iframeUrl });
  } else {
    const { payload } = fawryStart(amountEgp, payment.id);
    return res.json({ payment, fawry: payload });
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