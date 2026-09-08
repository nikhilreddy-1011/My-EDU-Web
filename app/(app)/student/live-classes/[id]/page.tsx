'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video, Mic, MicOff, VideoOff, ScreenShare, MessageSquare, Users,
    X, Hand, PhoneOff, Maximize2, Settings, ChevronRight, StopCircle,
    Monitor, PenLine, BarChart2, Smile, Volume2, VolumeX, Grid3x3,
    Rows, Copy, Bell, MoreVertical, MicOff as MuteIcon, UserX, Star,
    Radio, Download, FileText, Shield, CheckCircle2, AlertTriangle,
    Sliders, RefreshCw
} from 'lucide-react'
import { liveClasses } from '@/data/mock-data'
import { getLiveClassById } from '@/lib/api/live-classes'
import { useAuthStore } from '@/store/use-auth-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useMediaStream } from '@/hooks/use-media-stream'
import { DeviceSettingsModal } from '@/components/live-class/device-settings-modal'

// ── Mock Participants ─────────────────────────────────────────
const MOCK_PARTICIPANTS = [
    { id: '1', name: 'Rohit Verma',   initials: 'RV', isMuted: true,  isVideoOff: false, isHandRaised: false, color: '#6366f1' },
    { id: '2', name: 'Ananya Singh',  initials: 'AS', isMuted: false, isVideoOff: false, isHandRaised: true,  color: '#ec4899' },
    { id: '3', name: 'Karan Patel',   initials: 'KP', isMuted: true,  isVideoOff: true,  isHandRaised: false, color: '#10b981' },
    { id: '4', name: 'Meera Krishnan',initials: 'MK', isMuted: false, isVideoOff: false, isHandRaised: false, color: '#f59e0b' },
    { id: '5', name: 'Dev Shah',      initials: 'DS', isMuted: true,  isVideoOff: false, isHandRaised: false, color: '#8b5cf6' },
]

const INIT_MESSAGES = [
    { id: 1, user: 'Ananya Singh',  msg: 'Can you explain the useCallback hook again?', time: '2:15 PM', isHost: false },
    { id: 2, user: 'Karan Patel',   msg: 'Great explanation! Much clearer now 🙌',       time: '2:17 PM', isHost: false },
    { id: 3, user: 'Meera Krishnan',msg: 'Can we see the demo one more time?',           time: '2:18 PM', isHost: false },
    { id: 4, user: 'Dr. Arjun Mehta', msg: 'Sure! Sharing my screen now.',               time: '2:19 PM', isHost: true },
]

const EMOJIS = ['👍','👏','❤️','😂','🔥','🤔','🙌','✅']

const POLL_OPTIONS = [
    { id: 'a', text: 'Server Components', votes: 12 },
    { id: 'b', text: 'Client Components',  votes: 8  },
    { id: 'c', text: 'Both equally',       votes: 5  },
]

