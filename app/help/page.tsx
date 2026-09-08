'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    HelpCircle, Search, ChevronDown, MessageSquare, Mail, 
    ShieldCheck, BookOpen, CreditCard, Award, Video, 
    Send, CheckCircle2, ArrowRight, ArrowLeft
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { cn } from '@/lib/utils'

const FAQS = [
    {
        category: 'Enrollment & Access',
        icon: <BookOpen size={18} className="text-primary" />,
        questions: [
            {
                q: 'How do I access course lessons after purchasing?',
                a: 'Once you enroll in a free course or complete payment via Razorpay for a paid course, the course is automatically unlocked in your "My Courses" dashboard. Click "Continue Learning" on the course card to immediately start watching lessons.'
            },
            {
                q: 'Why am I seeing "You don\'t have access to this course"?',
                a: 'This message appears if you try to open lessons for a paid course you haven\'t purchased yet, or if you aren\'t signed in. Make sure you are logged into the account used during checkout, or click "Purchase Course" to unlock instant access.'
            },
            {
                q: 'Can I switch between desktop and mobile devices?',
                a: 'Yes! LearnSphere syncs your enrolled courses, lesson progress, and quiz scores across all modern browsers and devices in real time.'
            }
        ]
    },
    {
        category: 'Payments & Billing',
        icon: <CreditCard size={18} className="text-emerald-500" />,
        questions: [
            {
                q: 'What payment methods are supported via Razorpay?',
                a: 'Razorpay supports UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit Cards (Visa, Mastercard, RuPay), NetBanking from 50+ Indian banks, and digital wallets.'
            },
            {
                q: 'Where can I find my payment receipts and transaction IDs?',
                a: 'Visit the "Payment History" section in your sidebar navigation. All transactions with Razorpay Order IDs, Payment IDs, amounts, and dates are recorded there.'
            },
            {
                q: 'What happens if a payment fails or gets deducted without unlocking the course?',
                a: 'If money was deducted from your account, Razorpay automatically reconciles within 15–30 minutes or reverses the funds within 5–7 business days. You can also reach our support team below with your Razorpay payment ID for manual activation.'
            }
        ]
    },
    {
        category: 'Certificates & Quizzes',
        icon: <Award size={18} className="text-amber-500" />,
        questions: [
            {
                q: 'When do I receive my Certificate of Completion?',
                a: 'Certificates are issued when you complete 100% of all lessons in a course. Once completed, a "Claim Certificate" button appears under "My Courses" and "Certificates" in your sidebar.'
            },
            {
                q: 'Can employers verify my LearnSphere certificate?',
                a: 'Yes. Each certificate includes a unique verification number (e.g. CERT-LS-XXXXX) that can be verified online or shared directly via LinkedIn and portfolio links.'
            }
        ]
    },
    {
        category: 'Live Classes & Messaging',
        icon: <Video size={18} className="text-indigo-500" />,
        questions: [
            {
                q: 'How does student-teacher messaging work?',
                a: 'Students can directly chat with the instructor of any course they are currently enrolled in. Go to Messages from the sidebar or click "Message Instructor" on any enrolled course.'
            },
            {
                q: 'What are the technical requirements for Live Classes?',
                a: 'Live Classes support real-time audio, camera video, and HD screen sharing. For best results, use Google Chrome, Edge, or Firefox and ensure camera/microphone permissions are allowed in your browser settings.'
            }
        ]
    }
]

