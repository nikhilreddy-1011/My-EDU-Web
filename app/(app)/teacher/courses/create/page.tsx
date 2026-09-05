'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronRight, ChevronLeft, Check, Plus, Trash2, Globe, Lock, Tag, FileText, Video, Users, DollarSign } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STEPS = ['Basic Info', 'Curriculum', 'Pricing', 'Publish']

const CATEGORIES = ['Web Development', 'Design', 'Data Science', 'Backend', 'Cloud', 'Mobile', 'DevOps', 'Cybersecurity']
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

interface Module {
    id: string
    title: string
    lessons: { id: string; title: string; type: 'VIDEO' | 'ARTICLE' | 'QUIZ' }[]
}

export default function CreateCoursePage() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [difficulty, setDifficulty] = useState<string>('BEGINNER')
    const [language, setLanguage] = useState('English')
    const [price, setPrice] = useState('')
    const [isFree, setIsFree] = useState(false)
    const [hasCertificate, setHasCertificate] = useState(true)
    const [modules, setModules] = useState<Module[]>([
        { id: 'm1', title: 'Getting Started', lessons: [{ id: 'l1', title: 'Course Introduction', type: 'VIDEO' }] },
    ])

    const addModule = () => {
        setModules(m => [...m, { id: `m${Date.now()}`, title: 'New Module', lessons: [] }])
    }

    const removeModule = (id: string) => {
        setModules(m => m.filter(mod => mod.id !== id))
    }

    const updateModuleTitle = (id: string, title: string) => {
        setModules(m => m.map(mod => mod.id === id ? { ...mod, title } : mod))
    }

    const addLesson = (moduleId: string) => {
        setModules(m => m.map(mod => mod.id === moduleId
            ? { ...mod, lessons: [...mod.lessons, { id: `l${Date.now()}`, title: 'New Lesson', type: 'VIDEO' as const }] }
            : mod
        ))
    }

    const removeLesson = (moduleId: string, lessonId: string) => {
        setModules(m => m.map(mod => mod.id === moduleId
            ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) }
            : mod
        ))
    }

    const canProceed = () => {
        if (step === 0) return title.trim().length > 3 && description.trim().length > 10 && category
        if (step === 1) return modules.length > 0 && modules.every(m => m.title.trim())
        if (step === 2) return isFree || (price && Number(price) > 0)
        return true
    }

    const handleNext = () => {
        if (!canProceed()) { toast.error('Please fill in all required fields'); return }
        setStep(s => Math.min(s + 1, STEPS.length - 1))
    }

    const handlePublish = async () => {
        setIsSubmitting(true)
        await new Promise(r => setTimeout(r, 1500))
        toast.success('Course published successfully! 🎉')
        router.push('/teacher/courses')
    }

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)

    return (
        <AppLayout title="Create Course">
            <div className="max-w-3xl mx-auto">
                {/* Step indicator */}
                <div className="flex items-center mb-8 overflow-x-auto pb-2">
                    {STEPS.map((label, i) => (
                        <React.Fragment key={label}>
                            <button onClick={() => i < step && setStep(i)} className="flex items-center gap-2 flex-shrink-0">
                                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                                    i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-border dark:bg-dark-border text-text-faint'
                                )}>
                                    {i < step ? <Check size={14} /> : i + 1}
                                </div>
                                <span className={cn('text-sm font-medium hidden sm:block', i === step ? 'text-text-primary dark:text-dark-text' : 'text-text-muted')}>{label}</span>
                            </button>
                            {i < STEPS.length - 1 && (
                                <div className={cn('flex-1 h-0.5 mx-3 rounded-full transition-colors min-w-[20px]', i < step ? 'bg-success' : 'bg-border dark:bg-dark-border')} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                        {/* Step 0: Basic Info */}
                        {step === 0 && (
                            <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 space-y-4">
                                <h2 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text">Course Information</h2>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Course Title *</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Complete React & Next.js Development Bootcamp" className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    <p className="text-xs text-text-faint mt-1">{title.length}/80 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Description *</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe what students will learn..." className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Category *</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none">
                                            <option value="">Select a category</option>
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Difficulty</label>
                                        <div className="flex gap-2">
                                            {DIFFICULTIES.map(d => (
                                                <button key={d} onClick={() => setDifficulty(d)} className={cn('flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors',
                                                    difficulty === d ? 'border-primary bg-primary-tint dark:bg-dark-surface2 text-primary' : 'border-border dark:border-dark-border text-text-muted hover:border-primary/30'
                                                )}>
                                                    {d.charAt(0) + d.slice(1).toLowerCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Language</label>
                                    <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none">
                                        {['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button onClick={() => setHasCertificate(!hasCertificate)} className={cn('w-10 h-5.5 rounded-full relative transition-colors', hasCertificate ? 'bg-primary' : 'bg-border dark:bg-dark-border')}>
                                        <span className={cn('absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform', hasCertificate ? 'right-0.5' : 'left-0.5')} />
                                    </button>
                                    <span className="text-sm text-text-primary dark:text-dark-text">Issue certificate on completion</span>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Curriculum */}
                        {step === 1 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text">Curriculum</h2>
                                    <span className="text-sm text-text-muted">{modules.length} modules · {totalLessons} lessons</span>
                                </div>
                                {modules.map((mod, mi) => (
                                    <div key={mod.id} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden">
                                        <div className="flex items-center gap-3 px-4 py-3 bg-background dark:bg-dark-bg">
                                            <span className="text-xs font-bold text-text-faint w-6">M{mi + 1}</span>
                                            <input value={mod.title} onChange={e => updateModuleTitle(mod.id, e.target.value)} className="flex-1 bg-transparent text-sm font-semibold text-text-primary dark:text-dark-text outline-none border-none" />
                                            <button onClick={() => addLesson(mod.id)} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} />Lesson</button>
                                            {modules.length > 1 && <button onClick={() => removeModule(mod.id)} className="text-red-400 hover:text-red-500"><Trash2 size={14} /></button>}
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {mod.lessons.map((lesson, li) => (
                                                <div key={lesson.id} className="flex items-center gap-2">
                                                    <span className="text-xs text-text-faint w-9 text-right">{mi + 1}.{li + 1}</span>
                                                    <input defaultValue={lesson.title} className="flex-1 px-3 py-1.5 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-xs text-text-primary dark:text-dark-text outline-none focus:ring-1 focus:ring-primary/20" />
                                                    <select defaultValue={lesson.type} className="px-2 py-1.5 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-xs text-text-muted outline-none">
                                                        <option value="VIDEO">Video</option>
                                                        <option value="ARTICLE">Article</option>
                                                        <option value="QUIZ">Quiz</option>
                                                    </select>
                                                    <button onClick={() => removeLesson(mod.id, lesson.id)} className="text-red-400 hover:text-red-500 flex-shrink-0"><Trash2 size={13} /></button>
                                                </div>
                                            ))}
                                            {mod.lessons.length === 0 && (
                                                <p className="text-xs text-text-faint text-center py-2">No lessons yet — click &ldquo;Lesson&rdquo; to add one</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addModule} className="w-full py-3 border-2 border-dashed border-border dark:border-dark-border rounded-2xl text-sm text-text-muted hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                    <Plus size={16} /> Add Module
                                </button>
                            </div>
                        )}

                        {/* Step 2: Pricing */}
                        {step === 2 && (
                            <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 space-y-5">
                                <h2 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text">Pricing</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Paid Course', icon: <DollarSign size={20} />, value: false, color: 'text-primary bg-primary-tint dark:bg-dark-surface2' },
                                        { label: 'Free Course', icon: <Globe size={20} />, value: true, color: 'text-success bg-green-50 dark:bg-green-900/10' },
                                    ].map(opt => (
                                        <button key={opt.label} onClick={() => setIsFree(opt.value)}
                                            className={cn('flex flex-col items-center gap-2 py-6 rounded-2xl border-2 transition-all',
                                                isFree === opt.value ? 'border-primary' : 'border-border dark:border-dark-border hover:border-primary/30'
                                            )}>
                                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', opt.color)}>{opt.icon}</div>
                                            <span className="font-semibold text-text-primary dark:text-dark-text text-sm">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {!isFree && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Price (INR) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">₹</span>
                                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 2999" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <p className="text-xs text-text-muted mt-1">Recommended: ₹999 – ₹4,999 for best conversions</p>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Publish */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6">
                                    <h2 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text mb-4">Review & Publish</h2>
                                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                        {[
                                            { label: 'Title', value: title || '—' },
                                            { label: 'Category', value: category || '—' },
                                            { label: 'Difficulty', value: difficulty.charAt(0) + difficulty.slice(1).toLowerCase() },
                                            { label: 'Modules', value: `${modules.length} modules, ${totalLessons} lessons` },
                                            { label: 'Price', value: isFree ? 'Free' : price ? `₹${Number(price).toLocaleString('en-IN')}` : '—' },
                                            { label: 'Certificate', value: hasCertificate ? 'Yes' : 'No' },
                                        ].map(row => (
                                            <div key={row.label}>
                                                <p className="text-xs text-text-muted mb-0.5">{row.label}</p>
                                                <p className="font-medium text-text-primary dark:text-dark-text">{row.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-success/10 dark:bg-green-900/20 rounded-xl">
                                        <Check size={18} className="text-success flex-shrink-0" />
                                        <p className="text-sm text-text-primary dark:text-dark-text">Your course looks great! Publishing will make it available to all students immediately.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border dark:border-dark-border">
                    <button onClick={() => step === 0 ? router.back() : setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm hover:border-primary/30 transition-colors">
                        <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {step < STEPS.length - 1 ? (
                        <motion.button onClick={handleNext} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors" whileTap={{ scale: 0.97 }}>
                            Continue <ChevronRight size={16} />
                        </motion.button>
                    ) : (
                        <motion.button onClick={handlePublish} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-60" whileTap={{ scale: 0.97 }}>
                            {isSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</> : <><Check size={15} /> Publish Course</>}
                        </motion.button>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
