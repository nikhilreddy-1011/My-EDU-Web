'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Star, Users, Clock, Award, BookOpen, Video, FileText, FileQuestion,
    ChevronDown, ChevronUp, Lock, CheckCircle2, Play, Heart, Share2,
    Globe, BarChart2, ArrowLeft
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { courses, modulesForC1, enrollments, reviews } from '@/data/mock-data'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import { LessonType } from '@/types'

const lessonIcon = (type: LessonType) => {
    if (type === 'VIDEO') return <Video size={14} className="text-primary" />
    if (type === 'ARTICLE') return <FileText size={14} className="text-success" />
    if (type === 'PDF') return <FileText size={14} className="text-warning" />
    if (type === 'QUIZ') return <FileQuestion size={14} className="text-accent" />
    return <BookOpen size={14} />
}

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const course = courses.find(c => c.id === id)
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview')
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['m1']))
    const [wishlisted, setWishlisted] = useState(false)
    const enrollment = enrollments.find(e => e.courseId === id)
    const modules = id === 'c1' ? modulesForC1 : []

    if (!course) return (
        <AppLayout>
            <div className="text-center py-24">
                <BookOpen size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                <h2 className="font-sora font-bold text-xl mb-2">Course not found</h2>
                <Link href="/student/courses"><button className="text-primary hover:underline text-sm">Browse courses</button></Link>
            </div>
        </AppLayout>
    )

    const toggleModule = (id: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const tabs = ['overview', 'curriculum', 'instructor', 'reviews'] as const

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto">
                {/* Back */}
                <Link href="/student/courses">
                    <button className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
                        <ArrowLeft size={16} /> Back to Courses
                    </button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Hero */}
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden">
                            <div className="relative h-56 md:h-72 flex items-center justify-center overflow-hidden bg-dark-surface2">
                                {course.thumbnail ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <BookOpen size={64} className="text-white opacity-20" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                                    <div className="flex gap-2 mb-2 flex-wrap">
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-accent text-white">{course.category}</span>
                                        <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-md', course.difficulty === 'BEGINNER' ? 'bg-success text-white' : course.difficulty === 'INTERMEDIATE' ? 'bg-warning text-white' : 'bg-red-500 text-white')}>
                                            {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-2">{course.title}</h1>
                                <p className="text-text-muted text-sm leading-relaxed mb-4">{course.description}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
                                    <span className="flex items-center gap-1"><Star size={14} className="fill-warning text-warning" /><strong className="text-text-primary dark:text-dark-text">{course.rating}</strong> ({formatNumber(course.reviewCount)} reviews)</span>
                                    <span className="flex items-center gap-1"><Users size={14} />{formatNumber(course.studentCount)} students</span>
                                    <span className="flex items-center gap-1"><Clock size={14} />{course.duration}</span>
                                    <span className="flex items-center gap-1"><Globe size={14} />{course.language}</span>
                                    {course.certificate && <span className="flex items-center gap-1"><Award size={14} className="text-warning" />Certificate</span>}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center font-bold text-primary text-sm">
                                        {course.instructor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text-primary dark:text-dark-text">{course.instructor.name}</p>
                                        <p className="text-xs text-text-muted">{course.instructor.title}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden">
                            <div className="flex border-b border-border dark:border-dark-border">
                                {tabs.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            'flex-1 py-3 text-sm font-medium capitalize transition-colors',
                                            activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text'
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-5">
                                {/* Overview */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-text-primary dark:text-dark-text">What you&apos;ll learn</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {['Build production-ready React & Next.js apps', 'Master TypeScript for safer code', 'Implement authentication & authorization', 'Work with databases using Prisma ORM', 'Deploy apps to Vercel with CI/CD', 'Understand App Router & Server Components'].map(item => (
                                                <div key={item} className="flex items-start gap-2 text-sm text-text-muted">
                                                    <CheckCircle2 size={15} className="text-success mt-0.5 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border dark:border-dark-border">
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-2">Requirements</h3>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-text-muted">
                                                <li>Basic JavaScript knowledge</li>
                                                <li>HTML & CSS fundamentals</li>
                                                <li>Node.js installed on your machine</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Curriculum */}
                                {activeTab === 'curriculum' && (
                                    <div className="space-y-2">
                                        {modules.length === 0 ? (
                                            <p className="text-text-muted text-sm text-center py-8">Curriculum details coming soon!</p>
                                        ) : modules.map(mod => (
                                            <div key={mod.id} className="border border-border dark:border-dark-border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleModule(mod.id)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-background dark:hover:bg-dark-bg transition-colors text-left"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-sm text-text-primary dark:text-dark-text">{mod.title}</p>
                                                        <p className="text-xs text-text-muted">{mod.lessons.length} lessons</p>
                                                    </div>
                                                    {expandedModules.has(mod.id) ? <ChevronUp size={16} className="text-text-faint flex-shrink-0" /> : <ChevronDown size={16} className="text-text-faint flex-shrink-0" />}
                                                </button>
                                                {expandedModules.has(mod.id) && (
                                                    <div className="border-t border-border dark:border-dark-border">
                                                        {mod.lessons.map(lesson => (
                                                            <Link key={lesson.id} href={lesson.isLocked ? '#' : `/student/courses/${id}/lessons/${lesson.id}`}>
                                                                <div className={cn(
                                                                    'flex items-center gap-3 px-4 py-3 text-sm border-b border-border dark:border-dark-border last:border-0 transition-colors',
                                                                    lesson.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background dark:hover:bg-dark-bg cursor-pointer'
                                                                )}>
                                                                    <span>{lessonIcon(lesson.type)}</span>
                                                                    <span className={cn('flex-1 truncate', lesson.isCompleted ? 'text-text-faint line-through' : 'text-text-primary dark:text-dark-text')}>
                                                                        {lesson.title}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <span className="text-xs text-text-faint">{lesson.duration}</span>
                                                                        {lesson.isCompleted && <CheckCircle2 size={14} className="text-success" />}
                                                                        {lesson.isLocked && <Lock size={13} className="text-text-faint" />}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Instructor */}
                                {activeTab === 'instructor' && (
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center font-bold text-primary text-xl flex-shrink-0">
                                            {course.instructor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-0.5">{course.instructor.name}</h3>
                                            <p className="text-sm text-text-muted mb-3">{course.instructor.title}</p>
                                            <p className="text-sm text-text-muted leading-relaxed">{course.instructor.bio}</p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {course.instructor.expertise?.map(e => (
                                                    <span key={e} className="px-2 py-1 text-xs rounded-lg bg-primary-tint dark:bg-dark-surface2 text-primary font-medium">{e}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews */}
                                {activeTab === 'reviews' && (
                                    <div className="space-y-5">
                                        {/* Rating summary */}
                                        <div className="flex items-center gap-4 p-4 bg-background dark:bg-dark-bg rounded-xl">
                                            <div className="text-center">
                                                <div className="font-sora font-bold text-5xl text-primary">{course.rating}</div>
                                                <div className="flex gap-0.5 justify-center mt-1">
                                                    {Array(5).fill(0).map((_, i) => <Star key={i} size={12} className={cn('fill-warning text-warning', i >= Math.round(course.rating) && 'opacity-30')} />)}
                                                </div>
                                                <div className="text-xs text-text-muted mt-1">Course Rating</div>
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                {[5, 4, 3, 2, 1].map(star => (
                                                    <div key={star} className="flex items-center gap-2">
                                                        <div className="h-1.5 flex-1 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                                            <div className="h-full bg-warning rounded-full" style={{ width: star === 5 ? '72%' : star === 4 ? '18%' : star === 3 ? '7%' : '2%' }} />
                                                        </div>
                                                        <span className="text-xs text-text-faint w-4 text-right">{star}</span>
                                                        <Star size={10} className="fill-warning text-warning" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {reviews.filter(r => r.courseId === id).map(review => (
                                            <div key={review.id} className="flex gap-3 py-4 border-b border-border dark:border-dark-border last:border-0">
                                                <div className="w-9 h-9 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                                    {review.user.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-sm text-text-primary dark:text-dark-text">{review.user.name}</p>
                                                        <span className="text-xs text-text-faint">{formatDate(review.createdAt)}</span>
                                                    </div>
                                                    <div className="flex gap-0.5 mb-2">
                                                        {Array(review.rating).fill(0).map((_, i) => <Star key={i} size={12} className="fill-warning text-warning" />)}
                                                    </div>
                                                    <p className="text-sm text-text-muted leading-relaxed">{review.comment}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sticky sidebar */}
                    <div className="lg:sticky lg:top-6 h-fit space-y-4">
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 shadow-card">
                            <div className="text-3xl font-sora font-bold text-text-primary dark:text-dark-text mb-4">
                                {course.price === 0 ? <span className="text-success">Free</span> : `₹${course.price.toLocaleString('en-IN')}`}
                            </div>

                            {enrollment ? (
                                <Link href={`/student/courses/${id}/lessons/${enrollment.currentLessonId || 'l1'}`}>
                                    <motion.button
                                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mb-3"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Play size={16} /> Continue Learning
                                    </motion.button>
                                </Link>
                            ) : (
                                <motion.button
                                    className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 mb-3"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Enroll Now
                                </motion.button>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setWishlisted(!wishlisted)}
                                    className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors', wishlisted ? 'border-accent text-accent bg-accent/5' : 'border-border dark:border-dark-border text-text-muted hover:border-accent/30')}
                                >
                                    <Heart size={15} className={wishlisted ? 'fill-accent' : ''} />
                                    {wishlisted ? 'Wishlisted' : 'Wishlist'}
                                </button>
                                <button className="flex-1 py-2.5 rounded-xl border border-border dark:border-dark-border text-text-muted text-sm font-medium flex items-center justify-center gap-1.5 hover:border-primary/30 transition-colors">
                                    <Share2 size={15} /> Share
                                </button>
                            </div>

                            {enrollment && (
                                <div className="mt-4 pt-4 border-t border-border dark:border-dark-border">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-text-muted">Your progress</span>
                                        <span className="font-semibold text-primary">{enrollment.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${enrollment.progress}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-border dark:border-dark-border space-y-2 text-sm text-text-muted">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><BookOpen size={14} />{course.totalLessons} lessons</span>
                                    <span className="flex items-center gap-2"><Clock size={14} />{course.duration}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><BarChart2 size={14} />{course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}</span>
                                    <span className="flex items-center gap-2"><Globe size={14} />{course.language}</span>
                                </div>
                                {course.certificate && (
                                    <div className="flex items-center gap-2 text-warning">
                                        <Award size={14} /> Certificate of completion
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
