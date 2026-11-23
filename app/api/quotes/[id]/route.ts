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

  const todayStr = new Date().toISOString().split('T')[0];
  if (
    quote.status !== 'Paid' &&
    quote.status !== 'Accepted' &&
    quote.status !== 'Rejected' &&
    quote.status !== 'Overdue' &&
    quote.validUntil &&
    quote.validUntil < todayStr
  ) {
    quote.status = 'Overdue';
    store.updateQuote(quote.id, {
      status: 'Overdue',
      statusHistory: [
        ...(quote.statusHistory || []),
        {
          status: 'Overdue',
          timestamp: new Date().toISOString(),
          note: `Validity expired on ${quote.validUntil} (Auto-marked Overdue for follow-up)`,
        },
      ],
    }).catch((err) => console.warn('[Auto-Overdue] Failed to persist status:', err));
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
    const isInternational = body.isInternational !== undefined ? body.isInternational : Boolean(existing.isInternational);
    const effectiveTaxMode = isInternational
      ? (body.taxMode || existing.taxMode || 'flat')
      : determineTaxMode(
          body.consigneeState || body.clientState || existing.consigneeState || existing.clientState || 'Rajasthan',
          settings?.state || 'Rajasthan',
          body.consigneeGst || body.clientGst || existing.consigneeGst || existing.clientGst
        );

    const intlDetails = body.internationalDetails !== undefined ? body.internationalDetails : existing.internationalDetails;
    const isZeroRated = Boolean(
      isInternational &&
      (intlDetails?.taxTreatment === 'zero_rated_lut' || (!intlDetails?.taxTreatment && lineItems.every((it: { taxRate?: number }) => !it.taxRate || it.taxRate === 0)))
    );

    const totals = calculateQuoteTotals(
      lineItems,
      effectiveTaxMode,
      body.extraDiscountPercent !== undefined ? body.extraDiscountPercent : existing.totals.extraDiscountPercent,
      body.shipping !== undefined ? body.shipping : existing.totals.shipping,
      isZeroRated,
      body.extraCharges !== undefined ? body.extraCharges : (existing.totals.extraCharges || [])
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

    // Renewal: an Overdue quote whose validity is extended to today or later is live again.
    // Restore its last non-Overdue status (falls back to 'Sent') and log it in the status history.
    const todayStr = new Date().toISOString().split('T')[0];
    const newValidUntil: string | undefined = body.validUntil ?? existing.validUntil;
    const wasOverdue = (body.status ?? existing.status) === 'Overdue';
    const renewed = wasOverdue && Boolean(newValidUntil) && newValidUntil! >= todayStr;
    const renewal: Record<string, unknown> = {};
    if (renewed) {
      const history = existing.statusHistory || [];
      const previous = [...history].reverse().find((h) => h.status !== 'Overdue' && h.status !== 'Draft');
      const restored: QuoteStatus = previous?.status ?? 'Sent';
      renewal.status = restored;
      renewal.statusHistory = [
        ...(body.statusHistory || history),
        {
          status: restored,
          timestamp: new Date().toISOString(),
          note: `Renewed: validity extended to ${newValidUntil}`,
        },
      ];
    }

    const updated = await store.updateQuote(id, {
      ...body,
      lineItems,
      taxMode: effectiveTaxMode,
      totals,
      version,
      versionHistory,
      ...renewal,
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
