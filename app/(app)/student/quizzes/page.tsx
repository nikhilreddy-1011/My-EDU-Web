'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileQuestion, Clock, CheckCircle2, BarChart3 } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { quizzes } from '@/data/mock-data'
import { getMyQuizAttempts } from '@/lib/api/quizzes'
import { useAuthStore } from '@/store/use-auth-store'
import { formatDate, cn } from '@/lib/utils'

export default function QuizzesListPage() {
    const { isAuthenticated } = useAuthStore()
    const [tab, setTab] = useState<'available' | 'completed'>('available')
    const [myAttempts, setMyAttempts] = useState<any[]>([])

    useEffect(() => {
        if (!isAuthenticated) return
        getMyQuizAttempts()
            .then(res => {
                if (res && res.success && Array.isArray(res.attempts)) {
                    setMyAttempts(res.attempts)
                }
            })
            .catch(() => {})
    }, [isAuthenticated])

    const completedIds = new Set(myAttempts.map(a => a.quizId))
    const available = quizzes.filter(q => q.isPublished && !completedIds.has(q.id))
    const completed = myAttempts

    return (
        <AppLayout title="Quizzes">
            <div className="max-w-3xl mx-auto space-y-5">
                <div>
                    <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Quizzes</h1>
                    <p className="text-text-muted">Test your knowledge and track your performance</p>
                </div>

                <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl w-fit">
                    {[['available', 'Available'], ['completed', 'Completed']].map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key as 'available' | 'completed')}
                            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === key ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'available' && (
                    available.length === 0 ? (
                        <div className="text-center py-16 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
                            <CheckCircle2 size={48} className="mx-auto text-success mb-3 opacity-50" />
                            <h3 className="font-semibold text-text-primary dark:text-dark-text">All caught up!</h3>
                            <p className="text-text-muted text-sm mt-1">You&apos;ve completed all available quizzes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {available.map((quiz, i) => (
                                <motion.div key={quiz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 hover:shadow-card transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                                <FileQuestion size={18} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1">{quiz.title}</h3>
                                                <div className="flex gap-3 text-xs text-text-muted">
                                                    <span className="flex items-center gap-1"><FileQuestion size={11} />{quiz.questions.length} questions</span>
                                                    <span className="flex items-center gap-1"><Clock size={11} />{quiz.duration} min</span>
                                                    <span>Pass: {quiz.passingScore}%</span>
                                                </div>
                                                {quiz.deadline && <p className="text-xs text-warning mt-1">Due: {formatDate(quiz.deadline)}</p>}
                                            </div>
                                        </div>
                                        <Link href={`/student/quizzes/${quiz.id}`}>
                                            <motion.button className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0" whileTap={{ scale: 0.97 }}>
                                                Start
                                            </motion.button>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}

                {tab === 'completed' && (
                    completed.length === 0 ? (
                        <div className="text-center py-16 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
                            <BarChart3 size={48} className="mx-auto text-text-faint mb-3 opacity-30" />
                            <h3 className="font-semibold text-text-primary dark:text-dark-text">No attempts yet</h3>
                            <p className="text-text-muted text-sm mt-1">Take a quiz to see your performance history.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {completed.map((attempt, i) => (
                                <motion.div key={attempt.id || attempt._id || i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 hover:shadow-card transition-all">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex gap-3">
                                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', attempt.isPassed ? 'bg-success/10' : 'bg-accent/10')}>
                                                {attempt.isPassed ? <CheckCircle2 size={18} className="text-success" /> : <BarChart3 size={18} className="text-accent" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1">
                                                    {attempt.quizTitle || attempt.quiz?.title || 'Quiz'}
                                                </h3>
                                                <p className="text-xs text-text-muted">{formatDate(attempt.completedAt || attempt.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn('font-sora font-bold text-xl', attempt.score >= 80 ? 'text-success' : attempt.score >= 60 ? 'text-warning' : 'text-accent')}>
                                                {attempt.score}%
                                            </p>
                                            <p className="text-xs text-text-muted">{attempt.isPassed ? 'Passed' : 'Failed'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </AppLayout>
    )
}
