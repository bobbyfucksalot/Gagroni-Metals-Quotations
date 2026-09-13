import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculateQuoteTotals } from '@/lib/tax-engine';
import { Quote } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();
    const clientId = searchParams.get('clientId');

    let quotes = await store.getQuotes();

    if (status && status !== 'All') {
      quotes = quotes.filter((q) => q.status.toLowerCase() === status.toLowerCase());
    }

    if (clientId) {
      quotes = quotes.filter((q) => q.clientId === clientId);
    }

    if (search) {
      quotes = quotes.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(search) ||
          q.clientName.toLowerCase().includes(search) ||
          q.title.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ quotes, count: quotes.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientGst,
      issueDate,
      validUntil,
      currency,
      taxMode,
      lineItems,
      corporateFields,
      documentModules,
      notes,
      terms,
      theme,
      signature,
      marketingPage,
    } = body;

    if (!title || !clientName || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Title, client details, and at least one line item are required.' },
        { status: 400 }
      );
    }

    // Compute verified totals server-side
    const totals = calculateQuoteTotals(
      lineItems,
      taxMode || 'gst_intra',
      body.extraDiscountPercent || 0,
      body.shipping || 0
    );

    const now = new Date().toISOString();

    const newQuote = await store.createQuote({
      title,
      clientId: clientId || `cli-temp-${Date.now()}`,
      clientName,
      clientEmail: clientEmail || '',
      clientPhone: clientPhone || '',
      clientAddress: clientAddress || '',
      clientGst: clientGst || '',
      status: 'Draft',
      statusHistory: [
        {
          status: 'Draft',
          timestamp: now,
          note: 'Created initial quotation draft',
        },
      ],
      issueDate: issueDate || now.split('T')[0],
      validUntil: validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      currency: currency || { base: 'INR', export: 'USD', rate: 1 },
      taxMode: taxMode || 'gst_intra',
      lineItems,
      corporateFields: corporateFields || {},
      documentModules: documentModules || { signOff: true, amountInWords: true, hsnCodes: true, productPhotos: false },
      notes: notes || '',
      terms: terms || '',
      totals,
      signature,
      marketingPage: marketingPage || { enabled: false },
      version: 1,
      theme: theme || 'executive',
    });

    return NextResponse.json({ success: true, quote: newQuote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
