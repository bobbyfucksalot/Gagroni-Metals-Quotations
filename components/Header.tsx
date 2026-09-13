"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, Calendar, Bell } from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';

interface HeaderProps {
  onSearchClick?: () => void;
}

export default function Header({ onSearchClick }: HeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.startsWith('/dashboard/quotes/new')) return 'Quotations / New Quotation';
    if (pathname.startsWith('/dashboard/quotes')) return 'Quotations';
    if (pathname.startsWith('/dashboard/clients')) return 'Client Directory';
    if (pathname.startsWith('/dashboard/catalog')) return 'Product Catalog';
    if (pathname.startsWith('/dashboard/analytics')) return 'Financial Intelligence';
    if (pathname.startsWith('/dashboard/settings')) return 'Branding & Settings';
    return 'Workspace';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="qc-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span style={{ fontWeight: '500' }}>Workspace</span>
        <span style={{ color: 'var(--border-color)' }}>/</span>
        <strong style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{getBreadcrumbs()}</strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Date pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', paddingRight: '4px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <span>{currentDate}</span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle variant="compact" />

        {/* Action shortcut */}
        <Link
          href="/dashboard/quotes/new"
          className="btn-primary"
          style={{ height: '36px', padding: '0 14px', fontSize: '12px', textDecoration: 'none' }}
        >
          <Plus size={15} />
          <span>New Quote</span>
        </Link>
      </div>
    </header>
  );
}
