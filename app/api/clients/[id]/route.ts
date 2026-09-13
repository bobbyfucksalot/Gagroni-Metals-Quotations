import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const client = await store.getClientById(id);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Also include historical quotes for this client
  const allQuotes = await store.getQuotes();
  const quotes = allQuotes.filter((q) => q.clientId === id || q.clientName.toLowerCase() === client.name.toLowerCase());

  return NextResponse.json({ client, quotes });
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    const updated = await store.updateClient(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const success = await store.deleteClient(id);

  if (!success) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Client deleted successfully' });
}
