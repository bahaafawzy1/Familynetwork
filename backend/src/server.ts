import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/me', meRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info({ port }, 'backend listening');
});