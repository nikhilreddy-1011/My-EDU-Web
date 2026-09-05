'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, RotateCcw, ArrowRight, TrendingUp, Award } from 'lucide-react'
import { quizzes } from '@/data/mock-data'
import { cn, formatDuration } from '@/lib/utils'

function AnimatedRing({ score }: { score: number }) {
    const radius = 72
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const color = score >= 80 ? '#1FA97D' : score >= 60 ? '#E7A93B' : '#FF6B4A'

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg width="192" height="192" className="-rotate-90">
                <circle cx="96" cy="96" r={radius} stroke="var(--border)" strokeWidth="12" fill="none" />
                <motion.circle
                    cx="96" cy="96" r={radius}
                    stroke={color} strokeWidth="12" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="font-sora font-bold text-5xl"
                    style={{ color }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                >
                    {score}%
                </motion.span>
                <span className="text-text-muted text-sm">Score</span>
            </div>
        </div>
    )
}

export default function QuizResultsPage() {
    const { id } = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const score = Number(searchParams.get('score') || 0)
    const timeSpent = Number(searchParams.get('time') || 0)
    const quiz = quizzes.find(q => q.id === id)
    const passed = score >= (quiz?.passingScore || 70)

    const correct = quiz ? Math.round((score / 100) * quiz.questions.length) : 0
    const incorrect = (quiz?.questions.length || 0) - correct
    const accuracy = score

    const stats = [
        { label: 'Correct', value: correct, icon: <CheckCircle2 size={18} className="text-success" />, color: 'text-success' },
        { label: 'Incorrect', value: incorrect, icon: <XCircle size={18} className="text-accent" />, color: 'text-accent' },
        { label: 'Time Spent', value: formatDuration(Math.round(timeSpent / 60)), icon: <Clock size={18} className="text-primary" />, color: 'text-primary' },
        { label: 'Accuracy', value: `${accuracy}%`, icon: <TrendingUp size={18} className="text-warning" />, color: 'text-warning' },
    ]

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-6">
                {/* Result card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-8 text-center shadow-card"
                >
                    <div className="flex justify-center mb-6">
                        <AnimatedRing score={score} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                        {passed ? (
                            <>
                                <div className="text-4xl mb-2">🎉</div>
                                <h1 className="font-sora font-bold text-2xl text-success mb-1">Congratulations!</h1>
                                <p className="text-text-muted">You passed the quiz with {score}% — great work!</p>
                            </>
                        ) : (
                            <>
                                <div className="text-4xl mb-2">📚</div>
                                <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Keep Practicing!</h1>
                                <p className="text-text-muted">You scored {score}%. The passing score is {quiz?.passingScore}%.</p>
                            </>
                        )}
                    </motion.div>
                </motion.div>

                {/* Stats */}
                <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    {stats.map(stat => (
                        <div key={stat.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 text-center">
                            <div className="flex justify-center mb-2">{stat.icon}</div>
                            <div className={cn('font-sora font-bold text-xl', stat.color)}>{stat.value}</div>
                            <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Performance insight */}
                <motion.div
                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                >
                    <h3 className="font-semibold text-text-primary dark:text-dark-text mb-3">Performance Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-success/10 dark:bg-green-900/20 rounded-xl">
                            <p className="text-xs font-semibold text-success mb-1">✅ Strongest Topic</p>
                            <p className="text-sm text-text-primary dark:text-dark-text">React Hooks & State</p>
                        </div>
                        <div className="p-3 bg-accent/10 dark:bg-orange-900/20 rounded-xl">
                            <p className="text-xs font-semibold text-accent mb-1">📖 Area to Improve</p>
                            <p className="text-sm text-text-primary dark:text-dark-text">Advanced useEffect</p>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div className="flex flex-col sm:flex-row gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                    {!passed && (
                        <Link href={`/student/quizzes/${id}`} className="flex-1">
                            <motion.button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary-tint transition-colors" whileHover={{ scale: 1.01 }}>
                                <RotateCcw size={16} /> Retry Quiz
                            </motion.button>
                        </Link>
                    )}
                    <Link href="/student/courses" className="flex-1">
                        <motion.button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors" whileHover={{ scale: 1.01 }}>
                            Continue Learning <ArrowRight size={16} />
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        </div>
    )
}
