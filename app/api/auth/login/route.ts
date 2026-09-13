import { NextResponse } from 'next/server';
import { createSession, verifyCredentials, COOKIE_NAME, getAdminAccount, SESSION_MAX_AGE } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const currentAdmin = getAdminAccount();
    const trimmedEmail = email.trim().toLowerCase();
    const adminEmail = currentAdmin.email.toLowerCase();

    const allowedEmails = new Set([
      adminEmail,
      'admin@gagronimetals.in',
      'admin@metals.co',
      (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    ].filter(Boolean));

    // Check email and password match
    const isValidPassword = await verifyCredentials(password);
    if (!allowedEmails.has(trimmedEmail) || !isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createSession(currentAdmin.email, currentAdmin.name);

    const response = NextResponse.json({
      success: true,
      user: {
        email: currentAdmin.email,
        name: currentAdmin.name,
        role: currentAdmin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE, // 12 hours (43,200 seconds)
      expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
