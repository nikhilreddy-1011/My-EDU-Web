'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, BookOpen, Plus, Video, FileQuestion,
    Users, BarChart3, TrendingUp, Bell, User, HelpCircle,
    Settings, ChevronLeft, ChevronRight, LogOut, GraduationCap, Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { useAppStore } from '@/store/use-app-store'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface NavItem {
    label: string
    href: string
    icon: React.ReactNode
    badge?: number
    roles: ('STUDENT' | 'TEACHER' | 'ADMIN')[]
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={18} />, roles: ['STUDENT'] },
    { label: 'Dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={18} />, roles: ['TEACHER'] },
    { label: 'My Courses', href: '/student/courses', icon: <BookOpen size={18} />, roles: ['STUDENT'] },
    { label: 'My Courses', href: '/teacher/courses', icon: <BookOpen size={18} />, roles: ['TEACHER'] },
    { label: 'Create Course', href: '/teacher/courses/create', icon: <Plus size={18} />, roles: ['TEACHER'] },
    { label: 'Live Classes', href: '/student/live-classes', icon: <Video size={18} />, roles: ['STUDENT'] },
    { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video size={18} />, roles: ['TEACHER'] },
    { label: 'Quizzes', href: '/student/quizzes', icon: <FileQuestion size={18} />, roles: ['STUDENT'] },
    { label: 'Quizzes', href: '/teacher/quizzes', icon: <FileQuestion size={18} />, roles: ['TEACHER'] },
    { label: 'Progress', href: '/student/progress', icon: <TrendingUp size={18} />, roles: ['STUDENT'] },
    { label: 'Students', href: '/teacher/students', icon: <Users size={18} />, roles: ['TEACHER'] },
    { label: 'Analytics', href: '/teacher/analytics', icon: <BarChart3 size={18} />, roles: ['TEACHER'] },
    { label: 'Notifications', href: '/student/notifications', icon: <Bell size={18} />, roles: ['STUDENT'] },
    { label: 'Notifications', href: '/teacher/notifications', icon: <Bell size={18} />, roles: ['TEACHER'] },
    { label: 'Profile', href: '/student/profile', icon: <User size={18} />, roles: ['STUDENT'] },
    { label: 'Profile', href: '/teacher/profile', icon: <User size={18} />, roles: ['TEACHER'] },
]

const bottomItems: NavItem[] = [
    { label: 'Help', href: '/help', icon: <HelpCircle size={18} />, roles: ['STUDENT', 'TEACHER'] },
    { label: 'Settings', href: '/student/profile', icon: <Settings size={18} />, roles: ['STUDENT'] },
    { label: 'Settings', href: '/teacher/profile', icon: <Settings size={18} />, roles: ['TEACHER'] },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const { isSidebarCollapsed, toggleSidebar } = useAppStore()
    const unreadCount = useAppStore(state => state.unreadCount)

    const role = user?.role ?? 'STUDENT'

    const filteredNavItems = navItems.filter(item => item.roles.includes(role as 'STUDENT' | 'TEACHER' | 'ADMIN'))
    const filteredBottomItems = bottomItems.filter(item => item.roles.includes(role as 'STUDENT' | 'TEACHER' | 'ADMIN'))

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const NavLink = ({ item }: { item: NavItem }) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const showBadge = item.label === 'Notifications' && unreadCount > 0

        return (
            <Link href={item.href} className="block">
                <motion.div
                    className={cn(
                        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group',
                        isActive
                            ? 'bg-white/15 text-white'
                            : 'text-blue-200 hover:bg-white/10 hover:text-white'
                    )}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isActive && (
                        <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 bg-white/15 rounded-xl border border-white/20"
                            transition={{ type: 'spring', duration: 0.4 }}
                        />
                    )}
                    <span className="relative z-10 flex-shrink-0">{item.icon}</span>
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.span
                                className="relative z-10 text-sm font-medium truncate"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                    {showBadge && !isSidebarCollapsed && (
                        <span className="relative z-10 ml-auto bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    {showBadge && isSidebarCollapsed && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                    )}
                </motion.div>
            </Link>
        )
    }

    return (
        <motion.aside
            className="fixed left-0 top-0 h-full z-40 flex flex-col"
            style={{ background: 'linear-gradient(180deg, #2E3A8C 0%, #1F2861 100%)' }}
            animate={{ width: isSidebarCollapsed ? 64 : 240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Zap size={16} className="text-white" />
                </div>
                <AnimatePresence>
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <span className="font-sora font-bold text-white text-lg whitespace-nowrap">
                                LearnSphere
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* User */}
            <div className="px-3 py-3 border-b border-white/10">
                <div className={cn('flex items-center gap-3', isSidebarCollapsed && 'justify-center')}>
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{getInitials(user?.name ?? 'U')}</span>
                    </div>
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="text-white text-sm font-medium truncate whitespace-nowrap max-w-[130px]">
                                    {user?.name}
                                </p>
                                <p className="text-blue-300 text-xs capitalize">
                                    {user?.role?.toLowerCase()}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {filteredNavItems.map(item => (
                    <NavLink key={`${item.label}-${item.href}`} item={item} />
                ))}
            </nav>

            {/* Bottom */}
            <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
                {filteredBottomItems.map(item => (
                    <NavLink key={`${item.label}-${item.href}-bottom`} item={item} />
                ))}
                <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors duration-200"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <LogOut size={18} className="flex-shrink-0" />
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.span
                                className="text-sm font-medium"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                Log Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary border border-white/20 flex items-center justify-center text-white hover:bg-primary-dark transition-colors z-50 shadow-md"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </motion.aside>
    )
}
