'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
    CreditCard, ShieldCheck, CheckCircle2, AlertCircle, 
    Copy, Check, ExternalLink, ArrowRight, BookOpen, 
    Calendar, Download, Receipt
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { getMyPayments, PaymentRecord } from '@/lib/api/payments'
import { formatPrice, cn } from '@/lib/utils'

export default function PaymentsPage() {
    const { isAuthenticated } = useAuthStore()
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchPayments = async () => {
            setIsLoading(true)
            try {
                const res = await getMyPayments()
                if (isMounted && res.success) {
                    setPayments(res.payments || [])
                }
            } catch (err) {
                console.error('Failed to load payments:', err)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchPayments()
        } else {
            setIsLoading(false)
        }

        return () => {
            isMounted = false
        }
    }, [isAuthenticated])

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(text)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const totalSpent = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0)

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto pb-16 font-sans">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sora flex items-center gap-2.5">
                                <CreditCard className="text-primary" size={28} />
                                Payment History
                            </h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                                {payments.length} Transaction{payments.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Secure transaction receipts and Razorpay payment identifiers.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto">
                        <ShieldCheck size={16} />
                        256-bit Encrypted Payments
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Investment</p>
                        <h3 className="text-2xl font-extrabold font-sora text-slate-900 dark:text-white mt-1">
                            {formatPrice(totalSpent)}
                        </h3>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            Across all enrolled courses
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Successful Purchases</p>
                        <h3 className="text-2xl font-extrabold font-sora text-slate-900 dark:text-white mt-1">
                            {payments.filter(p => p.status === 'paid').length}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">Instant course unlocks</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Payment Gateway</p>
                        <h3 className="text-2xl font-extrabold font-sora text-indigo-600 dark:text-indigo-400 mt-1">
                            Razorpay
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">UPI, Cards, NetBanking</p>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-20 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200/60 dark:border-white/[0.06]" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && payments.length === 0 && (
                    <div className="text-center py-20 bg-white/70 dark:bg-white/[0.02] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            <Receipt size={32} />
                        </div>
                        <h3 className="font-sora font-bold text-slate-900 dark:text-white text-lg mb-2">
                            No Payment Records Found
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                            You haven't made any course purchases yet. Free courses do not generate payment receipts.
                        </p>
                        <Link
                            href="/student/courses"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                        >
                            <BookOpen size={16} />
                            Explore Courses
                        </Link>
                    </div>
                )}

                {/* Payments Table / List */}
                {!isLoading && payments.length > 0 && (
                    <div className="bg-white/80 dark:bg-[#121422]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                                        <th className="p-4">Course</th>
                                        <th className="p-4">Date & Time</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Razorpay Reference</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                    {payments.map(payment => {
                                        const course = payment.course
                                        const isCopied = copiedId === payment.razorpayPaymentId

                                        return (
                                            <tr key={payment._id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                                {/* Course Title */}
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {course?.title || 'LearnSphere Course'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {course?.category || 'Online Course'}
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="p-4 text-slate-600 dark:text-slate-300">
                                                    <div>{new Date(payment.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="p-4 font-extrabold font-sora text-slate-900 dark:text-white text-sm">
                                                    {formatPrice(payment.amount)}
                                                </td>

                                                {/* Razorpay IDs */}
                                                <td className="p-4 font-mono">
                                                    {payment.razorpayPaymentId ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                                                {payment.razorpayPaymentId}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(payment.razorpayPaymentId!)}
                                                                className="p-1 rounded text-slate-400 hover:text-primary transition-colors"
                                                                title="Copy Payment ID"
                                                            >
                                                                {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">{payment.razorpayOrderId || 'N/A'}</span>
                                                    )}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="p-4">
                                                    {payment.status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle2 size={12} />
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 capitalize">
                                                            <AlertCircle size={12} />
                                                            {payment.status}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action */}
                                                <td className="p-4 text-right">
                                                    {course?._id && (
                                                        <Link
                                                            href={`/student/courses/${course._id}`}
                                                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                                                        >
                                                            Go to Course
                                                            <ArrowRight size={13} />
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
