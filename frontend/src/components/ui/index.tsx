'use client';

import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

// ─── Card ─────────────────────────────────────────────────
export function Card({ children, className, hover = false }: {
  children: ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div className={clsx('card transition-all', hover && 'hover:border-[var(--border2)] hover:-translate-y-0.5 cursor-pointer', className)}>
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────
export function KpiCard({ icon, value, label, change, changeUp, color = 'accent' }: {
  icon?: string; value: string; label: string;
  change?: string; changeUp?: boolean; color?: string;
}) {
  const colorMap: Record<string, string> = {
    accent:  'rgba(8,145,178,.12)',
    green:   'rgba(16,185,129,.12)',
    yellow:  'rgba(217,119,6,.12)',
    red:     'rgba(239,68,68,.12)',
    purple:  'rgba(139,92,246,.12)',
  };
  return (
    <div className="card relative overflow-hidden hover:border-[var(--border2)] transition-all">
      <div className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text2)' }}>{label}</div>
      {change && (
        <div className={clsx('text-xs font-semibold mt-1.5 flex items-center gap-1')} style={{ color: changeUp === true ? 'var(--success)' : changeUp === false ? 'var(--danger)' : 'var(--text3)' }}>
          {changeUp === true ? '↑' : changeUp === false ? '↓' : ''} {change}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────
type BadgeVariant = 'active' | 'pending' | 'expired' | 'blue' | 'purple' | 'gray';
const badgeStyles: Record<BadgeVariant, string> = {
  active:  'bg-[rgba(0,212,170,0.15)]  text-[var(--accent3)]',
  pending: 'bg-[rgba(247,184,79,0.15)] text-[var(--accent4)]',
  expired: 'bg-[rgba(247,79,122,0.15)] text-[var(--accent5)]',
  blue:    'bg-[rgba(79,142,247,0.15)] text-[var(--accent)]',
  purple:  'bg-[rgba(124,92,252,0.15)] text-[var(--accent2)]',
  gray:    'bg-[rgba(255,255,255,0.05)] text-[var(--text3)]',
};

export function Badge({ variant = 'gray', children }: { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span className={clsx('status-badge', badgeStyles[variant])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger';
export function Button({ children, variant = 'outline', onClick, disabled, loading, size = 'md', className }: {
  children: ReactNode; variant?: BtnVariant; onClick?: () => void;
  disabled?: boolean; loading?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string;
}) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all disabled:opacity-50 cursor-pointer';
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-6 py-3' };
  const variants: Record<BtnVariant, string> = {
    primary: 'text-white border-0',
    outline: 'border text-[var(--text)] hover:bg-[var(--surface2)]',
    ghost:   'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]',
    danger:  'text-[var(--accent5)] border border-[rgba(247,79,122,0.3)] hover:bg-[rgba(247,79,122,0.1)]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(base, sizes[size], variants[variant], className)}
      style={variant === 'primary' ? {
        background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
        boxShadow: '0 4px 16px rgba(79,142,247,0.3)',
      } : variant === 'outline' ? {
        borderColor: 'var(--border)',
        background: 'transparent',
      } : {}}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Page Header ──────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────
export function Grid({ cols = 4, children, className }: {
  cols?: 2 | 3 | 4 | 5; children: ReactNode; className?: string;
}) {
  const colMap = { 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', 5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' };
  return <div className={clsx('grid gap-4', colMap[cols], className)}>{children}</div>;
}

// ─── Empty State ──────────────────────────────────────────
export function EmptyState({ icon = '📋', title, message, action }: {
  icon?: string; title: string; message?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-30">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {message && <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>{message}</p>}
      {action}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────
export function Loading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
      <p className="text-sm" style={{ color: 'var(--text2)' }}>{message}</p>
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-bold mb-4 tracking-tight">{children}</h2>;
}

// ─── Tabs ─────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b mb-5" style={{ borderColor: 'var(--border)' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={clsx(
            'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all',
            active === tab
              ? 'text-[var(--accent)] border-[var(--accent)]'
              : 'text-[var(--text3)] border-transparent hover:text-[var(--text2)]'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
