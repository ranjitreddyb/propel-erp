'use client';

import { Card, PageHeader } from '@/components/ui';
import { Workflow, GitBranch } from 'lucide-react';

export default function WorkflowPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Workflow Designer"
        subtitle="Create and manage approval workflows"
      />

      <Card>
        <div className="text-center py-12">
          <Workflow size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Workflow Designer</h3>
          <p style={{ color: 'var(--text3)' }}>Visual workflow builder for approvals and automation coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
