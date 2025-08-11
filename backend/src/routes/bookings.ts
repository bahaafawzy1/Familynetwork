import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

const createSchema = z.object({
  caregiverId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.enum(['HOURLY', 'SHIFT']).default('HOURLY'),
  notes: z.string().optional(),
  priceEgp: z.number().int().positive().optional(),
});

bookingsRouter.post('/', async (req, res) => {
  if (req.user!.role !== 'FAMILY') return res.status(403).json({ error: 'forbidden' });
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const family = await prisma.familyProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!family) return res.status(400).json({ error: 'family_profile_required' });
  const { caregiverId, startTime, endTime, type, notes, priceEgp } = parse.data;
  const booking = await prisma.booking.create({
    data: {
      familyId: family.id,
      caregiverId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      type,
      notes,
      priceEgp,
    },
  });
  res.json({ booking });
});

const updateStatusSchema = z.object({ status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELED']).default('ACCEPTED') });

bookingsRouter.post('/:id/accept', async (req, res) => {
  if (req.user!.role !== 'CAREGIVER') return res.status(403).json({ error: 'forbidden' });
  const { id } = req.params;
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!caregiver) return res.status(400).json({ error: 'caregiver_profile_required' });
  const updated = await prisma.booking.update({ where: { id }, data: { status: 'ACCEPTED' } });
  if (updated.caregiverId !== caregiver.id) return res.status(403).json({ error: 'forbidden' });
  res.json({ booking: updated });
});

bookingsRouter.post('/:id/decline', async (req, res) => {
  if (req.user!.role !== 'CAREGIVER') return res.status(403).json({ error: 'forbidden' });
  const { id } = req.params;
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!caregiver) return res.status(400).json({ error: 'caregiver_profile_required' });
  const updated = await prisma.booking.update({ where: { id }, data: { status: 'DECLINED' } });
  if (updated.caregiverId !== caregiver.id) return res.status(403).json({ error: 'forbidden' });
  res.json({ booking: updated });
});

bookingsRouter.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ error: 'not_found' });
  const family = await prisma.familyProfile.findUnique({ where: { userId: req.user!.sub } });
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!family && !caregiver) return res.status(403).json({ error: 'forbidden' });
  if (family && booking.familyId !== family.id) return res.status(403).json({ error: 'forbidden' });
  if (caregiver && booking.caregiverId !== caregiver.id) return res.status(403).json({ error: 'forbidden' });
  const updated = await prisma.booking.update({ where: { id }, data: { status: 'CANCELED' } });
  res.json({ booking: updated });
});

const rescheduleSchema = z.object({ startTime: z.string(), endTime: z.string() });
bookingsRouter.post('/:id/reschedule', async (req, res) => {
  const parse = rescheduleSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ error: 'not_found' });
  const family = await prisma.familyProfile.findUnique({ where: { userId: req.user!.sub } });
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!family && !caregiver) return res.status(403).json({ error: 'forbidden' });
  if (family && booking.familyId !== family.id) return res.status(403).json({ error: 'forbidden' });
  if (caregiver && booking.caregiverId !== caregiver.id) return res.status(403).json({ error: 'forbidden' });
  const updated = await prisma.booking.update({ where: { id }, data: { status: 'RESCHEDULED', startTime: new Date(parse.data.startTime), endTime: new Date(parse.data.endTime) } });
  res.json({ booking: updated });
});

bookingsRouter.get('/mine', async (req, res) => {
  const family = await prisma.familyProfile.findUnique({ where: { userId: req.user!.sub } });
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!family && !caregiver) return res.status(403).json({ error: 'forbidden' });
  const where = family ? { familyId: family.id } : { caregiverId: caregiver!.id };
  const items = await prisma.booking.findMany({ where, orderBy: { startTime: 'desc' } });
  res.json({ items });
});