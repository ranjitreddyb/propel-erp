'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, Button, Grid, KpiCard, Badge } from '@/components/ui';
import { ArrowLeft, TrendingUp, MapPin, AlertTriangle, Package, Wrench, FileText, Receipt, Home, Activity, Lightbulb, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AI_REPORTS: Record<string, {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}> = {
  'revenue': {
    title: 'Predictive Revenue Engine',
    subtitle: '12-month rental income forecast with ML-powered accuracy',
    icon: <TrendingUp size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="📈" value="₹5.1 Cr" label="Q1 FY27 Forecast" change="↑ 21% YoY" changeUp={true} color="green" />
          <KpiCard icon="🎯" value="94%" label="Model Accuracy" change="Based on 3yr data" color="accent" />
          <KpiCard icon="📊" value="₹18.2 Cr" label="FY27 Annual" change="Projected" color="yellow" />
          <KpiCard icon="💰" value="₹1.52 Cr" label="Monthly Avg" change="Next 12 months" color="purple" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Monthly Revenue Forecast (FY27)</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Projected Revenue</th>
                  <th>Confidence</th>
                  <th>YoY Change</th>
                  <th>Key Drivers</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { month: 'Apr 2026', rev: '₹1.42 Cr', conf: '96%', yoy: '+18%', drivers: 'New leases at Supratik Exotica' },
                  { month: 'May 2026', rev: '₹1.45 Cr', conf: '95%', yoy: '+19%', drivers: 'Rent escalation cycle' },
                  { month: 'Jun 2026', rev: '₹1.48 Cr', conf: '94%', yoy: '+20%', drivers: 'Retail CAM billing' },
                  { month: 'Jul 2026', rev: '₹1.52 Cr', conf: '93%', yoy: '+22%', drivers: 'IT corridor expansion' },
                  { month: 'Aug 2026', rev: '₹1.55 Cr', conf: '92%', yoy: '+23%', drivers: 'Festival season demand' },
                  { month: 'Sep 2026', rev: '₹1.58 Cr', conf: '91%', yoy: '+24%', drivers: 'Corporate relocations' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{r.month}</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{r.rev}</td>
                    <td><Badge variant="active">{r.conf}</Badge></td>
                    <td className="font-semibold text-green-600">{r.yoy}</td>
                    <td className="text-sm" style={{ color: 'var(--text2)' }}>{r.drivers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>AI Insights & Recommendations</h3>
          <div className="space-y-3">
            {[
              { icon: '📈', text: 'Revenue trending 21% above last year. Primary driver: 3 new corporate leases in Bhubaneswar IT corridor.' },
              { icon: '⚠️', text: 'Q3 projection may be affected by 2 lease expirations. Recommend early renewal negotiations.' },
              { icon: '💡', text: 'Opportunity: Patia micro-market showing 14% rental growth. Consider premium positioning for new inventory.' },
              { icon: '🎯', text: 'Rent escalation clauses will add ₹12L additional revenue starting August 2026.' },
            ].map((ins, i) => (
              <div key={i} className="p-4 rounded-xl border-l-4" style={{ background: 'var(--surface2)', borderColor: 'var(--primary)' }}>
                <span className="mr-2">{ins.icon}</span>
                <span style={{ color: 'var(--text)' }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    ),
  },
  'rental-index': {
    title: 'Rental Index AI',
    subtitle: 'Real-time market benchmarking for Odisha micro-markets',
    icon: <MapPin size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="📍" value="12" label="Micro-Markets Tracked" change="Odisha region" color="accent" />
          <KpiCard icon="📈" value="+9.2%" label="Avg. Market Growth" change="YoY" changeUp={true} color="green" />
          <KpiCard icon="🏢" value="₹52/sqft" label="Avg. Office Rate" change="Bhubaneswar" color="yellow" />
          <KpiCard icon="🏬" value="₹78/sqft" label="Avg. Retail Rate" change="Prime locations" color="purple" />
        </Grid>

        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Bhubaneswar & Cuttack Rental Index</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Property Type</th>
                  <th>Current Rate</th>
                  <th>6M Change</th>
                  <th>12M Change</th>
                  <th>Benchmark</th>
                  <th>Your Position</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { loc: 'Patia (IT Hub)', type: 'Office', rate: '₹48/sqft', m6: '+7%', m12: '+14%', bench: 'Above Market', pos: '₹52/sqft (+8%)' },
                  { loc: 'Infocity', type: 'Office', rate: '₹55/sqft', m6: '+5%', m12: '+11%', bench: 'At Market', pos: '₹54/sqft (-2%)' },
                  { loc: 'Saheed Nagar', type: 'Residential', rate: '₹38/sqft', m6: '+3%', m12: '+6%', bench: 'Below Market', pos: '₹35/sqft (-8%)' },
                  { loc: 'Jaydev Vihar', type: 'Retail', rate: '₹85/sqft', m6: '+6%', m12: '+12%', bench: 'Above Market', pos: '₹92/sqft (+8%)' },
                  { loc: 'Nayapalli', type: 'Residential', rate: '₹32/sqft', m6: '+4%', m12: '+8%', bench: 'At Market', pos: '₹33/sqft (+3%)' },
                  { loc: 'Badambadi (Cuttack)', type: 'Retail', rate: '₹65/sqft', m6: '+4%', m12: '+9%', bench: 'At Market', pos: '₹68/sqft (+5%)' },
                  { loc: 'Chandrasekharpur', type: 'Office', rate: '₹42/sqft', m6: '+6%', m12: '+10%', bench: 'Below Market', pos: '₹40/sqft (-5%)' },
                  { loc: 'Rasulgarh', type: 'Warehouse', rate: '₹22/sqft', m6: '+8%', m12: '+15%', bench: 'Above Market', pos: '₹25/sqft (+14%)' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{r.loc}</td>
                    <td>{r.type}</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{r.rate}</td>
                    <td className="text-green-600 font-semibold">{r.m6}</td>
                    <td className="text-green-600 font-semibold">{r.m12}</td>
                    <td><Badge variant={r.bench === 'Above Market' ? 'active' : r.bench === 'Below Market' ? 'pending' : 'gray'}>{r.bench}</Badge></td>
                    <td className="font-semibold" style={{ color: r.pos.includes('+') ? '#10B981' : '#EF4444' }}>{r.pos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Data Sources & Methodology</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Government Indices', desc: 'NHB RESIDEX, RBI House Price Index, Circle Rates from Odisha Govt' },
              { title: 'Transaction Data', desc: 'IGR Odisha stamp duty records, 1,200+ verified transactions/month' },
              { title: 'Listing Aggregation', desc: '99acres, MagicBricks, Housing.com — 5,000+ active listings' },
              { title: 'Competitor Tracking', desc: 'Direct surveys of 45 premium properties in BBSR region' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--surface2)' }}>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{s.title}</h4>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    ),
  },
  'churn': {
    title: 'Tenant Churn Risk Predictor',
    subtitle: 'ML-powered attrition prediction with retention recommendations',
    icon: <AlertTriangle size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="⚠️" value="3" label="High Risk Tenants" change="Action needed" changeUp={false} color="red" />
          <KpiCard icon="🟡" value="7" label="Medium Risk" change="Monitor closely" color="yellow" />
          <KpiCard icon="✅" value="42" label="Low Risk" change="Stable tenants" changeUp={true} color="green" />
          <KpiCard icon="📊" value="86%" label="Retention Rate" change="Last 12 months" color="accent" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>High & Medium Risk Tenants</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property / Unit</th>
                  <th>Risk Score</th>
                  <th>Risk Factors</th>
                  <th>Lease Expiry</th>
                  <th>Monthly Rent</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tenant: 'TechStar Solutions', unit: 'Supratik Exotica / A-1201', score: 78, factors: 'Payment delays (3x), No renewal intent', expiry: '45 days', rent: '₹4.2L', risk: 'HIGH' },
                  { tenant: 'Gourmet Delights', unit: 'Supratik Elegance / GF-02', score: 65, factors: 'Competitor inquiry, Footfall decline', expiry: '90 days', rent: '₹1.8L', risk: 'HIGH' },
                  { tenant: 'CloudNet IT', unit: 'Supratik Vista / B-801', score: 52, factors: 'Support tickets up 40%', expiry: '120 days', rent: '₹2.1L', risk: 'MED' },
                  { tenant: 'MegaCorp India', unit: 'Supratik Exotica / A-F08', score: 45, factors: 'Team downsizing rumors', expiry: '180 days', rent: '₹5.8L', risk: 'MED' },
                  { tenant: 'Sharma Trading', unit: 'Supratik Lifestyle / S-03', score: 38, factors: 'Late payment (1x)', expiry: '240 days', rent: '₹85K', risk: 'MED' },
                ].map((t, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{t.tenant}</td>
                    <td className="text-sm">{t.unit}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                          <div className="h-full rounded-full" style={{ width: `${t.score}%`, background: t.score >= 60 ? '#EF4444' : t.score >= 40 ? '#F59E0B' : '#10B981' }} />
                        </div>
                        <span className="font-bold" style={{ color: t.score >= 60 ? '#EF4444' : t.score >= 40 ? '#F59E0B' : '#10B981' }}>{t.score}%</span>
                      </div>
                    </td>
                    <td className="text-xs max-w-[200px]" style={{ color: 'var(--text2)' }}>{t.factors}</td>
                    <td style={{ color: parseInt(t.expiry) <= 60 ? '#EF4444' : 'var(--text)' }}>{t.expiry}</td>
                    <td className="font-semibold">{t.rent}</td>
                    <td>
                      <button className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(8,145,178,0.15)', color: 'var(--primary)' }} onClick={() => toast.success(`Retention plan generated for ${t.tenant}`)}>
                        Generate Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    ),
  },
  'assets': {
    title: 'Asset Lifecycle AI',
    subtitle: 'Depreciation tracking, replacement planning & CAPEX optimization',
    icon: <Package size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="📦" value="148" label="Total Assets" change="Across 4 properties" color="accent" />
          <KpiCard icon="⚠️" value="8" label="Replacement Due" change="Within 6 months" changeUp={false} color="red" />
          <KpiCard icon="🔧" value="12" label="Warranty Expiring" change="Within 90 days" color="yellow" />
          <KpiCard icon="💰" value="₹1.2 Cr" label="Book Value" change="Current depreciated" color="green" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Assets Requiring Attention</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Property</th>
                  <th>Age</th>
                  <th>Condition</th>
                  <th>Remaining Life</th>
                  <th>Replacement Cost</th>
                  <th>AI Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { asset: 'Chiller Unit 200TR', prop: 'Supratik Elegance', age: '5 years', cond: 'Poor', life: '6 months', cost: '₹45L', rec: 'Replace in Q2 FY27' },
                  { asset: 'DG Set 500KVA', prop: 'Supratik Exotica', age: '4 years', cond: 'Fair', life: '18 months', cost: '₹25L', rec: 'Major overhaul recommended' },
                  { asset: 'Elevator Motors (4x)', prop: 'Supratik Exotica', age: '6 years', cond: 'Fair', life: '12 months', cost: '₹32L', rec: 'Preventive replacement advised' },
                  { asset: 'Fire Pump System', prop: 'Supratik Lifestyle', age: '7 years', cond: 'Poor', life: '3 months', cost: '₹8L', rec: 'Urgent replacement needed' },
                  { asset: 'CCTV System', prop: 'Supratik Vista', age: '3 years', cond: 'Good', life: '36 months', cost: '₹12L', rec: 'Upgrade to 4K recommended' },
                ].map((a, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{a.asset}</td>
                    <td>{a.prop}</td>
                    <td>{a.age}</td>
                    <td><Badge variant={a.cond === 'Poor' ? 'expired' : a.cond === 'Fair' ? 'pending' : 'active'}>{a.cond}</Badge></td>
                    <td style={{ color: parseInt(a.life) <= 6 ? '#EF4444' : 'var(--text)' }}>{a.life}</td>
                    <td className="font-semibold">{a.cost}</td>
                    <td className="text-sm" style={{ color: 'var(--primary)' }}>{a.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    ),
  },
  'maintenance': {
    title: 'Predictive Maintenance AI',
    subtitle: 'IoT-powered failure prediction for HVAC, elevators & electrical systems',
    icon: <Wrench size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="🔧" value="3" label="Predicted Failures" change="Next 30 days" changeUp={false} color="red" />
          <KpiCard icon="✅" value="94%" label="Uptime Score" change="Last 90 days" changeUp={true} color="green" />
          <KpiCard icon="💰" value="₹8.2L" label="Saved This Year" change="Prevented breakdowns" color="yellow" />
          <KpiCard icon="📡" value="156" label="IoT Sensors Active" change="Real-time monitoring" color="accent" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Predicted Maintenance Alerts</h3>
          <div className="space-y-3">
            {[
              { equip: 'HVAC Compressor - Block B', days: 12, prob: 87, issue: 'Efficiency drop 23%, refrigerant leak suspected', action: 'Schedule inspection', priority: 'HIGH' },
              { equip: 'Elevator Motor - Tower A (Lift 2)', days: 28, prob: 72, issue: 'Vibration anomaly detected, bearing wear', action: 'Preventive replacement', priority: 'MED' },
              { equip: 'UPS Battery Bank - Server Room', days: 45, prob: 65, issue: 'Capacity degradation to 68%', action: 'Battery replacement', priority: 'MED' },
              { equip: 'Water Pump - Borewell 2', days: 60, prob: 58, issue: 'Motor current fluctuation', action: 'Inspect windings', priority: 'LOW' },
            ].map((a, i) => (
              <div key={i} className="p-4 rounded-xl border-l-4 flex items-center justify-between" style={{ background: 'var(--surface2)', borderColor: a.priority === 'HIGH' ? '#EF4444' : a.priority === 'MED' ? '#F59E0B' : '#10B981' }}>
                <div>
                  <div className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{a.equip}</div>
                  <div className="text-sm" style={{ color: 'var(--text2)' }}>{a.issue}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: a.priority === 'HIGH' ? '#EF4444' : a.priority === 'MED' ? '#F59E0B' : '#10B981' }}>
                    {a.days} days | {a.prob}% probability
                  </div>
                  <button className="text-xs px-3 py-1 rounded-lg mt-2" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => toast.success(`Maintenance scheduled: ${a.equip}`)}>
                    {a.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    ),
  },
  'contracts': {
    title: 'Contract Intelligence Engine',
    subtitle: 'NLP-powered contract analysis, clause extraction & risk flagging',
    icon: <FileText size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="📄" value="52" label="Contracts Analyzed" change="This quarter" color="accent" />
          <KpiCard icon="⚠️" value="8" label="Risk Flags" change="Needs review" changeUp={false} color="red" />
          <KpiCard icon="✅" value="38" label="Compliant" change="No issues" changeUp={true} color="green" />
          <KpiCard icon="⏳" value="6" label="Pending Review" change="In queue" color="yellow" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Recent Contract Analysis</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Tenant</th>
                  <th>Key Clauses Extracted</th>
                  <th>Risk Flags</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { contract: 'LSE-2025-0284', tenant: 'TechCorp India', clauses: 'Rent: ₹4.2L/mo, Escalation: 8% p.a., Lock-in: 3 years', flags: '⚠️ Force majeure missing', status: 'Needs Review' },
                  { contract: 'LSE-2025-0283', tenant: 'Infosys BPO', clauses: 'Rent: ₹5.8L/mo, Escalation: 5% p.a., Break: Year 2', flags: '✅ No issues', status: 'Approved' },
                  { contract: 'VND-2025-0156', tenant: 'Elevator Maintenance Co', clauses: 'AMC: ₹2.4L/yr, SLA: 4hr response', flags: '⚠️ Penalty clause weak', status: 'Needs Review' },
                  { contract: 'LSE-2025-0282', tenant: 'WeWork India', clauses: 'Rent: ₹8.9L/mo, Escalation: 10% p.a., Security: 6 months', flags: '✅ No issues', status: 'Approved' },
                ].map((c, i) => (
                  <tr key={i}>
                    <td className="font-mono text-sm" style={{ color: 'var(--primary)' }}>{c.contract}</td>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{c.tenant}</td>
                    <td className="text-sm max-w-[250px]" style={{ color: 'var(--text2)' }}>{c.clauses}</td>
                    <td>{c.flags}</td>
                    <td><Badge variant={c.status === 'Approved' ? 'active' : 'pending'}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    ),
  },
  'compliance': {
    title: 'Auto-GST & Compliance AI',
    subtitle: 'Automated tax filing, TDS tracking & regulatory compliance',
    icon: <Receipt size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="✅" value="12/12" label="GST Returns Filed" change="FY26 on track" changeUp={true} color="green" />
          <KpiCard icon="⏳" value="1" label="Pending Filing" change="TDS Q3" color="yellow" />
          <KpiCard icon="📋" value="100%" label="RERA Compliance" change="All properties" changeUp={true} color="accent" />
          <KpiCard icon="💰" value="₹0" label="Penalties" change="This year" changeUp={true} color="green" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Compliance Calendar</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Compliance Item</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'GSTR-1 (December)', due: 'Jan 11, 2026', status: 'Pending', amount: '₹2.4L', action: 'Auto-file' },
                  { item: 'GSTR-3B (December)', due: 'Jan 20, 2026', status: 'Pending', amount: '₹1.8L', action: 'Auto-file' },
                  { item: 'TDS Q3 FY26', due: 'Dec 31, 2025', status: 'In Progress', amount: '₹3.2L', action: 'Review & File' },
                  { item: 'Property Tax FY27', due: 'Apr 15, 2026', status: 'Upcoming', amount: '₹8.5L', action: 'Set Reminder' },
                  { item: 'RERA Annual Update', due: 'Mar 31, 2026', status: 'Upcoming', amount: '-', action: 'Prepare Docs' },
                  { item: 'Fire NOC Renewal', due: 'Jun 30, 2026', status: 'Upcoming', amount: '₹25K', action: 'Set Reminder' },
                ].map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{c.item}</td>
                    <td>{c.due}</td>
                    <td><Badge variant={c.status === 'Pending' ? 'pending' : c.status === 'In Progress' ? 'blue' : 'gray'}>{c.status}</Badge></td>
                    <td className="font-semibold">{c.amount}</td>
                    <td>
                      <button className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(8,145,178,0.15)', color: 'var(--primary)' }} onClick={() => toast.success(`Action initiated: ${c.item}`)}>
                        {c.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    ),
  },
  'valuation': {
    title: 'AI Property Valuation',
    subtitle: 'Real-time valuations using comparable sales & market intelligence',
    icon: <Home size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="🏢" value="₹285 Cr" label="Total Portfolio Value" change="↑ 9% YoY" changeUp={true} color="green" />
          <KpiCard icon="📈" value="+₹23 Cr" label="Value Appreciation" change="This fiscal year" color="accent" />
          <KpiCard icon="💰" value="6.8%" label="Avg. Cap Rate" change="Market: 7.2%" color="yellow" />
          <KpiCard icon="📊" value="4" label="Properties Valued" change="Active portfolio" color="purple" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Property Valuations</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Area (sqft)</th>
                  <th>Current Value</th>
                  <th>Per Sqft</th>
                  <th>YoY Change</th>
                  <th>Market Comparison</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { prop: 'Supratik Exotica', type: 'Mixed-Use', area: '2,50,000', value: '₹142 Cr', psf: '₹5,680', yoy: '+12%', comp: 'Above Market (+8%)' },
                  { prop: 'Supratik Elegance', type: 'Commercial', area: '1,80,000', value: '₹98 Cr', psf: '₹5,444', yoy: '+8%', comp: 'At Market' },
                  { prop: 'Supratik Lifestyle', type: 'Residential', area: '75,000', value: '₹45 Cr', psf: '₹6,000', yoy: '+4%', comp: 'Below Market (-3%)' },
                  { prop: 'Supratik Vista', type: 'IT Park', area: '45,000', value: '₹32 Cr', psf: '₹7,111', yoy: '+15%', comp: 'Above Market (+12%)' },
                ].map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{p.prop}</td>
                    <td>{p.type}</td>
                    <td>{p.area}</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{p.value}</td>
                    <td>{p.psf}</td>
                    <td className="font-semibold text-green-600">{p.yoy}</td>
                    <td><Badge variant={p.comp.includes('Above') ? 'active' : p.comp.includes('Below') ? 'pending' : 'gray'}>{p.comp}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    ),
  },
  'sentiment': {
    title: 'Tenant Sentiment AI',
    subtitle: 'Real-time satisfaction scoring from service requests & communications',
    icon: <Activity size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="😊" value="87/100" label="Overall Sentiment" change="↑ 5 pts this month" changeUp={true} color="green" />
          <KpiCard icon="⚡" value="4.2 hrs" label="Avg. Response Time" change="Target: 4 hrs" color="accent" />
          <KpiCard icon="📞" value="156" label="Service Requests" change="This month" color="yellow" />
          <KpiCard icon="⭐" value="4.3/5" label="Tenant Rating" change="Based on surveys" color="purple" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Sentiment by Property</h3>
          <div className="space-y-4">
            {[
              { prop: 'Supratik Exotica', score: 92, trend: '+3', issues: 'Minor: Parking congestion reported' },
              { prop: 'Supratik Elegance', score: 85, trend: '+1', issues: 'Moderate: Elevator wait times' },
              { prop: 'Supratik Lifestyle', score: 88, trend: '+7', issues: 'Resolved: Landscaping improved' },
              { prop: 'Supratik Vista', score: 78, trend: '-2', issues: 'Active: AC complaints in south wing' },
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface2)' }}>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>{p.prop}</div>
                  <div className="text-sm" style={{ color: 'var(--text2)' }}>{p.issues}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: p.score >= 85 ? '#10B981' : p.score >= 70 ? '#F59E0B' : '#EF4444' }} />
                  </div>
                  <span className="font-bold text-lg" style={{ color: p.score >= 85 ? '#10B981' : p.score >= 70 ? '#F59E0B' : '#EF4444' }}>{p.score}</span>
                  <span className="text-sm font-semibold" style={{ color: p.trend.includes('+') ? '#10B981' : '#EF4444' }}>{p.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    ),
  },
  'energy': {
    title: 'Energy Optimization AI',
    subtitle: 'Smart building automation for energy efficiency & carbon reduction',
    icon: <Lightbulb size={24} />,
    content: (
      <div className="space-y-6">
        <Grid cols={4}>
          <KpiCard icon="⚡" value="18%" label="Energy Saved" change="vs. baseline" changeUp={true} color="green" />
          <KpiCard icon="💰" value="₹3.2L" label="Monthly Savings" change="Automated optimization" color="accent" />
          <KpiCard icon="🌱" value="42 tons" label="CO2 Reduced" change="This quarter" changeUp={true} color="green" />
          <KpiCard icon="☀️" value="3.2 yrs" label="Solar ROI" change="Payback period" color="yellow" />
        </Grid>
        
        <Card>
          <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Energy Optimization Actions</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Optimization</th>
                  <th>Property</th>
                  <th>Monthly Savings</th>
                  <th>Status</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { opt: 'HVAC Smart Scheduling', prop: 'Supratik Exotica', savings: '₹1.2L', status: 'Active', impact: '15% energy reduction' },
                  { opt: 'LED Retrofit + Motion Sensors', prop: 'Supratik Elegance', savings: '₹85K', status: 'Active', impact: '40% lighting savings' },
                  { opt: 'Peak Load Shifting', prop: 'All Properties', savings: '₹65K', status: 'Active', impact: '₹8/kWh saved on ToD' },
                  { opt: 'Solar Rooftop (200kW)', prop: 'Supratik Exotica', savings: '₹1.8L', status: 'Active', impact: '30% grid dependency down' },
                  { opt: 'Elevator Regenerative Drives', prop: 'Supratik Vista', savings: '₹25K', status: 'Planned', impact: '20% elevator energy' },
                ].map((e, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{e.opt}</td>
                    <td>{e.prop}</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{e.savings}</td>
                    <td><Badge variant={e.status === 'Active' ? 'active' : 'pending'}>{e.status}</Badge></td>
                    <td className="text-sm" style={{ color: 'var(--text2)' }}>{e.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    ),
  },
};

export default function AIReportPage() {
  const params = useParams();
  const router = useRouter();
  const module = params.module as string;
  
  const report = AI_REPORTS[module];
  
  if (!report) {
    return (
      <div className="animate-fade-in">
        <Card className="text-center py-12">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Report Not Found</h2>
          <p style={{ color: 'var(--text3)' }}>The requested AI report does not exist.</p>
          <Button variant="primary" className="mt-4" onClick={() => router.push('/dashboard/ai')}>
            Back to AI Command Centre
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={report.title}
        subtitle={report.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/ai')}>
              <ArrowLeft size={14} /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success('Refreshing AI analysis...')}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast.success('Exporting report as PDF...')}>
              <Download size={14} /> Export PDF
            </Button>
          </div>
        }
      />
      
      <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(217,119,6,0.1))', border: '1px solid rgba(8,145,178,0.2)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          {report.icon}
        </div>
        <div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>AI-Generated Report</span>
          <span className="text-xs block" style={{ color: 'var(--text3)' }}>Last updated: {new Date().toLocaleString('en-IN')}</span>
        </div>
        <span className="ml-auto text-[9px] font-bold px-2 py-1 rounded text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>POWERED BY AI</span>
      </div>

      {report.content}
    </div>
  );
}
