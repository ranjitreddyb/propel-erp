'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/services/api';
import { KpiCard, Grid, Card, PageHeader, Button, Badge, Tabs, Loading } from '@/components/ui';
import { Plus, CheckCircle, XCircle, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

type Voucher = {
  id: string;
  voucher_number: string;
  voucher_type: string;
  date: string;
  narration?: string;
  contact_name?: string;
  org_name?: string;
  total_amount: number;
  status: string;
  property_name?: string;
  created_by_name?: string;
};

type TrialRow = {
  account_code: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
};

export default function FinancePage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Vouchers');
  const [newVoucher, setNewVoucher] = useState({ type: 'receipt', date: new Date().toISOString().split('T')[0], narration: '', amount: '' });

  const { data: kpis } = useQuery({ queryKey: ['finance-kpis'], queryFn: () => financeApi.getKpis() });
  const { data: vouchers, isLoading: vLoading } = useQuery({ queryKey: ['vouchers', activeTab], queryFn: () => financeApi.getVouchers({ pageSize: 30 }) });
  const { data: trialBal, isLoading: tbLoading } = useQuery({ queryKey: ['trial-balance'], queryFn: () => financeApi.getTrialBalance() });

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeApi.approveVoucher(id),
    onSuccess: () => { toast.success('Voucher approved and posted'); qc.invalidateQueries({ queryKey: ['vouchers'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => financeApi.rejectVoucher(id, 'Rejected by approver'),
    onSuccess: () => { toast.success('Voucher rejected'); qc.invalidateQueries({ queryKey: ['vouchers'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const f = kpis?.data || {};
  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const voucherTypeBadge = (t: string) => {
    const map: Record<string, 'active' | 'blue' | 'purple' | 'gray'> = { receipt: 'active', payment: 'expired' as 'active', journal: 'blue', contra: 'purple' };
    return (map[t] || 'gray') as 'active' | 'blue' | 'purple' | 'gray';
  };

  const statusBadge = (s: string): 'active' | 'pending' | 'expired' | 'blue' | 'gray' => {
    if (s === 'posted') return 'active';
    if (s === 'pending_auth') return 'pending';
    if (s === 'cancelled') return 'expired';
    return 'blue';
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="💰 Financial Accounting"
        subtitle="Multi-company · Multi-currency · Multi-year · Transaction Authorization"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast('Opening voucher designer…')}>
              <FileText size={14} /> Voucher Designer
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast('Exporting to Excel…')}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('Opening journal entry form…')}>
              <Plus size={14} /> New Entry
            </Button>
          </>
        }
      />

      <Grid cols={4} className="mb-5">
        <KpiCard icon="💵" value={fmt(f.total_revenue)}  label="Revenue YTD"     change="↑ 18% YoY" changeUp color="green"  />
        <KpiCard icon="📤" value={fmt(f.total_expenses)} label="Expenses YTD"    change="↑ 6% YoY"  changeUp={false} color="red"    />
        <KpiCard icon="💹" value={fmt((f.total_revenue||0)-(f.total_expenses||0))} label="Net Profit YTD" change="↑ 22%" changeUp color="accent" />
        <KpiCard icon="⏳" value={fmt(f.outstanding_ar)} label="Outstanding AR"  color="yellow" />
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Quick Voucher Entry */}
        <Card>
          <h3 className="font-bold mb-4">Quick Voucher Entry</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text2)' }}>Voucher Type</label>
              <select className="form-input text-sm" value={newVoucher.type} onChange={e => setNewVoucher(v => ({ ...v, type: e.target.value }))}>
                <option value="receipt">Receipt Voucher</option>
                <option value="payment">Payment Voucher</option>
                <option value="journal">Journal Voucher</option>
                <option value="contra">Contra Voucher</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text2)' }}>Date</label>
              <input type="date" className="form-input text-sm" value={newVoucher.date} onChange={e => setNewVoucher(v => ({ ...v, date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text2)' }}>Amount (₹)</label>
              <input type="number" className="form-input text-sm" placeholder="0.00" value={newVoucher.amount} onChange={e => setNewVoucher(v => ({ ...v, amount: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text2)' }}>Narration</label>
              <input className="form-input text-sm" placeholder="Enter narration…" value={newVoucher.narration} onChange={e => setNewVoucher(v => ({ ...v, narration: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="primary" size="sm" onClick={() => toast.success('Voucher saved and sent for authorization')}>
                Save & Submit
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast('Email sent to approvers')}>
                Send for Auth
              </Button>
            </div>
          </div>
        </Card>

        {/* Pending Authorizations */}
        <Card className="col-span-2">
          <h3 className="font-bold mb-4">⏳ Pending Authorizations</h3>
          <div className="space-y-2.5">
            {DEMO_PENDING.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ background: 'rgba(247,184,79,0.05)', borderColor: 'rgba(247,184,79,0.2)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(247,184,79,0.15)' }}>⏳</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.type} — {fmt(p.amount)}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{p.party} · {p.note}</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs px-3 py-1 rounded-lg font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}
                      onClick={() => toast.success(`✅ ${p.type} approved and posted`)}
                    >
                      Approve
                    </button>
                    <button
                      className="text-xs px-3 py-1 rounded-lg font-semibold border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
                      onClick={() => toast(`❌ ${p.type} returned to originator`)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Vouchers / Trial Balance tabs */}
      <Card>
        <Tabs tabs={['Vouchers', 'Trial Balance', 'Chart of Accounts', 'Invoices']} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'Vouchers' && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Voucher No.</th><th>Type</th><th>Date</th><th>Party</th><th>Narration</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {(vouchers?.data || DEMO_VOUCHERS).map((v: Voucher) => (
                  <tr key={v.id}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{v.voucher_number}</td>
                    <td><Badge variant={voucherTypeBadge(v.voucher_type)}>{v.voucher_type.toUpperCase()}</Badge></td>
                    <td>{v.date}</td>
                    <td>{v.org_name || v.contact_name || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.narration || '—'}</td>
                    <td className="font-semibold" style={{ color: ['receipt','sales'].includes(v.voucher_type) ? 'var(--accent3)' : 'var(--accent5)' }}>
                      {['receipt','sales'].includes(v.voucher_type) ? '+' : '−'}₹{Number(v.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td><Badge variant={statusBadge(v.status)}>{v.status === 'pending_auth' ? 'Pending Auth' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}</Badge></td>
                    <td>
                      {v.status === 'pending_auth' && (
                        <div className="flex gap-1">
                          <button onClick={() => approveMutation.mutate(v.id)} className="p-1 rounded text-[var(--accent3)] hover:bg-[rgba(0,212,170,0.1)]"><CheckCircle size={15} /></button>
                          <button onClick={() => rejectMutation.mutate(v.id)} className="p-1 rounded text-[var(--accent5)] hover:bg-[rgba(247,79,122,0.1)]"><XCircle size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Trial Balance' && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>A/c Code</th><th>Account Name</th><th>Type</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {(trialBal?.data || DEMO_TRIAL).map((row: TrialRow) => (
                  <tr key={row.account_code}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{row.account_code}</td>
                    <td style={{ color: 'var(--text)' }}>{row.account_name}</td>
                    <td><Badge variant={row.account_type === 'income' ? 'active' : row.account_type === 'expense' ? 'expired' : 'blue'}>{row.account_type}</Badge></td>
                    <td style={{ color: row.total_debit ? 'var(--accent5)' : 'var(--text3)' }}>{row.total_debit ? `₹${Number(row.total_debit).toLocaleString('en-IN')}` : '—'}</td>
                    <td style={{ color: row.total_credit ? 'var(--accent3)' : 'var(--text3)' }}>{row.total_credit ? `₹${Number(row.total_credit).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="font-semibold" style={{ color: row.balance >= 0 ? 'var(--accent3)' : 'var(--accent5)' }}>
                      ₹{Math.abs(Number(row.balance)).toLocaleString('en-IN')} {row.balance >= 0 ? 'Cr' : 'Dr'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'Chart of Accounts' || activeTab === 'Invoices') && (
          <div className="py-12 text-center" style={{ color: 'var(--text3)' }}>
            <div className="text-4xl mb-3">📋</div>
            <p>Connect to backend to view {activeTab}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

const DEMO_PENDING = [
  { id: '1', type: 'Payment Voucher', amount: 87500,  party: 'XYZ Maintenance Co',  note: 'Awaiting Level 2 approval' },
  { id: '2', type: 'Journal Voucher', amount: 124000, party: 'Depreciation Posting', note: 'Finance Head approval needed' },
];

const DEMO_VOUCHERS: Voucher[] = [
  { id: '1', voucher_number: 'VCH-2026-0284', voucher_type: 'receipt', date: '24 Mar 2026', org_name: 'TechCorp India', narration: 'Rent for March 2026', total_amount: 420000, status: 'posted' },
  { id: '2', voucher_number: 'VCH-2026-0283', voucher_type: 'receipt', date: '23 Mar 2026', org_name: 'Sharma & Sons', narration: 'Advance deposit', total_amount: 250000, status: 'posted' },
  { id: '3', voucher_number: 'VCH-2026-0282', voucher_type: 'payment', date: '22 Mar 2026', org_name: 'XYZ Maintenance', narration: 'HVAC servicing', total_amount: 87500, status: 'pending_auth' },
  { id: '4', voucher_number: 'VCH-2026-0281', voucher_type: 'receipt', date: '21 Mar 2026', org_name: 'Prestige Retail', narration: 'Rent — Retail Hub', total_amount: 180000, status: 'posted' },
  { id: '5', voucher_number: 'VCH-2026-0280', voucher_type: 'journal', date: '20 Mar 2026', org_name: undefined, narration: 'Monthly depreciation posting', total_amount: 124000, status: 'pending_auth' },
];

const DEMO_TRIAL: TrialRow[] = [
  { account_code: '4001', account_name: 'Rental Income',         account_type: 'income',  total_debit: 0,        total_credit: 42000000, balance: 42000000 },
  { account_code: '4002', account_name: 'Lease Premium Income',  account_type: 'income',  total_debit: 0,        total_credit: 8500000,  balance: 8500000  },
  { account_code: '5001', account_name: 'Maintenance Expense',   account_type: 'expense', total_debit: 875000,   total_credit: 0,        balance: -875000  },
  { account_code: '5002', account_name: 'Utility Expense',       account_type: 'expense', total_debit: 423000,   total_credit: 0,        balance: -423000  },
  { account_code: '1001', account_name: 'Cash & Bank',           account_type: 'asset',   total_debit: 28000000, total_credit: 0,        balance: 28000000 },
  { account_code: '2001', account_name: 'Security Deposits Held',account_type: 'liability',total_debit: 0,       total_credit: 12600000, balance: 12600000 },
];
