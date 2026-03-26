'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const { currentCompany, addNotification } = useAppStore();

  useEffect(() => {
    if (!currentCompany?.id) return;

    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join_company', currentCompany.id);
    });

    socketRef.current.on('notification', (data) => {
      addNotification(data);
      // Show toast for critical/high priority
      if (data.priority === 'critical' || data.priority === 'high') {
        import('react-hot-toast').then(({ default: toast }) => {
          toast(data.title, {
            icon: data.priority === 'critical' ? '🚨' : '⚠️',
            duration: 6000,
          });
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentCompany?.id, addNotification]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1d2130',
              color: '#f0f2f8',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00d4aa', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f74f7a', secondary: '#fff' } },
          }}
        />
      </SocketProvider>
    </QueryClientProvider>
  );
}
