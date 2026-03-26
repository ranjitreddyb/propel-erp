'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard, Building2, FileText, DollarSign, Wrench,
  Users, Brain, Settings, Bell, Search, LogOut,
  ChevronRight, Workflow, FileBarChart2, FolderOpen, UserCog,
  Tag, ShoppingCart, Building, Menu, X,
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

  // Load user and company from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('propel_user');
    const storedCompany = localStorage.getItem('propel_company');
    
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
    // Clear localStorage
    localStorage.removeItem('propel_token');
    localStorage.removeItem('propel_user');
    localStorage.removeItem('propel_company');
    localStorage.removeItem('propel_companies');
    
    // Clear Zustand store
    useAppStore.getState().logout();
    
    // Redirect to login
    router.push('/auth/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';

  const displayName = user?.firstName || 'User';
  const displayCompany = company || currentCompany;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ─── TOP HEADER ──────────────────────────────────── */}
      <header
        className="flex items-center gap-4 px-4 flex-shrink-0 border-b"
        style={{ height: 'var(--header-h)', background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg text-[var(--text2)] hover:bg-[var(--surface2)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}
          >
            <Building2 size={18} />
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:block">PropelERP</span>
        </div>

        {/* Company Switcher */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text2)] border hidden md:flex"
          style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
          data-testid="company-switcher"
        >
          <Building2 size={14} />
          <span className="max-w-[180px] truncate">{displayCompany?.name || 'Select Company'}</span>
          <ChevronRight size={12} />
        </button>

        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 max-w-md px-3 py-2 rounded-lg border"
          style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
        >
          <Search size={14} className="text-[var(--text3)]" />
          <input
            type="text"
            placeholder="Search properties, tenants, transactions… (⌘K)"
            className="bg-transparent border-none outline-none text-sm flex-1 text-[var(--text)] placeholder-[var(--text3)]"
            data-testid="global-search"
          />
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard/notifications">
            <button
              className="relative w-9 h-9 rounded-lg flex items-center justify-center border hover:bg-[var(--surface3)] transition-colors"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
              data-testid="notifications-btn"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
                  style={{ background: 'var(--accent5)', borderColor: 'var(--surface)' }}
                />
              )}
            </button>
          </Link>

          <Link href="/dashboard/users/settings">
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center border hover:bg-[var(--surface3)] transition-colors"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
              data-testid="settings-btn"
            >
              <Settings size={16} />
            </button>
          </Link>

          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}
            title={displayName}
            data-testid="user-avatar"
          >
            {initials}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs text-[var(--text2)] hover:text-[var(--text)] transition-colors"
            style={{ borderColor: 'var(--border)' }}
            data-testid="logout-btn"
          >
            <LogOut size={13} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── SIDEBAR ─────────────────────────────────────── */}
        <aside
          className={clsx(
            'flex-shrink-0 flex flex-col overflow-y-auto border-r transition-all duration-200 pb-6',
            'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarCollapsed ? 'w-14' : 'w-[var(--sidebar-w)]'
          )}
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            top: 'var(--header-h)',
          }}
        >
          {/* Collapse toggle (desktop) */}
          <button
            className="hidden lg:flex items-center justify-end p-3 text-[var(--text3)] hover:text-[var(--text2)]"
            onClick={toggleSidebar}
            data-testid="sidebar-toggle"
          >
            <ChevronRight
              size={14}
              className={clsx('transition-transform', sidebarCollapsed ? '' : 'rotate-180')}
            />
          </button>

          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="px-3 mb-2">
              {!sidebarCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)] px-2 mb-1 pt-3">
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
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm font-medium mb-0.5',
                        isActive
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
                      )}
                      style={isActive ? {
                        background: 'linear-gradient(135deg,rgba(79,142,247,0.18),rgba(124,92,252,0.12))',
                        border: '1px solid rgba(79,142,247,0.2)',
                      } : {}}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {(item as { badge?: number | string }).badge === 'unread' && unreadCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent5)] text-white">
                              {unreadCount}
                            </span>
                          )}
                          {typeof (item as { badge?: number | string }).badge === 'number' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent5)] text-white">
                              {(item as { badge?: number | string }).badge as number}
                            </span>
                          )}
                          {(item as { isAI?: boolean }).isAI && (
                            <span
                              className="text-[9px] font-bold px-1 py-0.5 rounded text-white"
                              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}
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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ─── MAIN CONTENT ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
          {children}
        </main>
      </div>

      {/* ─── SAHAYAK FLOATING CHATBOT ────────────────────── */}
      <SahayakChatbot />
    </div>
  );
}
