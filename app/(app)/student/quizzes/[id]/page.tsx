'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { quizzes } from '@/data/mock-data'
import { submitQuizAttempt } from '@/lib/api/quizzes'
import { cn } from '@/lib/utils'

export default function QuizPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const quiz = quizzes.find(q => q.id === id)

    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [timeLeft, setTimeLeft] = useState((quiz?.duration || 20) * 60)
    const [showConfirm, setShowConfirm] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [hoveredOption, setHoveredOption] = useState<number | null>(null)

    useEffect(() => {
        if (submitted) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [submitted])

    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const timeWarning = timeLeft < 120
    const isLow = timeLeft < 60
    const progress = (Object.keys(answers).length / (quiz?.questions.length || 1)) * 100

    const handleAnswer = (optIdx: number) => {
        setAnswers(prev => ({ ...prev, [currentQ]: optIdx }))
    }

    const handleSubmit = async () => {
        if (!quiz) return
        setSubmitted(true)
        const score = quiz.questions.reduce((sum, q, i) => {
            return answers[i] === q.correctAnswer ? sum + q.points : sum
        }, 0)
        const total = quiz.questions.reduce((sum, q) => sum + q.points, 0)
        const pct = Math.round((score / total) * 100)

        try {
            await submitQuizAttempt({
                quizId: quiz.id,
                quizTitle: quiz.title,
                score: pct,
                passingScore: quiz.passingScore || 70,
                answers: Object.entries(answers).map(([qIdx, ansIdx]) => ({
                    questionIndex: Number(qIdx),
                    selectedOption: ansIdx,
                    isCorrect: quiz.questions[Number(qIdx)]?.correctAnswer === ansIdx,
                })),
            })
        } catch (e) {
            // Log but don't prevent user from seeing results
            console.error('Failed to submit quiz attempt', e)
        }

        router.push(`/student/quizzes/${id}/results?score=${pct}&time=${(quiz.duration * 60) - timeLeft}`)
    }

    if (!quiz) return (
        <div className="min-h-screen flex items-center justify-center text-text-muted">Quiz not found</div>
    )

    const q = quiz.questions[currentQ]
    const answered = answers[currentQ] !== undefined

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg flex flex-col">
            {/* Quiz header */}
            <div className="bg-surface dark:bg-dark-surface border-b border-border dark:border-dark-border px-4 py-4 flex items-center justify-between">
                <div>
                    <h1 className="font-sora font-bold text-base text-text-primary dark:text-dark-text">{quiz.title}</h1>
                    <p className="text-xs text-text-muted">{currentQ + 1} of {quiz.questions.length} questions</p>
                </div>
                {/* Timer */}
                <motion.div
                    animate={{ scale: isLow ? [1, 1.05, 1] : 1 }}
                    transition={{ repeat: isLow ? Infinity : 0, duration: 0.5 }}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg',
                        isLow ? 'bg-red-500 text-white' : timeWarning ? 'bg-warning/15 text-warning' : 'bg-primary-tint dark:bg-dark-surface2 text-primary'
                    )}
                >
                    <Clock size={16} />
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </motion.div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-border dark:bg-dark-border">
                <motion.div className="h-full bg-primary" animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl space-y-6">
                    {/* Question */}
                    <motion.div
                        key={currentQ}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                                {currentQ + 1}
                            </span>
                            <p className="font-semibold text-base text-text-primary dark:text-dark-text leading-relaxed">{q.question}</p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {q.options.map((opt, i) => {
                                const isSelected = answers[currentQ] === i
                                return (
                                    <motion.button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        onHoverStart={() => setHoveredOption(i)}
                                        onHoverEnd={() => setHoveredOption(null)}
                                        className={cn(
                                            'w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-3',
                                            isSelected
                                                ? 'border-primary bg-primary-tint dark:bg-dark-surface2 text-primary'
                                                : 'border-border dark:border-dark-border hover:border-primary/40 hover:bg-background dark:hover:bg-dark-bg text-text-primary dark:text-dark-text'
                                        )}
                                        whileTap={{ scale: 0.995 }}
                                    >
                                        <span className={cn(
                                            'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                                            isSelected ? 'border-primary bg-primary text-white' : 'border-border dark:border-dark-border'
                                        )}>
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {opt}
                                    </motion.button>
                                )
                            })}
                        </div>

                        <p className="text-xs text-text-faint mt-4">{q.points} {q.points === 1 ? 'point' : 'points'}</p>
                    </motion.div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                            disabled={currentQ === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border dark:border-dark-border text-text-muted hover:border-primary/30 hover:text-primary text-sm disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>

                        {/* Question dots */}
                        <div className="flex gap-1.5">
                            {quiz.questions.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentQ(i)}
                                    className={cn(
                                        'w-7 h-7 rounded-full text-xs font-medium transition-all',
                                        i === currentQ ? 'bg-primary text-white' : answers[i] !== undefined ? 'bg-success text-white' : 'bg-border dark:bg-dark-border text-text-faint hover:bg-primary/20'
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        {currentQ < quiz.questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentQ(Math.min(quiz.questions.length - 1, currentQ + 1))}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        ) : (
                            <motion.button
                                onClick={() => setShowConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Submit Quiz
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm modal */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} />
                        <motion.div className="relative bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 w-full max-w-sm shadow-modal"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <div className="text-center">
                                <AlertTriangle size={32} className="text-warning mx-auto mb-3" />
                                <h3 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text mb-2">Submit Quiz?</h3>
                                <p className="text-text-muted text-sm mb-1">
                                    You&apos;ve answered <strong>{Object.keys(answers).length}</strong> of <strong>{quiz.questions.length}</strong> questions.
                                </p>
                                {Object.keys(answers).length < quiz.questions.length && (
                                    <p className="text-warning text-xs mb-4">Unanswered questions will be marked as incorrect.</p>
                                )}
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm hover:border-primary/30 transition-colors">
                                    Continue Quiz
                                </button>
                                <motion.button onClick={handleSubmit} className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors" whileTap={{ scale: 0.97 }}>
                                    Submit
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
