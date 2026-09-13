import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, getAdminAccount, updateAdminAccount, createSession, COOKIE_NAME } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminAccount();
    return NextResponse.json({
      success: true,
      profile: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch admin profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword, confirmPassword } = body;

    const admin = getAdminAccount();
    let isNameChanged = false;
    let isEmailChanged = false;
    let isPasswordChanged = false;

    // 1. Update Name if provided
    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length > 0 && trimmedName !== admin.name) {
        updateAdminAccount({ name: trimmedName });
        isNameChanged = true;

        // Also sync signatoryName in settings so quotation signatories match
        try {
          const settings = await store.getSettings();
          if (settings) {
            await store.updateSettings({ signatoryName: trimmedName });
          }
        } catch {
          // ignore if settings not loaded
        }
      }
    }

    // 2. Update Email if provided
    if (email && typeof email === 'string') {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json({ error: 'Please provide a valid email address format' }, { status: 400 });
      }

      if (trimmedEmail !== admin.email.toLowerCase()) {
        updateAdminAccount({ email: trimmedEmail });
        isEmailChanged = true;
      }
    }

    // 3. Update Password if requested
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Current password does not match' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New password and confirmation do not match' }, { status: 400 });
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      updateAdminAccount({ passwordHash: newHash });
      isPasswordChanged = true;
    }

    if (!isNameChanged && !isEmailChanged && !isPasswordChanged) {
      return NextResponse.json({ success: true, message: 'No changes detected' });
    }

    // Re-issue JWT session cookie with updated credentials
    const updatedAdmin = getAdminAccount();
    const token = await createSession(updatedAdmin.email, updatedAdmin.name);

    const changes = [];
    if (isNameChanged) changes.push('Name');
    if (isEmailChanged) changes.push('Login Email');
    if (isPasswordChanged) changes.push('Password');

    const response = NextResponse.json({
      success: true,
      message: `Admin ${changes.join(' & ')} updated successfully!`,
      profile: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to update admin profile' }, { status: 500 });
  }
}
