'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
    BookOpen, Play, CheckCircle2, Award, Clock, ArrowRight, 
    Search, Sparkles, MessageSquare, AlertCircle, Compass 
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { getMyCoursesList, MyCourseItem } from '@/lib/api/enrollments'
import { useAuthStore } from '@/store/use-auth-store'
import { cn } from '@/lib/utils'

export default function MyCoursesPage() {
    const { isAuthenticated } = useAuthStore()
    const [tab, setTab] = useState<'in_progress' | 'completed'>('in_progress')
    const [inProgress, setInProgress] = useState<MyCourseItem[]>([])
    const [completed, setCompleted] = useState<MyCourseItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        let isMounted = true

        const fetchCourses = async () => {
            setIsLoading(true)
            try {
                const res = await getMyCoursesList()
                if (isMounted && res.success) {
                    setInProgress(res.inProgress || [])
                    setCompleted(res.completed || [])
                }
            } catch (err) {
                console.error('Failed to load my courses:', err)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        if (isAuthenticated) {
            fetchCourses()
        } else {
            setIsLoading(false)
        }

        return () => {
            isMounted = false
        }
    }, [isAuthenticated])

    const currentList = tab === 'in_progress' ? inProgress : completed
    const filteredList = currentList.filter(item => {
        const title = item.title?.toLowerCase() || ''
        const instructor = item.instructor?.name?.toLowerCase() || ''
        const category = item.category?.toLowerCase() || ''
        const query = search.toLowerCase()
        return title.includes(query) || instructor.includes(query) || category.includes(query)
    })

    return (
        <AppLayout>
            <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sora">
                                My Courses
                            </h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                                {inProgress.length + completed.length} Enrolled
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Track your learning progress, resume lessons, and earn certificates.
                        </p>
                    </div>

                    <Link
                        href="/student/courses"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md self-start sm:self-auto"
                    >
                        <Compass size={16} />
                        Explore More Courses
                    </Link>
                </div>

                {/* Filter and Tab Bar */}
                <div className="bg-white/80 dark:bg-[#121422]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                    {/* Tabs */}
                    <div className="flex items-center p-1 bg-slate-100/80 dark:bg-white/[0.05] rounded-xl self-start md:self-auto">
                        <button
                            onClick={() => setTab('in_progress')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all select-none',
                                tab === 'in_progress'
                                    ? 'bg-white dark:bg-[#1A1D2E] text-slate-900 dark:text-white shadow-xs font-bold'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            )}
                        >
                            <Play size={13} className={tab === 'in_progress' ? 'text-primary fill-primary' : ''} />
                            In Progress
                            <span className={cn(
                                'px-1.5 py-0.2 rounded-full text-[10px]',
                                tab === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-slate-200/60 dark:bg-white/[0.1] text-slate-600 dark:text-slate-300'
                            )}>
                                {inProgress.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setTab('completed')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all select-none',
                                tab === 'completed'
                                    ? 'bg-white dark:bg-[#1A1D2E] text-slate-900 dark:text-white shadow-xs font-bold'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            )}
                        >
                            <CheckCircle2 size={13} className={tab === 'completed' ? 'text-emerald-500' : ''} />
                            Completed
                            <span className={cn(
                                'px-1.5 py-0.2 rounded-full text-[10px]',
                                tab === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200/60 dark:bg-white/[0.1] text-slate-600 dark:text-slate-300'
                            )}>
                                {completed.length}
                            </span>
                        </button>
                    </div>

                    {/* Search inside enrolled */}
                    <div className="relative w-full md:w-72">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter your enrolled courses..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-80 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200/60 dark:border-white/[0.06]" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredList.length === 0 && (
                    <div className="text-center py-20 bg-white/70 dark:bg-white/[0.02] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            {tab === 'in_progress' ? <BookOpen size={32} /> : <Award size={32} />}
                        </div>
                        <h3 className="font-sora font-bold text-slate-900 dark:text-white text-lg mb-2">
                            {tab === 'in_progress' 
                                ? (search ? 'No matching courses found' : 'No courses in progress')
                                : (search ? 'No matching completed courses' : 'No completed courses yet')}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                            {tab === 'in_progress'
                                ? 'Enrolling in a course unlocks full lesson access, direct teacher messaging, and verifiable certificates.'
                                : 'Complete 100% of course lessons to claim your verified certificate of completion!'}
                        </p>
                        <Link
                            href="/student/courses"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                        >
                            <Compass size={16} />
                            Browse All Courses
                        </Link>
                    </div>
                )}

                {/* Course Grid */}
                {!isLoading && filteredList.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredList.map((courseItem, index) => {
                            const progressPercent = Math.min(100, Math.max(0, Math.round(courseItem.progress || 0)))
                            const completedCount = courseItem.completedLessons || 0
                            const totalLessons = courseItem.totalLessons || 10

                            return (
                                <motion.div
                                    key={courseItem.enrollmentId || courseItem.courseId}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 flex flex-col"
                                >
                                    {/* Thumbnail Header */}
                                    <div className="relative h-44 overflow-hidden bg-slate-900">
                                        {courseItem.thumbnail ? (
                                            <img
                                                src={courseItem.thumbnail}
                                                alt={courseItem.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
                                                style={{ background: `linear-gradient(135deg, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][index % 5]}22 0%, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][index % 5]}44 100%)` }}
                                            >
                                                <BookOpen size={40} className="opacity-40 text-primary" />
                                            </div>
                                        )}

                                        {/* Badges */}
                                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                                            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-xs">
                                                {courseItem.category || 'Technology'}
                                            </span>
                                        </div>

                                        <div className="absolute top-2.5 right-2.5 z-10">
                                            {progressPercent === 100 ? (
                                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-400/20 shadow-xs flex items-center gap-1">
                                                    <CheckCircle2 size={12} />
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-primary/90 backdrop-blur-md text-white border border-primary/20 shadow-xs">
                                                    {progressPercent}% Done
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-sora font-bold text-base text-slate-900 dark:text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                            {courseItem.title}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                                            Instructor: <span className="font-semibold text-slate-700 dark:text-slate-300">{courseItem.instructor?.name || 'Instructor'}</span>
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {completedCount} of {totalLessons} lessons
                                                </span>
                                                <span className="font-bold text-primary dark:text-indigo-400">
                                                    {progressPercent}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        progressPercent === 100 
                                                            ? "bg-emerald-500" 
                                                            : "bg-gradient-to-r from-primary to-indigo-500"
                                                    )}
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                                            <Link
                                                href={`/student/courses/${courseItem.courseId}`}
                                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                                            >
                                                <Play size={13} className="fill-white" />
                                                {progressPercent === 100 ? 'Review Course' : 'Continue Learning'}
                                            </Link>

                                            {progressPercent === 100 && (
                                                <Link
                                                    href={`/student/certificates?courseId=${courseItem.courseId}`}
                                                    className="inline-flex items-center justify-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors border border-emerald-200/50 dark:border-emerald-500/20"
                                                    title="View Certificate"
                                                >
                                                    <Award size={16} />
                                                </Link>
                                            )}

                                            <Link
                                                href={`/student/messages?courseId=${courseItem.courseId}`}
                                                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors border border-slate-200/60 dark:border-white/[0.06]"
                                                title="Message Instructor"
                                            >
                                                <MessageSquare size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
