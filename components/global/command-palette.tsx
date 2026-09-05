'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, Video, BarChart3, User, Clock, ArrowRight, X, Hash, Flame } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { courses, liveClasses, quizzes } from '@/data/mock-data'
import { useAuthStore } from '@/store/use-auth-store'
import { cn } from '@/lib/utils'

type ResultItem = {
    id: string
    type: 'course' | 'live' | 'quiz' | 'page'
    title: string
    subtitle?: string
    href: string
    icon: React.ReactNode
}

const STUDENT_PAGES: ResultItem[] = [
    { id: 'p-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Student home', href: '/student/dashboard', icon: <BarChart3 size={15} /> },
    { id: 'p-courses', type: 'page', title: 'My Courses', subtitle: 'Browse & enroll', href: '/student/courses', icon: <BookOpen size={15} /> },
    { id: 'p-live', type: 'page', title: 'Live Classes', subtitle: 'Join live sessions', href: '/student/live-classes', icon: <Video size={15} /> },
    { id: 'p-quizzes', type: 'page', title: 'Quizzes', subtitle: 'Test your knowledge', href: '/student/quizzes', icon: <Hash size={15} /> },
    { id: 'p-progress', type: 'page', title: 'Progress', subtitle: 'Analytics & achievements', href: '/student/progress', icon: <BarChart3 size={15} /> },
    { id: 'p-profile', type: 'page', title: 'Profile & Settings', subtitle: 'Account preferences', href: '/student/profile', icon: <User size={15} /> },
]

const TEACHER_PAGES: ResultItem[] = [
    { id: 'tp-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Teacher overview', href: '/teacher/dashboard', icon: <BarChart3 size={15} /> },
    { id: 'tp-courses', type: 'page', title: 'My Courses', subtitle: 'Manage courses', href: '/teacher/courses', icon: <BookOpen size={15} /> },
    { id: 'tp-students', type: 'page', title: 'Students', subtitle: 'Manage students', href: '/teacher/students', icon: <User size={15} /> },
    { id: 'tp-analytics', type: 'page', title: 'Analytics', subtitle: 'Revenue & performance', href: '/teacher/analytics', icon: <BarChart3 size={15} /> },
    { id: 'tp-live', type: 'page', title: 'Live Classes', subtitle: 'Schedule sessions', href: '/teacher/live-classes', icon: <Video size={15} /> },
    { id: 'tp-create', type: 'page', title: 'Create Course', subtitle: 'New course wizard', href: '/teacher/courses/create', icon: <BookOpen size={15} /> },
]

