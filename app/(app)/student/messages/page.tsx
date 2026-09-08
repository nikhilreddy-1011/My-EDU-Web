'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
    Send, MessageSquare, Search, BookOpen, User, 
    Check, CheckCheck, Clock, AlertCircle, ArrowLeft,
    Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { 
    getConversations, getMessages, sendMessage, 
    startConversation, markConversationAsRead,
    Conversation, ChatMessage 
} from '@/lib/api/chat'
import { connectSocket, getSocket } from '@/lib/socket'
import { cn, getInitials } from '@/lib/utils'

function MessagesContent() {
    const searchParams = useSearchParams()
    const courseIdParam = searchParams.get('courseId')
    const { user, isAuthenticated } = useAuthStore()

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [authError, setAuthError] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Connect socket on mount
    useEffect(() => {
        if (!isAuthenticated) return
        const socket = connectSocket()

        return () => {
            // Keep socket alive or cleanup listeners
        }
    }, [isAuthenticated])

    // Load initial conversations list
    useEffect(() => {
        let isMounted = true

        const fetchConversations = async () => {
            setIsLoading(true)
            try {
                const res = await getConversations()
                if (isMounted && res.success) {
                    setConversations(res.conversations || [])

                    // If a courseId was passed in query, try starting or selecting it
                    if (courseIdParam) {
                        try {
                            const startRes = await startConversation(courseIdParam)
                            if (startRes.success && startRes.conversation) {
                                const newConv = startRes.conversation
                                // Add to list if not already there
                                setConversations(prev => {
                                    const exists = prev.find(c => c._id === newConv._id)
                                    return exists ? prev : [newConv, ...prev]
                                })
                                setSelectedConv(newConv)
                            }
                        } catch (err: any) {
                            setAuthError(err.message || 'You can only message teachers of courses you are enrolled in.')
                        }
                    } else if (res.conversations?.length > 0 && !selectedConv) {
                        // Default to first conversation
                        setSelectedConv(res.conversations[0])
                    }
                }
            } catch (err) {
                console.error('Failed to fetch conversations:', err)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchConversations()
        }

        return () => {
            isMounted = false
        }
    }, [isAuthenticated, courseIdParam])

    // Load messages when selectedConv changes
    useEffect(() => {
        if (!selectedConv) return

        let isMounted = true

        const loadMessages = async () => {
            try {
                const res = await getMessages(selectedConv._id)
                if (isMounted && res.success) {
                    setMessages(res.messages || [])
                    scrollToBottom()
                    // Mark read
                    markConversationAsRead(selectedConv._id).catch(() => {})
                }
            } catch (err) {
                console.error('Failed to load messages:', err)
            }
        }

        loadMessages()

        // Setup socket room and listener
        const socket = getSocket()
        socket.emit('join_conversation', selectedConv._id)

        const handleNewMessage = (msg: ChatMessage) => {
            if (msg.conversation === selectedConv._id) {
                setMessages(prev => [...prev, msg])
                scrollToBottom()
                markConversationAsRead(selectedConv._id).catch(() => {})
            }
        }

        socket.on('receive_message', handleNewMessage)

        return () => {
            socket.emit('leave_conversation', selectedConv._id)
            socket.off('receive_message', handleNewMessage)
            isMounted = false
        }
    }, [selectedConv?._id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!inputMessage.trim() || !selectedConv || isSending) return

        const content = inputMessage.trim()
        setInputMessage('')
        setIsSending(true)

        try {
            const res = await sendMessage(selectedConv._id, content)
            if (res.success && res.message) {
                setMessages(prev => [...prev, res.message])
                scrollToBottom()

                // Update conversations list preview
                setConversations(prev => prev.map(c => {
                    if (c._id === selectedConv._id) {
                        return {
                            ...c,
                            lastMessage: content,
                            lastMessageAt: new Date().toISOString(),
                        }
                    }
                    return c
                }))
            }
        } catch (err: any) {
            console.error('Failed to send message:', err)
            alert(err.message || 'Failed to send message')
        } finally {
            setIsSending(false)
        }
    }

    const filteredConversations = conversations.filter(c => {
        const otherUser = user?.role === 'TEACHER' ? c.student?.name : c.teacher?.name
        const courseTitle = c.course?.title || ''
        const q = searchQuery.toLowerCase()
        return (otherUser?.toLowerCase().includes(q)) || (courseTitle.toLowerCase().includes(q))
    })

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col font-sans">
                {/* Header */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sora flex items-center gap-2.5">
                            <MessageSquare className="text-primary" size={28} />
                            Messages & Support
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Direct course Q&A and 1-on-1 guidance with your instructors.
                        </p>
                    </div>
                </div>

                {authError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                        <span>{authError}</span>
                        <button 
                            onClick={() => setAuthError(null)} 
                            className="ml-auto font-semibold hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Main Card */}
                <div className="flex-1 min-h-0 bg-white/80 dark:bg-[#121422]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden flex shadow-xs">
                    {/* Left Sidebar: Conversations List */}
                    <div className={cn(
                        "w-full sm:w-80 md:w-96 border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col bg-slate-50/50 dark:bg-white/[0.01]",
                        selectedConv ? "hidden sm:flex" : "flex"
                    )}>
                        {/* Search header */}
                        <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.08]">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search chats or courses..."
                                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {isLoading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/[0.04] animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No conversations found</p>
                                    <p className="text-[11px] mt-1 text-slate-400">Enroll in a course to message the instructor.</p>
                                </div>
                            ) : (
                                filteredConversations.map(conv => {
                                    const isTeacher = user?.role === 'TEACHER'
                                    const otherPerson = isTeacher ? conv.student : conv.teacher
                                    const isSelected = selectedConv?._id === conv._id
                                    const unread = isTeacher ? conv.unreadTeacher : conv.unreadStudent

                                    return (
                                        <button
                                            key={conv._id}
                                            onClick={() => setSelectedConv(conv)}
                                            className={cn(
                                                "w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-slate-100/70 dark:hover:bg-white/[0.03]",
                                                isSelected && "bg-primary/5 dark:bg-primary/10 border-l-4 border-primary"
                                            )}
                                        >
                                            {/* Avatar */}
                                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                                                {getInitials(otherPerson?.name || 'T')}
                                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121422]" />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {otherPerson?.name || 'Instructor'}
                                                    </p>
                                                    {conv.lastMessageAt && (
                                                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Course Tag */}
                                                <p className="text-[10px] font-semibold text-primary dark:text-indigo-400 truncate mt-0.5 flex items-center gap-1">
                                                    <BookOpen size={10} />
                                                    {conv.course?.title}
                                                </p>

                                                {/* Last message preview */}
                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {conv.lastMessage || 'No messages yet'}
                                                    </p>
                                                    {unread > 0 && (
                                                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-2xs">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Chat Thread */}
                    <div className={cn(
                        "flex-1 flex-col bg-white dark:bg-[#0D0F19]",
                        selectedConv ? "flex" : "hidden sm:flex"
                    )}>
                        {selectedConv ? (
                            <>
                                {/* Conversation Header */}
                                <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white/70 dark:bg-white/[0.02] backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedConv(null)}
                                            className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>

                                        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                            {getInitials(user?.role === 'TEACHER' ? selectedConv.student?.name || 'S' : selectedConv.teacher?.name || 'T')}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {user?.role === 'TEACHER' ? selectedConv.student?.name : selectedConv.teacher?.name}
                                                </h2>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Online
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                <BookOpen size={11} className="text-primary" />
                                                <span>Questions about:</span>
                                                <Link 
                                                    href={`/student/courses/${selectedConv.course?._id}`}
                                                    className="font-semibold text-primary hover:underline truncate max-w-[200px]"
                                                >
                                                    {selectedConv.course?.title}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/student/courses/${selectedConv.course?._id}`}
                                        className="hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 transition-colors"
                                    >
                                        Course Details
                                        <ChevronRight size={13} />
                                    </Link>
                                </div>

                                {/* Messages Bubble Container */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-[#0B0D17]/40">
                                    {/* Security Notice */}
                                    <div className="p-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/15 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 text-center">
                                        <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                                        <span>This is a direct 1-on-1 Q&A thread verified for this course.</span>
                                    </div>

                                    {messages.map(msg => {
                                        const isMine = msg.sender?._id === user?.id || (typeof msg.sender === 'string' && msg.sender === user?.id)
                                        const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                                        return (
                                            <div
                                                key={msg._id}
                                                className={cn(
                                                    "flex flex-col max-w-[80%] sm:max-w-[70%]",
                                                    isMine ? "ml-auto items-end" : "mr-auto items-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs break-words",
                                                        isMine
                                                            ? "bg-primary text-white rounded-br-xs font-medium"
                                                            : "bg-white dark:bg-[#1A1D2E] text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/70 dark:border-white/[0.08]"
                                                    )}
                                                >
                                                    {msg.message}
                                                </div>

                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                                                    <span>{timeStr}</span>
                                                    {isMine && (
                                                        msg.read ? (
                                                            <CheckCheck size={12} className="text-primary dark:text-indigo-400" />
                                                        ) : (
                                                            <Check size={12} />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input Box */}
                                <form
                                    onSubmit={handleSend}
                                    className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121422] flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={e => setInputMessage(e.target.value)}
                                        placeholder={`Message ${user?.role === 'TEACHER' ? selectedConv.student?.name : selectedConv.teacher?.name}...`}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />

                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim() || isSending}
                                        className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex-shrink-0"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
                                    <MessageSquare size={32} className="opacity-40 text-primary" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    Select a Conversation
                                </h3>
                                <p className="text-xs text-slate-400 max-w-xs mt-1">
                                    Choose an instructor from the left to view messages or ask questions about your enrolled courses.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <AppLayout>
                <div className="p-8 text-center text-slate-400">Loading messages...</div>
            </AppLayout>
        }>
            <MessagesContent />
        </Suspense>
    )
}
