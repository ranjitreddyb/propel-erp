'use client';

import { Card, PageHeader } from '@/components/ui';
import { FileBarChart2, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Report Builder"
        subtitle="Generate and export business reports"
      />

      <Card>
        <div className="text-center py-12">
          <FileBarChart2 size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Report Builder</h3>
          <p style={{ color: 'var(--text3)' }}>Custom report generation and PDF export coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
