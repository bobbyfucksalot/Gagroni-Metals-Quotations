import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculateQuoteTotals, determineTaxMode } from '@/lib/tax-engine';
import { Quote } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();
    const clientId = searchParams.get('clientId');

    const todayStr = new Date().toISOString().split('T')[0];
    let quotes = await store.getQuotes();

    // Automatically detect expired validity and transition to Overdue
    for (const q of quotes) {
      if (
        q.status !== 'Paid' &&
        q.status !== 'Accepted' &&
        q.status !== 'Rejected' &&
        q.status !== 'Overdue' &&
        q.validUntil &&
        q.validUntil < todayStr
      ) {
        q.status = 'Overdue';
        store.updateQuote(q.id, {
          status: 'Overdue',
          statusHistory: [
            ...(q.statusHistory || []),
            {
              status: 'Overdue',
              timestamp: new Date().toISOString(),
              note: `Validity expired on ${q.validUntil} (Auto-marked Overdue for follow-up)`,
            },
          ],
        }).catch((err) => console.warn('[Auto-Overdue] Failed to persist status:', err));
      }
    }

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

    const settings = await store.getSettings();
    const effectiveTaxMode = determineTaxMode(
      body.consigneeState || body.clientState || 'Rajasthan',
      settings?.state || 'Rajasthan',
      body.consigneeGst || body.clientGst
    );

    // Compute verified totals server-side with automatic taxMode
    const totals = calculateQuoteTotals(
      lineItems,
      effectiveTaxMode,
      body.extraDiscountPercent || 0,
      body.shipping || 0
    );

    const now = new Date().toISOString();

    const newQuote = await store.createQuote({
      ...body,
      title,
      clientId: clientId || `cli-temp-${Date.now()}`,
      clientName,
      clientContactPerson: body.clientContactPerson || '',
      clientEmail: clientEmail || '',
      clientPhone: clientPhone || '',
      clientAddress: clientAddress || '',
      clientGst: clientGst || '',
      clientState: body.clientState || 'Rajasthan',
      clientStateCode: body.clientStateCode || '08',
      consigneeName: body.consigneeName || clientName,
      consigneeAddress: body.consigneeAddress || clientAddress || '',
      consigneeGst: body.consigneeGst || clientGst || '',
      consigneeState: body.consigneeState || body.clientState || 'Rajasthan',
      consigneeStateCode: body.consigneeStateCode || body.clientStateCode || '08',
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
      taxMode: effectiveTaxMode,
      lineItems,
      corporateFields: corporateFields || {},
      documentModules: documentModules || { dualSignOff: false, amountInWords: true, hsnCodes: true, thumbnails: true },
      notes: notes || '',
      terms: terms || '',
      totals,
      signature,
      marketingPage: marketingPage || { enabled: false },
      version: 1,
      theme: theme || 'tally',
    });

    return NextResponse.json({ success: true, quote: newQuote }, { status: 201 });
  } catch (err: any) {
    console.error('[API Quotes POST Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create quote' }, { status: 500 });
  }
}
