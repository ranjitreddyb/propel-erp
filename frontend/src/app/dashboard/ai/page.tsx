'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/services/api';
import { Card, PageHeader, Button, Grid, KpiCard, Loading } from '@/components/ui';
import { Brain, Send, Zap, TrendingUp, AlertTriangle, Wrench, FileText, Home, Activity, Lightbulb, Receipt, MapPin, Package } from 'lucide-react';
import toast from 'react-hot-toast';

type Message = { role: 'user' | 'assistant'; content: string };

const AI_MODULES = [
  {
    icon: <TrendingUp size={20} />, color: 'rgba(32,58,43,.1)', border: 'rgba(32,58,43,.2)',
    title: 'Predictive Revenue Engine',
    desc: 'ML models forecast rental income 12 months ahead with 94% accuracy using historical lease and market data.',
    metric: '₹5.1 Crore', metricLabel: 'Q1 FY27 Forecast', metricColor: '#36684B',
    metricSub: '↑ 21% YoY · Confidence 94%',
    action: 'View Projections',
  },
  {
    icon: <MapPin size={20} />, color: 'rgba(8,145,178,.1)', border: 'rgba(8,145,178,.2)',
    title: 'Rental Index AI',
    desc: 'Aggregates rental data from nearby properties, micro-markets, and govt indices to provide real-time market benchmarking.',
    rentalIndex: [
      { area: 'Whitefield (Office)', rate: '₹85/sqft', trend: '↑ 12%', benchmark: 'Above Market' },
      { area: 'Whitefield (Retail)', rate: '₹120/sqft', trend: '↑ 8%', benchmark: 'At Market' },
      { area: 'Marathahalli (Residential)', rate: '₹42/sqft', trend: '↑ 5%', benchmark: 'Below Market' },
    ],
    action: 'View Full Index Report',
  },
  {
    icon: <AlertTriangle size={20} />, color: 'rgba(158,60,60,.1)', border: 'rgba(158,60,60,.2)',
    title: 'Tenant Churn Risk Predictor',
    desc: 'Analyses payment patterns, lease age, and communication gaps to flag attrition risk 90 days ahead.',
    risks: [{ name: 'Unit 4A — TechStar', pct: 78, level: 'HIGH' }, { name: 'Unit 7B — Gourmet Co', pct: 52, level: 'MED' }, { name: 'Unit 12C — MegaCorp', pct: 12, level: 'LOW' }],
    action: 'Generate Retention Plan',
  },
  {
    icon: <Package size={20} />, color: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.2)',
    title: 'Asset Lifecycle AI',
    desc: 'Tracks depreciation, predicts replacement timelines, and optimizes capex budgets across all property assets.',
    assetInsights: [
      { label: 'Assets needing replacement', value: '8', color: '#DC2626' },
      { label: 'Warranty expiring (90d)', value: '12', color: '#F59E0B' },
      { label: 'Optimal maintenance score', value: '94%', color: '#10B981' },
    ],
    action: 'View Asset Intelligence',
  },
  {
    icon: <Wrench size={20} />, color: 'rgba(54,104,75,.1)', border: 'rgba(54,104,75,.2)',
    title: 'Predictive Maintenance AI',
    desc: 'IoT sensor data + repair history power failure-prediction models for HVAC, lifts, and electrical systems.',
    alerts: [{ label: '⚠️ HVAC Block B — 12 days', sub: 'Compressor efficiency drop 23%', color: '#9E3C3C' }, { label: '⚡ Elevator Tower A — 28 days', sub: 'Motor vibration above baseline', color: '#D6A345' }],
    action: 'Auto-Schedule Maintenance',
  },
  {
    icon: <FileText size={20} />, color: 'rgba(207,161,90,.1)', border: 'rgba(207,161,90,.2)',
    title: 'Contract Intelligence Engine',
    desc: 'NLP reads and extracts key clauses, flags anomalies, and summarises lease and vendor contracts.',
    tags: ['✅ Rent Escalation: 8% p.a.', '⚠️ Force majeure missing', '📌 Break clause: Year 2'],
    action: 'Analyse New Contract',
  },
  {
    icon: <Receipt size={20} />, color: 'rgba(32,58,43,.1)', border: 'rgba(32,58,43,.25)',
    title: 'Auto-GST & Compliance AI',
    desc: 'Automates GST filing, TDS calculations, property tax reminders, and RERA compliance tracking for all properties.',
    compliance: [
      { label: 'GSTR-1 (Nov)', status: '✅ Filed', date: 'Nov 11' },
      { label: 'GSTR-3B (Nov)', status: '✅ Filed', date: 'Nov 20' },
      { label: 'TDS Q3', status: '⏳ Pending', date: 'Due Dec 31' },
      { label: 'Property Tax FY26', status: '✅ Paid', date: 'Apr 15' },
    ],
    action: 'View Compliance Dashboard',
  },
  {
    icon: <Home size={20} />, color: 'rgba(207,161,90,.1)', border: 'rgba(207,161,90,.2)',
    title: 'AI Property Valuation',
    desc: 'Real-time valuations using comparable sales, location intelligence, rental yield, and macro indicators.',
    valuations: [{ name: 'Supratik Exotica', val: '₹142Cr', chg: '↑ 12%' }, { name: 'Supratik Elegance', val: '₹98Cr', chg: '↑ 8%' }, { name: 'Supratik Lifestyle', val: '₹45Cr', chg: '↑ 4%' }],
    action: 'Full Valuation Report',
  },
  {
    icon: <Activity size={20} />, color: 'rgba(32,58,43,.1)', border: 'rgba(32,58,43,.2)',
    title: 'Tenant Sentiment AI',
    desc: 'Analyses service requests, response times, and communication tone to score tenant satisfaction in real-time.',
    score: 87,
    action: 'Full Sentiment Report',
  },
  {
    icon: <Lightbulb size={20} />, color: 'rgba(54,104,75,.1)', border: 'rgba(54,104,75,.2)',
    title: 'Energy Optimization AI',
    desc: 'Monitors IoT energy sensors to auto-schedule HVAC and lighting for optimal efficiency and carbon reduction.',
    savings: [{ label: '💡 Lighting auto-dim', saved: '₹18K/month' }, { label: '❄️ HVAC scheduling', saved: '15% reduction' }, { label: '☀️ Solar ROI', saved: '3.2 yr payback' }],
    action: 'View Energy Dashboard',
  },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm PropelAI. Ask me anything about your property portfolio — revenue, occupancy, tenants, maintenance, or financial performance. Try: *\"What is our total revenue this month?\"*" }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const { data: churnData } = useQuery({ queryKey: ['churn-risks'], queryFn: () => aiApi.getChurnRisks(), staleTime: 10 * 60_000 });
  const { data: forecastData } = useQuery({ queryKey: ['revenue-forecast'], queryFn: () => aiApi.getRevenueForecast(), staleTime: 10 * 60_000 });

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setSending(true);
    try {
      const res = await aiApi.chat(msg, messages.slice(-6));
      setMessages(m => [...m, { role: 'assistant', content: res.response || res.text || 'No response' }]);
    } catch {
      // Fallback demo responses
      const demo = getDemoResponse(msg);
      setMessages(m => [...m, { role: 'assistant', content: demo }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI Intelligence Command Centre"
        subtitle="10 active AI modules · Real-time predictions & automation"
        actions={
          <Button variant="primary" onClick={() => toast.success('Running full AI analysis across all modules…')}>
            <Zap size={14} /> Run Full Analysis
          </Button>
        }
      />

      {/* AI Module Cards */}
      <Grid cols={3} className="mb-6">
        {AI_MODULES.map((mod, i) => (
          <Card key={i} className="flex flex-col gap-3 hover:scale-[1.01] transition-transform" style={{ borderColor: mod.border }}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: mod.color, color: 'var(--text)' }}>
                {mod.icon}
              </div>
              <h3 className="font-bold text-sm leading-tight">{mod.title}</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{mod.desc}</p>

            {/* Module-specific content */}
            {mod.metric && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>{mod.metricLabel}</div>
                <div className="text-2xl font-bold mt-1" style={{ color: mod.metricColor }}>{mod.metric}</div>
                <div className="text-xs mt-0.5" style={{ color: mod.metricColor }}>{mod.metricSub}</div>
              </div>
            )}
            {mod.risks && (
              <div className="space-y-1.5">
                {mod.risks.map(r => (
                  <div key={r.name} className="flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs" style={{
                    background: r.level === 'HIGH' ? 'rgba(247,79,122,.1)' : r.level === 'MED' ? 'rgba(247,184,79,.1)' : 'rgba(0,212,170,.1)'
                  }}>
                    <span style={{ color: 'var(--text)' }}>{r.name}</span>
                    <span className="font-bold" style={{ color: r.level === 'HIGH' ? 'var(--accent5)' : r.level === 'MED' ? 'var(--accent4)' : 'var(--accent3)' }}>{r.level} {r.pct}%</span>
                  </div>
                ))}
              </div>
            )}
            {mod.alerts && (
              <div className="space-y-1.5">
                {mod.alerts.map(a => (
                  <div key={a.label} className="p-2.5 rounded-lg border-l-2 text-xs" style={{ background: 'var(--surface2)', borderColor: a.color }}>
                    <div className="font-bold" style={{ color: a.color }}>{a.label}</div>
                    <div style={{ color: 'var(--text3)' }}>{a.sub}</div>
                  </div>
                ))}
              </div>
            )}
            {mod.tags && (
              <div className="flex flex-wrap gap-1.5">
                {mod.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{t}</span>
                ))}
              </div>
            )}
            {mod.valuations && (
              <div className="space-y-1">
                {mod.valuations.map(v => (
                  <div key={v.name} className="flex justify-between text-sm px-2 py-1.5 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <span style={{ color: 'var(--text2)' }}>{v.name}</span>
                    <span className="font-bold" style={{ color: 'var(--accent3)' }}>{v.val} <span className="text-xs">{v.chg}</span></span>
                  </div>
                ))}
              </div>
            )}
            {mod.score !== undefined && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>Satisfaction Score</span>
                  <span className="text-2xl font-bold" style={{ color: '#36684B' }}>{mod.score}/100</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                  <div className="h-full rounded-full" style={{ width: `${mod.score}%`, background: 'linear-gradient(90deg, #36684B, #203A2B)' }} />
                </div>
              </div>
            )}
            {mod.savings && (
              <div className="space-y-1.5">
                {mod.savings.map(s => (
                  <div key={s.label} className="flex justify-between text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <span style={{ color: 'var(--text2)' }}>{s.label}</span>
                    <span className="font-semibold" style={{ color: '#36684B' }}>{s.saved}</span>
                  </div>
                ))}
              </div>
            )}
            {(mod as any).compliance && (
              <div className="space-y-1.5">
                {(mod as any).compliance.map((c: {label: string; status: string; date: string}) => (
                  <div key={c.label} className="flex justify-between items-center text-xs px-2.5 py-2 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <span style={{ color: 'var(--text)' }}>{c.label}</span>
                    <div className="text-right">
                      <span className="font-semibold">{c.status}</span>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{c.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(mod as any).rentalIndex && (
              <div className="space-y-1.5">
                {(mod as any).rentalIndex.map((r: {area: string; rate: string; trend: string; benchmark: string}) => (
                  <div key={r.area} className="flex justify-between items-center text-xs px-2.5 py-2 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{r.area}</span>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{r.benchmark}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold" style={{ color: 'var(--primary)' }}>{r.rate}</span>
                      <div className="text-[10px] font-semibold" style={{ color: r.trend.includes('↑') ? '#10B981' : '#EF4444' }}>{r.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(mod as any).assetInsights && (
              <div className="space-y-1.5">
                {(mod as any).assetInsights.map((a: {label: string; value: string; color: string}) => (
                  <div key={a.label} className="flex justify-between items-center text-xs px-2.5 py-2 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <span style={{ color: 'var(--text2)' }}>{a.label}</span>
                    <span className="font-bold text-sm" style={{ color: a.color }}>{a.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border mt-auto transition-all hover:opacity-80"
              style={{ background: mod.color, borderColor: mod.border, color: 'var(--text)' }}
              onClick={() => toast(`🤖 ${mod.action}…`)}
            >
              {mod.action} →
            </button>
          </Card>
        ))}
      </Grid>

      {/* AI Chat */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
            <Brain size={14} className="text-white" />
          </div>
          <h3 className="font-bold">PropelAI Assistant</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white ml-1" style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
            POWERED BY AI
          </span>
        </div>

        {/* Messages */}
        <div className="h-56 overflow-y-auto flex flex-col gap-3 mb-4 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', borderRadius: '16px 16px 4px 16px' }
                  : { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '16px 16px 16px 4px' }
                }
                dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>') }}
              />
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
                PropelAI is thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mb-3">
          {['Revenue this month', 'Which tenants are at risk?', 'Occupancy by property', 'Maintenance alerts today'].map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(79,142,247,0.1)', borderColor: 'rgba(79,142,247,0.25)', color: 'var(--accent)' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="form-input flex-1 text-sm"
            placeholder="Ask about revenue, tenants, occupancy, maintenance…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={sending}
          />
          <Button variant="primary" onClick={() => sendMessage()} disabled={!input.trim() || sending}>
            <Send size={14} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function getDemoResponse(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('revenue') || m.includes('income')) return '📊 **This month\'s financials:**\n• Revenue: **₹4.85 Crore**\n• Breakdown: Rental ₹4.2Cr, Lease premiums ₹42L, Facility charges ₹23L\n• ↑ 12.4% vs February 2026\n• Outstanding AR: **₹68 Lakhs**\n\n💡 _Tip: Navigate to Finance → Trial Balance for detailed ledger breakdown._';
  if (m.includes('churn') || m.includes('risk') || m.includes('tenant')) return '⚠️ **3 High-Risk Tenants Identified:**\n• **Unit 4A (TechStar):** 78% churn risk — payment delays + expiring in 45 days\n• **Unit 7B (Gourmet Co):** 52% risk — market alternatives being scouted\n• **Unit 9D (StartupX):** 45% risk — office downsizing signals detected\n\n🎯 AI-personalised retention packages auto-prepared. Recommend outreach this week.';
  if (m.includes('occupancy') || m.includes('vacant')) return '🏢 **Portfolio Occupancy:**\n• Tower A (Commercial): **97%** — 175/180 units\n• Tower B (Residential): **91%** — 109/120 units\n• Block C (Retail): **78%** — 47/60 shops\n• Industrial: **100%** — 12/12 warehouses\n• Villas Ph.2: **65%** — 26/40 units\n\n**Overall: 94.2%** (Market avg: 87%) ✅';
  if (m.includes('maintenance') || m.includes('repair')) return '🔧 **Open Maintenance Alerts:**\n• 🔴 **CRITICAL:** HVAC Block B — AI predicts failure in 12 days. WO-0184 raised.\n• 🟡 **HIGH:** Water leak Tower A Floor 8 — WO-0183 in progress\n• 🟢 **SCHEDULED:** Fire inspection all blocks — due 26 Mar 2026\n\nTotal open work orders: **18** (3 critical, 8 in progress)';
  return '🧠 I can help with **revenue analysis, occupancy rates, tenant churn risks, maintenance alerts, and lease renewals**. What would you like to know about your property portfolio at Prestige Properties?';
}
