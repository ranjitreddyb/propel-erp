import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  code: string;
  currency: string;
  logoUrl?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  currentCompany: Company | null;
  companies: Company[];
  accessToken: string | null;

  // UI
  sidebarCollapsed: boolean;
  currentModule: string;
  notifications: Notification[];
  unreadCount: number;

  // Actions
  setUser: (user: User | null) => void;
  setCurrentCompany: (company: Company) => void;
  setCompanies: (companies: Company[]) => void;
  setAccessToken: (token: string | null) => void;
  toggleSidebar: () => void;
  setCurrentModule: (module: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      currentCompany: null,
      companies: [],
      accessToken: null,
      sidebarCollapsed: false,
      currentModule: 'dashboard',
      notifications: [],
      unreadCount: 0,

      setUser: (user) => set({ user }),
      setCurrentCompany: (currentCompany) => set({ currentCompany }),
      setCompanies: (companies) => set({ companies }),
      setAccessToken: (accessToken) => set({ accessToken }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCurrentModule: (currentModule) => set({ currentModule }),

      addNotification: (notification) => set((s) => ({
        notifications: [notification, ...s.notifications].slice(0, 50),
        unreadCount: s.unreadCount + 1,
      })),

      markNotificationRead: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      })),

      markAllRead: () => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      })),

      setUnreadCount: (unreadCount) => set({ unreadCount }),

      logout: () => set({
        user: null,
        accessToken: null,
        notifications: [],
        unreadCount: 0,
      }),
    }),
    {
      name: 'propel-erp-store',
      partialize: (state) => ({
        currentCompany: state.currentCompany,
        companies: state.companies,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// ─── Finance Store ────────────────────────────────────────
interface FinanceState {
  selectedFinYear: string | null;
  selectedCostCentre: string | null;
  setFinYear: (year: string) => void;
  setCostCentre: (id: string | null) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  selectedFinYear: null,
  selectedCostCentre: null,
  setFinYear: (selectedFinYear) => set({ selectedFinYear }),
  setCostCentre: (selectedCostCentre) => set({ selectedCostCentre }),
}));
