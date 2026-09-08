'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search, Zap } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg flex items-center justify-center p-6">
            <div className="text-center max-w-lg">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="flex items-center justify-center mb-8">
                        <Logo size="lg" animate={true} />
                    </div>

                    <div className="font-sora font-bold text-[120px] leading-none text-text-primary dark:text-dark-text opacity-10 select-none mb-4">
                        404
                    </div>

                    <h1 className="font-sora font-bold text-3xl text-text-primary dark:text-dark-text mb-3">
                        Page not found
                    </h1>
                    <p className="text-text-muted text-lg mb-8 leading-relaxed">
                        Looks like this lesson doesn&apos;t exist yet. Let&apos;s get you back on track!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/">
                            <motion.button
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Home size={16} /> Go Home
                            </motion.button>
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-6 py-3 border border-border dark:border-dark-border text-text-muted rounded-xl hover:border-primary/30 hover:text-primary transition-colors font-medium"
                        >
                            <ArrowLeft size={16} /> Go Back
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
