'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video, Mic, MicOff, VideoOff, ScreenShare, MessageSquare, Users,
    X, Hand, PhoneOff, Settings, ChevronRight, StopCircle,
    Monitor, PenLine, BarChart2, Smile, Grid3x3, Rows, Copy, Bell,
    Radio, Shield, Check, UserCheck, AlertCircle, Clock,
    Sliders, RefreshCw, Volume2, VolumeX, Sparkles
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
    email?: string
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

export interface WaitingStudentRequest {
    userId: string
    name: string
    email: string
    avatar?: string
    initials: string
    requestedAt: string | Date
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

const EMOJIS = ['👍', '👏', '❤️', '🔥', '🎉', '✋', '💡', '✅']

const POLL_OPTIONS = [
    { id: 'a', text: 'Server Components', votes: 12 },
    { id: 'b', text: 'Client Components',  votes: 8  },
    { id: 'c', text: 'Both equally',       votes: 5  },
]

export default function LiveMeetingPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const user = useAuthStore(state => state.user)
    const token = useAuthStore(state => state.token)
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN'
    const currentUserId = String((user as any)?._id || user?.id || '')

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

    // Admission & Session States
    const [admissionStatus, setAdmissionStatus] = useState<'admitted' | 'waiting' | 'rejected'>(
        isTeacher ? 'admitted' : 'waiting'
    )
    const [waitingRequests, setWaitingRequests] = useState<WaitingStudentRequest[]>([])
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
                            id: lc.course?._id || '',
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
    const [sidePanel,      setSidePanel]      = useState<'chat' | 'people' | 'requests' | 'whiteboard' | 'poll' | null>(null)
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

