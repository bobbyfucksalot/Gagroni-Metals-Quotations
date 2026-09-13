import { NextResponse } from 'next/server';
import { getSession, getAdminAccount } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let name = session.user.name;
  if (!name || name === 'Aarav Kapoor') {
    try {
      const settings = await store.getSettings();
      if (settings?.signatoryName && settings.signatoryName !== 'Aarav Kapoor') {
        name = settings.signatoryName;
      } else {
        name = getAdminAccount().name || 'Faizan Uddin';
      }
    } catch {
      name = getAdminAccount().name || 'Faizan Uddin';
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...session.user,
      name,
    },
  });
}
