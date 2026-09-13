"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Edit2,
  X,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Client, Quote } from '@/types';
import { formatINR } from '@/lib/tax-engine';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    billingAddress: '',
    taxId: '',
    category: 'Commercial' as Client['category'],
    notes: '',
  });

  // Selected Client Details Drawer / History
  const [selectedClientHistory, setSelectedClientHistory] = useState<Client | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resClients, resQuotes] = await Promise.all([
        fetch('/api/clients').then((r) => r.json()),
        fetch('/api/quotes').then((r) => r.json()),
      ]);

      if (resClients.clients) setClients(resClients.clients);
      if (resQuotes.quotes) setQuotes(resQuotes.quotes);
    } catch {
      showToast('Error loading clients directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.taxId.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [clients, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      billingAddress: '',
      taxId: '',
      category: 'Commercial',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      billingAddress: client.billingAddress,
      taxId: client.taxId,
      category: client.category,
      notes: client.notes || '',
    });
    setShowModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast('Client profile updated');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast('New client added to directory');
          setShowModal(false);
          fetchData();
        }
      }
    } catch {
      showToast('Error saving client');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to remove this client from the directory?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Client deleted');
        fetchData();
        if (selectedClientHistory?.id === id) setSelectedClientHistory(null);
      }
    } catch {
      showToast('Error deleting client');
    }
  };

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
                Relationship Directory
              </div>
              <h1 className="font-serif-heading" style={{ fontSize: '30px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                Clients & Accounts
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                Manage enterprise procurement accounts, GST tax credentials, and historical deal archives.
              </p>
            </div>

            <button onClick={handleOpenAddModal} className="btn-primary">
              <Plus size={16} /> Add New Client
            </button>
          </div>

          {/* Filters & Search */}
          <div className="qc-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', background: '#F4F4F5', padding: '4px', borderRadius: '8px' }}>
                {['All', 'Enterprise', 'Commercial', 'Fabricator', 'Retail'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: selectedCategory === cat ? '#FFFFFF' : 'transparent',
                      color: selectedCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: selectedCategory === cat ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search client, GSTIN, contact..."
                  className="qc-input"
                  style={{ paddingLeft: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Clients Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredClients.map((client) => {
              const clientQuotes = quotes.filter(
                (q) => q.clientId === client.id || q.clientName.toLowerCase() === client.name.toLowerCase()
              );
              const paidTotal = clientQuotes
                .filter((q) => q.status === 'Paid')
                .reduce((acc, q) => acc + (q.totals?.grandTotal || 0), 0);
              const pendingCount = clientQuotes.filter((q) => q.status === 'Sent' || q.status === 'Draft').length;

              return (
                <div key={client.id} className="qc-card qc-card-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'var(--accent-emerald-light)',
                          color: 'var(--accent-emerald)',
                          fontWeight: '800',
                          fontSize: '14px',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                          {client.name}
                        </h2>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Attn: {client.contactPerson || 'Procurement Dept'}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#1E3A8A', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                      {client.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.taxId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '10px', color: 'var(--accent-emerald)' }}>GSTIN:</span>
                        <span style={{ fontFamily: 'monospace' }}>{client.taxId}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats for this client */}
                  <div style={{ background: '#FAFAF9', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '11px' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Total Paid to Date</div>
                      <div className="tabular-nums font-serif-heading" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {formatINR(paidTotal)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Active Quotes</div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#B45309', marginTop: '2px' }}>
                        {pendingCount} Pending
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => setSelectedClientHistory(client)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-emerald)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileSpreadsheet size={13} /> {clientQuotes.length} Quotes History →
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="btn-secondary"
                        style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
                        title="Edit Client"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="btn-danger"
                        style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
                        title="Delete Client"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add / Edit Client Modal */}
          {showModal && (
            <div className="qc-modal-overlay">
              <div className="qc-modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                    {editingClient ? 'Edit Client Profile' : 'Add New Client'}
                  </h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Company / Entity Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="qc-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Apex Industries Ltd."
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Contact Person
                      </label>
                      <input
                        type="text"
                        className="qc-input"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Rajesh Sharma"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        className="qc-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="procurement@apexind.com"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        className="qc-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98210 11223"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        GSTIN / Tax ID
                      </label>
                      <input
                        type="text"
                        className="qc-input"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="27AABCA1234A1Z1"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Client Category
                      </label>
                      <select
                        className="qc-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      >
                        <option value="Enterprise">Enterprise</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Fabricator">Fabricator</option>
                        <option value="Retail">Retail</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      Billing / Dispatch Address
                    </label>
                    <textarea
                      rows={2}
                      className="qc-textarea"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      placeholder="Street, Industrial Area, City, State, PIN"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      Internal Relationship Notes
                    </label>
                    <textarea
                      rows={2}
                      className="qc-textarea"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special payment terms, frequent items ordered..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingClient ? 'Save Changes' : 'Add Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Client History Drawer */}
          {selectedClientHistory && (
            <div className="qc-modal-overlay">
              <div className="qc-modal-content" style={{ maxWidth: '750px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                      {selectedClientHistory.name}
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Historical Quotations & Commercial Deal Archive
                    </div>
                  </div>
                  <button onClick={() => setSelectedClientHistory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={18} />
                  </button>
                </div>

                <table className="qc-table" style={{ marginTop: '12px' }}>
                  <thead>
                    <tr>
                      <th>Quote #</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes
                      .filter(
                        (q) =>
                          q.clientId === selectedClientHistory.id ||
                          q.clientName.toLowerCase() === selectedClientHistory.name.toLowerCase()
                      )
                      .map((q) => (
                        <tr key={q.id}>
                          <td style={{ fontWeight: '700' }}>{q.quoteNumber}</td>
                          <td>{q.title}</td>
                          <td>
                            <span className={`badge-status badge-${q.status.toLowerCase()}`}>{q.status}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{q.issueDate}</td>
                          <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: '700' }}>
                            {formatINR(q.totals?.grandTotal || 0)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/dashboard/quotes/${q.id}`} style={{ color: 'var(--accent-emerald)', textDecoration: 'none' }}>
                              <ExternalLink size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelectedClientHistory(null)} className="btn-secondary">
                    Close History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
