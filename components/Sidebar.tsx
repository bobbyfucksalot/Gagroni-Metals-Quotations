"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Layers,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Download,
} from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [adminUser, setAdminUser] = React.useState({ name: 'Admin', role: 'admin' });
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setInstallPrompt(null);
    }
  };

  React.useEffect(() => {
    // Check sessionStorage cache first for instantaneous render
    const cachedName = typeof window !== 'undefined' ? sessionStorage.getItem('gm_admin_name') : null;
    if (cachedName) {
      setAdminUser({ name: cachedName, role: 'admin' });
      return;
    }

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.name && data.user.name !== 'Aarav Kapoor') {
          setAdminUser(data.user);
          sessionStorage.setItem('gm_admin_name', data.user.name);
        } else {
          fetch('/api/settings')
            .then((r) => r.json())
            .then((s) => {
              const realName = s.settings?.signatoryName || 'Faizan Uddin';
              setAdminUser({ name: realName, role: 'admin' });
              sessionStorage.setItem('gm_admin_name', realName);
            })
            .catch(() => setAdminUser({ name: 'Faizan Uddin', role: 'admin' }));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quotations', href: '/dashboard/quotes', icon: FileSpreadsheet },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Product Catalog', href: '/dashboard/catalog', icon: Layers },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Branding & Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const initials = adminUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <aside className="qc-sidebar" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Soft ambient glow behind brand */}
      <div
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: '180px',
          background: 'linear-gradient(to bottom, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.05), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand Section */}
      <div style={{ position: 'relative', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#FFFFFF', padding: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Image
              src="/gagroni-metals-logo.png"
              alt="Gagroni Metals"
              fill
              sizes="38px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.25 }}>
              Gagroni Metals <span style={{ color: '#FFFFFF', fontSize: '9px', fontWeight: '800', background: 'linear-gradient(180deg, #4F8DF7 0%, #2563EB 100%)', padding: '2px 5px', borderRadius: '4px', display: 'inline-block' }}>QUOTES</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Enterprise Commercial Suite</div>
          </div>
        </Link>
      </div>

      {/* Main Navigation with internal scroll */}
      <div style={{ position: 'relative', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px', flexShrink: 0 }}>
        Sales Suite
      </div>

      <nav style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`qc-nav-item ${isActive ? 'active' : ''}`}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'linear-gradient(180deg, #4F8DF7 0%, #2563EB 100%)' : 'rgba(148, 163, 184, 0.12)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 4px 12px -2px rgba(37, 99, 235, 0.5)' : 'none',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
              </div>
              <span style={{ fontWeight: isActive ? '600' : '500' }}>{item.name}</span>
            </Link>
          );
        })}

        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '14px', marginBottom: '8px', paddingLeft: '8px', flexShrink: 0 }}>
          Insights & System
        </div>

        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`qc-nav-item ${isActive ? 'active' : ''}`}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'linear-gradient(180deg, #4F8DF7 0%, #2563EB 100%)' : 'rgba(148, 163, 184, 0.12)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 4px 12px -2px rgba(37, 99, 235, 0.5)' : 'none',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
              </div>
              <span style={{ fontWeight: isActive ? '600' : '500' }}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: User Profile */}
      <div style={{ position: 'relative', marginTop: 'auto', paddingTop: '12px', flexShrink: 0 }}>
        {/* Install Desktop App Button */}
        {installPrompt && !isStandalone && (
          <button
            type="button"
            onClick={handleInstallApp}
            className="btn-primary"
            style={{
              width: '100%',
              marginBottom: '10px',
              padding: '8px 12px',
              height: '34px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Download size={13} /> Install Desktop App
          </button>
        )}

        {/* Dark / Light Mode Switch */}
        <ThemeToggle variant="sidebar" />

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: 'var(--shadow-card)', marginTop: '8px' }}>
          <Link
            href="/dashboard/settings?tab=profile"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1, minWidth: 0 }}
            title="Edit Admin Profile & Password"
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #4F8DF7)', color: '#FFFFFF', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '11px' }}>
                {initials}
              </div>
              <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg-surface)' }} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {adminUser.name} <ShieldCheck size={13} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Admin · Profile &amp; Pass</div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
