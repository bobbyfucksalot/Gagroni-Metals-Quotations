"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Edit2,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  X,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Product } from '@/types';
import { formatINR } from '@/lib/tax-engine';

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Stainless Steel' as Product['category'],
    description: '',
    mrp: 1000,
    offerPrice: 900,
    defaultGstRate: 18,
    unit: 'pcs' as Product['unit'],
    stockQty: 50,
    hsnCode: '730890',
    imageUrl: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch {
      showToast('Error loading product catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const defaultCats = [
      'Stainless Steel',
      'Mild Steel',
      'Brass & Copper',
      'Aluminum',
      'Custom Fabrication',
      'Fasteners & Hardware',
    ];
    const set = new Set<string>(defaultCats);
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hsnCode.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `GM-MET-${Date.now().toString().slice(-4)}`,
      category: 'Stainless Steel',
      description: '',
      mrp: 5000,
      offerPrice: 4500,
      defaultGstRate: 18,
      unit: 'pcs',
      stockQty: 50,
      hsnCode: '730890',
      imageUrl: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description,
      mrp: p.mrp,
      offerPrice: p.offerPrice,
      defaultGstRate: p.defaultGstRate,
      unit: p.unit,
      stockQty: p.stockQty || 0,
      hsnCode: p.hsnCode,
      imageUrl: p.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, imageUrl: base64 }));
      showToast('Product photo attached successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast('Product updated');
          setShowModal(false);
          fetchProducts();
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast('Product added to catalog');
          setShowModal(false);
          fetchProducts();
        }
      }
    } catch {
      showToast('Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed');
        fetchProducts();
      }
    } catch {
      showToast('Error deleting product');
    }
  };

  const exportCSV = () => {
    if (products.length === 0) return;
    const headers = ['SKU', 'Name', 'Category', 'Description', 'MRP', 'OfferPrice', 'GST_Rate', 'Unit', 'HSN_Code', 'Stock', 'Image_URL'];
    const rows = products.map((p) => [
      p.sku,
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.description}"`,
      p.mrp,
      p.offerPrice,
      p.defaultGstRate,
      p.unit,
      p.hsnCode,
      p.stockQty || 0,
      p.imageUrl ? `"${p.imageUrl}"` : '""',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gagroni_Metals_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Catalog CSV');
  };

  const handleCreateQuoteWithProduct = (p: Product) => {
    router.push(`/dashboard/quotes/new`);
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
                Inventory & Offerings
              </div>
              <h1 className="font-serif-heading" style={{ fontSize: '30px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                Product & Alloy Catalog
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                Manage Stainless Steel (SS 304/316), MS, Brass profiles, standard rates, and HSN codes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={exportCSV} className="btn-secondary">
                <Download size={15} /> Export Catalog
              </button>
              <button onClick={handleOpenAddModal} className="btn-primary">
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="qc-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', background: '#F4F4F5', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
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
                  placeholder="Search SKU, alloy, grade..."
                  className="qc-input"
                  style={{ paddingLeft: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredProducts.map((product) => {
              const discountPercent =
                product.mrp > product.offerPrice
                  ? Math.round(((product.mrp - product.offerPrice) / product.mrp) * 100)
                  : 0;

              return (
                <div key={product.id} className="qc-card qc-card-hover" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Product Visual Header */}
                  {product.imageUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '170px', background: '#F4F4F5', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)' }}>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#065F46', background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {product.category}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#FFFFFF', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '2px 7px', borderRadius: '4px' }}>
                          {product.sku}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-emerald)', background: 'var(--accent-emerald-light)', padding: '2px 8px', borderRadius: '4px' }}>
                        {product.category}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        SKU: {product.sku}
                      </span>
                    </div>
                  )}

                  <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                      {product.name}
                    </h2>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 16px', flex: 1 }}>
                      {product.description}
                    </p>

                  {/* Pricing Box */}
                  <div style={{ background: '#FAFAF9', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quoted Rate</div>
                        <div className="tabular-nums font-serif-heading" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formatINR(product.offerPrice)} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>/ {product.unit}</span>
                        </div>
                      </div>

                      {discountPercent > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            {formatINR(product.mrp)}
                          </span>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#B45309' }}>
                            {discountPercent}% OFF
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                      <span>HSN Code: <strong>{product.hsnCode}</strong></span>
                      <span>GST: <strong>{product.defaultGstRate}%</strong></span>
                      <span>Stock: <strong>{product.stockQty} {product.unit}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <Link
                      href="/dashboard/quotes/new"
                      style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-emerald)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Quote with this item <ArrowRight size={13} />
                    </Link>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="btn-secondary"
                        style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
                        title="Edit Product"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="btn-danger"
                        style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
                        title="Delete Product"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Add / Edit Product Modal */}
          {showModal && (
            <div className="qc-modal-overlay">
              <div className="qc-modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                    {editingProduct ? 'Edit Catalog Item' : 'Add Metal Product to Catalog'}
                  </h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="qc-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. SS 304 Seamless Square Pipe 50x50mm"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        SKU Reference
                      </label>
                      <input
                        type="text"
                        required
                        className="qc-input"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        className="qc-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Stainless Steel, Mild Steel, Pipes..."
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Unit of Measure
                      </label>
                      <input
                        type="text"
                        required
                        className="qc-input"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="e.g. pcs, kg, meter, sqft, nos, bundle..."
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        HSN/SAC Code
                      </label>
                      <input
                        type="text"
                        className="qc-input"
                        value={formData.hsnCode}
                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                        placeholder="730890"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        MRP Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="qc-input"
                        value={formData.mrp}
                        onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Offer Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="qc-input"
                        value={formData.offerPrice}
                        onChange={(e) => setFormData({ ...formData, offerPrice: Number(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        GST Rate (%)
                      </label>
                      <select
                        className="qc-input"
                        value={formData.defaultGstRate}
                        onChange={(e) => setFormData({ ...formData, defaultGstRate: Number(e.target.value) || 18 })}
                      >
                        <option value={18}>18% GST</option>
                        <option value={12}>12% GST</option>
                        <option value={28}>28% GST</option>
                        <option value={5}>5% GST</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Stock In Hand
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="qc-input"
                        value={formData.stockQty}
                        onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Product Image Section */}
                  <div style={{ background: '#FAFAF9', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Product Image / Catalog Photo
                    </label>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {/* Image Preview Box */}
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '8px',
                          border: '1.5px dashed var(--border-color)',
                          background: '#FFFFFF',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        {formData.imageUrl ? (
                          <>
                            <img
                              src={formData.imageUrl}
                              alt="Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, imageUrl: '' })}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Remove image"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#A1A1AA', fontSize: '10px' }}>
                            <ImageIcon size={22} style={{ margin: '0 auto 4px', display: 'block', color: '#CBD5E1' }} />
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Upload and URL input */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <label
                            className="btn-secondary"
                            style={{
                              cursor: 'pointer',
                              height: '32px',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              margin: 0,
                            }}
                          >
                            <Upload size={13} /> Choose Image File (PNG/JPG)
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>or paste image link below</span>
                        </div>

                        <input
                          type="url"
                          className="qc-input"
                          style={{ height: '32px', fontSize: '11.5px' }}
                          placeholder="https://example.com/product-image.jpg or /image.png"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      Detailed Alloy / Fabrication Specifications
                    </label>
                    <textarea
                      rows={3}
                      className="qc-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. 16-gauge cold rolled, mirror buffed finish with protective blue transit film..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
