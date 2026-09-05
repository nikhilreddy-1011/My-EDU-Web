'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    TrendingUp, BookOpen, Clock, Award, Flame, ArrowRight,
    Play, Calendar, FileQuestion, ChevronRight, Star, Zap
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { enrollments, liveClasses, quizzes, userBadges, studentStats } from '@/data/mock-data'
import { getGreeting, formatDate, formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function StudentDashboard() {
    const user = useAuthStore(state => state.user)
    const stats = studentStats

    const inProgress = enrollments.filter(e => !e.completedAt).slice(0, 3)
    const upcoming = liveClasses.filter(lc => lc.status === 'UPCOMING').slice(0, 2)
    const liveNow = liveClasses.filter(lc => lc.status === 'LIVE').slice(0, 1)
    const upcomingQuizzes = quizzes.filter(q => q.isPublished).slice(0, 2)

    const statCards = [
        { label: 'Overall Progress', value: `${stats.overallProgress}%`, icon: <TrendingUp size={18} />, color: 'text-primary', bg: 'bg-primary-tint dark:bg-dark-surface2', delta: '+5% this week' },
        { label: 'In Progress', value: stats.coursesInProgress, icon: <BookOpen size={18} />, color: 'text-warning', bg: 'bg-yellow-50 dark:bg-yellow-900/10', delta: '1 new this month' },
        { label: 'Completed', value: stats.coursesCompleted, icon: <Award size={18} />, color: 'text-success', bg: 'bg-green-50 dark:bg-green-900/10', delta: '2 this quarter' },
        { label: 'Learning Hours', value: `${stats.learningHours}h`, icon: <Clock size={18} />, color: 'text-accent', bg: 'bg-orange-50 dark:bg-orange-900/10', delta: '+3h this week' },
    ]

    return (
        <AppLayout>
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-sora font-bold text-2xl md:text-3xl text-text-primary dark:text-dark-text">
                            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="text-text-muted mt-1">Ready to continue your learning journey?</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-sm">
                            <Flame size={16} className="text-accent" />
                            <span className="font-semibold text-text-primary dark:text-dark-text">{stats.currentStreak} day streak 🔥</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div key={s.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 hover:shadow-card transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.bg)}>
                                    <span className={s.color}>{s.icon}</span>
                                </div>
                            </div>
                            <div className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-0.5">{s.value}</div>
                            <div className="text-xs text-text-muted mb-1">{s.label}</div>
                            <div className="text-xs text-success font-medium">{s.delta}</div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Continue Learning */}
                    <motion.div variants={item} className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-sora font-semibold text-lg text-text-primary dark:text-dark-text">Continue Learning</h2>
                            <Link href="/student/courses" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ChevronRight size={14} /></Link>
                        </div>

                        {inProgress.map((enr) => (
                            <Link key={enr.id} href={`/student/courses/${enr.courseId}`}>
                                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-dark-surface2 relative">
                                            {enr.course.thumbnail ? (
                                                <img
                                                    src={enr.course.thumbnail}
                                                    alt={enr.course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
                                                    <BookOpen size={24} className="text-white opacity-80" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-sm text-text-primary dark:text-dark-text truncate">{enr.course.title}</h3>
                                                <span className="text-xs text-text-faint whitespace-nowrap font-medium">{enr.progress}%</span>
                                            </div>
                                            <p className="text-xs text-text-muted mb-2">{enr.course.instructor.name}</p>
                                            <div className="w-full h-1.5 bg-border dark:bg-dark-border rounded-full overflow-hidden mb-2">
                                                <motion.div
                                                    className="h-full bg-primary rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${enr.progress}%` }}
                                                    transition={{ duration: 0.8, delay: 0.3 }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-text-faint">{enr.completedLessons.length} lessons completed</span>
                                                <span className="text-xs text-primary font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Play size={11} /> Continue
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </motion.div>

                    {/* Weekly Activity Chart */}
                    <motion.div variants={item} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Weekly Activity</h2>
                        <ResponsiveContainer width="100%" height={140}>
                            <AreaChart data={stats.weeklyActivity} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2E3A8C" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2E3A8C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                                    formatter={(v: any) => [`${v}h`, 'Hours']}
                                />
                                <Area type="monotone" dataKey="hours" stroke="#2E3A8C" strokeWidth={2} fill="url(#activityGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="mt-3 pt-3 border-t border-border dark:border-dark-border flex items-center justify-between text-xs text-text-muted">
                            <span>Total this week</span>
                            <span className="font-semibold text-text-primary dark:text-dark-text">
                                {stats.weeklyActivity.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
                            </span>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upcoming Live Classes */}
                    <motion.div variants={item} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Live Classes</h2>
                            <Link href="/student/live-classes" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></Link>
                        </div>

                        {liveNow.map(lc => (
                            <div key={lc.id} className="mb-3 p-3 rounded-xl border-2 border-accent/30 bg-accent/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex items-center gap-1 text-xs font-bold text-accent">
                                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" /> LIVE NOW
                                    </span>
                                </div>
                                <p className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1">{lc.title}</p>
                                <p className="text-xs text-text-muted mb-2">{lc.instructor.name} · {lc.attendees} attending</p>
                                <Link href={`/student/live-classes/${lc.id}`}>
                                    <button className="w-full py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors">
                                        Join Now
                                    </button>
                                </Link>
                            </div>
                        ))}

                        {upcoming.map(lc => (
                            <div key={lc.id} className="flex items-center gap-3 py-3 border-b border-border dark:border-dark-border last:border-0">
                                <div className="w-10 h-10 rounded-xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={15} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate">{lc.title}</p>
                                    <p className="text-xs text-text-muted">{formatDate(lc.date)} · {formatTime(lc.date)}</p>
                                </div>
                                <Link href={`/student/live-classes/${lc.id}`}>
                                    <button className="text-xs px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary-tint transition-colors font-medium whitespace-nowrap">
                                        Details
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </motion.div>

                    {/* Upcoming Quizzes + Achievements */}
                    <motion.div variants={item} className="space-y-4">
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Upcoming Quizzes</h2>
                                <Link href="/student/quizzes" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></Link>
                            </div>

                            {upcomingQuizzes.map(quiz => (
                                <div key={quiz.id} className="flex items-center gap-3 py-3 border-b border-border dark:border-dark-border last:border-0">
                                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                        <FileQuestion size={15} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate">{quiz.title}</p>
                                        <p className="text-xs text-text-muted">{quiz.questions.length} questions · {quiz.duration} min</p>
                                    </div>
                                    <Link href={`/student/quizzes/${quiz.id}`}>
                                        <motion.button
                                            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Start
                                        </motion.button>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Recent Badges */}
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Recent Achievements</h2>
                                <Link href="/student/progress" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></Link>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {userBadges.map((ub, i) => (
                                    <motion.div
                                        key={ub.badgeId}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-background dark:hover:bg-dark-bg transition-colors cursor-pointer group"
                                        title={ub.badge.name}
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{ub.badge.icon}</span>
                                        <span className="text-xs text-text-faint text-center leading-tight line-clamp-2">{ub.badge.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AppLayout>
    )
}
