import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

app.use(pinoHttp({ logger }));
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined;
app.use(cors({ origin: allowedOrigins ?? true, credentials: Boolean(allowedOrigins) }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/me', meRouter);
import('./routes/caregivers').then(m => app.use('/caregivers', m.caregiversRouter));
import('./routes/bookings').then(m => app.use('/bookings', m.bookingsRouter));
import('./routes/carelogs').then(m => app.use('/carelogs', m.carelogsRouter));
import('./routes/payments').then(m => app.use('/payments', m.paymentsRouter));
import('./routes/support').then(m => app.use('/support', m.supportRouter));
import('./routes/verification').then(m => app.use('/verification', m.verificationRouter));
import('./routes/admin').then(m => app.use('/admin', m.adminRouter));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info({ port }, 'backend listening');
});