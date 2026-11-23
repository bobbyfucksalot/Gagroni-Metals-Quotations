"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download,
  Search,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  Share2,
  FileText,
  Building,
  Layers,
  ArrowUpRight,
  Edit3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { resolveQuoteTitle } from '@/lib/quote-helper';
import { Quote, QuoteStatus } from '@/types';
import { formatINR } from '@/lib/tax-engine';

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedRowMenu, setSelectedRowMenu] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotes');
      const data = await res.json();
      if (data.quotes) {
        setQuotes(data.quotes);
      }
    } catch {
      showToast('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetch('/api/auth/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile?.name) {
          setAdminName(d.profile.name);
        }
      })
      .catch(() => {});
  }, []);

  // Aggregated Financial Metrics
  const metrics = useMemo(() => {
    let paidRevenue = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let paidOrAcceptedCount = 0;
    const totalCount = quotes.length;
    const todayStr = new Date().toISOString().split('T')[0];

    quotes.forEach((q) => {
      const grandTotal = q.totals?.grandTotal || 0;
      const isExpired = Boolean(
        q.validUntil &&
        q.validUntil < todayStr &&
        q.status !== 'Paid' &&
        q.status !== 'Accepted' &&
        q.status !== 'Rejected'
      );
      const isOverdue = q.status === 'Overdue' || isExpired;

      if (q.status === 'Paid') {
        paidRevenue += grandTotal;
        paidOrAcceptedCount += 1;
      } else if (isOverdue) {
        overdueAmount += grandTotal;
        overdueCount += 1;
      } else if (q.status === 'Accepted') {
        paidOrAcceptedCount += 1;
        pendingAmount += grandTotal;
        pendingCount += 1;
      } else {
        // Draft or Sent
        pendingAmount += grandTotal;
        pendingCount += 1;
      }
    });

    const conversionRate = totalCount > 0 ? ((paidOrAcceptedCount / totalCount) * 100).toFixed(1) : '0.0';

    return {
      paidRevenue,
      pendingAmount,
      overdueAmount,
      overdueCount,
      pendingCount,
      conversionRate,
      totalCount,
    };
  }, [quotes]);

  // Filtered Quotes
  const filteredQuotes = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return quotes.filter((q) => {
      const isExpired = Boolean(
        q.validUntil &&
        q.validUntil < todayStr &&
        q.status !== 'Paid' &&
        q.status !== 'Accepted' &&
        q.status !== 'Rejected'
      );
      const isOverdue = q.status === 'Overdue' || isExpired;

      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Drafts' && q.status === 'Draft' && !isOverdue) ||
        (activeTab === 'Sent' && q.status === 'Sent' && !isOverdue) ||
        (activeTab === 'Accepted' && q.status === 'Accepted') ||
        (activeTab === 'Paid' && q.status === 'Paid') ||
        (activeTab === 'Overdue' && isOverdue);

      const titleText = resolveQuoteTitle(q);
      const matchesSearch =
        searchQuery === '' ||
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.lineItems?.some((item) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTab && matchesSearch;
    });
  }, [quotes, activeTab, searchQuery]);

  // Dynamic Chart Data calculated from real quotations
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    // Generate last 6 months up to current month
    const months: { key: string; month: string; paid: number; pending: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        month: monthNames[d.getMonth()],
        paid: 0,
        pending: 0,
      });
    }

    // Populate with actual quotations
    quotes.forEach((q) => {
      const dateStr = q.issueDate || q.createdAt;
      if (!dateStr) return;
      const qDate = new Date(dateStr);
      if (isNaN(qDate.getTime())) return;
      
      const qKey = `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, '0')}`;
      const target = months.find((m) => m.key === qKey);
      const grandTotal = q.totals?.grandTotal || 0;

      if (target) {
        if (q.status === 'Paid') {
          target.paid += grandTotal;
        } else if (q.status !== 'Rejected') {
          target.pending += grandTotal;
        }
      }
    });

    return months.map(({ month, paid, pending }) => ({ month, paid, pending }));
  }, [quotes]);

  // Actions
  const handleDuplicate = async (quote: Quote) => {
    try {
      // The list omits image blobs, so duplicate from the full document.
      const full = await fetch(`/api/quotes/${quote.id}`).then((r) => r.json());
      const source: Quote = full.quote || quote;
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...source,
          title: `${quote.title} (Copy)`,
          status: 'Draft',
        }),
      });
      if (res.ok) {
        showToast('Quotation duplicated successfully');
        fetchQuotes();
      }
    } catch {
      showToast('Error duplicating quote');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Quotation deleted');
        fetchQuotes();
      }
    } catch {
      showToast('Error deleting quote');
    }
  };

  const exportCSV = () => {
    if (quotes.length === 0) return;
    const headers = ['Quotation No', 'Client', 'Title', 'Status', 'Issue Date', 'Valid Until', 'Grand Total (INR)'];
    const rows = quotes.map((q) => [
      q.quoteNumber,
      `"${q.clientName}"`,
      `"${q.title}"`,
      q.status,
      q.issueDate,
      q.validUntil,
      q.totals?.grandTotal || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gagroni_Metals_Quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully');
  };

  return (
    <div className="qc-layout">
      <Sidebar />
      <main className="qc-main">
        <Header />

        <div className="qc-content">
          {/* Welcome & Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
                Executive Overview
              </div>
              <h1 className="font-serif-heading" style={{ fontSize: '26px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {greeting}{adminName ? `, ${adminName}` : ''}.
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Here is the commercial health and active deal flow for Gagroni Metals.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={exportCSV} className="btn-secondary" style={{ height: '36px' }}>
                <Download size={15} /> Export CSV
              </button>
              <Link href="/dashboard/quotes/new" className="btn-primary" style={{ height: '36px', textDecoration: 'none' }}>
                <Plus size={16} /> New Quotation
              </Link>
            </div>
          </div>

          {/* 4 Financial Metric Cards - 4-column balanced responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Paid Revenue */}
            <div 
              onClick={() => setActiveTab(activeTab === 'Paid' ? 'All' : 'Paid')}
              className="qc-card qc-card-hover" 
              style={{ 
                padding: '20px', 
                cursor: 'pointer',
                border: activeTab === 'Paid' ? '1.5px solid var(--status-paid)' : '1px solid var(--border-color)',
                background: activeTab === 'Paid' ? 'var(--status-paid-bg)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease',
              }}
              title="Click to view Paid quotes"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Paid Revenue</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--status-paid-bg)', color: 'var(--status-paid)', display: 'grid', placeItems: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {formatINR(metrics.paidRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--status-paid)', fontWeight: '700' }}>
                  {quotes.filter(q => q.status === 'Paid').length} quotes
                </span> paid
              </div>
            </div>

            {/* Card 2: Pending / Sent */}
            <div 
              onClick={() => setActiveTab(activeTab === 'Sent' ? 'All' : 'Sent')}
              className="qc-card qc-card-hover" 
              style={{ 
                padding: '20px', 
                cursor: 'pointer',
                border: activeTab === 'Sent' ? '1.5px solid var(--status-sent)' : '1px solid var(--border-color)',
                background: activeTab === 'Sent' ? 'var(--status-sent-bg)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease',
              }}
              title="Click to view Pending / Sent quotes"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Pending / Sent</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--status-sent-bg)', color: 'var(--status-sent)', display: 'grid', placeItems: 'center' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {formatINR(metrics.pendingAmount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--status-sent)', fontWeight: '700' }}>{metrics.pendingCount} quotations</span> awaiting action
              </div>
            </div>

            {/* Card 3: Overdue Amount */}
            <div 
              onClick={() => setActiveTab(activeTab === 'Overdue' ? 'All' : 'Overdue')}
              className="qc-card qc-card-hover" 
              style={{ 
                padding: '20px', 
                cursor: 'pointer',
                border: activeTab === 'Overdue' ? '1.5px solid var(--status-overdue)' : '1px solid var(--border-color)',
                background: activeTab === 'Overdue' ? 'var(--status-overdue-bg)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease',
              }}
              title="Click to view Overdue quotes"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Overdue Amount</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', display: 'grid', placeItems: 'center' }}>
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {formatINR(metrics.overdueAmount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--status-overdue)', fontWeight: '700' }}>{metrics.overdueCount} quotes</span> need follow-up
              </div>
            </div>

            {/* Card 4: Conversion Rate */}
            <div 
              onClick={() => setActiveTab(activeTab === 'Accepted' ? 'All' : 'Accepted')}
              className="qc-card qc-card-hover" 
              style={{ 
                padding: '20px', 
                cursor: 'pointer',
                border: activeTab === 'Accepted' ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                background: activeTab === 'Accepted' ? 'var(--accent-emerald-light)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease',
              }}
              title="Click to view Accepted quotes"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Conversion Rate</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'grid', placeItems: 'center' }}>
                  <CheckCircle size={16} />
                </div>
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {metrics.conversionRate}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                  {quotes.filter((q) => q.status === 'Paid' || q.status === 'Accepted').length} won
                </span>{' '}
                of {quotes.length} quotes
              </div>
            </div>
          </div>

          {/* Grid: Quotes Table (60%) + Revenue Chart & Quick Actions (40%) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Quotations Table with Tabs */}
            <div className="qc-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                    Recent Quotations
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Track status and commercial values
                  </div>
                </div>

                <Link href="/dashboard/quotes" className="btn-secondary" style={{ height: '32px', fontSize: '12px', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>

              {/* Tabs & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(148, 163, 184, 0.12)', padding: '3px', borderRadius: '8px' }}>
                  {['All', 'Drafts', 'Sent', 'Accepted', 'Paid', 'Overdue'].map((tab) => {
                    const count = tab === 'Overdue' ? metrics.overdueCount : null;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                          color: activeTab === tab 
                            ? (tab === 'Overdue' ? 'var(--status-overdue)' : 'var(--text-primary)') 
                            : (tab === 'Overdue' && (count || 0) > 0 ? 'var(--status-overdue)' : 'var(--text-secondary)'),
                          boxShadow: activeTab === tab ? 'var(--shadow-card)' : 'none',
                        }}
                      >
                        {tab}
                        {count !== null && count > 0 && (
                          <span style={{ marginLeft: '4px', background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', padding: '1px 5px', borderRadius: '8px', fontSize: '10px' }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ position: 'relative', width: '180px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search quote..."
                    className="qc-input"
                    style={{ height: '32px', fontSize: '12px', paddingLeft: '30px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', minHeight: '260px' }}>
                <table className="qc-table">
                  <thead>
                    <tr>
                      <th>Quote #</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.slice(0, 6).map((q, idx) => {
                      const displayedList = filteredQuotes.slice(0, 6);
                      const isLastRows = displayedList.length > 2 && idx >= displayedList.length - 2;
                      return (
                        <tr key={q.id}>
                          <td style={{ fontWeight: '700' }}>
                            <Link href={`/dashboard/quotes/${q.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                              {q.quoteNumber}
                            </Link>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.15)', fontSize: '10px', fontWeight: '700', color: 'var(--text-primary)', display: 'grid', placeItems: 'center' }}>
                                {q.clientName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '12px' }}>{q.clientName}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{resolveQuoteTitle(q).slice(0, 32)}...</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {q.status === 'Overdue' || (q.validUntil && q.validUntil < new Date().toISOString().split('T')[0] && q.status !== 'Paid' && q.status !== 'Accepted' && q.status !== 'Rejected') ? (
                              <span className="badge-status badge-overdue">
                                Overdue
                              </span>
                            ) : (
                              <span className={`badge-status badge-${q.status.toLowerCase()}`}>
                                {q.status}
                              </span>
                            )}
                          </td>
                          <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: '700' }}>
                            {formatINR(q.totals?.grandTotal || 0)}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            <button
                              onClick={() => setSelectedRowMenu(selectedRowMenu === q.id ? null : q.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                              <MoreVertical size={15} />
                            </button>

                            {selectedRowMenu === q.id && (
                              <>
                                <div
                                  onClick={() => setSelectedRowMenu(null)}
                                  style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'transparent' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: isLastRows ? 'auto' : '35px',
                                    bottom: isLastRows ? '35px' : 'auto',
                                    background: 'var(--bg-popover)',
                                    backdropFilter: 'var(--glass-blur)',
                                    WebkitBackdropFilter: 'var(--glass-blur)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    boxShadow: 'var(--shadow-dropdown)',
                                    zIndex: 100,
                                    width: '145px',
                                    padding: '5px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    textAlign: 'left',
                                  }}
                                >
                                  <Link
                                    href={`/dashboard/quotes/${q.id}`}
                                    className="qc-nav-item"
                                    style={{ height: '32px', fontSize: '12px', padding: '0 8px' }}
                                  >
                                    <ExternalLink size={13} /> View / Print
                                  </Link>
                                  <Link
                                    href={`/dashboard/quotes/${q.id}/edit`}
                                    className="qc-nav-item"
                                    style={{ height: '32px', fontSize: '12px', padding: '0 8px', color: 'var(--accent-emerald)', fontWeight: '600' }}
                                  >
                                    <Edit3 size={13} /> Edit Quotation
                                  </Link>
                                  <button
                                    onClick={() => {
                                      handleDuplicate(q);
                                      setSelectedRowMenu(null);
                                    }}
                                    className="qc-nav-item"
                                    style={{ height: '32px', fontSize: '12px', padding: '0 8px', border: 'none', width: '100%', cursor: 'pointer' }}
                                  >
                                    <Copy size={13} /> Duplicate
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDelete(q.id);
                                      setSelectedRowMenu(null);
                                    }}
                                    className="qc-nav-item"
                                    style={{ height: '32px', fontSize: '12px', padding: '0 8px', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--status-overdue)' }}
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredQuotes.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No quotations found in this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Revenue Chart & Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Chart Card */}
              <div className="qc-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                      Revenue Trend
                    </h2>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Paid vs Pending (Last 6 Months)</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-emerald)', background: 'var(--accent-emerald-light)', padding: '2px 8px', borderRadius: '4px' }}>
                    Live Data
                  </span>
                </div>

                <div style={{ height: '190px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => (val >= 100000 ? `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L` : val > 0 ? `₹${(val / 1000).toFixed(0)}k` : '₹0')}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => [formatINR(Number(value) || 0), name === 'Paid' ? 'Paid Revenue' : 'Pending Pipeline']}
                        contentStyle={{ background: 'var(--bg-popover)', color: 'var(--text-primary)', borderRadius: '10px', fontSize: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-dropdown)' }}
                      />
                      <Bar dataKey="paid" name="Paid" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pending" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '12px', justifyContent: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i style={{ width: '8px', height: '8px', background: '#2563EB', borderRadius: '2px', display: 'inline-block' }} /> Paid Revenue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i style={{ width: '8px', height: '8px', background: '#93C5FD', borderRadius: '2px', display: 'inline-block' }} /> Pending Pipeline
                  </span>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="qc-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 14px', color: 'var(--text-primary)' }}>
                  Quick Shortcuts
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Link
                    href="/dashboard/quotes/new"
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                      transition: 'all 150ms ease',
                    }}
                    className="qc-card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <FileText size={14} style={{ color: 'var(--accent-emerald)' }} /> New Quote
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Full tax builder</div>
                  </Link>

                  <Link
                    href="/dashboard/clients"
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                    }}
                    className="qc-card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <Building size={14} style={{ color: 'var(--accent-emerald)' }} /> Add Client
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Manage directory</div>
                  </Link>

                  <Link
                    href="/dashboard/catalog"
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                    }}
                    className="qc-card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <Layers size={14} style={{ color: 'var(--status-sent)' }} /> Metal Catalog
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>SS, MS, Brass rates</div>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                    }}
                    className="qc-card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                      <Share2 size={14} style={{ color: 'var(--text-muted)' }} /> Company Branding
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Logo & Bank IFSC</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
