import { Router } from 'express';
import { prisma } from '../services/prisma';

export const caregiversRouter = Router();

caregiversRouter.get('/', async (req, res) => {
  const { q, city, language, specialty, minRate, maxRate, page = '1', pageSize = '10' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(pageSize || '10', 10), 50);
  const skip = (Math.max(parseInt(page || '1', 10), 1) - 1) * take;

  // SQLite LIKE search on fullName/bio
  const where: any = { verificationStatus: 'VERIFIED' };
  if (city) where.city = city;
  if (minRate) where.hourlyRateEgp = { gte: Number(minRate) };
  if (maxRate) where.hourlyRateEgp = { ...(where.hourlyRateEgp || {}), lte: Number(maxRate) };

  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { bio: { contains: q } },
    ];
  }

  const all = await prisma.caregiverProfile.findMany({ where, skip, take, orderBy: { ratingAvg: 'desc' } });
  // Filter language/specialty by parsing JSON text
  const filtered = all.filter((c) => {
    try {
      const langs: string[] = JSON.parse(c.languages || '[]');
      const specs: string[] = JSON.parse(c.specialties || '[]');
      if (language && !langs.includes(language)) return false;
      if (specialty && !specs.includes(specialty)) return false;
      return true;
    } catch {
      return false;
    }
  });

  res.json({ items: filtered, page: Number(page), pageSize: take });
});