import { create } from 'zustand'
import { Notification } from '@/types'
import { notifications as initialNotifications } from '@/data/mock-data'

interface AppState {
    // Notifications
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearNotification: (id: string) => void
    addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void

    // Search
    searchQuery: string
    setSearchQuery: (q: string) => void
    isSearchOpen: boolean
    setSearchOpen: (open: boolean) => void
    recentSearches: string[]
    addRecentSearch: (query: string) => void

    // Sidebar
    isSidebarCollapsed: boolean
    toggleSidebar: () => void

    // Toast (managed by sonner, but we track for state)
    isAITutorOpen: boolean
    toggleAITutor: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
    // Notifications
    notifications: initialNotifications,
    unreadCount: initialNotifications.filter(n => !n.read).length,

    markAsRead: (id: string) => {
        set(state => {
            const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
            return { notifications: updated, unreadCount: updated.filter(n => !n.read).length }
        })
    },

    markAllAsRead: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
        }))
    },

    clearNotification: (id: string) => {
        set(state => {
            const updated = state.notifications.filter(n => n.id !== id)
            return { notifications: updated, unreadCount: updated.filter(n => !n.read).length }
        })
    },

    addNotification: (n) => {
        const notification: Notification = {
            ...n,
            id: `n_${Date.now()}`,
            createdAt: new Date().toISOString(),
        }
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + (notification.read ? 0 : 1),
        }))
    },

    // Search
    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),
    isSearchOpen: false,
    setSearchOpen: (open) => set({ isSearchOpen: open }),
    recentSearches: ['React hooks', 'Data visualization', 'Figma tutorial'],
    addRecentSearch: (query) => {
        if (!query.trim()) return
        set(state => ({
            recentSearches: [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 5),
        }))
    },

    // Sidebar
    isSidebarCollapsed: false,
    toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    // AI Tutor
    isAITutorOpen: false,
    toggleAITutor: () => set(state => ({ isAITutorOpen: !state.isAITutorOpen })),
}))
