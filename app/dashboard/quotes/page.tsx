"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Download,
  Filter,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Quote } from '@/types';
import { formatINR } from '@/lib/tax-engine';

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedRowMenu, setSelectedRowMenu] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotes');
      const data = await res.json();
      if (data.quotes) setQuotes(data.quotes);
    } catch {
      showToast('Error loading quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Drafts' && q.status === 'Draft') ||
        (activeTab === 'Sent' && q.status === 'Sent') ||
        (activeTab === 'Accepted' && q.status === 'Accepted') ||
        (activeTab === 'Paid' && q.status === 'Paid') ||
        (activeTab === 'Overdue' && q.status === 'Overdue');

      const matchesSearch =
        searchQuery === '' ||
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [quotes, activeTab, searchQuery]);

  const handleDuplicate = async (quote: Quote) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quote,
          title: `${quote.title} (Copy)`,
          status: 'Draft',
        }),
      });
      if (res.ok) {
        showToast('Quotation duplicated successfully');
        fetchQuotes();
      }
    } catch {
      showToast('Error duplicating quotation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this quotation?')) return;
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Quotation deleted successfully');
        fetchQuotes();
      }
    } catch {
      showToast('Error deleting quotation');
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
    link.setAttribute('download', `Gagroni_Metals_Quotes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file');
  };

  return (
    <div className="qc-layout">
      <Sidebar />
      <main className="qc-main">
        <Header />

        <div className="qc-content">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
                Commercial Registry
              </div>
              <h1 className="font-serif-heading" style={{ fontSize: '30px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                Quotations & Proposals
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                Create, track, version, and manage every commercial estimate in one unified workspace.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={exportCSV} className="btn-secondary">
                <Download size={15} /> Export CSV
              </button>
              <Link href="/dashboard/quotes/new" className="btn-primary" style={{ textDecoration: 'none' }}>
                <Plus size={16} /> New Quotation
              </Link>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="qc-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: '#F4F4F5', padding: '4px', borderRadius: '8px' }}>
                {['All', 'Drafts', 'Sent', 'Accepted', 'Paid', 'Overdue'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeTab === tab ? '#FFFFFF' : 'transparent',
                      color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by quote #, client, item..."
                  className="qc-input"
                  style={{ paddingLeft: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quotations Table */}
          <div className="qc-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="qc-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Client & Contact</th>
                  <th>Project Description</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th style={{ textAlign: 'right' }}>Total Value</th>
                  <th style={{ textAlign: 'center', width: '60px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: '700' }}>
                      <Link
                        href={`/dashboard/quotes/${q.id}`}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {q.quoteNumber}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: '#F4F4F5', padding: '1px 5px', borderRadius: '4px' }}>
                          v{q.version || 1}
                        </span>
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{q.clientName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.clientEmail || q.clientPhone || 'No contact specified'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{q.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {q.lineItems?.length || 0} line items · {q.taxMode === 'gst_intra' ? 'CGST+SGST' : 'IGST'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge-status badge-${q.status.toLowerCase()}`}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {q.validUntil}
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>
                      {formatINR(q.totals?.grandTotal || 0)}
                    </td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        onClick={() => setSelectedRowMenu(selectedRowMenu === q.id ? null : q.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {selectedRowMenu === q.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '40px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-dropdown)',
                            zIndex: 50,
                            width: '150px',
                            padding: '4px',
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
                            style={{ height: '32px', fontSize: '12px', padding: '0 8px', border: 'none', width: '100%', cursor: 'pointer', color: '#B91C1C' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      <FileSpreadsheet size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>No quotations found</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>Try changing the search query or active filter tab.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
