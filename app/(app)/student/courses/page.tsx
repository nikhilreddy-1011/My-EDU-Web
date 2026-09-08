'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Star, Users, Clock, BookOpen, Heart, Award, Play, ShieldCheck, Sparkles } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { courses as mockCourses, categories } from '@/data/mock-data'
import { formatPrice, formatNumber, cn } from '@/lib/utils'
import { CourseDifficulty } from '@/types'
import { getCourses } from '@/lib/api/courses'
import { getMyEnrollments } from '@/lib/api/enrollments'
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/api/wishlist'
import { useAuthStore } from '@/store/use-auth-store'
import { toast } from 'sonner'

const DIFFICULTIES: CourseDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const SORT_OPTIONS = ['Most Popular', 'Highest Rated', 'Newest', 'Price: Low to High', 'Price: High to Low']

export default function CoursesPage() {
    const { isAuthenticated } = useAuthStore()
    const [coursesList, setCoursesList] = useState<any[]>([])
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [difficulty, setDifficulty] = useState<CourseDifficulty | 'ALL'>('ALL')
    const [sort, setSort] = useState('Most Popular')
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        let isMounted = true

        const loadData = async () => {
            let fetchedCourses: any[] = []
            try {
                const res = await getCourses()
                if (res && res.success && Array.isArray(res.courses) && res.courses.length > 0) {
                    fetchedCourses = res.courses.map(c => ({
                        id: c._id,
                        _id: c._id,
                        title: c.title,
                        thumbnail: c.thumbnail,
                        category: c.category,
                        difficulty: c.level || 'BEGINNER',
                        instructor: {
                            name: c.instructor?.name || 'Instructor',
                        },
                        price: c.price,
                        originalPrice: c.originalPrice || 0,
                        isFree: (c as any).isFree || c.price === 0,
                        rating: c.rating?.average || 4.8,
                        reviewCount: c.rating?.count || 120,
                        studentCount: c.studentCount || 0,
                        duration: c.totalDuration ? `${c.totalDuration} min` : '4h 30m',
                        certificate: true,
                        status: c.published ? 'PUBLISHED' : 'DRAFT',
                        createdAt: c.createdAt || new Date().toISOString(),
                    }))
                }
            } catch {
                // Fallback to mock data if API is offline
            }

            if (fetchedCourses.length === 0) {
                fetchedCourses = mockCourses.map(c => ({
                    ...c,
                    _id: c.id,
                    originalPrice: (c as any).originalPrice || 0,
                    isFree: c.price === 0,
                }))
            }

            if (isMounted) {
                setCoursesList(fetchedCourses)
            }

            // Fetch user enrollments if authenticated
            if (isAuthenticated) {
                try {
                    const enrollRes = await getMyEnrollments()
                    if (enrollRes && enrollRes.success && Array.isArray(enrollRes.enrollments)) {
                        const enrolledIds = new Set<string>()
                        enrollRes.enrollments.forEach((e: any) => {
                            if (e.course?._id) enrolledIds.add(e.course._id)
                            if (e.courseId) enrolledIds.add(e.courseId)
                            if (typeof e.course === 'string') enrolledIds.add(e.course)
                        })
                        if (isMounted) {
                            setEnrolledCourseIds(enrolledIds)
                        }
                    }
                } catch {
                    // Ignore enrollment fetch errors
                }

                try {
                    const wRes = await getWishlist()
                    if (wRes && wRes.success && Array.isArray(wRes.wishlist)) {
                        const wIds = new Set<string>()
                        wRes.wishlist.forEach((item: any) => {
                            if (item.course?._id) wIds.add(item.course._id)
                            if (typeof item.course === 'string') wIds.add(item.course)
                        })
                        if (isMounted) {
                            setWishlistIds(wIds)
                        }
                    }
                } catch {
                    // Ignore wishlist fetch errors
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [isAuthenticated])

    const published = coursesList.filter(c => c.status === 'PUBLISHED')

    const filtered = published.filter(c => {
        const matchSearch = !search ||
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.category.toLowerCase().includes(search.toLowerCase())
        const matchCategory = category === 'All' || c.category === category
        const matchDifficulty = difficulty === 'ALL' || c.difficulty === difficulty
        return matchSearch && matchCategory && matchDifficulty
    }).sort((a, b) => {
        if (sort === 'Highest Rated') return b.rating - a.rating
        if (sort === 'Newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sort === 'Price: Low to High') return a.price - b.price
        if (sort === 'Price: High to Low') return b.price - a.price
        return b.studentCount - a.studentCount
    })

    const toggleWishlist = async (courseId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isAuthenticated) {
            toast.error('Please sign in to save courses to your wishlist')
            return
        }

        const isSaved = wishlistIds.has(courseId)
        setWishlistIds(prev => {
            const next = new Set(prev)
            if (isSaved) next.delete(courseId)
            else next.add(courseId)
            return next
        })

        try {
            if (isSaved) {
                await removeFromWishlist(courseId)
                toast.success('Removed from wishlist')
            } else {
                await addToWishlist(courseId)
                toast.success('Added to wishlist ❤️')
            }
        } catch (err: any) {
            setWishlistIds(prev => {
                const next = new Set(prev)
                if (isSaved) next.add(courseId)
                else next.delete(courseId)
                return next
            })
            toast.error(err.message || 'Failed to update wishlist')
        }
    }

    const difficultyLabel = (d: CourseDifficulty) => d.charAt(0) + d.slice(1).toLowerCase()
    const difficultyBg = (d: string) =>
        d === 'BEGINNER' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
        d === 'INTERMEDIATE' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'

    return (
        <AppLayout title="Explore Courses">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-indigo-300 text-xs font-semibold mb-2 border border-primary/15">
                            <Sparkles size={13} className="text-primary dark:text-indigo-400" /> Curated Catalog
                        </div>
                        <h1 className="font-sans font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
                            Explore Courses
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            {filtered.length} world-class interactive courses available
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 dark:bg-[#121524]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-sm">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search courses, topics, instructors..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-sans"
                        />
                    </div>

                    {/* Category + Difficulty + Sort */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                        {/* Categories Horizontal Scroll */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap select-none font-sans',
                                        category === cat
                                            ? 'bg-primary text-white font-semibold shadow-xs'
                                            : 'bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Difficulty & Sort Dropdowns */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value as CourseDifficulty | 'ALL')}
                                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 focus:outline-none font-sans cursor-pointer"
                            >
                                <option value="ALL">All Levels</option>
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{difficultyLabel(d)}</option>)}
                            </select>
                            <select
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 focus:outline-none font-sans cursor-pointer"
                            >
                                <option value="Most Popular">Most Popular</option>
                                <option value="Highest Rated">Highest Rated</option>
                                <option value="Newest">Newest</option>
                                <option value="Price: Low to High">Price: Low to High</option>
                                <option value="Price: High to Low">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Course Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/60 dark:border-white/[0.06]">
                        <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base mb-1">No courses found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your search query or selected category</p>
                        <button
                            onClick={() => { setSearch(''); setCategory('All'); setDifficulty('ALL') }}
                            className="mt-4 text-xs font-semibold text-primary hover:underline"
                        >
                            Reset all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filtered.map((course, i) => {
                            const isEnrolled = enrolledCourseIds.has(course.id) || enrolledCourseIds.has(course._id)
                            const isFree = course.isFree || course.price === 0

                            return (
                                <motion.div
                                    key={course.id || course._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                >
                                    <Link href={`/student/courses/${course.id || course._id}`}>
                                        <div className="group bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col">
                                            {/* Thumbnail */}
                                            <div className="relative h-44 overflow-hidden bg-slate-900">
                                                {course.thumbnail ? (
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
                                                        style={{ background: `linear-gradient(135deg, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][i % 5]}22 0%, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][i % 5]}44 100%)` }}
                                                    >
                                                        <BookOpen size={40} className="opacity-40" style={{ color: ['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][i % 5] }} />
                                                    </div>
                                                )}
                                                {/* Category Badge */}
                                                <div className="absolute top-2.5 left-2.5 z-10">
                                                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-xs">
                                                        {course.category}
                                                    </span>
                                                </div>
                                                {/* Wishlist Heart */}
                                                <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
                                                    <button
                                                        onClick={(e) => toggleWishlist(course.id || course._id, e)}
                                                        className={cn(
                                                            'w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-xs',
                                                            wishlistIds.has(course.id || course._id) 
                                                                ? 'bg-rose-500 text-white' 
                                                                : 'bg-slate-900/70 text-slate-300 hover:text-rose-400 hover:bg-slate-900'
                                                        )}
                                                        title={wishlistIds.has(course.id || course._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                                    >
                                                        <Heart 
                                                            size={14} 
                                                            className={wishlistIds.has(course.id || course._id) ? 'fill-white text-white' : ''} 
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-4 flex flex-col flex-1">
                                                <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">
                                                    {course.title}
                                                </h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mb-2.5 font-sans">
                                                    {course.instructor?.name || 'Instructor'}
                                                </p>

                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
                                                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                                        <Star size={11} className="fill-amber-400 text-amber-400" />{course.rating}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Users size={11} />{formatNumber(course.studentCount)}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock size={11} />{course.duration}
                                                    </span>
                                                </div>

                                                {/* Price and Action Row */}
                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/[0.06] gap-2">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', difficultyBg(course.difficulty))}>
                                                                {difficultyLabel(course.difficulty)}
                                                            </span>
                                                            <span className={cn('text-sm font-extrabold font-sans', isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')}>
                                                                {isFree ? 'Free' : formatPrice(course.price)}
                                                            </span>
                                                            {course.originalPrice && course.originalPrice > course.price ? (
                                                                <>
                                                                    <span className="text-[11px] text-slate-400 line-through font-normal">
                                                                        {formatPrice(course.originalPrice)}
                                                                    </span>
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                                                                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                                                                    </span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    {/* Contextual Action Button */}
                                                    <div className="flex-shrink-0">
                                                        {isEnrolled ? (
                                                            <span className="text-xs font-semibold text-primary dark:text-indigo-300 flex items-center gap-1 bg-primary/10 dark:bg-primary/20 px-2.5 py-1.5 rounded-xl border border-primary/20">
                                                                <Play size={11} /> Continue
                                                            </span>
                                                        ) : isFree ? (
                                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                                                                <Sparkles size={11} /> Enroll
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-white flex items-center gap-1 bg-accent hover:bg-accent-hover px-2.5 py-1.5 rounded-xl shadow-xs transition-colors">
                                                                <ShieldCheck size={11} /> Purchase
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {course.certificate && (
                                                    <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400 font-sans">
                                                        <Award size={11} className="text-amber-500" /> Certificate included
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
