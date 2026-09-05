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
    Radio, Download, FileText, Shield, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { liveClasses } from '@/data/mock-data'
import { useAuthStore } from '@/store/use-auth-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Mock Data ─────────────────────────────────────────────────
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
    const liveClass = liveClasses.find(lc => lc.id === id) || liveClasses[1]

    // Controls
    const [isMuted,        setIsMuted]        = useState(false)
    const [isVideoOff,     setIsVideoOff]     = useState(false)
    const [isSharing,      setIsSharing]      = useState(false)
    const [isRecording,    setIsRecording]    = useState(false)
    const [isHandRaised,   setIsHandRaised]   = useState(false)
    const [isFullscreen,   setIsFullscreen]   = useState(false)
    const [layout,         setLayout]         = useState<'grid' | 'spotlight'>('grid')

    // Panels
    const [sidePanel,      setSidePanel]      = useState<'chat' | 'people' | 'whiteboard' | 'poll' | null>(null)
    const [showReactions,  setShowReactions]  = useState(false)
    const [showSettings,   setShowSettings]   = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length])

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

    const startScreenShare = () => {
        setIsSharing(s => {
            toast(s ? 'Screen sharing stopped' : '🖥️ You are now sharing your screen')
            return !s
        })
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
        <div className="h-screen bg-gray-950 flex flex-col text-white overflow-hidden select-none">

            {/* ── Top Bar ─────────────────────────────────────── */}
            <div className="bg-gray-900/95 px-4 py-2.5 flex items-center justify-between border-b border-gray-800 flex-shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live</span>
                    </div>
                    <div className="w-px h-4 bg-gray-700" />
                    <div>
                        <p className="font-semibold text-sm truncate max-w-[200px] sm:max-w-sm">{liveClass.title}</p>
                        <p className="text-xs text-gray-400">{liveClass.instructor.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isRecording && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> REC
                        </div>
                    )}
                    {isSharing && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/30">
                            <Monitor size={11} /> Sharing
                        </div>
                    )}
                    <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg tabular-nums">
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                        <Users size={12} />{MOCK_PARTICIPANTS.length + 2}
                    </span>
                    {/* Layout toggle */}
                    <button onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
                        className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors" title="Toggle layout">
                        {layout === 'grid' ? <Rows size={16} /> : <Grid3x3 size={16} />}
                    </button>
                    {isTeacher && (
                        <button onClick={() => setShowSettings(s => !s)}
                            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors" title="Settings">
                            <Settings size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Screen share banner ─────────────────────────── */}
            <AnimatePresence>
                {isSharing && (
                    <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
                        className="bg-blue-600/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between text-sm flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Monitor size={16} />
                            <span className="font-medium">You are sharing your screen</span>
                        </div>
                        <button onClick={startScreenShare}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                            <StopCircle size={13} /> Stop Sharing
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main area ───────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Video grid */}
                <div className={cn('flex-1 p-3 overflow-auto', layout === 'spotlight' ? 'flex flex-col gap-3' : 'grid gap-3',
                    layout === 'grid' && 'grid-cols-2 sm:grid-cols-3')}
                    style={{ gridAutoRows: '1fr' }}>

                    {/* Spotlight: Host tile full size */}
                    {layout === 'spotlight' ? (
                        <>
                            <HostTile liveClass={liveClass} isTeacher={isTeacher} isSharing={isSharing} className="flex-1 min-h-[60%]" />
                            <div className="h-32 flex gap-2 overflow-x-auto pb-1">
                                {MOCK_PARTICIPANTS.slice(0, 4).map((p, i) => (
                                    <ParticipantTile key={p.id} p={p} index={i} compact />
                                ))}
                                <YourTile user={user} isMuted={isMuted} isVideoOff={isVideoOff} isHandRaised={isHandRaised} compact />
                            </div>
                        </>
                    ) : (
                        <>
                            <HostTile liveClass={liveClass} isTeacher={isTeacher} isSharing={isSharing} className="col-span-2 sm:col-span-1" />
                            {MOCK_PARTICIPANTS.map((p, i) => (
                                <ParticipantTile key={p.id} p={p} index={i} isTeacher={isTeacher} />
                            ))}
                            <YourTile user={user} isMuted={isMuted} isVideoOff={isVideoOff} isHandRaised={isHandRaised} />
                        </>
                    )}
                </div>

                {/* ── Side Panel ──────────────────────────────── */}
                <AnimatePresence>
                    {sidePanel && (
                        <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">

                            {/* Panel tabs */}
                            <div className="flex items-center border-b border-gray-800 flex-shrink-0">
                                {(['chat', 'people', 'whiteboard', ...(isTeacher ? ['poll'] : [])] as Array<'chat' | 'people' | 'whiteboard' | 'poll'>).map(p => (
                                    <button key={p} onClick={() => openPanel(p)}
                                        className={cn('flex-1 py-3 text-xs font-medium capitalize transition-colors border-b-2',
                                            sidePanel === p ? 'text-white border-primary' : 'text-gray-400 border-transparent hover:text-white')}>
                                        {p === 'chat' && unreadCount > 0 && sidePanel !== 'chat' ? (
                                            <span className="flex items-center justify-center gap-1">Chat <span className="w-4 h-4 bg-accent rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span></span>
                                        ) : p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                                <button onClick={() => setSidePanel(null)} className="px-3 text-gray-500 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Chat */}
                            {sidePanel === 'chat' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {messages.map(m => (
                                            <div key={m.id} className={cn('flex flex-col gap-0.5', m.user === (user?.name || 'You') && 'items-end')}>
                                                <div className="flex items-center gap-1.5">
                                                    {m.isHost && <Shield size={10} className="text-yellow-400" />}
                                                    <span className="text-xs text-gray-400">{m.user}</span>
                                                    <span className="text-xs text-gray-600">{m.time}</span>
                                                </div>
                                                <div className={cn('text-sm rounded-2xl px-3 py-2 max-w-[85%]',
                                                    m.user === (user?.name || 'You') ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm')}>
                                                    {m.msg}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendMsg} className="p-3 border-t border-gray-800 flex gap-2 flex-shrink-0">
                                        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                                            placeholder="Message everyone..." autoComplete="off"
                                            className="flex-1 bg-gray-800 text-sm text-gray-100 placeholder:text-gray-500 rounded-xl px-3 py-2 outline-none border border-gray-700 focus:border-primary transition-colors" />
                                        <button type="submit" className="px-3 py-2 bg-primary rounded-xl text-xs font-medium hover:bg-primary-dark transition-colors">Send</button>
                                    </form>
                                </>
                            )}

                            {/* Participants */}
                            {sidePanel === 'people' && (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">Host</div>
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800/60 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {liveClass.instructor.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{liveClass.instructor.name}</p>
                                            <p className="text-xs text-yellow-400">Host</p>
                                        </div>
                                        <Mic size={14} className="text-gray-400" />
                                    </div>

                                    <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider font-semibold border-t border-gray-800 mt-1">
                                        Participants ({MOCK_PARTICIPANTS.length + 1})
                                    </div>
                                    {MOCK_PARTICIPANTS.map(p => (
                                        <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800/60 transition-colors group">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: p.color }}>
                                                {p.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">{p.name}</p>
                                                {p.isHandRaised && <p className="text-xs text-yellow-400">✋ Hand raised</p>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {p.isMuted ? <MicOff size={13} className="text-red-400" /> : <Mic size={13} className="text-gray-400" />}
                                                {isTeacher && (
                                                    <button onClick={() => toast.success(`${p.name.split(' ')[0]} muted`)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all">
                                                        <MuteIcon size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* You */}
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-800/40 border-t border-gray-800">
                                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {(user?.name || 'Y').charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">{user?.name || 'You'} (You)</p>
                                            {isTeacher && <p className="text-xs text-yellow-400">Host</p>}
                                        </div>
                                        {isMuted ? <MicOff size={13} className="text-red-400" /> : <Mic size={13} className="text-gray-400" />}
                                    </div>
                                </div>
                            )}

                            {/* Whiteboard */}
                            {sidePanel === 'whiteboard' && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 flex-shrink-0">
                                        <span className="text-xs text-gray-400">Pen color:</span>
                                        {['#ffffff', '#60a5fa', '#34d399', '#f87171', '#fbbf24'].map(c => (
                                            <button key={c} onClick={() => setPenColor(c)}
                                                className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110', penColor === c ? 'border-white scale-110' : 'border-transparent')}
                                                style={{ background: c }} />
                                        ))}
                                        <button onClick={clearCanvas} className="ml-auto text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-gray-800">Clear</button>
                                    </div>
                                    <canvas ref={canvasRef} width={288} height={400}
                                        className="flex-1 cursor-crosshair bg-gray-800"
                                        onMouseDown={startDraw} onMouseMove={draw}
                                        onMouseUp={stopDraw} onMouseLeave={stopDraw} />
                                </div>
                            )}

                            {/* Poll (teacher can create, students vote) */}
                            {sidePanel === 'poll' && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">Live Poll</h4>
                                        {isTeacher && (
                                            <button onClick={() => { setPollActive(a => !a); toast(pollActive ? 'Poll closed' : '🗳️ Poll launched to students') }}
                                                className={cn('text-xs px-3 py-1.5 rounded-xl font-medium transition-colors',
                                                    pollActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary/20 text-blue-400 hover:bg-primary/30')}>
                                                {pollActive ? 'Close Poll' : 'Launch Poll'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-gray-800 rounded-2xl p-4">
                                        <p className="text-sm font-medium mb-4">Which component type do you prefer?</p>
                                        <div className="space-y-2.5">
                                            {pollOptions.map(opt => {
                                                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                                                const voted = pollVote === opt.id
                                                return (
                                                    <button key={opt.id} onClick={() => pollActive && !isTeacher ? handleVote(opt.id) : undefined}
                                                        disabled={!!pollVote || isTeacher || !pollActive}
                                                        className={cn('w-full text-left px-3 py-2.5 rounded-xl border transition-all relative overflow-hidden',
                                                            voted ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-600',
                                                            (!pollActive && !isTeacher) && 'opacity-50 cursor-not-allowed')}>
                                                        <div className="absolute inset-0 bg-primary/10 transition-all rounded-xl" style={{ width: (pollVote || isTeacher) ? `${pct}%` : '0%' }} />
                                                        <div className="relative flex items-center justify-between">
                                                            <span className="text-sm">{opt.text}</span>
                                                            {(pollVote || isTeacher) && <span className="text-xs text-gray-400">{pct}% ({opt.votes})</span>}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {(pollVote || isTeacher) && (
                                            <p className="text-xs text-gray-500 mt-3 text-center">{totalVotes} total votes</p>
                                        )}
                                        {!pollActive && !pollVote && !isTeacher && (
                                            <p className="text-xs text-gray-500 mt-3 text-center">Waiting for teacher to launch poll...</p>
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
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl p-3 flex gap-2 shadow-2xl z-50">
                        {EMOJIS.map(e => (
                            <button key={e} onClick={() => sendReaction(e)}
                                className="text-2xl hover:scale-125 transition-transform w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-700">
                                {e}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Control Bar ─────────────────────────────────── */}
            <div className="bg-gray-900/95 border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0 backdrop-blur-sm">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                    <CtrlBtn active={!isMuted} danger={isMuted}
                        onClick={() => { setIsMuted(m => !m); toast(isMuted ? '🎤 Mic on' : '🔇 Mic muted') }}
                        icon={isMuted ? <MicOff size={18} /> : <Mic size={18} />} label={isMuted ? 'Unmute' : 'Mute'} />
                    <CtrlBtn active={!isVideoOff}
                        onClick={() => { setIsVideoOff(v => !v); toast(isVideoOff ? '📹 Camera on' : '📷 Camera off') }}
                        icon={isVideoOff ? <VideoOff size={18} /> : <Video size={18} />} label={isVideoOff ? 'Start Video' : 'Stop Video'} />
                </div>

                {/* Center controls */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <CtrlBtn active={isSharing} onClick={startScreenShare}
                        icon={<ScreenShare size={18} />} label="Share Screen"
                        badge={isSharing ? '●' : undefined} badgeColor="bg-blue-500" />
                    <CtrlBtn active={isHandRaised} onClick={() => { setIsHandRaised(h => !h); toast(isHandRaised ? 'Hand lowered' : '✋ Hand raised!') }}
                        icon={<Hand size={18} />} label="Raise Hand" />
                    <CtrlBtn active={showReactions} onClick={() => setShowReactions(r => !r)}
                        icon={<Smile size={18} />} label="React" />
                    <CtrlBtn active={sidePanel === 'chat'} onClick={() => openPanel('chat')}
                        icon={<MessageSquare size={18} />} label="Chat"
                        badge={unreadCount > 0 && sidePanel !== 'chat' ? String(unreadCount) : undefined} />
                    <CtrlBtn active={sidePanel === 'people'} onClick={() => openPanel('people')}
                        icon={<Users size={18} />} label="People" />
                    <CtrlBtn active={sidePanel === 'whiteboard'} onClick={() => openPanel('whiteboard')}
                        icon={<PenLine size={18} />} label="Whiteboard" />
                    {(isTeacher || true) && (
                        <CtrlBtn active={sidePanel === 'poll'} onClick={() => openPanel('poll')}
                            icon={<BarChart2 size={18} />} label="Poll" />
                    )}
                    {isTeacher && (
                        <CtrlBtn active={isRecording} danger={isRecording} onClick={toggleRecording}
                            icon={<Radio size={18} />} label={isRecording ? 'Stop Rec' : 'Record'} />
                    )}
                </div>

                {/* Right: Leave */}
                <Link href={isTeacher ? '/teacher/live-classes' : '/student/live-classes'}>
                    <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => toast('Left the meeting')}
                            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg">
                            <PhoneOff size={20} />
                        </button>
                        <span className="text-xs text-gray-400 hidden sm:block">Leave</span>
                    </div>
                </Link>
            </div>
        </div>
    )
}

// ── Sub components ────────────────────────────────────────────

function HostTile({ liveClass, isTeacher, isSharing, className }: {
    liveClass: typeof liveClasses[0]
    isTeacher: boolean
    isSharing: boolean
    className?: string
}) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            className={cn('relative bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-primary/50', className)}
            style={{ minHeight: '180px' }}>
            {isSharing ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <Monitor size={48} className="text-blue-400" />
                    <p className="text-sm font-medium text-blue-300">Screen being shared</p>
                    <p className="text-xs text-gray-400">Students can see your screen</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg">
                        {liveClass.instructor.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold">{liveClass.instructor.name}</p>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Host</span>
                </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs">
                {liveClass.instructor.name.split(' ')[0]} (Host)
            </div>
            <div className="absolute bottom-3 right-3 flex gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gray-900/80 flex items-center justify-center"><Mic size={11} /></div>
            </div>
        </motion.div>
    )
}

function ParticipantTile({ p, index, isTeacher, compact }: {
    p: typeof MOCK_PARTICIPANTS[0]
    index: number
    isTeacher?: boolean
    compact?: boolean
}) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.08 }}
            className={cn('relative rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0', compact ? 'w-28 h-28' : 'bg-gray-800')}
            style={{ minHeight: compact ? undefined : '130px', background: p.color + '22' }}>
            {p.isVideoOff ? (
                <div className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: p.color }}>
                        {p.initials}
                    </div>
                    {!compact && <p className="text-xs text-gray-400">Camera off</p>}
                </div>
            ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: p.color }}>
                    {p.initials}
                </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-xs">{p.name.split(' ')[0]}</div>
            {p.isMuted && <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"><MicOff size={10} /></div>}
            {p.isHandRaised && <div className="absolute top-2 right-2 text-sm">✋</div>}
        </motion.div>
    )
}

function YourTile({ user, isMuted, isVideoOff, isHandRaised, compact }: {
    user: { name?: string; role?: string } | null
    isMuted: boolean
    isVideoOff: boolean
    isHandRaised: boolean
    compact?: boolean
}) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className={cn('relative rounded-2xl overflow-hidden flex items-center justify-center border-2 border-primary flex-shrink-0',
                isVideoOff ? 'bg-gray-800' : 'bg-indigo-900/50', compact ? 'w-28 h-28' : '')}
            style={{ minHeight: compact ? undefined : '130px' }}>
            <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-lg">
                    {(user?.name || 'U').charAt(0)}
                </div>
                {isVideoOff && !compact && <p className="text-xs text-gray-400">Camera off</p>}
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-xs">You</div>
            {isMuted && <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"><MicOff size={10} /></div>}
            {isHandRaised && <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 px-1.5 py-0.5 rounded text-xs font-bold">✋</div>}
        </motion.div>
    )
}

function CtrlBtn({ icon, label, active, onClick, danger, badge, badgeColor }: {
    icon: React.ReactNode; label: string; active: boolean; onClick: () => void
    danger?: boolean; badge?: string; badgeColor?: string
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className="relative">
                <button onClick={onClick}
                    className={cn('w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95',
                        danger ? 'bg-red-600/30 text-red-400 hover:bg-red-600/50' :
                        active ? 'bg-primary/30 text-blue-300 hover:bg-primary/40' :
                        'bg-gray-800 text-gray-300 hover:bg-gray-700')}>
                    {icon}
                </button>
                {badge && (
                    <span className={cn('absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center text-white', badgeColor || 'bg-accent')}>
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-xs text-gray-500 hidden sm:block whitespace-nowrap">{label}</span>
        </div>
    )
}
