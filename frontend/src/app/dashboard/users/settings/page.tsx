'use client';

import { useState, useEffect } from 'react';
import { Card, PageHeader } from '@/components/ui';
import { Settings, Building2, Bell, Shield, Save, Check, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SettingsPage() {
  const [appName, setAppName] = useState('Supratik');
  const [companyName, setCompanyName] = useState('Supratik Properties');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedAppName = localStorage.getItem('app_name');
    const storedCompany = localStorage.getItem('propel_company');
    
    if (storedAppName) setAppName(storedAppName);
    if (storedCompany) {
      try {
        const company = JSON.parse(storedCompany);
        if (company.name) setCompanyName(company.name);
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('app_name', appName);
    
    const storedCompany = localStorage.getItem('propel_company');
    if (storedCompany) {
      try {
        const company = JSON.parse(storedCompany);
        company.name = companyName;
        localStorage.setItem('propel_company', JSON.stringify(company));
      } catch {}
    }
    
    setSaved(true);
    toast.success('Settings saved! Refresh to see changes.');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Configure your application preferences"
      />

      <div className="space-y-6">
        {/* Branding Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(32,58,43,0.1)' }}
            >
              <Building2 size={20} style={{ color: '#203A2B' }} />
            </div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Branding & Identity</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Customize your application name and company branding</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
                Application Name <span className="text-xs font-normal" style={{ color: 'var(--text3)' }}>(appears in header & login)</span>
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g., Supratik, Prestige, DLF"
                className="form-input"
                data-testid="app-name-input"
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
                This is the main brand name shown in the top-left corner with the building icon
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
                Company Name <span className="text-xs font-normal" style={{ color: 'var(--text3)' }}>(shown in company selector)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Supratik Properties Pvt Ltd"
                className="form-input"
                data-testid="company-name-input"
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
                Full company name displayed in reports and the company dropdown
              </p>
            </div>

            <div
              className="p-4 rounded-xl border"
              style={{ background: 'rgba(32,58,43,0.03)', borderColor: 'rgba(32,58,43,0.1)' }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>Preview</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #203A2B, #2A4C38)' }}
                >
                  <Building2 size={20} className="text-white" />
                </div>
                <span 
                  className="text-xl font-semibold"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: '#203A2B' }}
                >
                  {appName || 'Your Brand'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* CCTV & Security Link */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(207,161,90,0.1)' }}
              >
                <Camera size={20} style={{ color: '#CFA15A' }} />
              </div>
              <div>
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>CCTV & Security</h2>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>Configure surveillance cameras and AI detection settings</p>
              </div>
            </div>
            <Link href="/dashboard/security">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(207,161,90,0.1)', color: '#CFA15A', border: '1px solid rgba(207,161,90,0.2)' }}
              >
                Configure →
              </button>
            </Link>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(54,104,75,0.1)' }}
            >
              <Bell size={20} style={{ color: '#36684B' }} />
            </div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Notifications</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Configure alert preferences</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Email notifications', desc: 'Receive alerts via email', checked: true },
              { label: 'Push notifications', desc: 'Browser push notifications', checked: true },
              { label: 'SMS alerts', desc: 'Critical alerts via SMS', checked: false },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--surface2)]">
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{item.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text3)' }}>{item.desc}</div>
                </div>
                <input type="checkbox" defaultChecked={item.checked} className="w-5 h-5 rounded" style={{ accentColor: '#203A2B' }} />
              </label>
            ))}
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(158,60,60,0.1)' }}
            >
              <Shield size={20} style={{ color: '#9E3C3C' }} />
            </div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Account Security</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Manage login and session settings</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--surface2)]">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>Two-factor authentication</div>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>Add extra security to your account</div>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#203A2B' }} />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--surface2)]">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>Session timeout</div>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>Auto-logout after 30 minutes of inactivity</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" style={{ accentColor: '#203A2B' }} />
            </label>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:shadow-lg"
            style={{ 
              background: saved ? '#36684B' : '#203A2B',
              boxShadow: '0 4px 12px rgba(32,58,43,0.2)'
            }}
            data-testid="save-settings-btn"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
