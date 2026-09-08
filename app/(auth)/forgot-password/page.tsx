'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Zap, Check } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) { toast.error('Please enter your email address'); return }
        setIsLoading(true)
        await new Promise(r => setTimeout(r, 1200))
        setIsLoading(false)
        setSent(true)
    }

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center mb-8">
                    <Logo size="md" animate={true} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-8 shadow-card"
                >
                    {!sent ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center mx-auto mb-4">
                                    <Mail size={24} className="text-primary" />
                                </div>
                                <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-2">Forgot Password?</h1>
                                <p className="text-text-muted text-sm">Enter your email and we&apos;ll send a reset link.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {isLoading ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                                    ) : 'Send Reset Link'}
                                </motion.button>
                            </form>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                <Check size={24} className="text-success" />
                            </div>
                            <h2 className="font-sora font-bold text-xl text-text-primary dark:text-dark-text mb-2">Check Your Inbox!</h2>
                            <p className="text-text-muted text-sm mb-6">
                                We&apos;ve sent a password reset link to <strong className="text-text-primary dark:text-dark-text">{email}</strong>.<br />
                                It expires in 30 minutes.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail('') }}
                                className="text-sm text-primary hover:underline"
                            >
                                Didn&apos;t receive it? Try again
                            </button>
                        </motion.div>
                    )}

                    <div className="mt-6 text-center">
                        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors">
                            <ArrowLeft size={14} /> Back to Sign In
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
