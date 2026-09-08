'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video, Mic, MicOff, VideoOff, ScreenShare, MessageSquare, Users,
    X, Hand, PhoneOff, Maximize2, Settings, ChevronRight, StopCircle,
    Monitor, PenLine, BarChart2, Smile, Volume2, VolumeX, Grid3x3,
    Rows, Copy, Bell, MoreVertical, MicOff as MuteIcon, UserX, Star,
    Radio, Download, FileText, Shield, CheckCircle2, AlertTriangle,
    Sliders, RefreshCw, UserCheck
} from 'lucide-react'
import { getLiveClassById, checkLiveClassAccess } from '@/lib/api/live-classes'
import { useAuthStore } from '@/store/use-auth-store'
import { connectSocket, getSocket } from '@/lib/socket'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useMediaStream } from '@/hooks/use-media-stream'
import { DeviceSettingsModal } from '@/components/live-class/device-settings-modal'

export interface MeetingParticipant {
    id: string
    userId: string
    name: string
    avatar?: string
    role: string
    isTeacher: boolean
    isCameraOn: boolean
    isMicOn: boolean
    isHandRaised: boolean
    color: string
    initials: string
    joinedAt?: string | Date
}

export interface MeetingChatMessage {
    id: string | number
    userId?: string
    user: string
    role?: string
    isHost: boolean
    msg: string
    time: string
}

const EMOJIS = ['👍','👏','❤️','😂','🔥','🤔','🙌','✅']

const POLL_OPTIONS = [
    { id: 'a', text: 'Server Components', votes: 12 },
    { id: 'b', text: 'Client Components',  votes: 8  },
    { id: 'c', text: 'Both equally',       votes: 5  },
]

