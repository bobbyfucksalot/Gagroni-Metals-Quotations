"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Share2,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Trash2,
  FileCheck,
  Send,
  Download,
  History,
  Phone,
  FileSpreadsheet,
  Layers,
  Sparkles,
  RefreshCw,
  Upload,
  Edit3,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import QuoteDocument from '@/components/QuoteDocument';
import { Quote, CompanySettings, QuoteStatus, QuoteTheme } from '@/types';
import { formatINR } from '@/lib/tax-engine';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function SingleQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = String(params.id);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Layout & Module Options matching the user screenshot
  const [selectedTheme, setSelectedTheme] = useState<QuoteTheme>('tally');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: { rateAgainstINR: number; inrPerUnit: number } }>({});
  const [fetchingRates, setFetchingRates] = useState(false);

  const [modules, setModules] = useState({
    dualSignOff: false,
    amountInWords: true,
    hsnCodes: true,
    thumbnails: true,
    marketingPage: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true);
      const [resQuote, resSettings, resCurrency] = await Promise.all([
        fetch(`/api/quotes/${quoteId}`).then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/currency').then((r) => r.json()).catch(() => null),
      ]);

      if (resQuote.quote) {
        setQuote(resQuote.quote);
        if (resQuote.quote.theme) setSelectedTheme(resQuote.quote.theme);
        if (resQuote.quote.documentModules) {
          setModules({
            dualSignOff: resQuote.quote.documentModules.dualSignOff ?? false,
            amountInWords: resQuote.quote.documentModules.amountInWords ?? true,
            hsnCodes: resQuote.quote.documentModules.hsnCodes ?? true,
            thumbnails: resQuote.quote.documentModules.thumbnails ?? true,
            marketingPage: resQuote.quote.marketingPage?.enabled ?? true,
          });
        }
      }
      if (resSettings.settings) setSettings(resSettings.settings);
      if (resCurrency?.rates) setExchangeRates(resCurrency.rates);
    } catch {
      showToast('Error loading quote details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quoteId) fetchQuoteDetails();
  }, [quoteId]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    if (newCurrency !== 'INR') {
      try {
        setFetchingRates(true);
        const res = await fetch('/api/currency');
        const data = await res.json();
        if (data.rates) {
          setExchangeRates(data.rates);
          const rateInfo = data.rates[newCurrency];
          if (rateInfo) {
            showToast(`Live Rate Applied: 1 ${newCurrency} = ₹ ${rateInfo.inrPerUnit.toFixed(2)} INR`);
          }
        }
      } catch {
        // Continue with cached fallback
      } finally {
        setFetchingRates(false);
      }
    } else {
      showToast('Base Currency: INR (₹)');
    }
  };

  const currentRateAgainstINR = exchangeRates[selectedCurrency]?.rateAgainstINR ||
    (1 / (SUPPORTED_CURRENCIES[selectedCurrency]?.defaultInrPerUnit || 1));

  const currentInrPerUnit = exchangeRates[selectedCurrency]?.inrPerUnit ||
    (SUPPORTED_CURRENCIES[selectedCurrency]?.defaultInrPerUnit || 1);

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: `Marked quotation as ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.quote) {
        setQuote(data.quote);
        showToast(`Quotation status updated to ${newStatus}`);
      }
    } catch {
      showToast('Failed to update status');
    }
  };

  const handleToggleMarketingPage = async () => {
    if (!quote) return;
    const newEnabled = !quote.marketingPage?.enabled;
    const updatedMarketing = {
      enabled: newEnabled,
      imageUrl: quote.marketingPage?.imageUrl || '',
      title: quote.marketingPage?.title || 'Product Showcase & Engineering Portfolio',
      description: quote.marketingPage?.description || 'Precision Engineered Metal & Stainless Steel Solutions • Heavy-Duty Fabrication',
    };
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingPage: updatedMarketing }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setQuote(data.quote);
        setModules((prev) => ({ ...prev, marketingPage: newEnabled }));
        showToast(newEnabled ? 'Marketing Page added to quotation!' : 'Marketing Page removed');
      }
    } catch {
      showToast('Failed to update marketing page');
    }
  };

  const handleUpdateMarketingImage = async (newImageUrl: string) => {
    if (!quote) return;
    const updatedMarketing = {
      enabled: true,
      imageUrl: newImageUrl,
      title: quote.marketingPage?.title || 'Product Showcase & Engineering Portfolio',
      description: quote.marketingPage?.description || 'Precision Engineered Metal & Stainless Steel Solutions • Heavy-Duty Fabrication',
    };
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingPage: updatedMarketing }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setQuote(data.quote);
        setModules((prev) => ({ ...prev, marketingPage: true }));
        showToast('Marketing image updated successfully!');
      }
    } catch {
      showToast('Failed to save image');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!quote) return;
    const clientPhoneClean = quote.clientPhone.replace(/[^0-9]/g, '');
    const message = `Namaste ${quote.clientName},\n\nPlease find the commercial quotation for *${quote.title}* from *Gagroni Metals Private Limited*.\n\n*Quotation No:* ${quote.quoteNumber}\n*Total Value:* ${formatINR(quote.totals?.grandTotal || 0)}\n*Validity Until:* ${quote.validUntil}\n\nKindly review and let us know if you require any modifications or wish to confirm the Purchase Order.\n\nBest regards,\nGagroni Metals Team\n${settings?.phone || ''}`;

    const url = clientPhoneClean
      ? `https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    if (!quote) return;
    const senderSignatory = settings?.signatoryName || 'Gagroni Metals Team';
    const subject = `Quotation ${quote.quoteNumber} — ${quote.title} — Gagroni Metals`;
    const body = `Dear ${quote.clientName},\n\nPlease find attached our quotation for ${quote.title}.\n\nQuotation Ref: ${quote.quoteNumber}\nTotal Amount: ${formatINR(quote.totals?.grandTotal || 0)}\nValid until: ${quote.validUntil}\n\nLet us know if you have any questions.\n\nWarm regards,\n${senderSignatory}\nGagroni Metals Pvt. Ltd.`;

    window.location.href = `mailto:${quote.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const layoutTabs: { id: QuoteTheme; label: string; isTally?: boolean }[] = [
    { id: 'executive', label: 'Executive Enterprise' },
    { id: 'classic', label: 'Classic Monochrome' },
    { id: 'modern', label: 'Modern B2B' },
    { id: 'procurement', label: 'Procurement / Tender' },
    { id: 'tally', label: '● Tally ERP / Prime', isTally: true },
  ];

  if (loading || !quote || !settings) {
    return (
      <div className="qc-layout">
        <Sidebar />
        <main className="qc-main">
          <Header />
          <div className="qc-content" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Loading quotation document...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="qc-layout">
      <Sidebar />
      <main className="qc-main">
        <Header />

        <div className="qc-content">
          {/* Top Control Bar with Quotation No & Action Buttons */}
          <div
            className="no-print"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Upper Action Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/dashboard/quotes" className="btn-secondary" style={{ padding: '0 8px', height: '32px' }}>
                  <ArrowLeft size={15} />
                </Link>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-emerald)' }}>📄</span> Quotation: {quote.quoteNumber}
                  <span className={`badge-status badge-${quote.status.toLowerCase()}`}>
                    {quote.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Top Right Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Export Currency Dropdown with Live Rate Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', background: selectedCurrency !== 'INR' ? '#FEF3C7' : '#FAFAF9', padding: '5px 12px', borderRadius: '8px', border: selectedCurrency !== 'INR' ? '1px solid #FCD34D' : '1px solid var(--border-color)' }}>
                  <span>🌐 <strong>Currency:</strong></span>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontWeight: '800', color: selectedCurrency !== 'INR' ? '#B45309' : 'var(--text-primary)', cursor: 'pointer', outline: 'none', fontSize: '12px' }}
                  >
                    {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                      <option key={code} value={code}>
                        {code} ({SUPPORTED_CURRENCIES[code].symbol}) — {SUPPORTED_CURRENCIES[code].name}
                      </option>
                    ))}
                  </select>
                  {selectedCurrency !== 'INR' && (
                    <span style={{ fontSize: '10.5px', color: '#B45309', fontWeight: '700', borderLeft: '1px solid #FCD34D', paddingLeft: '6px' }}>
                      1 {selectedCurrency} = ₹{currentInrPerUnit.toFixed(2)}
                    </span>
                  )}
                </div>

                <button onClick={handleEmailShare} className="btn-secondary" style={{ height: '36px', fontSize: '12px' }}>
                  <Mail size={14} /> Email Client
                </button>

                <button onClick={handleWhatsAppShare} className="btn-secondary" style={{ height: '36px', fontSize: '12px', color: '#047857', borderColor: '#A7F3D0', background: '#ECFDF5' }}>
                  <Phone size={14} /> WhatsApp
                </button>

                <Link
                  href={`/dashboard/quotes/${quote.id}/edit`}
                  className="btn-secondary"
                  style={{
                    height: '36px',
                    fontSize: '12px',
                    borderColor: '#93C5FD',
                    color: '#1D4ED8',
                    background: '#EFF6FF',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <Edit3 size={14} /> Edit Quotation
                </Link>

                <button onClick={handlePrint} className="btn-secondary" style={{ height: '36px', fontSize: '12px' }}>
                  <Printer size={14} /> Print
                </button>

                <button onClick={handlePrint} className="btn-primary" style={{ height: '36px', fontSize: '12px' }}>
                  <Download size={14} /> Export Corporate PDF
                </button>
              </div>
            </div>

            {/* Middle Row: Layout Options Switcher Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                LAYOUT:
              </span>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {layoutTabs.map((tab) => {
                  const isActive = selectedTheme === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTheme(tab.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: isActive ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        border: tab.isTally
                          ? isActive
                            ? '1.5px solid #D97706'
                            : '1px solid #FCD34D'
                          : isActive
                          ? '1.5px solid var(--accent-emerald)'
                          : '1px solid var(--border-color)',
                        background: tab.isTally
                          ? isActive
                            ? '#FEF3C7'
                            : '#FFFBEB'
                          : isActive
                          ? 'var(--accent-emerald-light)'
                          : '#FFFFFF',
                        color: tab.isTally
                          ? '#B45309'
                          : isActive
                          ? 'var(--accent-emerald)'
                          : 'var(--text-secondary)',
                        boxShadow: isActive ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Document Module Toggle Checkboxes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', paddingTop: '12px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={modules.dualSignOff}
                  onChange={(e) => setModules({ ...modules, dualSignOff: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)', width: '15px', height: '15px' }}
                />
                Dual Sign-Off
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={modules.amountInWords}
                  onChange={(e) => setModules({ ...modules, amountInWords: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)', width: '15px', height: '15px' }}
                />
                Amount in Words
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={modules.hsnCodes}
                  onChange={(e) => setModules({ ...modules, hsnCodes: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)', width: '15px', height: '15px' }}
                />
                HSN/SAC
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={modules.thumbnails}
                  onChange={(e) => setModules({ ...modules, thumbnails: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)', width: '15px', height: '15px' }}
                />
                Thumbnails
              </label>

              {/* Marketing Page Module Toggle & Uploader Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', color: quote.marketingPage?.enabled ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={modules.marketingPage && !!quote.marketingPage?.enabled}
                    disabled={!quote.marketingPage?.enabled}
                    onChange={(e) => setModules({ ...modules, marketingPage: e.target.checked })}
                    style={{ accentColor: 'var(--accent-emerald)', width: '15px', height: '15px' }}
                  />
                  🖼️ Marketing Page {quote.marketingPage?.enabled ? '(Page 2)' : ''}
                </label>

                {!quote.marketingPage?.enabled ? (
                  <button
                    type="button"
                    onClick={handleToggleMarketingPage}
                    style={{
                      background: '#ECFDF5',
                      border: '1px solid var(--accent-emerald)',
                      color: 'var(--accent-emerald)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    ＋ Add Marketing Page
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label
                      style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Upload size={11} /> {quote.marketingPage?.imageUrl ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            handleUpdateMarketingImage(evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleToggleMarketingPage}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        color: '#B91C1C',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Lifecycle status quick actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lifecycle:</span>
                {quote.status !== 'Paid' && (
                  <button
                    onClick={() => handleStatusChange('Paid')}
                    className="btn-primary"
                    style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                  >
                    <CheckCircle2 size={12} /> Mark as Paid
                  </button>
                )}
                {quote.status !== 'Accepted' && quote.status !== 'Paid' && (
                  <button
                    onClick={() => handleStatusChange('Accepted')}
                    className="btn-secondary"
                    style={{ height: '28px', fontSize: '11px', padding: '0 10px', color: '#0369A1' }}
                  >
                    PO Accepted
                  </button>
                )}
                {quote.status !== 'Sent' && quote.status !== 'Paid' && (
                  <button
                    onClick={() => handleStatusChange('Sent')}
                    className="btn-secondary"
                    style={{ height: '28px', fontSize: '11px', padding: '0 10px', color: '#B45309' }}
                  >
                    Mark Sent
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quotation Document View with Live Currency Conversion */}
          <div style={{ marginBottom: '32px' }}>
            <QuoteDocument
              quote={quote}
              settings={settings}
              overrideTheme={selectedTheme}
              currency={selectedCurrency}
              currencyRate={currentRateAgainstINR}
              inrPerUnit={currentInrPerUnit}
              overrideModules={modules}
            />
          </div>

          {/* Audit History Timeline */}
          <div className="qc-card no-print" style={{ padding: '24px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} style={{ color: 'var(--accent-emerald)' }} /> Status Audit Trail &amp; Document History
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(quote.statusHistory || []).map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', marginTop: '5px' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      Transitioned to <span className={`badge-status badge-${ev.status.toLowerCase()}`}>{ev.status}</span>
                    </div>
                    {ev.note && <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{ev.note}</div>}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