    // ── Socket.IO Real-time Meeting & Admission Connection ───────
    useEffect(() => {
        if (!id || isAuthorized !== true || !user) return

        const socket = connectSocket()

        // 1. Join or Request Entry into Meeting Room
        socket.emit('join_meeting', {
            meetingId: id,
            isCameraOn,
            isMicOn,
            isHandRaised,
            token,
        })

        // 2. Room State: Received full list of currently connected participants & waiting list
        const handleMeetingState = (data: {
            meetingId: string
            status?: 'admitted' | 'waiting'
            participants: MeetingParticipant[]
            waitingRequests?: WaitingStudentRequest[]
        }) => {
            if (data.meetingId === id) {
                if (data.status === 'admitted') {
                    setAdmissionStatus('admitted')
                }
                if (Array.isArray(data.participants)) {
                    setParticipants(data.participants)
                }
                if (Array.isArray(data.waitingRequests)) {
                    setWaitingRequests(data.waitingRequests)
                }
            }
        }

        // 3. Student placed in Waiting Room
        const handleJoinWaiting = (data: { meetingId: string; status: 'waiting'; message: string }) => {
            if (data.meetingId === id) {
                setAdmissionStatus('waiting')
            }
        }

        // 4. Student Admitted by Teacher
        const handleJoinAdmitted = (data: { meetingId: string; participants: MeetingParticipant[] }) => {
            if (data.meetingId === id) {
                setAdmissionStatus('admitted')
                if (Array.isArray(data.participants)) {
                    setParticipants(data.participants)
                }
                toast.success('🎉 You have been admitted to the live class!')
            }
        }

        // 5. Student Rejected by Teacher
        const handleJoinRejected = (data: { meetingId: string; message: string }) => {
            if (data.meetingId === id) {
                setAdmissionStatus('rejected')
                toast.error(data.message || 'Your join request was declined.')
            }
        }

        // 6. Teacher notified of a new Join Request
        const handleNewJoinRequest = (data: { meetingId: string; request: WaitingStudentRequest }) => {
            if (data.meetingId === id && isTeacher) {
                setWaitingRequests(prev => {
                    const filtered = prev.filter(r => r.userId !== data.request.userId)
                    return [...filtered, data.request]
                })
                toast.info(`🔔 ${data.request.name} requested to join the class`)
            }
        }

        // 7. Waiting list synced
        const handleWaitingRequestsUpdated = (data: { meetingId: string; waitingRequests: WaitingStudentRequest[] }) => {
            if (data.meetingId === id && Array.isArray(data.waitingRequests)) {
                setWaitingRequests(data.waitingRequests)
            }
        }

        // 8. New participant joined the live room
        const handleParticipantJoined = (data: { meetingId: string; participant: MeetingParticipant }) => {
            if (data.meetingId === id && data.participant) {
                setParticipants(prev => {
                    const filtered = prev.filter(p => p.userId !== data.participant.userId && p.id !== data.participant.id)
                    return [...filtered, data.participant]
                })
                toast.info(`${data.participant.name} joined the meeting`)
            }
        }

        // 9. Participant left or disconnected
        const handleParticipantLeft = (data: { meetingId: string; userId: string; name?: string }) => {
            if (data.meetingId === id && data.userId) {
                setParticipants(prev => prev.filter(p => p.userId !== data.userId && p.id !== data.userId))
                if (data.name) {
                    toast(`${data.name} left the meeting`, { duration: 2000 })
                }
            }
        }

        // 10. Participant media status changed (mic / camera / hand)
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

        // 11. Real-time chat message received
        const handleChatMessage = (data: { meetingId: string; message: MeetingChatMessage }) => {
            if (data.meetingId === id && data.message) {
                setMessages(prev => [...prev, data.message])
            }
        }

        // 12. Reaction emoji received
        const handleReaction = (data: { meetingId: string; emoji: string; user: string }) => {
            if (data.meetingId === id && data.emoji) {
                toast(`${data.user}: ${data.emoji} ${data.emoji}`, { duration: 1500 })
            }
        }

        socket.on('meeting_state', handleMeetingState)
        socket.on('join_waiting', handleJoinWaiting)
        socket.on('join_admitted', handleJoinAdmitted)
        socket.on('join_rejected', handleJoinRejected)
        socket.on('new_join_request', handleNewJoinRequest)
        socket.on('waiting_requests_updated', handleWaitingRequestsUpdated)
        socket.on('participant_joined', handleParticipantJoined)
        socket.on('participant_left', handleParticipantLeft)
        socket.on('participant_media_updated', handleMediaUpdated)
        socket.on('meeting_chat_message', handleChatMessage)
        socket.on('meeting_reaction', handleReaction)

        return () => {
            socket.emit('leave_meeting', { meetingId: id })
            socket.off('meeting_state', handleMeetingState)
            socket.off('join_waiting', handleJoinWaiting)
            socket.off('join_admitted', handleJoinAdmitted)
            socket.off('join_rejected', handleJoinRejected)
            socket.off('new_join_request', handleNewJoinRequest)
            socket.off('waiting_requests_updated', handleWaitingRequestsUpdated)
            socket.off('participant_joined', handleParticipantJoined)
            socket.off('participant_left', handleParticipantLeft)
            socket.off('participant_media_updated', handleMediaUpdated)
            socket.off('meeting_chat_message', handleChatMessage)
            socket.off('meeting_reaction', handleReaction)
        }
    }, [id, isAuthorized, user, token, isTeacher])

