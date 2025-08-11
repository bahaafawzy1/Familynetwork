import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { requireAuth } from '../services/requireAuth';

export const verificationRouter = Router();
verificationRouter.use(requireAuth);

const statusSchema = z.object({ documentId: z.string(), status: z.enum(['PENDING','APPROVED','REJECTED']) });

// Admin updates document verification status
verificationRouter.post('/document/status', async (req, res) => {
  if (req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  const parse = statusSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const updated = await prisma.document.update({ where: { id: parse.data.documentId }, data: { status: parse.data.status } });
  res.json({ document: updated });
});

// Stub: Azure Face API compare ID vs selfie - will be implemented later
const faceSchema = z.object({ caregiverUserId: z.string(), idImageUrl: z.string().url(), selfieUrl: z.string().url() });
verificationRouter.post('/face/compare', async (req, res) => {
  if (req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' });
  const parse = faceSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  // For MVP: pretend success and set caregiver verificationStatus to VERIFIED
  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: parse.data.caregiverUserId } });
  if (!caregiver) return res.status(404).json({ error: 'not_found' });
  const updated = await prisma.caregiverProfile.update({ where: { id: caregiver.id }, data: { verificationStatus: 'VERIFIED' } });
  res.json({ ok: true, caregiver: updated });
});