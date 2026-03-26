'use client';

import { Card, PageHeader } from '@/components/ui';
import { FolderOpen, FileText } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Document Manager"
        subtitle="Contracts, agreements & file storage"
      />

      <Card>
        <div className="text-center py-12">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Document Manager</h3>
          <p style={{ color: 'var(--text3)' }}>Contract storage and AI analysis coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
