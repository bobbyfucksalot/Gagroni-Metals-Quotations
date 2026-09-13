import { NextResponse } from 'next/server';
import { createSession, verifyCredentials, COOKIE_NAME, getAdminAccount } from '@/lib/auth';

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

    // Check email and password match
    const isValidPassword = await verifyCredentials(password);
    if (trimmedEmail !== adminEmail || !isValidPassword) {
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
