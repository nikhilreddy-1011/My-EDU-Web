'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Clock, Users, Video, CheckCircle2, FileText, Film,
    Download, Play, Bell, Search, Filter, Eye, BookOpen, Tag, Star
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { mockLectures, mockNotes } from '@/data/mock-data'
import { formatDate, formatTime, formatDuration, cn } from '@/lib/utils'
import { getLiveClasses } from '@/lib/api/live-classes'
import { connectSocket } from '@/lib/socket'
import { toast } from 'sonner'

const MAIN_TABS = ['Live Classes', 'Lectures', 'Notes'] as const
type MainTab = typeof MAIN_TABS[number]

const CLASS_TABS = ['Upcoming', 'Live Now', 'Completed'] as const
type ClassTab = typeof CLASS_TABS[number]

// ── Countdown ──────────────────────────────────────────────────
function useCountdown(targetDate: string) {
    const [diff, setDiff] = React.useState(0)
    useEffect(() => {
        const update = () => setDiff(new Date(targetDate).getTime() - Date.now())
        update()
        const t = setInterval(update, 1000)
        return () => clearInterval(t)
    }, [targetDate])
    const totalSecs = Math.max(0, Math.floor(diff / 1000))
    const days = Math.floor(totalSecs / 86400)
    const hrs  = Math.floor((totalSecs % 86400) / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return { days, hrs, mins, secs, isPast: diff < 0 }
}

function CountdownUnit({ val, label }: { val: number; label: string }) {
    return (
        <span className="inline-flex items-baseline gap-0.5 font-mono">
            <span className="font-bold text-sm text-text-primary dark:text-dark-text">{String(val).padStart(2, '0')}</span>
            <span className="text-xs text-text-muted">{label}</span>
        </span>
    )
}

export default function StudentLiveClassesPage() {
    const [mainTab, setMainTab] = useState<MainTab>('Live Classes')
    const [classTab, setClassTab] = useState<ClassTab>('Upcoming')
    const [searchQuery, setSearchQuery] = useState('')
    const [reminders, setReminders] = useState<Set<string>>(new Set())

    const [classesList, setClassesList] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchLiveClassesData = async () => {
        setIsLoading(true)
        try {
            const res = await getLiveClasses()
            if (res.success && Array.isArray(res.classes)) {
                const mapped = res.classes.map(c => ({
                    id: c.meetingId || c._id,
                    meetingId: c.meetingId || c._id,
                    _id: c._id,
                    title: c.title,
                    description: c.description,
                    course: {
                        id: c.course?._id || '',
                        title: c.courseTitle || c.course?.title || 'Live Session',
                        category: c.course?.category || 'Workshop',
                    },
                    instructorId: typeof c.instructor === 'string' ? c.instructor : (c.instructor?._id || ''),
                    instructor: {
                        name: c.instructorName || (typeof c.instructor === 'object' ? c.instructor?.name : 'Instructor'),
                        avatar: c.instructorAvatar || (typeof c.instructor === 'object' ? c.instructor?.avatar : ''),
                        title: 'Instructor',
                    },
                    date: c.scheduledAt,
                    duration: c.duration || 60,
                    status: c.status,
                    attendees: c.attendeesCount || 0,
                    maxAttendees: c.maxSeats || 500,
                    meetingUrl: c.meetingUrl || `/student/live-classes/${c.meetingId || c._id}`,
                    tags: c.tags || [],
                }))
                setClassesList(mapped)
            } else {
                setClassesList([])
            }
        } catch (err) {
            console.error('Failed to load live classes:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLiveClassesData()

        const socket = connectSocket()
        const onScheduled = (newClass: any) => {
            fetchLiveClassesData()
            toast.info(`New live session announced: "${newClass.title}" 🔔`)
        }
        const onStatusChanged = ({ meetingId, id, status }: any) => {
            setClassesList(prev => prev.map(c => 
                (c.meetingId === meetingId || c.id === meetingId || c._id === id || c.id === id)
                    ? { ...c, status }
                    : c
            ))
        }

        socket.on('live_class_scheduled', onScheduled)
        socket.on('live_class_status_changed', onStatusChanged)

        return () => {
            socket.off('live_class_scheduled', onScheduled)
            socket.off('live_class_status_changed', onStatusChanged)
        }
    }, [])

    const upcoming = classesList.filter(lc => lc.status === 'UPCOMING')
    const live      = classesList.filter(lc => lc.status === 'LIVE')
    const completed = classesList.filter(lc => lc.status === 'COMPLETED')

    const classes = (classTab === 'Upcoming' ? upcoming : classTab === 'Live Now' ? live : completed)
        .filter(lc => lc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lc.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    const filteredLectures = mockLectures.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const filteredNotes = mockNotes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleReminder = (id: string, title: string) => {
        setReminders(prev => {
            const next = new Set(prev)
            if (next.has(id)) { next.delete(id); toast('Reminder removed') }
            else { next.add(id); toast.success(`Reminder set for "${title}" 🔔`) }
            return next
        })
    }

    const handleDownload = (name: string) => {
        toast.success(`Downloading "${name}"...`)
    }

    return (
        <AppLayout title="Live Classes">
            <div className="max-w-5xl mx-auto space-y-5">
                {/* Header */}
                <div>
                    <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Live Classes</h1>
                    <p className="text-text-muted text-sm">Join live sessions, watch lectures, download resources</p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Live Now', value: live.length, icon: <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
                        { label: 'Upcoming', value: upcoming.length, icon: <Calendar size={13} />, color: 'text-primary bg-primary-tint' },
                        { label: 'Lectures', value: mockLectures.length, icon: <Film size={13} />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
                        { label: 'Notes', value: mockNotes.length, icon: <FileText size={13} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4">
                            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', s.color)}>{s.icon}</div>
                            <div className="font-bold text-xl text-text-primary dark:text-dark-text">{s.value}</div>
                            <div className="text-xs text-text-muted">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Main Tabs */}
                <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl w-fit">
                    {MAIN_TABS.map(tab => (
                        <button key={tab} onClick={() => { setMainTab(tab); setSearchQuery('') }}
                            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                                mainTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                            {tab === 'Live Classes' && <Video size={14} />}
                            {tab === 'Lectures' && <Film size={14} />}
                            {tab === 'Notes' && <FileText size={14} />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Search bar ── */}
                <div className="relative max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder={`Search ${mainTab.toLowerCase()}...`}
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                {/* ── Live Classes Tab ─────────────────────────── */}
                {mainTab === 'Live Classes' && (
                    <div className="space-y-4">
                        {/* Sub-tabs */}
                        <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl w-fit">
                            {CLASS_TABS.map(tab => {
                                const count = tab === 'Live Now' ? live.length : tab === 'Upcoming' ? upcoming.length : completed.length
                                return (
                                    <button key={tab} onClick={() => setClassTab(tab)}
                                        className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                                            classTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                                        {tab === 'Live Now' && count > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                        {tab}
                                        {count > 0 && <span className={cn('text-xs px-1.5 py-0.5 rounded-full', classTab === tab ? 'bg-white/20' : 'bg-border dark:bg-dark-border')}>{count}</span>}
                                    </button>
                                )
                            })}
                        </div>

                        {classes.length === 0 ? (
                            <div className="text-center py-20 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
                                <Video size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                                <h3 className="font-semibold text-text-primary dark:text-dark-text mb-1">No {classTab.toLowerCase()} classes</h3>
                                <p className="text-text-muted text-sm">Check back later for upcoming live sessions</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {classes.map((lc, i) => (
                                    <StudentClassCard key={lc.id} lc={lc} index={i}
                                        hasReminder={reminders.has(lc.id)}
                                        onToggleReminder={() => toggleReminder(lc.id, lc.title)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Lectures Tab ─────────────────────────────── */}
                {mainTab === 'Lectures' && (
                    <div className="space-y-4">
                        {filteredLectures.length === 0 ? (
                            <div className="text-center py-20 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
                                <Film size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                                <h3 className="font-semibold text-text-primary dark:text-dark-text">No lectures found</h3>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
                                {filteredLectures.map((lec, i) => (
                                    <motion.div key={lec.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                        className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 flex gap-4 hover:shadow-card transition-all group">
                                        <div className="relative w-36 h-22 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={lec.thumbnail} alt={lec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ height: '88px' }} />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                    <Play size={16} className="text-gray-900 ml-1" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">{lec.duration}</div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text text-sm mb-1 line-clamp-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{lec.title}</h3>
                                            <p className="text-text-muted text-xs mb-2 line-clamp-2">{lec.description}</p>
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="w-5 h-5 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center text-xs font-bold text-primary">{lec.instructor.name.charAt(0)}</div>
                                                <span className="text-xs text-text-muted">{lec.instructor.name}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-2">
                                                <span className="flex items-center gap-1"><Eye size={11} />{lec.views.toLocaleString()} views</span>
                                                <span className="flex items-center gap-1"><Film size={11} />{lec.fileSize}</span>
                                                <span>{formatDate(lec.uploadedAt)}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {lec.tags.map(t => (
                                                    <span key={t} className="text-xs bg-primary-tint dark:bg-dark-surface2 text-primary px-2 py-0.5 rounded-full">{t}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <Link href={`/student/live-classes/lecture/${lec.id}`}>
                                                <button className="px-3 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-1.5">
                                                    <Play size={12} /> Watch
                                                </button>
                                            </Link>
                                            {lec.isDownloadable ? (
                                                <button onClick={() => handleDownload(lec.title)}
                                                    className="px-3 py-2 border border-border dark:border-dark-border text-text-muted text-xs rounded-xl hover:border-primary/30 transition-colors flex items-center gap-1.5">
                                                    <Download size={12} /> Download
                                                </button>
                                            ) : (
                                                <span className="px-3 py-2 text-xs text-text-faint text-center">No DL</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Notes Tab ─────────────────────────────────── */}
                {mainTab === 'Notes' && (
                    <div className="space-y-3">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-20 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
                                <FileText size={48} className="mx-auto text-text-faint mb-4 opacity-30" />
                                <h3 className="font-semibold text-text-primary dark:text-dark-text">No notes found</h3>
                            </div>
                        ) : (
                            filteredNotes.map((note, i) => (
                                <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-card transition-all">
                                    <div className={cn('w-14 h-16 rounded-xl flex flex-col items-center justify-center gap-1 flex-shrink-0',
                                        note.fileType === 'PDF' ? 'bg-red-50 dark:bg-red-900/20' :
                                        note.fileType === 'PPTX' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20')}>
                                        <FileText size={20} className={note.fileType === 'PDF' ? 'text-red-500' : note.fileType === 'PPTX' ? 'text-orange-500' : 'text-blue-500'} />
                                        <span className={cn('text-xs font-bold', note.fileType === 'PDF' ? 'text-red-500' : note.fileType === 'PPTX' ? 'text-orange-500' : 'text-blue-500')}>{note.fileType}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary dark:text-dark-text text-sm mb-0.5 line-clamp-1">{note.title}</h3>
                                        <p className="text-text-muted text-xs mb-2 line-clamp-2">{note.description}</p>
                                        <div className="flex items-center gap-1 mb-1">
                                            <div className="w-5 h-5 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center text-xs font-bold text-primary">{note.instructor.name.charAt(0)}</div>
                                            <span className="text-xs text-text-muted">{note.instructor.name}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                                            <span>{note.pages} pages · {note.fileSize}</span>
                                            <span className="flex items-center gap-1"><Download size={11} />{note.downloads.toLocaleString()} downloads</span>
                                            <span>{formatDate(note.uploadedAt)}</span>
                                        </div>
                                    </div>

                                    <motion.button onClick={() => handleDownload(note.title)}
                                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                        <Download size={13} /> Download
                                    </motion.button>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}

// ── StudentClassCard — proper component so hooks work ──────────
function StudentClassCard({ lc, index, hasReminder, onToggleReminder }: {
    lc: any
    index: number
    hasReminder: boolean
    onToggleReminder: () => void
}) {
    const countdown = useCountdown(lc.date)
    const fillPct = lc.maxAttendees ? Math.round((lc.attendees! / lc.maxAttendees) * 100) : 0

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
            className={cn('bg-surface dark:bg-dark-surface border rounded-2xl p-5 hover:shadow-card transition-all',
                lc.status === 'LIVE' ? 'border-red-300 dark:border-red-800 shadow-sm' : 'border-border dark:border-dark-border')}>

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {lc.status === 'LIVE' && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full animate-pulse">
                                ● LIVE NOW
                            </span>
                        )}
                        {lc.status === 'COMPLETED' && (
                            <span className="flex items-center gap-1 text-xs font-medium text-text-faint bg-border/50 dark:bg-dark-border/50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} /> Completed
                            </span>
                        )}
                        <span className="text-xs text-primary bg-primary-tint dark:bg-dark-surface2 px-2 py-0.5 rounded-full font-medium">{lc.course.category}</span>
                    </div>

                    <h3 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-1">{lc.title}</h3>
                    {lc.description && <p className="text-text-muted text-sm mb-2">{lc.description}</p>}

                    <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-2">
                        <span className="flex items-center gap-1"><Video size={12} />{lc.instructor.name}</span>
                        {lc.status !== 'LIVE' && <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(lc.date)} at {formatTime(lc.date)}</span>}
                        <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(lc.duration)}</span>
                        {lc.attendees && <span className="flex items-center gap-1"><Users size={12} />{lc.attendees.toLocaleString()}{lc.maxAttendees ? ` / ${lc.maxAttendees}` : ''}</span>}
                    </div>

                    {lc.status === 'UPCOMING' && !countdown.isPast && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <Bell size={11} className="text-text-faint" />
                            <span className="text-xs text-text-muted">Starts in </span>
                            {countdown.days > 0 && <CountdownUnit val={countdown.days} label="d" />}
                            <CountdownUnit val={countdown.hrs} label="h" />
                            <CountdownUnit val={countdown.mins} label="m" />
                            <CountdownUnit val={countdown.secs} label="s" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                    {lc.status === 'LIVE' && (
                        <Link href={`/student/live-classes/${lc.meetingId || lc.id}`}>
                            <motion.button className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />Join Now
                            </motion.button>
                        </Link>
                    )}
                    {lc.status === 'UPCOMING' && (
                        <button onClick={onToggleReminder}
                            className={cn('px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors',
                                hasReminder ? 'bg-primary-tint text-primary dark:bg-dark-surface2' : 'border border-border dark:border-dark-border text-text-muted hover:border-primary/30')}>
                            <Bell size={14} className={hasReminder ? 'fill-current' : ''} />
                            {hasReminder ? 'Reminder Set' : 'Set Reminder'}
                        </button>
                    )}
                    {lc.status === 'COMPLETED' && (
                        <button onClick={() => toast.info('Recording will be available within 24 hours')}
                            className="flex items-center gap-1.5 px-4 py-2 border border-border dark:border-dark-border text-text-muted text-sm rounded-xl hover:border-primary/30 transition-colors">
                            <Play size={13} /> Watch Recording
                        </button>
                    )}
                </div>
            </div>

            {lc.maxAttendees && lc.status === 'UPCOMING' && (
                <div className="mt-4 pt-4 border-t border-border dark:border-dark-border">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Seats filling up</span>
                        <span>{lc.attendees} / {lc.maxAttendees} — {fillPct}%</span>
                    </div>
                    <div className="h-1.5 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', fillPct > 80 ? 'bg-red-400' : 'bg-primary')}
                            style={{ width: `${fillPct}%` }} />
                    </div>
                </div>
            )}
        </motion.div>
    )
}
