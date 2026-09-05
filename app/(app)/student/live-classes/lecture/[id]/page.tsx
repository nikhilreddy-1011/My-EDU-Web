'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
    Download, ChevronLeft, ThumbsUp, Bookmark, Share2,
    Clock, Eye, Tag, FileText, ChevronRight, Settings,
    SkipBack, SkipForward, Subtitles, List
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { mockLectures, mockNotes } from '@/data/mock-data'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function LecturePlayerPage() {
    const { id } = useParams<{ id: string }>()
    const lecture = mockLectures.find(l => l.id === id) || mockLectures[0]
    const related = mockLectures.filter(l => l.id !== lecture.id).slice(0, 4)
    const relatedNotes = mockNotes.filter(n => n.courseId === lecture.courseId)

    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(1)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [liked, setLiked] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [showSpeedMenu, setShowSpeedMenu] = useState(false)
    const [showNotes, setShowNotes] = useState(false)
    const controlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)


    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) { videoRef.current.pause(); setIsPlaying(false) }
        else { videoRef.current.play(); setIsPlaying(true) }
    }

    const handleTimeUpdate = () => {
        if (!videoRef.current) return
        setCurrentTime(videoRef.current.currentTime)
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0)
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration)
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return
        const rect = e.currentTarget.getBoundingClientRect()
        const pct = (e.clientX - rect.left) / rect.width
        videoRef.current.currentTime = pct * videoRef.current.duration
    }

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value)
        setVolume(v)
        if (videoRef.current) videoRef.current.volume = v
        setIsMuted(v === 0)
    }

    const toggleMute = () => {
        if (!videoRef.current) return
        const next = !isMuted
        setIsMuted(next)
        videoRef.current.muted = next
    }

    const skip = (secs: number) => {
        if (!videoRef.current) return
        videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + secs, duration))
    }

    const setRate = (rate: number) => {
        setPlaybackRate(rate)
        if (videoRef.current) videoRef.current.playbackRate = rate
        setShowSpeedMenu(false)
        toast(`Playback speed: ${rate}x`)
    }

    const resetControlsTimer = () => {
        setShowControls(true)
        clearTimeout(controlsTimer.current)
        controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }

    useEffect(() => { return () => clearTimeout(controlsTimer.current) }, [])

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        return `${m}:${String(sec).padStart(2, '0')}`
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto">
                {/* Back button */}
                <Link href="/student/live-classes" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4">
                    <ChevronLeft size={16} /> Back to Live Classes
                </Link>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* ── Main Player Column ────────────────────── */}
                    <div className="xl:col-span-2 space-y-4">
                        {/* Video Player */}
                        <div className="relative bg-black rounded-2xl overflow-hidden group"
                            onMouseMove={resetControlsTimer} onMouseEnter={resetControlsTimer}>
                            <video ref={videoRef} src={lecture.videoUrl} className="w-full aspect-video"
                                onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)} onClick={togglePlay} />

                            {/* Overlay controls */}
                            <div className={cn('absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 bg-gradient-to-t from-black/80 via-transparent to-black/20',
                                showControls ? 'opacity-100' : 'opacity-0')}>
                                {/* Top bar */}
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm text-white truncate max-w-xs">{lecture.title}</span>
                                    <div className="flex gap-2">
                                        {/* Playback speed */}
                                        <div className="relative">
                                            <button onClick={() => setShowSpeedMenu(s => !s)}
                                                className="flex items-center gap-1 text-xs text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">
                                                <Settings size={12} />{playbackRate}x
                                            </button>
                                            {showSpeedMenu && (
                                                <div className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-20 min-w-[80px]">
                                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                                                        <button key={r} onClick={() => setRate(r)}
                                                            className={cn('w-full text-xs px-3 py-1.5 text-left transition-colors',
                                                                playbackRate === r ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800')}>
                                                            {r}x
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => { setIsFullscreen(f => !f); toast('Fullscreen: use F key in browser') }}
                                            className="text-white bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors">
                                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Center play button */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <AnimatedPlayBtn isPlaying={isPlaying} onClick={togglePlay} />
                                </div>

                                {/* Bottom controls */}
                                <div className="space-y-2">
                                    {/* Seek bar */}
                                    <div className="cursor-pointer h-1.5 bg-white/30 rounded-full group/seek" onClick={handleSeek}>
                                        <div className="h-full bg-primary rounded-full relative group-hover/seek:h-2.5 transition-all"
                                            style={{ width: `${progress}%` }}>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow -translate-x-1/2 opacity-0 group-hover/seek:opacity-100 transition-opacity" />
                                        </div>
                                    </div>

                                    {/* Control row */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => skip(-10)} className="text-white hover:text-gray-200 transition-colors p-1"><SkipBack size={18} /></button>
                                            <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors">
                                                {isPlaying ? <Pause size={16} className="text-gray-900" /> : <Play size={16} className="text-gray-900 ml-0.5" />}
                                            </button>
                                            <button onClick={() => skip(10)} className="text-white hover:text-gray-200 transition-colors p-1"><SkipForward size={18} /></button>

                                            {/* Volume */}
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={toggleMute} className="text-white hover:text-gray-200 p-1">
                                                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                                </button>
                                                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                                                    onChange={handleVolume} className="w-20 accent-primary cursor-pointer h-1" />
                                            </div>

                                            {/* Time */}
                                            <span className="text-xs text-gray-300 font-mono tabular-nums">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => toast.info('Subtitles not available for demo')}
                                                className="text-white/70 hover:text-white p-1 transition-colors"><Subtitles size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Paused overlay hint */}
                            {!isPlaying && duration === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 mx-auto border border-white/20">
                                            <Play size={32} className="text-white ml-2" />
                                        </div>
                                        <p className="text-white text-sm font-medium">Click to play</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lecture Info */}
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                            <h1 className="font-sora font-bold text-xl text-text-primary dark:text-dark-text mb-2">{lecture.title}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
                                <span className="flex items-center gap-1.5"><Eye size={14} />{lecture.views.toLocaleString()} views</span>
                                <span className="flex items-center gap-1.5"><Clock size={14} />{lecture.duration}</span>
                                <span className="flex items-center gap-1.5"><FileText size={14} />{lecture.fileSize}</span>
                                <span>{formatDate(lecture.uploadedAt)}</span>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {lecture.tags.map(t => (
                                    <span key={t} className="flex items-center gap-1 text-xs bg-primary-tint dark:bg-dark-surface2 text-primary px-2.5 py-1 rounded-full">
                                        <Tag size={10} />{t}
                                    </span>
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 flex-wrap pt-2 border-t border-border dark:border-dark-border">
                                <button onClick={() => { setLiked(l => !l); toast(liked ? 'Removed like' : '👍 Liked!') }}
                                    className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                                        liked ? 'bg-primary-tint text-primary dark:bg-dark-surface2' : 'border border-border dark:border-dark-border text-text-muted hover:border-primary/30')}>
                                    <ThumbsUp size={15} className={liked ? 'fill-current' : ''} />
                                    {liked ? 'Liked' : 'Like'}
                                </button>
                                <button onClick={() => { setBookmarked(b => !b); toast(bookmarked ? 'Removed bookmark' : '🔖 Bookmarked!') }}
                                    className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                                        bookmarked ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'border border-border dark:border-dark-border text-text-muted hover:border-primary/30')}>
                                    <Bookmark size={15} className={bookmarked ? 'fill-current' : ''} />
                                    {bookmarked ? 'Saved' : 'Save'}
                                </button>
                                {lecture.isDownloadable && (
                                    <button onClick={() => toast.success(`Downloading "${lecture.title}"...`)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border dark:border-dark-border text-text-muted hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                                        <Download size={15} /> Download ({lecture.fileSize})
                                    </button>
                                )}
                                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border dark:border-dark-border text-text-muted hover:border-primary/30 transition-colors">
                                    <Share2 size={15} /> Share
                                </button>
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                                {lecture.instructor.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-text-primary dark:text-dark-text">{lecture.instructor.name}</p>
                                <p className="text-sm text-text-muted">{lecture.instructor.title}</p>
                                <p className="text-xs text-text-faint mt-0.5 line-clamp-2">{lecture.instructor.bio}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5">
                            <h3 className="font-semibold text-text-primary dark:text-dark-text mb-2">About this lecture</h3>
                            <p className="text-text-muted text-sm leading-relaxed">{lecture.description}</p>
                        </div>
                    </div>

                    {/* ── Sidebar ─────────────────────────────────── */}
                    <div className="space-y-4">
                        {/* Tabs: related lectures vs notes */}
                        <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl">
                            <button onClick={() => setShowNotes(false)}
                                className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                                    !showNotes ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                                More Lectures
                            </button>
                            <button onClick={() => setShowNotes(true)}
                                className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                                    showNotes ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text')}>
                                Notes ({relatedNotes.length})
                            </button>
                        </div>

                        {!showNotes ? (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Related Lectures</p>
                                {related.map((lec, i) => (
                                    <Link key={lec.id} href={`/student/live-classes/lecture/${lec.id}`}>
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                            className="flex gap-3 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl p-3 hover:shadow-card transition-all cursor-pointer group">
                                            <div className="relative w-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={lec.thumbnail} alt={lec.title} className="w-full h-12 object-cover group-hover:scale-105 transition-transform duration-300" />
                                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded font-mono" style={{ fontSize: '9px' }}>{lec.duration}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-text-primary dark:text-dark-text line-clamp-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{lec.title}</p>
                                                <p className="text-xs text-text-muted mt-0.5">{lec.instructor.name}</p>
                                                <div className="flex gap-2 mt-0.5 text-xs text-text-faint">
                                                    <span className="flex items-center gap-0.5"><Eye size={10} />{lec.views.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Downloadable Notes</p>
                                {relatedNotes.length === 0 ? (
                                    <div className="text-center py-8 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl">
                                        <FileText size={32} className="mx-auto text-text-faint opacity-30 mb-2" />
                                        <p className="text-sm text-text-muted">No notes for this course</p>
                                    </div>
                                ) : relatedNotes.map((note, i) => (
                                    <motion.div key={note.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                        className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl p-3 flex items-center gap-3 hover:shadow-card transition-all">
                                        <div className={cn('w-10 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 flex-shrink-0',
                                            note.fileType === 'PDF' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20')}>
                                            <FileText size={14} className={note.fileType === 'PDF' ? 'text-red-500' : 'text-orange-500'} />
                                            <span className="text-xs font-bold" style={{ fontSize: '8px', color: note.fileType === 'PDF' ? '#ef4444' : '#f97316' }}>{note.fileType}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text-primary dark:text-dark-text line-clamp-2">{note.title}</p>
                                            <p className="text-xs text-text-faint mt-0.5">{note.pages}p · {note.fileSize}</p>
                                        </div>
                                        <button onClick={() => toast.success(`Downloading "${note.title}"...`)}
                                            className="p-2 rounded-lg bg-primary-tint dark:bg-dark-surface2 text-primary hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                                            <Download size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

function AnimatedPlayBtn({ isPlaying, onClick }: { isPlaying: boolean; onClick: () => void }) {
    return (
        <motion.button onClick={onClick} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors pointer-events-auto"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
        </motion.button>
    )
}
