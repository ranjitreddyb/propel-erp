'use client';

import { useState, useEffect } from 'react';
import { Card, PageHeader, Button } from '@/components/ui';
import { Settings, Building2, Palette, Bell, Shield, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';

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
    
    // Update company in localStorage
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
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Branding</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Customize your application name and branding</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
                Application Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Enter application name"
                className="form-input"
                data-testid="app-name-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                This name appears in the header, login page, and browser title
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="form-input"
                data-testid="company-name-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                Displayed in the company selector and reports
              </p>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(207,161,90,0.1)' }}
            >
              <Bell size={20} style={{ color: '#CFA15A' }} />
            </div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Notifications</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Configure alert preferences</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Email notifications', desc: 'Receive alerts via email' },
              { label: 'Push notifications', desc: 'Browser push notifications' },
              { label: 'SMS alerts', desc: 'Critical alerts via SMS' },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--surface2)]">
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{item.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text3)' }}>{item.desc}</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded" style={{ accentColor: '#203A2B' }} />
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
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Security</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Account security settings</p>
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
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all"
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
