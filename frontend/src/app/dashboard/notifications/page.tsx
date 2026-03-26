'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import { Card, PageHeader, Button } from '@/components/ui';
import toast from 'react-hot-toast';

type Notification = { id: string; type: string; title: string; body: string; priority: string; is_read: boolean; created_at: string; };

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { markAllRead } = useAppStore();
  const { data: notifs } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.getAll({ pageSize: 50 }) });
  const readAllMutation = useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: () => { markAllRead(); qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); } });
  const priorityIcon = (p: string) => ({ critical:'🚨', high:'⚠️', normal:'ℹ️', low:'💬' }[p] || '🔔');
  const data: Notification[] = notifs?.data || DEMO_NOTIFS;
  return (
    <div className="animate-fade-in">
      <PageHeader title="🔔 Alerts & Notifications" subtitle={`${data.filter((n: Notification) => !n.is_read).length} unread · SMS, Email & App channels`}
        actions={<Button variant="outline" size="sm" onClick={() => readAllMutation.mutate()}>Mark All Read</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card><h3 className="font-bold mb-3 text-sm">📱 System Alerts</h3>
          <div className="space-y-2">{data.filter((_: Notification,i: number)=>i<4).map((n: Notification) => (
            <div key={n.id} className="flex gap-3 p-3 rounded-lg border cursor-pointer hover:bg-[var(--surface2)] transition-colors" style={{ borderColor:'var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background:n.priority==='critical'?'rgba(247,79,122,0.15)':n.priority==='high'?'rgba(247,184,79,0.15)':'rgba(79,142,247,0.15)' }}>{priorityIcon(n.priority)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color:'var(--text)' }}>{n.title}</div>
                <div className="text-xs mt-0.5 line-clamp-2" style={{ color:'var(--text2)' }}>{n.body}</div>
                <div className="text-xs mt-1" style={{ color:'var(--text3)' }}>{n.created_at}</div>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background:'var(--accent)' }} />}
            </div>
          ))}</div>
        </Card>
        <Card><h3 className="font-bold mb-3 text-sm">🧠 AI Insights</h3>
          <div className="space-y-2">{data.filter((_: Notification,i: number)=>i>=4).map((n: Notification) => (
            <div key={n.id} className="flex gap-3 p-3 rounded-lg border cursor-pointer hover:bg-[var(--surface2)] transition-colors" style={{ borderColor:'rgba(124,92,252,0.2)', background:'rgba(124,92,252,0.05)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background:'rgba(124,92,252,0.15)' }}>🧠</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color:'var(--text)' }}>{n.title}</div>
                <div className="text-xs mt-0.5 line-clamp-2" style={{ color:'var(--text2)' }}>{n.body}</div>
                <div className="text-xs mt-1" style={{ color:'var(--text3)' }}>{n.created_at}</div>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background:'var(--accent2)' }} />}
            </div>
          ))}</div>
        </Card>
      </div>
    </div>
  );
}
const DEMO_NOTIFS = [
  { id:'1', type:'maintenance', title:'Critical: HVAC Anomaly Detected', body:'AI sensor alert: Block B HVAC compressor efficiency dropped 23%. Predictive failure in ~12 days. Work order auto-created.', priority:'critical', is_read:false, created_at:'2 hours ago · SMS + Email sent' },
  { id:'2', type:'lease', title:'Lease Renewal Due: Ravi Kumar (Unit 7C)', body:'Lease expires 14 Apr 2026. AI-recommended renewal rate: ₹34,500/mo (+7.8%). Auto-draft sent to tenant portal.', priority:'high', is_read:false, created_at:'4 hours ago · Email sent' },
  { id:'3', type:'payment', title:'Payment Received: TechCorp India', body:'₹4,20,000 rent payment received and auto-posted. Ledger updated. Receipt generated.', priority:'normal', is_read:true, created_at:'Yesterday · Posted' },
  { id:'4', type:'approval', title:'Voucher Approved: PO-2026-0123', body:'SafeGuard Security PO ₹1,42,000 approved by Finance Head. Payment scheduled.', priority:'normal', is_read:true, created_at:'Yesterday' },
  { id:'5', type:'ai', title:'AI: Churn Risk Escalated — 3 Tenants', body:'Units 4A, 7B, 9D show high churn probability. Retention scripts and discount offers auto-prepared.', priority:'high', is_read:false, created_at:'1 hour ago · AI Alert' },
  { id:'6', type:'ai', title:'AI: Revenue Opportunity Identified', body:'Block C has 13 vacant units. AI matched 8 qualified leads from CRM with 90%+ compatibility.', priority:'normal', is_read:false, created_at:'3 hours ago · AI Insight' },
];
