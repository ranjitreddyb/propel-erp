'use client';

import { Card, PageHeader } from '@/components/ui';
import { UserCog, Shield } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage users, roles & permissions"
      />

      <Card>
        <div className="text-center py-12">
          <UserCog size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>User Management</h3>
          <p style={{ color: 'var(--text3)' }}>User administration and role-based access control coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
