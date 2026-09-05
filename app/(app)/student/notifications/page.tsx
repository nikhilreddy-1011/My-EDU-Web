'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BookOpen, Video, Trophy, Megaphone, Star, Settings, X, Check, CheckCheck } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAppStore } from '@/store/use-app-store'
import { formatRelativeTime, cn } from '@/lib/utils'
import { NotificationType } from '@/types'

const typeIcon: Record<NotificationType, React.ReactNode> = {
    LIVE_CLASS: <Video size={16} />,
    QUIZ: <Star size={16} />,
    ANNOUNCEMENT: <Megaphone size={16} />,
    ACHIEVEMENT: <Trophy size={16} />,
    NEW_COURSE: <BookOpen size={16} />,
    SYSTEM: <Settings size={16} />,
}
const typeColor: Record<NotificationType, string> = {
    LIVE_CLASS: 'text-accent bg-accent/10',
    QUIZ: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    ANNOUNCEMENT: 'text-primary bg-primary-tint dark:bg-dark-surface2',
    ACHIEVEMENT: 'text-warning bg-yellow-50 dark:bg-yellow-900/10',
    NEW_COURSE: 'text-success bg-green-50 dark:bg-green-900/10',
    SYSTEM: 'text-text-muted bg-border dark:bg-dark-border',
}

const FILTER_OPTIONS = ['All', 'Unread', 'LIVE_CLASS', 'QUIZ', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'NEW_COURSE']

export default function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead, clearNotification, unreadCount } = useAppStore()
    const [filter, setFilter] = useState('All')

    const filtered = notifications.filter(n => {
        if (filter === 'All') return true
        if (filter === 'Unread') return !n.read
        return n.type === filter
    })

    return (
        <AppLayout title="Notifications">
            <div className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Notifications</h1>
                        <p className="text-text-muted">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
                    </div>
                    {unreadCount > 0 && (
                        <motion.button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-primary text-primary hover:bg-primary-tint transition-colors"
                            whileTap={{ scale: 0.97 }}
                        >
                            <CheckCheck size={15} /> Mark all read
                        </motion.button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                                filter === f ? 'bg-primary text-white' : 'bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text-muted hover:border-primary/30'
                            )}>
                            {f.toLowerCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Notifications list */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
                        <Bell size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                        <h3 className="font-semibold text-text-primary dark:text-dark-text">No notifications</h3>
                        <p className="text-text-muted text-sm mt-1">You&apos;re all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filtered.map((notif, i) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={cn(
                                        'group bg-surface dark:bg-dark-surface border rounded-2xl p-4 hover:shadow-card transition-all',
                                        !notif.read ? 'border-primary/20' : 'border-border dark:border-dark-border'
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', typeColor[notif.type])}>
                                            {typeIcon[notif.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn('text-sm font-medium', notif.read ? 'text-text-primary dark:text-dark-text' : 'text-text-primary dark:text-dark-text')}>
                                                    {!notif.read && <span className="w-2 h-2 bg-primary rounded-full inline-block mr-2 mb-0.5" />}
                                                    {notif.title}
                                                </p>
                                                <span className="text-xs text-text-faint flex-shrink-0">{formatRelativeTime(notif.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{notif.message}</p>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            {!notif.read && (
                                                <button onClick={() => markAsRead(notif.id)} className="p-1 rounded-lg hover:bg-background dark:hover:bg-dark-bg text-text-faint hover:text-success transition-colors" title="Mark as read">
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => clearNotification(notif.id)} className="p-1 rounded-lg hover:bg-background dark:hover:bg-dark-bg text-text-faint hover:text-accent transition-colors" title="Dismiss">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
