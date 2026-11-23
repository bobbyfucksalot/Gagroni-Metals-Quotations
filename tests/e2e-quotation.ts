import { calculateQuoteTotals, describeTaxRates, determineTaxMode, getGstStateCode, formatINR, numberToIndianWords } from '../lib/tax-engine';
import { formatCurrency, numberToInternationalWords } from '../lib/currency';
import { store } from '../lib/store';
import type { LineItem, ExtraCharge, Quote } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}`);
    if (details) console.error('    Details:', details);
    failed++;
  }
}

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('   GAGRONI METALS QUOTATION SYSTEM - E2E TEST SUITE   ');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Domestic Intra-State Quotation (Rajasthan to Rajasthan)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Domestic Intra-State Quotation (Rajasthan) ---');
  const items1: LineItem[] = [
    {
      id: 'item-1',
      name: 'Stainless Steel Sheet 304 Grade',
      description: '2mm thickness, 2B finish',
      hsnCode: '7219',
      qty: 2,
      unit: 'nos',
      unitPrice: 50000,
      taxRate: 18,
      total: 100000,
    },
  ];

  const taxMode1 = determineTaxMode('Rajasthan', 'Rajasthan');
  assert(taxMode1 === 'gst_intra', 'Tax mode should be gst_intra for Rajasthan buyer');

  const totals1 = calculateQuoteTotals(items1, taxMode1, 5, 2000, false, []);
  assert(totals1.subtotal === 100000, 'Subtotal should be 100,000', totals1.subtotal);
  assert(totals1.extraDiscountAmount === 5000, '5% extra discount should be 5,000', totals1.extraDiscountAmount);
  assert(totals1.taxableAmount === 95000, 'Taxable amount should be 95,000', totals1.taxableAmount);
  assert(totals1.cgst === 8550, 'CGST 9% should be 8,550', totals1.cgst);
  assert(totals1.sgst === 8550, 'SGST 9% should be 8,550', totals1.sgst);
  assert(totals1.igst === 0, 'IGST should be 0', totals1.igst);
  assert(totals1.totalTax === 17100, 'Total tax should be 17,100', totals1.totalTax);
  assert(totals1.grandTotal === 114100, 'Grand total should be 114,100 (95000 + 17100 + 2000 shipping)', totals1.grandTotal);
  assert(totals1.amountInWords.includes('One Lakh Fourteen Thousand One Hundred'), 'Amount in words contains correct text', totals1.amountInWords);

  // -------------------------------------------------------------------------
  // TEST 2: Domestic Inter-State Quotation (Rajasthan to Maharashtra)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Domestic Inter-State Quotation (Maharashtra) ---');
  const taxMode2 = determineTaxMode('Maharashtra', 'Rajasthan', '27AABCA1234A1Z1');
  assert(taxMode2 === 'gst_inter', 'Tax mode should be gst_inter for Maharashtra GSTIN');

  const items2: LineItem[] = [
    {
      id: 'item-2',
      name: 'Industrial Metal Framework',
      description: 'Custom powder coated',
      hsnCode: '730890',
      qty: 1,
      unit: 'set',
      unitPrice: 200000,
      taxRate: 18,
      total: 200000,
    },
  ];
  const totals2 = calculateQuoteTotals(items2, taxMode2, 0, 0, false, []);
  assert(totals2.cgst === 0, 'CGST should be 0 in inter-state', totals2.cgst);
  assert(totals2.sgst === 0, 'SGST should be 0 in inter-state', totals2.sgst);
  assert(totals2.igst === 36000, 'IGST 18% should be 36,000', totals2.igst);
  assert(totals2.grandTotal === 236000, 'Grand total should be 236,000', totals2.grandTotal);

  // -------------------------------------------------------------------------
  // TEST 3: International Quotation with 0.1% Concessional IGST
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: International Quotation with 0.1% Concessional Tax ---');
  const items3: LineItem[] = [
    {
      id: 'item-3a',
      name: 'Stainless Steel Flanges Export Grade',
      description: 'ASTM A182 F304',
      hsnCode: '7307',
      qty: 2,
      unit: 'nos',
      unitPrice: 100000,
      taxRate: 0.1, // 0.1% Concessional
      total: 200000,
    },
  ];
  const extraCharges3: ExtraCharge[] = [
    { id: 'ch-1', name: 'Export Sea-Worthy Packaging', amount: 10000 },
  ];

  // International state detection
  const foreignCode = getGstStateCode('Dubai, UAE');
  assert(foreignCode === '96', 'Dubai should resolve to 96 (Other Country), NOT 08 (Rajasthan)', foreignCode);

  const foreignTaxMode = determineTaxMode('Dubai, UAE', 'Rajasthan');
  assert(foreignTaxMode === 'gst_inter', 'Foreign country should resolve to gst_inter, NOT gst_intra', foreignTaxMode);

  // Totals calculation with 0.1% and extra charge
  const totals3 = calculateQuoteTotals(items3, 'flat', 0, 0, false, extraCharges3);
  assert(totals3.subtotal === 200000, 'Subtotal should be 200,000', totals3.subtotal);
  assert(totals3.taxableAmount === 200000, 'Taxable amount should be 200,000', totals3.taxableAmount);
  // Item tax: 200,000 * 0.1% = 200
  // Extra charge tax: 10,000 * 0.1% = 10
  // Total tax: 210
  assert(totals3.totalTax === 210, '0.1% tax on 200,000 items + 10,000 packaging should equal 210', totals3.totalTax);
  assert(totals3.igst === 210, 'IGST should be 210', totals3.igst);
  assert(totals3.cgst === 0 && totals3.sgst === 0, 'CGST and SGST must be 0 for export', { cgst: totals3.cgst, sgst: totals3.sgst });
  assert(totals3.grandTotal === 210210, 'Grand total should be 210,210', totals3.grandTotal);

  // Tax rates label
  const rates3 = describeTaxRates(items3, extraCharges3, false);
  assert(rates3.full === '0.1%', 'Tax rate label must be 0.1% (not mixed rates)', rates3.full);

  // Currency conversion formatting & Words
  const usdRate = 0.01156;
  const grandTotalUSD = totals3.grandTotal * usdRate;
  const formattedUSD = formatCurrency(grandTotalUSD, 'USD');
  assert(formattedUSD.startsWith('$'), 'Formatted USD starts with $', formattedUSD);

  const wordsUSD = numberToInternationalWords(grandTotalUSD, 'USD');
  assert(wordsUSD.startsWith('US Dollars'), 'Words in international format begins with US Dollars', wordsUSD);

  // -------------------------------------------------------------------------
  // TEST 4: International Quotation with Zero-Rated (0% GST under LUT)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: International Quotation with Zero-Rated LUT (0% GST) ---');
  const items4: LineItem[] = [
    {
      id: 'item-4',
      name: 'Custom Fabricated Structure for US Client',
      description: 'Full container shipment',
      hsnCode: '730890',
      qty: 1,
      unit: 'lot',
      unitPrice: 500000,
      taxRate: 0,
      total: 500000,
    },
  ];
  const totals4 = calculateQuoteTotals(items4, 'flat', 0, 0, true, []);
  assert(totals4.totalTax === 0, 'Zero-Rated LUT total tax must be 0', totals4.totalTax);
  assert(totals4.igst === 0, 'Zero-Rated LUT IGST must be 0', totals4.igst);
  assert(totals4.grandTotal === 500000, 'Grand total matches taxable amount with zero tax', totals4.grandTotal);

  // -------------------------------------------------------------------------
  // TEST 5: Quotation Duplication (Testing quoteNumber collision fix)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Quotation Persistence & Duplication (Collision Fix) ---');
  const originalQuote = await store.createQuote({
    title: 'High Tech CNC Metal Components',
    clientName: 'GLOBAL EXPORTS FZE',
    clientEmail: 'contact@globalexports.ae',
    clientPhone: '+971501234567',
    clientAddress: 'Warehouse 14, JAFZA, Dubai',
    clientState: 'Dubai, UAE',
    clientStateCode: '96',
    isInternational: true,
    internationalDetails: {
      country: 'United Arab Emirates',
      currency: 'AED',
      taxTreatment: 'concessional_0_1',
    },
    currency: { base: 'INR', export: 'AED', rate: 0.0425 },
    issueDate: '2026-11-23',
    validUntil: '2026-12-08',
    taxMode: 'flat',
    lineItems: items3,
    corporateFields: {},
    documentModules: { dualSignOff: false, amountInWords: true, hsnCodes: true, thumbnails: true },
    notes: 'Commercial terms',
    terms: 'Payment 100% advance',
    theme: 'tally',
    status: 'Draft',
    statusHistory: [],
    version: 1,
    totals: totals3,
  });

  assert(!!originalQuote.id, 'Original quote created with unique ID', originalQuote.id);
  assert(!!originalQuote.quoteNumber, 'Original quote assigned quoteNumber', originalQuote.quoteNumber);

  // Simulate Duplicate Action: clean source and pass to store.createQuote
  const { id: _oldId, quoteNumber: _oldNum, createdAt: _cAt, updatedAt: _uAt, ...cleanSource } = originalQuote as any;
  const duplicatedQuote = await store.createQuote({
    ...cleanSource,
    title: `${originalQuote.title} (Copy)`,
    quoteNumber: undefined, // Enforced fresh generation
  });

  assert(!!duplicatedQuote.id, 'Duplicated quote created successfully', duplicatedQuote.id);
  assert(duplicatedQuote.id !== originalQuote.id, 'Duplicated quote has different unique ID', {
    orig: originalQuote.id,
    dupe: duplicatedQuote.id,
  });
  assert(duplicatedQuote.quoteNumber !== originalQuote.quoteNumber, 'Duplicated quote gets NEW unique quoteNumber (NO collision)', {
    orig: originalQuote.quoteNumber,
    dupe: duplicatedQuote.quoteNumber,
  });
  assert(duplicatedQuote.title.includes('(Copy)'), 'Duplicated quote title contains (Copy)', duplicatedQuote.title);
  assert(duplicatedQuote.totals.totalTax === 210, 'Duplicated quote retains 0.1% tax calculations', duplicatedQuote.totals.totalTax);

  // -------------------------------------------------------------------------
  // TEST 6: Quotation Revision & Version Snapshotting
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Quotation Revision & Version Snapshotting ---');
  const updatedTotals = calculateQuoteTotals(items3, 'flat', 10, 0, false, extraCharges3); // 10% extra discount
  const updatedQuote = await store.updateQuote(originalQuote.id, {
    extraDiscountPercent: 10,
    totals: updatedTotals,
  });

  assert(updatedQuote !== null, 'Quotation updated successfully');
  if (updatedQuote) {
    assert(updatedQuote.totals.extraDiscountPercent === 10, 'Extra discount updated to 10%', updatedQuote.totals.extraDiscountPercent);
    assert(updatedQuote.totals.taxableAmount === 180000, 'Taxable amount updated to 180,000 (after 10% disc)', updatedQuote.totals.taxableAmount);
    // Taxable items: 180,000 * 0.1% = 180. Extra charges: 10,000 * 0.1% = 10. Total tax: 190.
    assert(updatedQuote.totals.totalTax === 190, 'Updated 0.1% tax is 190', updatedQuote.totals.totalTax);
  }

  // -------------------------------------------------------------------------
  // TEST 7: WhatsApp Share URL Generator for International & Domestic
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: WhatsApp Sharing URL Generation ---');
  function buildWhatsAppUrl(phone: string, clientName: string, quoteNumber: string, totalStr: string): string {
    const clean = phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = clean.length === 10 ? `91${clean}` : clean;
    const msg = `Namaste ${clientName},\nQuotation No: ${quoteNumber}\nTotal Value: ${totalStr}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  }

  // Indian number without 91
  const indianUrl = buildWhatsAppUrl('9821011223', 'Rajesh Sharma', 'GM-2026-0001', '₹ 1,14,100');
  assert(indianUrl.startsWith('https://wa.me/919821011223'), 'Indian 10-digit number auto-prefixed with 91', indianUrl.substring(0, 35));

  // International number with country code
  const overseasUrl = buildWhatsAppUrl('+971 50 123 4567', 'Global Exports', 'GM-2026-0046', '$ 2,430.00');
  assert(overseasUrl.startsWith('https://wa.me/971501234567'), 'Overseas number cleanly formatted without + or spaces', overseasUrl.substring(0, 35));
  assert(overseasUrl.includes('%24%202%2C430.00'), 'Overseas URL contains currency formatted amount', overseasUrl);

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`   E2E TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED   `);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
