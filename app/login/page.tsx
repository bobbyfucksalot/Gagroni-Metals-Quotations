"use client";

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('admin@metals.co');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError('An error occurred during sign-in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="qc-card"
      style={{
        width: '100%',
        maxWidth: '420px',
        padding: '36px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Secure Administrator Gate
        </div>
        <h1 className="font-serif-heading" style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          Sign in to Workspace
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Access Gagroni Metals quotes, clients, and financial records.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Admin Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="email"
              required
              className="qc-input"
              style={{ paddingLeft: '38px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@metals.co"
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Password
            </label>
            <span style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>Default: admin123</span>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="password"
              required
              className="qc-input"
              style={{ paddingLeft: '38px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', height: '44px', fontSize: '14px', marginTop: '8px' }}
        >
          {loading ? 'Authenticating...' : 'Enter Workspace'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)' }} />
        <span>Single-tenant encrypted session · Gagroni Metals</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ position: 'relative', width: '46px', height: '46px' }}>
            <Image
              src="/gagroni-metals-logo.png"
              alt="Gagroni Metals"
              fill
              sizes="46px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Gagroni Metals <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', background: 'var(--accent-emerald-light)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>QUOTATION MAKER</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Enterprise Workspace</div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading gate...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
