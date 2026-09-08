'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Video, Calendar, Users, Clock, X, Check, Upload, FileText,
    Film, Trash2, Edit3, Copy, Bell, Monitor, MoreVertical, Download,
    Eye, BookOpen, Search, Filter, ChevronDown, AlertCircle, Wifi,
    Play, Mic, Layers, Radio
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { mockLectures, mockNotes, Lecture, ClassNote } from '@/data/mock-data'
import { formatDate, formatTime, formatDuration, cn } from '@/lib/utils'
import { getLiveClasses, scheduleLiveClass, updateLiveClassStatus, deleteLiveClass, LiveClassItem } from '@/lib/api/live-classes'
import { getCourses } from '@/lib/api/courses'
import { toast } from 'sonner'

const MAIN_TABS = ['Live Classes', 'Lectures', 'Notes'] as const
type MainTab = typeof MAIN_TABS[number]

const CLASS_TABS = ['Upcoming', 'Live Now', 'Completed'] as const
type ClassTab = typeof CLASS_TABS[number]

// ── Countdown helper ─────────────────────────────────────────
function useCountdown(targetDate: string) {
    const [diff, setDiff] = React.useState(0)
    React.useEffect(() => {
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

export default function TeacherLiveClassesPage() {
    const [mainTab, setMainTab] = useState<MainTab>('Live Classes')
    const [classTab, setClassTab] = useState<ClassTab>('Upcoming')
    const [showSchedule, setShowSchedule] = useState(false)
    const [showUploadLecture, setShowUploadLecture] = useState(false)
    const [showUploadNote, setShowUploadNote] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCourse, setSelectedCourse] = useState('all')

    // Schedule form state
    const [form, setForm] = useState({
        title: '', description: '', date: '', duration: '60',
        course: 'all', maxSeats: '500', platform: 'in-app', recurring: 'none'
    })
    const [isScheduling, setIsScheduling] = useState(false)

    // Lecture upload state
    const [lecForm, setLecForm] = useState({ title: '', description: '', course: 'c1', tags: '' })
    const [lecFile, setLecFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Note upload state
    const [noteForm, setNoteForm] = useState({ title: '', description: '', course: 'c1' })
    const [noteFile, setNoteFile] = useState<File | null>(null)

    // Local lists
    const [classesList, setClassesList] = useState<any[]>([])
    const [availableCourses, setAvailableCourses] = useState<any[]>([])
    const [isLoadingClasses, setIsLoadingClasses] = useState(true)

    const [lectures, setLectures] = useState<Lecture[]>(mockLectures.filter(l => l.instructorId === 't1'))
    const [notes, setNotes] = useState<ClassNote[]>(mockNotes.filter(n => n.instructorId === 't1'))

    const fileInputRef = useRef<HTMLInputElement>(null)
    const noteInputRef = useRef<HTMLInputElement>(null)

    const fetchClasses = async () => {
        setIsLoadingClasses(true)
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
                        title: c.courseTitle || c.course?.title || 'General Session',
                        category: c.course?.category || 'Live Workshop',
                    },
                    instructorId: typeof c.instructor === 'string' ? c.instructor : (c.instructor?._id || ''),
                    instructor: {
                        name: c.instructorName || (typeof c.instructor === 'object' ? c.instructor?.name : 'Instructor'),
                        avatar: c.instructorAvatar || (typeof c.instructor === 'object' ? c.instructor?.avatar : ''),
                        title: 'Lead Instructor',
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
            console.error('Failed to load live classes from API:', err)
        } finally {
            setIsLoadingClasses(false)
        }
    }

    useEffect(() => {
        fetchClasses()

        getCourses()
            .then(res => {
                if (res && res.success && Array.isArray(res.courses)) {
                    setAvailableCourses(res.courses)
                }
            })
            .catch(() => {})
    }, [])

    const filteredClasses = classesList.filter(lc =>
        classTab === 'Live Now' ? lc.status === 'LIVE' :
        classTab === 'Upcoming' ? lc.status === 'UPCOMING' :
        lc.status === 'COMPLETED'
    ).filter(lc => lc.title?.toLowerCase().includes(searchQuery.toLowerCase()))

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim() || !form.date) {
            toast.error('Please enter a class title and scheduled date/time')
            return
        }

        setIsScheduling(true)
        try {
            const res = await scheduleLiveClass({
                title: form.title,
                description: form.description,
                course: form.course === 'all' ? undefined : form.course,
                date: form.date,
                duration: Number(form.duration) || 60,
                maxSeats: Number(form.maxSeats) || 500,
                platform: form.platform,
            })

            if (res.success && res.liveClass) {
                toast.success(`"${res.liveClass.title}" scheduled! 📅 Invite links sent to students.`)
                await fetchClasses()
                setClassTab('Upcoming')
                setShowSchedule(false)
                setForm({
                    title: '', description: '', date: '', duration: '60',
                    course: 'all', maxSeats: '500', platform: 'in-app', recurring: 'none'
                })
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to schedule live class')
        } finally {
            setIsScheduling(false)
        }
    }

    const handleStartLive = async (classItem: any) => {
        try {
            await updateLiveClassStatus(classItem.meetingId || classItem._id || classItem.id, 'LIVE')
            toast.success(`"${classItem.title}" is now LIVE! 🔴`)
            setClassesList(prev => prev.map(c => 
                (c.id === classItem.id || c.meetingId === classItem.meetingId) 
                    ? { ...c, status: 'LIVE' } 
                    : c
            ))
            setClassTab('Live Now')
        } catch (err: any) {
            toast.error(err.message || 'Failed to update class status to LIVE')
        }
    }

    const simulateUpload = (cb: () => void) => {
        setUploading(true); setUploadProgress(0)
        let p = 0
        const iv = setInterval(() => {
            p += Math.random() * 18
            if (p >= 100) { clearInterval(iv); setUploadProgress(100); setTimeout(() => { setUploading(false); setUploadProgress(0); cb() }, 400) }
            else setUploadProgress(Math.min(p, 99))
        }, 200)
    }

    const handleLectureUpload = (e: React.FormEvent) => {
        e.preventDefault()
        if (!lecForm.title) { toast.error('Please enter a title'); return }
        simulateUpload(() => {
            const newLec: Lecture = {
                id: `lec${Date.now()}`, title: lecForm.title, description: lecForm.description,
                courseId: lecForm.course, instructorId: 't1', instructor: mockLectures[0].instructor,
                duration: '0:00', fileSize: lecFile ? `${(lecFile.size / 1e9).toFixed(1)} GB` : '—',
                uploadedAt: new Date().toISOString(), views: 0,
                thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
                videoUrl: '', tags: lecForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                isDownloadable: true,
            }
            setLectures(prev => [newLec, ...prev])
            toast.success('Lecture uploaded successfully! 🎬 Students have been notified.')
            setShowUploadLecture(false)
            setLecForm({ title: '', description: '', course: 'c1', tags: '' })
            setLecFile(null)
        })
    }

    const handleNoteUpload = (e: React.FormEvent) => {
        e.preventDefault()
        if (!noteForm.title || !noteFile) { toast.error('Please select a file and enter a title'); return }
        const newNote: ClassNote = {
            id: `note${Date.now()}`, title: noteForm.title, description: noteForm.description,
            courseId: noteForm.course, instructorId: 't1', instructor: mockNotes[0].instructor,
            fileType: noteFile.name.endsWith('.pdf') ? 'PDF' : noteFile.name.endsWith('.pptx') ? 'PPTX' : 'DOC',
            fileSize: `${(noteFile.size / 1e6).toFixed(1)} MB`,
            pages: Math.floor(Math.random() * 30) + 5,
            uploadedAt: new Date().toISOString(), downloads: 0,
            fileUrl: URL.createObjectURL(noteFile),
        }
        setNotes(prev => [newNote, ...prev])
        toast.success('Notes uploaded! 📄 Students can now download them.')
        setShowUploadNote(false)
        setNoteForm({ title: '', description: '', course: 'c1' })
        setNoteFile(null)
    }

    return (
        <AppLayout title="Live Classes">
            <div className="max-w-5xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-1">Live Classes</h1>
                        <p className="text-text-muted text-sm">Schedule sessions, upload lectures & share resources</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <motion.button onClick={() => setShowUploadNote(true)}
                            className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-dark-border text-text-primary dark:text-dark-text text-sm font-medium rounded-xl hover:border-primary/40 transition-colors"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            <FileText size={15} /> Upload Notes
                        </motion.button>
                        <motion.button onClick={() => setShowUploadLecture(true)}
                            className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-dark-border text-text-primary dark:text-dark-text text-sm font-medium rounded-xl hover:border-primary/40 transition-colors"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            <Film size={15} /> Upload Lecture
                        </motion.button>
                        <motion.button onClick={() => setShowSchedule(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-hover transition-colors"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            <Plus size={16} /> Schedule Class
                        </motion.button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total Classes', value: classesList.length, icon: <Radio size={14} />, color: 'text-primary bg-primary-tint' },
                        { label: 'Lectures', value: lectures.length, icon: <Film size={14} />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
                        { label: 'Notes', value: notes.length, icon: <FileText size={14} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Total Students', value: classesList.reduce((a: number, lc: any) => a + (lc.attendees || 0), 0).toLocaleString(), icon: <Users size={14} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
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
                        <button key={tab} onClick={() => setMainTab(tab)}
                            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                                mainTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                            {tab === 'Live Classes' && <Video size={14} />}
                            {tab === 'Lectures' && <Film size={14} />}
                            {tab === 'Notes' && <FileText size={14} />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Live Classes Tab ────────────────── */}
                {mainTab === 'Live Classes' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-3 items-center flex-wrap">
                            <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl">
                                {CLASS_TABS.map(tab => {
                                    const count = classesList.filter((lc: any) =>
                                        tab === 'Live Now' ? lc.status === 'LIVE' :
                                        tab === 'Upcoming' ? lc.status === 'UPCOMING' : lc.status === 'COMPLETED'
                                    ).length
                                    return (
                                        <button key={tab} onClick={() => setClassTab(tab)}
                                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                                                classTab === tab ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                                            {tab === 'Live Now' && count > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                            {tab}
                                            {count > 0 && <span className={cn('text-xs px-1.5 py-0.5 rounded-full', classTab === tab ? 'bg-white/20' : 'bg-border dark:bg-dark-border')}>{count}</span>}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="relative flex-1 max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search classes..." className="w-full pl-8 pr-4 py-1.5 rounded-xl text-sm border border-border dark:border-dark-border bg-surface dark:bg-dark-surface text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                        </div>

                        {filteredClasses.length === 0 ? (
                            <EmptyState icon={<Video size={40} className="opacity-30" />} label={`No ${classTab.toLowerCase()} classes`}
                                action={<button onClick={() => setShowSchedule(true)} className="mt-3 text-sm text-primary hover:underline">Schedule a live class</button>} />
                        ) : (
                            <div className="space-y-4">
                                {filteredClasses.map((lc, i) => (
                                    <ClassCard key={lc.id} lc={lc} index={i} isTeacher onStartLive={handleStartLive} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Lectures Tab ────────────────── */}
                {mainTab === 'Lectures' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-muted">{lectures.length} uploaded lectures</p>
                            <button onClick={() => setShowUploadLecture(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                                <Upload size={13} /> Upload Lecture
                            </button>
                        </div>
                        {lectures.length === 0 ? (
                            <EmptyState icon={<Film size={40} className="opacity-30" />} label="No lectures uploaded yet"
                                action={<button onClick={() => setShowUploadLecture(true)} className="mt-3 text-sm text-primary hover:underline">Upload your first lecture</button>} />
                        ) : (
                            <div className="grid gap-4">
                                {lectures.map((lec, i) => (
                                    <motion.div key={lec.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                        className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 flex gap-4 hover:shadow-card transition-all">
                                        <div className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={lec.thumbnail} alt={lec.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                                    <Play size={14} className="text-gray-900 ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">{lec.duration}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text text-sm mb-1 line-clamp-1">{lec.title}</h3>
                                            <p className="text-text-muted text-xs mb-2 line-clamp-2">{lec.description}</p>
                                            <div className="flex flex-wrap gap-3 text-xs text-text-muted mb-2">
                                                <span className="flex items-center gap-1"><Eye size={11} />{lec.views.toLocaleString()} views</span>
                                                <span className="flex items-center gap-1"><Film size={11} />{lec.fileSize}</span>
                                                <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(lec.uploadedAt)}</span>
                                                {lec.isDownloadable && <span className="text-emerald-600 flex items-center gap-1"><Download size={11} />Downloadable</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {lec.tags.map(t => <span key={t} className="text-xs bg-primary-tint dark:bg-dark-surface2 text-primary px-2 py-0.5 rounded-full">{t}</span>)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <button onClick={() => toast.info('Opening video player...')}
                                                className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark transition-colors">Preview</button>
                                            <button onClick={() => { setLectures(prev => prev.filter(l => l.id !== lec.id)); toast.success('Lecture deleted') }}
                                                className="px-3 py-1.5 border border-red-200 dark:border-red-900 text-red-500 text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Delete</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Notes Tab ────────────────── */}
                {mainTab === 'Notes' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-muted">{notes.length} uploaded documents</p>
                            <button onClick={() => setShowUploadNote(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                                <Upload size={13} /> Upload Notes
                            </button>
                        </div>
                        {notes.length === 0 ? (
                            <EmptyState icon={<FileText size={40} className="opacity-30" />} label="No notes uploaded yet"
                                action={<button onClick={() => setShowUploadNote(true)} className="mt-3 text-sm text-primary hover:underline">Upload your first note</button>} />
                        ) : (
                            <div className="grid gap-3">
                                {notes.map((note, i) => (
                                    <motion.div key={note.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                        className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-card transition-all">
                                        <div className={cn('w-12 h-14 rounded-xl flex flex-col items-center justify-center gap-1 flex-shrink-0',
                                            note.fileType === 'PDF' ? 'bg-red-50 dark:bg-red-900/20' :
                                            note.fileType === 'PPTX' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20')}>
                                            <FileText size={18} className={note.fileType === 'PDF' ? 'text-red-500' : note.fileType === 'PPTX' ? 'text-orange-500' : 'text-blue-500'} />
                                            <span className="text-xs font-bold" style={{ color: note.fileType === 'PDF' ? '#ef4444' : note.fileType === 'PPTX' ? '#f97316' : '#3b82f6' }}>{note.fileType}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-primary dark:text-dark-text text-sm mb-0.5">{note.title}</h3>
                                            <p className="text-text-muted text-xs mb-1 line-clamp-1">{note.description}</p>
                                            <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                                                <span>{note.pages} pages</span>
                                                <span>{note.fileSize}</span>
                                                <span className="flex items-center gap-1"><Download size={11} />{note.downloads} downloads</span>
                                                <span>{formatDate(note.uploadedAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => toast.success('Download started!')}
                                                className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1">
                                                <Download size={12} /> Download
                                            </button>
                                            <button onClick={() => { setNotes(prev => prev.filter(n => n.id !== note.id)); toast.success('Note deleted') }}
                                                className="p-1.5 border border-red-200 dark:border-red-900 text-red-500 text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Schedule Modal ───────────────────────────────── */}
                <AnimatePresence>
                    {showSchedule && (
                        <Modal title="Schedule Live Class" onClose={() => setShowSchedule(false)}>
                            <form onSubmit={handleSchedule} className="space-y-4">
                                <FieldRow>
                                    <Field label="Class Title *">
                                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="e.g. Advanced React Patterns Q&A" required
                                            className="input-base" />
                                    </Field>
                                </FieldRow>
                                <Field label="Description">
                                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="What will students learn?" rows={2} className="input-base resize-none" />
                                </Field>
                                <FieldRow>
                                    <Field label="Date & Time *">
                                        <input type="datetime-local" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                            required className="input-base" />
                                    </Field>
                                    <Field label="Duration">
                                        <select value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className="input-base">
                                            {['30', '45', '60', '75', '90', '120', '150', '180'].map(d => <option key={d}>{d} min</option>)}
                                        </select>
                                    </Field>
                                </FieldRow>
                                <FieldRow>
                                    <Field label="Course">
                                        <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} className="input-base">
                                            <option value="all">General Live Session (All Students)</option>
                                            {availableCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Max Seats">
                                        <input type="number" value={form.maxSeats} onChange={e => setForm(p => ({ ...p, maxSeats: e.target.value }))}
                                            min="1" max="2000" className="input-base" />
                                    </Field>
                                </FieldRow>
                                <FieldRow>
                                    <Field label="Platform">
                                        <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="input-base">
                                            <option value="zoom">Zoom</option>
                                            <option value="meet">Google Meet</option>
                                            <option value="teams">MS Teams</option>
                                            <option value="learnsphere">LearnSphere Built-in</option>
                                        </select>
                                    </Field>
                                    <Field label="Recurrence">
                                        <select value={form.recurring} onChange={e => setForm(p => ({ ...p, recurring: e.target.value }))} className="input-base">
                                            <option value="none">No Repeat</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </Field>
                                </FieldRow>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowSchedule(false)}
                                        className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm hover:border-primary/30 transition-colors">Cancel</button>
                                    <motion.button type="submit" disabled={isScheduling}
                                        className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
                                        whileTap={{ scale: 0.97 }}>
                                        {isScheduling ? 'Scheduling...' : 'Schedule Class'}
                                    </motion.button>
                                </div>
                            </form>
                        </Modal>
                    )}
                </AnimatePresence>

                {/* ── Upload Lecture Modal ─────────────────────────── */}
                <AnimatePresence>
                    {showUploadLecture && (
                        <Modal title="Upload Lecture Video" onClose={() => { if (!uploading) setShowUploadLecture(false) }}>
                            <form onSubmit={handleLectureUpload} className="space-y-4">
                                {/* File drop zone */}
                                <div onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-border dark:border-dark-border rounded-2xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all">
                                    <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                                        onChange={e => setLecFile(e.target.files?.[0] || null)} />
                                    {lecFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Film size={24} className="text-violet-600" />
                                            <div className="text-left">
                                                <p className="font-medium text-text-primary dark:text-dark-text text-sm">{lecFile.name}</p>
                                                <p className="text-xs text-text-muted">{(lecFile.size / 1e9).toFixed(2)} GB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={32} className="mx-auto text-text-faint mb-2" />
                                            <p className="font-medium text-text-primary dark:text-dark-text text-sm">Drop video here or click to browse</p>
                                            <p className="text-xs text-text-muted mt-1">MP4, MOV, AVI — up to 5GB</p>
                                        </>
                                    )}
                                </div>
                                {uploading && (
                                    <div>
                                        <div className="flex justify-between text-xs text-text-muted mb-1">
                                            <span>Uploading...</span><span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                            <motion.div className="h-full bg-violet-500 rounded-full"
                                                animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.2 }} />
                                        </div>
                                    </div>
                                )}
                                <Field label="Lecture Title *">
                                    <input value={lecForm.title} onChange={e => setLecForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Module 3 — Server Components" required className="input-base" />
                                </Field>
                                <Field label="Description">
                                    <textarea value={lecForm.description} onChange={e => setLecForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="What does this lecture cover?" rows={2} className="input-base resize-none" />
                                </Field>
                                <FieldRow>
                                    <Field label="Course">
                                        <select value={lecForm.course} onChange={e => setLecForm(p => ({ ...p, course: e.target.value }))} className="input-base">
                                            {availableCourses.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Tags (comma-separated)">
                                        <input value={lecForm.tags} onChange={e => setLecForm(p => ({ ...p, tags: e.target.value }))}
                                            placeholder="React, Next.js, SSR" className="input-base" />
                                    </Field>
                                </FieldRow>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowUploadLecture(false)} disabled={uploading}
                                        className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm disabled:opacity-50">Cancel</button>
                                    <motion.button type="submit" disabled={uploading}
                                        className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                        whileTap={{ scale: 0.97 }}>
                                        <Upload size={14} />{uploading ? 'Uploading...' : 'Upload Lecture'}
                                    </motion.button>
                                </div>
                            </form>
                        </Modal>
                    )}
                </AnimatePresence>

                {/* ── Upload Notes Modal ────────────────────────────── */}
                <AnimatePresence>
                    {showUploadNote && (
                        <Modal title="Upload Notes / PDF" onClose={() => setShowUploadNote(false)}>
                            <form onSubmit={handleNoteUpload} className="space-y-4">
                                <div onClick={() => noteInputRef.current?.click()}
                                    className="border-2 border-dashed border-border dark:border-dark-border rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all">
                                    <input ref={noteInputRef} type="file" accept=".pdf,.doc,.docx,.pptx" className="hidden"
                                        onChange={e => setNoteFile(e.target.files?.[0] || null)} />
                                    {noteFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText size={24} className="text-emerald-600" />
                                            <div className="text-left">
                                                <p className="font-medium text-text-primary dark:text-dark-text text-sm">{noteFile.name}</p>
                                                <p className="text-xs text-text-muted">{(noteFile.size / 1e6).toFixed(1)} MB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <FileText size={32} className="mx-auto text-text-faint mb-2" />
                                            <p className="font-medium text-text-primary dark:text-dark-text text-sm">Drop PDF / PPTX / DOC here</p>
                                            <p className="text-xs text-text-muted mt-1">Up to 50MB</p>
                                        </>
                                    )}
                                </div>
                                <Field label="Title *">
                                    <input value={noteForm.title} onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Week 4 — React Hooks Reference" required className="input-base" />
                                </Field>
                                <Field label="Description">
                                    <textarea value={noteForm.description} onChange={e => setNoteForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Brief description..." rows={2} className="input-base resize-none" />
                                </Field>
                                <Field label="Course">
                                    <select value={noteForm.course} onChange={e => setNoteForm(p => ({ ...p, course: e.target.value }))} className="input-base">
                                        {availableCourses.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
                                    </select>
                                </Field>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowUploadNote(false)}
                                        className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm">Cancel</button>
                                    <motion.button type="submit"
                                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                        whileTap={{ scale: 0.97 }}>
                                        <Upload size={14} /> Upload Notes
                                    </motion.button>
                                </div>
                            </form>
                        </Modal>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    )
}

// ── Shared ClassCard ──────────────────────────────────────────
function ClassCard({ lc, index, isTeacher, onStartLive }: { lc: any; index: number; isTeacher?: boolean; onStartLive?: (classItem: any) => void }) {
    const countdown = useCountdown(lc.date)
    const fillPct = lc.maxAttendees ? Math.round((lc.attendees! / lc.maxAttendees) * 100) : 0

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
            className={cn('bg-surface dark:bg-dark-surface border rounded-2xl p-5 hover:shadow-card transition-all',
                lc.status === 'LIVE' ? 'border-accent/50 shadow-sm' : 'border-border dark:border-dark-border')}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {lc.status === 'LIVE' && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE NOW
                            </span>
                        )}
                        {lc.status === 'COMPLETED' && (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                <Check size={11} /> Completed
                            </span>
                        )}
                        <span className="text-xs text-primary bg-primary-tint dark:bg-dark-surface2 px-2 py-0.5 rounded-full font-medium">{lc.course.category}</span>
                    </div>
                    <h3 className="font-sora font-semibold text-base text-text-primary dark:text-dark-text mb-1">{lc.title}</h3>
                    {lc.description && <p className="text-text-muted text-sm mb-2">{lc.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                        {!isTeacher && <span className="flex items-center gap-1"><Video size={11} />{lc.instructor.name}</span>}
                        {lc.status !== 'LIVE' && <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(lc.date)} at {formatTime(lc.date)}</span>}
                        <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(lc.duration)}</span>
                        {lc.attendees && <span className="flex items-center gap-1"><Users size={11} />{lc.attendees.toLocaleString()}{lc.maxAttendees ? ` / ${lc.maxAttendees}` : ''}</span>}
                    </div>

                    {/* Countdown for upcoming */}
                    {lc.status === 'UPCOMING' && !countdown.isPast && (
                        <div className="mt-3 flex items-center gap-2">
                            <Bell size={11} className="text-text-faint" />
                            <span className="text-xs text-text-muted">Starts in </span>
                            {countdown.days > 0 && <CountdownUnit val={countdown.days} label="d" />}
                            <CountdownUnit val={countdown.hrs} label="h" />
                            <CountdownUnit val={countdown.mins} label="m" />
                            <CountdownUnit val={countdown.secs} label="s" />
                        </div>
                    )}

                    {/* Seat fill progress */}
                    {lc.maxAttendees && lc.status === 'UPCOMING' && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-text-muted mb-1">
                                <span>Seats</span><span>{fillPct}% filled</span>
                            </div>
                            <div className="h-1.5 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full transition-all', fillPct > 80 ? 'bg-red-400' : 'bg-primary')}
                                    style={{ width: `${fillPct}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {lc.status === 'LIVE' && (
                        <Link href={`/student/live-classes/${lc.meetingId || lc.id}`}>
                            <button className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                {isTeacher ? 'Start Class' : 'Join Now'}
                            </button>
                        </Link>
                    )}
                    {lc.status === 'UPCOMING' && (
                        <>
                            {isTeacher && (
                                <button
                                    onClick={() => onStartLive?.(lc)}
                                    className="px-3.5 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-xs"
                                >
                                    <Radio size={13} className="animate-pulse" /> Start Class Now
                                </button>
                            )}
                            <button onClick={() => { navigator.clipboard.writeText(lc.meetingUrl || window.location.origin + `/student/live-classes/${lc.meetingId || lc.id}`); toast.success('Invite link copied!') }}
                                className="flex items-center gap-1.5 px-3 py-2 border border-border dark:border-dark-border text-text-muted text-xs rounded-xl hover:border-primary/30 transition-colors">
                                <Copy size={12} /> Copy Link
                            </button>
                            <Link href={`/student/live-classes/${lc.meetingId || lc.id}`}>
                                <button className="px-3 py-2 border border-primary/30 text-primary text-xs rounded-xl hover:bg-primary-tint transition-colors flex items-center gap-1.5">
                                    <Monitor size={12} /> Join Room
                                </button>
                            </Link>
                        </>
                    )}
                    {lc.status === 'COMPLETED' && (
                        <button onClick={() => toast.info('Recording available in 24 hours')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-border dark:border-dark-border text-text-muted text-xs rounded-xl hover:border-primary/30 transition-colors">
                            <Play size={12} /> View Recording
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function CountdownUnit({ val, label }: { val: number; label: string }) {
    return (
        <span className="inline-flex items-baseline gap-0.5 font-mono">
            <span className="font-bold text-sm text-text-primary dark:text-dark-text">{String(val).padStart(2, '0')}</span>
            <span className="text-xs text-text-muted">{label}</span>
        </span>
    )
}

// ── Shared UI helpers ─────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.div className="relative bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-modal max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text">{title}</h2>
                    <button onClick={onClose} className="text-text-faint hover:text-text-muted transition-colors"><X size={18} /></button>
                </div>
                {children}
            </motion.div>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</label>
            {children}
        </div>
    )
}

function FieldRow({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function EmptyState({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
    return (
        <div className="text-center py-20 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl">
            <div className="text-text-faint mx-auto mb-4 flex justify-center">{icon}</div>
            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-1">{label}</h3>
            {action}
        </div>
    )
}
