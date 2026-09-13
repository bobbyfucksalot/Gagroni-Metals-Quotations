"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Settings as SettingsIcon,
  Building,
  CreditCard,
  FileText,
  Save,
  Palette,
  CheckCircle2,
  ShieldCheck,
  Upload,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  QrCode,
  Trash2,
  PenTool,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import SignaturePad from '@/components/SignaturePad';
import { CompanySettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'branding' | 'bank' | 'terms' | 'profile'>('branding');

  // Admin Profile & Security State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useEffect(() => {
    // Check if ?tab=profile in url
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'profile' || tab === 'security') {
        setActiveTab('profile');
      }
    }

    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [resSettings, resProfile] = await Promise.all([
          fetch('/api/settings').then((r) => r.json()),
          fetch('/api/auth/profile').then((r) => r.json()).catch(() => null),
        ]);

        if (resSettings.settings) setSettings(resSettings.settings);
        if (resProfile?.profile) {
          setAdminName(resProfile.profile.name);
          setAdminEmail(resProfile.profile.email);
        }
      } catch {
        showToast('Error loading settings profile');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      showToast('Admin name cannot be empty');
      return;
    }
    if (!adminEmail.trim()) {
      showToast('Login email cannot be empty');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('New passwords do not match');
      return;
    }

    setAdminSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName.trim(),
          email: adminEmail.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          confirmPassword: confirmPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update admin profile');
        setAdminSaving(false);
        return;
      }

      showToast(data.message || 'Admin profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (data.profile?.name) {
        setAdminName(data.profile.name);
      }
      if (data.profile?.email) {
        setAdminEmail(data.profile.email);
      }
    } catch {
      showToast('Network error while updating profile');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast('Settings & branding saved successfully!');
      } else {
        showToast('Failed to update settings');
      }
    } catch {
      showToast('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="qc-layout">
        <Sidebar />
        <main className="qc-main">
          <Header />
          <div className="qc-content" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Loading settings profile...</div>
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
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
                System Configuration
              </div>
              <h1 className="font-serif-heading" style={{ fontSize: '30px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                Branding & Statutory Settings
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                Configure official company credentials, banking remittance instructions, and document themes.
              </p>
            </div>

            {activeTab === 'profile' ? (
              <button onClick={handleSaveAdminProfile} disabled={adminSaving} className="btn-primary">
                <Lock size={15} /> {adminSaving ? 'Saving Profile...' : 'Update Admin Profile'}
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="qc-card" style={{ padding: '12px 16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'branding' ? 'var(--accent-emerald-light)' : 'transparent',
                  color: activeTab === 'branding' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building size={15} /> Company & Legal Info
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'bank' ? 'var(--accent-emerald-light)' : 'transparent',
                  color: activeTab === 'bank' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard size={15} /> Banking & Payment Remittance
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'terms' ? 'var(--accent-emerald-light)' : 'transparent',
                  color: activeTab === 'terms' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={15} /> Default Terms & PDF Theme
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === 'profile' ? 'var(--accent-emerald-light)' : 'transparent',
                  color: activeTab === 'profile' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UserCheck size={15} /> Admin Profile &amp; Password
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeTab === 'branding' && (
              <div className="qc-card" style={{ padding: '28px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px', color: 'var(--text-primary)' }}>
                  Company Profile & Statutory Identifiers
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Company Name (Legal Registered Entity)
                    </label>
                    <input
                      type="text"
                      required
                      className="qc-input"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Business Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      GSTIN (Goods & Services Tax ID)
                    </label>
                    <input
                      type="text"
                      required
                      className="qc-input"
                      value={settings.taxId}
                      onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Income Tax PAN Number
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.panNumber}
                      onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      MSME / Udyam Registration No.
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      placeholder="e.g. UDYAM-RJ-14-0012345"
                      value={settings.msmeNumber || ''}
                      onChange={(e) => setSettings({ ...settings, msmeNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Import Export Code (IEC)
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      placeholder="e.g. 0812345678"
                      value={settings.iecNumber || ''}
                      onChange={(e) => setSettings({ ...settings, iecNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Corporate Identification Number (CIN)
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      placeholder="Enter CIN number (optional)"
                      value={settings.cinNumber || ''}
                      onChange={(e) => setSettings({ ...settings, cinNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Official Email
                    </label>
                    <input
                      type="email"
                      required
                      className="qc-input"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Telephone / WhatsApp Phone
                    </label>
                    <input
                      type="text"
                      required
                      className="qc-input"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Website URL
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      City & State
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={`${settings.city}, ${settings.state}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(',');
                        setSettings({
                          ...settings,
                          city: parts[0]?.trim() || '',
                          state: parts[1]?.trim() || '',
                        });
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Registered Factory / Office Address
                  </label>
                  <textarea
                    rows={2}
                    className="qc-textarea"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>

                {/* Signatory */}
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Authorized Signatory Name
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.signatoryName}
                      onChange={(e) => setSettings({ ...settings, signatoryName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Signatory Designation / Title
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.signatoryTitle}
                      onChange={(e) => setSettings({ ...settings, signatoryTitle: e.target.value })}
                    />
                  </div>
                </div>

                {/* Company Authorized Signature Upload */}
                <div style={{ marginTop: '20px', padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PenTool size={15} style={{ color: 'var(--accent-emerald)' }} /> Official Company Authorized Signature / Stamp
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Upload your official scanned signature or seal image (PNG/JPG). This will automatically appear on all quotations.
                      </div>
                    </div>

                    {settings.signatureUrl && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Upload size={12} /> Change Signature
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setSettings({ ...settings, signatureUrl: evt.target?.result as string });
                                showToast('Signature uploaded!');
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, signatureUrl: '' })}
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            color: '#B91C1C',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {settings.signatureUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <div style={{ background: '#F8FAFC', padding: '8px 16px', borderRadius: '6px', border: '1px dashed #94A3B8' }}>
                        <img
                          src={settings.signatureUrl}
                          alt="Company Signature"
                          style={{ maxHeight: '50px', maxWidth: '180px', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={14} /> Active Signature Attached
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Will appear above &ldquo;{settings.signatoryName || 'Authorized Signatory'}&rdquo; on all quotes.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px dashed #94A3B8',
                        textAlign: 'center',
                      }}
                    >
                      <Upload size={22} style={{ color: 'var(--accent-emerald)', marginBottom: '6px' }} />
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        Click to upload Official Signature / Stamp Image
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Supports PNG (transparent recommended), JPG, WebP
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
                            setSettings({ ...settings, signatureUrl: evt.target?.result as string });
                            showToast('Signature uploaded!');
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="qc-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                      Bank Details &amp; UPI Payment QR Code
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Configure bank remittance information, upload your UPI QR code, and customize what appears on quotation documents.
                    </div>
                  </div>
                </div>

                {/* Display Mode Selection: Both vs Bank Only vs QR Only */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Payment Mode Display on Quotations &amp; Invoices
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {[
                      { id: 'both', title: 'Both: Bank Details + QR Code', desc: 'Show full bank remittance info and UPI QR code side-by-side' },
                      { id: 'bank_only', title: 'Bank Details Only', desc: 'Show traditional RTGS / NEFT / IMPS account numbers without QR' },
                      { id: 'qr_only', title: 'Payment QR Code Only', desc: 'Show Scan to Pay UPI QR code without revealing bank account number' },
                    ].map((opt) => {
                      const isSelected = (settings.paymentModePreference || 'both') === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSettings({ ...settings, paymentModePreference: opt.id as any })}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                            background: isSelected ? '#ECFDF5' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <input
                              type="radio"
                              name="paymentModePreference"
                              checked={isSelected}
                              onChange={() => setSettings({ ...settings, paymentModePreference: opt.id as any })}
                              style={{ accentColor: 'var(--accent-emerald)' }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#047857' : 'var(--text-primary)' }}>
                              {opt.title}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '22px' }}>
                            {opt.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* QR Code Upload Card */}
                <div style={{ marginBottom: '24px', padding: '18px', background: '#FFFFFF', borderRadius: '10px', border: '1.5px dashed #CBD5E1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <QrCode size={16} style={{ color: 'var(--accent-emerald)' }} /> Official Payment QR Code (PhonePe, GPay, Paytm, BHIM)
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Upload your merchant or bank UPI QR code. Customers can scan directly from the quotation PDF to pay.
                      </div>
                    </div>

                    {settings.paymentQrUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Upload size={13} /> Change QR Code
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setSettings({ ...settings, paymentQrUrl: evt.target?.result as string });
                                showToast('Payment QR Code uploaded!');
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, paymentQrUrl: '' })}
                          style={{
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            color: '#B91C1C',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={13} /> Remove QR
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {settings.paymentQrUrl ? (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ border: '2px solid #E2E8F0', borderRadius: '8px', padding: '6px', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <img
                          src={settings.paymentQrUrl}
                          alt="Payment QR"
                          style={{ width: '130px', height: '130px', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={15} /> Active QR Code Attached
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          This QR code is active and will appear on quotation documents according to your display preference.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        marginTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px dashed #94A3B8',
                      }}
                    >
                      <Upload size={24} style={{ color: 'var(--accent-emerald)', marginBottom: '8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        Click to upload Payment QR Code
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Supports JPG, PNG, WebP screenshot or download from GPay, PhonePe, Paytm, or your bank app
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
                            setSettings({ ...settings, paymentQrUrl: evt.target?.result as string });
                            showToast('Payment QR Code uploaded!');
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Bank Account Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.bankAccountNo}
                      onChange={(e) => setSettings({ ...settings, bankAccountNo: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      IFSC / NEFT Code
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.bankIfsc}
                      onChange={(e) => setSettings({ ...settings, bankIfsc: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Branch Location
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.bankBranch}
                      onChange={(e) => setSettings({ ...settings, bankBranch: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      UPI ID (Optional if QR is uploaded)
                    </label>
                    <input
                      type="text"
                      className="qc-input"
                      value={settings.upiId || ''}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                      placeholder="e.g. gagronimetals@hdfcbank (leave empty if not needed)"
                    />
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Aap UPI ID rakh bhi sakte hain ya hata bhi sakte hain agar sirf QR code lagana ho.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="qc-card" style={{ padding: '28px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px', color: 'var(--text-primary)' }}>
                  Default Document Policies & Theme Style
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Default Quotation Validity (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="qc-input"
                      value={settings.defaultValidDays}
                      onChange={(e) => setSettings({ ...settings, defaultValidDays: Number(e.target.value) || 15 })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Default PDF Document Theme
                    </label>
                    <select
                      className="qc-input"
                      value={settings.defaultPdfTheme}
                      onChange={(e) => setSettings({ ...settings, defaultPdfTheme: e.target.value as any })}
                    >
                      <option value="executive">Executive Navy (Corporate)</option>
                      <option value="modern">Modern Emerald (Gagroni Signature)</option>
                      <option value="minimal">Clean Minimal (Monochrome)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                    Standard Commercial Terms & Conditions (Appended to all Quotes)
                  </label>
                  <textarea
                    rows={6}
                    className="qc-textarea"
                    value={settings.defaultNotes}
                    onChange={(e) => setSettings({ ...settings, defaultNotes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Admin Identity Card */}
                <div className="qc-card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: '800', flexShrink: 0 }}>
                        {adminName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {adminName}
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px' }}>
                            Full Admin Access
                          </span>
                        </h2>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Primary Administrator Account · Gagroni Metals Workspace
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                        Admin Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="qc-input"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Faizan Uddin"
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        This name appears on the sidebar, header, and authorized quote signatory stamp.
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                        Login Email ID
                      </label>
                      <input
                        type="email"
                        className="qc-input"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. admin@gagronimetals.com"
                        required
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Used for signing into the Gagroni Metals admin workspace.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="qc-card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <KeyRound size={18} style={{ color: 'var(--accent-emerald)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                      Change Admin Password
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '20px' }}>
                    Enter your current password followed by your new password to update your login credentials.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                        Current Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          className="qc-input"
                          style={{ paddingRight: '36px' }}
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          title={showCurrentPw ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                        New Password (Min 6 chars)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          className="qc-input"
                          style={{ paddingRight: '36px' }}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          title={showNewPw ? 'Hide password' : 'Show password'}
                        >
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        className="qc-input"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleSaveAdminProfile}
                      disabled={adminSaving}
                      className="btn-primary"
                      style={{ height: '42px', padding: '0 20px', fontSize: '13px' }}
                    >
                      <Lock size={15} /> {adminSaving ? 'Saving Profile...' : 'Update Admin Profile & Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'profile' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ height: '44px', padding: '0 24px' }}>
                  <Save size={16} /> {saving ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            )}
          </form>
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
