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
import {
    Room,
    RoomEvent,
    Participant,
    LocalParticipant,
    RemoteParticipant,
    Track,
    TrackPublication,
    VideoTrack,
    AudioTrack,
    RemoteAudioTrack,
    LocalVideoTrack,
    ParticipantEvent,
    ConnectionState,
} from 'livekit-client'
import { getLiveClassById, checkLiveClassAccess, getLiveKitToken } from '@/lib/api/live-classes'
import { useAuthStore } from '@/store/use-auth-store'
import { connectSocket, getSocket } from '@/lib/socket'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DeviceSettingsModal } from '@/components/live-class/device-settings-modal'

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
    const [messages, setMessages] = useState<MeetingChatMessage[]>([])
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    // ── LiveKit Real-time WebRTC States ───────────────────────────
    const [liveKitRoom, setLiveKitRoom] = useState<Room | null>(null)
    const [liveKitParticipants, setLiveKitParticipants] = useState<Participant[]>([])
    const [liveKitConnectionState, setLiveKitConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
    const [liveKitError, setLiveKitError] = useState<string | null>(null)
    const roomRef = useRef<Room | null>(null)
    const connectedMeetingIdRef = useRef<string | null>(null)

    // Independent Media Loading States (Prevents UI Freezing & Race Conditions)
    const [isCameraLoading, setIsCameraLoading] = useState(false)
    const [isMicLoading, setIsMicLoading] = useState(false)
    const [isScreenShareLoading, setIsScreenShareLoading] = useState(false)
    const cameraLockRef = useRef(false)
    const micLockRef = useRef(false)
    const screenShareLockRef = useRef(false)

    // Local Media Controls (Driven by LiveKit WebRTC)
    const [isCameraOn, setIsCameraOn] = useState(false)
    const [isMicOn, setIsMicOn] = useState(false)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [isHandRaised, setIsHandRaised] = useState(false)
    const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid')
    const [showDeviceSettings, setShowDeviceSettings] = useState(false)

    // Audio Autoplay Policy Fallback State
    const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false)
    const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())

    // Audio / Video Device Selection
    const [devices, setDevices] = useState<{ videoInputs: MediaDeviceInfo[]; audioInputs: MediaDeviceInfo[] }>({
        videoInputs: [],
        audioInputs: [],
    })
    const [selectedCameraId, setSelectedCameraId] = useState<string>('')
    const [selectedMicId, setSelectedMicId] = useState<string>('')

    // Panels
    const [sidePanel, setSidePanel] = useState<'chat' | 'people' | 'requests' | 'whiteboard' | 'poll' | null>(null)
    const [showReactions, setShowReactions] = useState(false)
    const [isRecording, setIsRecording] = useState(false)

    // Chat
    const [chatInput, setChatInput] = useState('')
    const [unreadCount, setUnreadCount] = useState(0)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Poll
    const [pollActive, setPollActive] = useState(false)
    const [pollVote, setPollVote] = useState<string | null>(null)
    const [pollOptions, setPollOptions] = useState(POLL_OPTIONS)

    // Whiteboard
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [penColor, setPenColor] = useState('#ffffff')
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    // Timer
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        const t = setInterval(() => setElapsed(e => e + 1), 1000)
        return () => clearInterval(t)
    }, [])

    // Enumerate Available Media Devices
    const refreshDevices = useCallback(async () => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return
        try {
            const all = await navigator.mediaDevices.enumerateDevices()
            setDevices({
                videoInputs: all.filter(d => d.kind === 'videoinput'),
                audioInputs: all.filter(d => d.kind === 'audioinput'),
            })
        } catch (err) {
            console.warn('[LiveKit] Device enumeration error:', err)
        }
    }, [])

    useEffect(() => {
        refreshDevices()
    }, [refreshDevices])

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

    // ── Socket.IO: Teacher Waiting Room & Admission Handshake ──────
    useEffect(() => {
        if (!id || isAuthorized !== true || !user) return

        const socket = connectSocket()

        // 1. Join Meeting / Request Entry
        socket.emit('join_meeting', {
            meetingId: id,
            isCameraOn,
            isMicOn,
            isHandRaised,
            token,
        })

        // 2. Meeting State Received from Socket
        const handleMeetingState = (data: {
            meetingId: string
            status?: 'admitted' | 'waiting'
            waitingRequests?: WaitingStudentRequest[]
        }) => {
            if (data.meetingId === id) {
                if (data.status === 'admitted') {
                    setAdmissionStatus('admitted')
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
        const handleJoinAdmitted = (data: { meetingId: string }) => {
            if (data.meetingId === id) {
                setAdmissionStatus('admitted')
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

        // 8. Real-time chat message received
        const handleChatMessage = (data: { meetingId: string; message: MeetingChatMessage }) => {
            if (data.meetingId === id && data.message) {
                setMessages(prev => [...prev, data.message])
            }
        }

        // 9. Reaction emoji received
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

    // ── Persistent Remote Audio Track Attachment & Playback Manager ────
    const attachRemoteAudioTrack = useCallback((
        track: RemoteAudioTrack,
        publication: TrackPublication | undefined,
        participant: Participant
    ) => {
        if (typeof document === 'undefined') return
        const trackSid = track.sid || publication?.trackSid || `${participant.identity}-audio`
        console.log(`[LiveKit] Subscribing remote audio track: ${trackSid} from participant: ${participant.identity} (${participant.name})`)

        let audioEl = remoteAudioElementsRef.current.get(trackSid)
        if (!audioEl) {
            audioEl = document.createElement('audio')
            audioEl.id = `remote-audio-${trackSid}`
            audioEl.autoplay = true
            // @ts-ignore
            audioEl.playsInline = true
            audioEl.muted = false
            audioEl.volume = 1.0

            let container = document.getElementById('livekit-remote-audio-container')
            if (!container) {
                container = document.createElement('div')
                container.id = 'livekit-remote-audio-container'
                container.setAttribute('aria-hidden', 'true')
                container.style.position = 'fixed'
                container.style.top = '-9999px'
                container.style.left = '-9999px'
                container.style.width = '1px'
                container.style.height = '1px'
                container.style.overflow = 'hidden'
                container.style.opacity = '0.01'
                container.style.pointerEvents = 'none'
                document.body.appendChild(container)
            }
            container.appendChild(audioEl)
            remoteAudioElementsRef.current.set(trackSid, audioEl)
        }

        // Attach LiveKit track to persistent DOM element
        track.attach(audioEl)
        console.log(`[LiveKit] Remote audio track ${trackSid} attached to DOM element successfully`)

        // Explicitly trigger playback and handle browser autoplay restrictions
        const playPromise = audioEl.play()
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`[LiveKit] Remote audio playback active for participant: ${participant.identity}`)
                    setNeedsAudioUnlock(false)
                })
                .catch((playErr: any) => {
                    console.warn(`[LiveKit] Remote audio play() blocked for ${participant.identity}:`, playErr?.name, playErr?.message)
                    if (playErr?.name === 'NotAllowedError') {
                        setNeedsAudioUnlock(true)
                    }
                })
        }
    }, [])

    const detachRemoteAudioTrack = useCallback((
        track: RemoteAudioTrack | Track,
        publication: TrackPublication | undefined,
        participant: Participant
    ) => {
        const trackSid = track.sid || publication?.trackSid || `${participant.identity}-audio`
        console.log(`[LiveKit] Detaching remote audio track ${trackSid} for participant ${participant.identity}`)
        const audioEl = remoteAudioElementsRef.current.get(trackSid)
        if (audioEl) {
            track.detach(audioEl)
            audioEl.pause()
            audioEl.srcObject = null
            audioEl.remove()
            remoteAudioElementsRef.current.delete(trackSid)
            console.log(`[LiveKit] Remote audio element ${trackSid} removed cleanly`)
        }
    }, [])

    // User gesture unlock for audio (when browser autoplay policy blocks WebRTC audio)
    const handleUnlockAudio = useCallback(async () => {
        console.log('[LiveKit] User triggered audio playback unlock')
        if (roomRef.current) {
            try {
                await roomRef.current.startAudio()
                console.log('[LiveKit] room.startAudio() succeeded')
            } catch (err) {
                console.warn('[LiveKit] room.startAudio() error:', err)
            }
        }
        remoteAudioElementsRef.current.forEach((audioEl, sid) => {
            audioEl.play().then(() => {
                console.log(`[LiveKit] Audio element ${sid} resumed successfully`)
            }).catch(err => {
                console.warn(`[LiveKit] Audio element ${sid} resume retry notice:`, err)
            })
        })
        setNeedsAudioUnlock(false)
        toast.success('Audio playback enabled 🔊')
    }, [])

    // Auto-unlock on any user interaction if audio was blocked
    useEffect(() => {
        if (!needsAudioUnlock) return
        const onGlobalClick = () => {
            handleUnlockAudio()
        }
        window.addEventListener('click', onGlobalClick, { once: true })
        return () => {
            window.removeEventListener('click', onGlobalClick)
        }
    }, [needsAudioUnlock, handleUnlockAudio])

    // ── LiveKit Real WebRTC Room Connection ───────────────────────
    useEffect(() => {
        if (isAuthorized !== true || admissionStatus !== 'admitted' || !id || !user) {
            return
        }

        // Prevent duplicate connection attempts to the same meeting
        if (connectedMeetingIdRef.current === id && roomRef.current) {
            return
        }

        let isCancelled = false
        connectedMeetingIdRef.current = id

        const connectToLiveKit = async () => {
            setLiveKitConnectionState('connecting')
            setLiveKitError(null)

            try {
                console.log(`[LiveKit] Fetching token for live class: ${id}`)
                // 1. Fetch secure access token from backend
                const tokenRes = await getLiveKitToken(id, token)

                if (isCancelled) return

                if (!tokenRes.success || !tokenRes.token) {
                    if (tokenRes.admitted === false) {
                        setAdmissionStatus('waiting')
                        setLiveKitConnectionState('idle')
                        connectedMeetingIdRef.current = null
                        return
                    }
                    throw new Error(tokenRes.message || 'Failed to acquire LiveKit meeting token')
                }

                const wsUrl = tokenRes.serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || ''
                if (!wsUrl) {
                    throw new Error('LiveKit WebSocket URL is missing in frontend configuration (NEXT_PUBLIC_LIVEKIT_URL)')
                }

                console.log(`[LiveKit] Connecting to server at: ${wsUrl}`)

                // 2. Instantiate real LiveKit Room
                const room = new Room({
                    adaptiveStream: true,
                    dynacast: true,
                })

                roomRef.current = room

                // Participant state synchronizer (local + real connected remotes only)
                const syncParticipants = () => {
                    if (!roomRef.current) return
                    const local = roomRef.current.localParticipant
                    const remotes = Array.from(roomRef.current.remoteParticipants.values())
                    setLiveKitParticipants([local, ...remotes])
                }

                room.on(RoomEvent.Connected, () => {
                    console.log(`[LiveKit] Room connected successfully to meeting: ${id}`)
                    setLiveKitConnectionState('connected')
                    syncParticipants()
                })

                room.on(RoomEvent.Reconnecting, () => {
                    console.log('[LiveKit] Room reconnecting...')
                    setLiveKitConnectionState('connecting')
                })

                room.on(RoomEvent.Reconnected, () => {
                    console.log('[LiveKit] Room reconnected')
                    setLiveKitConnectionState('connected')
                    syncParticipants()
                })

                room.on(RoomEvent.Disconnected, (reason) => {
                    console.log('[LiveKit] Room disconnected:', reason)
                    setLiveKitConnectionState('idle')
                    setLiveKitParticipants([])
                })

                room.on(RoomEvent.ParticipantConnected, (p) => {
                    console.log(`[LiveKit] Remote participant connected: ${p.identity} (${p.name})`)
                    syncParticipants()
                    toast.info(`${p.name || 'A participant'} connected`)
                })

                room.on(RoomEvent.ParticipantDisconnected, (p) => {
                    console.log(`[LiveKit] Remote participant disconnected: ${p.identity}`)
                    // Clean up audio elements for this participant
                    remoteAudioElementsRef.current.forEach((audioEl, trackSid) => {
                        if (trackSid.includes(p.identity)) {
                            audioEl.pause()
                            audioEl.srcObject = null
                            audioEl.remove()
                            remoteAudioElementsRef.current.delete(trackSid)
                            console.log(`[LiveKit] Removed audio element for disconnected participant: ${p.identity}`)
                        }
                    })
                    syncParticipants()
                    toast(`${p.name || 'A participant'} left the meeting`, { duration: 2000 })
                })

                // ── WebRTC Audio & Video Track Subscriptions ──
                room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    console.log(`[LiveKit] TrackSubscribed event: kind=${track.kind}, sid=${track.sid}, from=${participant.identity}`)
                    if (track.kind === Track.Kind.Audio) {
                        attachRemoteAudioTrack(track as RemoteAudioTrack, publication, participant)
                    }
                    syncParticipants()
                })

                room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                    console.log(`[LiveKit] TrackUnsubscribed event: kind=${track.kind}, sid=${track.sid}, from=${participant.identity}`)
                    if (track.kind === Track.Kind.Audio) {
                        detachRemoteAudioTrack(track, publication, participant)
                    }
                    syncParticipants()
                })

                room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
                    console.log('[LiveKit] AudioPlaybackStatusChanged. canPlaybackAudio:', room.canPlaybackAudio)
                    setNeedsAudioUnlock(!room.canPlaybackAudio)
                })

                room.on(RoomEvent.TrackPublished, () => syncParticipants())
                room.on(RoomEvent.TrackUnpublished, () => syncParticipants())
                room.on(RoomEvent.TrackMuted, () => syncParticipants())
                room.on(RoomEvent.TrackUnmuted, () => syncParticipants())
                room.on(RoomEvent.LocalTrackPublished, (pub) => {
                    console.log(`[LiveKit] Local track published: source=${pub.source}`)
                    syncParticipants()
                })
                room.on(RoomEvent.LocalTrackUnpublished, (pub) => {
                    console.log(`[LiveKit] Local track unpublished: source=${pub.source}`)
                    syncParticipants()
                })
                room.on(RoomEvent.ActiveSpeakersChanged, () => syncParticipants())

                // 3. Connect to the LiveKit server
                await room.connect(wsUrl, tokenRes.token)

                if (isCancelled) {
                    room.disconnect()
                    return
                }

                setLiveKitRoom(room)
                syncParticipants()

                // 4. Attach any remote audio tracks that were already published before/during connect
                room.remoteParticipants.forEach((p) => {
                    p.audioTrackPublications.forEach((pub) => {
                        if (pub.track && pub.isSubscribed) {
                            console.log(`[LiveKit] Attaching pre-existing remote audio track for ${p.identity}`)
                            attachRemoteAudioTrack(pub.track as RemoteAudioTrack, pub, p)
                        }
                    })
                })

                // Check initial audio playback status
                if (!room.canPlaybackAudio) {
                    console.log('[LiveKit] Initial audio playback requires user interaction')
                    setNeedsAudioUnlock(true)
                }

            } catch (err: any) {
                if (isCancelled) return
                console.error('[LiveKit] Connection error:', err)
                setLiveKitConnectionState('error')
                connectedMeetingIdRef.current = null
                setLiveKitError(err.message || 'Unable to establish realtime WebRTC connection')
                toast.error('Realtime Media: ' + (err.message || 'Connection failed'))
            }
        }

        connectToLiveKit()

        return () => {
            isCancelled = true
            connectedMeetingIdRef.current = null
            if (roomRef.current) {
                try {
                    roomRef.current.disconnect()
                } catch (e) {
                    console.warn('[LiveKit] Cleanup disconnect notice:', e)
                }
                roomRef.current = null
            }
            // Clean up all remote audio elements
            remoteAudioElementsRef.current.forEach((audioEl) => {
                audioEl.pause()
                audioEl.srcObject = null
                audioEl.remove()
            })
            remoteAudioElementsRef.current.clear()

            setLiveKitRoom(null)
            setLiveKitParticipants([])
        }
    }, [isAuthorized, admissionStatus, id, token, attachRemoteAudioTrack, detachRemoteAudioTrack])

    // ── Non-Blocking Real Camera, Mic, and Screen Share Controls ──

    // Camera Toggle: Non-blocking, independent loading, safe media error categorization
    const handleToggleCamera = useCallback(() => {
        if (cameraLockRef.current) {
            console.log('[LiveKit] Camera toggle in progress, ignoring extra click')
            return
        }

        const room = roomRef.current
        if (!room || room.state !== ConnectionState.Connected) {
            toast.info('Connecting to meeting room, please wait a moment...')
            return
        }

        cameraLockRef.current = true
        setIsCameraLoading(true)

        ;(async () => {
            try {
                const currentStatus = room.localParticipant.isCameraEnabled
                const targetState = !currentStatus

                console.log(`[LiveKit] Toggling camera to: ${targetState}`)

                // 10-second timeout safeguard so user is never permanently stuck if browser prompt hangs
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Camera operation timed out. Please check browser permissions.')), 10000)
                )

                await Promise.race([
                    room.localParticipant.setCameraEnabled(
                        targetState,
                        selectedCameraId ? { deviceId: selectedCameraId } : undefined
                    ),
                    timeoutPromise,
                ])

                const finalCameraState = room.localParticipant.isCameraEnabled
                setIsCameraOn(finalCameraState)
                console.log(`[LiveKit] Local camera is now: ${finalCameraState ? 'ENABLED' : 'DISABLED'}`)

                const socket = getSocket()
                if (socket && socket.connected) {
                    socket.emit('meeting_media_toggle', { meetingId: id, isCameraOn: finalCameraState })
                }

                if (finalCameraState) {
                    toast.success('Camera turned ON')
                } else {
                    toast.info('Camera turned OFF')
                }
            } catch (err: any) {
                console.error('[LiveKit] Camera toggle error:', err)
                const errName = err?.name || ''
                const errMsg = err?.message || ''

                if (errName === 'NotAllowedError' || errMsg.includes('Permission denied') || errMsg.includes('permission')) {
                    toast.error('Camera permission was denied. Please allow camera access in your browser address bar.')
                } else if (errName === 'NotFoundError' || errMsg.includes('not found')) {
                    toast.error('No camera found on this device.')
                } else if (errName === 'NotReadableError' || errMsg.includes('in use') || errMsg.includes('could not start')) {
                    toast.error('Camera is currently in use by another application or browser tab.')
                } else if (errName === 'AbortError') {
                    toast.error('Camera access request was interrupted.')
                } else {
                    toast.error(`Camera error: ${errMsg || 'Unable to access video device'}`)
                }

                // Synchronize React state with actual room publication state
                if (roomRef.current?.localParticipant) {
                    setIsCameraOn(roomRef.current.localParticipant.isCameraEnabled)
                }
            } finally {
                cameraLockRef.current = false
                setIsCameraLoading(false)
            }
        })()
    }, [id, selectedCameraId])

    // Microphone Toggle: Non-blocking, independent loading, safe media error categorization
    const handleToggleMic = useCallback(() => {
        if (micLockRef.current) {
            console.log('[LiveKit] Microphone toggle in progress, ignoring extra click')
            return
        }

        const room = roomRef.current
        if (!room || room.state !== ConnectionState.Connected) {
            toast.info('Connecting to meeting room, please wait a moment...')
            return
        }

        micLockRef.current = true
        setIsMicLoading(true)

        ;(async () => {
            try {
                const currentStatus = room.localParticipant.isMicrophoneEnabled
                const targetState = !currentStatus

                console.log(`[LiveKit] Toggling microphone to: ${targetState}`)

                // 10-second timeout safeguard so user is never permanently stuck if browser prompt hangs
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Microphone operation timed out. Please check browser permissions.')), 10000)
                )

                await Promise.race([
                    room.localParticipant.setMicrophoneEnabled(
                        targetState,
                        selectedMicId ? { deviceId: selectedMicId } : undefined
                    ),
                    timeoutPromise,
                ])

                const finalMicState = room.localParticipant.isMicrophoneEnabled
                setIsMicOn(finalMicState)
                console.log(`[LiveKit] Local microphone is now: ${finalMicState ? 'UNMUTED' : 'MUTED'}`)

                const socket = getSocket()
                if (socket && socket.connected) {
                    socket.emit('meeting_media_toggle', { meetingId: id, isMicOn: finalMicState })
                }

                if (finalMicState) {
                    toast.success('Microphone UNMUTED')
                } else {
                    toast.info('Microphone MUTED')
                }
            } catch (err: any) {
                console.error('[LiveKit] Microphone toggle error:', err)
                const errName = err?.name || ''
                const errMsg = err?.message || ''

                if (errName === 'NotAllowedError' || errMsg.includes('Permission denied') || errMsg.includes('permission')) {
                    toast.error('Microphone permission was denied. Please allow microphone access in your browser address bar.')
                } else if (errName === 'NotFoundError' || errMsg.includes('not found')) {
                    toast.error('No microphone found on this device.')
                } else if (errName === 'NotReadableError' || errMsg.includes('in use') || errMsg.includes('could not start')) {
                    toast.error('Microphone is in use by another application.')
                } else if (errName === 'AbortError') {
                    toast.error('Microphone access request was interrupted.')
                } else {
                    toast.error(`Microphone error: ${errMsg || 'Unable to access audio device'}`)
                }

                // Synchronize React state with actual room publication state
                if (roomRef.current?.localParticipant) {
                    setIsMicOn(roomRef.current.localParticipant.isMicrophoneEnabled)
                }
            } finally {
                micLockRef.current = false
                setIsMicLoading(false)
            }
        })()
    }, [id, selectedMicId])

    // Screen Share Toggle: Non-blocking, independent loading
    const handleToggleScreenShare = useCallback(() => {
        if (screenShareLockRef.current) return
        const room = roomRef.current
        if (!room || room.state !== ConnectionState.Connected) {
            toast.info('Connecting to meeting room, please wait a moment...')
            return
        }

        screenShareLockRef.current = true
        setIsScreenShareLoading(true)

        ;(async () => {
            try {
                const targetState = !isScreenSharing
                await room.localParticipant.setScreenShareEnabled(targetState)
                setIsScreenSharing(room.localParticipant.isScreenShareEnabled)
                if (targetState) {
                    toast.success('Screen share started')
                } else {
                    toast.info('Screen share stopped')
                }
            } catch (err: any) {
                console.error('[LiveKit] Screen share toggle error:', err)
                toast.error('Screen share notice: ' + (err.message || 'Permission denied or stopped'))
            } finally {
                screenShareLockRef.current = false
                setIsScreenShareLoading(false)
            }
        })()
    }, [isScreenSharing])

    const handleToggleHand = () => {
        const nextState = !isHandRaised
        setIsHandRaised(nextState)
        toast(nextState ? '✋ Hand raised!' : 'Hand lowered')
        const socket = getSocket()
        if (socket && socket.connected) {
            socket.emit('meeting_media_toggle', { meetingId: id, isHandRaised: nextState })
        }
    }

    // Switch camera / mic device
    const handleSelectCamera = async (deviceId: string) => {
        setSelectedCameraId(deviceId)
        if (roomRef.current) {
            try {
                await roomRef.current.switchActiveDevice('videoinput', deviceId)
                console.log('[LiveKit] Switched camera active device to:', deviceId)
            } catch (err: any) {
                console.warn('[LiveKit] Switch camera error:', err)
            }
        }
    }

    const handleSelectMic = async (deviceId: string) => {
        setSelectedMicId(deviceId)
        if (roomRef.current) {
            try {
                await roomRef.current.switchActiveDevice('audioinput', deviceId)
                console.log('[LiveKit] Switched mic active device to:', deviceId)
            } catch (err: any) {
                console.warn('[LiveKit] Switch mic error:', err)
            }
        }
    }

    // ── Leave Meeting Cleanly ─────────────────────────────────────
    const handleLeaveMeeting = async () => {
        if (confirm(isTeacher ? 'End live class for everyone?' : 'Leave this live class?')) {
            if (roomRef.current) {
                try {
                    await roomRef.current.disconnect()
                } catch (e) {
                    console.warn('[LiveKit] Leave disconnect notice:', e)
                }
                roomRef.current = null
            }
            const socket = getSocket()
            if (socket && socket.connected) {
                socket.emit('leave_meeting', { meetingId: id })
            }
            router.push(isTeacher ? '/teacher/live-classes' : '/student/live-classes')
        }
    }

    // ── Screen Share Detection ────────────────────────────────────
    const activeScreenShare = useMemo(() => {
        for (const p of liveKitParticipants) {
            const pub = p.getTrackPublication(Track.Source.ScreenShare)
            if (pub && pub.track && !pub.isMuted) {
                return {
                    participant: p,
                    track: pub.track as VideoTrack,
                    isSelf: p.identity === currentUserId || p instanceof LocalParticipant,
                }
            }
        }
        return null
    }, [liveKitParticipants, currentUserId])

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
    // SINGLE UNIFIED PARTICIPANT LIST FROM LIVEKIT (NO DUMMIES EVER!)
    // ─────────────────────────────────────────────────────────────
    const displayParticipants = useMemo(() => {
        return liveKitParticipants.map(p => {
            const uid = p.identity || 'user'
            const isSelf = uid === currentUserId || p instanceof LocalParticipant
            const name = p.name || (isSelf ? user?.name || 'You' : 'Participant')
            const initials = (name.trim().split(/\s+/).map(part => part[0]).join('') || 'U').slice(0, 2).toUpperCase()

            let isTeacherTile = false
            try {
                if (p.metadata) {
                    const meta = JSON.parse(p.metadata)
                    isTeacherTile = !!(meta.isTeacher || meta.role === 'TEACHER' || meta.role === 'ADMIN')
                }
            } catch {}
            if (!isTeacherTile && isSelf && isTeacher) isTeacherTile = true
            if (!isTeacherTile && (uid === liveClass.instructor?._id?.toString() || uid === liveClass.instructor?.id?.toString())) {
                isTeacherTile = true
            }

            const camPub = p.getTrackPublication(Track.Source.Camera)
            const camOn = p.isCameraEnabled && !!camPub && !camPub.isMuted && !!camPub.track

            const micPub = p.getTrackPublication(Track.Source.Microphone)
            const micOn = p.isMicrophoneEnabled && !!micPub && !micPub.isMuted

            return {
                id: uid,
                userId: uid,
                name,
                isTeacher: isTeacherTile,
                isCameraOn: camOn,
                isMicOn: micOn,
                isSpeaking: p.isSpeaking,
                initials,
                color: '#6366f1',
                isSelf,
                rawParticipant: p,
            }
        })
    }, [liveKitParticipants, currentUserId, user, isTeacher, liveClass])

    const realParticipantCount = displayParticipants.length || (admissionStatus === 'admitted' ? 1 : 0)

    // Local camera track for settings modal preview
    const localMediaStream = useMemo(() => {
        const localPub = roomRef.current?.localParticipant?.getTrackPublication(Track.Source.Camera)
        const localTrack = localPub?.track as LocalVideoTrack | undefined
        return localTrack?.mediaStream || null
    }, [isCameraOn, liveKitParticipants])

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

            {/* ── Audio Autoplay Unlock Prompt Banner (Non-blocking) ── */}
            <AnimatePresence>
                {needsAudioUnlock && (
                    <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        onClick={handleUnlockAudio}
                        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600/95 hover:bg-indigo-500 border border-indigo-400/50 shadow-2xl rounded-2xl px-5 py-2.5 flex items-center gap-3 backdrop-blur-md cursor-pointer transition-all"
                    >
                        <Volume2 size={18} className="text-white animate-bounce" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-white">Audio Playback Blocked by Browser</p>
                            <p className="text-[11px] text-indigo-100">Click anywhere to enable meeting audio and hear participants 🔊</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleUnlockAudio() }}
                            className="bg-white text-indigo-700 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors ml-2"
                        >
                            Enable Audio
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* ── LiveKit Connection Error Alert ──────────────────── */}
            {liveKitConnectionState === 'error' && (
                <div className="bg-red-600/90 text-white text-xs px-4 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={15} />
                        <span>LiveKit Media Status: {liveKitError || 'Failed to establish WebRTC connection'}.</span>
                    </div>
                    <button
                        onClick={() => {
                            connectedMeetingIdRef.current = null
                            setAdmissionStatus('admitted')
                        }}
                        className="bg-white text-red-700 px-2.5 py-0.5 rounded-md font-semibold text-[11px] hover:bg-slate-100"
                    >
                        Retry
                    </button>
                </div>
            )}

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
                    {/* LiveKit Connection Status Indicator */}
                    {liveKitConnectionState === 'connecting' && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            <RefreshCw size={11} className="animate-spin" /> Connecting WebRTC...
                        </div>
                    )}

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
                            onClick={handleToggleScreenShare}
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
                {activeScreenShare ? (
                    <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
                        <ScreenShareStage
                            track={activeScreenShare.track}
                            isSelf={activeScreenShare.isSelf}
                            onStop={handleToggleScreenShare}
                        />
                        <div className="w-full md:w-64 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto flex-shrink-0">
                            {displayParticipants.map((p) => (
                                <MeetingTile
                                    key={p.userId}
                                    participant={p.rawParticipant}
                                    isSelf={p.isSelf}
                                    isTeacherTile={p.isTeacher}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── UNIFIED VIDEO GRID: EXACTLY 1 TILE PER REAL USER (NO DUMMIES, NO DUPLICATES) ── */
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
                        {displayParticipants.map((p) => (
                            <MeetingTile
                                key={p.userId}
                                participant={p.rawParticipant}
                                isSelf={p.isSelf}
                                isTeacherTile={p.isTeacher}
                            />
                        ))}

                        {/* Teacher alone waiting for students to request join */}
                        {isTeacher && displayParticipants.length <= 1 && (
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
                                <div className="flex-1 flex flex-col p-3 gap-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            {['#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setPenColor(c)}
                                                    className={cn('w-5 h-5 rounded-full transition-transform', penColor === c && 'scale-125 ring-2 ring-white')}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <button onClick={clearCanvas} className="text-slate-400 hover:text-white text-xs">
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
                                        <canvas
                                            ref={canvasRef}
                                            width={300}
                                            height={400}
                                            onMouseDown={startDraw}
                                            onMouseMove={draw}
                                            onMouseUp={stopDraw}
                                            onMouseLeave={stopDraw}
                                            className="w-full h-full cursor-crosshair"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Poll Panel ── */}
                            {sidePanel === 'poll' && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                                        <p className="text-xs font-semibold text-slate-100">Live Quick Poll</p>
                                        <p className="text-xs text-slate-300 mt-1">Which rendering pattern do you prefer in Next.js?</p>
                                    </div>
                                    <div className="space-y-2">
                                        {pollOptions.map(opt => {
                                            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleVote(opt.id)}
                                                    disabled={!!pollVote}
                                                    className={cn(
                                                        'w-full text-left p-2.5 rounded-xl border text-xs transition-all relative overflow-hidden',
                                                        pollVote === opt.id
                                                            ? 'border-primary bg-primary/10 text-white'
                                                            : 'border-slate-800 bg-slate-850 hover:border-slate-700 text-slate-300'
                                                    )}
                                                >
                                                    <div
                                                        className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                    <div className="relative flex justify-between items-center">
                                                        <span className="font-medium">{opt.text}</span>
                                                        <span className="text-slate-400 font-mono text-[11px]">{pct}% ({opt.votes})</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {pollVote && (
                                        <p className="text-center text-[11px] text-emerald-400 font-medium">
                                            ✓ Your vote has been recorded
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Reaction Picker Floating Popover ─────────────────── */}
            <AnimatePresence>
                {showReactions && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-2 flex gap-1 z-30"
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

            {/* ── Bottom Control Bar (Non-blocking, independent media states) ── */}
            <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0 backdrop-blur-md">
                {/* Left controls: Mic, Camera, Device Settings */}
                <div className="flex items-center gap-2">
                    <CtrlBtn
                        active={isMicOn}
                        danger={!isMicOn}
                        loading={isMicLoading}
                        onClick={handleToggleMic}
                        icon={!isMicOn ? <MicOff size={18} /> : <Mic size={18} />}
                        label={!isMicOn ? 'Unmute' : 'Mute'}
                    />
                    <CtrlBtn
                        active={isCameraOn}
                        loading={isCameraLoading}
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
                        loading={isScreenShareLoading}
                        onClick={handleToggleScreenShare}
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
                        onClick={handleLeaveMeeting}
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
                onSelectCamera={handleSelectCamera}
                onSelectMic={handleSelectMic}
                onRefreshDevices={refreshDevices}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                localStream={localMediaStream}
                audioLevel={0}
                onToggleCamera={handleToggleCamera}
                onToggleMic={handleToggleMic}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// REAL LIVEKIT WEBRTC PARTICIPANT TILE
// ─────────────────────────────────────────────────────────────

interface MeetingTileProps {
    participant: Participant
    isSelf: boolean
    isTeacherTile: boolean
    compact?: boolean
}

function MeetingTile({
    participant,
    isSelf,
    isTeacherTile,
    compact,
}: MeetingTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    const [hasVideo, setHasVideo] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [isSpeaking, setIsSpeaking] = useState(false)

    // Sync tile track indicators with LiveKit participant track publication events
    useEffect(() => {
        const updateTrackStates = () => {
            const camPub = participant.getTrackPublication(Track.Source.Camera)
            const videoAvailable = Boolean(camPub && !camPub.isMuted && camPub.track)
            setHasVideo(videoAvailable)

            const micPub = participant.getTrackPublication(Track.Source.Microphone)
            setIsMuted(!micPub || micPub.isMuted)

            setIsSpeaking(participant.isSpeaking)
        }

        updateTrackStates()

        participant.on(ParticipantEvent.TrackPublished, updateTrackStates)
        participant.on(ParticipantEvent.TrackSubscribed, updateTrackStates)
        participant.on(ParticipantEvent.TrackUnsubscribed, updateTrackStates)
        participant.on(ParticipantEvent.TrackMuted, updateTrackStates)
        participant.on(ParticipantEvent.TrackUnmuted, updateTrackStates)
        participant.on(ParticipantEvent.LocalTrackPublished, updateTrackStates)
        participant.on(ParticipantEvent.LocalTrackUnpublished, updateTrackStates)
        participant.on(ParticipantEvent.IsSpeakingChanged, (sp) => setIsSpeaking(sp))

        return () => {
            participant.off(ParticipantEvent.TrackPublished, updateTrackStates)
            participant.off(ParticipantEvent.TrackSubscribed, updateTrackStates)
            participant.off(ParticipantEvent.TrackUnsubscribed, updateTrackStates)
            participant.off(ParticipantEvent.TrackMuted, updateTrackStates)
            participant.off(ParticipantEvent.TrackUnmuted, updateTrackStates)
            participant.off(ParticipantEvent.LocalTrackPublished, updateTrackStates)
            participant.off(ParticipantEvent.LocalTrackUnpublished, updateTrackStates)
        }
    }, [participant])

    // Attach Real Video Track to <video> element
    useEffect(() => {
        const el = videoRef.current
        const camPub = participant.getTrackPublication(Track.Source.Camera)
        const track = camPub?.track as VideoTrack | undefined

        if (el && track && hasVideo) {
            track.attach(el)
            return () => {
                track.detach(el)
            }
        }
    }, [participant, hasVideo])

    const name = participant.name || (isSelf ? 'You' : 'Participant')
    const initials = (name.trim().split(/\s+/).map(p => p[0]).join('') || 'U').slice(0, 2).toUpperCase()

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border shadow-md group',
                isTeacherTile ? 'border-indigo-500/50' : 'border-slate-800',
                isSpeaking && 'ring-2 ring-emerald-500/80',
                compact ? 'w-full md:w-auto h-32' : 'min-h-[220px]'
            )}
            style={{ backgroundColor: '#0f172a' }}
        >
            {/* Live Real WebRTC Camera Video (Remote or Local) */}
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isSelf}
                    className={cn(
                        'w-full h-full object-cover rounded-2xl',
                        isSelf && '-scale-x-100'
                    )}
                />
            ) : (
                /* Avatar / Initials View (when camera is off) */
                <div className="flex flex-col items-center gap-2 p-3">
                    <div
                        className={cn(
                            'rounded-2xl flex items-center justify-center font-bold text-white shadow-lg',
                            compact ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-2xl',
                            isTeacherTile
                                ? 'bg-gradient-to-tr from-indigo-600 to-blue-600'
                                : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                        )}
                    >
                        {initials}
                    </div>
                    {!compact && (
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-100">{name}</p>
                            {isTeacherTile ? (
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
                <span className="truncate">{name}</span>
                {isTeacherTile && (
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
                    !isMuted ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
                )}>
                    {!isMuted ? <Mic size={12} /> : <MicOff size={12} />}
                </div>
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────
// REAL LIVEKIT SCREEN SHARE STAGE
// ─────────────────────────────────────────────────────────────

function ScreenShareStage({
    track,
    isSelf,
    onStop,
}: {
    track: VideoTrack | null
    isSelf: boolean
    onStop: () => void
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const el = videoRef.current
        if (el && track) {
            track.attach(el)
            return () => {
                track.detach(el)
            }
        }
    }, [track])

    return (
        <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center min-h-[300px]">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
            />
            {isSelf && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                        onClick={onStop}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-lg transition-all"
                    >
                        <StopCircle size={14} /> Stop Sharing
                    </button>
                </div>
            )}
        </div>
    )
}

// Control Bar Button with independent loading and disabled states
function CtrlBtn({
    active,
    danger,
    onClick,
    icon,
    label,
    badge,
    badgeColor = 'bg-primary',
    loading = false,
    disabled = false,
}: {
    active?: boolean
    danger?: boolean
    onClick?: () => void
    icon: React.ReactNode
    label: string
    badge?: string
    badgeColor?: string
    loading?: boolean
    disabled?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                'relative flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all',
                danger
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : active
                    ? 'bg-primary/20 text-blue-400 hover:bg-primary/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
                (disabled || loading) && 'opacity-70 cursor-not-allowed'
            )}
        >
            <div className="relative">
                {loading ? <RefreshCw size={18} className="animate-spin text-amber-400" /> : icon}
                {badge && !loading && (
                    <span className={cn(
                        'absolute -top-1.5 -right-2 text-[9px] text-white font-bold px-1 rounded-full min-w-3.5 h-3.5 flex items-center justify-center',
                        badgeColor
                    )}>
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium hidden md:inline">
                {loading ? 'Connecting...' : label}
            </span>
        </button>
    )
}