// ── Main Component ────────────────────────────────────────────
export default function LiveMeetingPage() {
    const { id } = useParams<{ id: string }>()
    const user = useAuthStore(state => state.user)
    const isTeacher = user?.role === 'TEACHER'
    const [liveClass, setLiveClass] = useState<any>(() => {
        return liveClasses.find(lc => lc.id === id || (lc as any).meetingId === id) || liveClasses[1]
    })

    useEffect(() => {
        if (!id) return
        getLiveClassById(id)
            .then(res => {
                if (res.success && res.liveClass) {
                    const lc = res.liveClass
                    setLiveClass({
                        id: lc.meetingId || lc._id,
                        meetingId: lc.meetingId || lc._id,
                        _id: lc._id,
                        title: lc.title,
                        description: lc.description,
                        course: {
                            id: lc.course?._id || 'c1',
                            title: lc.courseTitle || lc.course?.title || 'Live Session',
                            category: lc.course?.category || 'Workshop',
                        },
                        instructor: {
                            name: lc.instructorName || (typeof lc.instructor === 'object' ? lc.instructor?.name : 'Lead Instructor'),
                            avatar: lc.instructorAvatar || (typeof lc.instructor === 'object' ? lc.instructor?.avatar : ''),
                            title: 'Instructor',
                        },
                        date: lc.scheduledAt,
                        duration: lc.duration || 60,
                        status: lc.status,
                        attendees: lc.attendeesCount || 0,
                        maxAttendees: lc.maxSeats || 500,
                        meetingUrl: lc.meetingUrl || '',
                        tags: lc.tags || [],
                    })
                }
            })
            .catch(() => {})
    }, [id])

    // Real Media Engine
    const {
        localStream,
        screenStream,
        isCameraOn,
        isMicOn,
        isScreenSharing,
        audioLevel,
        isSpeaking,
        devices,
        selectedCameraId,
        selectedMicId,
        toggleCamera,
        toggleMic,
        startScreenShare,
        stopScreenShare,
        switchCamera,
        switchMic,
        refreshDevices,
    } = useMediaStream()

    // Interactive Room States
    const [isRecording,        setIsRecording]        = useState(false)
    const [isHandRaised,       setIsHandRaised]       = useState(false)
    const [layout,             setLayout]             = useState<'grid' | 'spotlight'>('grid')
    const [showDeviceSettings, setShowDeviceSettings] = useState(false)

    // Panels
    const [sidePanel,      setSidePanel]      = useState<'chat' | 'people' | 'whiteboard' | 'poll' | null>(null)
    const [showReactions,  setShowReactions]  = useState(false)

    // Chat
    const [chatInput,      setChatInput]      = useState('')
    const [messages,       setMessages]       = useState(INIT_MESSAGES)
    const [unreadCount,    setUnreadCount]    = useState(0)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Poll
    const [pollActive,     setPollActive]     = useState(false)
    const [pollVote,       setPollVote]       = useState<string | null>(null)
    const [pollOptions,    setPollOptions]    = useState(POLL_OPTIONS)

    // Whiteboard
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing,      setIsDrawing]      = useState(false)
    const [penColor,       setPenColor]       = useState('#ffffff')
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    // Timer
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        const t = setInterval(() => setElapsed(e => e + 1), 1000)
        return () => clearInterval(t)
    }, [])

    // Auto-scroll chat
    useEffect(() => {
        if (sidePanel === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, sidePanel])

    // Unread badge
    useEffect(() => {
        if (sidePanel !== 'chat') setUnreadCount(c => c + 1)
    }, [messages.length, sidePanel])

    const sendMsg = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        setMessages(m => [...m, {
            id: Date.now(), user: user?.name || 'You', msg: chatInput,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            isHost: isTeacher,
        }])
        setChatInput('')
    }

    const openPanel = (p: 'chat' | 'people' | 'whiteboard' | 'poll') => {
        setSidePanel(prev => prev === p ? null : p)
        if (p === 'chat') setUnreadCount(0)
        setShowReactions(false)
    }

    const sendReaction = (emoji: string) => {
        setShowReactions(false)
        toast(emoji + ' ' + emoji + ' ' + emoji, { duration: 1500 })
    }

    const handleVote = (optId: string) => {
        if (pollVote) return
        setPollVote(optId)
        setPollOptions(prev => prev.map(o => o.id === optId ? { ...o, votes: o.votes + 1 } : o))
        toast.success('Vote recorded! 🗳️')
    }

    const toggleRecording = () => {
        setIsRecording(r => {
            toast.success(r ? '⏹ Recording saved to your dashboard' : '🔴 Recording started')
            return !r
        })
    }

    // Whiteboard drawing
    const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true)
        const rect = canvasRef.current!.getBoundingClientRect()
        lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')!
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        ctx.beginPath()
        ctx.strokeStyle = penColor
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
        ctx.lineTo(x, y)
        ctx.stroke()
        lastPos.current = { x, y }
    }, [isDrawing, penColor])

    const stopDraw = useCallback(() => { setIsDrawing(false); lastPos.current = null }, [])
    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && canvasRef.current) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height) }
    }

    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const totalVotes = pollOptions.reduce((s, o) => s + o.votes, 0)

    return (
        <div className="h-screen bg-slate-950 flex flex-col text-slate-100 overflow-hidden select-none font-sans">

            {/* ── Top Bar ─────────────────────────────────────── */}
            <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live</span>
                    </div>
                    <div className="w-px h-4 bg-slate-800" />
                    <div>
                        <p className="font-semibold text-sm truncate max-w-[200px] sm:max-w-sm text-slate-100">{liveClass.title}</p>
                        <p className="text-xs text-slate-400">{liveClass.instructor.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {isRecording && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/30">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> REC
                        </div>
                    )}
                    {isScreenSharing && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30 font-medium">
                            <Monitor size={12} /> Sharing Screen
                        </div>
                    )}
                    <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg tabular-nums border border-slate-700/50">
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1 bg-slate-800/40 px-2 py-1 rounded-lg">
                        <Users size={12} />{MOCK_PARTICIPANTS.length + 2}
                    </span>

                    {/* Layout toggle */}
                    <button
                        onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Toggle layout"
                    >
                        {layout === 'grid' ? <Rows size={16} /> : <Grid3x3 size={16} />}
                    </button>

                    {/* Audio & Video Device Settings */}
                    <button
                        onClick={() => setShowDeviceSettings(true)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Camera & Microphone Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* ── Screen Share Active Top Banner ──────────────── */}
            <AnimatePresence>
                {isScreenSharing && (
                    <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        className="bg-blue-600/90 backdrop-blur-md px-4 py-2 flex items-center justify-between text-sm flex-shrink-0 border-b border-blue-500/30"
                    >
                        <div className="flex items-center gap-2">
                            <Monitor size={16} className="text-blue-100" />
                            <span className="font-medium text-white">You are actively sharing your screen with the class</span>
                            <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">1080p HD</span>
                        </div>
                        <button
                            onClick={stopScreenShare}
                            className="flex items-center gap-1.5 bg-white text-slate-900 hover:bg-white/90 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs"
                        >
                            <StopCircle size={13} /> Stop Sharing
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Media & Video Stage ───────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Main Video Viewport */}
                {isScreenSharing ? (
                    /* When screen sharing is active: Big screen presentation with side participants */
                    <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
                        <ScreenShareStage screenStream={screenStream} onStop={stopScreenShare} />
                        <div className="w-full md:w-64 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto flex-shrink-0">
                            <YourTile
                                user={user}
                                localStream={localStream}
                                isCameraOn={isCameraOn}
                                isMicOn={isMicOn}
                                audioLevel={audioLevel}
                                isSpeaking={isSpeaking}
                                isHandRaised={isHandRaised}
                                compact
                            />
                            <HostTile liveClass={liveClass} isTeacher={isTeacher} compact />
                            {MOCK_PARTICIPANTS.map((p, i) => (
                                <ParticipantTile key={p.id} p={p} index={i} compact />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Normal Grid or Spotlight Layout */
                    <div className={cn(
                        'flex-1 p-3 overflow-auto',
                        layout === 'spotlight' ? 'flex flex-col gap-3' : 'grid gap-3',
                        layout === 'grid' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    )} style={{ gridAutoRows: '1fr' }}>

                        {layout === 'spotlight' ? (
                            <>
                                <HostTile liveClass={liveClass} isTeacher={isTeacher} className="flex-1 min-h-[60%]" />
                                <div className="h-32 flex gap-2 overflow-x-auto pb-1">
                                    <YourTile
                                        user={user}
                                        localStream={localStream}
                                        isCameraOn={isCameraOn}
                                        isMicOn={isMicOn}
                                        audioLevel={audioLevel}
                                        isSpeaking={isSpeaking}
                                        isHandRaised={isHandRaised}
                                        compact
                                    />
                                    {MOCK_PARTICIPANTS.map((p, i) => (
                                        <ParticipantTile key={p.id} p={p} index={i} compact />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <HostTile liveClass={liveClass} isTeacher={isTeacher} />
                                <YourTile
                                    user={user}
                                    localStream={localStream}
                                    isCameraOn={isCameraOn}
                                    isMicOn={isMicOn}
                                    audioLevel={audioLevel}
                                    isSpeaking={isSpeaking}
                                    isHandRaised={isHandRaised}
                                />
                                {MOCK_PARTICIPANTS.map((p, i) => (
                                    <ParticipantTile key={p.id} p={p} index={i} isTeacher={isTeacher} />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* ── Collapsible Side Panel ─────────────────── */}
                <AnimatePresence>
                    {sidePanel && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0"
                        >
                            {/* Panel Tabs */}
                            <div className="flex items-center border-b border-slate-800 flex-shrink-0">
                                {(['chat', 'people', 'whiteboard', ...(isTeacher ? ['poll'] : [])] as Array<'chat' | 'people' | 'whiteboard' | 'poll'>).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => openPanel(p)}
                                        className={cn(
                                            'flex-1 py-3 text-xs font-medium capitalize transition-colors border-b-2',
                                            sidePanel === p ? 'text-white border-primary' : 'text-slate-400 border-transparent hover:text-white'
                                        )}
                                    >
                                        {p === 'chat' && unreadCount > 0 && sidePanel !== 'chat' ? (
                                            <span className="flex items-center justify-center gap-1">
                                                Chat <span className="w-4 h-4 bg-accent rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
                                            </span>
                                        ) : p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                                <button onClick={() => setSidePanel(null)} className="px-3 text-slate-500 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Chat Panel */}
                            {sidePanel === 'chat' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {messages.map(m => (
                                            <div key={m.id} className={cn('flex flex-col gap-0.5', m.user === (user?.name || 'You') && 'items-end')}>
                                                <div className="flex items-center gap-1.5">
                                                    {m.isHost && <Shield size={10} className="text-yellow-400" />}
                                                    <span className="text-xs text-slate-400">{m.user}</span>
                                                    <span className="text-xs text-slate-600">{m.time}</span>
                                                </div>
                                                <div className={cn(
                                                    'text-sm rounded-2xl px-3 py-2 max-w-[85%]',
                                                    m.user === (user?.name || 'You') ? 'bg-primary text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                                                )}>
                                                    {m.msg}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendMsg} className="p-3 border-t border-slate-800 flex gap-2 flex-shrink-0">
                                        <input
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            placeholder="Message everyone..."
                                            autoComplete="off"
                                            className="flex-1 bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl px-3 py-2 outline-none border border-slate-700 focus:border-primary transition-colors"
                                        />
                                        <button type="submit" className="px-3.5 py-2 bg-primary hover:bg-primary-dark rounded-xl text-xs font-semibold text-white transition-colors">
                                            Send
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* People Panel */}
                            {sidePanel === 'people' && (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">Host</div>
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/60 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                                            {liveClass.instructor.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{liveClass.instructor.name}</p>
                                            <p className="text-xs text-yellow-400">Host</p>
                                        </div>
                                        <Mic size={14} className="text-slate-400" />
                                    </div>

                                    <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold border-t border-slate-800 mt-1">
                                        Participants ({MOCK_PARTICIPANTS.length + 1})
                                    </div>
                                    {MOCK_PARTICIPANTS.map(p => (
                                        <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/60 transition-colors group">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: p.color }}>
                                                {p.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">{p.name}</p>
                                                {p.isHandRaised && <p className="text-xs text-yellow-400">✋ Hand raised</p>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {p.isMuted ? <MicOff size={13} className="text-red-400" /> : <Mic size={13} className="text-slate-400" />}
                                            </div>
                                        </div>
                                    ))}

                                    {/* You */}
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/40 border-t border-slate-800">
                                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                                            {(user?.name || 'Y').charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{user?.name || 'You'} (You)</p>
                                            <p className="text-[11px] text-slate-400">{isCameraOn ? '📹 Camera on' : 'Camera off'}</p>
                                        </div>
                                        {isMicOn ? (
                                            <Mic size={13} className="text-emerald-400" />
                                        ) : (
                                            <MicOff size={13} className="text-red-400" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Whiteboard Panel */}
                            {sidePanel === 'whiteboard' && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 flex-shrink-0">
                                        <span className="text-xs text-slate-400">Pen:</span>
                                        {['#ffffff', '#60a5fa', '#34d399', '#f87171', '#fbbf24'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setPenColor(c)}
                                                className={cn(
                                                    'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                                                    penColor === c ? 'border-white scale-110' : 'border-transparent'
                                                )}
                                                style={{ background: c }}
                                            />
                                        ))}
                                        <button onClick={clearCanvas} className="ml-auto text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-800">
                                            Clear
                                        </button>
                                    </div>
                                    <canvas
                                        ref={canvasRef}
                                        width={288}
                                        height={400}
                                        className="flex-1 cursor-crosshair bg-slate-950"
                                        onMouseDown={startDraw}
                                        onMouseMove={draw}
                                        onMouseUp={stopDraw}
                                        onMouseLeave={stopDraw}
                                    />
                                </div>
                            )}

                            {/* Poll Panel */}
                            {sidePanel === 'poll' && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">Live Poll</h4>
                                        {isTeacher && (
                                            <button
                                                onClick={() => { setPollActive(a => !a); toast(pollActive ? 'Poll closed' : '🗳️ Poll launched') }}
                                                className={cn(
                                                    'text-xs px-3 py-1.5 rounded-xl font-medium transition-colors',
                                                    pollActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary/20 text-blue-400 hover:bg-primary/30'
                                                )}
                                            >
                                                {pollActive ? 'Close Poll' : 'Launch Poll'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-slate-800 rounded-2xl p-4">
                                        <p className="text-sm font-medium mb-4">Which architecture do you prefer for real-time video?</p>
                                        <div className="space-y-2.5">
                                            {pollOptions.map(opt => {
                                                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                                                const voted = pollVote === opt.id
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => pollActive && !isTeacher ? handleVote(opt.id) : undefined}
                                                        disabled={!!pollVote || isTeacher || !pollActive}
                                                        className={cn(
                                                            'w-full text-left px-3 py-2.5 rounded-xl border transition-all relative overflow-hidden',
                                                            voted ? 'border-primary bg-primary/10' : 'border-slate-700 hover:border-slate-600',
                                                            (!pollActive && !isTeacher) && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    >
                                                        <div className="absolute inset-0 bg-primary/20 transition-all rounded-xl" style={{ width: (pollVote || isTeacher) ? `${pct}%` : '0%' }} />
                                                        <div className="relative flex items-center justify-between">
                                                            <span className="text-sm">{opt.text}</span>
                                                            {(pollVote || isTeacher) && <span className="text-xs text-slate-400">{pct}% ({opt.votes})</span>}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {(pollVote || isTeacher) && (
                                            <p className="text-xs text-slate-500 mt-3 text-center">{totalVotes} total votes</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Emoji Reactions Popup ───────────────────────── */}
            <AnimatePresence>
                {showReactions && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex gap-2 shadow-2xl z-50"
                    >
                        {EMOJIS.map(e => (
                            <button
                                key={e}
                                onClick={() => sendReaction(e)}
                                className="text-2xl hover:scale-125 transition-transform w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-800"
                            >
                                {e}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Control Bar ─────────────────────────────────── */}
            <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0 backdrop-blur-md">
                {/* Left controls: Mic, Camera, and Quick Device Settings */}
                <div className="flex items-center gap-2">
                    <CtrlBtn
                        active={isMicOn}
                        danger={!isMicOn}
                        onClick={toggleMic}
                        icon={!isMicOn ? <MicOff size={18} /> : <Mic size={18} />}
                        label={!isMicOn ? 'Unmute' : 'Mute'}
                    />
                    <CtrlBtn
                        active={isCameraOn}
                        onClick={toggleCamera}
                        icon={!isCameraOn ? <VideoOff size={18} /> : <Video size={18} />}
                        label={!isCameraOn ? 'Start Video' : 'Stop Video'}
                    />
                    <button
                        onClick={() => setShowDeviceSettings(true)}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Device Settings"
                    >
                        <Sliders size={14} />
                    </button>
                </div>

                {/* Center controls: Screen Share, Hand, React, Chat, People, etc. */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <CtrlBtn
                        active={isScreenSharing}
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        icon={<ScreenShare size={18} />}
                        label={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                        badge={isScreenSharing ? '●' : undefined}
                        badgeColor="bg-blue-500"
                    />
                    <CtrlBtn
                        active={isHandRaised}
                        onClick={() => { setIsHandRaised(h => !h); toast(isHandRaised ? 'Hand lowered' : '✋ Hand raised!') }}
                        icon={<Hand size={18} />}
                        label="Raise Hand"
                    />
                    <CtrlBtn
                        active={showReactions}
                        onClick={() => setShowReactions(r => !r)}
                        icon={<Smile size={18} />}
                        label="React"
                    />
                    <CtrlBtn
                        active={sidePanel === 'chat'}
                        onClick={() => openPanel('chat')}
                        icon={<MessageSquare size={18} />}
                        label="Chat"
                        badge={unreadCount > 0 && sidePanel !== 'chat' ? String(unreadCount) : undefined}
                    />
                    <CtrlBtn
                        active={sidePanel === 'people'}
                        onClick={() => openPanel('people')}
                        icon={<Users size={18} />}
                        label="People"
                    />
                    <CtrlBtn
                        active={sidePanel === 'whiteboard'}
                        onClick={() => openPanel('whiteboard')}
                        icon={<PenLine size={18} />}
                        label="Whiteboard"
                    />
                    <CtrlBtn
                        active={sidePanel === 'poll'}
                        onClick={() => openPanel('poll')}
                        icon={<BarChart2 size={18} />}
                        label="Poll"
                    />
                    {isTeacher && (
                        <CtrlBtn
                            active={isRecording}
                            danger={isRecording}
                            onClick={toggleRecording}
                            icon={<Radio size={18} />}
                            label={isRecording ? 'Stop Rec' : 'Record'}
                        />
                    )}
                </div>

                {/* Right: Leave Meeting */}
                <Link href={isTeacher ? '/teacher/live-classes' : '/student/live-classes'}>
                    <div className="flex flex-col items-center gap-0.5">
                        <button
                            onClick={() => toast('Left the meeting')}
                            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
                        >
                            <PhoneOff size={20} />
                        </button>
                        <span className="text-xs text-slate-400 hidden sm:block">Leave</span>
                    </div>
                </Link>
            </div>

            {/* ── Audio & Video Device Settings Modal ─────────── */}
            <DeviceSettingsModal
                isOpen={showDeviceSettings}
                onClose={() => setShowDeviceSettings(false)}
                devices={devices}
                selectedCameraId={selectedCameraId}
                selectedMicId={selectedMicId}
                onSelectCamera={switchCamera}
                onSelectMic={switchMic}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                localStream={localStream}
                audioLevel={audioLevel}
                onToggleCamera={toggleCamera}
                onToggleMic={toggleMic}
                onRefreshDevices={refreshDevices}
            />
        </div>
    )
}

// ── Screen Share Presentation Stage Component ─────────────────

function ScreenShareStage({
    screenStream,
    onStop,
}: {
    screenStream: MediaStream | null
    onStop: () => void
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        if (videoRef.current && screenStream) {
            videoRef.current.srcObject = screenStream
        }
    }, [screenStream])

    const toggleFullscreen = () => {
        if (!containerRef.current) return
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {})
            setIsFullscreen(true)
        } else {
            document.exitFullscreen().catch(() => {})
            setIsFullscreen(false)
        }
    }

    return (
        <div
            ref={containerRef}
            className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 group shadow-2xl min-h-[350px]"
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
            />

            {/* Top presentation overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 rounded-xl pointer-events-auto">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-white">Your Screen (Live HD 1080p)</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                        <Maximize2 size={14} />
                    </button>
                    <button
                        onClick={onStop}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                        <StopCircle size={13} /> Stop Sharing
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── User's Own Live Tile (With Webcam & Audio Visualizer) ─────

function YourTile({
    user,
    localStream,
    isCameraOn,
    isMicOn,
    audioLevel,
    isSpeaking,
    isHandRaised,
    compact,
}: {
    user: { name?: string; role?: string } | null
    localStream: MediaStream | null
    isCameraOn: boolean
    isMicOn: boolean
    audioLevel: number
    isSpeaking: boolean
    isHandRaised: boolean
    compact?: boolean
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            if (localStream && isCameraOn) {
                videoRef.current.srcObject = localStream
            } else {
                videoRef.current.srcObject = null
            }
        }
    }, [localStream, isCameraOn])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
                'relative rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all flex-shrink-0 bg-slate-900',
                isSpeaking
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                    : 'border-primary/60',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[160px]'
            )}
        >
            {/* Live Camera Feed */}
            {isCameraOn && localStream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                />
            ) : (
                /* Camera Off State */
                <div className="flex flex-col items-center gap-2 p-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-md">
                        {(user?.name || 'Y').charAt(0).toUpperCase()}
                    </div>
                    {!compact && (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <VideoOff size={11} /> Camera off
                        </span>
                    )}
                </div>
            )}

            {/* Bottom info badge */}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-xs">
                <span>{user?.name || 'You'} (You)</span>
                {isSpeaking && (
                    <span className="flex items-center gap-0.5">
                        <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" />
                        <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </span>
                )}
            </div>

            {/* Mic status indicator */}
            <div className="absolute bottom-2 right-2">
                {!isMicOn ? (
                    <div className="w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xs">
                        <MicOff size={12} />
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-xs">
                        <Mic size={12} />
                    </div>
                )}
            </div>

            {/* Hand Raised badge */}
            {isHandRaised && (
                <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    ✋ Raised
                </div>
            )}
        </motion.div>
    )
}

// ── Host Tile Component ───────────────────────────────────────

function HostTile({
    liveClass,
    isTeacher,
    className,
    compact,
}: {
    liveClass: typeof liveClasses[0]
    isTeacher: boolean
    className?: string
    compact?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-primary/50 shadow-md',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[160px]',
                className
            )}
        >
            <div className="flex flex-col items-center gap-2 p-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {liveClass.instructor.name.charAt(0)}
                </div>
                <p className="text-sm font-semibold text-slate-100">{liveClass.instructor.name}</p>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
                    Instructor (Host)
                </span>
            </div>

            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-200">
                {liveClass.instructor.name.split(' ')[0]} (Host)
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                    <Mic size={11} />
                </div>
            </div>
        </motion.div>
    )
}

// ── Other Participants Tile Component ─────────────────────────

function ParticipantTile({
    p,
    index,
    isTeacher,
    compact,
}: {
    p: typeof MOCK_PARTICIPANTS[0]
    index: number
    isTeacher?: boolean
    compact?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.06 }}
            className={cn(
                'relative rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-800/80',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[140px]'
            )}
            style={{ background: p.color + '18' }}
        >
            <div className="flex flex-col items-center gap-1.5">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-sm"
                    style={{ background: p.color }}
                >
                    {p.initials}
                </div>
                {p.isVideoOff && !compact && (
                    <p className="text-[11px] text-slate-400">Camera off</p>
                )}
            </div>

            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-200">
                {p.name.split(' ')[0]}
            </div>
            {p.isMuted && (
                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xs">
                    <MicOff size={10} />
                </div>
            )}
            {p.isHandRaised && (
                <div className="absolute top-2 right-2 text-sm">✋</div>
            )}
        </motion.div>
    )
}

// ── Control Button Helper ─────────────────────────────────────

function CtrlBtn({
    icon,
    label,
    active,
    onClick,
    danger,
    badge,
    badgeColor,
}: {
    icon: React.ReactNode
    label: string
    active: boolean
    onClick: () => void
    danger?: boolean
    badge?: string
    badgeColor?: string
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className="relative">
                <button
                    onClick={onClick}
                    className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm',
                        danger
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                            : active
                            ? 'bg-primary text-white hover:bg-primary-dark shadow-[0_0_12px_rgba(46,58,140,0.4)]'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                    )}
                >
                    {icon}
                </button>
                {badge && (
                    <span
                        className={cn(
                            'absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center justify-center text-white shadow-xs',
                            badgeColor || 'bg-accent'
                        )}
                    >
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:block whitespace-nowrap">{label}</span>
        </div>
    )
}
