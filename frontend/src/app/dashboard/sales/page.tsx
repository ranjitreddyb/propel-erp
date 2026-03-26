'use client';

import { Card, PageHeader, KpiCard, Grid, Badge } from '@/components/ui';
import { TrendingUp, IndianRupee, Building2, Users } from 'lucide-react';

export default function SalesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Property Sales"
        subtitle="Track property sales, bookings & revenue"
      />

      <Grid cols={4} className="mb-6">
        <KpiCard icon="🏠" value="12" label="Active Listings" color="accent" />
        <KpiCard icon="📝" value="8" label="Bookings This Month" color="green" />
        <KpiCard icon="💰" value="₹4.2Cr" label="Sales Value" color="yellow" />
        <KpiCard icon="📈" value="23%" label="Conversion Rate" color="purple" />
      </Grid>

      <Card>
        <div className="text-center py-12">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Sales Module</h3>
          <p style={{ color: 'var(--text3)' }}>Property sales tracking and analytics coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
