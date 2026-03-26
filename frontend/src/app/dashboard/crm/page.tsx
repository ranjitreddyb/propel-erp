'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '@/services/api';
import { Card, PageHeader, Button, Badge, Grid, KpiCard, Loading, EmptyState } from '@/components/ui';
import { Plus, Search, Filter, Phone, Mail, Building2, Calendar, TrendingUp, Users, Target, Award } from 'lucide-react';
import toast from 'react-hot-toast';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  property_interest: string;
  budget: string;
  assigned_to: string;
  created_at: string;
  last_contact: string;
  score: number;
};

type Contact = {
  id: string;
  org_name: string;
  contact_name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  total_value: number;
  properties: number;
};

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const STAGE_COLORS: Record<string, string> = {
  New: 'blue',
  Contacted: 'purple',
  Qualified: 'active',
  Proposal: 'pending',
  Negotiation: 'pending',
  Won: 'active',
  Lost: 'expired',
};

// Demo data for display
const DEMO_LEADS: Lead[] = [
  { id: '1', name: 'Suresh Mehta', email: 'suresh.mehta@techcorp.in', phone: '9876543210', source: 'Website', stage: 'Qualified', property_interest: 'Tower A - Commercial', budget: '₹2.5 Cr', assigned_to: 'Priya R.', created_at: '2026-03-01', last_contact: '2026-03-15', score: 85 },
  { id: '2', name: 'Anjali Sharma', email: 'anjali@startupx.io', phone: '9123456780', source: 'Referral', stage: 'Proposal', property_interest: 'Block C - Retail', budget: '₹75 L', assigned_to: 'Arjun S.', created_at: '2026-02-20', last_contact: '2026-03-14', score: 72 },
  { id: '3', name: 'Rajiv Industries', email: 'procurement@rajiv.com', phone: '9988776655', source: 'Exhibition', stage: 'New', property_interest: 'Industrial Zone', budget: '₹8 Cr', assigned_to: 'Kiran P.', created_at: '2026-03-12', last_contact: '-', score: 45 },
  { id: '4', name: 'Meera Hospitality', email: 'expansion@meerahotels.com', phone: '9654321098', source: 'Cold Call', stage: 'Negotiation', property_interest: 'Tower B - Floors 18-22', budget: '₹15 Cr', assigned_to: 'Priya R.', created_at: '2026-01-15', last_contact: '2026-03-16', score: 91 },
  { id: '5', name: 'CloudTech Solutions', email: 'realestate@cloudtech.in', phone: '9876123450', source: 'LinkedIn', stage: 'Contacted', property_interest: 'Tower A - Office', budget: '₹1.2 Cr', assigned_to: 'Arjun S.', created_at: '2026-03-10', last_contact: '2026-03-13', score: 58 },
];

