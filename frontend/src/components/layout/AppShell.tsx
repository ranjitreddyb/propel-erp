'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard, Building2, FileText, DollarSign, Wrench,
  Users, Brain, Settings, Bell, Search, LogOut,
  ChevronRight, Workflow, FileBarChart2, FolderOpen, UserCog,
  Tag, ShoppingCart, Building, Menu, X, Camera,
} from 'lucide-react';
import { clsx } from 'clsx';
import { SahayakChatbot } from './SahayakChatbot';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',         href: '/dashboard',               icon: LayoutDashboard },
      { label: 'Notifications',     href: '/dashboard/notifications',  icon: Bell, badge: 'unread' },
    ],
  },
  {
    label: 'Property',
    items: [
      { label: 'Portfolio',         href: '/dashboard/properties',     icon: Building2 },
      { label: 'CRM',               href: '/dashboard/crm',            icon: Users },
      { label: 'Leasing',           href: '/dashboard/leasing',        icon: FileText },
      { label: 'Sales',             href: '/dashboard/sales',          icon: Tag },
      { label: 'Maintenance',       href: '/dashboard/maintenance',    icon: Wrench, badge: 5 },
      { label: 'Facility',          href: '/dashboard/facility',       icon: Building },
      { label: 'CCTV & Security',   href: '/dashboard/security',       icon: Camera },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Accounting',        href: '/dashboard/finance',        icon: DollarSign },
      { label: 'Procurement',       href: '/dashboard/procurement',    icon: ShoppingCart },
    ],
  },
  {
    label: 'HR & People',
    items: [
      { label: 'HR Management',     href: '/dashboard/hr',             icon: Users },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { label: 'AI Command Centre', href: '/dashboard/ai',             icon: Brain, isAI: true },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Workflow Designer', href: '/dashboard/workflow',       icon: Workflow },
      { label: 'Report Builder',    href: '/dashboard/reports',        icon: FileBarChart2 },
      { label: 'Documents',         href: '/dashboard/documents',      icon: FolderOpen },
      { label: 'User Management',   href: '/dashboard/users',          icon: UserCog },
    ],
  },
];

type User = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type Company = {
  id: string;
  name: string;
  code: string;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentCompany, unreadCount, sidebarCollapsed, toggleSidebar, setCurrentCompany, setUser } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setLocalUser] = useState<User | null>(null);
  const [company, setLocalCompany] = useState<Company | null>(null);
  const [appName, setAppName] = useState('Supratik');

  useEffect(() => {
    const storedUser = localStorage.getItem('propel_user');
    const storedCompany = localStorage.getItem('propel_company');
    const storedAppName = localStorage.getItem('app_name');
    
    if (storedAppName) setAppName(storedAppName);
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setLocalUser(userData);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    
    if (storedCompany) {
      try {
        const companyData = JSON.parse(storedCompany);
        setLocalCompany(companyData);
        setCurrentCompany(companyData);
      } catch (e) {
        console.error('Failed to parse company data');
      }
    }
  }, [setUser, setCurrentCompany]);

  const handleLogout = () => {
    localStorage.removeItem('propel_token');
    localStorage.removeItem('propel_user');
    localStorage.removeItem('propel_company');
    localStorage.removeItem('propel_companies');
    useAppStore.getState().logout();
    router.push('/auth/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const displayName = user?.firstName || 'User';
  const displayCompany = company || currentCompany;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ─── TOP HEADER ──────────────────────────────────── */}
      <header
        className="flex items-center gap-4 px-6 flex-shrink-0 border-b backdrop-blur-xl"
        style={{ 
          height: 'var(--header-h)', 
          background: 'rgba(255,255,255,0.9)', 
          borderColor: 'var(--border)',
        }}
      >
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface2)]"
          style={{ color: 'var(--text2)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #203A2B, #2A4C38)' }}
          >
            <Building2 size={22} className="text-white" />
          </div>
          <span 
            className="text-xl font-semibold tracking-tight hidden sm:block"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}
          >
            {appName}
          </span>
        </div>

        {/* Company Switcher */}
        <button
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:border-[var(--secondary)]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text2)' }}
          data-testid="company-switcher"
        >
          <Building2 size={16} style={{ color: 'var(--secondary)' }} />
          <span className="max-w-[200px] truncate font-medium" style={{ color: 'var(--text)' }}>
            {displayCompany?.name || 'Select Company'}
          </span>
          <ChevronRight size={14} />
        </button>

        {/* Search */}
        <div
          className="flex items-center gap-3 flex-1 max-w-lg px-4 py-2.5 rounded-xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Search size={18} style={{ color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Search properties, tenants, transactions…"
            className="bg-transparent border-none outline-none text-sm flex-1"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}
            data-testid="global-search"
          />
          <kbd className="hidden sm:block text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>⌘K</kbd>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard/notifications">
            <button
              className="relative w-10 h-10 rounded-xl flex items-center justify-center border transition-colors hover:border-[var(--secondary)]"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              data-testid="notifications-btn"
            >
              <Bell size={18} style={{ color: 'var(--text2)' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'var(--accent5)' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </Link>

          <Link href="/dashboard/users/settings">
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors hover:border-[var(--secondary)]"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              data-testid="settings-btn"
            >
              <Settings size={18} style={{ color: 'var(--text2)' }} />
            </button>
          </Link>

          <div className="flex items-center gap-3 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))' }}
              title={displayName}
              data-testid="user-avatar"
            >
              {initials}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors hover:border-[var(--accent5)] hover:text-[var(--accent5)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
              data-testid="logout-btn"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── SIDEBAR ─────────────────────────────────────── */}
        <aside
          className={clsx(
            'flex-shrink-0 flex flex-col overflow-y-auto border-r transition-all duration-200 pb-6',
            'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarCollapsed ? 'w-16' : 'w-[var(--sidebar-w)]'
          )}
          style={{
            background: 'var(--bg)',
            borderColor: 'var(--border)',
            top: 'var(--header-h)',
          }}
        >
          {/* Collapse toggle */}
          <button
            className="hidden lg:flex items-center justify-end p-4 hover:bg-[var(--surface2)]"
            style={{ color: 'var(--text3)' }}
            onClick={toggleSidebar}
            data-testid="sidebar-toggle"
          >
            <ChevronRight
              size={16}
              className={clsx('transition-transform', sidebarCollapsed ? '' : 'rotate-180')}
            />
          </button>

          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="px-3 mb-3">
              {!sidebarCollapsed && (
                <div 
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] px-3 mb-2 pt-4"
                  style={{ color: 'var(--text3)' }}
                >
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium mb-1',
                        isActive
                          ? 'text-[var(--primary)] bg-[rgba(32,58,43,0.08)]'
                          : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
                      )}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {(item as { badge?: number | string }).badge === 'unread' && unreadCount > 0 && (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ background: 'var(--accent5)' }}
                            >
                              {unreadCount}
                            </span>
                          )}
                          {typeof (item as { badge?: number | string }).badge === 'number' && (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ background: 'var(--secondary)' }}
                            >
                              {(item as { badge?: number | string }).badge as number}
                            </span>
                          )}
                          {(item as { isAI?: boolean }).isAI && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent3))' }}
                            >
                              AI
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ─── MAIN CONTENT ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
          {children}
        </main>
      </div>

      {/* ─── SAHAYAK FLOATING CHATBOT ────────────────────── */}
      <SahayakChatbot />
    </div>
  );
}
