'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Bell, ChevronDown, Sun, Moon, Monitor } from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { useAppStore } from '@/store/use-app-store'
import { getInitials, cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

export function Topbar({ title }: { title?: string }) {
    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const unreadCount = useAppStore(state => state.unreadCount)
    const { setSearchOpen } = useAppStore()
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [profileOpen, setProfileOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => { setMounted(true) }, [])

    const notifHref = user?.role === 'TEACHER' ? '/teacher/notifications' : '/student/notifications'
    const profileHref = user?.role === 'TEACHER' ? '/teacher/profile' : '/student/profile'

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
    }

    const ThemeIcon = !mounted ? Monitor : theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

    return (
        <header className="h-16 bg-surface dark:bg-dark-surface border-b border-border dark:border-dark-border flex items-center px-4 md:px-6 gap-4 relative z-30">
            {title && (
                <h1 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text hidden md:block">
                    {title}
                </h1>
            )}

            {/* Search trigger */}
            <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background dark:bg-dark-bg border border-border dark:border-dark-border text-text-muted hover:border-primary/30 transition-colors text-sm ml-auto md:ml-0 md:w-64"
                aria-label="Open search"
            >
                <Search size={15} />
                <span className="hidden md:block flex-1 text-left">Search...</span>
                <kbd className="hidden md:block text-xs bg-surface dark:bg-dark-surface border border-border dark:border-dark-border px-1.5 py-0.5 rounded text-text-faint font-mono">
                    ⌘K
                </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
                {/* Theme toggle */}
                <button
                    onClick={cycleTheme}
                    className="w-9 h-9 rounded-xl bg-background dark:bg-dark-bg border border-border dark:border-dark-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-colors"
                    aria-label="Toggle theme"
                >
                    <ThemeIcon size={16} />
                </button>

                {/* Notifications */}
                <Link href={notifHref}>
                    <button className="relative w-9 h-9 rounded-xl bg-background dark:bg-dark-bg border border-border dark:border-dark-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-colors" aria-label="Notifications">
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </Link>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-background dark:hover:bg-dark-bg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-tint dark:bg-dark-surface2 border border-border dark:border-dark-border flex items-center justify-center">
                            <span className="text-primary dark:text-blue-300 text-xs font-bold">
                                {getInitials(user?.name ?? 'U')}
                            </span>
                        </div>
                        <ChevronDown size={14} className={cn('text-text-muted transition-transform', profileOpen && 'rotate-180')} />
                    </button>

                    {profileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-52 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-modal overflow-hidden z-50"
                        >
                            <div className="px-4 py-3 border-b border-border dark:border-dark-border">
                                <p className="font-medium text-text-primary dark:text-dark-text text-sm">{user?.name}</p>
                                <p className="text-text-muted text-xs">{user?.email}</p>
                            </div>
                            <div className="p-1.5">
                                <Link href={profileHref} onClick={() => setProfileOpen(false)}>
                                    <button className="w-full text-left px-3 py-2 text-sm text-text-primary dark:text-dark-text hover:bg-background dark:hover:bg-dark-bg rounded-lg transition-colors">
                                        My Profile
                                    </button>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {profileOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
            )}
        </header>
    )
}
