import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculateQuoteTotals, determineTaxMode } from '@/lib/tax-engine';
import { QuoteStatus, QuoteVersion } from '@/types';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const quote = await store.getQuoteById(id);

  if (!quote) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  return NextResponse.json({ quote });
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const existing = await store.getQuoteById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const body = await request.json();
    const lineItems = body.lineItems || existing.lineItems;
    const settings = await store.getSettings();
    const effectiveTaxMode = determineTaxMode(
      body.consigneeState || body.clientState || existing.consigneeState || existing.clientState || 'Rajasthan',
      settings?.state || 'Rajasthan',
      body.consigneeGst || body.clientGst || existing.consigneeGst || existing.clientGst
    );

    const totals = calculateQuoteTotals(
      lineItems,
      effectiveTaxMode,
      body.extraDiscountPercent !== undefined ? body.extraDiscountPercent : existing.totals.extraDiscountPercent,
      body.shipping !== undefined ? body.shipping : existing.totals.shipping
    );

    // If quote was already sent or paid, create a version history snapshot
    let version = existing.version || 1;
    const versionHistory: QuoteVersion[] = existing.versionHistory ? [...existing.versionHistory] : [];

    if (existing.status !== 'Draft') {
      versionHistory.push({
        version: existing.version,
        updatedAt: existing.updatedAt,
        summary: `Version ${existing.version} before update`,
        totals: existing.totals,
      });
      version += 1;
    }

    const updated = await store.updateQuote(id, {
      ...body,
      lineItems,
      taxMode: effectiveTaxMode,
      totals,
      version,
      versionHistory,
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const existing = await store.getQuoteById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, note } = body as { status: QuoteStatus; note?: string };

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const newHistoryEvent = {
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
    };

    const updatedHistory = [...(existing.statusHistory || []), newHistoryEvent];

    const updated = await store.updateQuote(id, {
      status,
      statusHistory: updatedHistory,
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const success = await store.deleteQuote(id);

  if (!success) {
    return NextResponse.json({ error: 'Quotation not found or could not be deleted' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Quotation deleted successfully' });
}
