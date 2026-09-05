'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Eye, FileQuestion, Clock, Users, Trash2 } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { quizzes } from '@/data/mock-data'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function TeacherQuizzesPage() {
    const [showCreate, setShowCreate] = useState(false)
    const [quizTitle, setQuizTitle] = useState('')

    const teacherQuizzes = quizzes // In production, filter by teacher's courses

    return (
        <AppLayout title="Quizzes">
            <div className="max-w-4xl mx-auto space-y-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Quizzes</h1>
                        <p className="text-text-muted">Create and manage assessments for your students</p>
                    </div>
                    <motion.button onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Plus size={16} /> Create Quiz
                    </motion.button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Quizzes', value: teacherQuizzes.length },
                        { label: 'Total Attempts', value: 247 },
                        { label: 'Avg Score', value: '76%' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl p-4 text-center">
                            <p className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text">{s.value}</p>
                            <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick create */}
                <AnimatePresence>
                    {showCreate && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-primary-tint dark:bg-dark-surface2 border border-primary/20 rounded-2xl p-4 overflow-hidden">
                            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-3 text-sm">Quick Create</h3>
                            <div className="flex gap-2">
                                <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Quiz title..." className="flex-1 px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-sm text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                <button onClick={() => { if (quizTitle) { toast.success(`"${quizTitle}" created!`); setQuizTitle(''); setShowCreate(false) } else toast.error('Enter a quiz title') }}
                                    className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">Create</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quiz list */}
                <div className="space-y-3">
                    {teacherQuizzes.map((quiz, i) => (
                        <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 hover:shadow-card transition-all">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                        <FileQuestion size={18} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1">{quiz.title}</h3>
                                        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                                            <span className="flex items-center gap-1"><FileQuestion size={11} />{quiz.questions.length} questions</span>
                                            <span className="flex items-center gap-1"><Clock size={11} />{quiz.duration} min</span>
                                            <span>Pass: {quiz.passingScore}%</span>
                                            {quiz.deadline && <span className="text-warning">Due: {formatDate(quiz.deadline)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium mr-2', quiz.isPublished ? 'bg-success/10 text-success' : 'bg-border text-text-muted')}>
                                        {quiz.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                    <button className="p-2 rounded-lg text-text-faint hover:text-primary hover:bg-primary-tint transition-colors" title="Edit"><Edit size={14} /></button>
                                    <Link href={`/student/quizzes/${quiz.id}`}><button className="p-2 rounded-lg text-text-faint hover:text-success hover:bg-success/10 transition-colors" title="Preview"><Eye size={14} /></button></Link>
                                    <button onClick={() => toast.success('Quiz deleted')} className="p-2 rounded-lg text-text-faint hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}
