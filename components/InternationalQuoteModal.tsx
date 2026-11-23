"use client";

import React, { useState, useEffect } from 'react';
import { Globe, X, Check, AlertCircle, Coins, ShieldCheck } from 'lucide-react';

export interface InternationalDetails {
  country: string;
  state?: string;
  pinCode?: string;
  address?: string;
  currency?: string;
  taxTreatment?: 'zero_rated_lut' | 'taxable_igst' | 'concessional_0_1';
}

interface InternationalQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: InternationalDetails) => void;
  initialDetails?: InternationalDetails | null;
  currentCurrency?: string;
}

const COMMON_COUNTRIES = [
  'United Arab Emirates',
  'United States',
  'Saudi Arabia',
  'United Kingdom',
  'Germany',
  'Singapore',
  'Australia',
  'Canada',
  'Oman',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Malaysia',
  'South Africa',
  'Japan',
  'France',
  'Italy',
  'Netherlands',
];

const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
];

export default function InternationalQuoteModal({
  isOpen,
  onClose,
  onSave,
  initialDetails,
  currentCurrency,
}: InternationalQuoteModalProps) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [taxTreatment, setTaxTreatment] = useState<'zero_rated_lut' | 'taxable_igst' | 'concessional_0_1'>('concessional_0_1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCountry(initialDetails?.country || '');
      setState(initialDetails?.state || '');
      setPinCode(initialDetails?.pinCode || '');
      setAddress(initialDetails?.address || '');
      setCurrency(initialDetails?.currency || currentCurrency || 'USD');
      setTaxTreatment(initialDetails?.taxTreatment || 'concessional_0_1');
      setError('');
    }
  }, [isOpen, initialDetails, currentCurrency]);

  if (!isOpen) return null;

  const handleShortcutSelect = (shortcut: string) => {
    let fullName = shortcut;
    let autoCurr = 'USD';

    if (shortcut === 'UAE') {
      fullName = 'United Arab Emirates';
      autoCurr = 'AED';
    } else if (shortcut === 'USA') {
      fullName = 'United States';
      autoCurr = 'USD';
    } else if (shortcut === 'UK') {
      fullName = 'United Kingdom';
      autoCurr = 'GBP';
    } else if (shortcut === 'Saudi Arabia') {
      fullName = 'Saudi Arabia';
      autoCurr = 'SAR';
    } else if (shortcut === 'Germany') {
      fullName = 'Germany';
      autoCurr = 'EUR';
    } else if (shortcut === 'Singapore') {
      fullName = 'Singapore';
      autoCurr = 'SGD';
    } else if (shortcut === 'Australia') {
      fullName = 'Australia';
      autoCurr = 'AUD';
    }

    setCountry(fullName);
    setCurrency(autoCurr);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim()) {
      setError('Country name is mandatory for an international quotation.');
      return;
    }

    onSave({
      country: country.trim(),
      state: state.trim() || undefined,
      pinCode: pinCode.trim() || undefined,
      address: address.trim() || undefined,
      currency,
      taxTreatment,
    });
  };

  return (
    <div className="qc-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="qc-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--accent-emerald-light, rgba(16, 185, 129, 0.15))',
                color: 'var(--accent-emerald)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Globe size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                International Quotation Details
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Destination country, currency &amp; export statutory tax treatment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--status-overdue-bg, #FEF2F2)',
                border: '1px solid var(--status-overdue, #FCA5A5)',
                borderRadius: '8px',
                color: 'var(--status-overdue, #B91C1C)',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Country Field (Mandatory) */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                DESTINATION COUNTRY <span style={{ color: 'var(--status-overdue, #DC2626)' }}>* (Mandatory)</span>
              </label>
            </div>
            <input
              type="text"
              list="country-suggestions"
              className="qc-input"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. United Arab Emirates, United States, Saudi Arabia..."
              style={{
                borderColor: error ? 'var(--status-overdue, #EF4444)' : undefined,
                fontWeight: '600',
              }}
              autoFocus
            />
            <datalist id="country-suggestions">
              {COMMON_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {/* Quick Country Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {['UAE', 'USA', 'Saudi Arabia', 'UK', 'Singapore', 'Australia', 'Germany'].map((shortcut) => {
                const isSelected =
                  country === shortcut ||
                  (shortcut === 'UAE' && country === 'United Arab Emirates') ||
                  (shortcut === 'USA' && country === 'United States') ||
                  (shortcut === 'UK' && country === 'United Kingdom');
                return (
                  <button
                    key={shortcut}
                    type="button"
                    onClick={() => handleShortcutSelect(shortcut)}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: isSelected ? 'var(--accent-emerald-light, rgba(16, 185, 129, 0.15))' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                    }}
                  >
                    {shortcut}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency & Tax Treatment Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            {/* Preferred Currency */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
                <Coins size={13} style={{ color: 'var(--accent-emerald)' }} />
                BILLING CURRENCY
              </label>
              <select
                className="qc-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ fontWeight: '600' }}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tax Treatment */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
                <ShieldCheck size={13} style={{ color: 'var(--accent-emerald)' }} />
                EXPORT GST TREATMENT
              </label>
              <select
                className="qc-input"
                value={taxTreatment}
                onChange={(e) => setTaxTreatment(e.target.value as any)}
                style={{ fontWeight: '600' }}
              >
                <option value="concessional_0_1">0.1% IGST (Merchant Export / Concessional)</option>
                <option value="zero_rated_lut">Zero-Rated (0% GST under LUT)</option>
                <option value="taxable_igst">Export with Regular IGST (Taxable)</option>
              </select>
            </div>
          </div>

          {/* State / Province (Optional) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
              State / Province / Region <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="qc-input"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Dubai, Abu Dhabi, California, Ontario..."
            />
          </div>

          {/* PIN / Postal / Zip Code (Optional) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
              Postal / Zip / PIN Code <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="qc-input"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="e.g. P.O. Box 12345, 90210, SW1A 1AA..."
            />
          </div>

          {/* Street Address (Optional) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
              Overseas Street Address / Location <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Optional)</span>
            </label>
            <textarea
              className="qc-input"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot No. 12, Industrial Area, Port Rashid Free Zone..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{
                height: '38px',
                fontSize: '12px',
                padding: '0 16px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                fontSize: '12px',
                padding: '0 18px',
                cursor: 'pointer',
              }}
            >
              <Check size={14} />
              Save &amp; Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
