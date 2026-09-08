'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play, Pause, Volume2, Maximize, Settings, Clock,
    ChevronLeft, ChevronRight, CheckCircle2, FileText,
    MessageSquare, BookOpen, Lock, Bot, X, Send, Copy,
    RefreshCw, Lightbulb, List, ArrowLeft, ShieldAlert
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { modulesForC1, courses } from '@/data/mock-data'
import { checkCourseAccess } from '@/lib/api/courses'
import { cn, formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

const MOCK_AI_RESPONSES: Record<string, string> = {
    default: "Great question! Based on this lesson, I can help clarify that concept. React hooks are functions that let you use state and other React features without writing a class. The key rules are: only call hooks at the top level (not inside loops or conditions), and only call them from React function components.",
    explain: "Let me break this down simply: **useState** is like a container that holds some data. When you change the data, React automatically updates what's shown on screen. Think of it like a variable that's 'reactive' — when it changes, your UI changes too.\n\n```javascript\nconst [count, setCount] = useState(0);\n// count = current value\n// setCount = function to update it\n```",
    example: "Here's a practical example:\n\n```javascript\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n```\n\nEvery time you click the button, `setCount` updates the state and React re-renders the component.",
    summary: "**Lesson Summary: React Hooks**\n\n1. **useState** — manage local component state\n2. **useEffect** — handle side effects (API calls, subscriptions)\n3. **useContext** — consume React context\n4. **useMemo** — memoize expensive calculations\n5. **useCallback** — memoize callback functions\n\nAll hooks must be called at the top level of your functional component.",
}

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }

