import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');

    let clients = await store.getClients();

    if (category && category !== 'All') {
      clients = clients.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.contactPerson.toLowerCase().includes(search) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          c.taxId.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ clients, count: clients.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contactPerson, email, phone, billingAddress, taxId, category, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client company name is required.' }, { status: 400 });
    }

    const newClient = await store.createClient({
      name: name.trim(),
      contactPerson: contactPerson || '',
      email: email ? email.trim() : '',
      phone: phone || '',
      billingAddress: billingAddress || '',
      taxId: taxId || '',
      category: category || 'Commercial',
      notes: notes || '',
    });

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
