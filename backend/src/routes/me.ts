import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { requireAuth } from '../services/requireAuth.js';

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get('/', async (req, res) => {
  const userId = req.user!.sub;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      familyProfile: { include: { members: true } },
      caregiverProfile: { include: { documents: true } },
    },
  });
  if (!user) return res.status(404).json({ error: 'not_found' });
  return res.json({ user });
});

const upsertFamilySchema = z.object({
  displayName: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  preferredLanguage: z.string().optional(),
  members: z.array(
    z.object({ id: z.string().optional(), fullName: z.string(), relation: z.string(), birthDate: z.string().optional(), notes: z.string().optional() })
  ).optional(),
});

meRouter.put('/family', async (req, res) => {
  if (req.user!.role !== 'FAMILY') return res.status(403).json({ error: 'forbidden' });
  const parse = upsertFamilySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const userId = req.user!.sub;
  const { displayName, address, city, preferredLanguage, members } = parse.data;
  const profile = await prisma.familyProfile.upsert({
    where: { userId },
    update: { displayName, address, city, preferredLanguage },
    create: { userId, displayName, address, city, preferredLanguage },
  });

  if (members) {
    // naive sync: delete existing and recreate (MVP)
    await prisma.familyMember.deleteMany({ where: { familyId: profile.id } });
    await prisma.familyMember.createMany({
      data: members.map(m => ({
        familyId: profile.id,
        fullName: m.fullName,
        relation: m.relation,
        birthDate: m.birthDate ? new Date(m.birthDate) : undefined,
        notes: m.notes,
      })),
    });
  }

  const updated = await prisma.familyProfile.findUnique({ where: { id: profile.id }, include: { members: true } });
  return res.json({ profile: updated });
});

const upsertCaregiverSchema = z.object({
  fullName: z.string(),
  gender: z.string().optional(),
  languages: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  hourlyRateEgp: z.number().int().positive().optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  availabilityJson: z.string().optional(),
});

meRouter.put('/caregiver', async (req, res) => {
  if (req.user!.role !== 'CAREGIVER') return res.status(403).json({ error: 'forbidden' });
  const parse = upsertCaregiverSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const userId = req.user!.sub;
  const data = parse.data;
  const profile = await prisma.caregiverProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return res.json({ profile });
});