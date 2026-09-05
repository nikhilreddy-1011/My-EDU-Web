'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Star, DollarSign, Award, BarChart3, Globe, Clock } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { teacherStats, courses } from '@/data/mock-data'
import { formatNumber, cn } from '@/lib/utils'
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const PIE_COLORS = ['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6']

const categoryData = [
    { name: 'Web Development', students: 8420 },
    { name: 'Data Science', students: 5240 },
    { name: 'UI/UX Design', students: 3180 },
    { name: 'DevOps', students: 1860 },
    { name: 'Mobile Dev', students: 1200 },
]

const revenueData = [
    { month: 'Apr', revenue: 42000, prev: 38000 },
    { month: 'May', revenue: 58000, prev: 42000 },
    { month: 'Jun', revenue: 51000, prev: 58000 },
    { month: 'Jul', revenue: 74000, prev: 51000 },
    { month: 'Aug', revenue: 88000, prev: 74000 },
    { month: 'Sep', revenue: 95000, prev: 88000 },
]

export default function TeacherAnalyticsPage() {
    const stats = teacherStats
    const topStat = [
        { label: 'Total Revenue', value: `₹${formatNumber(stats.totalRevenue)}`, sub: '+22% this month', icon: <DollarSign size={18} />, color: 'text-success', bg: 'bg-green-50 dark:bg-green-900/10' },
        { label: 'Active Students', value: formatNumber(stats.totalStudents), sub: '124 new this month', icon: <Users size={18} />, color: 'text-primary', bg: 'bg-primary-tint dark:bg-dark-surface2' },
        { label: 'Completion Rate', value: `${stats.completionRate}%`, sub: '+4% vs last month', icon: <Award size={18} />, color: 'text-warning', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
        { label: 'Avg Watch Time', value: '18m', sub: 'per session', icon: <Clock size={18} />, color: 'text-accent', bg: 'bg-orange-50 dark:bg-orange-900/10' },
    ]

    return (
        <AppLayout title="Analytics">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Analytics</h1>
                    <p className="text-text-muted">Deep insights into your course performance and student engagement</p>
                </div>

                {/* Top stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {topStat.map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 hover:shadow-card transition-all">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                                <span className={s.color}>{s.icon}</span>
                            </div>
                            <div className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text">{s.value}</div>
                            <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
                            <div className="text-xs text-success font-medium mt-1">{s.sub}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue chart */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Revenue (₹) — MoM</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="prev" fill="var(--border)" radius={[4, 4, 0, 0]} name="Previous" />
                                <Bar dataKey="revenue" fill="#2E3A8C" radius={[4, 4, 0, 0]} name="Current" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Enrollment trend line */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Enrollment Trend</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={stats.enrollmentTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="value" stroke="#FF6B4A" strokeWidth={2.5} dot={{ r: 3, fill: '#FF6B4A' }} name="Enrollments" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category distribution */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Students by Category</h2>
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="students" paddingAngle={3}>
                                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => [formatNumber(v), 'students']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {categoryData.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                                        <span className="flex-1 text-text-muted truncate">{d.name}</span>
                                        <span className="font-semibold text-text-primary dark:text-dark-text">{formatNumber(d.students)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top courses performance */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                        <h2 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-4">Course Performance</h2>
                        <div className="space-y-4">
                            {stats.topCourses.map((tc, i) => (
                                <div key={tc.courseId}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs font-medium text-text-primary dark:text-dark-text truncate pr-4">{tc.title}</p>
                                        <span className="text-xs font-semibold text-primary flex-shrink-0">{formatNumber(tc.students)}</span>
                                    </div>
                                    <div className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(tc.students / stats.topCourses[0].students) * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-text-faint mt-0.5">
                                        <span>⭐ {tc.rating}</span>
                                        <span>{Math.round((tc.students / stats.topCourses[0].students) * 100)}% of top</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
