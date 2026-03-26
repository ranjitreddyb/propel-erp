'use client';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi } from '@/services/api';
import { KpiCard, Grid, Card, PageHeader, Button, Badge, Loading } from '@/components/ui';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

type WorkOrder = { id: string; wo_number: string; title: string; priority: string; status: string; property_name: string; unit_number?: string; wo_type: string; age_hours?: number; vendor_name?: string; scheduled_date?: string; };

export default function MaintenancePage() {
  const { data: kpis } = useQuery({ queryKey: ['maintenance-kpis'], queryFn: () => maintenanceApi.getKpis() });
  const { data: wos, isLoading } = useQuery({ queryKey: ['work-orders'], queryFn: () => maintenanceApi.getWorkOrders({ pageSize: 30 }) });
  const k = kpis?.data || {};
  const priorityVariant = (p: string): 'expired' | 'pending' | 'blue' | 'gray' => p === 'critical' ? 'expired' : p === 'high' ? 'pending' : p === 'medium' ? 'blue' : 'gray';
  const statusVariant = (s: string): 'active' | 'pending' | 'blue' | 'gray' => s === 'completed' ? 'active' : s === 'in_progress' ? 'blue' : s === 'open' ? 'pending' : 'gray';
  return (
    <div className="animate-fade-in">
      <PageHeader title="🔧 Property Maintenance" subtitle="AI-powered predictive maintenance & work order management"
        actions={<Button variant="primary" size="sm" onClick={() => toast('Opening work order form…')}><Plus size={14} /> New Work Order</Button>} />
      <Grid cols={4} className="mb-5">
        <KpiCard icon="🔴" value={String(k.critical||3)}     label="Critical Issues"      color="red"    />
        <KpiCard icon="🟡" value={String(k.in_progress||8)}  label="In Progress"          color="yellow" />
        <KpiCard icon="🔵" value={String(k.open||7)}         label="Open / Scheduled"     color="accent" />
        <KpiCard icon="✅" value={String(k.completed_this_month||42)} label="Completed This Month" color="green" />
      </Grid>
      <Card>
        {isLoading ? <Loading /> : (
          <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th>WO No.</th><th>Type</th><th>Title</th><th>Location</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(wos?.data || DEMO_WOS).map((wo: WorkOrder) => (
                <tr key={wo.id}>
                  <td className="font-medium" style={{ color: 'var(--text)' }}>{wo.wo_number}</td>
                  <td><Badge variant={wo.wo_type==='predictive'?'purple' as 'gray':'blue'}>{wo.wo_type}</Badge></td>
                  <td style={{ color: 'var(--text)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wo.title}</td>
                  <td>{wo.property_name}{wo.unit_number ? `, ${wo.unit_number}` : ''}</td>
                  <td><Badge variant={priorityVariant(wo.priority)}>{wo.priority.toUpperCase()}</Badge></td>
                  <td>{wo.vendor_name||'Unassigned'}</td>
                  <td><Badge variant={statusVariant(wo.status)}>{wo.status.replace('_',' ')}</Badge></td>
                  <td><button className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'rgba(79,142,247,0.15)',color:'var(--accent)' }} onClick={() => toast(`Opening ${wo.wo_number}…`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
const DEMO_WOS = [
  { id:'1', wo_number:'WO-2026-0184', wo_type:'predictive', title:'HVAC compressor anomaly detected', property_name:'Tower B', unit_number:'HVAC-2', priority:'critical', vendor_name:'CoolTech HVAC', status:'scheduled' },
  { id:'2', wo_number:'WO-2026-0183', wo_type:'reactive',   title:'Water leak in common washroom',    property_name:'Tower A', unit_number:'Floor 8', priority:'high',     vendor_name:'AquaFix Services', status:'in_progress' },
  { id:'3', wo_number:'WO-2026-0182', wo_type:'routine',    title:'Monthly fire extinguisher check',  property_name:'All Blocks', priority:'medium', vendor_name:'SafeGuard Co', status:'open' },
];
