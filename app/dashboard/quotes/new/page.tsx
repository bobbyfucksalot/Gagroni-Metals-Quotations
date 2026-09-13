"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  Check,
  Building,
  Calendar,
  Save,
  FileCheck,
  Palette,
  ShieldCheck,
  Layers,
  Upload,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import SignaturePad from '@/components/SignaturePad';
import QuoteDocument from '@/components/QuoteDocument';
import PartySearchSelect from '@/components/PartySearchSelect';
import { Client, Product, LineItem, CompanySettings, Quote, QuoteTheme, QuoteMarketingPage } from '@/types';
import { calculateQuoteTotals, formatINR, INDIAN_STATES, getGstStateCode, determineTaxMode } from '@/lib/tax-engine';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function NewQuotePage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState('Fabrication & Structural Metal Works');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientGst, setClientGst] = useState('');
  const [clientState, setClientState] = useState('Rajasthan');
  const [clientStateCode, setClientStateCode] = useState('08');

  // Consignee (Ship to)
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneeGst, setConsigneeGst] = useState('');
  const [consigneeState, setConsigneeState] = useState('Rajasthan');
  const [consigneeStateCode, setConsigneeStateCode] = useState('08');

  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [taxMode, setTaxMode] = useState<'gst_intra' | 'gst_inter' | 'flat'>('gst_intra');
  const [theme, setTheme] = useState<QuoteTheme>('tally');

  // Live Currency Engine
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: { rateAgainstINR: number; inrPerUnit: number } }>({});

  // Tally & Corporate Dispatch / Extra Fields
  interface ExtraFieldItem {
    id: string;
    label: string;
    value: string;
  }

  const DEFAULT_EXTRA_FIELDS: ExtraFieldItem[] = [
    { id: 'f-1', label: "Buyer's Order No.", value: 'PO-PENDING' },
    { id: 'f-2', label: 'Dispatched Through', value: 'Cargo / Direct Road' },
    { id: 'f-3', label: 'Destination', value: '' },
    { id: 'f-4', label: 'Terms of Delivery', value: 'After payment confirmation' },
    { id: 'f-5', label: 'Payment Terms', value: '25% Advance' },
    { id: 'f-6', label: 'Estimated Dispatch', value: '' },
    { id: 'f-7', label: 'Contact Person', value: '' },
    { id: 'f-8', label: 'Transport Name', value: '' },
  ];

  const DEFAULT_CUSTOMER_GREETING =
    'Following our recent discussion regarding your project requirements, we are pleased to submit our competitive commercial quotation for your review. We have ensured that the enclosed machine specifications align with the high standards of efficiency and long-term reliability your operations demand.\n\nThank you for reaching out to Gagroni Metals. We truly appreciate your interest in our equipment and the opportunity to support your project’s operational needs.';

  const [extraFields, setExtraFields] = useState<ExtraFieldItem[]>(DEFAULT_EXTRA_FIELDS);

  const handleAddExtraField = () => {
    const newId = 'field-' + Date.now();
    setExtraFields([...extraFields, { id: newId, label: 'Custom Field', value: '' }]);
  };

  const handleUpdateExtraField = (id: string, updates: Partial<ExtraFieldItem>) => {
    setExtraFields(extraFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleRemoveExtraField = (id: string) => {
    setExtraFields(extraFields.filter((f) => f.id !== id));
  };

  const handleResetExtraFields = () => {
    setExtraFields(DEFAULT_EXTRA_FIELDS);
    showToast('Reset to standard dispatch fields');
  };

  const [documentModules, setDocumentModules] = useState({
    dualSignOff: false,
    amountInWords: true,
    hsnCodes: true,
    thumbnails: true,
  });

  const [marketingPage, setMarketingPage] = useState<QuoteMarketingPage>({
    enabled: false,
    imageUrl: '',
    title: 'Product Showcase & Engineering Portfolio',
    description: 'Precision Engineered Metal & Stainless Steel Solutions • Heavy-Duty Fabrication • Custom Laser Cutting',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const DEFAULT_CLAUSES = [
    'Quotation is valid for 30 calendar days from the date of issue.',
    'Commercial terms: Net 30 days upon authorized client sign-off & invoice receipt.',
    'Delivery lead time is estimated at 5-7 business days with transit cargo insurance.',
    'Standard comprehensive 24-month manufacturer hardware replacement & warranty support.',
    'Statutory tax compliance: All applicable taxes (GST / VAT / Sales Tax) are remitted under statutory rules.',
  ];

  const [termsClauses, setTermsClauses] = useState<string[]>(DEFAULT_CLAUSES);
  const [customerGreeting, setCustomerGreeting] = useState(DEFAULT_CUSTOMER_GREETING);

  const handleAddClause = () => {
    setTermsClauses([...termsClauses, '']);
  };

  const handleUpdateClause = (index: number, val: string) => {
    const next = [...termsClauses];
    next[index] = val;
    setTermsClauses(next);
  };

  const handleRemoveClause = (index: number) => {
    if (termsClauses.length <= 1) {
      setTermsClauses(['']);
      return;
    }
    setTermsClauses(termsClauses.filter((_, i) => i !== index));
  };

  const handleResetToDefaults = () => {
    if (settings?.defaultNotes) {
      const parsed = settings.defaultNotes
        .split('\n')
        .map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        setTermsClauses(parsed);
        showToast('Terms reset to company brand defaults');
        return;
      }
    }
    setTermsClauses(DEFAULT_CLAUSES);
    showToast('Terms reset to standard defaults');
  };

  const [extraDiscountPercent, setExtraDiscountPercent] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [notes, setNotes] = useState('Prices are valid for 15 days due to alloy market price fluctuations.');
  const [signatureData, setSignatureData] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [resClients, resProducts, resSettings, resCurrency] = await Promise.all([
          fetch('/api/clients').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
          fetch('/api/currency').then((r) => r.json()).catch(() => null),
        ]);

        if (resClients.clients && resClients.clients.length > 0) {
          setClients(resClients.clients);
          const c = resClients.clients[0];
          setSelectedClientId(c.id);
          setClientName(c.name);
          setClientContactPerson(c.contactPerson);
          setClientEmail(c.email);
          setClientPhone(c.phone);
          setClientAddress(c.billingAddress);
          setClientGst(c.taxId);
          const cState = c.state || 'Rajasthan';
          const cCode = c.stateCode || getGstStateCode(cState);
          setClientState(cState);
          setClientStateCode(cCode);
          setConsigneeName(c.name);
          setConsigneeAddress(c.billingAddress);
          setConsigneeGst(c.taxId);
          setConsigneeState(cState);
          setConsigneeStateCode(cCode);
          const autoMode = determineTaxMode(cState, resSettings?.settings?.state || 'Rajasthan');
          setTaxMode(autoMode);
        }
        const availableProducts: Product[] = resProducts.products || [];
        if (resProducts.products) setProducts(availableProducts);

        // Check if a specific productId was passed in URL query param
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const targetProductId = urlParams?.get('productId');

        if (targetProductId) {
          const selectedProduct = availableProducts.find((p) => p.id === targetProductId);
          if (selectedProduct) {
            const mrp = selectedProduct.mrp || selectedProduct.offerPrice;
            const offerPrice = selectedProduct.offerPrice || mrp;
            const discPercent = mrp > offerPrice ? Number((((mrp - offerPrice) / mrp) * 100).toFixed(2)) : 0;
            const discAmount = mrp > offerPrice ? mrp - offerPrice : 0;

            setLineItems([
              {
                id: `item-${Date.now()}`,
                productId: selectedProduct.id,
                name: selectedProduct.name,
                description: selectedProduct.description || '',
                hsnCode: selectedProduct.hsnCode || '730890',
                qty: 1,
                unit: selectedProduct.unit || 'pcs',
                mrp: mrp,
                unitPrice: offerPrice,
                taxRate: selectedProduct.defaultGstRate || 18,
                discountPercent: discPercent,
                discountAmount: discAmount,
                total: offerPrice,
                imageUrl: selectedProduct.imageUrl || '',
              },
            ]);
            setTitle(`Quotation for ${selectedProduct.name}`);
          }
        } else if (availableProducts.length > 0) {
          const p = availableProducts[0];
          const mrp = p.mrp || p.offerPrice;
          const offerPrice = p.offerPrice || mrp;
          const discPercent = mrp > offerPrice ? Number((((mrp - offerPrice) / mrp) * 100).toFixed(2)) : 0;
          const discAmount = mrp > offerPrice ? mrp - offerPrice : 0;

          setLineItems([
            {
              id: `item-${Date.now()}`,
              productId: p.id,
              name: p.name,
              description: p.description || '',
              hsnCode: p.hsnCode || '730890',
              qty: 1,
              unit: p.unit || 'pcs',
              mrp: mrp,
              unitPrice: offerPrice,
              taxRate: p.defaultGstRate || 18,
              discountPercent: discPercent,
              discountAmount: discAmount,
              total: offerPrice,
              imageUrl: p.imageUrl || '',
            },
          ]);
          setTitle(`Quotation for ${p.name}`);
        } else {
          setLineItems([
            {
              id: `item-${Date.now()}`,
              name: 'Custom Metal Product / Service',
              description: '',
              hsnCode: '730890',
              qty: 1,
              unit: 'pcs',
              mrp: 1000,
              unitPrice: 1000,
              taxRate: 18,
              discountPercent: 0,
              discountAmount: 0,
              total: 1000,
              imageUrl: '',
            },
          ]);
        }

        if (resCurrency?.rates) setExchangeRates(resCurrency.rates);
        if (resSettings.settings) {
          setSettings(resSettings.settings);
          if (resSettings.settings.signatureUrl) {
            setSignatureData(resSettings.settings.signatureUrl);
          }
          if (resSettings.settings.defaultNotes) {
            const parsed = resSettings.settings.defaultNotes
              .split('\n')
              .map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').trim())
              .filter(Boolean);
            if (parsed.length > 0) {
              setTermsClauses(parsed);
            }
          }
        }
      } catch {
        showToast('Error loading metadata');
      }
    };

    loadInitialData();
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    if (newCurrency !== 'INR') {
      try {
        const res = await fetch('/api/currency');
        const data = await res.json();
        if (data.rates) {
          setExchangeRates(data.rates);
          const rateInfo = data.rates[newCurrency];
          if (rateInfo) {
            showToast(`Live Rate: 1 ${newCurrency} = ₹ ${rateInfo.inrPerUnit.toFixed(2)} INR`);
          }
        }
      } catch {
        // Continue with cached
      }
    }
  };

  const currentRateAgainstINR = exchangeRates[selectedCurrency]?.rateAgainstINR ||
    (1 / (SUPPORTED_CURRENCIES[selectedCurrency]?.defaultInrPerUnit || 1));

  const currentInrPerUnit = exchangeRates[selectedCurrency]?.inrPerUnit ||
    (SUPPORTED_CURRENCIES[selectedCurrency]?.defaultInrPerUnit || 1);

  const handleSelectClient = (c: Client) => {
    setSelectedClientId(c.id);
    setClientName(c.name);
    setClientContactPerson(c.contactPerson || '');
    setClientEmail(c.email || '');
    setClientPhone(c.phone || '');
    setClientAddress(c.billingAddress || '');
    setClientGst(c.taxId || '');
    const cState = c.state || 'Rajasthan';
    const cCode = c.stateCode || getGstStateCode(cState);
    setClientState(cState);
    setClientStateCode(cCode);
    setConsigneeName(c.name);
    setConsigneeAddress(c.billingAddress || '');
    setConsigneeGst(c.taxId || '');
    setConsigneeState(cState);
    setConsigneeStateCode(cCode);

    const autoTax = determineTaxMode(cState, settings?.state || 'Rajasthan');
    setTaxMode(autoTax);
    showToast(`Selected party: ${c.name}`);
  };

  const handleClearClient = () => {
    setSelectedClientId('');
    setClientName('');
    setClientContactPerson('');
    setClientEmail('');
    setClientPhone('');
    setClientAddress('');
    setClientGst('');
    showToast('Party details cleared');
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const c = clients.find((item) => item.id === clientId);
    if (c) {
      handleSelectClient(c);
    }
  };

  const handleClientStateChange = (stateName: string) => {
    const code = getGstStateCode(stateName);
    setClientState(stateName);
    setClientStateCode(code);
    if (!consigneeName || consigneeState === clientState) {
      setConsigneeState(stateName);
      setConsigneeStateCode(code);
    }
    const autoTax = determineTaxMode(stateName, settings?.state || 'Rajasthan');
    setTaxMode(autoTax);
  };

  const handleConsigneeStateChange = (stateName: string) => {
    const code = getGstStateCode(stateName);
    setConsigneeState(stateName);
    setConsigneeStateCode(code);
    const autoTax = determineTaxMode(stateName, settings?.state || 'Rajasthan');
    setTaxMode(autoTax);
  };

  const handleAddItem = (product?: Product) => {
    const mrp = product?.mrp || product?.offerPrice || 5000;
    const offerPrice = product?.offerPrice || mrp;
    const discountPercent = mrp > offerPrice ? Number((((mrp - offerPrice) / mrp) * 100).toFixed(2)) : 0;
    const discountAmount = mrp > offerPrice ? mrp - offerPrice : 0;

    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      productId: product?.id,
      name: product?.name || 'Custom Metal Fabrication Item',
      description: product?.description || '',
      hsnCode: product?.hsnCode || '730890',
      qty: 1,
      unit: product?.unit || 'pcs',
      mrp: mrp,
      unitPrice: offerPrice,
      taxRate: product?.defaultGstRate || 18,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      total: offerPrice,
      imageUrl: product?.imageUrl || '',
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<LineItem>) => {
    const next = [...lineItems];
    const item = { ...next[index], ...updates };

    // Auto calculate discount between MRP and Offer Price (unitPrice)
    if (updates.mrp !== undefined || updates.unitPrice !== undefined) {
      if (item.mrp && item.mrp > item.unitPrice) {
        item.discountPercent = Number((((item.mrp - item.unitPrice) / item.mrp) * 100).toFixed(2));
        item.discountAmount = (item.mrp - item.unitPrice) * item.qty;
      } else {
        item.discountPercent = 0;
        item.discountAmount = 0;
      }
    }

    item.total = item.qty * item.unitPrice;
    next[index] = item;
    setLineItems(next);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) {
      showToast('A quotation must contain at least 1 line item.');
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAiDescribe = async (index: number) => {
    const item = lineItems[index];
    if (!item.name) return;

    try {
      setAiGeneratingIndex(index);
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, unit: item.unit }),
      });
      const data = await res.json();
      if (data.description) {
        handleUpdateItem(index, { description: data.description });
        showToast('AI enhanced engineering description generated!');
      }
    } catch {
      showToast('AI assistant unavailable');
    } finally {
      setAiGeneratingIndex(null);
    }
  };

  const totals = calculateQuoteTotals(lineItems, taxMode, extraDiscountPercent, shipping);

  const buildCorporateFields = () => {
    const obj: Record<string, any> = {
      extraFields,
      customFields: extraFields,
    };
    extraFields.forEach((f) => {
      const lower = f.label.toLowerCase();
      if (lower.includes('delivery note')) obj.deliveryNote = f.value;
      else if (lower.includes("supplier's ref") || lower.includes('supplier ref')) obj.supplierRef = f.value;
      else if (lower.includes('other ref')) obj.otherReferences = f.value;
      else if (lower.includes("buyer's order") || lower.includes('buyer order') || lower.includes('po')) obj.buyerOrderNo = f.value;
      else if (lower.includes('dispatched through') || lower.includes('dispatch through')) obj.dispatchedThrough = f.value;
      else if (lower.includes('destination')) obj.destination = f.value;
      else if (lower.includes('terms of delivery') || lower.includes('incoterm')) obj.termsOfDelivery = f.value;
      else if (lower.includes('payment term')) obj.paymentTerms = f.value;
      else if (lower.includes('estimated dispatch') || lower.includes('dispatch date')) obj.deliveryTime = f.value;
      else if (lower.includes('contact person')) obj.contactPerson = f.value;
      else if (lower.includes('transport name') || lower.includes('transport')) obj.transportName = f.value;
    });
    return obj;
  };

  const previewQuote: Quote = {
    id: 'quote-preview',
    quoteNumber: 'GM-2026-0046',
    title,
    clientId: selectedClientId,
    clientName,
    clientContactPerson,
    clientEmail,
    clientPhone,
    clientAddress,
    clientGst,
    clientState,
    clientStateCode,
    consigneeName,
    consigneeAddress,
    consigneeGst,
    consigneeState,
    consigneeStateCode,
    status: 'Draft',
    statusHistory: [],
    issueDate,
    validUntil,
    currency: { base: 'INR', export: selectedCurrency, rate: currentRateAgainstINR },
    taxMode,
    lineItems,
    corporateFields: buildCorporateFields(),
    documentModules,
    notes: customerGreeting,
    terms: termsClauses.filter(Boolean).join('\n'),
    totals,
    marketingPage: marketingPage.enabled ? marketingPage : { enabled: false },
    signature: {
      imageUrl: signatureData || settings?.signatureUrl,
      signatoryName: settings?.signatoryName || 'Authorized Signatory',
      signatoryTitle: settings?.signatoryTitle || 'Managing Director',
    },
    version: 1,
    theme,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          clientId: selectedClientId,
          clientName,
          clientContactPerson,
          clientEmail,
          clientPhone,
          clientAddress,
          clientGst,
          clientState,
          clientStateCode,
          consigneeName,
          consigneeAddress,
          consigneeGst,
          consigneeState,
          consigneeStateCode,
          currency: { base: 'INR', export: selectedCurrency, rate: currentRateAgainstINR },
          issueDate,
          validUntil,
          taxMode,
          lineItems,
          corporateFields: buildCorporateFields(),
          documentModules,
          extraDiscountPercent,
          shipping,
          notes: customerGreeting,
          terms: termsClauses.filter(Boolean).join('\n'),
          theme,
          marketingPage: marketingPage.enabled ? marketingPage : { enabled: false },
          signature: {
            imageUrl: signatureData || settings?.signatureUrl,
            signatoryName: settings?.signatoryName || 'Authorized Signatory',
            signatoryTitle: settings?.signatoryTitle || 'Managing Director',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to create quotation');
        setLoading(false);
        return;
      }

      showToast('Quotation created successfully!');
      router.push(`/dashboard/quotes/${data.quote.id}`);
    } catch {
      showToast('Network error while saving quote');
      setLoading(false);
    }
  };

  const layoutTabs: { id: QuoteTheme; label: string; isTally?: boolean }[] = [
    { id: 'executive', label: 'Executive Enterprise' },
    { id: 'classic', label: 'Classic Monochrome' },
    { id: 'modern', label: 'Modern B2B' },
    { id: 'procurement', label: 'Procurement / Tender' },
    { id: 'tally', label: '● Tally ERP / Prime', isTally: true },
  ];

  return (
    <div className="qc-layout">
      <Sidebar />
      <main className="qc-main">
        <Header />

        <div className="qc-content">
          {/* Top action header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/dashboard/quotes" className="btn-secondary" style={{ padding: '0 10px', height: '36px' }}>
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="font-serif-heading" style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                  Quotation Builder
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tally ERP / Prime format, live currency engine &amp; dispatch tracking</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Live Currency Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: selectedCurrency !== 'INR' ? '#FEF3C7' : '#FAFAF9', padding: '5px 12px', borderRadius: '8px', border: selectedCurrency !== 'INR' ? '1px solid #FCD34D' : '1px solid var(--border-color)' }}>
                <span>🌐 Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontWeight: '800', color: selectedCurrency !== 'INR' ? '#B45309' : 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
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

              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="btn-secondary"
              >
                <Eye size={15} /> {previewMode ? 'Back to Form Editor' : 'Live Document Preview'}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
              >
                <Save size={15} /> {loading ? 'Saving Quote...' : 'Save & Publish Quote'}
              </button>
            </div>
          </div>

          {/* Layout Selector Bar */}
          <div
            className="qc-card"
            style={{
              padding: '14px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                LAYOUT:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {layoutTabs.map((tab) => {
                  const isActive = theme === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTheme(tab.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: isActive ? '700' : '500',
                        cursor: 'pointer',
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
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modules Checkboxes */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={documentModules.dualSignOff}
                  onChange={(e) => setDocumentModules({ ...documentModules, dualSignOff: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)' }}
                />
                Dual Sign-Off
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={documentModules.amountInWords}
                  onChange={(e) => setDocumentModules({ ...documentModules, amountInWords: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)' }}
                />
                Amount in Words
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={documentModules.hsnCodes}
                  onChange={(e) => setDocumentModules({ ...documentModules, hsnCodes: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)' }}
                />
                HSN/SAC
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={documentModules.thumbnails}
                  onChange={(e) => setDocumentModules({ ...documentModules, thumbnails: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)' }}
                />
                Thumbnails
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: '700', color: marketingPage.enabled ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={marketingPage.enabled}
                  onChange={(e) => setMarketingPage({ ...marketingPage, enabled: e.target.checked })}
                  style={{ accentColor: 'var(--accent-emerald)' }}
                />
                🖼️ Marketing Page
              </label>
            </div>
          </div>

          {/* Conditional Preview or Form Editor */}
          {previewMode ? (
            <div>
              {settings && (
                <QuoteDocument
                  quote={previewQuote}
                  settings={settings}
                  overrideTheme={theme}
                  currency={selectedCurrency}
                  currencyRate={currentRateAgainstINR}
                  inrPerUnit={currentInrPerUnit}
                  overrideModules={documentModules}
                />
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Buyer & Consignee */}
              <div className="qc-card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} style={{ color: 'var(--accent-emerald)' }} /> Buyer &amp; Consignee Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Buyer Box */}
                  <div style={{ background: '#FAFAF9', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Buyer (Bill To)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <PartySearchSelect
                        clients={clients}
                        selectedClientId={selectedClientId}
                        selectedClientName={clientName}
                        onSelectClient={handleSelectClient}
                        onClearClient={handleClearClient}
                      />

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                          Buyer Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="qc-input"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Buyer / Client Company Name"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                            State (Place of Supply) *
                          </label>
                          <select
                            className="qc-input"
                            value={clientState}
                            onChange={(e) => handleClientStateChange(e.target.value)}
                          >
                            {INDIAN_STATES.map((s) => (
                              <option key={s.code} value={s.name}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>State Code</label>
                          <input type="text" className="qc-input" value={clientStateCode} readOnly style={{ background: '#F4F4F5' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>GSTIN/UIN</label>
                          <input type="text" className="qc-input" value={clientGst} onChange={(e) => setClientGst(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Contact Phone</label>
                          <input type="text" className="qc-input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Billing Address</label>
                        <input type="text" className="qc-input" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Consignee Box */}
                  <div style={{ background: '#FAFAF9', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E3A8A', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Consignee (Ship To)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                          Consignee / Site Name
                        </label>
                        <input
                          type="text"
                          className="qc-input"
                          value={consigneeName}
                          onChange={(e) => setConsigneeName(e.target.value)}
                          placeholder="Same as Buyer or Site Logistics Name"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Consignee GSTIN</label>
                          <input type="text" className="qc-input" value={consigneeGst} onChange={(e) => setConsigneeGst(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>State Code</label>
                          <input type="text" className="qc-input" value={consigneeStateCode} readOnly style={{ background: '#F4F4F5' }} />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Consignee Destination State *</label>
                        <select
                          className="qc-input"
                          value={consigneeState}
                          onChange={(e) => handleConsigneeStateChange(e.target.value)}
                        >
                          {INDIAN_STATES.map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Delivery Site Address</label>
                        <input type="text" className="qc-input" value={consigneeAddress} onChange={(e) => setConsigneeAddress(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tally ERP / Dispatch & Custom Extra Fields */}
              <div className="qc-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Tally ERP / Dispatch &amp; Extra Fields
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Add or delete custom commercial fields (e.g. Project Code, Vehicle No, Warranty, Delivery Note)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleResetExtraFields}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                      title="Reset back to standard 8 dispatch fields"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExtraField}
                      className="btn-primary"
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Plus size={14} /> Add Extra Field
                    </button>
                  </div>
                </div>

                {/* Extra Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {extraFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        background: '#FAFAF9',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateExtraField(field.id, { label: e.target.value })}
                          placeholder="Field Name / Title"
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            width: '85%',
                            borderBottom: '1px dashed #D4D4D8',
                            padding: '1px 0',
                          }}
                          title="Click to edit field label"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraField(field.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                          title="Delete this field from quotation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <input
                        type="text"
                        className="qc-input"
                        style={{ height: '34px', fontSize: '12px', background: '#FFFFFF' }}
                        value={field.value}
                        onChange={(e) => handleUpdateExtraField(field.id, { value: e.target.value })}
                        placeholder={`Enter ${field.label}...`}
                      />
                    </div>
                  ))}
                </div>

                {extraFields.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    No extra fields on this quotation. Click &quot;Add Extra Field&quot; or &quot;Reset Defaults&quot; to add specifications.
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="qc-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Description of Goods &amp; Line Items
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Add products with HSN/SAC codes, quantities, and AI specifications</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className="qc-input"
                      style={{ width: '220px', height: '36px', fontSize: '12px' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          const p = products.find((prod) => prod.id === e.target.value);
                          if (p) handleAddItem(p);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        ＋ Quick Add from Catalog...
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatINR(p.offerPrice)}/{p.unit})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddItem()}
                      className="btn-secondary"
                      style={{ height: '36px', fontSize: '12px' }}
                    >
                      <Plus size={14} /> Custom Item
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '16px',
                        background: '#FAFAF9',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.9fr 0.7fr 0.7fr 1fr 1fr 0.9fr 36px', gap: '10px', alignItems: 'flex-start' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Item Description &amp; Photo
                          </label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Line Item Image Thumbnail & Picker */}
                            <div
                              style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '6px',
                                border: '1px dashed var(--border-color)',
                                background: '#FFFFFF',
                                flexShrink: 0,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {item.imageUrl ? (
                                <>
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItem(index, { imageUrl: '' })}
                                    style={{
                                      position: 'absolute',
                                      top: '1px',
                                      right: '1px',
                                      background: 'rgba(0,0,0,0.65)',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '14px',
                                      height: '14px',
                                      fontSize: '9px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                    }}
                                    title="Remove photo"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <label
                                  style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    color: 'var(--text-muted)',
                                  }}
                                  title="Upload item image"
                                >
                                  <Upload size={12} />
                                  <span style={{ fontSize: '7.5px', fontWeight: '700', marginTop: '1px' }}>PHOTO</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        handleUpdateItem(index, { imageUrl: evt.target?.result as string });
                                        showToast('Item photo attached!');
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            <input
                              type="text"
                              required
                              className="qc-input"
                              style={{ flex: 1 }}
                              value={item.name}
                              onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                              placeholder="Product Title"
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            HSN/SAC
                          </label>
                          <input
                            type="text"
                            className="qc-input"
                            value={item.hsnCode}
                            onChange={(e) => handleUpdateItem(index, { hsnCode: e.target.value })}
                            placeholder="9403.10"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Unit
                          </label>
                          <input
                            type="text"
                            className="qc-input"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(index, { unit: e.target.value })}
                            placeholder="pcs / kg"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            className="qc-input"
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(index, { qty: Number(e.target.value) || 1 })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            MRP (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="qc-input"
                            value={item.mrp !== undefined ? item.mrp : item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, { mrp: Number(e.target.value) || 0 })}
                            placeholder="MRP"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Offer Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            className="qc-input"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                          />
                          {item.mrp && item.mrp > item.unitPrice ? (
                            <div style={{ fontSize: '9.5px', color: '#047857', fontWeight: '700', marginTop: '3px', whiteSpace: 'nowrap' }}>
                              🏷️ Disc: ₹{item.mrp - item.unitPrice} ({(((item.mrp - item.unitPrice) / item.mrp) * 100).toFixed(0)}% OFF)
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            GST Rate %
                          </label>
                          <select
                            className="qc-input"
                            value={item.taxRate}
                            onChange={(e) => handleUpdateItem(index, { taxRate: Number(e.target.value) || 18 })}
                          >
                            <option value={18}>18% GST</option>
                            <option value={12}>12% GST</option>
                            <option value={28}>28% GST</option>
                            <option value={5}>5% GST</option>
                            <option value={0}>0%</option>
                          </select>
                        </div>

                        <div style={{ paddingTop: '22px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: '4px' }}
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            Detailed Specifications
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAiDescribe(index)}
                            disabled={aiGeneratingIndex === index}
                            style={{
                              background: 'var(--accent-emerald-light)',
                              border: '1px solid var(--accent-emerald-border)',
                              color: 'var(--accent-emerald)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Sparkles size={12} />
                            {aiGeneratingIndex === index ? 'AI Polishing...' : 'AI Enhance Specs'}
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          className="qc-textarea"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                          placeholder="Detailed engineering specifications..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms, Conditions & Payment Terms Card */}
              <div className="qc-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#18181B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    TERMS, CONDITIONS &amp; PAYMENT TERMS
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Reset to Brand Defaults
                  </button>
                </div>

                {/* Numbered Clause Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {termsClauses.map((clause, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280', width: '22px', textAlign: 'right', flexShrink: 0 }}>
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        className="qc-input"
                        style={{
                          flex: 1,
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: '#FFFFFF',
                          fontSize: '13px',
                          color: '#1F2937',
                        }}
                        value={clause}
                        onChange={(e) => handleUpdateClause(idx, e.target.value)}
                        placeholder="Enter quotation clause..."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveClause(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                        title="Delete clause"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={handleAddClause}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ＋ Add Clause
                  </button>
                </div>

                {/* Internal Scope Notes / Customer Greeting */}
                <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #F3F4F6' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
                    Internal Scope Notes / Customer Greeting
                  </label>
                  <textarea
                    rows={3}
                    className="qc-textarea"
                    value={customerGreeting}
                    onChange={(e) => setCustomerGreeting(e.target.value)}
                    placeholder="Thank you for considering Gagroni Metals Ltd. We look forward to partnering with your procurement team."
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      padding: '10px 12px',
                    }}
                  />
                </div>
              </div>

              {/* Marketing & Product Showcase Page (Optional Page 2) */}
              <div
                className="qc-card"
                style={{
                  padding: '24px',
                  border: marketingPage.enabled ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  background: marketingPage.enabled ? '#FCFDFD' : '#FFFFFF',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: marketingPage.enabled ? '18px' : '0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🖼️</span> Marketing &amp; Product Showcase Annexure (Page 2)
                      {marketingPage.enabled ? (
                        <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: '#ECFDF5', color: '#047857', fontWeight: '700', border: '1px solid #A7F3D0' }}>
                          ✓ Included as Page 2
                        </span>
                      ) : (
                        <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: '#F4F4F5', color: '#71717A', fontWeight: '600' }}>
                          Not Added
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Add a full-page marketing brochure or product photo at the end of the quotation for showcasing your company catalog or installations.
                    </div>
                  </div>

                  {marketingPage.enabled ? (
                    <button
                      type="button"
                      onClick={() => setMarketingPage({ ...marketingPage, enabled: false })}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        color: '#B91C1C',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 size={14} /> Remove Marketing Page
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMarketingPage({ ...marketingPage, enabled: true })}
                      style={{
                        background: '#ECFDF5',
                        border: '1.5px solid var(--accent-emerald)',
                        color: 'var(--accent-emerald)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={14} /> Add Marketing Page
                    </button>
                  )}
                </div>

                {marketingPage.enabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Upload Image Section */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Marketing Image / Product Showcase Photo
                      </label>

                      {marketingPage.imageUrl ? (
                        <div style={{ display: 'inline-block', border: '1.5px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: '#FAFAFA' }}>
                          <img
                            src={marketingPage.imageUrl}
                            alt="Marketing Preview"
                            style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: '4px' }}
                          />
                          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--border-color)',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <Upload size={13} /> Change Image
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    setMarketingPage({ ...marketingPage, imageUrl: evt.target?.result as string });
                                    showToast('Marketing image updated!');
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setMarketingPage({ ...marketingPage, imageUrl: '' })}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#DC2626',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '4px 8px',
                              }}
                            >
                              Remove Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '28px',
                            border: '2px dashed #CBD5E1',
                            borderRadius: '8px',
                            background: '#F8FAFC',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '8px' }}>
                            <Upload size={22} />
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            Click to browse or upload marketing image / product flyer
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Supports PNG, JPG, WebP (Showcases your product, factory infrastructure, or architectural projects)
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setMarketingPage({ ...marketingPage, imageUrl: evt.target?.result as string });
                                showToast('Marketing image uploaded!');
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Page Title & Subtitle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Annexure Title
                        </label>
                        <input
                          type="text"
                          className="qc-input"
                          value={marketingPage.title || ''}
                          onChange={(e) => setMarketingPage({ ...marketingPage, title: e.target.value })}
                          placeholder="e.g. Product Showcase & Engineering Portfolio"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Capabilities / Highlights Note
                        </label>
                        <input
                          type="text"
                          className="qc-input"
                          value={marketingPage.description || ''}
                          onChange={(e) => setMarketingPage({ ...marketingPage, description: e.target.value })}
                          placeholder="e.g. ISO 9001:2015 Facility • CNC Fiber Laser • Custom Heavy Fabrication"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals & Signature */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div className="qc-card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Authorized Digital Signature
                  </div>
                  <SignaturePad
                    onSave={(dataUrl) => setSignatureData(dataUrl)}
                    initialValue={signatureData}
                    defaultSignatureUrl={settings?.signatureUrl}
                  />
                </div>

                <div className="qc-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Totals Breakdown (GST Engine)
                    </div>
                    {/* Tax Mode Badge */}
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: taxMode === 'gst_intra' ? '#ECFDF5' : '#EFF6FF',
                        color: taxMode === 'gst_intra' ? '#047857' : '#1E3A8A',
                        border: taxMode === 'gst_intra' ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      {taxMode === 'gst_intra' ? '✓ Same State (CGST 9% + SGST 9%)' : '✓ Inter-State (IGST 18%)'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total MRP Value:</span>
                      <strong>{formatINR(totals.subtotal)}</strong>
                    </div>
                    {totals.itemDiscountTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: '700' }}>
                        <span>Total Discount (Savings):</span>
                        <span>-{formatINR(totals.itemDiscountTotal)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Taxable Amount:</span>
                      <span>{formatINR(totals.taxableAmount)}</span>
                    </div>

                    {taxMode === 'gst_intra' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                          <span>Central Tax (CGST 9%):</span>
                          <span>{formatINR(totals.cgst)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                          <span>State Tax (SGST 9%):</span>
                          <span>{formatINR(totals.sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E3A8A' }}>
                        <span>Integrated Tax (IGST 18%):</span>
                        <span>{formatINR(totals.igst)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontSize: '16px', fontWeight: '800' }}>
                      <span>Grand Total:</span>
                      <span>{formatINR(totals.grandTotal)}</span>
                    </div>

                    {/* Manual Override Controls */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Override Tax:</span>
                      <button
                        type="button"
                        onClick={() => setTaxMode('gst_intra')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: taxMode === 'gst_intra' ? 'var(--accent-emerald)' : '#FFFFFF',
                          color: taxMode === 'gst_intra' ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '10.5px',
                        }}
                      >
                        Intra (CGST+SGST)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxMode('gst_inter')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: taxMode === 'gst_inter' ? '#1E3A8A' : '#FFFFFF',
                          color: taxMode === 'gst_inter' ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '10.5px',
                        }}
                      >
                        Inter (IGST 18%)
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                      style={{ width: '100%', height: '44px', marginTop: '12px', fontSize: '14px' }}
                    >
                      <Save size={16} /> {loading ? 'Saving...' : 'Publish Quotation'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
