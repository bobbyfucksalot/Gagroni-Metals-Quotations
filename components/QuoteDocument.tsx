"use client";

import React from 'react';
import Image from 'next/image';
import { Quote, CompanySettings, QuoteTheme } from '@/types';
import { formatINR, numberToIndianWords } from '@/lib/tax-engine';
import { formatCurrency, numberToInternationalWords, SUPPORTED_CURRENCIES } from '@/lib/currency';

interface QuoteDocumentProps {
  quote: Quote;
  settings: CompanySettings;
  overrideTheme?: QuoteTheme;
  currency?: string;
  currencyRate?: number;
  inrPerUnit?: number;
  overrideModules?: {
    dualSignOff?: boolean;
    amountInWords?: boolean;
    hsnCodes?: boolean;
    thumbnails?: boolean;
    marketingPage?: boolean;
  };
}

export default function QuoteDocument({
  quote,
  settings,
  overrideTheme,
  currency = 'INR',
  currencyRate = 1,
  inrPerUnit,
  overrideModules,
}: QuoteDocumentProps) {
  const currentTheme = overrideTheme || quote.theme || 'tally';

  const modules = {
    dualSignOff: overrideModules?.dualSignOff !== undefined ? overrideModules.dualSignOff : (quote.documentModules?.dualSignOff ?? true),
    amountInWords: overrideModules?.amountInWords !== undefined ? overrideModules.amountInWords : (quote.documentModules?.amountInWords ?? true),
    hsnCodes: overrideModules?.hsnCodes !== undefined ? overrideModules.hsnCodes : (quote.documentModules?.hsnCodes ?? true),
    thumbnails: overrideModules?.thumbnails !== undefined ? overrideModules.thumbnails : (quote.documentModules?.thumbnails ?? true),
    marketingPage: overrideModules?.marketingPage !== undefined ? overrideModules.marketingPage : (quote.documentModules?.marketingPage ?? true),
  };

  const isExportCurrency = currency !== 'INR';

  // Convert amounts from base INR to target currency
  const convertAmount = (inrAmount: number) => {
    if (!isExportCurrency) return inrAmount;
    return inrAmount * currencyRate;
  };

  const formatMoney = (inrAmount: number) => {
    if (!isExportCurrency) {
      return formatINR(inrAmount);
    }
    const converted = inrAmount * currencyRate;
    return formatCurrency(converted, currency);
  };

  // Converted grand total & amount in words
  const convertedGrandTotal = convertAmount(quote.totals.grandTotal);
  const displayAmountInWords = isExportCurrency
    ? numberToInternationalWords(convertedGrandTotal, currency)
    : numberToIndianWords(quote.totals.grandTotal);

  const exchangeRateText = isExportCurrency && inrPerUnit
    ? `Reference Exchange Rate: 1 ${currency} = ₹ ${inrPerUnit.toFixed(2)} INR`
    : isExportCurrency
    ? `Reference Exchange Rate: 1 ${currency} = ₹ ${(1 / currencyRate).toFixed(2)} INR`
    : null;

  const showMarketingPage = modules.marketingPage !== false && !!quote.marketingPage?.enabled;

  const paymentPref = settings.paymentModePreference || (settings.paymentQrUrl ? 'both' : 'bank_only');
  const showBank = paymentPref === 'both' || paymentPref === 'bank_only';
  const showQr = (paymentPref === 'both' || paymentPref === 'qr_only') && !!settings.paymentQrUrl;

  const renderMarketingPage = () => {
    if (!showMarketingPage) return null;
    const mp = quote.marketingPage;
    return (
      <React.Fragment>
        {/* On-screen Visual Separator */}
        <div className="no-print" style={{ textAlign: 'center', margin: '26px 0 10px 0' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F4F4F5',
              border: '1px solid #D4D4D8',
              color: '#3F3F46',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 14px',
              borderRadius: '20px',
            }}
          >
            📄 Page 2: Product Showcase &amp; Marketing Annexure
          </span>
        </div>

        <div
          className="print-page marketing-document"
          style={{
            background: '#FFFFFF',
            color: '#18181B',
            fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
            border: '1px solid #18181B',
            borderRadius: '8px',
            padding: '24px 28px',
            maxWidth: '850px',
            margin: '0 auto',
            boxShadow: 'var(--shadow-card)',
            pageBreakBefore: 'always',
            breakBefore: 'page',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '800px',
          }}
        >
          {/* Header */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #18181B',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={settings.logoUrl || '/gagroni-metals-logo.png'}
                  alt={settings.companyName}
                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000000' }}>
                    {settings.companyName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#52525B', marginTop: '1px' }}>
                    {settings.tagline || 'Precision Engineered Metal & Stainless Steel Solutions'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '9.5px', color: '#3F3F46' }}>
                <div style={{ fontWeight: '800', color: '#000000', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  MARKETING ANNEXURE
                </div>
                <div>Ref Quote: <strong>{quote.quoteNumber}</strong></div>
                <div>Date: {quote.issueDate}</div>
              </div>
            </div>

            {/* Showcase Title & Subtitle */}
            <div style={{ textAlign: 'center', margin: '10px 0 14px 0' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#F4F4F5',
                  border: '1px solid #E4E4E7',
                  padding: '3px 12px',
                  borderRadius: '16px',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#18181B',
                  marginBottom: '6px',
                }}
              >
                ★ Product Showcase &amp; Capability Portfolio ★
              </div>
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  margin: '2px 0 4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#000000',
                }}
              >
                {mp?.title || 'Product Showcase & Engineering Portfolio'}
              </h2>
              {mp?.description && (
                <p
                  style={{
                    fontSize: '11px',
                    color: '#52525B',
                    maxWidth: '650px',
                    margin: '0 auto',
                    lineHeight: '1.4',
                  }}
                >
                  {mp.description}
                </p>
              )}
            </div>

            {/* Image Container */}
            <div
              style={{
                margin: '10px 0',
                border: '1px solid #D4D4D8',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '440px',
                maxHeight: '620px',
                padding: '8px',
              }}
            >
              {mp?.imageUrl ? (
                <img
                  src={mp.imageUrl}
                  alt={mp?.title || 'Marketing Product Showcase'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '600px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                    borderRadius: '4px',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#A1A1AA' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🖼️</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#52525B' }}>No Marketing Image Attached</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>Upload a product showcase photo or company flyer in the editor.</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: '1.5px solid #18181B',
              paddingTop: '8px',
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '9.5px',
              color: '#52525B',
            }}
          >
            <div>
              <strong>Plant:</strong> {settings.address}, {settings.city} - {settings.pincode}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Inquiries:</strong> {settings.email} | {settings.phone} | <strong>{settings.website || 'www.gagronimetals.com'}</strong>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  // -------------------------------------------------------------
  // LAYOUT 1: TALLY ERP / PRIME (The Classic Box-Bordered Format)
  // -------------------------------------------------------------
  if (currentTheme === 'tally') {
    return (
      <>
        <div
          className="print-page tally-document"
        style={{
          background: '#FFFFFF',
          color: '#000000',
          fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
          border: '2px solid #000000',
          maxWidth: '850px',
          margin: '0 auto',
          fontSize: '11px',
          lineHeight: '1.3',
        }}
      >
        {/* Document Header Title */}
        <div style={{ textAlign: 'center', padding: '6px 0', borderBottom: '1px solid #000000', background: '#FAFAFA' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            QUOTATION
          </div>
          <div style={{ fontSize: '9px', fontWeight: '700', color: '#4B5563', letterSpacing: '0.08em', marginTop: '1px' }}>
            ( ESTIMATE & ORDER CONFIRMATION )
          </div>
          {exchangeRateText && (
            <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#B45309', marginTop: '2px' }}>
              ✦ {exchangeRateText} ✦
            </div>
          )}
        </div>

        {/* Company Header (Left) vs Dispatch Grid (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', borderBottom: '1px solid #000000' }}>
          {/* Left Box: Company Legal Info with Logo */}
          <div style={{ padding: '10px', borderRight: '1px solid #000000', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <img
              src={settings.logoUrl || '/gagroni-metals-logo.png'}
              alt={settings.companyName}
              style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0, marginTop: '2px', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#000000' }}>
                {settings.companyName}
              </div>
              <div style={{ color: '#222222', fontSize: '10px' }}>
                {settings.address}, {settings.city} - {settings.pincode}
              </div>
              <div style={{ fontSize: '10px' }}>
                <strong>Country:</strong> India &nbsp;|&nbsp; <strong>State Name:</strong> {settings.state}, <strong>Code:</strong> {settings.stateCode || '27'}
              </div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                <strong>GSTIN/UIN:</strong> {settings.taxId} &nbsp;|&nbsp; <strong>PAN:</strong> {settings.panNumber}
              </div>
              {(settings.msmeNumber || settings.iecNumber || settings.cinNumber) && (
                <div style={{ fontSize: '10px', color: '#222222', marginTop: '1px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {settings.msmeNumber && <span><strong>MSME Reg:</strong> {settings.msmeNumber}</span>}
                  {settings.iecNumber && <span><strong>IEC Code:</strong> {settings.iecNumber}</span>}
                  {settings.cinNumber && <span><strong>CIN:</strong> {settings.cinNumber}</span>}
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#333333', marginTop: '2px' }}>
                <strong>Contact:</strong> {settings.phone} &nbsp;|&nbsp; <strong>E-Mail:</strong> {settings.email}
              </div>
            </div>
          </div>

          {/* Right Box: Tally 2-Column Key Value Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '10px' }}>
            <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000', borderRight: '1px solid #000000' }}>
              <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Quotation No.</div>
              <strong style={{ fontSize: '11px' }}>{quote.quoteNumber}</strong>
            </div>
            <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
              <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Dated</div>
              <strong>{quote.issueDate}</strong>
            </div>

            {quote.corporateFields?.extraFields && quote.corporateFields.extraFields.length > 0 ? (
              quote.corporateFields.extraFields.map((f, i) => {
                const isEven = i % 2 === 0;
                const isLast = i === quote.corporateFields!.extraFields!.length - 1;
                const isSpanTwo = isLast && isEven;
                return (
                  <div
                    key={f.id || i}
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #000000',
                      borderRight: isEven && !isSpanTwo ? '1px solid #000000' : 'none',
                      gridColumn: isSpanTwo ? 'span 2' : undefined,
                    }}
                  >
                    <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>{f.label}</div>
                    <div style={{ wordBreak: 'break-word', fontWeight: '500' }}>{f.value || '—'}</div>
                  </div>
                );
              })
            ) : (
              <>
                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000', borderRight: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Delivery Note</div>
                  <div>{quote.corporateFields?.deliveryNote || '—'}</div>
                </div>
                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Mode/Terms of Payment</div>
                  <div>{quote.corporateFields?.paymentTerms || 'Net 30 Days'}</div>
                </div>

                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000', borderRight: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Supplier&apos;s Ref.</div>
                  <div>{quote.corporateFields?.supplierRef || 'SUP-' + quote.quoteNumber.slice(-4)}</div>
                </div>
                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Other Reference(s)</div>
                  <div>{quote.corporateFields?.otherReferences || quote.corporateFields?.rfqRef || 'RFQ-2026-CORP'}</div>
                </div>

                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000', borderRight: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Buyer&apos;s Order No.</div>
                  <div>{quote.corporateFields?.buyerOrderNo || quote.corporateFields?.poNumber || 'PO-PENDING'}</div>
                </div>
                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Dated</div>
                  <div>{quote.corporateFields?.buyerOrderDate || quote.issueDate}</div>
                </div>

                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000', borderRight: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Dispatch Doc No.</div>
                  <div>{quote.corporateFields?.dispatchDocNo || '—'}</div>
                </div>
                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Delivery Note Date</div>
                  <div>—</div>
                </div>

                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000', borderRight: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Dispatched through</div>
                  <div>{quote.corporateFields?.dispatchedThrough || 'Cargo / Direct Road'}</div>
                </div>
                <div style={{ padding: '4px 6px', borderBottom: '1px solid #000000' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Destination</div>
                  <div>{quote.corporateFields?.destination || 'Mumbai / Site'}</div>
                </div>

                <div style={{ gridColumn: 'span 2', padding: '4px 6px' }}>
                  <div style={{ color: '#555555', fontSize: '9px', textTransform: 'uppercase' }}>Terms of Delivery</div>
                  <div>{quote.corporateFields?.termsOfDelivery || quote.corporateFields?.incoterms || 'FOB Destination / Fully Insured'}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Consignee (Ship To) & Buyer (Bill To) Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000000', fontSize: '10px' }}>
          {/* Consignee */}
          <div style={{ padding: '8px 10px', borderRight: '1px solid #000000' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: '#555555', marginBottom: '2px' }}>
              Consignee (Ship to)
            </div>
            <div style={{ fontWeight: '800', fontSize: '11px' }}>
              {quote.consigneeName || quote.clientName}
            </div>
            <div style={{ color: '#333333', marginTop: '2px' }}>
              {quote.consigneeAddress || quote.clientAddress}
            </div>
            <div style={{ marginTop: '3px' }}>
              <strong>GSTIN/UIN:</strong> {quote.consigneeGst || quote.clientGst || '—'}
            </div>
            <div>
              <strong>State Name:</strong> {quote.consigneeState || quote.clientState || 'Maharashtra'}, <strong>Code:</strong> {quote.consigneeStateCode || quote.clientStateCode || '27'}
            </div>
          </div>

          {/* Buyer */}
          <div style={{ padding: '8px 10px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: '#555555', marginBottom: '2px' }}>
              Buyer (Bill to)
            </div>
            <div style={{ fontWeight: '800', fontSize: '11px' }}>
              {quote.clientName}
            </div>
            <div style={{ color: '#333333', marginTop: '2px' }}>
              {quote.clientAddress}
            </div>
            <div style={{ marginTop: '3px' }}>
              <strong>GSTIN/UIN:</strong> {quote.clientGst || '—'}
            </div>
            <div>
              <strong>State Name:</strong> {quote.clientState || 'Maharashtra'}, <strong>Code:</strong> {quote.clientStateCode || '27'}
            </div>
            {quote.clientPhone && (
              <div>
                <strong>Phone:</strong> {quote.clientPhone}
              </div>
            )}
          </div>
        </div>

        {/* Tally Item Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', borderBottom: '1px solid #000000' }}>
          <thead>
            <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #000000' }}>
              <th style={{ padding: '6px 4px', width: '35px', textAlign: 'center', borderRight: '1px solid #000000' }}>SL<br/>NO.</th>
              {modules.thumbnails && (
                <th style={{ padding: '6px 4px', width: '68px', textAlign: 'center', borderRight: '1px solid #000000' }}>VISUAL</th>
              )}
              <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #000000' }}>DESCRIPTION OF GOODS</th>
              {modules.hsnCodes && (
                <th style={{ padding: '6px 6px', width: '70px', textAlign: 'center', borderRight: '1px solid #000000' }}>HSN/SAC</th>
              )}
              <th style={{ padding: '6px 6px', width: '65px', textAlign: 'center', borderRight: '1px solid #000000' }}>QUANTITY</th>
              <th style={{ padding: '6px 8px', width: '85px', textAlign: 'right', borderRight: '1px solid #000000' }}>
                RATE ({currency})
              </th>
              <th style={{ padding: '6px 6px', width: '45px', textAlign: 'center', borderRight: '1px solid #000000' }}>PER</th>
              <th style={{ padding: '6px 8px', width: '105px', textAlign: 'right' }}>
                AMOUNT ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item, index) => (
              <tr key={item.id || index} style={{ borderBottom: index === quote.lineItems.length - 1 ? 'none' : '1px solid #E5E5E5' }}>
                <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'top', borderRight: '1px solid #000000' }}>
                  {index + 1}
                </td>
                {modules.thumbnails && (
                  <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #000000' }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CCCCCC', display: 'block', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ width: '48px', height: '48px', border: '1px solid #CCCCCC', borderRadius: '4px', margin: '0 auto', background: '#FAFAFA', display: 'grid', placeItems: 'center', fontSize: '12px', color: '#888888' }}>
                        📷
                      </div>
                    )}
                  </td>
                )}
                <td style={{ padding: '8px 8px', verticalAlign: 'top', borderRight: '1px solid #000000' }}>
                  <div style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: '9.5px', color: '#444444', marginTop: '2px', lineHeight: '1.3' }}>
                      {item.description}
                    </div>
                  )}
                </td>
                {modules.hsnCodes && (
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'top', borderRight: '1px solid #000000', fontFamily: 'monospace' }}>
                    {item.hsnCode || '730890'}
                  </td>
                )}
                <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'top', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {item.qty.toFixed(2)} {item.unit}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', verticalAlign: 'top', borderRight: '1px solid #000000', fontVariantNumeric: 'tabular-nums', fontWeight: '700' }}>
                  {formatMoney(item.unitPrice)}
                </td>
                <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'top', borderRight: '1px solid #000000', color: '#555555' }}>
                  {item.unit}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', verticalAlign: 'top', fontWeight: '800', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(item.qty * item.unitPrice)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000', background: '#FAFAFA', fontWeight: '800' }}>
              <td colSpan={modules.thumbnails ? 4 : 3} style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #000000' }}>
                TOTAL VALUE ({currency})
              </td>
              <td style={{ padding: '6px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                {quote.lineItems.reduce((acc, i) => acc + i.qty, 0).toFixed(2)}
              </td>
              <td colSpan={2} style={{ borderRight: '1px solid #000000' }}></td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(quote.totals.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words & Bank Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderBottom: '1px solid #000000', fontSize: '10px' }}>
          <div style={{ padding: '8px 10px', borderRight: '1px solid #000000', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {modules.amountInWords && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#555555' }}>Amount Chargeable (in words):</div>
                  <div style={{ fontWeight: '800', fontStyle: 'italic', fontSize: '10.5px' }}>
                    {displayAmountInWords}
                  </div>
                </div>
              )}

              {/* Company Bank Details */}
              {showBank && (
                <div style={{ borderTop: modules.amountInWords ? '1px dashed #CCCCCC' : 'none', paddingTop: '6px', fontSize: '9.5px' }}>
                  <div style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                    Company&apos;s Bank Details
                  </div>
                  <div><strong>Bank Name:</strong> {settings.bankName}</div>
                  <div><strong>A/c No.:</strong> {settings.bankAccountNo}</div>
                  <div><strong>Branch &amp; IFS Code:</strong> {settings.bankBranch} &amp; {settings.bankIfsc}</div>
                  {settings.upiId && <div><strong>UPI ID:</strong> {settings.upiId}</div>}
                </div>
              )}
              {!showBank && showQr && (
                <div style={{ fontSize: '9px', color: '#555555', marginTop: '4px' }}>
                  Scan QR code via PhonePe, GPay, Paytm or BHIM UPI
                  {settings.upiId && <div style={{ fontWeight: '700', color: '#000000', marginTop: '2px' }}>UPI ID: {settings.upiId}</div>}
                </div>
              )}
            </div>

            {/* QR Code aligned to top */}
            {showQr && (
              <div style={{ textAlign: 'center', flexShrink: 0, padding: '4px', background: '#FFFFFF', border: '1.5px solid #000000', borderRadius: '4px' }}>
                <img
                  src={settings.paymentQrUrl}
                  alt="UPI Payment QR Code"
                  style={{ width: '96px', height: '96px', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
                />
                <div style={{ fontSize: '8px', fontWeight: '800', marginTop: '3px', color: '#000000', letterSpacing: '0.04em' }}>
                  SCAN TO PAY
                </div>
              </div>
            )}
          </div>

          {/* Statutory Tax Summary Breakdown */}
          <div style={{ padding: '8px 10px', fontSize: '10px' }}>
            {quote.totals.itemDiscountTotal > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#555555' }}>
                  <span>Total MRP Value:</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#047857', fontWeight: '700' }}>
                  <span>Discount (MRP Savings):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatMoney(quote.totals.itemDiscountTotal)}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>Taxable Value:</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.taxableAmount)}</strong>
            </div>
            {quote.taxMode === 'gst_intra' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>Central Tax (CGST 9%):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.cgst)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>State Tax (SGST 9%):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.sgst)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Integrated Tax (IGST 18%):</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.totalTax)}</span>
              </div>
            )}
            {quote.totals.shipping > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Freight / Loading:</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.shipping)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #000000', marginTop: '4px', fontSize: '12px', fontWeight: '800' }}>
              <span>Total Quotation Value:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms, Conditions & Customer Notes */}
        {(quote.terms || quote.notes) && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #000000', fontSize: '9.5px', background: '#FAFAFA' }}>
            {quote.notes && (
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: '#000000' }}>Customer Scope / Notes:</strong> {quote.notes}
              </div>
            )}
            {quote.terms && (
              <div>
                <strong style={{ color: '#000000' }}>Terms, Conditions &amp; Payment Terms:</strong>
                <ol style={{ margin: '3px 0 0 0', paddingLeft: '16px', lineHeight: '1.4' }}>
                  {quote.terms.split('\n').filter(Boolean).map((t, i) => (
                    <li key={i}>{t.replace(/^\d+[\.\)]\s*/, '')}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Declaration */}
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #000000', fontSize: '9.5px', color: '#333333' }}>
          <strong>Declaration:</strong> We declare that this quotation shows the actual price of the goods described and that all particulars are true and correct.
        </div>

        {/* Company Signatory Block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: '85px', fontSize: '10px' }}>
          {/* Company Authorized Signatory */}
          <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'right', minWidth: '240px' }}>
            <div style={{ fontWeight: '700' }}>for {settings.companyName}</div>

            {(quote.signature?.imageUrl || settings.signatureUrl) ? (
              <div style={{ minHeight: '44px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '4px 0' }}>
                <img
                  src={quote.signature?.imageUrl || settings.signatureUrl}
                  alt="Digital Signature"
                  style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ height: '35px' }}></div>
            )}

            <div>
              <div style={{ fontWeight: '800' }}>{quote.signature?.signatoryName || settings.signatoryName}</div>
              <div style={{ fontSize: '9px', color: '#555555' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '3px 0', fontSize: '8.5px', color: '#666666', borderTop: '1px solid #CCCCCC' }}>
          This is a Computer Generated Quotation Document
        </div>
      </div>
      {renderMarketingPage()}
    </>
  );
}

  // -------------------------------------------------------------
  // LAYOUT 2: EXECUTIVE ENTERPRISE (Sleek Navy Corporate)
  // -------------------------------------------------------------
  if (currentTheme === 'executive') {
    return (
      <>
        <div
          className="print-page executive-document"
        style={{
          background: '#FFFFFF',
          border: '1px solid #DBEAFE',
          borderRadius: '12px',
          padding: '36px',
          boxShadow: 'var(--shadow-card)',
          color: '#18181B',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '2.5px solid #1E3A8A' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <img
              src={settings.logoUrl || '/gagroni-metals-logo.png'}
              alt={settings.companyName}
              style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0, borderRadius: '6px' }}
            />
            <div>
              <h1 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: '#1E3A8A', textTransform: 'uppercase' }}>
                {settings.companyName}
              </h1>
              <div style={{ fontSize: '11px', color: '#52525B', marginTop: '2px' }}>{settings.tagline}</div>
              <div style={{ fontSize: '10px', color: '#71717A', marginTop: '2px' }}>
                GSTIN: <strong>{settings.taxId}</strong> | State: <strong>{settings.state} ({settings.stateCode || '27'})</strong>
              </div>
              {(settings.panNumber || settings.msmeNumber || settings.iecNumber) && (
                <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '1px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {settings.panNumber && <span>PAN: <strong style={{ color: '#18181B' }}>{settings.panNumber}</strong></span>}
                  {settings.msmeNumber && <span>MSME: <strong style={{ color: '#18181B' }}>{settings.msmeNumber}</strong></span>}
                  {settings.iecNumber && <span>IEC: <strong style={{ color: '#18181B' }}>{settings.iecNumber}</strong></span>}
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>
              QUOTATION
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#18181B', marginTop: '3px' }}>
              #{quote.quoteNumber}
            </div>
            <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: '#EFF6FF', color: '#1E3A8A', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
              Currency: {currency}
            </span>
          </div>
        </div>

        {/* Client & Date Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', margin: '20px 0', fontSize: '12px' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Quotation Prepared For</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{quote.clientName}</div>
            <div style={{ color: '#475569', marginTop: '4px', fontSize: '11px' }}>{quote.clientAddress}</div>
            <div style={{ marginTop: '6px', fontSize: '11px' }}>
              <strong>GSTIN:</strong> {quote.clientGst || '—'} &nbsp;|&nbsp; <strong>Phone:</strong> {quote.clientPhone}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Terms &amp; References</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              <div><strong>Issue Date:</strong> {quote.issueDate}</div>
              <div><strong>Valid Until:</strong> <span style={{ color: '#B45309', fontWeight: '700' }}>{quote.validUntil}</span></div>
              {quote.corporateFields?.extraFields && quote.corporateFields.extraFields.length > 0 ? (
                quote.corporateFields.extraFields.map((f, i) => (
                  <div key={i}><strong>{f.label}:</strong> {f.value || '—'}</div>
                ))
              ) : (
                <>
                  <div><strong>RFQ Ref:</strong> {quote.corporateFields?.rfqRef || '—'}</div>
                  <div><strong>Payment:</strong> {quote.corporateFields?.paymentTerms || '50% Adv, 50% Del'}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '16px 0' }}>
          <thead>
            <tr style={{ background: '#1E3A8A', color: '#FFFFFF' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderRadius: '6px 0 0 0', width: '35px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item &amp; Specifications</th>
              {modules.hsnCodes && <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px' }}>HSN</th>}
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>Rate ({currency})</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '60px' }}>GST</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 6px 0 0', width: '105px' }}>Amount ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px', verticalAlign: 'top', color: '#64748B' }}>{idx + 1}</td>
                <td style={{ padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {modules.thumbnails && item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0', flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.name}</div>
                      {item.description && <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>{item.description}</div>}
                    </div>
                  </div>
                </td>
                {modules.hsnCodes && <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'top', color: '#64748B', fontFamily: 'monospace' }}>{item.hsnCode}</td>}
                <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>{item.qty} {item.unit}</td>
                <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums', fontWeight: '700', color: '#0F172A' }}>
                  {formatMoney(item.unitPrice)}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'top', color: '#64748B' }}>{item.taxRate}%</td>
                <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'top', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '16px' }}>
          <div>
            {modules.amountInWords && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '11px' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Amount in Words</div>
                <div style={{ fontWeight: '700', color: '#1E3A8A', fontStyle: 'italic' }}>{displayAmountInWords}</div>
              </div>
            )}

            {(showBank || showQr) && (
              <div style={{ marginTop: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '10px', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
                      {showBank ? 'Bank Remittance Instructions' : 'Direct UPI Payment (Scan & Pay)'}
                    </div>
                    {showBank && (
                      <>
                        <div><strong>Bank:</strong> {settings.bankName} | <strong>A/C:</strong> {settings.bankAccountNo}</div>
                        <div><strong>IFSC:</strong> {settings.bankIfsc} | <strong>Branch:</strong> {settings.bankBranch}</div>
                      </>
                    )}
                    {settings.upiId && <div><strong>UPI ID:</strong> {settings.upiId}</div>}
                  </div>

                  {showQr && (
                    <div style={{ textAlign: 'center', flexShrink: 0, padding: '4px', background: '#FFFFFF', border: '1.5px solid #1E3A8A', borderRadius: '6px' }}>
                      <img
                        src={settings.paymentQrUrl}
                        alt="Payment QR"
                        style={{ width: '96px', height: '96px', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
                      />
                      <div style={{ fontSize: '8px', fontWeight: '800', color: '#1E3A8A', marginTop: '3px', letterSpacing: '0.04em' }}>SCAN TO PAY</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Total MRP Value:</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.subtotal)}</strong>
            </div>
            {quote.totals.itemDiscountTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#047857', fontWeight: '700' }}>
                <span>Total Discount (Savings):</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatMoney(quote.totals.itemDiscountTotal)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Taxable Value:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.taxableAmount)}</span>
            </div>
            {quote.taxMode === 'gst_intra' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>Central Tax (CGST 9%):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.cgst)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>State Tax (SGST 9%):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.sgst)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Integrated Tax (IGST 18%):</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.totalTax)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #1E3A8A', borderBottom: '2px solid #1E3A8A', fontSize: '15px', fontWeight: '800', color: '#1E3A8A', marginTop: '6px' }}>
              <span>Total Value:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms, Conditions & Scope Notes */}
        {(quote.terms || quote.notes) && (
          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px' }}>
            {quote.notes && (
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1E3A8A' }}>Customer Scope / Notes:</strong> <span style={{ color: '#334155' }}>{quote.notes}</span>
              </div>
            )}
            {quote.terms && (
              <div>
                <strong style={{ color: '#1E3A8A', display: 'block', marginBottom: '4px' }}>Terms, Conditions &amp; Payment Terms:</strong>
                <ol style={{ margin: 0, paddingLeft: '18px', color: '#334155', lineHeight: '1.5' }}>
                  {quote.terms.split('\n').filter(Boolean).map((t, i) => (
                    <li key={i}>{t.replace(/^\d+[\.\)]\s*/, '')}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Company Signatory Block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Authorized Signatory</div>
            {(quote.signature?.imageUrl || settings.signatureUrl) ? (
              <div style={{ minHeight: '44px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '4px 0' }}>
                <img
                  src={quote.signature?.imageUrl || settings.signatureUrl}
                  alt="Signature"
                  style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ height: '35px' }}></div>
            )}
            <div style={{ fontSize: '11px', fontWeight: '700' }}>{quote.signature?.signatoryName || settings.signatoryName}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>{settings.companyName}</div>
          </div>
        </div>
      </div>
      {renderMarketingPage()}
    </>
  );
}

  // -------------------------------------------------------------
  // LAYOUT 3: MODERN B2B (Signature Emerald Theme)
  // -------------------------------------------------------------
  if (currentTheme === 'modern') {
    return (
      <>
        <div
          className="print-page modern-document"
        style={{
          background: '#FFFFFF',
          border: '1px solid #A7F3D0',
          borderRadius: '12px',
          padding: '36px',
          boxShadow: 'var(--shadow-card)',
          color: '#18181B',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '2.5px solid #047857' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <img
              src={settings.logoUrl || '/gagroni-metals-logo.png'}
              alt={settings.companyName}
              style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0, borderRadius: '6px' }}
            />
            <div>
              <h1 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: '#047857', textTransform: 'uppercase' }}>
                {settings.companyName}
              </h1>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: '600', marginTop: '2px' }}>{settings.tagline}</div>
              <div style={{ fontSize: '10px', color: '#71717A', marginTop: '2px' }}>
                GSTIN: <strong>{settings.taxId}</strong> | {settings.city}, {settings.state}
              </div>
              {(settings.panNumber || settings.msmeNumber || settings.iecNumber) && (
                <div style={{ fontSize: '9.5px', color: '#047857', marginTop: '1px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {settings.panNumber && <span>PAN: <strong>{settings.panNumber}</strong></span>}
                  {settings.msmeNumber && <span>MSME: <strong>{settings.msmeNumber}</strong></span>}
                  {settings.iecNumber && <span>IEC: <strong>{settings.iecNumber}</strong></span>}
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>
              QUOTATION
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#18181B', marginTop: '3px' }}>
              #{quote.quoteNumber}
            </div>
            <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: '#ECFDF5', color: '#047857', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
              {currency} Quote
            </span>
          </div>
        </div>

        {/* Client details & Terms */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', margin: '20px 0', fontSize: '12px' }}>
          <div style={{ background: '#FAFAF9', border: '1px solid #E4E4E7', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '4px' }}>Customer Reference</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#18181B' }}>{quote.clientName}</div>
            <div style={{ color: '#52525B', marginTop: '4px', fontSize: '11px' }}>{quote.clientAddress}</div>
            <div style={{ marginTop: '6px', fontSize: '11px' }}>
              <strong>GSTIN:</strong> {quote.clientGst || '—'} &nbsp;|&nbsp; <strong>Phone:</strong> {quote.clientPhone}
            </div>
          </div>

          <div style={{ background: '#FAFAF9', border: '1px solid #E4E4E7', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '4px' }}>Quotation Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              <div><strong>Dated:</strong> {quote.issueDate}</div>
              <div><strong>Valid Till:</strong> <span style={{ color: '#B45309', fontWeight: '700' }}>{quote.validUntil}</span></div>
              {quote.corporateFields?.extraFields && quote.corporateFields.extraFields.length > 0 ? (
                quote.corporateFields.extraFields.map((f, i) => (
                  <div key={i}><strong>{f.label}:</strong> {f.value || '—'}</div>
                ))
              ) : (
                <>
                  <div><strong>RFQ:</strong> {quote.corporateFields?.rfqRef || 'Direct'}</div>
                  <div><strong>Incoterms:</strong> {quote.corporateFields?.incoterms || 'Ex-Works'}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '16px 0' }}>
          <thead>
            <tr style={{ background: '#047857', color: '#FFFFFF' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderRadius: '6px 0 0 0', width: '35px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item &amp; Specifications</th>
              {modules.hsnCodes && <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px' }}>HSN</th>}
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>Rate ({currency})</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '60px' }}>GST</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 6px 0 0', width: '105px' }}>Amount ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #E4E4E7' }}>
                <td style={{ padding: '10px', verticalAlign: 'top', color: '#71717A' }}>{idx + 1}</td>
                <td style={{ padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {modules.thumbnails && item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #A7F3D0', flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: '700', color: '#18181B' }}>{item.name}</div>
                      {item.description && <div style={{ fontSize: '10.5px', color: '#71717A', marginTop: '2px' }}>{item.description}</div>}
                    </div>
                  </div>
                </td>
                {modules.hsnCodes && <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'top', color: '#71717A', fontFamily: 'monospace' }}>{item.hsnCode}</td>}
                <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>{item.qty} {item.unit}</td>
                <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums', fontWeight: '700', color: '#18181B' }}>
                  {formatMoney(item.unitPrice)}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'top', color: '#71717A' }}>{item.taxRate}%</td>
                <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'top', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '16px' }}>
          <div>
            {modules.amountInWords && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '10px', fontSize: '11px' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>Amount in Words</div>
                <div style={{ fontWeight: '700', color: '#047857', fontStyle: 'italic' }}>{displayAmountInWords}</div>
              </div>
            )}
            {(showBank || showQr) && (
              <div style={{ marginTop: '10px', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '10px', fontSize: '10px', background: '#F0FDF4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#047857', marginBottom: '2px' }}>
                      {showBank ? 'Bank Remittance Details:' : 'Scan to Pay (UPI):'}
                    </div>
                    {showBank && (
                      <div>{settings.bankName} | A/C: {settings.bankAccountNo} | IFSC: {settings.bankIfsc}</div>
                    )}
                    {settings.upiId && <div>UPI ID: <strong>{settings.upiId}</strong></div>}
                  </div>

                  {showQr && (
                    <div style={{ textAlign: 'center', flexShrink: 0, padding: '4px', background: '#FFFFFF', border: '1.5px solid #047857', borderRadius: '6px' }}>
                      <img
                        src={settings.paymentQrUrl}
                        alt="Payment QR"
                        style={{ width: '96px', height: '96px', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
                      />
                      <div style={{ fontSize: '8px', fontWeight: '800', color: '#047857', marginTop: '3px', letterSpacing: '0.04em' }}>SCAN TO PAY</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Total MRP Value:</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.subtotal)}</strong>
            </div>
            {quote.totals.itemDiscountTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#047857', fontWeight: '700' }}>
                <span>Total Discount (Savings):</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatMoney(quote.totals.itemDiscountTotal)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Taxable Value:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.taxableAmount)}</span>
            </div>
            {quote.taxMode === 'gst_intra' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>Central Tax (CGST 9%):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.cgst)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>State Tax (SGST 9%):</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.sgst)}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Integrated Tax (IGST 18%):</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.totalTax)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #047857', borderBottom: '2px solid #047857', fontSize: '15px', fontWeight: '800', color: '#047857', marginTop: '6px' }}>
              <span>Grand Total:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(quote.totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms, Conditions & Scope Notes */}
        {(quote.terms || quote.notes) && (
          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '11px' }}>
            {quote.notes && (
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#047857' }}>Customer Scope / Notes:</strong> <span style={{ color: '#334155' }}>{quote.notes}</span>
              </div>
            )}
            {quote.terms && (
              <div>
                <strong style={{ color: '#047857', display: 'block', marginBottom: '4px' }}>Terms, Conditions &amp; Payment Terms:</strong>
                <ol style={{ margin: 0, paddingLeft: '18px', color: '#334155', lineHeight: '1.5' }}>
                  {quote.terms.split('\n').filter(Boolean).map((t, i) => (
                    <li key={i}>{t.replace(/^\d+[\.\)]\s*/, '')}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Company Signatory Block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #E4E4E7' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#71717A' }}>Authorized Signatory</div>
            {(quote.signature?.imageUrl || settings.signatureUrl) ? (
              <div style={{ minHeight: '44px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '4px 0' }}>
                <img
                  src={quote.signature?.imageUrl || settings.signatureUrl}
                  alt="Signature"
                  style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ height: '35px' }}></div>
            )}
            <div style={{ fontSize: '11px', fontWeight: '700' }}>{quote.signature?.signatoryName || settings.signatoryName}</div>
            <div style={{ fontSize: '10px', color: '#71717A' }}>{settings.companyName}</div>
          </div>
        </div>
      </div>
      {renderMarketingPage()}
    </>
  );
}

  // -------------------------------------------------------------
  // LAYOUT 4 & 5: CLASSIC MONOCHROME / PROCUREMENT TENDER
  // -------------------------------------------------------------
  return (
    <>
      <div
        className="print-page classic-document"
      style={{
        background: '#FFFFFF',
        border: '1px solid #18181B',
        borderRadius: '8px',
        padding: '36px',
        boxShadow: 'var(--shadow-card)',
        color: '#18181B',
        fontFamily: '"Times New Roman", Times, serif',
        maxWidth: '850px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', borderBottom: '2px solid #18181B', paddingBottom: '16px' }}>
        <img
          src={settings.logoUrl || '/gagroni-metals-logo.png'}
          alt={settings.companyName}
          style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {settings.companyName}
          </h1>
          <div style={{ fontSize: '12px', marginTop: '3px' }}>{settings.address}, {settings.city} - {settings.pincode}</div>
          <div style={{ fontSize: '11px', marginTop: '2px' }}>
            <strong>GSTIN:</strong> {settings.taxId} &nbsp;|&nbsp; <strong>PAN:</strong> {settings.panNumber}
            {settings.msmeNumber && <>&nbsp;|&nbsp; <strong>MSME:</strong> {settings.msmeNumber}</>}
            {settings.iecNumber && <>&nbsp;|&nbsp; <strong>IEC:</strong> {settings.iecNumber}</>}
            &nbsp;|&nbsp; <strong>Email:</strong> {settings.email}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '18px 0', fontSize: '12px', borderBottom: '1px solid #18181B', paddingBottom: '12px' }}>
        <div>
          <div><strong>To / Buyer:</strong> {quote.clientName}</div>
          <div>{quote.clientAddress}</div>
          <div><strong>GSTIN:</strong> {quote.clientGst || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>Quotation No:</strong> {quote.quoteNumber}</div>
          <div><strong>Date:</strong> {quote.issueDate}</div>
          <div><strong>Valid Until:</strong> {quote.validUntil}</div>
          {quote.corporateFields?.extraFields && quote.corporateFields.extraFields.length > 0 ? (
            quote.corporateFields.extraFields.map((f, i) => (
              <div key={i}><strong>{f.label}:</strong> {f.value || '—'}</div>
            ))
          ) : (
            quote.corporateFields?.rfqRef && <div><strong>Tender/RFQ:</strong> {quote.corporateFields.rfqRef}</div>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: '14px 0' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #18181B', borderTop: '1.5px solid #18181B', background: '#F4F4F5' }}>
            {modules.thumbnails && <th style={{ padding: '6px 4px', textAlign: 'center', width: '68px' }}>Photo</th>}
            <th style={{ padding: '6px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '6px', textAlign: 'left' }}>Description</th>
            {modules.hsnCodes && <th style={{ padding: '6px', textAlign: 'center' }}>HSN</th>}
            <th style={{ padding: '6px', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '6px', textAlign: 'right' }}>Rate ({currency})</th>
            <th style={{ padding: '6px', textAlign: 'right' }}>Amount ({currency})</th>
          </tr>
        </thead>
        <tbody>
          {quote.lineItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #E4E4E7' }}>
              {modules.thumbnails && (
                <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #18181B', display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <span style={{ fontSize: '13px', color: '#71717A' }}>📷</span>
                  )}
                </td>
              )}
              <td style={{ padding: '8px 6px', fontWeight: '700', verticalAlign: 'top' }}>{item.name}</td>
              <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>{item.description}</td>
              {modules.hsnCodes && <td style={{ padding: '8px 6px', textAlign: 'center', fontFamily: 'monospace', verticalAlign: 'top' }}>{item.hsnCode}</td>}
              <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'top' }}>{item.qty} {item.unit}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', verticalAlign: 'top', fontWeight: '700' }}>
                {formatMoney(item.unitPrice)}
              </td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '700', fontVariantNumeric: 'tabular-nums', verticalAlign: 'top' }}>{formatMoney(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
        <div style={{ width: '280px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>Total MRP Value:</span>
            <strong>{formatMoney(quote.totals.subtotal)}</strong>
          </div>
          {quote.totals.itemDiscountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#047857', fontWeight: '700' }}>
              <span>Total Discount (Savings):</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatMoney(quote.totals.itemDiscountTotal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>Taxable Value:</span>
            <span>{formatMoney(quote.totals.taxableAmount)}</span>
          </div>
          {quote.taxMode === 'gst_intra' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Central Tax (CGST 9%):</span>
                <span>{formatMoney(quote.totals.cgst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>State Tax (SGST 9%):</span>
                <span>{formatMoney(quote.totals.sgst)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>Integrated Tax (IGST 18%):</span>
              <span>{formatMoney(quote.totals.totalTax)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #18181B', borderBottom: '2px solid #18181B', fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>
            <span>Total Value:</span>
            <span>{formatMoney(quote.totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {modules.amountInWords && (
        <div style={{ fontSize: '11px', marginTop: '12px', fontStyle: 'italic' }}>
          <strong>Amount in Words:</strong> {displayAmountInWords}
        </div>
      )}

      {/* Payment Remittance / Bank & QR Details */}
      {(showBank || showQr) && (
        <div style={{ marginTop: '14px', padding: '8px 12px', border: '1px solid #18181B', fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div>
              <div style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>
                {showBank ? "Company's Bank Remittance Details" : 'Direct UPI Payment (Scan & Pay)'}
              </div>
              {showBank && (
                <>
                  <div><strong>Bank:</strong> {settings.bankName} &nbsp;|&nbsp; <strong>A/c No:</strong> {settings.bankAccountNo}</div>
                  <div><strong>Branch &amp; IFSC:</strong> {settings.bankBranch} &nbsp;|&nbsp; {settings.bankIfsc}</div>
                </>
              )}
              {settings.upiId && <div><strong>UPI ID:</strong> {settings.upiId}</div>}
            </div>

            {showQr && (
              <div style={{ textAlign: 'center', flexShrink: 0, padding: '4px', background: '#FFFFFF', border: '1.5px solid #18181B', borderRadius: '4px' }}>
                <img
                  src={settings.paymentQrUrl}
                  alt="Payment QR"
                  style={{ width: '96px', height: '96px', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
                />
                <div style={{ fontSize: '8px', fontWeight: '800', marginTop: '3px', letterSpacing: '0.04em' }}>SCAN TO PAY</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms, Conditions & Scope Notes */}
      {(quote.terms || quote.notes) && (
        <div style={{ marginTop: '16px', padding: '10px 12px', border: '1px solid #18181B', fontSize: '10.5px' }}>
          {quote.notes && (
            <div style={{ marginBottom: '6px' }}>
              <strong>Customer Scope / Notes:</strong> {quote.notes}
            </div>
          )}
          {quote.terms && (
            <div>
              <strong>Terms, Conditions &amp; Payment Terms:</strong>
              <ol style={{ margin: '4px 0 0 0', paddingLeft: '16px', lineHeight: '1.4' }}>
                {quote.terms.split('\n').filter(Boolean).map((t, i) => (
                  <li key={i}>{t.replace(/^\d+[\.\)]\s*/, '')}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Company Signatory Block */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #18181B', fontSize: '11px' }}>
        <div style={{ textAlign: 'right' }}>
          <div>For <strong>{settings.companyName}</strong></div>
          {(quote.signature?.imageUrl || settings.signatureUrl) ? (
            <div style={{ minHeight: '44px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '4px 0' }}>
              <img
                src={quote.signature?.imageUrl || settings.signatureUrl}
                alt="Authorized Signature"
                style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{ height: '30px' }}></div>
          )}
          <div style={{ fontWeight: '700' }}>{quote.signature?.signatoryName || settings.signatoryName}</div>
          <div style={{ fontSize: '10px' }}>Authorized Signatory</div>
        </div>
      </div>
    </div>
    {renderMarketingPage()}
  </>
);
}
