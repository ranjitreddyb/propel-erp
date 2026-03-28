'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leasingApi, aiApi } from '@/services/api';
import { KpiCard, Grid, Card, PageHeader, Button, Badge, Tabs, Loading, EmptyState } from '@/components/ui';
import { Plus, RefreshCw, Download, Brain, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

type Lease = {
  id: string;
  lease_number: string;
  org_name?: string;
  first_name?: string;
  last_name?: string;
  property_name: string;
  unit_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  days_to_expiry: number;
};

export default function LeasingPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('All Leases');
  const [search, setSearch] = useState('');

  const statusMap: Record<string, string | undefined> = {
    'All Leases': undefined,
    'Active': 'active',
    'Due for Renewal': 'active',
    'Expired': 'expired',
    'Draft': 'draft',
  };

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['leasing-kpis'],
    queryFn: () => leasingApi.getDueRenewals(),
  });

  const { data: leases, isLoading } = useQuery({
    queryKey: ['leases', activeTab, search],
    queryFn: () => leasingApi.getAll({
      status: statusMap[activeTab],
      expiringDays: activeTab === 'Due for Renewal' ? 90 : undefined,
      search: search || undefined,
      pageSize: 50,
    }),
  });

  const { data: aiInsights } = useQuery({
    queryKey: ['ai-lease-insights'],
    queryFn: () => aiApi.getChurnRisks(),
    staleTime: 10 * 60_000,
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => leasingApi.renew(id, {}),
    onSuccess: () => {
      toast.success('Lease activated successfully');
      qc.invalidateQueries({ queryKey: ['leases'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tenantName = (l: Lease) => l.org_name || `${l.first_name || ''} ${l.last_name || ''}`.trim();

  const statusVariant = (s: string, days: number): 'active' | 'pending' | 'expired' | 'blue' | 'gray' => {
    if (s === 'expired' || s === 'terminated') return 'expired';
    if (s === 'active' && days <= 30) return 'pending';
    if (s === 'active') return 'active';
    if (s === 'draft') return 'blue';
    return 'gray';
  };

  const statusLabel = (s: string, days: number) => {
    if (s === 'active' && days <= 30) return `Expiring in ${days}d`;
    if (s === 'active' && days <= 90) return `Due in ${days}d`;
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="📝 Property Leasing"
        subtitle="Lease lifecycle management, renewals, and automated billing"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast('Exporting leases…')}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('Opening lease creation form…')}>
              <Plus size={14} /> New Lease
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <Grid cols={4} className="mb-5">
        <KpiCard icon="✅" value="284" label="Active Leases"      change="8 new this month" changeUp color="green"  />
        <KpiCard icon="⏳" value="14"  label="Due for Renewal"    change="Within 30 days"   changeUp={false} color="yellow" />
        <KpiCard icon="❌" value="6"   label="Expired / Vacated"  color="red"   />
        <KpiCard icon="💰" value="₹4.2Cr" label="Monthly Rent Roll" change="vs last month +8%" changeUp color="accent" />
      </Grid>

      {/* AI Lease Optimizer */}
      <div
        className="rounded-xl p-5 border mb-5 ai-glow"
        style={{ background: 'linear-gradient(135deg,rgba(79,142,247,0.08),rgba(124,92,252,0.08))', borderColor: 'rgba(79,142,247,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
            <Brain size={14} className="text-white" />
          </div>
          <span className="font-bold">AI Lease Optimizer</span>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>AI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '💰', text: 'Unit 4A lease expires in 8 days. AI-recommended renewal rate: ₹45,000/mo (+8%) based on market index.' },
            { icon: '📊', text: 'Block C projected to have 12 vacant units in 45 days. Suggest pre-marketing to 8 qualified CRM leads.' },
            { icon: '🎯', text: '3 qualified prospects in pipeline match current vacant units with 94% compatibility score. Auto-match ready.' },
          ].map((ins, i) => (
            <div key={i} className="p-3 rounded-lg text-sm border-l-2" style={{ background: 'var(--surface)', borderColor: 'var(--accent)', color: 'var(--text2)' }}>
              {ins.icon} {ins.text}
            </div>
          ))}
        </div>
      </div>

      {/* Leases Table */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <input
            className="form-input text-sm"
            style={{ maxWidth: 280 }}
            placeholder="Search tenant, lease no, property…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['leases'] })}>
            <RefreshCw size={13} />
          </Button>
        </div>

        <Tabs
          tabs={['All Leases', 'Active', 'Due for Renewal', 'Expired', 'Draft']}
          active={activeTab}
          onChange={setActiveTab}
        />

        {isLoading ? <Loading /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lease ID</th>
                  <th>Tenant</th>
                  <th>Property / Unit</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Monthly Rent</th>
                  <th>Deposit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(leases?.data || DEMO_LEASES).map((l: Lease) => (
                  <tr key={l.id}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{l.lease_number}</td>
                    <td>{tenantName(l)}</td>
                    <td>{l.property_name}, {l.unit_number}</td>
                    <td>{l.start_date ? format(new Date(l.start_date), 'dd MMM yyyy') : '—'}</td>
                    <td style={{ color: l.days_to_expiry <= 30 ? 'var(--accent5)' : l.days_to_expiry <= 90 ? 'var(--accent4)' : 'inherit' }}>
                      {l.end_date ? format(new Date(l.end_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="font-semibold" style={{ color: 'var(--text)' }}>
                      ₹{Number(l.monthly_rent).toLocaleString('en-IN')}
                    </td>
                    <td>₹{Number(l.security_deposit).toLocaleString('en-IN')}</td>
                    <td>
                      <Badge variant={statusVariant(l.status, l.days_to_expiry)}>
                        {statusLabel(l.status, l.days_to_expiry)}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                          style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent)' }}
                          onClick={() => toast(`Opening lease ${l.lease_number}…`)}
                        >
                          View
                        </button>
                        {(l.status === 'active' && l.days_to_expiry <= 90) || l.status === 'expired' ? (
                          <button
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                            style={{ background: 'rgba(247,184,79,0.15)', color: 'var(--accent4)' }}
                            onClick={() => toast.success(`Renewal workflow initiated for ${l.lease_number}`)}
                          >
                            Renew
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(leases?.data?.length || DEMO_LEASES.length) && <EmptyState icon="📝" title="No leases found" message="Adjust filters or create a new lease." />}
          </div>
        )}
      </Card>
    </div>
  );
}

// Demo data for initial render before backend connects
const DEMO_LEASES: Lease[] = [
  { id: '1', lease_number: 'LSE-0284', org_name: 'TechCorp India Pvt Ltd', property_name: 'Supratik Exotica', unit_number: 'A-F12', start_date: '2024-04-01', end_date: '2027-03-31', monthly_rent: 420000, security_deposit: 1260000, status: 'active', days_to_expiry: 371 },
  { id: '2', lease_number: 'LSE-0283', org_name: 'Sharma & Sons Trading', property_name: 'Supratik Elegance', unit_number: 'C-S03', start_date: '2024-01-01', end_date: '2026-03-31', monthly_rent: 85000, security_deposit: 255000, status: 'active', days_to_expiry: 6 },
  { id: '3', lease_number: 'LSE-0282', org_name: 'MegaMall Retail Pvt Ltd', property_name: 'Supratik Exotica', unit_number: 'Anchor Store', start_date: '2022-06-01', end_date: '2027-05-31', monthly_rent: 210000, security_deposit: 630000, status: 'active', days_to_expiry: 432 },
  { id: '4', lease_number: 'LSE-0281', first_name: 'Ravi', last_name: 'Kumar', property_name: 'Supratik Vista', unit_number: 'B-7C', start_date: '2025-04-15', end_date: '2026-04-14', monthly_rent: 32000, security_deposit: 64000, status: 'active', days_to_expiry: 20 },
  { id: '5', lease_number: 'LSE-0280', org_name: 'StartupHub Pvt Ltd', property_name: 'Supratik Exotica', unit_number: 'A-F04', start_date: '2023-01-01', end_date: '2025-12-31', monthly_rent: 65000, security_deposit: 195000, status: 'expired', days_to_expiry: -84 },
  { id: '6', lease_number: 'LSE-0279', org_name: 'Infosys BPO', property_name: 'Supratik Exotica', unit_number: 'A-F08', start_date: '2023-06-01', end_date: '2028-05-31', monthly_rent: 580000, security_deposit: 1740000, status: 'active', days_to_expiry: 882 },
  { id: '7', lease_number: 'LSE-0278', first_name: 'Priya', last_name: 'Mehta', property_name: 'Supratik Elegance', unit_number: 'D-302', start_date: '2024-08-01', end_date: '2026-07-31', monthly_rent: 28000, security_deposit: 56000, status: 'active', days_to_expiry: 218 },
  { id: '8', lease_number: 'LSE-0277', org_name: 'HDFC Bank Branch', property_name: 'Supratik Exotica', unit_number: 'G-01', start_date: '2021-01-01', end_date: '2030-12-31', monthly_rent: 320000, security_deposit: 960000, status: 'active', days_to_expiry: 1825 },
  { id: '9', lease_number: 'LSE-0276', org_name: 'Café Coffee Day', property_name: 'Supratik Elegance', unit_number: 'C-GF02', start_date: '2023-03-15', end_date: '2028-03-14', monthly_rent: 125000, security_deposit: 375000, status: 'active', days_to_expiry: 804 },
  { id: '10', lease_number: 'LSE-0275', first_name: 'Amit', last_name: 'Patel', property_name: 'Supratik Vista', unit_number: 'E-1204', start_date: '2025-01-01', end_date: '2026-12-31', monthly_rent: 35000, security_deposit: 70000, status: 'active', days_to_expiry: 396 },
  { id: '11', lease_number: 'LSE-0274', org_name: 'Decathlon Sports', property_name: 'Supratik Lifestyle', unit_number: 'Retail-A', start_date: '2022-09-01', end_date: '2027-08-31', monthly_rent: 450000, security_deposit: 1350000, status: 'active', days_to_expiry: 614 },
  { id: '12', lease_number: 'LSE-0273', org_name: 'WeWork Co-working', property_name: 'Supratik Exotica', unit_number: 'A-F06-08', start_date: '2024-01-01', end_date: '2026-01-15', monthly_rent: 890000, security_deposit: 2670000, status: 'active', days_to_expiry: 28 },
  { id: '13', lease_number: 'LSE-0272', first_name: 'Sneha', last_name: 'Reddy', property_name: 'Supratik Elegance', unit_number: 'B-801', start_date: '2023-07-01', end_date: '2025-06-30', monthly_rent: 42000, security_deposit: 84000, status: 'expired', days_to_expiry: -168 },
  { id: '14', lease_number: 'LSE-0271', org_name: 'Apollo Pharmacy', property_name: 'Supratik Vista', unit_number: 'G-Shop3', start_date: '2024-02-01', end_date: '2027-01-31', monthly_rent: 75000, security_deposit: 225000, status: 'active', days_to_expiry: 402 },
  { id: '15', lease_number: 'LSE-0270', org_name: 'Zomato Kitchen', property_name: 'Supratik Lifestyle', unit_number: 'Cloud-K2', start_date: '2024-06-01', end_date: '2026-05-31', monthly_rent: 95000, security_deposit: 285000, status: 'active', days_to_expiry: 156 },
];
