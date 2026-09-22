"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Building, User, Phone, Mail, MapPin, Check, X, ExternalLink, PlusCircle } from 'lucide-react';
import { Client } from '@/types';
import { resolvePartyState } from '@/lib/tax-engine';

interface PartySearchSelectProps {
  clients: Client[];
  selectedClientId?: string;
  selectedClientName?: string;
  onSelectClient: (client: Client) => void;
  onClearClient?: () => void;
}

export default function PartySearchSelect({
  clients,
  selectedClientId,
  selectedClientName,
  onSelectClient,
  onClearClient,
}: PartySearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected client object if any
  const currentClient = useMemo(() => {
    if (selectedClientId) {
      return clients.find((c) => c.id === selectedClientId);
    }
    if (selectedClientName) {
      return clients.find((c) => c.name.toLowerCase() === selectedClientName.toLowerCase());
    }
    return null;
  }, [clients, selectedClientId, selectedClientName]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 8); // show first 8 initially
    return clients.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.taxId && c.taxId.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q)) ||
        (c.billingAddress && c.billingAddress.toLowerCase().includes(q))
      );
    });
  }, [clients, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClearClient) {
      onClearClient();
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Search size={13} style={{ color: 'var(--accent-emerald)' }} />
          SEARCH PARTY / CUSTOMER *
        </label>
        <a
          href="/dashboard/clients"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: '600' }}
        >
          <PlusCircle size={12} /> New Party <ExternalLink size={10} />
        </a>
      </div>

      {/* If a client is selected, show this quick summary banner with option to change or clear */}
      {currentClient && !isOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--accent-emerald-light, #ecfdf5)',
            border: '1.5px solid var(--accent-emerald, #10b981)',
            borderRadius: '8px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--accent-emerald, #10b981)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              <Building size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentClient.name}
                </strong>
                {currentClient.category && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#d1fae5',
                      color: '#065f46',
                      fontWeight: '700',
                    }}
                  >
                    {currentClient.category}
                  </span>
                )}
                {currentClient.taxId && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#ffffff',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                    }}
                  >
                    GST: {currentClient.taxId}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {currentClient.contactPerson && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <User size={11} /> {currentClient.contactPerson}
                  </span>
                )}
                {currentClient.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Phone size={11} /> {currentClient.phone}
                  </span>
                )}
                {(() => {
                  const resolved = resolvePartyState(currentClient);
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={11} /> {resolved.state} ({resolved.stateCode})
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
            >
              Change Party
            </button>
            {onClearClient && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear selected client"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input Bar (shown when no client selected or when user is actively searching/changing) */}
      {(!currentClient || isOpen) && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted, #9ca3af)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              className="qc-input"
              style={{
                paddingLeft: '36px',
                paddingRight: searchQuery ? '32px' : '12px',
                fontSize: '12px',
                borderColor: isOpen ? 'var(--accent-emerald)' : undefined,
                boxShadow: isOpen ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : undefined,
              }}
              placeholder="Type Party Name, Contact Person, GSTIN, Phone, City..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                maxHeight: '280px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-muted, #6b7280)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fafafa',
                }}
              >
                <span>
                  {searchQuery
                    ? `Matching Parties (${filteredClients.length})`
                    : `Registered Parties (${clients.length})`}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Click to auto-fill quotation</span>
              </div>

              {filteredClients.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Building size={24} style={{ margin: '0 auto 8px', color: '#d1d5db' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>No party found matching &ldquo;{searchQuery}&rdquo;</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    You can enter details manually in the fields below or register a new client.
                  </div>
                  <a
                    href="/dashboard/clients"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '10px',
                      fontSize: '11px',
                      padding: '4px 12px',
                      textDecoration: 'none',
                    }}
                  >
                    <PlusCircle size={12} /> Add New Client in Database
                  </a>
                </div>
              ) : (
                <div style={{ padding: '4px 0' }}>
                  {filteredClients.map((client) => {
                    const isSelected = client.id === selectedClientId;
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleSelect(client)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          borderBottom: '1px solid #f9fafb',
                          background: isSelected ? 'var(--accent-emerald-light, #ecfdf5)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {client.name}
                            </span>
                            {client.category && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: '#f3f4f6',
                                  color: '#4b5563',
                                  fontWeight: '600',
                                }}
                              >
                                {client.category}
                              </span>
                            )}
                            {client.taxId && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  fontFamily: 'monospace',
                                  fontWeight: '600',
                                }}
                              >
                                {client.taxId}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              marginTop: '3px',
                              display: 'flex',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            {client.contactPerson && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <User size={11} /> {client.contactPerson}
                              </span>
                            )}
                            {client.phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Phone size={11} /> {client.phone}
                              </span>
                            )}
                            {(() => {
                              const resolved = resolvePartyState(client);
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <MapPin size={11} /> {resolved.state} ({resolved.stateCode})
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {isSelected ? (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'var(--accent-emerald)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={14} />
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--accent-emerald)',
                              flexShrink: 0,
                            }}
                          >
                            Select →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
