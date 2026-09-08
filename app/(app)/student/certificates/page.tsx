'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Award, CheckCircle2, Download, Share2, ExternalLink, 
    Calendar, ShieldCheck, Sparkles, X, Printer, BookOpen, 
    Copy, Check
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { getMyCertificates, claimCertificate, CertificateItem } from '@/lib/api/certificates'
import { getMyCoursesList, MyCourseItem } from '@/lib/api/enrollments'
import { cn } from '@/lib/utils'

function CertificatesContent() {
    const searchParams = useSearchParams()
    const courseIdParam = searchParams.get('courseId')
    const { user, isAuthenticated } = useAuthStore()

    const [certificates, setCertificates] = useState<CertificateItem[]>([])
    const [unclaimedCourses, setUnclaimedCourses] = useState<MyCourseItem[]>([])
    const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isClaiming, setIsClaiming] = useState(false)
    const [copied, setCopied] = useState(false)

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [certRes, coursesRes] = await Promise.all([
                getMyCertificates(),
                getMyCoursesList(),
            ])

            const certs = certRes.success ? certRes.certificates : []
            setCertificates(certs)

            if (coursesRes.success && coursesRes.completed) {
                // Find completed courses that don't have a certificate yet
                const certCourseIds = new Set(certs.map((c: CertificateItem) => c.course?._id || ''))
                const unclaimed = coursesRes.completed.filter((e: MyCourseItem) => !certCourseIds.has(e.courseId))
                setUnclaimedCourses(unclaimed)
            }

            // Auto-select if courseId param matched
            if (courseIdParam) {
                const matched = certs.find((c: CertificateItem) => c.course?._id === courseIdParam)
                if (matched) setSelectedCert(matched)
            }
        } catch (err) {
            console.error('Failed to load certificates:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            loadData()
        }
    }, [isAuthenticated, courseIdParam])

    const handleClaim = async (courseId: string) => {
        setIsClaiming(true)
        try {
            const res = await claimCertificate(courseId)
            if (res.success && res.certificate) {
                setSelectedCert(res.certificate)
                await loadData()
            }
        } catch (err: any) {
            alert(err.message || 'Failed to claim certificate')
        } finally {
            setIsClaiming(false)
        }
    }

    const handleCopyLink = (certId: string) => {
        const url = `${window.location.origin}/verify-cert?id=${certId}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto pb-16 font-sans">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sora flex items-center gap-2.5">
                                <Award className="text-amber-500" size={30} />
                                Verified Certificates
                            </h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {certificates.length} Earned
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Verifiable course credentials with digital validation and print-ready format.
                        </p>
                    </div>

                    <Link
                        href="/student/my-courses"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-200/70 transition-all self-start sm:self-auto"
                    >
                        <BookOpen size={16} />
                        View In-Progress Courses
                    </Link>
                </div>

                {/* Unclaimed Certificates Alert Banner */}
                {unclaimedCourses.length > 0 && (
                    <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {unclaimedCourses.length} Certificate{unclaimedCourses.length > 1 ? 's' : ''} Ready to Claim!
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    You have completed courses waiting for certificate issuance.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {unclaimedCourses.map(e => (
                                <button
                                    key={e.enrollmentId || e.courseId}
                                    onClick={() => handleClaim(e.courseId)}
                                    disabled={isClaiming}
                                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Award size={14} />
                                    Claim for {e.title?.slice(0, 18)}...
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200/60 dark:border-white/[0.06]" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && certificates.length === 0 && unclaimedCourses.length === 0 && (
                    <div className="text-center py-20 bg-white/70 dark:bg-white/[0.02] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-8">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
                            <Award size={36} />
                        </div>
                        <h3 className="font-sora font-bold text-slate-900 dark:text-white text-lg mb-2">
                            No Certificates Earned Yet
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                            Complete 100% of all lessons in any enrolled course to unlock and claim your personalized, verifiable certificate of completion.
                        </p>
                        <Link
                            href="/student/my-courses"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                        >
                            <BookOpen size={16} />
                            Go to My Courses
                        </Link>
                    </div>
                )}

                {/* Certificates Grid */}
                {!isLoading && certificates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map(cert => (
                            <motion.div
                                key={cert._id}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Card Header Badge */}
                                    <div className="flex items-center justify-between gap-2 mb-4">
                                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 flex items-center gap-1">
                                            <ShieldCheck size={13} />
                                            Verified Credential
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {cert.certificateId}
                                        </span>
                                    </div>

                                    {/* Certificate Preview Frame */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 via-slate-50 to-indigo-50/20 dark:from-amber-500/5 dark:via-white/[0.02] dark:to-white/[0.01] border border-amber-500/20 mb-4 text-center">
                                        <Award size={36} className="mx-auto text-amber-500 mb-2" />
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                            LearnSphere Certificate
                                        </p>
                                        <h4 className="font-sora font-extrabold text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">
                                            {cert.course?.title || 'Course Completion'}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                            Awarded to <span className="font-bold text-slate-800 dark:text-slate-200">{cert.student?.name || user?.name}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                        <Calendar size={13} />
                                        <span>Issued: {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedCert(cert)}
                                        className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs flex items-center justify-center gap-1.5"
                                    >
                                        <Award size={14} />
                                        View Certificate
                                    </button>

                                    <button
                                        onClick={() => handleCopyLink(cert.certificateId)}
                                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:text-primary transition-colors border border-slate-200/60 dark:border-white/[0.06]"
                                        title="Copy Verification Link"
                                    >
                                        {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Certificate Modal Viewer */}
                <AnimatePresence>
                    {selectedCert && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-3xl bg-white dark:bg-[#121422] border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-10 my-8 overflow-hidden print:p-0 print:border-none"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors print:hidden"
                                >
                                    <X size={18} />
                                </button>

                                {/* Formal Certificate Inner Frame */}
                                <div className="border-4 border-double border-amber-500/40 p-6 sm:p-10 rounded-2xl bg-gradient-to-b from-amber-500/[0.02] to-indigo-500/[0.02] text-center relative">
                                    {/* Seal watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                        <Award size={350} />
                                    </div>

                                    {/* Certificate Header */}
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Award size={32} className="text-amber-500" />
                                        <span className="font-sora font-extrabold text-lg sm:text-xl tracking-wider text-slate-900 dark:text-white">
                                            LEARNSPHERE ACADEMY
                                        </span>
                                    </div>
                                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold mb-6">
                                        Certificate of Completion
                                    </p>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
                                        This is to officially certify that
                                    </p>

                                    <h2 className="text-2xl sm:text-4xl font-extrabold font-sora text-primary dark:text-indigo-400 tracking-tight my-2">
                                        {selectedCert.student?.name || user?.name}
                                    </h2>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-lg mx-auto my-3">
                                        has successfully fulfilled all curriculum requirements, evaluations, and practical assessments for the course
                                    </p>

                                    <h3 className="text-lg sm:text-2xl font-bold font-sora text-slate-900 dark:text-white max-w-xl mx-auto my-3 leading-snug">
                                        {selectedCert.course?.title}
                                    </h3>

                                    {/* Signatures & Details Row */}
                                    <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-slate-200 dark:border-white/[0.08] text-left sm:text-center max-w-lg mx-auto">
                                        <div>
                                            <p className="text-xs font-serif italic text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-white/20 pb-1 mb-1">
                                                {selectedCert.instructor?.name || 'Lead Academic Director'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Instructor Signature</p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-white/20 pb-1 mb-1">
                                                {new Date(selectedCert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Date of Issuance</p>
                                        </div>
                                    </div>

                                    {/* Footer Verification Code */}
                                    <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                                            ID: {selectedCert.certificateId}
                                        </span>
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <ShieldCheck size={14} />
                                            Authenticity Verified on LearnSphere Platform
                                        </span>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                                    <button
                                        onClick={() => handleCopyLink(selectedCert.certificateId)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200/80 transition-colors"
                                    >
                                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        {copied ? 'Link Copied!' : 'Copy Verification Link'}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => window.print()}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                                        >
                                            <Printer size={14} />
                                            Print / Save PDF
                                        </button>
                                        <button
                                            onClick={() => setSelectedCert(null)}
                                            className="px-4 py-2 rounded-xl bg-slate-200/60 dark:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300/60 transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    )
}

export default function CertificatesPage() {
    return (
        <Suspense fallback={
            <AppLayout>
                <div className="p-8 text-center text-slate-400">Loading certificates...</div>
            </AppLayout>
        }>
            <CertificatesContent />
        </Suspense>
    )
}
