'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for JWT token in localStorage
    const token = localStorage.getItem('propel_token');
    const user = localStorage.getItem('propel_user');
    
    if (!token || !user) {
      router.replace('/auth/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Show loading spinner while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Loading PropelERP…</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
