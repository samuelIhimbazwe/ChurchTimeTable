import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AppLocale, isAppLocale } from '@/lib/i18n/auth-ui'

export type AppTheme = 'light' | 'dark' | 'high-contrast'
export type FontScale = 'small' | 'default' | 'large' | 'xlarge'
export type ReducedMotionPref = 'system' | 'reduce' | 'no-preference'

/* ── UI Store ── */
interface UIStore {
  sidebarCollapsed: boolean
  theme: AppTheme
  locale: AppLocale
  fontScale: FontScale
  reducedMotion: ReducedMotionPref
  toggleSidebar: () => void
  setTheme: (theme: AppTheme) => void
  setLocale: (locale: AppLocale) => void
  setFontScale: (scale: FontScale) => void
  setReducedMotion: (pref: ReducedMotionPref) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      locale: 'rw',
      fontScale: 'default',
      reducedMotion: 'system',
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setFontScale: (fontScale) => set({ fontScale }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    {
      name: 'cmms-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        locale: state.locale,
        fontScale: state.fontScale,
        reducedMotion: state.reducedMotion,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<UIStore> | undefined
        const locale =
          saved?.locale && isAppLocale(saved.locale) ? saved.locale : current.locale
        const fontScale = saved?.fontScale ?? current.fontScale
        const reducedMotion = saved?.reducedMotion ?? current.reducedMotion
        return {
          ...current,
          ...saved,
          locale,
          fontScale,
          reducedMotion,
        }
      },
    },
  ),
)

/* ── Auth Store (stub — replace with real auth later) ── */
interface User {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  onboardingComplete?: boolean
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  setOnboardingComplete: (complete: boolean) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setOnboardingComplete: (complete) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, onboardingComplete: complete } }
        : {},
    ),
  hasPermission: (permission) =>
    get().user?.permissions.includes(permission) ?? false,
  hasAnyPermission: (permissions) =>
    permissions.some((p) => get().user?.permissions.includes(p) ?? false),
}))

/* ── Notification Store ── */
interface Notification {
  id: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) =>
    set((s) => {
      const notification: Notification = {
        ...n,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date(),
      }
      return {
        notifications: [notification, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      }
    }),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}))
