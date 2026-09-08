'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Zap, Check, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setIsLoading(true)
        await new Promise(r => setTimeout(r, 1200))
        setIsLoading(false)
        setIsSuccess(true)
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
                    {!isSuccess ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center mx-auto mb-4">
                                    <Lock size={24} className="text-primary" />
                                </div>
                                <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-2">Reset Your Password</h1>
                                <p className="text-text-muted text-sm">Please choose a new, strong password for your account.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="At least 8 characters"
                                            className="w-full px-4 py-3 pr-10 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Confirm New Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
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
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                                    ) : 'Reset Password'}
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
                            <h2 className="font-sora font-bold text-xl text-text-primary dark:text-dark-text mb-2">Password Reset Complete!</h2>
                            <p className="text-text-muted text-sm mb-6">
                                Your password has been successfully updated. You can now log in with your new credentials.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors"
                            >
                                Proceed to Sign In
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
