'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RefreshCw, Home, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Unhandled app error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>

                    <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-2">
                        Something went wrong!
                    </h1>
                    <p className="text-text-muted text-sm mb-6 leading-relaxed">
                        An unexpected error occurred while loading this page. We&apos;ve logged the issue and are working on it.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => reset()}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                        >
                            <RefreshCw size={15} /> Try Again
                        </button>
                        <Link href="/">
                            <button className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-border dark:border-dark-border text-text-muted text-sm font-medium rounded-xl hover:border-primary/30 hover:text-primary transition-colors">
                                <Home size={15} /> Go Home
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
