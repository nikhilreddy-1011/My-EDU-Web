'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Mail, TrendingUp, BookOpen, MoreHorizontal, MessageSquare, Filter } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { students, enrollments } from '@/data/mock-data'
import { formatDate, cn } from '@/lib/utils'

export default function TeacherStudentsPage() {
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('name')

    const data = students.map(s => ({
        ...s,
        coursesEnrolled: enrollments.filter(e => e.userId === s.id).length,
        avgProgress: enrollments.filter(e => e.userId === s.id).reduce((sum, e) => sum + e.progress, 0) / Math.max(enrollments.filter(e => e.userId === s.id).length, 1),
        lastActive: '2 days ago',
    })).filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))

    const sorted = [...data].sort((a, b) => {
        if (sortBy === 'progress') return b.avgProgress - a.avgProgress
        if (sortBy === 'courses') return b.coursesEnrolled - a.coursesEnrolled
        return a.name.localeCompare(b.name)
    })

    return (
        <AppLayout title="Students">
            <div className="max-w-6xl mx-auto space-y-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Students</h1>
                        <p className="text-text-muted">{students.length} students enrolled in your courses</p>
                    </div>
                </div>

                {/* Search + Sort */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text-muted text-sm focus:outline-none">
                        <option value="name">Sort by Name</option>
                        <option value="progress">Sort by Progress</option>
                        <option value="courses">Sort by Courses</option>
                    </select>
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Enrolled', value: students.length, icon: <Users size={14} /> },
                        { label: 'Active This Week', value: Math.round(students.length * 0.65), icon: <TrendingUp size={14} /> },
                        { label: 'Avg Completion', value: '58%', icon: <BookOpen size={14} /> },
                    ].map(s => (
                        <div key={s.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl p-3 flex items-center gap-3">
                            <span className="text-primary">{s.icon}</span>
                            <div>
                                <p className="font-semibold text-text-primary dark:text-dark-text">{s.value}</p>
                                <p className="text-xs text-text-muted">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Student table */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border dark:border-dark-border text-xs font-medium text-text-muted">
                        <span>Student</span>
                        <span className="hidden md:block text-center">Courses</span>
                        <span className="hidden lg:block text-center">Progress</span>
                        <span className="hidden sm:block text-center">Last Active</span>
                        <span>Actions</span>
                    </div>
                    {sorted.map((student, i) => (
                        <motion.div key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-border dark:border-dark-border last:border-0 hover:bg-background dark:hover:bg-dark-bg transition-colors">
                            {/* Name */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate">{student.name}</p>
                                    <p className="text-xs text-text-muted truncate">{student.email}</p>
                                </div>
                            </div>
                            {/* Courses */}
                            <span className="hidden md:flex items-center justify-center">
                                <span className="text-sm text-text-primary dark:text-dark-text font-medium">{student.coursesEnrolled}</span>
                            </span>
                            {/* Progress */}
                            <div className="hidden lg:flex items-center gap-2 w-28">
                                <div className="h-1.5 flex-1 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(student.avgProgress)}%` }} />
                                </div>
                                <span className="text-xs text-text-muted w-8">{Math.round(student.avgProgress)}%</span>
                            </div>
                            {/* Last Active */}
                            <span className="hidden sm:block text-xs text-text-muted text-center">{student.lastActive}</span>
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded-lg text-text-faint hover:text-primary hover:bg-primary-tint transition-colors" title="Message">
                                    <MessageSquare size={14} />
                                </button>
                                <button className="p-1.5 rounded-lg text-text-faint hover:text-primary hover:bg-primary-tint transition-colors" title="Email">
                                    <Mail size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}
