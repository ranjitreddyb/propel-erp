'use client';

import { Card, PageHeader, KpiCard, Grid } from '@/components/ui';
import { ShoppingCart, Package, FileText, Truck } from 'lucide-react';

export default function ProcurementPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Procurement"
        subtitle="Purchase orders, vendor management & inventory"
      />

      <Grid cols={4} className="mb-6">
        <KpiCard icon="📦" value="18" label="Open POs" color="accent" />
        <KpiCard icon="🏪" value="45" label="Active Vendors" color="green" />
        <KpiCard icon="💰" value="₹12.5L" label="Monthly Spend" color="yellow" />
        <KpiCard icon="⏱️" value="3.2 days" label="Avg Lead Time" color="purple" />
      </Grid>

      <Card>
        <div className="text-center py-12">
          <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Procurement Module</h3>
          <p style={{ color: 'var(--text3)' }}>Purchase orders and vendor management coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
