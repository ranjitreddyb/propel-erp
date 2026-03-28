'use client';

import { useState } from 'react';
import { Card, PageHeader, KpiCard, Grid, Badge, Tabs, Button } from '@/components/ui';
import { Package, Search, Plus, Download, Filter, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

type Asset = {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  property: string;
  location: string;
  purchase_date: string;
  purchase_value: number;
  current_value: number;
  status: 'operational' | 'maintenance' | 'retired' | 'disposed';
  warranty_expiry: string;
  last_service: string;
  next_service: string;
  quantity: number;
};

const ASSET_CATEGORIES = ['All Assets', 'HVAC', 'Electrical', 'Plumbing', 'Furniture', 'IT Equipment', 'Security', 'Fire Safety'];

const DEMO_ASSETS: Asset[] = [
  { id: '1', asset_code: 'AST-HVAC-001', name: 'Central AC Unit - Tower A', category: 'HVAC', property: 'Supratik Exotica', location: 'Tower A - Rooftop', purchase_date: '2022-03-15', purchase_value: 850000, current_value: 680000, status: 'operational', warranty_expiry: '2027-03-15', last_service: '2025-11-10', next_service: '2026-02-10', quantity: 1 },
  { id: '2', asset_code: 'AST-HVAC-002', name: 'Split AC 2 Ton - Office', category: 'HVAC', property: 'Supratik Exotica', location: 'Tower A - Floor 3', purchase_date: '2023-06-20', purchase_value: 65000, current_value: 52000, status: 'operational', warranty_expiry: '2026-06-20', last_service: '2025-10-05', next_service: '2026-01-05', quantity: 12 },
  { id: '3', asset_code: 'AST-ELEC-001', name: 'DG Set 500 KVA', category: 'Electrical', property: 'Supratik Exotica', location: 'Basement B2', purchase_date: '2021-01-10', purchase_value: 2500000, current_value: 1875000, status: 'operational', warranty_expiry: '2026-01-10', last_service: '2025-12-01', next_service: '2026-03-01', quantity: 1 },
  { id: '4', asset_code: 'AST-ELEC-002', name: 'UPS System 100 KVA', category: 'Electrical', property: 'Supratik Elegance', location: 'Server Room', purchase_date: '2023-08-15', purchase_value: 450000, current_value: 382500, status: 'maintenance', warranty_expiry: '2028-08-15', last_service: '2025-12-15', next_service: '2025-12-20', quantity: 1 },
  { id: '5', asset_code: 'AST-LIFT-001', name: 'Passenger Elevator - 13 Person', category: 'Electrical', property: 'Supratik Exotica', location: 'Tower A', purchase_date: '2020-06-01', purchase_value: 3200000, current_value: 2240000, status: 'operational', warranty_expiry: '2025-06-01', last_service: '2025-11-28', next_service: '2026-02-28', quantity: 4 },
  { id: '6', asset_code: 'AST-PLMB-001', name: 'Water Treatment Plant', category: 'Plumbing', property: 'Supratik Exotica', location: 'Utility Block', purchase_date: '2021-04-20', purchase_value: 1200000, current_value: 900000, status: 'operational', warranty_expiry: '2026-04-20', last_service: '2025-10-15', next_service: '2026-01-15', quantity: 1 },
  { id: '7', asset_code: 'AST-FURN-001', name: 'Executive Office Chairs', category: 'Furniture', property: 'Supratik Elegance', location: 'Multiple Floors', purchase_date: '2024-01-10', purchase_value: 8500, current_value: 7650, status: 'operational', warranty_expiry: '2027-01-10', last_service: '-', next_service: '-', quantity: 85 },
  { id: '8', asset_code: 'AST-IT-001', name: 'CCTV Camera System', category: 'IT Equipment', property: 'Supratik Exotica', location: 'All Common Areas', purchase_date: '2023-02-28', purchase_value: 320000, current_value: 256000, status: 'operational', warranty_expiry: '2026-02-28', last_service: '2025-11-20', next_service: '2026-02-20', quantity: 48 },
  { id: '9', asset_code: 'AST-SEC-001', name: 'Boom Barrier - Entry Gate', category: 'Security', property: 'Supratik Lifestyle', location: 'Main Entrance', purchase_date: '2022-09-01', purchase_value: 145000, current_value: 101500, status: 'operational', warranty_expiry: '2025-09-01', last_service: '2025-12-01', next_service: '2026-03-01', quantity: 2 },
  { id: '10', asset_code: 'AST-FIRE-001', name: 'Fire Extinguisher ABC Type', category: 'Fire Safety', property: 'Supratik Exotica', location: 'All Floors', purchase_date: '2024-06-15', purchase_value: 3500, current_value: 3150, status: 'operational', warranty_expiry: '2029-06-15', last_service: '2025-06-15', next_service: '2026-06-15', quantity: 120 },
  { id: '11', asset_code: 'AST-HVAC-003', name: 'Chiller Unit 200 TR', category: 'HVAC', property: 'Supratik Elegance', location: 'Terrace', purchase_date: '2021-11-20', purchase_value: 4500000, current_value: 3150000, status: 'retired', warranty_expiry: '2026-11-20', last_service: '2025-08-10', next_service: '-', quantity: 1 },
  { id: '12', asset_code: 'AST-PLMB-002', name: 'Submersible Pumps', category: 'Plumbing', property: 'Supratik Lifestyle', location: 'Underground Tank', purchase_date: '2022-07-10', purchase_value: 85000, current_value: 59500, status: 'operational', warranty_expiry: '2025-07-10', last_service: '2025-12-05', next_service: '2026-03-05', quantity: 3 },
];

const PROPERTIES = ['All Properties', 'Supratik Exotica', 'Supratik Elegance', 'Supratik Lifestyle', 'Supratik Vista'];

export default function AssetsPage() {
  const [activeCategory, setActiveCategory] = useState('All Assets');
  const [selectedProperty, setSelectedProperty] = useState('All Properties');
  const [search, setSearch] = useState('');

  const filteredAssets = DEMO_ASSETS.filter(asset => {
    const matchesCategory = activeCategory === 'All Assets' || asset.category === activeCategory;
    const matchesProperty = selectedProperty === 'All Properties' || asset.property === selectedProperty;
    const matchesSearch = search === '' || 
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      asset.location.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesProperty && matchesSearch;
  });

  const totalValue = DEMO_ASSETS.reduce((sum, a) => sum + (a.current_value * a.quantity), 0);
  const maintenanceCount = DEMO_ASSETS.filter(a => a.status === 'maintenance').length;
  const warrantyExpiringSoon = DEMO_ASSETS.filter(a => {
    const expiry = new Date(a.warranty_expiry);
    const now = new Date();
    const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  }).length;

  const statusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'operational': return <Badge variant="active"><CheckCircle size={12} className="mr-1" /> Operational</Badge>;
      case 'maintenance': return <Badge variant="pending"><Wrench size={12} className="mr-1" /> Maintenance</Badge>;
      case 'retired': return <Badge variant="gray"><Clock size={12} className="mr-1" /> Retired</Badge>;
      case 'disposed': return <Badge variant="expired">Disposed</Badge>;
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Asset Management"
        subtitle="Track and manage property assets, inventory, and maintenance schedules"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast('Exporting asset inventory...')}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('Opening asset registration form...')}>
              <Plus size={14} /> Add Asset
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <Grid cols={4} className="mb-5">
        <KpiCard icon="📦" value={DEMO_ASSETS.length.toString()} label="Total Assets" change="Across all properties" color="accent" />
        <KpiCard icon="💰" value={`₹${(totalValue / 10000000).toFixed(1)}Cr`} label="Total Asset Value" change="Current book value" color="green" />
        <KpiCard icon="🔧" value={maintenanceCount.toString()} label="Under Maintenance" change="Requires attention" changeUp={false} color="yellow" />
        <KpiCard icon="⚠️" value={warrantyExpiringSoon.toString()} label="Warranty Expiring" change="Within 90 days" changeUp={false} color="red" />
      </Grid>

      {/* AI Asset Insights */}
      <div
        className="rounded-xl p-5 border mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.08), rgba(217,119,6,0.08))', borderColor: 'rgba(8,145,178,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <Package size={14} className="text-white" />
          </div>
          <span className="font-bold">AI Asset Intelligence</span>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>AI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '🔧', text: 'UPS System (AST-ELEC-002) service overdue by 5 days. Recommend immediate scheduling to avoid warranty void.' },
            { icon: '📊', text: 'Chiller Unit depreciation at 30%. Consider replacement planning for Q2 FY27 with estimated ₹45L budget.' },
            { icon: '⚡', text: '4 elevators due for annual certification in 60 days. Auto-raised vendor RFQ for inspection services.' },
          ].map((ins, i) => (
            <div key={i} className="p-3 rounded-lg text-sm border-l-2" style={{ background: 'var(--surface)', borderColor: 'var(--primary)', color: 'var(--text2)' }}>
              {ins.icon} {ins.text}
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Table */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              className="form-input text-sm pl-9"
              placeholder="Search assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input text-sm"
            style={{ maxWidth: 200 }}
            value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value)}
          >
            {PROPERTIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <Tabs
          tabs={ASSET_CATEGORIES}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <div className="overflow-x-auto mt-4">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Name</th>
                <th>Property</th>
                <th>Location</th>
                <th>Qty</th>
                <th>Purchase Value</th>
                <th>Current Value</th>
                <th>Warranty</th>
                <th>Next Service</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => {
                const warrantyDate = new Date(asset.warranty_expiry);
                const now = new Date();
                const warrantyDays = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={asset.id}>
                    <td className="font-mono text-xs font-medium" style={{ color: 'var(--primary)' }}>{asset.asset_code}</td>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{asset.name}</td>
                    <td>{asset.property}</td>
                    <td className="text-xs">{asset.location}</td>
                    <td className="text-center font-semibold">{asset.quantity}</td>
                    <td>{formatCurrency(asset.purchase_value)}</td>
                    <td className="font-semibold" style={{ color: 'var(--text)' }}>{formatCurrency(asset.current_value)}</td>
                    <td>
                      <span className={`text-xs font-medium ${warrantyDays < 0 ? 'text-red-500' : warrantyDays <= 90 ? 'text-yellow-600' : ''}`}>
                        {warrantyDays < 0 ? 'Expired' : warrantyDays <= 90 ? `${warrantyDays}d left` : asset.warranty_expiry}
                      </span>
                    </td>
                    <td className="text-xs">{asset.next_service === '-' ? '—' : asset.next_service}</td>
                    <td>{statusBadge(asset.status)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                          style={{ background: 'rgba(8,145,178,0.15)', color: 'var(--primary)' }}
                          onClick={() => toast(`Viewing asset ${asset.asset_code}...`)}
                        >
                          View
                        </button>
                        <button
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                          style={{ background: 'rgba(217,119,6,0.15)', color: 'var(--secondary)' }}
                          onClick={() => toast.success(`Service scheduled for ${asset.name}`)}
                        >
                          Service
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p style={{ color: 'var(--text3)' }}>No assets found matching your filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
