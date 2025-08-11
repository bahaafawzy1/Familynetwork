import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { generateOtpAndSend, verifyOtpCode } from '../services/otp.js';
import { signJwt } from '../services/jwt.js';
export const authRouter = Router();
const requestOtpSchema = z.object({
    phoneE164: z.string().optional(),
    email: z.string().email().optional(),
    purpose: z.enum(['login', 'verify_phone', 'verify_email']).default('login'),
    channel: z.enum(['sms', 'whatsapp', 'email']).optional(),
}).refine((d) => !!(d.phoneE164 || d.email), { message: 'phoneE164_or_email_required' });
authRouter.post('/request-otp', async (req, res) => {
    const parse = requestOtpSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { phoneE164, email, purpose } = parse.data;
    try {
        const destination = phoneE164 ?? email;
        const channel = phoneE164 ? 'sms' : 'email';
        await generateOtpAndSend({ destination, channel, purpose });
        return res.json({ ok: true });
    }
    catch (err) {
        req.log.error(err, 'request-otp failed');
        return res.status(500).json({ error: 'failed_to_send_otp' });
    }
});
const verifyOtpSchema = z.object({
    phoneE164: z.string().optional(),
    email: z.string().email().optional(),
    code: z.string().min(4).max(8),
    role: z.enum(['FAMILY', 'CAREGIVER', 'ADMIN']).optional(),
}).refine((d) => !!(d.phoneE164 || d.email), { message: 'phoneE164_or_email_required' });
authRouter.post('/verify-otp', async (req, res) => {
    const parse = verifyOtpSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { phoneE164, email, code, role } = parse.data;
    const destination = phoneE164 ?? email;
    try {
        const ok = await verifyOtpCode({ destination, code, purpose: 'login' });
        if (!ok)
            return res.status(401).json({ error: 'invalid_code' });
        // Prevent privilege escalation for ADMIN
        let requestedRole = role ?? 'FAMILY';
        if (requestedRole === 'ADMIN') {
            const exists = await prisma.user.findFirst({
                where: {
                    role: 'ADMIN',
                    OR: [email ? { email } : undefined, phoneE164 ? { phoneE164 } : undefined].filter(Boolean),
                },
            });
            if (!exists)
                requestedRole = 'FAMILY';
        }
        // Upsert user
        const user = await prisma.user.upsert({
            where: email ? { email } : { phoneE164 },
            update: {
                lastLoginAt: new Date(),
                isPhoneVerified: phoneE164 ? true : undefined,
                isEmailVerified: email ? true : undefined,
            },
            create: {
                email: email ?? undefined,
                phoneE164: phoneE164 ?? undefined,
                role: requestedRole,
                isPhoneVerified: !!phoneE164,
                isEmailVerified: !!email,
            },
        });
        const token = signJwt({ sub: user.id, role: user.role });
        return res.json({ token, user: { id: user.id, role: user.role, email: user.email, phoneE164: user.phoneE164, status: user.status } });
    }
    catch (err) {
        req.log.error(err, 'verify-otp failed');
        return res.status(500).json({ error: 'verify_failed' });
    }
});