export default function HelpCenterPage() {
    const [search, setSearch] = useState('')
    const [openIndex, setOpenIndex] = useState<string | null>(null)
    const [ticketSubmitted, setTicketSubmitted] = useState(false)
    const [ticketForm, setTicketForm] = useState({ subject: '', category: 'Enrollment', message: '' })

    const toggleFaq = (key: string) => {
        setOpenIndex(prev => prev === key ? null : key)
    }

    const handleTicketSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!ticketForm.subject || !ticketForm.message) return
        setTicketSubmitted(true)
        setTimeout(() => {
            setTicketForm({ subject: '', category: 'Enrollment', message: '' })
        }, 3000)
    }

    const filteredFaqs = FAQS.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
            q.q.toLowerCase().includes(search.toLowerCase()) || 
            q.a.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(cat => cat.questions.length > 0)

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto pb-20 font-sans">
                {/* Hero */}
                <div className="text-center py-10 sm:py-14 px-4 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl mb-10 border border-primary/10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                        <HelpCircle size={15} />
                        LearnSphere Help Center
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sora">
                        How can we help you today?
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto mt-3">
                        Search knowledgebase answers, explore frequently asked questions, or get in touch with our student support team.
                    </p>

                    {/* Search Input */}
                    <div className="relative max-w-lg mx-auto mt-8">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search questions, payment issues, certificates..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/90 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Quick Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                            <MessageSquare size={20} />
                        </div>
                        <h4 className="font-bold font-sora text-sm text-slate-900 dark:text-white">Instructor Chat</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">
                            Direct Q&A thread with the teacher of any course you are currently enrolled in.
                        </p>
                        <Link href="/student/messages" className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3 hover:underline">
                            Open Messages <ArrowRight size={13} />
                        </Link>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                            <Mail size={20} />
                        </div>
                        <h4 className="font-bold font-sora text-sm text-slate-900 dark:text-white">Email Support</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">
                            Send payment receipts, bug reports, or account questions to our 24/7 desk.
                        </p>
                        <a href="mailto:support@learnsphere.io" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-3 hover:underline">
                            support@learnsphere.io <ArrowRight size={13} />
                        </a>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                            <ShieldCheck size={20} />
                        </div>
                        <h4 className="font-bold font-sora text-sm text-slate-900 dark:text-white">Payment Resolution</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">
                            Track and verify Razorpay order and transaction statuses instantly.
                        </p>
                        <Link href="/student/payments" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3 hover:underline">
                            View Transactions <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* FAQs Section */}
                <div className="space-y-8 mb-16">
                    <div className="border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
                        <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Instant answers to the most common questions across the LearnSphere platform.
                        </p>
                    </div>

                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            No FAQ matches found for "{search}". Try searching something else or submit a ticket below.
                        </div>
                    ) : (
                        filteredFaqs.map(cat => (
                            <div key={cat.category} className="space-y-3">
                                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white font-sora">
                                    {cat.icon}
                                    <h3>{cat.category}</h3>
                                </div>

                                <div className="space-y-2">
                                    {cat.questions.map((item, i) => {
                                        const key = `${cat.category}-${i}`
                                        const isOpen = openIndex === key

                                        return (
                                            <div
                                                key={key}
                                                className="bg-white dark:bg-[#121422] border border-slate-200/80 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-2xs"
                                            >
                                                <button
                                                    onClick={() => toggleFaq(key)}
                                                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-primary transition-colors"
                                                >
                                                    <span>{item.q}</span>
                                                    <ChevronDown
                                                        size={16}
                                                        className={cn("text-slate-400 transition-transform duration-200 flex-shrink-0", isOpen && "rotate-180 text-primary")}
                                                    />
                                                </button>

                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/[0.04] mt-2">
                                                                {item.a}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Support Ticket Form */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#121422] dark:to-[#0D0F19] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-sm">
                    <div className="max-w-xl">
                        <h3 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                            Still have questions? Submit a Support Ticket
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Our academic support staff typically responds within 2 hours during active business hours.
                        </p>
                    </div>

                    {ticketSubmitted ? (
                        <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sora">Ticket Submitted Successfully!</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                We've received your request and an academic advisor has been notified.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleTicketSubmit} className="mt-6 space-y-4 max-w-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Category
                                    </label>
                                    <select
                                        value={ticketForm.category}
                                        onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="Enrollment">Course Enrollment</option>
                                        <option value="Payment">Payment / Razorpay Issue</option>
                                        <option value="Certificate">Certificate Claiming</option>
                                        <option value="Technical">Video / Screen Share / Tech</option>
                                        <option value="Other">General Inquiry</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={ticketForm.subject}
                                        onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                        placeholder="Brief summary of your question"
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={ticketForm.message}
                                    onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })}
                                    placeholder="Please describe your question or issue in detail..."
                                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                            >
                                <Send size={14} />
                                Submit Ticket
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
