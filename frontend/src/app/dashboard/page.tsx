'use client';

import { useQuery } from '@tanstack/react-query';
import { propertiesApi, financeApi, maintenanceApi, aiApi } from '@/services/api';
import { KpiCard, Grid, Card, PageHeader, Button, Loading } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { RefreshCw, Download, Brain, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const REVENUE_DATA = [
  { month: 'Oct', value: 3800 }, { month: 'Nov', value: 4200 },
  { month: 'Dec', value: 4800 }, { month: 'Jan', value: 4100 },
  { month: 'Feb', value: 5500 }, { month: 'Mar', value: 6200 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded-lg border text-xs" style={{ background: 'var(--surface3)', borderColor: 'var(--border2)' }}>
        <p style={{ color: 'var(--text2)' }}>{label}</p>
        <p className="font-bold" style={{ color: 'var(--accent)' }}>₹{payload[0].value}L</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['property-kpis'],
    queryFn: () => propertiesApi.getKpis(),
  });

  const { data: finKpis } = useQuery({
    queryKey: ['finance-kpis'],
    queryFn: () => financeApi.getKpis(),
  });

  const { data: aiInsights } = useQuery({
    queryKey: ['ai-dashboard'],
    queryFn: () => aiApi.getDashboardInsights(),
    staleTime: 5 * 60_000,
  });

  const { data: mainKpis } = useQuery({
    queryKey: ['maintenance-kpis'],
    queryFn: () => maintenanceApi.getKpis(),
  });

  if (kpiLoading) return <Loading message="Loading dashboard…" />;

  const kpiData = kpis?.data || {};
  const finData = finKpis?.data || {};

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        actions={
          <>
            <select className="form-input text-sm" style={{ width: 'auto', padding: '7px 12px' }}>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => toast('Refreshing data…')}>
              <RefreshCw size={14} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast.success('Generating PDF report…')}>
              <Download size={14} /> Export
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <Grid cols={4} className="mb-5">
        <KpiCard icon="💰" value={`₹${((finData.total_revenue || 42000000) / 10000000).toFixed(1)}Cr`}
          label="Monthly Revenue" change="12.4% vs last month" changeUp color="accent" />
        <KpiCard icon="🏢" value={`${kpiData.occupancy_rate || 94.2}%`}
          label="Occupancy Rate"  change="2.1% vs last month" changeUp color="green" />
        <KpiCard icon="📋" value={String(kpiData.total_units || 284)}
          label="Active Leases"  change="8 new this month"   changeUp color="yellow" />
        <KpiCard icon="⚠️" value={String(mainKpis?.data?.open || 18)}
          label="Open Work Orders" change="3 critical" changeUp={false} color="red" />
      </Grid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Revenue Trend (₹ Lakhs)</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--accent)' }}>
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={REVENUE_DATA} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f8ef7" />
                  <stop offset="100%" stopColor="rgba(79,142,247,0.3)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Insights panel */}
        <Card className="ai-glow" style={{ background: 'linear-gradient(135deg,rgba(79,142,247,0.08),rgba(124,92,252,0.08))', borderColor: 'rgba(79,142,247,0.2)' } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
              <Brain size={14} className="text-white" />
            </div>
            <h3 className="font-bold">AI Intelligence Hub</h3>
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
              LIVE
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg text-sm border-l-2" style={{ background: 'var(--surface)', borderColor: 'var(--accent)' }}>
              <span style={{ color: 'var(--text)' }}>
                <strong>📈 Revenue Forecast:</strong> Q1 FY27 projected at{' '}
                <strong className="text-[var(--accent3)]">₹5.1 Crore</strong> — 21% YoY growth. Confidence: 94%
              </span>
            </div>
            <div className="p-3 rounded-lg text-sm border-l-2" style={{ background: 'var(--surface)', borderColor: 'var(--accent5)' }}>
              <span style={{ color: 'var(--text)' }}>
                <strong>⚠️ Churn Alert:</strong> 3 tenants show 78%+ churn probability. Retention action recommended.
              </span>
            </div>
            <div className="p-3 rounded-lg text-sm border-l-2" style={{ background: 'var(--surface)', borderColor: 'var(--accent4)' }}>
              <span style={{ color: 'var(--text)' }}>
                <strong>🔧 Predictive Maintenance:</strong> HVAC Block B predicted failure in 12 days.
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link href="/dashboard/ai">
              <button className="text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{ background: 'rgba(79,142,247,0.15)', borderColor: 'rgba(79,142,247,0.25)', color: 'var(--accent)' }}>
                View All Insights →
              </button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Occupancy + Calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card className="col-span-2">
          <h3 className="font-bold mb-4">Portfolio Occupancy by Block</h3>
          <div className="space-y-3">
            {[
              { name: 'Tower A — Commercial', pct: 97, color: 'var(--accent3)' },
              { name: 'Tower B — Residential', pct: 91, color: 'var(--accent)' },
              { name: 'Block C — Retail', pct: 78, color: 'var(--accent4)' },
              { name: 'Industrial Park', pct: 100, color: 'var(--accent3)' },
              { name: 'Suburban Villas Ph.2', pct: 65, color: 'var(--accent2)' },
            ].map(row => (
              <div key={row.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: 'var(--text2)' }}>{row.name}</span>
                  <span className="font-bold" style={{ color: row.color }}>{row.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-3 text-sm">📅 Today's Schedule</h3>
          <div className="space-y-2">
            {[
              { time: '09:00', title: 'Lease renewal: TechCorp', loc: 'Tower A, Floor 12', color: 'var(--accent)' },
              { time: '14:00', title: 'Site inspection: Block C', loc: 'Fire safety audit', color: 'var(--accent4)' },
              { time: '16:30', title: 'Chairman review', loc: 'Q1 portfolio report', color: 'var(--accent3)' },
            ].map(ev => (
              <div key={ev.time} className="p-2.5 rounded-lg text-xs border-l-2" style={{ background: 'var(--surface2)', borderColor: ev.color }}>
                <div className="font-semibold" style={{ color: 'var(--text)' }}>{ev.time} — {ev.title}</div>
                <div style={{ color: 'var(--text3)' }}>{ev.loc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Recent Transactions</h3>
          <Link href="/dashboard/finance">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No.</th><th>Tenant / Vendor</th><th>Type</th>
                <th>Amount</th><th>Property</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { no: 'VCH-2026-0284', name: 'TechCorp India Pvt Ltd', type: 'Rent Receipt', amount: '+₹4,20,000', prop: 'Tower A, F12', date: '24 Mar 2026', status: 'Posted', up: true },
                { no: 'VCH-2026-0283', name: 'Sharma & Sons', type: 'Advance Deposit', amount: '+₹2,50,000', prop: 'Block C, S3', date: '23 Mar 2026', status: 'Posted', up: true },
                { no: 'VCH-2026-0282', name: 'XYZ Maintenance Co', type: 'Vendor Payment', amount: '−₹87,500', prop: 'Tower B', date: '22 Mar 2026', status: 'Pending', up: false },
                { no: 'VCH-2026-0281', name: 'Prestige Retail Ltd', type: 'Rent Invoice', amount: '+₹1,80,000', prop: 'Retail Hub R4', date: '21 Mar 2026', status: 'Posted', up: true },
              ].map(tx => (
                <tr key={tx.no}>
                  <td className="font-medium" style={{ color: 'var(--text)' }}>{tx.no}</td>
                  <td>{tx.name}</td>
                  <td>{tx.type}</td>
                  <td className="font-semibold" style={{ color: tx.up ? 'var(--accent3)' : 'var(--accent5)' }}>{tx.amount}</td>
                  <td>{tx.prop}</td>
                  <td>{tx.date}</td>
                  <td>
                    <span className="status-badge" style={tx.status === 'Posted'
                      ? { background: 'rgba(0,212,170,0.15)', color: 'var(--accent3)' }
                      : { background: 'rgba(247,184,79,0.15)', color: 'var(--accent4)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
