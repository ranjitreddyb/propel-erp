'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/services/api';
import { KpiCard, Grid, Card, PageHeader, Button, Badge, Tabs, Loading } from '@/components/ui';
import { Plus, Download, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Property = {
  id: string; code: string; name: string; type: string;
  city: string; state: string;
  total_units: number; occupied_units: number; occupancy_rate: number;
  current_value: number; total_area_sqft: number; is_active: boolean;
};

export default function PropertiesPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const { data: kpis } = useQuery({ queryKey: ['property-kpis'], queryFn: () => propertiesApi.getKpis() });
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', search],
    queryFn: () => propertiesApi.getAll({ search: search || undefined, pageSize: 50 }),
  });

  const k = kpis?.data || {};
  const props: Property[] = properties?.data || DEMO_PROPERTIES;

  const typeEmoji: Record<string, string> = { commercial: '🏙️', residential: '🏠', retail: '🛒', industrial: '🏭', mixed: '🏢' };
  const occColor = (r: number) => r >= 90 ? 'var(--accent3)' : r >= 75 ? 'var(--accent4)' : 'var(--accent5)';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="🏢 Property Portfolio"
        subtitle={`${k.total_properties || 12} properties · ₹${((k.total_asset_value || 285000000) / 10000000).toFixed(0)}Cr total asset value`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast('Importing from Excel…')}><Download size={14} /> Import</Button>
            <Button variant="primary" size="sm" onClick={() => toast('Opening property creation form…')}><Plus size={14} /> Add Property</Button>
          </>
        }
      />

      <Grid cols={4} className="mb-5">
        <KpiCard icon="🏢" value={String(k.total_properties || 12)}  label="Total Properties"  color="accent"  />
        <KpiCard icon="🏠" value={String(k.total_units || 426)}       label="Total Units"       color="purple"  />
        <KpiCard icon="📐" value={`${((k.total_area || 840000)/100000).toFixed(1)}L`} label="Sq.Ft Managed" color="yellow" />
        <KpiCard icon="💹" value={`₹${((k.total_asset_value||285000000)/10000000).toFixed(0)}Cr`} label="Asset Value" change="↑ 8% YoY" changeUp color="green" />
      </Grid>

      <Card>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <input className="form-input text-sm" style={{ maxWidth: 260 }} placeholder="Search properties…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2">
            <Button variant={view === 'grid' ? 'primary' : 'outline'} size="sm" onClick={() => setView('grid')}>Grid</Button>
            <Button variant={view === 'table' ? 'primary' : 'outline'} size="sm" onClick={() => setView('table')}>Table</Button>
          </div>
        </div>

        {isLoading ? <Loading /> : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {props.map((p) => (
              <div key={p.id}
                className="rounded-xl border overflow-hidden cursor-pointer hover:border-[var(--border2)] hover:-translate-y-0.5 transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                onClick={() => toast(`Opening ${p.name}…`)}
              >
                <div className="h-36 flex items-center justify-center text-5xl"
                  style={{ background: `linear-gradient(135deg,rgba(79,142,247,0.15),rgba(124,92,252,0.1))` }}>
                  {typeEmoji[p.type] || '🏢'}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-sm">{p.name}</h3>
                    <Badge variant={p.is_active ? 'active' : 'gray'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text3)' }}>
                    <MapPin size={11} /> {p.city}, {p.state}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Occupancy', value: `${p.occupancy_rate || 0}%`, color: occColor(p.occupancy_rate) },
                      { label: 'Units', value: `${p.occupied_units || 0}/${p.total_units || 0}` },
                      { label: 'Area', value: `${((p.total_area_sqft || 0)/1000).toFixed(0)}K sqft` },
                      { label: 'Value', value: `₹${((p.current_value||0)/10000000).toFixed(1)}Cr` },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'var(--surface2)' }}>
                        <div className="font-bold text-sm" style={{ color: s.color || 'var(--text)' }}>{s.value}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Location</th><th>Units</th><th>Occupancy</th><th>Asset Value</th><th>Status</th></tr></thead>
              <tbody>
                {props.map(p => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => toast(`Opening ${p.name}…`)}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text3)' }}>{p.code}</td>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{typeEmoji[p.type]} {p.name}</td>
                    <td><Badge variant="blue">{p.type}</Badge></td>
                    <td>{p.city}</td>
                    <td>{p.occupied_units}/{p.total_units}</td>
                    <td><span className="font-bold" style={{ color: occColor(p.occupancy_rate) }}>{p.occupancy_rate}%</span></td>
                    <td>₹{((p.current_value||0)/10000000).toFixed(1)}Cr</td>
                    <td><Badge variant={p.is_active ? 'active' : 'gray'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const DEMO_PROPERTIES: Property[] = [
  { id: '1', code: 'TWR-A', name: 'Prestige Tower A', type: 'commercial',   city: 'Hyderabad', state: 'Telangana', total_units: 180, occupied_units: 175, occupancy_rate: 97, current_value: 142000000, total_area_sqft: 360000, is_active: true },
  { id: '2', code: 'TWR-B', name: 'Prestige Residency B', type: 'residential', city: 'Hyderabad', state: 'Telangana', total_units: 120, occupied_units: 109, occupancy_rate: 91, current_value: 98000000, total_area_sqft: 180000, is_active: true },
  { id: '3', code: 'BLK-C', name: 'City Retail Hub C', type: 'retail',      city: 'Hyderabad', state: 'Telangana', total_units: 60,  occupied_units: 47,  occupancy_rate: 78, current_value: 45000000, total_area_sqft: 120000, is_active: true },
  { id: '4', code: 'IND-1', name: 'Industrial Park', type: 'industrial',    city: 'Pune',      state: 'Maharashtra', total_units: 12,  occupied_units: 12,  occupancy_rate: 100, current_value: 62000000, total_area_sqft: 200000, is_active: true },
  { id: '5', code: 'VLR-2', name: 'Suburban Villas Ph.2', type: 'residential', city: 'Bengaluru', state: 'Karnataka', total_units: 40,  occupied_units: 26,  occupancy_rate: 65, current_value: 38000000, total_area_sqft: 80000, is_active: true },
];
