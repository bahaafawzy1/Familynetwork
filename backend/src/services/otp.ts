import crypto from 'crypto';
import dayjs from 'dayjs';
import { prisma } from './prisma.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const smtpTransport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateNumericCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export async function generateOtpAndSend(params: { destination: string; channel: 'sms' | 'whatsapp' | 'email'; purpose: string }) {
  const code = generateNumericCode(6);
  const expiresAt = dayjs().add(10, 'minute').toDate();
  await prisma.otpCode.create({
    data: {
      destination: params.destination,
      channel: params.channel,
      purpose: params.purpose,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  if (params.channel === 'email') {
    if (!smtpTransport) {
      console.log(`[DEV OTP] email to ${params.destination}: ${code}`);
      return;
    }
    await smtpTransport.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@example.com',
      to: params.destination,
      subject: 'Your verification code',
      text: `Your code is ${code}`,
    });
    return;
  }

  // SMS / WhatsApp
  if (!twilioClient) {
    console.log(`[DEV OTP] ${params.channel} to ${params.destination}: ${code}`);
    return;
  }
  const from = params.channel === 'whatsapp' ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;
  const to = params.channel === 'whatsapp' ? `whatsapp:${params.destination}` : params.destination;
  await twilioClient.messages.create({ from, to, body: `Your code is ${code}` });
}

export async function verifyOtpCode(params: { destination: string; code: string; purpose: string }) {
  const recents = await prisma.otpCode.findMany({
    where: { destination: params.destination, purpose: params.purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  const now = new Date();
  for (const otp of recents) {
    if (otp.expiresAt < now) continue;
    if (otp.codeHash === hashCode(params.code)) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
      return true;
    }
  }
  return false;
}