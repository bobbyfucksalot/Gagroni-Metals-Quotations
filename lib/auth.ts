import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AuthSession } from '@/types';
import { connectDB } from './db';
import { SettingModel } from './models';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gagroni-metals-quotation-maker-secure-key-2026-xyz-secret-99'
);

export const COOKIE_NAME = 'quotecraft_session';
export const SESSION_MAX_AGE = 12 * 60 * 60; // 12 hours (43,200 seconds)
export const SESSION_EXPIRATION_STR = '12h';

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
  email: process.env.ADMIN_EMAIL || 'admin@gagronimetals.in',
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10),
  name: 'Gagroni Metals Admin',
  role: 'admin',
};

if (process.env.NODE_ENV !== 'production') {
  globalThis.__adminAccount = DEFAULT_ADMIN;
}

export function getAdminAccount(): AdminAccount {
  return DEFAULT_ADMIN;
}

export async function getAdminAccountAsync(): Promise<AdminAccount> {
  try {
    await connectDB();
    const settings = await SettingModel.findOne({}).lean();
    if (settings && (settings as any).adminPasswordHash) {
      const s = settings as any;
      const account: AdminAccount = {
        email: s.adminEmail || DEFAULT_ADMIN.email,
        passwordHash: s.adminPasswordHash,
        name: s.adminName || DEFAULT_ADMIN.name,
        role: 'admin',
      };
      DEFAULT_ADMIN.email = account.email;
      DEFAULT_ADMIN.name = account.name;
      DEFAULT_ADMIN.passwordHash = account.passwordHash;
      return account;
    }
  } catch (err) {
    console.error('Error loading admin credentials from DB:', err);
  }
  return DEFAULT_ADMIN;
}

export async function updateAdminAccountAsync(updates: { name?: string; passwordHash?: string; email?: string }): Promise<AdminAccount> {
  if (updates.name !== undefined) DEFAULT_ADMIN.name = updates.name;
  if (updates.passwordHash !== undefined) DEFAULT_ADMIN.passwordHash = updates.passwordHash;
  if (updates.email !== undefined) DEFAULT_ADMIN.email = updates.email;

  try {
    await connectDB();
    const updateDoc: Record<string, any> = {};
    if (updates.name !== undefined) {
      updateDoc.adminName = updates.name;
      updateDoc.signatoryName = updates.name;
    }
    if (updates.passwordHash !== undefined) updateDoc.adminPasswordHash = updates.passwordHash;
    if (updates.email !== undefined) updateDoc.adminEmail = updates.email;

    await SettingModel.findOneAndUpdate({}, { $set: updateDoc }, { upsert: true, new: true });
  } catch (err) {
    console.error('Error saving admin credentials to DB:', err);
  }

  return DEFAULT_ADMIN;
}

export function updateAdminAccount(updates: { name?: string; passwordHash?: string; email?: string }): AdminAccount {
  if (updates.name !== undefined) DEFAULT_ADMIN.name = updates.name;
  if (updates.passwordHash !== undefined) DEFAULT_ADMIN.passwordHash = updates.passwordHash;
  if (updates.email !== undefined) DEFAULT_ADMIN.email = updates.email;
  updateAdminAccountAsync(updates).catch(() => {});
  return DEFAULT_ADMIN;
}

export async function createSession(email: string, name: string): Promise<string> {
  const token = await new SignJWT({ email, name, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION_STR) // 12 hours active session
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
  const admin = await getAdminAccountAsync();
  return bcrypt.compare(password, admin.passwordHash);
}

