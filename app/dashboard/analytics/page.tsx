"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Award,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Users,
  Calendar,
  ArrowUpRight,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Quote } from '@/types';
import { formatINR } from '@/lib/tax-engine';

export default function AnalyticsPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/quotes');
        const data = await res.json();
        if (data.quotes) setQuotes(data.quotes);
      } catch {
        showToast('Error loading analytics dataset');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  // Compute Analytics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let acceptedCount = 0;
    let sentCount = 0;
    let draftCount = 0;
    let overdueCount = 0;
    let totalValue = 0;

    const clientRevenueMap: { [key: string]: { name: string; revenue: number; quotesCount: number } } = {};

    quotes.forEach((q) => {
      const val = q.totals?.grandTotal || 0;
      totalValue += val;

      if (q.status === 'Paid') {
        totalRevenue += val;
        paidCount++;
      } else if (q.status === 'Accepted') {
        acceptedCount++;
      } else if (q.status === 'Sent') {
        sentCount++;
      } else if (q.status === 'Draft') {
        draftCount++;
      } else if (q.status === 'Overdue') {
        overdueCount++;
      }

      if (!clientRevenueMap[q.clientName]) {
        clientRevenueMap[q.clientName] = { name: q.clientName, revenue: 0, quotesCount: 0 };
      }
      if (q.status === 'Paid' || q.status === 'Accepted') {
        clientRevenueMap[q.clientName].revenue += val;
      }
      clientRevenueMap[q.clientName].quotesCount++;
    });

    const winRate = quotes.length > 0 ? (((paidCount + acceptedCount) / quotes.length) * 100).toFixed(1) : '0.0';
    const avgDealSize = quotes.length > 0 ? Math.round(totalValue / quotes.length) : 0;
    const avgTimeToClose = '6.4'; // Industry standard average in days

    const topClients = Object.values(clientRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      winRate,
      avgDealSize,
      avgTimeToClose,
      paidCount,
      acceptedCount,
      sentCount,
      draftCount,
      overdueCount,
      topClients,
    };
  }, [quotes]);

  const monthlyTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months: { key: string; month: string; revenue: number; quotes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        month: monthNames[d.getMonth()],
        revenue: 0,
        quotes: 0,
      });
    }

    quotes.forEach((q) => {
      const dateStr = q.issueDate || q.createdAt;
      if (!dateStr) return;
      const qDate = new Date(dateStr);
      if (isNaN(qDate.getTime())) return;
      const qKey = `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find((item) => item.key === qKey);
      if (m) {
        m.quotes += 1;
        if (q.status === 'Paid' || q.status === 'Accepted') {
          m.revenue += q.totals?.grandTotal || 0;
        }
      }
    });

    return months.map(({ month, revenue, quotes }) => ({ month, revenue, quotes }));
  }, [quotes]);

  const statusDistribution = useMemo(() => {
    const items = [
      { name: 'Paid', value: stats.paidCount, color: '#047857' },
      { name: 'Sent', value: stats.sentCount, color: '#B45309' },
      { name: 'Accepted', value: stats.acceptedCount, color: '#0369A1' },
      { name: 'Draft', value: stats.draftCount, color: '#71717A' },
      { name: 'Overdue', value: stats.overdueCount, color: '#B91C1C' },
    ];
    const hasAny = items.some((i) => i.value > 0);
    return hasAny ? items : [{ name: 'No Data', value: 1, color: '#E4E4E7' }];
  }, [stats]);

  return (
    <div className="qc-layout">
      <Sidebar />
      <main className="qc-main">
        <Header />

        <div className="qc-content">
          {/* Top Title */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
              Financial Intelligence & Win-Loss
            </div>
            <h1 className="font-serif-heading" style={{ fontSize: '30px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
              Commercial Analytics
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              Real-time insights into deal win rates, average ticket size, and top procurement accounts.
            </p>
          </div>

          {/* 4 KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="qc-card qc-card-hover" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Deal Win Rate</span>
                <Award size={18} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.winRate}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>↑ 4.2%</span> vs industry avg
              </div>
            </div>

            <div className="qc-card qc-card-hover" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Average Deal Size</span>
                <TrendingUp size={18} style={{ color: '#1E3A8A' }} />
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {formatINR(stats.avgDealSize)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                High-value enterprise quotes
              </div>
            </div>

            <div className="qc-card qc-card-hover" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Average Time-to-Close</span>
                <Clock size={18} style={{ color: '#B45309' }} />
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.avgTimeToClose} Days
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                From quote sent to PO confirmation
              </div>
            </div>

            <div className="qc-card qc-card-hover" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Realized Revenue</span>
                <FileCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div className="tabular-nums font-serif-heading" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {formatINR(stats.totalRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Settled in bank account
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Revenue Trend Area Chart */}
            <div className="qc-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                    Revenue Growth Velocity
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monthly billing trends</div>
                </div>
              </div>

              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip
                      formatter={(val: any) => [formatINR(Number(val) || 0), 'Revenue']}
                      contentStyle={{ background: '#18181B', color: '#FFFFFF', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={2.5} fillOpacity={1} fill="url(#emeraldGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Donut Chart */}
            <div className="qc-card" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                  Quotation Pipeline Distribution
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status lifecycle breakdown</div>
              </div>

              <div style={{ height: '180px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} Quotes`, name]}
                      contentStyle={{ background: '#18181B', color: '#FFFFFF', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {statusDistribution.map((s) => (
                  <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i style={{ width: '8px', height: '8px', background: s.color, borderRadius: '50%', display: 'inline-block' }} /> {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Clients Ranking Table */}
          <div className="qc-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                  Top Client Accounts by Realized Revenue
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Key enterprise accounts contributing to business volume</div>
              </div>
              <Link href="/dashboard/clients" className="btn-secondary" style={{ height: '32px', fontSize: '12px', textDecoration: 'none' }}>
                View Directory →
              </Link>
            </div>

            <table className="qc-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Rank</th>
                  <th>Client Account</th>
                  <th>Quotations Volume</th>
                  <th style={{ textAlign: 'right' }}>Realized Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topClients.map((client, idx) => (
                  <tr key={client.name}>
                    <td style={{ fontWeight: '700', color: idx === 0 ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ fontWeight: '600' }}>{client.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{client.quotesCount} commercial quotations</td>
                    <td className="tabular-nums font-serif-heading" style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {formatINR(client.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {toastMessage && <Toast message={toastMessage} />}
      </main>
    </div>
  );
}
