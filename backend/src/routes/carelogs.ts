import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';

export const carelogsRouter = Router();
carelogsRouter.use(requireAuth);

const submitSchema = z.object({
  bookingId: z.string(),
  meals: z.any().optional(), // send JSON payloads
  medication: z.any().optional(),
  mood: z.string().optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

carelogsRouter.post('/', async (req, res) => {
  if (req.user!.role !== 'CAREGIVER') return res.status(403).json({ error: 'forbidden' });
  const parse = submitSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!caregiver) return res.status(400).json({ error: 'caregiver_profile_required' });
  const { bookingId, meals, medication, mood, photos, notes } = parse.data;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.caregiverId !== caregiver.id) return res.status(403).json({ error: 'forbidden' });
  const carelog = await prisma.careLog.create({
    data: {
      bookingId,
      caregiverId: caregiver.id,
      familyId: booking.familyId,
      meals: meals ? JSON.stringify(meals) : undefined,
      medication: medication ? JSON.stringify(medication) : undefined,
      mood,
      photos: photos ? JSON.stringify(photos) : undefined,
      notes,
    },
  });
  res.json({ carelog });
});

carelogsRouter.get('/booking/:id', async (req, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ error: 'not_found' });
  const family = await prisma.familyProfile.findUnique({ where: { userId: req.user!.sub } });
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!family && !caregiver) return res.status(403).json({ error: 'forbidden' });
  if (family && booking.familyId !== family.id) return res.status(403).json({ error: 'forbidden' });
  if (caregiver && booking.caregiverId !== caregiver.id) return res.status(403).json({ error: 'forbidden' });
  const logs = await prisma.careLog.findMany({ where: { bookingId: id }, orderBy: { createdAt: 'desc' } });
  res.json({ items: logs });
});