export function CommandPalette() {
    const { isSearchOpen, setSearchOpen, recentSearches, addRecentSearch } = useAppStore()
    const user = useAuthStore(state => state.user)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [selectedIdx, setSelectedIdx] = useState(0)

    const isTeacher = user?.role === 'TEACHER'
    const pages = isTeacher ? TEACHER_PAGES : STUDENT_PAGES

    const courseResults: ResultItem[] = courses
        .filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
        .map(c => ({
            id: `c-${c.id}`, type: 'course' as const,
            title: c.title, subtitle: `${c.category} · ⭐ ${c.rating}`,
            href: isTeacher ? `/teacher/courses` : `/student/courses/${c.id}`,
            icon: <BookOpen size={15} />,
        }))

    const liveResults: ResultItem[] = liveClasses
        .filter(lc => lc.title.toLowerCase().includes(query.toLowerCase()) && lc.status !== 'COMPLETED')
        .slice(0, 2)
        .map(lc => ({
            id: `lc-${lc.id}`, type: 'live' as const,
            title: lc.title, subtitle: lc.status === 'LIVE' ? '🔴 Live Now' : 'Upcoming',
            href: isTeacher ? `/teacher/live-classes` : `/student/live-classes`,
            icon: <Video size={15} />,
        }))

    const pageResults = query
        ? pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
        : pages

    const results: { group: string; items: ResultItem[] }[] = query
        ? [
            ...(courseResults.length ? [{ group: 'Courses', items: courseResults }] : []),
            ...(liveResults.length ? [{ group: 'Live Classes', items: liveResults }] : []),
            ...(pageResults.length ? [{ group: 'Pages', items: pageResults }] : []),
        ]
        : [
            { group: 'Quick Navigation', items: pageResults },
            ...(recentSearches.length ? [{ group: 'Recent Searches', items: recentSearches.slice(0, 3).map(s => ({ id: `r-${s}`, type: 'page' as const, title: s, href: `/student/courses?q=${encodeURIComponent(s)}`, icon: <Clock size={15} /> })) }] : []),
        ]

    const allItems = results.flatMap(r => r.items)

    useEffect(() => {
        if (!isSearchOpen) { setQuery(''); setSelectedIdx(0); return }
        setTimeout(() => inputRef.current?.focus(), 50)
    }, [isSearchOpen])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
            if (e.key === 'Escape') setSearchOpen(false)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [setSearchOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
        if (e.key === 'Enter' && allItems[selectedIdx]) {
            navigate(allItems[selectedIdx])
        }
    }

    const navigate = (item: ResultItem) => {
        if (query) addRecentSearch(query)
        setSearchOpen(false)
        router.push(item.href)
    }

    let globalIdx = 0

    return (
        <AnimatePresence>
            {isSearchOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSearchOpen(false)}
                    />
                    <motion.div
                        className="relative w-full max-w-xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl shadow-modal overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border dark:border-dark-border">
                            <Search size={18} className="text-text-faint flex-shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelectedIdx(0) }}
                                onKeyDown={handleKeyDown}
                                placeholder="Search courses, pages, live classes..."
                                className="flex-1 bg-transparent text-text-primary dark:text-dark-text placeholder:text-text-faint text-[15px] outline-none"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-text-faint hover:text-text-muted transition-colors">
                                    <X size={15} />
                                </button>
                            )}
                            <kbd className="hidden sm:flex items-center text-xs bg-background dark:bg-dark-bg border border-border dark:border-dark-border text-text-faint px-1.5 py-0.5 rounded font-mono">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[400px] overflow-y-auto py-2">
                            {allItems.length === 0 && query && (
                                <div className="text-center py-10">
                                    <Search size={32} className="mx-auto text-text-faint mb-2 opacity-30" />
                                    <p className="text-text-muted text-sm">No results for &quot;{query}&quot;</p>
                                </div>
                            )}
                            {results.map(group => (
                                <div key={group.group} className="mb-2">
                                    <p className="px-4 py-1.5 text-xs font-semibold text-text-faint uppercase tracking-wider">{group.group}</p>
                                    {group.items.map(item => {
                                        const idx = globalIdx++
                                        const isSelected = idx === selectedIdx
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item)}
                                                onMouseEnter={() => setSelectedIdx(idx)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                                    isSelected ? 'bg-primary-tint dark:bg-dark-surface2' : 'hover:bg-background dark:hover:bg-dark-bg'
                                                )}
                                            >
                                                <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                                                    item.type === 'live' ? 'bg-accent/10 text-accent' :
                                                        item.type === 'course' ? 'bg-primary-tint text-primary dark:bg-dark-surface2' :
                                                            'bg-border dark:bg-dark-border text-text-muted'
                                                )}>
                                                    {item.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate">{item.title}</p>
                                                    {item.subtitle && <p className="text-xs text-text-muted truncate">{item.subtitle}</p>}
                                                </div>
                                                {isSelected && <ArrowRight size={14} className="text-primary flex-shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border dark:border-dark-border px-4 py-2 flex items-center gap-4 text-xs text-text-faint">
                            <span className="flex items-center gap-1"><kbd className="bg-background dark:bg-dark-bg border border-border dark:border-dark-border px-1 py-0.5 rounded font-mono text-xs">↑↓</kbd> navigate</span>
                            <span className="flex items-center gap-1"><kbd className="bg-background dark:bg-dark-bg border border-border dark:border-dark-border px-1 py-0.5 rounded font-mono text-xs">↵</kbd> open</span>
                            <span className="flex items-center gap-1"><kbd className="bg-background dark:bg-dark-bg border border-border dark:border-dark-border px-1 py-0.5 rounded font-mono text-xs">ESC</kbd> close</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
