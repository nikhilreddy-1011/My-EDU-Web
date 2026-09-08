'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, BookOpen, TrendingUp, Star, Plus, Video, FileQuestion, BarChart3, ArrowRight, ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { teacherStats, courses, liveClasses as fallbackClasses, quizAttempts, students } from '@/data/mock-data'
import { getLiveClasses } from '@/lib/api/live-classes'
import { connectSocket } from '@/lib/socket'
import { formatNumber, formatDate, formatTime, cn } from '@/lib/utils'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function TeacherDashboard() {
    const stats = teacherStats
    const teacherCourses = courses.filter(c => c.instructorId === 't1' && c.status === 'PUBLISHED')
    const [upcoming, setUpcoming] = React.useState<any[]>(
        fallbackClasses.filter(lc => lc.status === 'UPCOMING').slice(0, 3)
    )

    const fetchTeacherClasses = () => {
        getLiveClasses()
            .then(res => {
                if (res && res.success && Array.isArray(res.classes) && res.classes.length > 0) {
                    const mapped = res.classes
                        .filter(c => c.status === 'UPCOMING')
                        .slice(0, 4)
                        .map(c => ({
                            id: c.meetingId || c._id,
                            meetingId: c.meetingId || c._id,
                            _id: c._id,
                            title: c.title,
                            date: c.scheduledAt,
                            status: c.status,
                            attendees: c.attendeesCount || 0,
                        }))
                    setUpcoming(mapped)
                }
            })
            .catch(() => {})
    }

    React.useEffect(() => {
        fetchTeacherClasses()

        const socket = connectSocket()
        const onScheduled = () => fetchTeacherClasses()
        const onStatus = () => fetchTeacherClasses()

        socket.on('live_class_scheduled', onScheduled)
        socket.on('live_class_status_changed', onStatus)

        return () => {
            socket.off('live_class_scheduled', onScheduled)
            socket.off('live_class_status_changed', onStatus)
        }
    }, [])

    const statCards = [
        { label: 'Total Students', value: formatNumber(stats.totalStudents), icon: <Users size={18} />, color: 'text-primary', bg: 'bg-primary-tint dark:bg-dark-surface2', delta: '+1.2K this month' },
        { label: 'Active Courses', value: stats.activeCourses, icon: <BookOpen size={18} />, color: 'text-success', bg: 'bg-green-50 dark:bg-green-900/10', delta: '1 in draft' },
        { label: 'Avg Rating', value: stats.averageRating.toFixed(1), icon: <Star size={18} />, color: 'text-warning', bg: 'bg-yellow-50 dark:bg-yellow-900/10', delta: '⭐ Top 5%' },
        { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: <TrendingUp size={18} />, color: 'text-accent', bg: 'bg-orange-50 dark:bg-orange-900/10', delta: '+4% vs last month' },
    ]

    const engagementData = [
        { name: 'Mon', views: 420, completions: 180 },
        { name: 'Tue', views: 580, completions: 240 },
        { name: 'Wed', views: 360, completions: 150 },
        { name: 'Thu', views: 720, completions: 320 },
        { name: 'Fri', views: 640, completions: 280 },
        { name: 'Sat', views: 820, completions: 390 },
        { name: 'Sun', views: 550, completions: 220 },
    ]

    return (
        <AppLayout>
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-sora font-bold text-2xl md:text-3xl text-text-primary dark:text-dark-text">
                            Welcome back, Professor 👋
                        </h1>
                        <p className="text-text-muted mt-1">Here&apos;s how your courses are performing today.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/teacher/courses/create">
                            <motion.button className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Plus size={16} /> Create Course
                            </motion.button>
                        </Link>
                        <Link href="/teacher/live-classes">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text-muted text-sm font-medium rounded-xl hover:border-primary/30 transition-colors">
                                <Video size={16} /> Schedule Class
                            </button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div key={s.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 hover:shadow-card transition-all">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                                <span className={s.color}>{s.icon}</span>
                            </div>
                            <div className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-0.5">{s.value}</div>
                            <div className="text-xs text-text-muted mb-1">{s.label}</div>
                            <div className="text-xs text-success font-medium">{s.delta}</div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Enrollment trend */}
                    <motion.div variants={item} className="lg:col-span-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Enrollment Trend</h2>
                            <Link href="/teacher/analytics" className="text-xs text-primary flex items-center gap-1 hover:underline">Full analytics <ChevronRight size={14} /></Link>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={stats.enrollmentTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2E3A8C" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2E3A8C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="value" stroke="#2E3A8C" strokeWidth={2} fill="url(#enrollGrad)" name="Enrollments" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Top Courses */}
                    <motion.div variants={item} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Top Courses</h2>
                            <Link href="/teacher/courses" className="text-xs text-primary hover:underline">View all</Link>
                        </div>
                        <div className="space-y-3">
                            {stats.topCourses.map((tc, i) => (
                                <div key={tc.courseId} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-faint w-5">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text-primary dark:text-dark-text truncate">{tc.title}</p>
                                        <p className="text-xs text-text-muted">{formatNumber(tc.students)} students</p>
                                    </div>
                                    <div className="flex items-center gap-0.5 text-xs text-warning font-semibold">
                                        ⭐ {tc.rating}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weekly engagement */}
                    <motion.div variants={item} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Student Engagement</h2>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={engagementData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                <Bar dataKey="views" fill="#EEF0FB" radius={[4, 4, 0, 0]} name="Views" />
                                <Bar dataKey="completions" fill="#2E3A8C" radius={[4, 4, 0, 0]} name="Completions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Upcoming live classes */}
                    <motion.div variants={item} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Upcoming Classes</h2>
                            <Link href="/teacher/live-classes" className="text-xs text-primary hover:underline">Manage</Link>
                        </div>
                        {upcoming.map(lc => (
                            <div key={lc.id} className="flex items-center gap-3 py-3 border-b border-border dark:border-dark-border last:border-0">
                                <div className="w-10 h-10 rounded-xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center flex-shrink-0">
                                    <Video size={16} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate">{lc.title}</p>
                                    <p className="text-xs text-text-muted">{formatDate(lc.date)} · {formatTime(lc.date)}</p>
                                </div>
                                <span className="text-xs text-text-faint">{lc.attendees} registered</span>
                            </div>
                        ))}
                        <Link href="/teacher/live-classes">
                            <button className="w-full mt-3 py-2 border border-dashed border-border dark:border-dark-border rounded-xl text-text-muted text-xs hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-1">
                                <Plus size={12} /> Schedule New Class
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Recent student activity */}
                <motion.div variants={item} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text">Recent Student Activity</h2>
                        <Link href="/teacher/students" className="text-xs text-primary hover:underline flex items-center gap-1">All students <ArrowRight size={12} /></Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border dark:border-dark-border">
                                    <th className="text-left py-2 pr-4 text-xs font-medium text-text-muted">Student</th>
                                    <th className="text-left py-2 pr-4 text-xs font-medium text-text-muted hidden sm:table-cell">Course</th>
                                    <th className="text-left py-2 pr-4 text-xs font-medium text-text-muted hidden md:table-cell">Progress</th>
                                    <th className="text-left py-2 text-xs font-medium text-text-muted">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.slice(0, 5).map(student => (
                                    <tr key={student.id} className="border-b border-border dark:border-dark-border last:border-0 hover:bg-background dark:hover:bg-dark-bg transition-colors">
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-text-primary dark:text-dark-text text-xs">{student.name}</p>
                                                    <p className="text-text-faint text-xs hidden sm:block">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-xs text-text-muted hidden sm:table-cell">React & Next.js</td>
                                        <td className="py-3 pr-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-20 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.random() > 0.5 ? 65 : 35}%` }} />
                                                </div>
                                                <span className="text-xs text-text-faint">active</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success font-medium">Active</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    )
}
