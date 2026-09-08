'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Star, Users, Clock, Award, BookOpen, Video, FileText, FileQuestion,
    ChevronDown, ChevronUp, Lock, CheckCircle2, Play, Heart, Share2,
    Globe, BarChart2, ArrowLeft, Loader2, Sparkles, ShieldCheck, MessageSquare
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { courses as mockCourses, modulesForC1, enrollments as mockEnrollments, reviews } from '@/data/mock-data'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import { LessonType } from '@/types'
import { useAuthStore } from '@/store/use-auth-store'
import { getCourseById } from '@/lib/api/courses'
import { getMyEnrollments, enrollInCourse } from '@/lib/api/enrollments'
import { createPaymentOrder, verifyPayment } from '@/lib/api/payments'
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/lib/api/wishlist'
import { loadRazorpayScript, RazorpayOptions } from '@/lib/razorpay'
import { toast } from 'sonner'

const lessonIcon = (type: LessonType) => {
    if (type === 'VIDEO') return <Video size={14} className="text-primary" />
    if (type === 'ARTICLE') return <FileText size={14} className="text-success" />
    if (type === 'PDF') return <FileText size={14} className="text-warning" />
    if (type === 'QUIZ') return <FileQuestion size={14} className="text-accent" />
    return <BookOpen size={14} />
}

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user, isAuthenticated, token } = useAuthStore()

    const [course, setCourse] = useState<any>(null)
    const [isLoadingCourse, setIsLoadingCourse] = useState(true)
    const [enrollment, setEnrollment] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview')
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['m1', 'mod-0']))
    const [wishlisted, setWishlisted] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    // Helper to get active JWT token safely
    const getActiveToken = (): string | null => {
        if (token && typeof token === 'string' && token.trim().length > 0) {
            return token.trim()
        }
        if (typeof window !== 'undefined') {
            const ls = localStorage.getItem('ls_token')
            if (ls && ls.trim().length > 0) return ls.trim()
            try {
                const authData = localStorage.getItem('learnsphere-auth')
                if (authData) {
                    const parsed = JSON.parse(authData)
                    if (parsed?.state?.token && typeof parsed.state.token === 'string') {
                        return parsed.state.token.trim()
                    }
                }
            } catch {}
        }
        return null
    }

    // Load course and enrollment status
    useEffect(() => {
        let isMounted = true

        const loadData = async () => {
            setIsLoadingCourse(true)

            // 1. Try to fetch course from backend API
            let resolvedCourse = null
            try {
                const apiRes = await getCourseById(id)
                if (apiRes && apiRes.success && apiRes.course) {
                    const c = apiRes.course
                    resolvedCourse = {
                        id: c._id,
                        _id: c._id,
                        title: c.title,
                        description: c.description,
                        shortDescription: c.shortDescription || '',
                        thumbnail: c.thumbnail || '',
                        category: c.category,
                        difficulty: c.level || 'BEGINNER',
                        instructor: {
                            name: c.instructor?.name || 'Instructor',
                            title: c.instructor?.bio || 'Course Instructor',
                            bio: c.instructor?.bio || '',
                            avatar: c.instructor?.avatar || '',
                        },
                        price: c.price,
                        originalPrice: c.originalPrice || 0,
                        isFree: c.isFree || c.price === 0,
                        rating: c.rating?.average || 4.8,
                        reviewCount: c.rating?.count || 120,
                        studentCount: c.studentCount || 0,
                        duration: c.totalDuration ? `${c.totalDuration} min` : '4h 30m',
                        totalLessons: c.totalLessons || 0,
                        language: 'English',
                        certificate: true,
                        modules: c.modules && c.modules.length > 0 ? c.modules.map((m: any, mIdx: number) => ({
                            id: m._id || `m-${mIdx}`,
                            title: m.title,
                            description: m.description,
                            lessons: (m.lessons || []).map((l: any, lIdx: number) => ({
                                id: l._id || `l-${mIdx}-${lIdx}`,
                                title: l.title,
                                type: 'VIDEO' as LessonType,
                                duration: l.duration ? `${l.duration}m` : '10m',
                                isLocked: !l.isFree,
                                isFree: l.isFree,
                            })),
                        })) : [],
                    }
                }
            } catch {
                // If backend fetch fails, fallback to mock data
            }

            // Fallback to mock data if course not found in backend
            if (!resolvedCourse) {
                const mock = mockCourses.find(c => c.id === id)
                if (mock) {
                    resolvedCourse = {
                        ...mock,
                        _id: mock.id,
                        originalPrice: mock.originalPrice || 0,
                        isFree: mock.price === 0,
                        modules: id === 'c1' ? modulesForC1 : [],
                    }
                }
            }

            if (isMounted) {
                setCourse(resolvedCourse)
            }

            // 2. Resolve enrollment status
            let resolvedEnrollment = null
            if (isAuthenticated) {
                try {
                    const enrollRes = await getMyEnrollments()
                    if (enrollRes && enrollRes.success && Array.isArray(enrollRes.enrollments)) {
                        const found = enrollRes.enrollments.find(
                            (e: any) => e.course?._id === id || e.course === id || e.courseId === id
                        )
                        if (found) {
                            resolvedEnrollment = found
                        }
                    }
                } catch {
                    // Fallback to mock enrollments if API fails
                }
            }

            if (!resolvedEnrollment) {
                const mockEnr = mockEnrollments.find(e => e.courseId === id)
                if (mockEnr) {
                    resolvedEnrollment = mockEnr
                }
            }

            if (isMounted) {
                setEnrollment(resolvedEnrollment)
                setIsLoadingCourse(false)
            }

            if (isAuthenticated && id) {
                try {
                    const wRes = await checkWishlistStatus(id)
                    if (isMounted && wRes.success) {
                        setWishlisted(wRes.isWishlisted)
                    }
                } catch {
                    // Ignore wishlist check error
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [id, isAuthenticated])

    if (isLoadingCourse) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 size={36} className="text-primary animate-spin" />
                    <p className="text-sm text-text-muted">Loading course details...</p>
                </div>
            </AppLayout>
        )
    }

    if (!course) {
        return (
            <AppLayout>
                <div className="text-center py-24">
                    <BookOpen size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                    <h2 className="font-sora font-bold text-xl mb-2">Course not found</h2>
                    <Link href="/student/courses">
                        <button className="text-primary hover:underline text-sm">Browse courses</button>
                    </Link>
                </div>
            </AppLayout>
        )
    }

    const isCourseFree = course.isFree || course.price === 0
    const modules = course.modules && course.modules.length > 0 ? course.modules : (id === 'c1' ? modulesForC1 : [])
    const firstLessonId = modules[0]?.lessons?.[0]?.id || 'l1'

    const toggleModule = (modId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev)
            next.has(modId) ? next.delete(modId) : next.add(modId)
            return next
        })
    }

    // Direct Free Enrollment
    const handleFreeEnrollment = async () => {
        const activeToken = getActiveToken()
        if (!isAuthenticated || !activeToken) {
            toast.info('Please sign in to enroll in this course.')
            router.push(`/login?redirect=/student/courses/${id}`)
            return
        }

        setIsProcessing(true)
        try {
            const res = await enrollInCourse(course._id || course.id)
            if (res.success) {
                setEnrollment(res.enrollment)
                toast.success('Successfully enrolled! Welcome to the course 🎉')
            }
        } catch (err: any) {
            if (err.status === 401) {
                toast.error('Session expired. Please sign in again.')
                router.push(`/login?redirect=/student/courses/${id}`)
                return
            }
            toast.error(err.message || 'Enrollment failed. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    // Paid Course Purchase with Razorpay
    const handlePaidPurchase = async () => {
        const activeToken = getActiveToken()
        if (!isAuthenticated || !activeToken) {
            toast.info('Please sign in to purchase this course.')
            router.push(`/login?redirect=/student/courses/${id}`)
            return
        }

        setIsProcessing(true)

        try {
            // Step 1: Create Order via backend API with verified token
            const orderRes = await createPaymentOrder(course._id || course.id, activeToken)

            if (!orderRes.success || !orderRes.orderId) {
                throw new Error(orderRes.message || 'Unable to start payment. Please try again.')
            }

            // Step 2: Load Razorpay Checkout script safely
            const isScriptLoaded = await loadRazorpayScript()
            if (!isScriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
                throw new Error('Payment service is temporarily unavailable. Could not initialize Razorpay.')
            }

            // Only pass order_id to Razorpay if it is a real Razorpay server order (order_XXXXX)
            // Passing a non-existent order_id to Razorpay causes checkout.js to crash with 'Oops! Something went wrong'
            const isRealRazorpayOrder = Boolean(
                orderRes.orderId &&
                !orderRes.orderId.startsWith('order_dev_') &&
                !orderRes.orderId.startsWith('order_test_')
            )

            // Step 3: Open Razorpay Checkout modal
            const options: RazorpayOptions = {
                key: orderRes.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
                amount: orderRes.amount,
                currency: orderRes.currency || 'INR',
                name: 'LearnSphere',
                description: course.title,
                image: '/icon.png',
                ...(isRealRazorpayOrder ? { order_id: orderRes.orderId } : {}),
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: '9999999999',
                },
                notes: {
                    courseId: course._id || course.id,
                    courseTitle: course.title,
                },
                theme: {
                    color: '#2E3A8C', // LearnSphere primary indigo brand color
                },
                handler: async (response) => {
                    try {
                        // Step 4: Verify payment signature on the backend
                        const verifyRes = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id || orderRes.orderId,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature || 'dev_verified_signature',
                            courseId: course._id || course.id,
                        }, activeToken)

                        if (verifyRes.success) {
                            setPaymentSuccess(true)
                            setEnrollment(verifyRes.enrollment)
                            toast.success('Payment verified and course purchased! 🎉')

                            // Redirect to course lessons after showing success state
                            setTimeout(() => {
                                router.push(`/student/courses/${id}/lessons/${firstLessonId}`)
                            }, 1800)
                        } else {
                            toast.error(verifyRes.message || 'Payment verification failed.')
                        }
                    } catch (verifyErr: any) {
                        toast.error(verifyErr.message || 'Payment verification failed.')
                    } finally {
                        setIsProcessing(false)
                    }
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false)
                        toast.info('Payment was cancelled.')
                    },
                },
            }

            const rzp = new window.Razorpay(options)

            rzp.on('payment.failed', (response: any) => {
                setIsProcessing(false)
                const desc = response?.error?.description || 'Payment was unsuccessful.'
                toast.error(desc)
            })

            rzp.open()
        } catch (err: any) {
            setIsProcessing(false)
            const msg = err.message || ''
            if (
                err.status === 401 ||
                msg.toLowerCase().includes('not authorized') ||
                msg.toLowerCase().includes('no token') ||
                msg.toLowerCase().includes('token is invalid') ||
                msg.toLowerCase().includes('expired')
            ) {
                toast.error('Session expired. Please sign in to purchase this course.')
                router.push(`/login?redirect=/student/courses/${id}`)
                return
            }
            toast.error(msg || 'Unable to start payment. Please try again.')
        }
    }

    const tabs = ['overview', 'curriculum', 'instructor', 'reviews'] as const

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto">
                {/* Back button */}
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
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-accent text-white">
                                            {course.category}
                                        </span>
                                        <span className={cn(
                                            'px-2 py-0.5 text-xs font-semibold rounded-md',
                                            course.difficulty === 'BEGINNER' ? 'bg-success text-white' :
                                            course.difficulty === 'INTERMEDIATE' ? 'bg-warning text-white' : 'bg-red-500 text-white'
                                        )}>
                                            {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
                                        </span>
                                        {isCourseFree ? (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-green-500 text-white flex items-center gap-1">
                                                <Sparkles size={11} /> Free Course
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary text-white">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-2">{course.title}</h1>
                                <p className="text-text-muted text-sm leading-relaxed mb-4">{course.description}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
                                    <span className="flex items-center gap-1">
                                        <Star size={14} className="fill-warning text-warning" />
                                        <strong className="text-text-primary dark:text-dark-text">{course.rating}</strong> ({formatNumber(course.reviewCount)} reviews)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />{formatNumber(course.studentCount)} students
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />{course.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Globe size={14} />{course.language}
                                    </span>
                                    {course.certificate && (
                                        <span className="flex items-center gap-1">
                                            <Award size={14} className="text-warning" />Certificate
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center font-bold text-primary text-sm">
                                        {course.instructor?.name?.charAt(0) || 'I'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text-primary dark:text-dark-text">{course.instructor?.name}</p>
                                        <p className="text-xs text-text-muted">{course.instructor?.title}</p>
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
                                            {[
                                                'Build production-ready React & Next.js apps',
                                                'Master TypeScript for safer, cleaner code',
                                                'Implement secure authentication and APIs',
                                                'Work with modern databases and state stores',
                                                'Deploy scalable applications with CI/CD',
                                                'Understand App Router and Server Architecture'
                                            ].map(item => (
                                                <div key={item} className="flex items-start gap-2 text-sm text-text-muted">
                                                    <CheckCircle2 size={15} className="text-success mt-0.5 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border dark:border-dark-border">
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-2">Requirements</h3>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-text-muted">
                                                <li>Basic programming and computer literacy</li>
                                                <li>A curious mindset and willingness to build hands-on projects</li>
                                                <li>No paid software needed — all tools used are free and open source</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Curriculum */}
                                {activeTab === 'curriculum' && (
                                    <div className="space-y-2">
                                        {modules.length === 0 ? (
                                            <p className="text-text-muted text-sm text-center py-8">Curriculum details coming soon!</p>
                                        ) : modules.map((mod: any) => (
                                            <div key={mod.id} className="border border-border dark:border-dark-border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleModule(mod.id)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-background dark:hover:bg-dark-bg transition-colors text-left"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-sm text-text-primary dark:text-dark-text">{mod.title}</p>
                                                        <p className="text-xs text-text-muted">{mod.lessons.length} lessons</p>
                                                    </div>
                                                    {expandedModules.has(mod.id) ? (
                                                        <ChevronUp size={16} className="text-text-faint flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown size={16} className="text-text-faint flex-shrink-0" />
                                                    )}
                                                </button>
                                                {expandedModules.has(mod.id) && (
                                                    <div className="border-t border-border dark:border-dark-border">
                                                        {mod.lessons.map((lesson: any) => {
                                                            const isLocked = !enrollment && !lesson.isFree
                                                            return (
                                                                <Link
                                                                    key={lesson.id}
                                                                    href={isLocked ? '#' : `/student/courses/${id}/lessons/${lesson.id}`}
                                                                >
                                                                    <div className={cn(
                                                                        'flex items-center gap-3 px-4 py-3 text-sm border-b border-border dark:border-dark-border last:border-0 transition-colors',
                                                                        isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-background dark:hover:bg-dark-bg cursor-pointer'
                                                                    )}>
                                                                        <span>{lessonIcon(lesson.type)}</span>
                                                                        <span className="flex-1 truncate text-text-primary dark:text-dark-text">
                                                                            {lesson.title}
                                                                        </span>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <span className="text-xs text-text-faint">{lesson.duration}</span>
                                                                            {lesson.isFree && !enrollment && (
                                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">Free Preview</span>
                                                                            )}
                                                                            {isLocked && <Lock size={13} className="text-text-faint" />}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            )
                                                        })}
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
                                            {course.instructor?.name?.charAt(0) || 'I'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-0.5">{course.instructor?.name}</h3>
                                            <p className="text-sm text-text-muted mb-3">{course.instructor?.title}</p>
                                            <p className="text-sm text-text-muted leading-relaxed">{course.instructor?.bio || 'Experienced educator and industry expert.'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews */}
                                {activeTab === 'reviews' && (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-4 p-4 bg-background dark:bg-dark-bg rounded-xl">
                                            <div className="text-center">
                                                <div className="font-sora font-bold text-5xl text-primary">{course.rating}</div>
                                                <div className="flex gap-0.5 justify-center mt-1">
                                                    {Array(5).fill(0).map((_, i) => (
                                                        <Star key={i} size={12} className={cn('fill-warning text-warning', i >= Math.round(course.rating) && 'opacity-30')} />
                                                    ))}
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
                                                        {Array(review.rating).fill(0).map((_, i) => (
                                                            <Star key={i} size={12} className="fill-warning text-warning" />
                                                        ))}
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

                    {/* Sticky Sidebar */}
                    <div className="lg:sticky lg:top-6 h-fit space-y-4">
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 shadow-card">

                            {/* Price / Type Display */}
                            <div className="mb-4">
                                {isCourseFree ? (
                                    <div className="flex items-baseline justify-between">
                                        <div className="text-3xl font-sora font-bold text-success flex items-center gap-1.5">
                                            Free Course
                                        </div>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-semibold border border-success/20">
                                            100% Free
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="flex items-baseline gap-2.5 flex-wrap">
                                            <span className="text-3xl font-sora font-bold text-text-primary dark:text-dark-text">
                                                ₹{course.price.toLocaleString('en-IN')}
                                            </span>
                                            {course.originalPrice && course.originalPrice > course.price ? (
                                                <>
                                                    <span className="text-base text-text-muted line-through font-normal">
                                                        ₹{course.originalPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-bold tracking-wide border border-accent/20">
                                                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                                                    </span>
                                                </>
                                            ) : null}
                                        </div>
                                        {course.originalPrice && course.originalPrice > course.price ? (
                                            <p className="text-xs text-accent font-semibold flex items-center gap-1">
                                                🔥 Special Discount Deal! Limited time offer
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* Payment Success Banner */}
                            {paymentSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-xl bg-success/10 border border-success/30 text-success dark:text-green-400 mb-4"
                                >
                                    <div className="flex items-center gap-2 font-bold text-base mb-1">
                                        <CheckCircle2 size={20} className="text-success" />
                                        <span>Payment Successful!</span>
                                    </div>
                                    <p className="text-xs font-semibold">✓ Course Purchased</p>
                                    <p className="text-xs opacity-90 mb-2">✓ You can now access this course</p>
                                    <p className="text-[11px] text-text-muted flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> Redirecting to lessons...
                                    </p>
                                </motion.div>
                            )}

                            {/* Action Button: Continue Learning | Enroll Now | Purchase Course */}
                            {enrollment ? (
                                <>
                                    <Link href={`/student/courses/${id}/lessons/${enrollment.currentLessonId || firstLessonId}`}>
                                        <motion.button
                                            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mb-2.5 shadow-sm"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Play size={16} /> Continue Learning
                                        </motion.button>
                                    </Link>
                                    <Link href={`/student/messages?courseId=${id}`}>
                                        <button className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center gap-2 mb-3 border border-slate-200/60 dark:border-white/[0.06]">
                                            <MessageSquare size={14} /> Message Instructor
                                        </button>
                                    </Link>
                                </>
                            ) : isCourseFree ? (
                                <motion.button
                                    onClick={handleFreeEnrollment}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-success text-white font-semibold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-3 disabled:opacity-60 shadow-sm"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isProcessing ? (
                                        <><Loader2 size={16} className="animate-spin" /> Enrolling...</>
                                    ) : (
                                        <><Sparkles size={16} /> Enroll Now</>
                                    )}
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={handlePaidPurchase}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 mb-3 disabled:opacity-60 shadow-sm"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isProcessing ? (
                                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                    ) : (
                                        <><ShieldCheck size={16} /> Purchase Course</>
                                    )}
                                </motion.button>
                            )}

                            {/* Secondary Actions: Wishlist & Share */}
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (!isAuthenticated) {
                                            toast.info('Please sign in to save this course to your wishlist.')
                                            return
                                        }
                                        const nextState = !wishlisted
                                        setWishlisted(nextState)
                                        try {
                                            if (nextState) {
                                                await addToWishlist(id)
                                                toast.success('Added to wishlist ❤️')
                                            } else {
                                                await removeFromWishlist(id)
                                                toast.success('Removed from wishlist')
                                            }
                                        } catch (err: any) {
                                            setWishlisted(!nextState)
                                            toast.error(err.message || 'Failed to update wishlist')
                                        }
                                    }}
                                    className={cn(
                                        'flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                                        wishlisted ? 'border-accent text-accent bg-accent/5' : 'border-border dark:border-dark-border text-text-muted hover:border-accent/30'
                                    )}
                                >
                                    <Heart size={15} className={wishlisted ? 'fill-accent' : ''} />
                                    {wishlisted ? 'Wishlisted' : 'Wishlist'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                            navigator.clipboard.writeText(window.location.href)
                                            toast.success('Course link copied to clipboard!')
                                        }
                                    }}
                                    className="flex-1 py-2.5 rounded-xl border border-border dark:border-dark-border text-text-muted text-sm font-medium flex items-center justify-center gap-1.5 hover:border-primary/30 transition-colors"
                                >
                                    <Share2 size={15} /> Share
                                </button>
                            </div>

                            {/* Test Mode Tip */}
                            {!enrollment && !isCourseFree && (
                                <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                                    <p className="font-semibold flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                                        <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
                                        Razorpay Test Mode Instructions
                                    </p>
                                    <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300/90">
                                        Real UPI apps cannot scan test mode QR codes. To test without real money:
                                    </p>
                                    <ul className="text-[11px] list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-300/90 pl-0.5">
                                        <li><strong>UPI ID:</strong> Enter <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded font-mono">success@razorpay</code> and click Success</li>
                                        <li><strong>Card:</strong> Enter <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded font-mono">4111 1111 1111 1111</code> (any future expiry)</li>
                                    </ul>
                                </div>
                            )}

                            {/* Enrollment Progress if already enrolled */}
                            {enrollment && (
                                <div className="mt-4 pt-4 border-t border-border dark:border-dark-border">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-text-muted">Your progress</span>
                                        <span className="font-semibold text-primary">{enrollment.progress || 0}%</span>
                                    </div>
                                    <div className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${enrollment.progress || 0}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Course Metadata Features */}
                            <div className="mt-4 pt-4 border-t border-border dark:border-dark-border space-y-2.5 text-sm text-text-muted">
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
                                {!isCourseFree && (
                                    <div className="flex items-center gap-2 text-xs text-text-faint pt-1">
                                        <ShieldCheck size={13} className="text-primary" />
                                        Secure payment powered by Razorpay
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
