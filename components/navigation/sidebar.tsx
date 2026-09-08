'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, BookOpen, Plus, Video, FileQuestion,
    Users, BarChart3, TrendingUp, Bell, User, HelpCircle,
    Settings, ChevronLeft, ChevronRight, LogOut, Compass,
    Award, Heart, MessageSquare, CreditCard
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { useAppStore } from '@/store/use-app-store'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getNotifications } from '@/lib/api/notifications'
import { getConversations } from '@/lib/api/chat'

interface NavItem {
    label: string
    href: string
    icon: React.ReactNode
    section: 'MENU' | 'LEARNING' | 'COMMUNICATION' | 'ACCOUNT'
    badge?: number
    roles: ('STUDENT' | 'TEACHER' | 'ADMIN')[]
}

const navItems: NavItem[] = [
    // ── Student Menu ──────────────────────────────────────────
    { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={17} />, section: 'MENU', roles: ['STUDENT'] },
    { label: 'Explore Courses', href: '/student/courses', icon: <Compass size={17} />, section: 'MENU', roles: ['STUDENT'] },
    { label: 'My Courses', href: '/student/my-courses', icon: <BookOpen size={17} />, section: 'MENU', roles: ['STUDENT'] },
    { label: 'Live Classes', href: '/student/live-classes', icon: <Video size={17} />, section: 'MENU', roles: ['STUDENT'] },

    // ── Student My Learning ───────────────────────────────────
    { label: 'My Progress', href: '/student/progress', icon: <TrendingUp size={17} />, section: 'LEARNING', roles: ['STUDENT'] },
    { label: 'Quizzes', href: '/student/quizzes', icon: <FileQuestion size={17} />, section: 'LEARNING', roles: ['STUDENT'] },
    { label: 'Certificates', href: '/student/certificates', icon: <Award size={17} />, section: 'LEARNING', roles: ['STUDENT'] },
    { label: 'Wishlist', href: '/student/wishlist', icon: <Heart size={17} />, section: 'LEARNING', roles: ['STUDENT'] },

    // ── Student Communication ─────────────────────────────────
    { label: 'Messages', href: '/student/messages', icon: <MessageSquare size={17} />, section: 'COMMUNICATION', roles: ['STUDENT'] },
    { label: 'Notifications', href: '/student/notifications', icon: <Bell size={17} />, section: 'COMMUNICATION', roles: ['STUDENT'] },

    // ── Student Account / Settings ────────────────────────────
    { label: 'Profile', href: '/student/profile', icon: <User size={17} />, section: 'ACCOUNT', roles: ['STUDENT'] },
    { label: 'Payment History', href: '/student/payments', icon: <CreditCard size={17} />, section: 'ACCOUNT', roles: ['STUDENT'] },
    { label: 'Help Center', href: '/help', icon: <HelpCircle size={17} />, section: 'ACCOUNT', roles: ['STUDENT'] },

    // ── Teacher Menu ──────────────────────────────────────────
    { label: 'Dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={17} />, section: 'MENU', roles: ['TEACHER'] },
    { label: 'My Courses', href: '/teacher/courses', icon: <BookOpen size={17} />, section: 'MENU', roles: ['TEACHER'] },
    { label: 'Create Course', href: '/teacher/courses/create', icon: <Plus size={17} />, section: 'MENU', roles: ['TEACHER'] },
    { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video size={17} />, section: 'MENU', roles: ['TEACHER'] },

    // ── Teacher Academics / Teaching ──────────────────────────
    { label: 'Students', href: '/teacher/students', icon: <Users size={17} />, section: 'LEARNING', roles: ['TEACHER'] },
    { label: 'Analytics', href: '/teacher/analytics', icon: <BarChart3 size={17} />, section: 'LEARNING', roles: ['TEACHER'] },
    { label: 'Quizzes', href: '/teacher/quizzes', icon: <FileQuestion size={17} />, section: 'LEARNING', roles: ['TEACHER'] },

    // ── Teacher Communication ─────────────────────────────────
    { label: 'Messages', href: '/student/messages', icon: <MessageSquare size={17} />, section: 'COMMUNICATION', roles: ['TEACHER'] },
    { label: 'Notifications', href: '/teacher/notifications', icon: <Bell size={17} />, section: 'COMMUNICATION', roles: ['TEACHER'] },

    // ── Teacher Account ───────────────────────────────────────
    { label: 'Profile', href: '/teacher/profile', icon: <User size={17} />, section: 'ACCOUNT', roles: ['TEACHER'] },
    { label: 'Help Center', href: '/help', icon: <HelpCircle size={17} />, section: 'ACCOUNT', roles: ['TEACHER'] },

    // ── Admin Menu ────────────────────────────────────────────
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={17} />, section: 'MENU', roles: ['ADMIN'] },

    // ── Admin Account ─────────────────────────────────────────
    { label: 'Profile', href: '/admin/profile', icon: <User size={17} />, section: 'ACCOUNT', roles: ['ADMIN'] },
    { label: 'Help Center', href: '/help', icon: <HelpCircle size={17} />, section: 'ACCOUNT', roles: ['ADMIN'] },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const { isSidebarCollapsed, toggleSidebar } = useAppStore()
    const storeUnreadCount = useAppStore(state => state.unreadCount)

    const [liveUnreadNotifs, setLiveUnreadNotifs] = React.useState<number>(storeUnreadCount)
    const [liveUnreadMessages, setLiveUnreadMessages] = React.useState<number>(0)

    React.useEffect(() => {
        if (!user) return

        const fetchBadges = async () => {
            try {
                const notifRes = await getNotifications()
                if (notifRes && typeof notifRes.unreadCount === 'number') {
                    setLiveUnreadNotifs(notifRes.unreadCount)
                }
            } catch (err) {
                // fallback to store
            }

            try {
                const convRes = await getConversations()
                if (convRes && Array.isArray(convRes.conversations)) {
                    const isTeacher = user.role === 'TEACHER'
                    const totalUnread = convRes.conversations.reduce((sum, c) => {
                        return sum + (isTeacher ? (c.unreadTeacher || 0) : (c.unreadStudent || 0))
                    }, 0)
                    setLiveUnreadMessages(totalUnread)
                }
            } catch (err) {
                // ignore
            }
        }

        fetchBadges()
        const interval = setInterval(fetchBadges, 25000)
        return () => clearInterval(interval)
    }, [user])

    const role = user?.role ?? 'STUDENT'
    const allowedItems = navItems.filter(item => item.roles.includes(role as 'STUDENT' | 'TEACHER' | 'ADMIN'))

    const menuItems = allowedItems.filter(i => i.section === 'MENU')
    const learningItems = allowedItems.filter(i => i.section === 'LEARNING')
    const commsItems = allowedItems.filter(i => i.section === 'COMMUNICATION')
    const accountItems = allowedItems.filter(i => i.section === 'ACCOUNT')

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const NavLink = ({ item }: { item: NavItem }) => {
        const isActive = pathname === item.href || (item.href !== '/student/dashboard' && item.href !== '/teacher/dashboard' && pathname.startsWith(item.href + '/'))
        const isNotification = item.label === 'Notifications'
        const isMessage = item.label === 'Messages'
        const badgeCount = isNotification ? liveUnreadNotifs : (isMessage ? liveUnreadMessages : (item.badge || 0))
        const hasUnread = badgeCount > 0

        return (
            <Link href={item.href} className="block relative">
                <div
                    className={cn(
                        'group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer select-none text-sm font-medium',
                        isActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/[0.05]'
                    )}
                >
                    {/* Active accent bar */}
                    {isActive && (
                        <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute left-0 w-1 h-5 rounded-r-full bg-primary dark:bg-indigo-400"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                    )}

                    <span className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive ? 'text-primary dark:text-indigo-400' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'
                    )}>
                        {item.icon}
                    </span>

                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.span
                                className="truncate font-sans tracking-tight"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Notification/Message Pill */}
                    {hasUnread && !isSidebarCollapsed && (
                        <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    )}

                    {hasUnread && isSidebarCollapsed && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white dark:ring-dark-bg" />
                    )}
                </div>
            </Link>
        )
    }

    const SectionHeader = ({ title }: { title: string }) => {
        if (isSidebarCollapsed) return null
        return (
            <div className="px-3 pt-3.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
                {title}
            </div>
        )
    }

    return (
        <motion.aside
            className={cn(
                'fixed left-0 top-0 h-full z-40 flex flex-col',
                'bg-white/95 dark:bg-[#0D0F19]/95 backdrop-blur-2xl',
                'border-r border-slate-200/80 dark:border-white/[0.08]',
                'transition-all duration-300 ease-in-out shadow-sm'
            )}
            animate={{ width: isSidebarCollapsed ? 68 : 248 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
            {/* Header: Logo */}
            <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100 dark:border-white/[0.06]">
                <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
                    <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 p-1 shadow-xs group-hover:scale-105 transition-transform">
                        <Image
                            src="/logo-icon-clean.png"
                            alt="LearnSphere"
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </div>
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col min-w-0"
                            >
                                <span className="font-sora font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                                    LearnSphere
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                                    Next-Gen Learning
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-none">
                {menuItems.length > 0 && (
                    <>
                        <SectionHeader title="MENU" />
                        {menuItems.map(item => (
                            <NavLink key={`${item.label}-${item.href}`} item={item} />
                        ))}
                    </>
                )}

                {learningItems.length > 0 && (
                    <>
                        <SectionHeader title={role === 'TEACHER' ? 'TEACHING' : 'MY LEARNING'} />
                        {learningItems.map(item => (
                            <NavLink key={`${item.label}-${item.href}`} item={item} />
                        ))}
                    </>
                )}

                {commsItems.length > 0 && (
                    <>
                        <SectionHeader title="COMMUNICATION" />
                        {commsItems.map(item => (
                            <NavLink key={`${item.label}-${item.href}`} item={item} />
                        ))}
                    </>
                )}

                {accountItems.length > 0 && (
                    <>
                        <SectionHeader title="ACCOUNT" />
                        {accountItems.map(item => (
                            <NavLink key={`${item.label}-${item.href}`} item={item} />
                        ))}
                    </>
                )}
            </div>

            {/* Bottom User Profile Card — Designed with comfortable bottom padding */}
            <div className="p-2 border-t border-slate-100 dark:border-white/[0.06] pb-12 lg:pb-3 bg-slate-50/50 dark:bg-white/[0.02]">
                <AnimatePresence>
                    {!isSidebarCollapsed ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-2.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] shadow-2xs flex items-center gap-2.5"
                        >
                            {/* User Avatar with status */}
                            <Link
                                href={role === 'TEACHER' ? '/teacher/profile' : role === 'ADMIN' ? '/admin/profile' : '/student/profile'}
                                className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden hover:scale-105 transition-transform"
                                title="Edit Profile & Photo"
                            >
                                {user?.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(user?.name ?? 'U')
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D0F19]" />
                            </Link>

                            {/* User text */}
                            <Link
                                href={role === 'TEACHER' ? '/teacher/profile' : role === 'ADMIN' ? '/admin/profile' : '/student/profile'}
                                className="flex-1 min-w-0 group/text"
                            >
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug group-hover/text:text-primary transition-colors">
                                    {user?.name || 'Alex Johnson'}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                        {user?.role === 'TEACHER' ? 'Instructor' : user?.role === 'ADMIN' ? 'Admin' : 'Student'}
                                    </span>
                                </div>
                            </Link>

                            {/* Logout Action */}
                            <button
                                onClick={handleLogout}
                                title="Sign out"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                aria-label="Log Out"
                            >
                                <LogOut size={15} />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-1">
                            <button
                                onClick={() => router.push(role === 'TEACHER' ? '/teacher/profile' : role === 'ADMIN' ? '/admin/profile' : '/student/profile')}
                                className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs hover:ring-2 hover:ring-primary/40 transition-all overflow-hidden"
                                title={user?.name || 'Profile'}
                            >
                                {user?.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(user?.name ?? 'U')
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D0F19]" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                title="Sign out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Minimalist Collapse Toggle on border */}
            <button
                onClick={toggleSidebar}
                className={cn(
                    'absolute -right-3 top-20 w-6 h-6 rounded-full',
                    'bg-white dark:bg-[#1A1D2E] border border-slate-200 dark:border-white/[0.12]',
                    'flex items-center justify-center text-slate-600 dark:text-slate-300',
                    'hover:text-primary hover:border-primary/40 dark:hover:text-white',
                    'shadow-xs transition-all z-50'
                )}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </motion.aside>
    )
}