// ── Main Component ────────────────────────────────────────────
export default function LiveMeetingPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const user = useAuthStore(state => state.user)
    const token = useAuthStore(state => state.token)
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN'
    const currentUserId = (user as any)?._id || user?.id

    const [liveClass, setLiveClass] = useState<any>({
        id: id || '',
        meetingId: id || '',
        title: 'Loading Live Class...',
        description: '',
        course: { id: '', title: 'Live Session', category: 'Workshop' },
        instructor: { name: 'Instructor', avatar: '', title: 'Instructor' },
        scheduledAt: new Date().toISOString(),
        duration: 60,
        status: 'LIVE',
        attendeesCount: 0,
        maxAttendees: 500,
        meetingUrl: '',
        tags: [],
    })

    // Real Participant Session List (strictly real users connected to this room)
    const [participants, setParticipants] = useState<MeetingParticipant[]>([])
    const [messages, setMessages] = useState<MeetingChatMessage[]>([])
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    // Load Live Class and Verify Course Access Control
    useEffect(() => {
        if (!id) return

        let isMounted = true

        const verifyAndLoad = async () => {
            try {
                // 1. Check access control on backend
                const accessRes = await checkLiveClassAccess(id, token)
                if (!isMounted) return

                if (!accessRes.authorized) {
                    setIsAuthorized(false)
                    toast.error(accessRes.message || 'Access denied. You do not have permission to join this live class.')
                    router.push(isTeacher ? '/teacher/live-classes' : '/student/live-classes')
                    return
                }

                setIsAuthorized(true)

                // 2. Fetch full class details
                const res = await getLiveClassById(id)
                if (!isMounted) return

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
            } catch (err: any) {
                if (!isMounted) return
                const errMsg = err?.message || 'Unable to join live class.'
                toast.error(errMsg)
                router.push(isTeacher ? '/teacher/live-classes' : '/student/live-classes')
            } finally {
                if (isMounted) setAuthLoading(false)
            }
        }

        verifyAndLoad()

        return () => {
            isMounted = false
        }
    }, [id, token, router, isTeacher])

    // Real Media Engine (Camera, Mic, Screen Share)
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

    // ── Socket.IO Real-time Meeting Connection ────────────────────
    useEffect(() => {
        if (!id || isAuthorized !== true || !user) return

        const socket = connectSocket()

        // 1. Join Meeting Room
        socket.emit('join_meeting', {
            meetingId: id,
            isCameraOn,
            isMicOn,
            isHandRaised,
            token,
        })

        // 2. Room State: Received full list of currently connected participants
        const handleMeetingState = (data: { meetingId: string; participants: MeetingParticipant[] }) => {
            if (data.meetingId === id && Array.isArray(data.participants)) {
                setParticipants(data.participants)
            }
        }

        // 3. New participant joined the room
        const handleParticipantJoined = (data: { meetingId: string; participant: MeetingParticipant }) => {
            if (data.meetingId === id && data.participant) {
                setParticipants(prev => {
                    const filtered = prev.filter(p => p.userId !== data.participant.userId && p.id !== data.participant.id)
                    return [...filtered, data.participant]
                })
                toast.info(`${data.participant.name} joined the meeting`)
            }
        }

        // 4. Participant left or disconnected
        const handleParticipantLeft = (data: { meetingId: string; userId: string; name?: string }) => {
            if (data.meetingId === id && data.userId) {
                setParticipants(prev => prev.filter(p => p.userId !== data.userId && p.id !== data.userId))
                if (data.name) {
                    toast(`${data.name} left the meeting`, { duration: 2000 })
                }
            }
        }

        // 5. Participant media status changed (mic / camera / hand)
        const handleMediaUpdated = (data: { meetingId: string; userId: string; isCameraOn?: boolean; isMicOn?: boolean; isHandRaised?: boolean }) => {
            if (data.meetingId === id && data.userId) {
                setParticipants(prev => prev.map(p => {
                    if (p.userId === data.userId || p.id === data.userId) {
                        return {
                            ...p,
                            ...(typeof data.isCameraOn === 'boolean' ? { isCameraOn: data.isCameraOn } : {}),
                            ...(typeof data.isMicOn === 'boolean' ? { isMicOn: data.isMicOn } : {}),
                            ...(typeof data.isHandRaised === 'boolean' ? { isHandRaised: data.isHandRaised } : {}),
                        }
                    }
                    return p
                }))
            }
        }

        // 6. Real-time chat message received
        const handleChatMessage = (data: { meetingId: string; message: MeetingChatMessage }) => {
            if (data.meetingId === id && data.message) {
                setMessages(prev => [...prev, data.message])
            }
        }

        // 7. Reaction emoji received
        const handleReaction = (data: { meetingId: string; emoji: string; user: string }) => {
            if (data.meetingId === id && data.emoji) {
                toast(`${data.user}: ${data.emoji} ${data.emoji}`, { duration: 1500 })
            }
        }

        socket.on('meeting_state', handleMeetingState)
        socket.on('participant_joined', handleParticipantJoined)
        socket.on('participant_left', handleParticipantLeft)
        socket.on('participant_media_updated', handleMediaUpdated)
        socket.on('meeting_chat_message', handleChatMessage)
        socket.on('meeting_reaction', handleReaction)

        return () => {
            socket.emit('leave_meeting', { meetingId: id })
            socket.off('meeting_state', handleMeetingState)
            socket.off('participant_joined', handleParticipantJoined)
            socket.off('participant_left', handleParticipantLeft)
            socket.off('participant_media_updated', handleMediaUpdated)
            socket.off('meeting_chat_message', handleChatMessage)
            socket.off('meeting_reaction', handleReaction)
        }
    }, [id, isAuthorized, user, token])

    // Broadcast local media changes to room
    const handleToggleMic = async () => {
        const nextState = !isMicOn
        await toggleMic()
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_media_toggle', { meetingId: id, isMicOn: nextState })
        }
    }

    const handleToggleCamera = async () => {
        const nextState = !isCameraOn
        await toggleCamera()
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_media_toggle', { meetingId: id, isCameraOn: nextState })
        }
    }

    const handleToggleHand = () => {
        const nextState = !isHandRaised
        setIsHandRaised(nextState)
        toast(nextState ? '✋ Hand raised!' : 'Hand lowered')
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_media_toggle', { meetingId: id, isHandRaised: nextState })
        }
    }

    // Auto-scroll chat
    useEffect(() => {
        if (sidePanel === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, sidePanel])

    // Unread badge
    useEffect(() => {
        if (sidePanel !== 'chat' && messages.length > 0) {
            setUnreadCount(c => c + 1)
        }
    }, [messages.length, sidePanel])

    const sendMsg = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_chat', { meetingId: id, text: chatInput.trim() })
        } else {
            setMessages(m => [...m, {
                id: Date.now(),
                user: user?.name || 'You',
                msg: chatInput.trim(),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                isHost: isTeacher,
            }])
        }
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
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_reaction', { meetingId: id, emoji })
        }
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

    // Active Connected Participants Breakdown
    // Current user is always represented by YourTile
    const otherParticipants = participants.filter(
        p => p.userId !== currentUserId && p.id !== currentUserId
    )

    // Online host/teacher (if connected to this meeting)
    const activeHost = participants.find(p => p.isTeacher)

    // Real dynamic participant count (self + actually connected peers)
    const realParticipantCount = Math.max(1, participants.length)

    // Students list for people drawer
    const connectedStudents = participants.filter(p => !p.isTeacher)

    if (authLoading) {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans gap-4">
                <RefreshCw size={32} className="animate-spin text-primary" />
                <p className="text-sm text-slate-400">Verifying live class access & connecting to room...</p>
            </div>
        )
    }

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
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span>{liveClass.instructor.name}</span>
                            {activeHost ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                                    ● Teacher Online
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-500 italic">
                                    (Teacher not in room)
                                </span>
                            )}
                        </p>
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

                    {/* DYNAMIC REAL PARTICIPANT COUNTER */}
                    <span className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50 font-medium">
                        <Users size={13} className="text-primary" />
                        <span>{realParticipantCount}</span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">{realParticipantCount === 1 ? 'person' : 'people'}</span>
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
                            {otherParticipants.map((p, i) => (
                                <ParticipantTile key={p.id || p.userId} p={p} index={i} compact />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Normal Grid or Spotlight Layout */
                    <div className={cn(
                        'flex-1 p-3 overflow-auto',
                        layout === 'spotlight' ? 'flex flex-col gap-3' : 'grid gap-3',
                        layout === 'grid' && (
                            otherParticipants.length === 0
                                ? 'grid-cols-1 md:grid-cols-2'
                                : otherParticipants.length === 1
                                ? 'grid-cols-1 sm:grid-cols-2'
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        )
                    )} style={{ gridAutoRows: '1fr' }}>

                        {/* Local User Tile */}
                        <YourTile
                            user={user}
                            localStream={localStream}
                            isCameraOn={isCameraOn}
                            isMicOn={isMicOn}
                            audioLevel={audioLevel}
                            isSpeaking={isSpeaking}
                            isHandRaised={isHandRaised}
                        />

                        {/* Connected Remote Participants (Only Real Connected Users!) */}
                        {otherParticipants.map((p, i) => (
                            p.isTeacher ? (
                                <HostTile
                                    key={p.id || p.userId}
                                    participant={p}
                                    liveClass={liveClass}
                                />
                            ) : (
                                <ParticipantTile
                                    key={p.id || p.userId}
                                    p={p}
                                    index={i}
                                    isTeacher={isTeacher}
                                />
                            )
                        ))}

                        {/* Empty Waiting State when alone in the meeting */}
                        {otherParticipants.length === 0 && (
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
                                {isTeacher ? (
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-inner">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-100">Waiting for students to join...</h3>
                                            <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                                You are the host of this class. Once your enrolled students join, their video tiles will appear here automatically.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (typeof window !== 'undefined') {
                                                    navigator.clipboard.writeText(window.location.href)
                                                    toast.success('Meeting link copied to clipboard! 📋')
                                                }
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shadow-sm"
                                        >
                                            <Copy size={13} /> Copy Class Invite Link
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center animate-pulse shadow-inner">
                                            <Radio size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-100">Waiting for instructor or classmates...</h3>
                                            <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                                You are connected to this live room. As soon as the teacher or other students enter, they will appear here in real time.
                                            </p>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Live Session Ready
                                        </div>
                                    </>
                                )}
                            </div>
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
                                        ) : p === 'people' ? (
                                            `People (${realParticipantCount})`
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
                                        {messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                                                <MessageSquare size={32} className="opacity-30 mb-2" />
                                                <p className="text-xs">No messages yet in this session.</p>
                                                <p className="text-[11px] text-slate-600 mt-1">Say hello to everyone!</p>
                                            </div>
                                        ) : (
                                            messages.map(m => (
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
                                            ))
                                        )}
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

                            {/* People Panel (Real Connected Users Only) */}
                            {sidePanel === 'people' && (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">Host / Instructor</div>
                                    {activeHost ? (
                                        <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/60 transition-colors">
                                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                                                {activeHost.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {activeHost.name} {activeHost.userId === currentUserId && '(You)'}
                                                </p>
                                                <p className="text-xs text-yellow-400 flex items-center gap-1">
                                                    <Shield size={10} /> Host
                                                </p>
                                            </div>
                                            {activeHost.isMicOn ? (
                                                <Mic size={14} className="text-emerald-400" />
                                            ) : (
                                                <MicOff size={14} className="text-red-400" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5 px-3 py-2.5 text-slate-500 text-xs italic">
                                            <span>{liveClass.instructor.name}</span>
                                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">(Offline)</span>
                                        </div>
                                    )}

                                    <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold border-t border-slate-800 mt-1 flex items-center justify-between">
                                        <span>Students Connected</span>
                                        <span className="text-primary font-mono">{connectedStudents.length}</span>
                                    </div>

                                    {connectedStudents.length === 0 ? (
                                        <div className="px-3 py-4 text-xs text-slate-500 italic text-center">
                                            No students currently connected
                                        </div>
                                    ) : (
                                        connectedStudents.map(p => (
                                            <div key={p.id || p.userId} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/60 transition-colors group">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: p.color }}>
                                                    {p.initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm truncate">
                                                        {p.name} {p.userId === currentUserId && '(You)'}
                                                    </p>
                                                    {p.isHandRaised && <p className="text-xs text-yellow-400">✋ Hand raised</p>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {p.isMicOn ? <Mic size={13} className="text-emerald-400" /> : <MicOff size={13} className="text-red-400" />}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* You (Quick indicator) */}
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/40 border-t border-slate-800 mt-2">
                                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                                            {(user?.name || 'Y').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user?.name || 'You'} (You)</p>
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
                        onClick={handleToggleMic}
                        icon={!isMicOn ? <MicOff size={18} /> : <Mic size={18} />}
                        label={!isMicOn ? 'Unmute' : 'Mute'}
                    />
                    <CtrlBtn
                        active={isCameraOn}
                        onClick={handleToggleCamera}
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
                        onClick={handleToggleHand}
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
                        badge={realParticipantCount > 1 ? String(realParticipantCount) : undefined}
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
                <div className="flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => {
                            const socket = getSocket()
                            if (socket && socket.connected) {
                                socket.emit('leave_meeting', { meetingId: id })
                            }
                            toast('Left the meeting')
                            router.push(isTeacher ? '/teacher/live-classes' : '/student/live-classes')
                        }}
                        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg active:scale-95"
                        title="Leave Live Meeting"
                    >
                        <PhoneOff size={20} />
                    </button>
                    <span className="text-xs text-slate-400 hidden sm:block">Leave</span>
                </div>
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
                onToggleCamera={handleToggleCamera}
                onToggleMic={handleToggleMic}
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

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
                'relative rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all flex-shrink-0 bg-slate-900',
                isSpeaking
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                    : isTeacher
                    ? 'border-indigo-500/70'
                    : 'border-slate-800',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[180px]'
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
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-xs">
                <span>{user?.name || 'You'} (You)</span>
                {isTeacher && (
                    <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.2 rounded font-semibold">
                        Host
                    </span>
                )}
                {isSpeaking && (
                    <span className="flex items-center gap-0.5 ml-1">
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

// ── Host Tile Component (Displays Real Online Teacher) ────────

function HostTile({
    participant,
    liveClass,
    className,
    compact,
}: {
    participant?: MeetingParticipant
    liveClass: any
    className?: string
    compact?: boolean
}) {
    const hostName = participant?.name || liveClass.instructor?.name || 'Instructor'
    const initials = participant?.initials || hostName.slice(0, 2).toUpperCase()
    const isMicOn = participant?.isMicOn ?? true
    const isCameraOn = participant?.isCameraOn ?? false

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-indigo-500/60 shadow-md',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[180px]',
                className
            )}
        >
            <div className="flex flex-col items-center gap-2 p-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {initials}
                </div>
                <p className="text-sm font-semibold text-slate-100">{hostName}</p>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Shield size={10} /> Instructor (Host)
                </span>
            </div>

            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-200">
                {hostName.split(' ')[0]} (Host)
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
                <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shadow-xs',
                    isMicOn ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
                )}>
                    {isMicOn ? <Mic size={11} /> : <MicOff size={11} />}
                </div>
            </div>
        </motion.div>
    )
}

// ── Connected Student Tile Component ──────────────────────────

function ParticipantTile({
    p,
    index,
    isTeacher,
    compact,
}: {
    p: MeetingParticipant
    index: number
    isTeacher?: boolean
    compact?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                'relative rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-800 bg-slate-900',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[160px]'
            )}
            style={{ backgroundColor: p.color ? `${p.color}15` : '#1e1b4b15' }}
        >
            <div className="flex flex-col items-center gap-1.5 p-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-sm"
                    style={{ background: p.color || '#6366f1' }}
                >
                    {p.initials}
                </div>
                {!p.isCameraOn && !compact && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <VideoOff size={10} /> Camera off
                    </p>
                )}
            </div>

            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-medium text-slate-200 truncate max-w-[120px]">
                {p.name}
            </div>

            <div className="absolute bottom-2 right-2">
                {!p.isMicOn ? (
                    <div className="w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xs">
                        <MicOff size={10} />
                    </div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-xs">
                        <Mic size={10} />
                    </div>
                )}
            </div>

            {p.isHandRaised && (
                <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
                    ✋ Raised
                </div>
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
