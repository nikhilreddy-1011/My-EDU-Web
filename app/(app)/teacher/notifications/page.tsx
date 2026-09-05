'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, GraduationCap, Star, Video, FileQuestion, Megaphone, X, CheckCheck } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAppStore } from '@/store/use-app-store'
import { formatRelativeTime, cn } from '@/lib/utils'

type FilterType = 'ALL' | 'ENROLLMENT' | 'REVIEW' | 'LIVE_CLASS' | 'QUIZ' | 'SYSTEM'

const TEACHER_NOTIFICATIONS = [
    { id: 'tn1', type: 'ENROLLMENT' as FilterType, title: 'New student enrolled!', message: 'Meera Krishnan enrolled in "Complete React & Next.js Development Bootcamp"', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    { id: 'tn2', type: 'REVIEW' as FilterType, title: '⭐ New 5-star review', message: 'Ananya Singh left a review on "UI/UX Design Masterclass": "Absolutely incredible course content..."', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'tn3', type: 'LIVE_CLASS' as FilterType, title: 'Live class starts in 1 hour', message: '"Design Critique & Feedback Session" begins at 11:00 AM today.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'tn4', type: 'QUIZ' as FilterType, title: 'Quiz completed', message: '18 students completed "React Hooks Assessment". Avg score: 76%', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'tn5', type: 'ENROLLMENT' as FilterType, title: 'New student enrolled!', message: 'Rahul Gupta enrolled in "Data Science & Machine Learning with Python"', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    { id: 'tn6', type: 'SYSTEM' as FilterType, title: '📊 Weekly Earnings Report', message: 'Your courses generated ₹24,800 this week — up 12% from last week!', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'tn7', type: 'REVIEW' as FilterType, title: '⭐ New 4-star review', message: 'Karan Patel left a review on "Node.js & Express": "Very practical and well-paced."', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
]

const ICON_MAP: Record<string, React.ReactNode> = {
    ENROLLMENT: <GraduationCap size={16} />,
    REVIEW: <Star size={16} />,
    LIVE_CLASS: <Video size={16} />,
    QUIZ: <FileQuestion size={16} />,
    SYSTEM: <Megaphone size={16} />,
}

const COLOR_MAP: Record<string, string> = {
    ENROLLMENT: 'bg-success/10 text-success',
    REVIEW: 'bg-warning/10 text-warning',
    LIVE_CLASS: 'bg-accent/10 text-accent',
    QUIZ: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    SYSTEM: 'bg-primary-tint text-primary dark:bg-dark-surface2',
}

const FILTER_TABS: { id: FilterType; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'ENROLLMENT', label: 'Enrollments' },
    { id: 'REVIEW', label: 'Reviews' },
    { id: 'LIVE_CLASS', label: 'Live Classes' },
    { id: 'QUIZ', label: 'Quizzes' },
    { id: 'SYSTEM', label: 'System' },
]

export default function TeacherNotificationsPage() {
    const [filter, setFilter] = useState<FilterType>('ALL')
    const [notifs, setNotifs] = useState(TEACHER_NOTIFICATIONS)

    const filtered = filter === 'ALL' ? notifs : notifs.filter(n => n.type === filter)
    const unreadCount = notifs.filter(n => !n.read).length

    const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })))
    const dismiss = (id: string) => setNotifs(n => n.filter(x => x.id !== id))
    const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))

    return (
        <AppLayout title="Notifications">
            <div className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text">Notifications</h1>
                        <p className="text-text-muted text-sm mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                            <CheckCheck size={15} /> Mark all as read
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {FILTER_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setFilter(tab.id)}
                            className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                                filter === tab.id ? 'bg-primary text-white' : 'bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text-muted hover:border-primary/30'
                            )}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Notif list */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {filtered.length === 0 && (
                            <div className="text-center py-12">
                                <Bell size={40} className="mx-auto text-text-faint mb-3 opacity-30" />
                                <p className="text-text-muted">No notifications in this category</p>
                            </div>
                        )}
                        {filtered.map(notif => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                onClick={() => markRead(notif.id)}
                                className={cn('relative flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all group',
                                    notif.read
                                        ? 'bg-surface dark:bg-dark-surface border-border dark:border-dark-border'
                                        : 'bg-primary-tint dark:bg-dark-surface2 border-primary/20'
                                )}
                            >
                                {!notif.read && <div className="absolute top-4 left-0 w-1 h-6 bg-primary rounded-r" />}
                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', COLOR_MAP[notif.type] || 'bg-border text-text-muted')}>
                                    {ICON_MAP[notif.type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn('text-sm font-semibold mb-0.5', notif.read ? 'text-text-primary dark:text-dark-text' : 'text-text-primary dark:text-dark-text')}>{notif.title}</p>
                                    <p className="text-xs text-text-muted line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-text-faint mt-1">{formatRelativeTime(notif.createdAt)}</p>
                                </div>
                                <button onClick={e => { e.stopPropagation(); dismiss(notif.id) }} className="opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0 text-text-faint hover:text-text-muted transition-all mt-1">
                                    <X size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </AppLayout>
    )
}
