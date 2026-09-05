'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Filter, Star, Users, Clock, BookOpen, Bookmark, Award, ChevronDown } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { courses, categories } from '@/data/mock-data'
import { formatPrice, formatNumber, cn } from '@/lib/utils'
import { Course, CourseDifficulty } from '@/types'

const DIFFICULTIES: CourseDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const SORT_OPTIONS = ['Most Popular', 'Highest Rated', 'Newest', 'Price: Low to High', 'Price: High to Low']

export default function CoursesPage() {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [difficulty, setDifficulty] = useState<CourseDifficulty | 'ALL'>('ALL')
    const [sort, setSort] = useState('Most Popular')
    const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

    const published = courses.filter(c => c.status === 'PUBLISHED')

    const filtered = published.filter(c => {
        const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
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

    const toggleBookmark = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        setBookmarked(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const difficultyLabel = (d: CourseDifficulty) => d.charAt(0) + d.slice(1).toLowerCase()
    const difficultyBg = (d: string) => d === 'BEGINNER' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : d === 'INTERMEDIATE' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'

    return (
        <AppLayout title="Explore Courses">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Explore Courses</h1>
                    <p className="text-text-muted">{filtered.length} courses available</p>
                </div>

                {/* Filters */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search courses, topics, instructors..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder-text-faint text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    {/* Category + Difficulty + Sort */}
                    <div className="flex flex-wrap gap-2">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-1.5">
                            {categories.slice(0, 6).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                        category === cat
                                            ? 'bg-primary text-white'
                                            : 'bg-background dark:bg-dark-bg border border-border dark:border-dark-border text-text-muted hover:border-primary/30'
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {/* Difficulty */}
                        <div className="ml-auto flex items-center gap-2">
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value as CourseDifficulty | 'ALL')}
                                className="px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-muted focus:outline-none"
                            >
                                <option value="ALL">All Levels</option>
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{difficultyLabel(d)}</option>)}
                            </select>
                            <select
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-muted focus:outline-none"
                            >
                                {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Course Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                        <h3 className="font-semibold text-text-primary dark:text-dark-text mb-2">No courses found</h3>
                        <p className="text-text-muted text-sm">Try adjusting your search or filters</p>
                        <button onClick={() => { setSearch(''); setCategory('All'); setDifficulty('ALL') }} className="mt-4 text-sm text-primary hover:underline">
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <Link href={`/student/courses/${course.id}`}>
                                    <div className="group bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col">
                                        {/* Thumbnail */}
                                        <div className="relative h-40 overflow-hidden bg-dark-surface2">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                                                    style={{ background: `linear-gradient(135deg, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][i % 5]}22 0%, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][i % 5]}44 100%)` }}>
                                                    <BookOpen size={40} className="opacity-40" style={{ color: ['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][i % 5] }} />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 z-10">
                                                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/90 text-white">{course.category}</span>
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button
                                                    onClick={(e) => toggleBookmark(course.id, e)}
                                                    className={cn(
                                                        'w-7 h-7 rounded-md flex items-center justify-center backdrop-blur-sm transition-colors',
                                                        bookmarked.has(course.id) ? 'bg-accent text-white' : 'bg-surface/80 text-text-muted hover:text-accent'
                                                    )}
                                                >
                                                    <Bookmark size={13} className={bookmarked.has(course.id) ? 'fill-white' : ''} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <h3 className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1 line-clamp-2 leading-tight flex-1">
                                                {course.title}
                                            </h3>
                                            <p className="text-text-faint text-xs mb-2">{course.instructor.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-text-muted mb-2 flex-wrap">
                                                <span className="flex items-center gap-0.5"><Star size={11} className="fill-warning text-warning" />{course.rating}</span>
                                                <span>({formatNumber(course.reviewCount)})</span>
                                                <span className="flex items-center gap-0.5"><Users size={11} />{formatNumber(course.studentCount)}</span>
                                                <span className="flex items-center gap-0.5"><Clock size={11} />{course.duration}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border dark:border-dark-border">
                                                <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', difficultyBg(course.difficulty))}>
                                                    {difficultyLabel(course.difficulty)}
                                                </span>
                                                <span className={cn('text-sm font-bold', course.price === 0 ? 'text-success' : 'text-text-primary dark:text-dark-text')}>
                                                    {formatPrice(course.price)}
                                                </span>
                                            </div>
                                            {course.certificate && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-text-faint">
                                                    <Award size={11} /> Certificate included
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
