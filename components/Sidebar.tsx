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
    <aside className="qc-sidebar">
      {/* Brand Section */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
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
              Gagroni Metals <span style={{ color: 'var(--accent-emerald)', fontSize: '10px', fontWeight: '800', background: 'var(--accent-emerald-light)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>QUOTATION MAKER</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Enterprise Commercial Suite</div>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>
        Sales Suite
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`qc-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)' }} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '16px', marginBottom: '8px', paddingLeft: '8px' }}>
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
              <Icon size={18} style={{ color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)' }} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: User Profile */}
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        {/* Install Desktop App Button */}
        {installPrompt && !isStandalone && (
          <button
            type="button"
            onClick={handleInstallApp}
            style={{
              width: '100%',
              marginBottom: '10px',
              padding: '8px 12px',
              background: '#047857',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
            }}
          >
            <Download size={14} /> Install Desktop App
          </button>
        )}

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
          <Link
            href="/dashboard/settings?tab=profile"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1, minWidth: 0 }}
            title="Edit Admin Profile & Password"
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>
              {initials}
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
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'grid', placeItems: 'center', flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#B91C1C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