    // Teacher Admission Actions
    const handleAdmitStudent = (studentId: string) => {
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('admit_student', { meetingId: id, studentId })
            setWaitingRequests(prev => prev.filter(r => r.userId !== studentId))
            toast.success('Admitted student to the live class! ✅')
        }
    }

    const handleRejectStudent = (studentId: string) => {
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('reject_student', { meetingId: id, studentId })
            setWaitingRequests(prev => prev.filter(r => r.userId !== studentId))
            toast.info('Declined join request.')
        }
    }

    // Media toggles with real-time socket broadcast
    const handleToggleMic = () => {
        const nextState = !isMicOn
        toggleMic()
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_media_toggle', { meetingId: id, isMicOn: nextState })
        }
    }

    const handleToggleCamera = () => {
        const nextState = !isCameraOn
        toggleCamera()
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

    const openPanel = (p: 'chat' | 'people' | 'requests' | 'whiteboard' | 'poll') => {
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

    // ─────────────────────────────────────────────────────────────
    // SINGLE UNIFIED PARTICIPANT LIST (NO DUPLICATE TILES EVER!)
    // ─────────────────────────────────────────────────────────────
    const displayParticipants: MeetingParticipant[] = useMemo(() => {
        const map = new Map<string, MeetingParticipant>()

        // 1. Ensure current user is present if admitted
        if (user && admissionStatus === 'admitted') {
            const uid = String(currentUserId || 'self')
            map.set(uid, {
                id: uid,
                userId: uid,
                name: user.name,
                email: user.email,
                avatar: user.avatar || '',
                role: user.role,
                isTeacher,
                isCameraOn,
                isMicOn,
                isHandRaised,
                color: '#6366f1',
                initials: user.name.slice(0, 2).toUpperCase(),
                joinedAt: new Date(),
            })
        }

        // 2. Merge all participants from Socket.io session (deduplicated by userId)
        for (const p of participants) {
            const uid = String(p.userId || p.id)
            if (map.has(uid)) {
                // If it's the local user, retain their local live mic/camera state
                const existing = map.get(uid)!
                map.set(uid, {
                    ...p,
                    isCameraOn: existing.isCameraOn,
                    isMicOn: existing.isMicOn,
                    isHandRaised: existing.isHandRaised,
                })
            } else {
                map.set(uid, p)
            }
        }

        return Array.from(map.values())
    }, [participants, user, admissionStatus, isCameraOn, isMicOn, isHandRaised, currentUserId, isTeacher])

    const realParticipantCount = displayParticipants.length

    // ── LOADING STATE ─────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans gap-4">
                <RefreshCw size={32} className="animate-spin text-primary" />
                <p className="text-sm text-slate-400">Verifying live class access & connecting to room...</p>
            </div>
        )
    }

    // ── STUDENT WAITING ROOM SCREEN ───────────────────────────────
    if (!isTeacher && admissionStatus === 'waiting') {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans p-6 text-center select-none">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-5"
                >
                    <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                            <Clock size={36} className="animate-pulse" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Waiting Room
                        </span>
                        <h2 className="text-xl font-bold text-slate-100 mt-3">{liveClass.title}</h2>
                        <p className="text-xs text-slate-400 mt-1">Instructor: <strong className="text-slate-200">{liveClass.instructor?.name || 'Lead Instructor'}</strong></p>
                    </div>

                    <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-xs text-slate-300 leading-relaxed text-center">
                        <p className="font-semibold text-amber-300 mb-1">Waiting for the teacher to admit you...</p>
                        <p className="text-slate-400">
                            Your join request has been sent to the instructor. Once approved, you will automatically enter the live video session.
                        </p>
                    </div>

                    <div className="w-full pt-2">
                        <button
                            onClick={() => router.push('/student/live-classes')}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-all shadow-sm"
                        >
                            Cancel & Return
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // ── STUDENT DECLINED / REJECTED SCREEN ────────────────────────
    if (!isTeacher && admissionStatus === 'rejected') {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans p-6 text-center select-none">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-5"
                >
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
                        <AlertCircle size={36} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Join Request Declined</h2>
                        <p className="text-xs text-slate-400 mt-2">
                            The instructor declined your request to join this session or the class is full.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/student/live-classes')}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-all shadow-md"
                    >
                        Back to Live Classes
                    </button>
                </motion.div>
            </div>
        )
    }

    // ── ACTIVE MEETING ROOM ───────────────────────────────────────
    return (
        <div className="h-screen bg-slate-950 flex flex-col text-slate-100 overflow-hidden select-none font-sans relative">

            {/* ── Floating Teacher Admission Banner ───────────────── */}
            <AnimatePresence>
                {isTeacher && waitingRequests.length > 0 && (
                    <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border-2 border-amber-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-4 backdrop-blur-md"
                    >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            {waitingRequests[0].initials}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                                <span>{waitingRequests[0].name}</span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-normal">wants to join</span>
                            </p>
                            <p className="text-[10px] text-slate-400">{waitingRequests[0].email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                            <button
                                onClick={() => handleAdmitStudent(waitingRequests[0].userId)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                            >
                                <Check size={13} /> Accept
                            </button>
                            <button
                                onClick={() => handleRejectStudent(waitingRequests[0].userId)}
                                className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                            >
                                <X size={13} /> Reject
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Top Bar ─────────────────────────────────────────── */}
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
                            <span>Instructor: {liveClass.instructor?.name || 'Lead Instructor'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Teacher Admission Request Counter Badge */}
                    {isTeacher && (
                        <button
                            onClick={() => openPanel('requests')}
                            className={cn(
                                'text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all',
                                waitingRequests.length > 0
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700'
                            )}
                            title="Pending Join Requests"
                        >
                            <UserCheck size={13} />
                            <span>Requests</span>
                            {waitingRequests.length > 0 && (
                                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                    {waitingRequests.length}
                                </span>
                            )}
                        </button>
                    )}

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

                    {/* DYNAMIC REAL PARTICIPANT COUNTER (STRICTLY REAL CONNECTED USERS) */}
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

            {/* ── Screen Share Active Top Banner ──────────────────── */}
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

            {/* ── Main Media & Video Stage ───────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Main Video Viewport */}
                {isScreenSharing ? (
                    <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
                        <ScreenShareStage screenStream={screenStream} onStop={stopScreenShare} />
                        <div className="w-full md:w-64 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto flex-shrink-0">
                            {displayParticipants.map((p, i) => (
                                <MeetingTile
                                    key={p.userId}
                                    participant={p}
                                    isSelf={p.userId === currentUserId}
                                    localStream={localStream}
                                    isSpeaking={p.userId === currentUserId && isSpeaking}
                                    audioLevel={p.userId === currentUserId ? audioLevel : 0}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── UNIFIED VIDEO GRID: EXACTLY 1 TILE PER USER (NO DUPLICATE TILES) ── */
                    <div className={cn(
                        'flex-1 p-3 overflow-auto',
                        layout === 'spotlight' ? 'flex flex-col gap-3' : 'grid gap-3',
                        layout === 'grid' && (
                            displayParticipants.length <= 1
                                ? 'grid-cols-1 max-w-4xl mx-auto w-full'
                                : displayParticipants.length === 2
                                ? 'grid-cols-1 md:grid-cols-2'
                                : displayParticipants.length <= 4
                                ? 'grid-cols-1 sm:grid-cols-2'
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        )
                    )} style={{ gridAutoRows: '1fr' }}>

                        {/* Renders every active admitted participant once */}
                        {displayParticipants.map((p, i) => (
                            <MeetingTile
                                key={p.userId}
                                participant={p}
                                isSelf={p.userId === currentUserId}
                                localStream={localStream}
                                isSpeaking={p.userId === currentUserId && isSpeaking}
                                audioLevel={p.userId === currentUserId ? audioLevel : 0}
                            />
                        ))}

                        {/* Teacher alone waiting for students to request join */}
                        {isTeacher && displayParticipants.length === 1 && (
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-inner">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Waiting for students to join...</h3>
                                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                        You are the host of this class. When students click &quot;Join Live Class&quot;, you will see an admission request here to accept them.
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
                            </div>
                        )}
                    </div>
                )}

                {/* ── Slide-Over Side Panels ─────────────────────────── */}
                <AnimatePresence>
                    {sidePanel && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0 z-20 shadow-2xl"
                        >
                            {/* Panel Header */}
                            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {sidePanel === 'chat' && <><MessageSquare size={16} className="text-primary" /><span className="font-semibold text-sm">Class Chat</span></>}
                                    {sidePanel === 'people' && <><Users size={16} className="text-primary" /><span className="font-semibold text-sm">Participants ({displayParticipants.length})</span></>}
                                    {sidePanel === 'requests' && <><UserCheck size={16} className="text-amber-400" /><span className="font-semibold text-sm">Join Requests ({waitingRequests.length})</span></>}
                                    {sidePanel === 'whiteboard' && <><PenLine size={16} className="text-primary" /><span className="font-semibold text-sm">Live Whiteboard</span></>}
                                    {sidePanel === 'poll' && <><BarChart2 size={16} className="text-primary" /><span className="font-semibold text-sm">Interactive Poll</span></>}
                                </div>
                                <button
                                    onClick={() => setSidePanel(null)}
                                    className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* ── Chat Panel ── */}
                            {sidePanel === 'chat' && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-12 text-slate-500 text-xs">
                                                No chat messages yet.<br />Say hello to the class! 👋
                                            </div>
                                        ) : (
                                            messages.map((m: any) => (
                                                <div key={m.id} className="space-y-0.5">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={cn('text-xs font-semibold', m.isHost ? 'text-yellow-400' : 'text-slate-200')}>
                                                            {m.user}
                                                        </span>
                                                        {m.isHost && (
                                                            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-medium">Host</span>
                                                        )}
                                                        <span className="text-[10px] text-slate-500">{m.time}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 bg-slate-800/70 p-2 rounded-xl rounded-tl-none break-words">
                                                        {m.msg}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendMsg} className="p-2 border-t border-slate-800 flex gap-2">
                                        <input
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-primary"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!chatInput.trim()}
                                            className="px-3 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 rounded-xl text-xs font-semibold text-white transition-colors"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ── People Panel ── */}
                            {sidePanel === 'people' && (
                                <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/60">
                                    {displayParticipants.map(p => (
                                        <div key={p.userId} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/60 transition-colors">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: p.color || '#6366f1' }}>
                                                {p.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-100 truncate">
                                                    {p.name} {p.userId === currentUserId && '(You)'}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {p.isTeacher ? 'Instructor (Host)' : 'Student'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {p.isMicOn ? (
                                                    <Mic size={13} className="text-emerald-400" />
                                                ) : (
                                                    <MicOff size={13} className="text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Join Requests Panel (Teacher Only) ── */}
                            {sidePanel === 'requests' && isTeacher && (
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {waitingRequests.length === 0 ? (
                                        <div className="text-center py-16 text-slate-500 text-xs">
                                            No pending join requests.<br />When students join, they will appear here.
                                        </div>
                                    ) : (
                                        waitingRequests.map(req => (
                                            <div key={req.userId} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                                                        {req.initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-slate-100 truncate">{req.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{req.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleAdmitStudent(req.userId)}
                                                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Check size={13} /> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectStudent(req.userId)}
                                                        className="flex-1 py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <X size={13} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* ── Whiteboard Panel ── */}
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
                                        width={320}
                                        height={420}
                                        className="flex-1 cursor-crosshair bg-slate-950"
                                        onMouseDown={startDraw}
                                        onMouseMove={draw}
                                        onMouseUp={stopDraw}
                                        onMouseLeave={stopDraw}
                                    />
                                </div>
                            )}

                            {/* ── Poll Panel ── */}
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

                                    <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
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

            {/* ── Bottom Control Bar ───────────────────────────────── */}
            <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0 backdrop-blur-md">
                {/* Left controls: Mic, Camera, Device Settings */}
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
                        label={isHandRaised ? 'Hand Raised' : 'Raise Hand'}
                    />
                    <CtrlBtn
                        active={showReactions}
                        onClick={() => setShowReactions(r => !r)}
                        icon={<Smile size={18} />}
                        label="React"
                    />
                    <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />
                    <CtrlBtn
                        active={sidePanel === 'chat'}
                        onClick={() => openPanel('chat')}
                        icon={<MessageSquare size={18} />}
                        label="Chat"
                        badge={unreadCount > 0 ? String(unreadCount) : undefined}
                        badgeColor="bg-primary"
                    />
                    <CtrlBtn
                        active={sidePanel === 'people'}
                        onClick={() => openPanel('people')}
                        icon={<Users size={18} />}
                        label="People"
                    />

                    {/* Join Requests quick access button for teachers */}
                    {isTeacher && (
                        <CtrlBtn
                            active={sidePanel === 'requests'}
                            onClick={() => openPanel('requests')}
                            icon={<UserCheck size={18} />}
                            label="Requests"
                            badge={waitingRequests.length > 0 ? String(waitingRequests.length) : undefined}
                            badgeColor="bg-amber-500"
                        />
                    )}

                    <CtrlBtn
                        active={sidePanel === 'whiteboard'}
                        onClick={() => openPanel('whiteboard')}
                        icon={<PenLine size={18} />}
                        label="Board"
                    />
                    <CtrlBtn
                        active={sidePanel === 'poll'}
                        onClick={() => openPanel('poll')}
                        icon={<BarChart2 size={18} />}
                        label="Poll"
                    />
                </div>

                {/* Right control: Leave / End Class */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (confirm(isTeacher ? 'End live class for everyone?' : 'Leave this live class?')) {
                                const socket = getSocket()
                                if (socket && socket.connected) {
                                    socket.emit('leave_meeting', { meetingId: id })
                                }
                                router.push(isTeacher ? '/teacher/live-classes' : '/student/live-classes')
                            }
                        }}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md"
                    >
                        <PhoneOff size={15} />
                        <span>{isTeacher ? 'End Meeting' : 'Leave'}</span>
                    </button>
                </div>
            </div>

            {/* Device Settings Modal */}
            <DeviceSettingsModal
                isOpen={showDeviceSettings}
                onClose={() => setShowDeviceSettings(false)}
                devices={devices}
                selectedCameraId={selectedCameraId}
                selectedMicId={selectedMicId}
                onSelectCamera={switchCamera}
                onSelectMic={switchMic}
                onRefreshDevices={refreshDevices}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                localStream={localStream}
                audioLevel={audioLevel}
                onToggleCamera={toggleCamera}
                onToggleMic={toggleMic}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// SINGLE UNIFIED MEETING TILE (NO DUPLICATE TILES)
// ─────────────────────────────────────────────────────────────

interface MeetingTileProps {
    participant: MeetingParticipant
    isSelf: boolean
    localStream?: MediaStream | null
    isSpeaking?: boolean
    audioLevel?: number
    compact?: boolean
}

function MeetingTile({
    participant,
    isSelf,
    localStream,
    isSpeaking,
    audioLevel = 0,
    compact,
}: MeetingTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Attach local stream if self
    useEffect(() => {
        if (isSelf && videoRef.current && localStream) {
            videoRef.current.srcObject = localStream
        }
    }, [isSelf, localStream, participant.isCameraOn])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800/80 shadow-md group',
                participant.isTeacher ? 'border-indigo-500/50' : 'border-slate-800',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[220px]'
            )}
            style={{ backgroundColor: participant.color ? `${participant.color}10` : '#0f172a' }}
        >
            {/* Live Local Camera Video */}
            {isSelf && participant.isCameraOn && localStream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100 rounded-2xl"
                />
            ) : (
                /* Avatar / Initials View (when camera is off or remote) */
                <div className="flex flex-col items-center gap-2 p-3">
                    <div
                        className={cn(
                            'rounded-2xl flex items-center justify-center font-bold text-white shadow-lg',
                            compact ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-2xl',
                            participant.isTeacher ? 'bg-gradient-to-tr from-indigo-600 to-blue-600' : ''
                        )}
                        style={!participant.isTeacher ? { background: participant.color || '#6366f1' } : undefined}
                    >
                        {participant.initials}
                    </div>
                    {!compact && (
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-100">{participant.name}</p>
                            {participant.isTeacher ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold mt-1">
                                    <Shield size={10} /> Instructor (Host)
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
                                    Camera off
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Left Label: Name + Host badge + (You) */}
            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow-sm max-w-[85%]">
                <span className="truncate">{participant.name}</span>
                {participant.isTeacher && (
                    <span className="text-[9px] bg-yellow-500/25 text-yellow-400 border border-yellow-500/40 px-1 py-0.2 rounded font-semibold">
                        Host
                    </span>
                )}
                {isSelf && (
                    <span className="text-[10px] text-primary font-semibold">
                        (You)
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

            {/* Bottom Right Mic Indicator */}
            <div className="absolute bottom-2 right-2">
                <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shadow-xs',
                    participant.isMicOn ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
                )}>
                    {participant.isMicOn ? <Mic size={12} /> : <MicOff size={12} />}
                </div>
            </div>

            {/* Top Right Hand Raised Indicator */}
            {participant.isHandRaised && (
                <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    ✋ Raised
                </div>
            )}
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────
// SCREEN SHARE STAGE
// ─────────────────────────────────────────────────────────────

function ScreenShareStage({ screenStream, onStop }: { screenStream: MediaStream | null; onStop: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && screenStream) {
            videoRef.current.srcObject = screenStream
        }
    }, [screenStream])

    return (
        <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                    onClick={onStop}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-lg transition-all"
                >
                    <StopCircle size={14} /> Stop Sharing
                </button>
            </div>
        </div>
    )
}

// Control Bar Button
function CtrlBtn({
    active,
    danger,
    onClick,
    icon,
    label,
    badge,
    badgeColor = 'bg-primary',
}: {
    active?: boolean
    danger?: boolean
    onClick?: () => void
    icon: React.ReactNode
    label: string
    badge?: string
    badgeColor?: string
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'relative flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all',
                danger
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : active
                    ? 'bg-primary/20 text-blue-400 hover:bg-primary/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            )}
        >
            <div className="relative">
                {icon}
                {badge && (
                    <span className={cn(
                        'absolute -top-1.5 -right-2 text-[9px] text-white font-bold px-1 rounded-full min-w-3.5 h-3.5 flex items-center justify-center',
                        badgeColor
                    )}>
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium hidden md:inline">{label}</span>
        </button>
    )
}
