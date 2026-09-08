'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Award, Flame, BookOpen, Target, BarChart3 } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { userBadges } from '@/data/mock-data'
import { getStudentDashboard } from '@/lib/api/enrollments'
import { getMyQuizAttempts } from '@/lib/api/quizzes'
import { useAuthStore } from '@/store/use-auth-store'
import { cn } from '@/lib/utils'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts'

const radarData = [
    { subject: 'Web Dev', A: 85 },
    { subject: 'Design', A: 70 },
    { subject: 'Data Sci', A: 55 },
    { subject: 'DevOps', A: 30 },
    { subject: 'Mobile', A: 20 },
]

const initialStats = {
    overallProgress: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    totalEnrolled: 0,
    learningHours: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyActivity: [
        { day: 'Mon', hours: 0 },
        { day: 'Tue', hours: 0 },
        { day: 'Wed', hours: 0 },
        { day: 'Thu', hours: 0 },
        { day: 'Fri', hours: 0 },
        { day: 'Sat', hours: 0 },
        { day: 'Sun', hours: 0 },
    ],
}

export default function ProgressPage() {
    const { isAuthenticated } = useAuthStore()
    const [stats, setStats] = useState(initialStats)
    const [enrollmentList, setEnrollmentList] = useState<any[]>([])
    const [quizAttemptsList, setQuizAttemptsList] = useState<any[]>([])

    useEffect(() => {
        if (!isAuthenticated) return

        let isMounted = true
        getStudentDashboard()
            .then(res => {
                if (isMounted && res && res.success) {
                    if (res.stats) setStats(prev => ({ ...prev, ...res.stats }))
                    if (Array.isArray(res.enrollments)) setEnrollmentList(res.enrollments)
                    else if (Array.isArray(res.continueLearning)) setEnrollmentList(res.continueLearning)
                }
            })
            .catch(() => {})

        getMyQuizAttempts()
            .then(res => {
                if (isMounted && res && res.success && Array.isArray(res.attempts)) {
                    setQuizAttemptsList(res.attempts)
                }
            })
            .catch(() => {})

        return () => {
            isMounted = false
        }
    }, [isAuthenticated])

    const quizAverage = quizAttemptsList.length > 0
        ? Math.round(quizAttemptsList.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttemptsList.length)
        : 0

    const dynamicQuizScores = quizAttemptsList.length > 0
        ? quizAttemptsList.slice(0, 5).map(a => ({
            name: (a.quiz?.title || a.quizTitle || 'Quiz').slice(0, 12),
            score: a.score || 0,
            avg: a.passingScore || 70,
        }))
        : [
            { name: 'No Quizzes', score: 0, avg: 0 },
        ]

    const topStatCards = [
        { label: 'Overall Completion', value: `${stats.overallProgress}%`, icon: <Target size={18} />, color: 'text-primary', bg: 'bg-primary-tint dark:bg-dark-surface2' },
        { label: 'Learning Hours', value: `${stats.learningHours}h`, icon: <Clock size={18} />, color: 'text-warning', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
        { label: 'Quiz Average', value: `${quizAverage}%`, icon: <BarChart3 size={18} />, color: 'text-success', bg: 'bg-green-50 dark:bg-green-900/10' },
        { label: 'Courses Done', value: stats.coursesCompleted, icon: <BookOpen size={18} />, color: 'text-accent', bg: 'bg-orange-50 dark:bg-orange-900/10' },
        { label: 'Current Streak', value: `${stats.currentStreak}d`, icon: <Flame size={18} />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
        { label: 'Longest Streak', value: `${stats.longestStreak || stats.currentStreak}d`, icon: <TrendingUp size={18} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
    ]

    return (
        <AppLayout title="My Progress">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">My Progress</h1>
                    <p className="text-text-muted">Track your learning journey and achievements</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {topStatCards.map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 text-center hover:shadow-card transition-all">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2', s.bg)}>
                                <span className={s.color}>{s.icon}</span>
                            </div>
                            <div className="font-sora font-bold text-xl text-text-primary dark:text-dark-text">{s.value}</div>
                            <div className="text-xs text-text-muted mt-0.5 leading-tight">{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly activity */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Weekly Learning Activity</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={stats.weeklyActivity} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                <Bar dataKey="hours" fill="#2E3A8C" radius={[6, 6, 0, 0]} name="Hours" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quiz performance */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Quiz Performance vs Passing</h2>
                        {quizAttemptsList.length === 0 ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-center p-4">
                                <BarChart3 size={32} className="text-text-faint opacity-40 mb-2" />
                                <p className="text-xs text-text-muted">No quiz attempts yet. Complete a quiz to view your performance!</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={dynamicQuizScores} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="score" fill="#2E3A8C" radius={[4, 4, 0, 0]} name="Your Score" />
                                    <Bar dataKey="avg" fill="#9EA2B8" radius={[4, 4, 0, 0]} name="Passing Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Course completion */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Course Progress</h2>
                        {enrollmentList.length === 0 ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-center p-4">
                                <BookOpen size={32} className="text-text-faint opacity-40 mb-2" />
                                <p className="text-xs text-text-muted">No enrolled courses yet. Browse catalog to start learning!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {enrollmentList.slice(0, 4).map(enr => (
                                    <div key={enr.id || enr._id}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate pr-4">{enr.course?.title || 'Course'}</p>
                                            <span className="text-sm font-semibold text-primary flex-shrink-0">
                                                {enr.completedAt ? '100%' : `${enr.progress || 0}%`}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                            <motion.div
                                                className={cn('h-full rounded-full', enr.completedAt ? 'bg-success' : 'bg-primary')}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${enr.completedAt ? 100 : (enr.progress || 0)}%` }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Skill radar */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Skill Coverage</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar dataKey="A" stroke="#2E3A8C" fill="#2E3A8C" fillOpacity={0.2} name="Proficiency" />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Achievements */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                    <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Achievements</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {userBadges.map((ub, i) => (
                            <motion.div
                                key={ub.badgeId}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1, type: 'spring' }}
                                className="flex flex-col items-center p-4 rounded-xl border-2 border-border dark:border-dark-border hover:border-primary/30 hover:shadow-card transition-all group"
                            >
                                <motion.span className="text-4xl mb-2 group-hover:scale-110 transition-transform" whileHover={{ rotate: [0, -10, 10, 0] }}>
                                    {ub.badge.icon}
                                </motion.span>
                                <p className="font-semibold text-sm text-center text-text-primary dark:text-dark-text">{ub.badge.name}</p>
                                <p className="text-xs text-text-faint text-center mt-0.5">{ub.badge.description}</p>
                            </motion.div>
                        ))}
                        {/* Locked badges placeholder */}
                        {[...Array(4)].map((_, i) => (
                            <div key={`locked-${i}`} className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-border dark:border-dark-border opacity-40">
                                <span className="text-4xl mb-2 grayscale">🏅</span>
                                <p className="text-xs text-text-faint text-center">Locked</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
