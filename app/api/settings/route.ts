import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const settings = await store.getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await store.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
