'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Video, FileQuestion, User } from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { cn } from '@/lib/utils'

const studentNav = [
    { label: 'Home', href: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Courses', href: '/student/courses', icon: <BookOpen size={20} /> },
    { label: 'Live', href: '/student/live-classes', icon: <Video size={20} /> },
    { label: 'Quizzes', href: '/student/quizzes', icon: <FileQuestion size={20} /> },
    { label: 'Profile', href: '/student/profile', icon: <User size={20} /> },
]

const teacherNav = [
    { label: 'Home', href: '/teacher/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Courses', href: '/teacher/courses', icon: <BookOpen size={20} /> },
    { label: 'Live', href: '/teacher/live-classes', icon: <Video size={20} /> },
    { label: 'Quizzes', href: '/teacher/quizzes', icon: <FileQuestion size={20} /> },
    { label: 'Profile', href: '/teacher/profile', icon: <User size={20} /> },
]

export function BottomNav() {
    const pathname = usePathname()
    const role = useAuthStore(state => state.user?.role)
    const nav = role === 'TEACHER' ? teacherNav : studentNav

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface dark:bg-dark-surface border-t border-border dark:border-dark-border flex items-center z-40 md:hidden safe-area-bottom">
            {nav.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors"
                    >
                        <span className={cn(
                            'transition-colors',
                            isActive ? 'text-primary dark:text-blue-400' : 'text-text-faint dark:text-dark-muted'
                        )}>
                            {item.icon}
                        </span>
                        <span className={cn(
                            'text-xs font-medium',
                            isActive ? 'text-primary dark:text-blue-400' : 'text-text-faint dark:text-dark-muted'
                        )}>
                            {item.label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
