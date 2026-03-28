'use client';

import { useState } from 'react';
import { Card, PageHeader, KpiCard, Grid, Badge, Tabs, Button } from '@/components/ui';
import { TrendingUp, Plus, Download, Filter, Eye, Phone, FileText, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type Sale = {
  id: string;
  booking_id: string;
  property: string;
  unit: string;
  unit_type: string;
  area_sqft: number;
  buyer_name: string;
  buyer_phone: string;
  booking_date: string;
  base_price: number;
  total_value: number;
  amount_received: number;
  payment_plan: string;
  status: 'booked' | 'agreement' | 'registered' | 'possession' | 'cancelled';
  salesperson: string;
};

const DEMO_SALES: Sale[] = [
  { id: '1', booking_id: 'BK-2025-0142', property: 'Supratik Exotica', unit: 'A-1201', unit_type: '3 BHK', area_sqft: 1850, buyer_name: 'Rajesh Sharma', buyer_phone: '98765xxxxx', booking_date: '2025-12-10', base_price: 8500, total_value: 15725000, amount_received: 4717500, payment_plan: 'CLP 30:40:30', status: 'booked', salesperson: 'Priya M.' },
  { id: '2', booking_id: 'BK-2025-0141', property: 'Supratik Exotica', unit: 'B-0803', unit_type: '2 BHK', area_sqft: 1250, buyer_name: 'Anita Desai', buyer_phone: '99887xxxxx', booking_date: '2025-12-08', base_price: 8200, total_value: 10250000, amount_received: 10250000, payment_plan: 'Full Payment', status: 'registered', salesperson: 'Amit K.' },
  { id: '3', booking_id: 'BK-2025-0140', property: 'Supratik Elegance', unit: 'C-0505', unit_type: '3 BHK Premium', area_sqft: 2100, buyer_name: 'Vikram Patel', buyer_phone: '98123xxxxx', booking_date: '2025-12-05', base_price: 9200, total_value: 19320000, amount_received: 5796000, payment_plan: 'CLP 30:40:30', status: 'agreement', salesperson: 'Priya M.' },
  { id: '4', booking_id: 'BK-2025-0139', property: 'Supratik Lifestyle', unit: 'Villa-12', unit_type: 'Villa 4 BHK', area_sqft: 3500, buyer_name: 'Dr. Sunita Reddy', buyer_phone: '94561xxxxx', booking_date: '2025-12-01', base_price: 12000, total_value: 42000000, amount_received: 42000000, payment_plan: 'Full Payment', status: 'possession', salesperson: 'Rahul S.' },
  { id: '5', booking_id: 'BK-2025-0138', property: 'Supratik Exotica', unit: 'A-0702', unit_type: '2 BHK', area_sqft: 1180, buyer_name: 'Mohit Agarwal', buyer_phone: '90112xxxxx', booking_date: '2025-11-28', base_price: 8500, total_value: 10030000, amount_received: 3009000, payment_plan: 'CLP 30:40:30', status: 'booked', salesperson: 'Amit K.' },
  { id: '6', booking_id: 'BK-2025-0137', property: 'Supratik Elegance', unit: 'D-1102', unit_type: '3 BHK', area_sqft: 1920, buyer_name: 'Sneha Kulkarni', buyer_phone: '98234xxxxx', booking_date: '2025-11-25', base_price: 8800, total_value: 16896000, amount_received: 8448000, payment_plan: 'Flexi 50:50', status: 'agreement', salesperson: 'Priya M.' },
  { id: '7', booking_id: 'BK-2025-0136', property: 'Supratik Vista', unit: 'E-0301', unit_type: '1 BHK', area_sqft: 650, buyer_name: 'Karan Singh', buyer_phone: '99001xxxxx', booking_date: '2025-11-20', base_price: 7500, total_value: 4875000, amount_received: 0, payment_plan: 'CLP 30:40:30', status: 'cancelled', salesperson: 'Rahul S.' },
  { id: '8', booking_id: 'BK-2025-0135', property: 'Supratik Exotica', unit: 'B-1504', unit_type: '3 BHK Penthouse', area_sqft: 2800, buyer_name: 'Arvind Mehta', buyer_phone: '98765xxxxx', booking_date: '2025-11-15', base_price: 11000, total_value: 30800000, amount_received: 30800000, payment_plan: 'Full Payment', status: 'registered', salesperson: 'Amit K.' },
  { id: '9', booking_id: 'BK-2025-0134', property: 'Supratik Lifestyle', unit: 'Villa-08', unit_type: 'Villa 5 BHK', area_sqft: 4200, buyer_name: 'Neha Kapoor', buyer_phone: '94432xxxxx', booking_date: '2025-11-10', base_price: 13500, total_value: 56700000, amount_received: 17010000, payment_plan: 'CLP 30:40:30', status: 'agreement', salesperson: 'Priya M.' },
  { id: '10', booking_id: 'BK-2025-0133', property: 'Supratik Elegance', unit: 'C-0908', unit_type: '2 BHK', area_sqft: 1320, buyer_name: 'Ravi Krishnan', buyer_phone: '98877xxxxx', booking_date: '2025-11-05', base_price: 8400, total_value: 11088000, amount_received: 11088000, payment_plan: 'Full Payment', status: 'possession', salesperson: 'Rahul S.' },
];

const STATUS_TABS = ['All Sales', 'Booked', 'Agreement', 'Registered', 'Possession', 'Cancelled'];

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('All Sales');
  const [search, setSearch] = useState('');

  const filteredSales = DEMO_SALES.filter(sale => {
    const matchesTab = activeTab === 'All Sales' || sale.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = search === '' ||
      sale.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
      sale.booking_id.toLowerCase().includes(search.toLowerCase()) ||
      sale.unit.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalSalesValue = DEMO_SALES.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.total_value, 0);
  const totalReceived = DEMO_SALES.reduce((sum, s) => sum + s.amount_received, 0);
  const bookingsThisMonth = DEMO_SALES.filter(s => s.booking_date >= '2025-12-01').length;

  const statusBadge = (status: Sale['status']) => {
    switch (status) {
      case 'booked': return <Badge variant="blue">Booked</Badge>;
      case 'agreement': return <Badge variant="pending">Agreement</Badge>;
      case 'registered': return <Badge variant="active">Registered</Badge>;
      case 'possession': return <Badge variant="active">Possession</Badge>;
      case 'cancelled': return <Badge variant="expired">Cancelled</Badge>;
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Property Sales"
        subtitle="Track property sales, bookings, agreements & possession handovers"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast('Exporting sales report...')}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('Opening new booking form...')}>
              <Plus size={14} /> New Booking
            </Button>
          </>
        }
      />

      <Grid cols={4} className="mb-6">
        <KpiCard icon="🏠" value={DEMO_SALES.filter(s => s.status !== 'cancelled').length.toString()} label="Total Bookings" change="Active sales pipeline" color="accent" />
        <KpiCard icon="📝" value={bookingsThisMonth.toString()} label="Bookings This Month" change={`${bookingsThisMonth > 5 ? '↑' : '↓'} vs last month`} changeUp={bookingsThisMonth > 5} color="green" />
        <KpiCard icon="💰" value={formatCurrency(totalSalesValue)} label="Total Sales Value" change="Gross booking value" color="yellow" />
        <KpiCard icon="💵" value={formatCurrency(totalReceived)} label="Amount Received" change={`${((totalReceived / totalSalesValue) * 100).toFixed(0)}% collected`} color="purple" />
      </Grid>

      {/* AI Sales Insights */}
      <div
        className="rounded-xl p-5 border mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.08), rgba(217,119,6,0.08))', borderColor: 'rgba(8,145,178,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-bold">AI Sales Intelligence</span>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>AI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '📈', text: '3 BHK units in Tower A selling 40% faster than market average. Consider premium pricing for remaining inventory.' },
            { icon: '⚡', text: 'BK-2025-0142 payment milestone due in 7 days. Auto-reminder scheduled for buyer.' },
            { icon: '🎯', text: '8 CRM leads match Villa requirements with 85%+ score. Recommend priority outreach for Lifestyle project.' },
          ].map((ins, i) => (
            <div key={i} className="p-3 rounded-lg text-sm border-l-2" style={{ background: 'var(--surface)', borderColor: 'var(--primary)', color: 'var(--text2)' }}>
              {ins.icon} {ins.text}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            className="form-input text-sm"
            style={{ maxWidth: 280 }}
            placeholder="Search buyer, booking ID, unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Tabs
          tabs={STATUS_TABS}
          active={activeTab}
          onChange={setActiveTab}
        />

        <div className="overflow-x-auto mt-4">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Property / Unit</th>
                <th>Type</th>
                <th>Area</th>
                <th>Buyer</th>
                <th>Booking Date</th>
                <th>Total Value</th>
                <th>Received</th>
                <th>Payment Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id} className={sale.status === 'cancelled' ? 'opacity-60' : ''}>
                  <td className="font-mono text-xs font-medium" style={{ color: 'var(--primary)' }}>{sale.booking_id}</td>
                  <td>
                    <div className="font-medium" style={{ color: 'var(--text)' }}>{sale.property}</div>
                    <div className="text-xs" style={{ color: 'var(--text3)' }}>{sale.unit}</div>
                  </td>
                  <td className="text-sm">{sale.unit_type}</td>
                  <td className="text-sm">{sale.area_sqft.toLocaleString()} sqft</td>
                  <td>
                    <div className="font-medium" style={{ color: 'var(--text)' }}>{sale.buyer_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text3)' }}>{sale.buyer_phone}</div>
                  </td>
                  <td>{format(new Date(sale.booking_date), 'dd MMM yyyy')}</td>
                  <td className="font-semibold" style={{ color: 'var(--text)' }}>{formatCurrency(sale.total_value)}</td>
                  <td>
                    <div className="font-semibold" style={{ color: sale.amount_received === sale.total_value ? 'var(--success)' : 'var(--text)' }}>
                      {formatCurrency(sale.amount_received)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text3)' }}>
                      {((sale.amount_received / sale.total_value) * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="text-xs">{sale.payment_plan}</td>
                  <td>{statusBadge(sale.status)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                        style={{ background: 'rgba(8,145,178,0.15)', color: 'var(--primary)' }}
                        onClick={() => toast(`Viewing ${sale.booking_id}...`)}
                      >
                        <Eye size={12} className="inline mr-1" />View
                      </button>
                      {sale.status !== 'cancelled' && sale.status !== 'possession' && (
                        <button
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                          style={{ background: 'rgba(217,119,6,0.15)', color: 'var(--secondary)' }}
                          onClick={() => toast.success(`Payment reminder sent to ${sale.buyer_name}`)}
                        >
                          <IndianRupee size={12} className="inline mr-1" />Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
              <p style={{ color: 'var(--text3)' }}>No sales found matching your filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

