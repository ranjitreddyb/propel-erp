'use client';

import { useState, useEffect } from 'react';
import { Card, PageHeader } from '@/components/ui';
import { Settings, Building2, Bell, Shield, Save, Check, Camera, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const THEME_OPTIONS = [
  { 
    id: 'teal-gold', 
    name: 'Teal + Gold', 
    colors: ['#0891B2', '#D97706'],
    description: 'Professional & Elegant'
  },
  { 
    id: 'pink-purple', 
    name: 'Pink + Purple', 
    colors: ['#DB2777', '#9333EA'],
    description: 'Glamorous & Bold'
  },
  { 
    id: 'orange-yellow', 
    name: 'Orange + Yellow', 
    colors: ['#EA580C', '#EAB308'],
    description: 'Energetic Sunset'
  },
  { 
    id: 'black-white', 
    name: 'Black + White', 
    colors: ['#18181B', '#71717A'],
    description: 'Classic Monochrome'
  },
  { 
    id: 'lemon-green', 
    name: 'Lemon + Green', 
    colors: ['#65A30D', '#FACC15'],
    description: 'Fresh Nature'
  },
  { 
    id: 'coral-teal', 
    name: 'Coral + Teal', 
    colors: ['#F97316', '#14B8A6'],
    description: 'Tropical Vibes'
  },
  { 
    id: 'blue-silver', 
    name: 'Blue + Silver', 
    colors: ['#2563EB', '#64748B'],
    description: 'Corporate Elegance'
  },
];

export default function SettingsPage() {
  const [appName, setAppName] = useState('Supratik');
  const [companyName, setCompanyName] = useState('Supratik Properties');
  const [selectedTheme, setSelectedTheme] = useState('teal-gold');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedAppName = localStorage.getItem('app_name');
    const storedCompany = localStorage.getItem('propel_company');
    const storedTheme = localStorage.getItem('app_theme');
    
    if (storedAppName) setAppName(storedAppName);
    if (storedTheme) setSelectedTheme(storedTheme);
    if (storedCompany) {
      try {
        const company = JSON.parse(storedCompany);
        if (company.name) setCompanyName(company.name);
      } catch {}
    }
  }, []);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('app_theme', themeId);
    toast.success(`Theme changed to ${THEME_OPTIONS.find(t => t.id === themeId)?.name}`);
  };

  const handleSave = () => {
    localStorage.setItem('app_name', appName);
    localStorage.setItem('app_theme', selectedTheme);
    document.documentElement.setAttribute('data-theme', selectedTheme);
    
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
        {/* Theme Selector Card */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <Palette size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Theme & Colors</h2>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Choose your preferred dual-tone color scheme</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] ${
                  selectedTheme === theme.id 
                    ? 'border-[var(--primary)] shadow-lg' 
                    : 'border-transparent hover:border-[var(--border2)]'
                }`}
                style={{ 
                  background: selectedTheme === theme.id ? 'var(--surface)' : 'var(--surface2)',
                  boxShadow: selectedTheme === theme.id ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
                }}
                data-testid={`theme-${theme.id}`}
              >
                {selectedTheme === theme.id && (
                  <div 
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div className="flex gap-1.5 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ background: theme.colors[0] }}
                  />
                  <div 
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ background: theme.colors[1] }}
                  />
                </div>
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{theme.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{theme.description}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Branding Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(8,145,178,0.1)' }}
            >
              <Building2 size={20} style={{ color: 'var(--primary)' }} />
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
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>Preview</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                >
                  <Building2 size={20} className="text-white" />
                </div>
                <span 
                  className="text-xl font-semibold"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary-dark)' }}
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
                style={{ background: 'rgba(217,119,6,0.1)' }}
              >
                <Camera size={20} style={{ color: 'var(--secondary)' }} />
              </div>
              <div>
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>CCTV & Security</h2>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>Configure surveillance cameras and AI detection settings</p>
              </div>
            </div>
            <Link href="/dashboard/security">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--secondary)', border: '1px solid rgba(217,119,6,0.2)' }}
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
              style={{ background: 'rgba(8,145,178,0.1)' }}
            >
              <Bell size={20} style={{ color: 'var(--primary)' }} />
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
                <input type="checkbox" defaultChecked={item.checked} className="w-5 h-5 rounded accent-[var(--primary)]" />
              </label>
            ))}
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <Shield size={20} style={{ color: 'var(--danger)' }} />
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
              <input type="checkbox" className="w-5 h-5 rounded accent-[var(--primary)]" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--surface2)]">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>Session timeout</div>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>Auto-logout after 30 minutes of inactivity</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[var(--primary)]" />
            </label>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:shadow-lg hover:scale-[1.02]"
            style={{ 
              background: saved ? 'var(--success)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              boxShadow: '0 4px 15px rgba(8,145,178,0.25)'
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
