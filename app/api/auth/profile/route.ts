import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, getAdminAccountAsync, updateAdminAccountAsync, createSession, COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await getAdminAccountAsync();
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
    const { name, email, currentPassword, newPassword, confirmPassword, isReset, resetToDefault } = body;

    const admin = await getAdminAccountAsync();
    let isNameChanged = false;
    let isEmailChanged = false;
    let isPasswordChanged = false;
    let resetMessage = '';

    // 1. Update Name if provided
    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length > 0 && trimmedName !== admin.name) {
        await updateAdminAccountAsync({ name: trimmedName });
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
        await updateAdminAccountAsync({ email: trimmedEmail });
        isEmailChanged = true;
      }
    }

    // 3. Reset Password to Default
    if (resetToDefault) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const newHash = await bcrypt.hash(defaultPassword, 10);
      await updateAdminAccountAsync({ passwordHash: newHash });
      isPasswordChanged = true;
      resetMessage = `Password has been reset to default (${defaultPassword})`;
    }
    // 4. Direct Password Reset (Authenticated admin reset without requiring old password)
    else if (isReset) {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New password and confirmation do not match' }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await updateAdminAccountAsync({ passwordHash: newHash });
      isPasswordChanged = true;
      resetMessage = 'Password has been reset successfully!';
    }
    // 5. Standard Password Change (Requires current password verification)
    else if (newPassword || currentPassword) {
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

      const newHash = await bcrypt.hash(newPassword, 10);
      await updateAdminAccountAsync({ passwordHash: newHash });
      isPasswordChanged = true;
    }

    if (!isNameChanged && !isEmailChanged && !isPasswordChanged) {
      return NextResponse.json({ success: true, message: 'No changes detected' });
    }

    // Re-issue JWT session cookie with updated credentials
    const updatedAdmin = await getAdminAccountAsync();
    const token = await createSession(updatedAdmin.email, updatedAdmin.name);

    const changes = [];
    if (isNameChanged) changes.push('Name');
    if (isEmailChanged) changes.push('Login Email');
    if (isPasswordChanged) changes.push('Password');

    const finalMessage = resetMessage || `Admin ${changes.join(' & ')} updated successfully!`;

    const response = NextResponse.json({
      success: true,
      message: finalMessage,
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
      maxAge: SESSION_MAX_AGE, // 12 hours
      expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to update admin profile' }, { status: 500 });
  }
}