const DEMO_CONTACTS: Contact[] = [
  { id: '1', org_name: 'TechStar Pvt Ltd', contact_name: 'Vikram Singh', email: 'vikram@techstar.in', phone: '9876543210', type: 'Tenant', status: 'active', total_value: 4800000, properties: 2 },
  { id: '2', org_name: 'Gourmet Co', contact_name: 'Sneha Patel', email: 'sneha@gourmetco.in', phone: '9123456789', type: 'Tenant', status: 'active', total_value: 1200000, properties: 1 },
  { id: '3', org_name: 'MegaCorp India', contact_name: 'Rahul Kumar', email: 'rahul.k@megacorp.com', phone: '9988112233', type: 'Tenant', status: 'active', total_value: 12500000, properties: 4 },
  { id: '4', org_name: 'Urban Developers', contact_name: 'Amit Joshi', email: 'amit@urbandev.in', phone: '9876001234', type: 'Vendor', status: 'active', total_value: 850000, properties: 0 },
];

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<'leads' | 'contacts'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => crmApi.getLeads({ pageSize: 50 }),
    staleTime: 30000,
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => crmApi.getContacts({ pageSize: 50 }),
    staleTime: 30000,
  });

  const leads = leadsData?.data || DEMO_LEADS;
  const contacts = contactsData?.data || DEMO_CONTACTS;

  // Filter leads
  const filteredLeads = leads.filter((lead: Lead) => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.property_interest.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Filter contacts
  const filteredContacts = contacts.filter((contact: Contact) => {
    return !searchQuery || 
      contact.org_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleStageChange = (leadId: string, newStage: string) => {
    toast.success(`Lead moved to ${newStage}`);
    // In real app: crmApi.updateStage(leadId, newStage);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CRM & Sales Pipeline"
        subtitle="Lead management, contact database & deal tracking"
        actions={
          <Button variant="primary" size="sm" onClick={() => toast('Opening new lead form…')}>
            <Plus size={14} /> Add Lead
          </Button>
        }
      />

      {/* KPIs */}
      <Grid cols={4} className="mb-5">
        <KpiCard icon="🎯" value="47" label="Active Leads" change="12 this week" changeUp color="accent" />
        <KpiCard icon="💰" value="₹28.5Cr" label="Pipeline Value" change="↑ 18% MoM" changeUp color="green" />
        <KpiCard icon="🏆" value="68%" label="Win Rate" color="yellow" />
        <KpiCard icon="👥" value="156" label="Total Contacts" color="purple" />
      </Grid>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5" style={{ borderColor: 'var(--border)' }}>
        {['leads', 'contacts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'leads' | 'contacts')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all capitalize ${
              activeTab === tab
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--text3)] border-transparent hover:text-[var(--text2)]'
            }`}
            data-testid={`crm-tab-${tab}`}
          >
            {tab === 'leads' ? '🎯 Sales Leads' : '👥 Contacts'}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[250px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder={activeTab === 'leads' ? 'Search leads by name, email, property…' : 'Search contacts…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
            data-testid="crm-search-input"
          />
        </div>
        {activeTab === 'leads' && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="form-input w-auto"
            data-testid="crm-stage-filter"
          >
            <option value="all">All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        )}
        <Button variant="outline" size="sm" onClick={() => toast('Filter panel opening…')}>
          <Filter size={14} /> More Filters
        </Button>
      </div>

      {/* Content */}
      <Card>
        {activeTab === 'leads' ? (
          leadsLoading ? (
            <Loading />
          ) : filteredLeads.length === 0 ? (
            <EmptyState icon="🎯" title="No leads found" message="Try adjusting your search or filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Property Interest</th>
                    <th>Budget</th>
                    <th>Stage</th>
                    <th>Score</th>
                    <th>Assigned</th>
                    <th>Last Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: Lead) => (
                    <tr key={lead.id} className="cursor-pointer hover:bg-white/[0.02]">
                      <td>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text)' }}>{lead.name}</div>
                          <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: 'var(--text3)' }}>
                            <Mail size={10} /> {lead.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} style={{ color: 'var(--accent)' }} />
                          {lead.property_interest}
                        </div>
                      </td>
                      <td className="font-semibold" style={{ color: 'var(--accent3)' }}>{lead.budget}</td>
                      <td>
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border-0 cursor-pointer"
                          style={{
                            background: 'var(--surface2)',
                            color: 'var(--text)',
                          }}
                          data-testid={`lead-stage-${lead.id}`}
                        >
                          {STAGES.map((stage) => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-2 rounded-full overflow-hidden"
                            style={{ background: 'var(--surface3)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${lead.score}%`,
                                background: lead.score >= 70 ? 'var(--accent3)' : lead.score >= 50 ? 'var(--accent4)' : 'var(--accent5)',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">{lead.score}</span>
                        </div>
                      </td>
                      <td className="text-sm">{lead.assigned_to}</td>
                      <td className="text-xs" style={{ color: 'var(--text3)' }}>{lead.last_contact}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toast(`Calling ${lead.phone}…`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition"
                            title="Call"
                          >
                            <Phone size={14} style={{ color: 'var(--accent3)' }} />
                          </button>
                          <button
                            onClick={() => toast(`Emailing ${lead.email}…`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition"
                            title="Email"
                          >
                            <Mail size={14} style={{ color: 'var(--accent)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          contactsLoading ? (
            <Loading />
          ) : filteredContacts.length === 0 ? (
            <EmptyState icon="👥" title="No contacts found" message="Try adjusting your search" />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Contact Person</th>
                    <th>Type</th>
                    <th>Properties</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact: Contact) => (
                    <tr key={contact.id} className="cursor-pointer hover:bg-white/[0.02]">
                      <td>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{contact.org_name}</div>
                      </td>
                      <td>
                        <div>
                          <div className="text-sm">{contact.contact_name}</div>
                          <div className="text-xs" style={{ color: 'var(--text3)' }}>{contact.email}</div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={contact.type === 'Tenant' ? 'blue' : 'purple'}>{contact.type}</Badge>
                      </td>
                      <td className="text-center">{contact.properties}</td>
                      <td className="font-semibold" style={{ color: 'var(--accent3)' }}>
                        ₹{(contact.total_value / 100000).toFixed(1)}L
                      </td>
                      <td>
                        <Badge variant={contact.status === 'active' ? 'active' : 'expired'}>{contact.status}</Badge>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toast(`Calling ${contact.phone}…`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition"
                          >
                            <Phone size={14} style={{ color: 'var(--accent3)' }} />
                          </button>
                          <button
                            onClick={() => toast(`Emailing ${contact.email}…`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition"
                          >
                            <Mail size={14} style={{ color: 'var(--accent)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>
    </div>
  );
}
