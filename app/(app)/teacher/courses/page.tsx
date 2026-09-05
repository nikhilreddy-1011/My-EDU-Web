'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, BookOpen, Users, Star, Edit, Eye, Trash2, BarChart3, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { courses } from '@/data/mock-data'
import { formatNumber, formatPrice, formatDate, cn } from '@/lib/utils'
import { Course } from '@/types'

export default function TeacherCoursesPage() {
    const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL')
    const teacherCourses = courses.filter(c => c.instructorId === 't1')
    const filtered = filter === 'ALL' ? teacherCourses : teacherCourses.filter(c => c.status === filter)

    const counts = {
        ALL: teacherCourses.length,
        PUBLISHED: teacherCourses.filter(c => c.status === 'PUBLISHED').length,
        DRAFT: teacherCourses.filter(c => c.status === 'DRAFT').length,
        ARCHIVED: teacherCourses.filter(c => c.status === 'ARCHIVED').length,
    }

    return (
        <AppLayout title="My Courses">
            <div className="max-w-6xl mx-auto space-y-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">My Courses</h1>
                        <p className="text-text-muted">{teacherCourses.length} courses in total</p>
                    </div>
                    <Link href="/teacher/courses/create">
                        <motion.button className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            <Plus size={16} /> Create New Course
                        </motion.button>
                    </Link>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl w-fit">
                    {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map(k => (
                        <button key={k} onClick={() => setFilter(k)}
                            className={cn('px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                                filter === k ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text'
                            )}>
                            {k === 'ALL' ? 'All' : k.charAt(0) + k.slice(1).toLowerCase()}
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filter === k ? 'bg-white/20' : 'bg-border dark:bg-dark-border')}>{counts[k]}</span>
                        </button>
                    ))}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Students', value: formatNumber(teacherCourses.reduce((s, c) => s + c.studentCount, 0)), icon: <Users size={14} /> },
                        { label: 'Avg Rating', value: (teacherCourses.reduce((s, c) => s + c.rating, 0) / teacherCourses.length).toFixed(1), icon: <Star size={14} /> },
                        { label: 'Total Revenue (est.)', value: `₹${formatNumber(teacherCourses.reduce((s, c) => s + c.price * Math.floor(c.studentCount * 0.4), 0))}`, icon: <BarChart3 size={14} /> },
                        { label: 'Reviews', value: formatNumber(teacherCourses.reduce((s, c) => s + c.reviewCount, 0)), icon: <Star size={14} /> },
                    ].map(s => (
                        <div key={s.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl p-3 flex items-center gap-3">
                            <span className="text-primary">{s.icon}</span>
                            <div>
                                <p className="font-semibold text-text-primary dark:text-dark-text text-sm">{s.value}</p>
                                <p className="text-text-faint text-xs">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Course table */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-border dark:divide-dark-border">
                        {filtered.map((course, i) => (
                            <motion.div key={course.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-4 p-4 hover:bg-background dark:hover:bg-dark-bg transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-dark-surface2 flex-shrink-0 overflow-hidden relative">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary-tint dark:bg-dark-surface2">
                                            <BookOpen size={20} className="text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <p className="font-semibold text-sm text-text-primary dark:text-dark-text truncate">{course.title}</p>
                                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                                            course.status === 'PUBLISHED' ? 'bg-success/10 text-success' :
                                                course.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                    'bg-border text-text-muted'
                                        )}>
                                            {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                                        <span className="flex items-center gap-1"><Users size={10} />{formatNumber(course.studentCount)}</span>
                                        <span className="flex items-center gap-1"><Star size={10} className="fill-warning text-warning" />{course.rating}</span>
                                        <span>{course.category}</span>
                                        <span className="text-primary font-medium">{formatPrice(course.price)}</span>
                                        <span className="hidden sm:block">Updated {formatDate(course.updatedAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Link href={`/student/courses/${course.id}`}>
                                        <button className="p-2 rounded-lg text-text-faint hover:text-primary hover:bg-primary-tint transition-colors" title="Preview"><Eye size={15} /></button>
                                    </Link>
                                    <Link href={`/teacher/courses/${course.id}/edit`}>
                                        <button className="p-2 rounded-lg text-text-faint hover:text-primary hover:bg-primary-tint transition-colors" title="Edit"><Edit size={15} /></button>
                                    </Link>
                                    <Link href={`/teacher/courses/${course.id}/analytics`}>
                                        <button className="p-2 rounded-lg text-text-faint hover:text-success hover:bg-success/10 transition-colors" title="Analytics"><BarChart3 size={15} /></button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