export default function LessonPage() {
    const { id, lessonId } = useParams<{ id: string; lessonId: string }>()
    const course = courses.find(c => c.id === id)
    const allLessons = modulesForC1.flatMap(m => m.lessons)
    const currentLesson = allLessons.find(l => l.id === lessonId) || allLessons[0]
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id)
    const prevLesson = allLessons[currentIndex - 1]
    const nextLesson = allLessons[currentIndex + 1]

    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(35)
    const [isCompleted, setIsCompleted] = useState(currentLesson?.isCompleted || false)
    const [isAIOpen, setIsAIOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [expandedMods, setExpandedMods] = useState(new Set(['m1', 'm2']))

    // Course Access State
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)
    const [hasAccess, setHasAccess] = useState<boolean | null>(null)
    const [courseDetails, setCourseDetails] = useState<any>(null)

    useEffect(() => {
        let isMounted = true
        const verify = async () => {
            if (!id) return
            try {
                const res = await checkCourseAccess(id)
                if (isMounted) {
                    setHasAccess(res.hasAccess)
                    setCourseDetails(res.course)
                }
            } catch (err) {
                // If checking fails or unauthenticated
                if (isMounted) {
                    setHasAccess(false)
                }
            } finally {
                if (isMounted) setIsCheckingAccess(false)
            }
        }
        verify()
        return () => { isMounted = false }
    }, [id])

    const markComplete = () => {
        setIsCompleted(true)
        toast.success('Lesson marked as complete! ✅')
    }

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim()
        if (!msg) return
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsTyping(true)
        await new Promise(r => setTimeout(r, 1200))
        const key = msg.toLowerCase().includes('example') ? 'example' : msg.toLowerCase().includes('explain') ? 'explain' : msg.toLowerCase().includes('summar') ? 'summary' : 'default'
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: MOCK_AI_RESPONSES[key], timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, aiMsg])
        setIsTyping(false)
    }

    // Locked screen if unauthorized
    if (isCheckingAccess) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400">Verifying course enrollment...</p>
            </div>
        )
    }

    if (hasAccess === false) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-5 shadow-lg">
                    <Lock size={32} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-white mb-2 tracking-tight">
                    You don't have access to this course
                </h1>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                    This course requires enrollment or purchase before you can view lessons, stream video content, and complete assignments.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href={`/student/courses/${id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
                    >
                        <BookOpen size={16} />
                        {courseDetails?.isFree ? 'Enroll for Free' : `Purchase Course ${courseDetails?.price ? `• ${formatPrice(courseDetails.price)}` : ''}`}
                    </Link>
                    <Link
                        href="/student/courses"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.08] text-slate-300 text-sm font-semibold hover:bg-white/[0.14] transition-colors"
                    >
                        Browse All Courses
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg flex flex-col">
            {/* Top bar */}
            <div className="h-14 bg-surface dark:bg-dark-surface border-b border-border dark:border-dark-border flex items-center px-4 gap-4 flex-shrink-0">
                <Link href={`/student/courses/${id}`}>
                    <button className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors">
                        <ArrowLeft size={16} /> {course?.title || 'Back to Course'}
                    </button>
                </Link>
                <div className="flex-1 hidden md:block">
                    <div className="h-1.5 bg-border dark:bg-dark-border rounded-full overflow-hidden max-w-md mx-auto">
                        <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <button
                    onClick={() => setIsAIOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors ml-auto"
                >
                    <Bot size={14} /> Ask AI Tutor
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar curriculum */}
                <div className="hidden lg:flex w-72 flex-shrink-0 bg-surface dark:bg-dark-surface border-r border-border dark:border-dark-border flex-col overflow-y-auto">
                    <div className="p-4 border-b border-border dark:border-dark-border">
                        <h2 className="font-sora font-semibold text-sm text-text-primary dark:text-dark-text">Course Content</h2>
                        <p className="text-xs text-text-muted mt-0.5">{allLessons.filter(l => l.isCompleted).length} / {allLessons.length} completed</p>
                    </div>
                    {modulesForC1.map(mod => (
                        <div key={mod.id}>
                            <button
                                onClick={() => setExpandedMods(prev => { const n = new Set(prev); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); return n })}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-background dark:hover:bg-dark-bg transition-colors text-left"
                            >
                                <span className="text-xs font-semibold text-text-primary dark:text-dark-text">{mod.title}</span>
                                <ChevronRight size={14} className={cn('text-text-faint transition-transform', expandedMods.has(mod.id) && 'rotate-90')} />
                            </button>
                            {expandedMods.has(mod.id) && mod.lessons.map(lesson => (
                                <Link key={lesson.id} href={lesson.isLocked ? '#' : `/student/courses/${id}/lessons/${lesson.id}`}>
                                    <div className={cn(
                                        'flex items-center gap-2 px-4 py-2.5 text-xs transition-colors border-l-2',
                                        lesson.id === currentLesson?.id ? 'bg-primary-tint dark:bg-dark-surface2 border-primary' : 'border-transparent hover:bg-background dark:hover:bg-dark-bg',
                                        lesson.isLocked && 'opacity-50 cursor-not-allowed'
                                    )}>
                                        {lesson.isCompleted ? <CheckCircle2 size={13} className="text-success flex-shrink-0" /> : lesson.isLocked ? <Lock size={13} className="text-text-faint flex-shrink-0" /> : <Play size={13} className="text-text-faint flex-shrink-0" />}
                                        <span className={cn('flex-1 truncate', lesson.id === currentLesson?.id && 'text-primary font-medium', !lesson.id && 'text-text-muted')}>{lesson.title}</span>
                                        <span className="text-text-faint ml-1">{lesson.duration}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Video player */}
                    <div className="aspect-video bg-black relative max-h-[70vh] w-full">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <BookOpen size={48} className="text-white opacity-20 mx-auto mb-2" />
                                <p className="text-white/40 text-sm">Video: {currentLesson?.title}</p>
                            </div>
                        </div>
                        {/* Controls overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setProgress(Math.round((e.clientX - rect.left) / rect.width * 100))
                            }}>
                                <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-white/80 transition-colors">
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <Volume2 size={16} className="text-white/70" />
                                <span className="text-white/70 text-xs">4:12 / 12:45</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    <button className="text-white/70 text-xs px-2 py-1 rounded hover:bg-white/10">1x</button>
                                    <Settings size={16} className="text-white/70" />
                                    <Maximize size={16} className="text-white/70" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lesson info */}
                    <div className="p-6 max-w-4xl">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h1 className="font-sora font-bold text-xl text-text-primary dark:text-dark-text mb-1">{currentLesson?.title}</h1>
                                <p className="text-text-muted text-sm flex items-center gap-2">
                                    <Clock size={13} /> {currentLesson?.duration}
                                </p>
                            </div>
                            <motion.button
                                onClick={markComplete}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0',
                                    isCompleted ? 'bg-success/15 text-success border border-success/30' : 'bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text-muted hover:border-primary/30'
                                )}
                                whileTap={{ scale: 0.97 }}
                            >
                                <CheckCircle2 size={15} className={isCompleted ? 'fill-success' : ''} />
                                {isCompleted ? 'Completed' : 'Mark Complete'}
                            </motion.button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-4 border-t border-border dark:border-dark-border">
                            {prevLesson ? (
                                <Link href={`/student/courses/${id}/lessons/${prevLesson.id}`}>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border dark:border-dark-border text-text-muted hover:border-primary/30 hover:text-primary text-sm transition-colors">
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                </Link>
                            ) : <div />}
                            {nextLesson && (
                                <Link href={`/student/courses/${id}/lessons/${nextLesson.id}`}>
                                    <motion.button
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Next Lesson <ChevronRight size={16} />
                                    </motion.button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Tutor Drawer */}
            <AnimatePresence>
                {isAIOpen && (
                    <>
                        <motion.div className="fixed inset-0 bg-black/30 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAIOpen(false)} />
                        <motion.div
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface dark:bg-dark-surface border-l border-border dark:border-dark-border z-50 flex flex-col shadow-modal"
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border dark:border-dark-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-text-primary dark:text-dark-text">AI Tutor</p>
                                        <p className="text-xs text-success flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full inline-block" />Online</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAIOpen(false)} className="text-text-faint hover:text-text-muted transition-colors"><X size={18} /></button>
                            </div>

                            {/* Quick actions */}
                            <div className="p-3 border-b border-border dark:border-dark-border">
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: 'Explain simply', icon: <Lightbulb size={11} />, msg: 'Can you explain this lesson in simple terms?' },
                                        { label: 'Give an example', icon: <Bot size={11} />, msg: 'Give me a practical example of this concept' },
                                        { label: 'Summarize', icon: <List size={11} />, msg: 'Summarize this lesson for me' },
                                    ].map(a => (
                                        <button key={a.label} onClick={() => sendMessage(a.msg)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-tint dark:bg-dark-surface2 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors">
                                            {a.icon} {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-8">
                                        <Bot size={32} className="mx-auto text-text-faint mb-3 opacity-40" />
                                        <p className="text-sm text-text-muted">Ask me anything about this lesson!</p>
                                    </div>
                                )}
                                {messages.map(msg => (
                                    <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'justify-end')}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Bot size={13} className="text-white" />
                                            </div>
                                        )}
                                        <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed',
                                            msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-background dark:bg-dark-bg border border-border dark:border-dark-border text-text-primary dark:text-dark-text rounded-tl-sm'
                                        )}>
                                            {msg.content}
                                            {msg.role === 'assistant' && (
                                                <button onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied!') }} className="mt-2 flex items-center gap-1 text-text-faint hover:text-text-muted text-xs transition-colors">
                                                    <Copy size={10} /> Copy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-2 items-center">
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"><Bot size={13} className="text-white" /></div>
                                        <div className="flex gap-1 px-4 py-3 bg-background dark:bg-dark-bg border border-border dark:border-dark-border rounded-2xl rounded-tl-sm">
                                            {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 bg-text-faint rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-border dark:border-dark-border">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                                        placeholder="Ask anything about this lesson..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-sm text-text-primary dark:text-dark-text placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <motion.button
                                        onClick={() => sendMessage()}
                                        className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                                        whileTap={{ scale: 0.95 }}
                                        disabled={!input.trim() && !isTyping}
                                    >
                                        <Send size={16} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
