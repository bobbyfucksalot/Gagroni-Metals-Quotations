import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AuthSession } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gagroni-metals-quotation-maker-secure-key-2026-xyz-secret-99'
);

export const COOKIE_NAME = 'quotecraft_session';

export interface AdminAccount {
  email: string;
  passwordHash: string;
  name: string;
  role: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __adminAccount: AdminAccount | undefined;
}

export const DEFAULT_ADMIN: AdminAccount = globalThis.__adminAccount || {
  email: process.env.ADMIN_EMAIL || 'admin@metals.co',
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
  name: 'Aarav Kapoor',
  role: 'admin',
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.__adminAccount = DEFAULT_ADMIN;
}

export function getAdminAccount(): AdminAccount {
  return DEFAULT_ADMIN;
}

export function updateAdminAccount(updates: { name?: string; passwordHash?: string; email?: string }): AdminAccount {
  if (updates.name !== undefined) DEFAULT_ADMIN.name = updates.name;
  if (updates.passwordHash !== undefined) DEFAULT_ADMIN.passwordHash = updates.passwordHash;
  if (updates.email !== undefined) DEFAULT_ADMIN.email = updates.email;
  return DEFAULT_ADMIN;
}

export async function createSession(email: string, name: string): Promise<string> {
  const token = await new SignJWT({ email, name, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    return {
      user: {
        email: String(payload.email || ''),
        name: String(payload.name || ''),
        role: String(payload.role || 'admin'),
      },
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function verifyCredentials(password: string): Promise<boolean> {
  return bcrypt.compare(password, DEFAULT_ADMIN.passwordHash);
}
