import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import db from './db.ts';

const EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : EPHEMERAL_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) {
    return false;
  }
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function constantTimeEqualText(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role: 'customer' | 'admin';
  exp: number;
}

export function signToken(user: { user_id: number; email: string; role: 'customer' | 'admin' }): string {
  const payload: TokenPayload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) {
    return null;
  }
  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf-8');
  const expectedBuf = Buffer.from(expectedSig, 'utf-8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as TokenPayload;
    if (!decoded || typeof decoded.user_id !== 'number' || typeof decoded.exp !== 'number') {
      return null;
    }
    if (decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export interface AuthenticatedUser {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  const user = db
    .prepare('SELECT user_id, name, email, phone, address, role, created_at FROM Users WHERE user_id = ?')
    .get(payload.user_id) as AuthenticatedUser | undefined;

  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return;
  }
  next();
}
