import { NextResponse } from 'next/server';
import { getLiveExchangeRates, SUPPORTED_CURRENCIES } from '@/lib/currency';

export async function GET() {
  try {
    const rates = await getLiveExchangeRates();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      base: 'INR',
      currencies: SUPPORTED_CURRENCIES,
      rates,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve currency exchange rates' }, { status: 500 });
  }
}
