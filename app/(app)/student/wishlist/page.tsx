'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
    Heart, Trash2, ArrowRight, BookOpen, Star, Clock, 
    Compass, Play, Sparkles 
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { getWishlist, removeFromWishlist, WishlistCourse } from '@/lib/api/wishlist'
import { formatPrice, formatNumber, cn } from '@/lib/utils'

export default function WishlistPage() {
    const { isAuthenticated } = useAuthStore()
    const [wishlist, setWishlist] = useState<WishlistCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchWishlist = async () => {
        setIsLoading(true)
        try {
            const res = await getWishlist()
            if (res.success) {
                setWishlist(res.wishlist || [])
            }
        } catch (err) {
            console.error('Failed to load wishlist:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist()
        } else {
            setIsLoading(false)
        }
    }, [isAuthenticated])

    const handleRemove = async (courseId: string) => {
        try {
            await removeFromWishlist(courseId)
            setWishlist(prev => prev.filter(item => item._id !== courseId))
        } catch (err) {
            console.error('Failed to remove from wishlist:', err)
        }
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto pb-16 font-sans">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sora flex items-center gap-2.5">
                                <Heart className="text-rose-500 fill-rose-500" size={28} />
                                My Wishlist
                            </h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                {wishlist.length} Saved
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Courses you saved to learn later. Enroll anytime to start your learning path.
                        </p>
                    </div>

                    <Link
                        href="/student/courses"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm self-start sm:self-auto"
                    >
                        <Compass size={16} />
                        Explore More Courses
                    </Link>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-72 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200/60 dark:border-white/[0.06]" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && wishlist.length === 0 && (
                    <div className="text-center py-20 bg-white/70 dark:bg-white/[0.02] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-8">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                            <Heart size={32} />
                        </div>
                        <h3 className="font-sora font-bold text-slate-900 dark:text-white text-lg mb-2">
                            Your Wishlist is Empty
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                            Save interesting courses by tapping the heart icon on any course card to easily find and enroll in them later.
                        </p>
                        <Link
                            href="/student/courses"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                        >
                            <Compass size={16} />
                            Browse Courses
                        </Link>
                    </div>
                )}

                {/* Wishlist Grid */}
                {!isLoading && wishlist.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((course, index) => {
                            const isFree = course.isFree || course.price === 0

                            return (
                                <motion.div
                                    key={course.wishlistId || course._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 flex flex-col"
                                >
                                    {/* Thumbnail Header */}
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
                                                style={{ background: `linear-gradient(135deg, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][index % 5]}22 0%, ${['#2E3A8C', '#FF6B4A', '#1FA97D', '#E7A93B', '#9B59B6'][index % 5]}44 100%)` }}
                                            >
                                                <BookOpen size={40} className="opacity-40 text-primary" />
                                            </div>
                                        )}

                                        <div className="absolute top-2.5 left-2.5 z-10">
                                            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-xs">
                                                {course.category || 'General'}
                                            </span>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemove(course._id)}
                                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur-md text-rose-400 hover:text-white hover:bg-rose-600 transition-colors flex items-center justify-center border border-white/10 z-10"
                                            title="Remove from Wishlist"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-sora font-bold text-base text-slate-900 dark:text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                                            {course.instructor?.name || 'LearnSphere Instructor'}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                            <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                                {course.rating?.average || 4.8}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-0.5">
                                                <Clock size={12} />
                                                {course.totalDuration ? `${course.totalDuration}m` : '4h 30m'}
                                            </span>
                                        </div>

                                        {/* Pricing & CTA */}
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className={cn(
                                                    "text-base font-extrabold font-sora",
                                                    isFree ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                                )}>
                                                    {isFree ? 'Free' : formatPrice(course.price)}
                                                </span>
                                                {course.originalPrice && course.originalPrice > course.price && (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        {formatPrice(course.originalPrice)}
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                href={`/student/courses/${course._id}`}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                                            >
                                                <span>{isFree ? 'Enroll Now' : 'View Course'}</span>
                                                <ArrowRight size={13} />
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
