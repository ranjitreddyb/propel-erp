'use client';

import { Card, PageHeader, KpiCard, Grid } from '@/components/ui';
import { Building, Wrench, Users, ClipboardList } from 'lucide-react';

export default function FacilityPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Facility Management"
        subtitle="Manage building operations, amenities & services"
      />

      <Grid cols={4} className="mb-6">
        <KpiCard icon="🏢" value="8" label="Active Facilities" color="accent" />
        <KpiCard icon="👥" value="24" label="Staff On Duty" color="green" />
        <KpiCard icon="🔧" value="12" label="Pending Tasks" color="yellow" />
        <KpiCard icon="✅" value="94%" label="SLA Compliance" color="purple" />
      </Grid>

      <Card>
        <div className="text-center py-12">
          <Building size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Facility Management</h3>
          <p style={{ color: 'var(--text3)' }}>Building operations and amenity management coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
