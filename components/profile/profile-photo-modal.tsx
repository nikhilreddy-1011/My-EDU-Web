'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Upload, Sparkles, Image as ImageIcon, Link as LinkIcon,
    Trash2, Check, RefreshCw, Camera, UserCheck, Shield, GraduationCap,
    BookOpen, Layers, CheckCircle2
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export interface ProfilePhotoModalProps {
    isOpen: boolean
    onClose: () => void
    currentAvatar?: string
    userName?: string
    userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN'
    onSave: (newAvatarUrl: string) => Promise<void> | void
}

type TabType = 'library' | 'upload' | 'generator' | 'url'

// ── Curated Role-Specific & General Presets ──────────────────────────
const STUDENT_PRESETS = [
    { id: 's1', label: 'Code Explorer', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rohit&backgroundColor=b6e3f4' },
    { id: 's2', label: 'Creative Designer', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya&backgroundColor=ffd5b8' },
    { id: 's3', label: 'Tech Enthusiast', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karan&backgroundColor=d1d4f9' },
    { id: 's4', label: 'Scholar', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meera&backgroundColor=c1f2dc' },
    { id: 's5', label: 'AI Learner', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex&backgroundColor=b6e3f4' },
    { id: 's6', label: 'Fullstack Dev', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev&backgroundColor=ffdfdf' },
    { id: 's7', label: 'Data Apprentice', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=sophia&backgroundColor=ffd5b8' },
    { id: 's8', label: 'Open Source Geek', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=lucas&backgroundColor=d1d4f9' },
]

const TEACHER_PRESETS = [
    { id: 't1', label: 'Dr. Arjun Mehta', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun&backgroundColor=b6e3f4' },
    { id: 't2', label: 'Prof. Priya Sharma', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=d1d4f9' },
    { id: 't3', label: 'Vikram Nair', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram&backgroundColor=c0aede' },
    { id: 't4', label: 'Research Lead', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=elena&backgroundColor=c1f2dc' },
    { id: 't5', label: 'Engineering Mentor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus&backgroundColor=ffd5b8' },
    { id: 't6', label: 'Design Director', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah&backgroundColor=ffdfdf' },
    { id: 't7', label: 'Data Science Lead', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=david&backgroundColor=b6e3f4' },
    { id: 't8', label: 'Tech Speaker', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=profbot&backgroundColor=d1d4f9' },
]

const ADMIN_PRESETS = [
    { id: 'a1', label: 'Platform Director', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1&backgroundColor=c0aede' },
    { id: 'a2', label: 'Security Lead', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=security&backgroundColor=1e293b' },
    { id: 'a3', label: 'System Admin', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=root&backgroundColor=d1d4f9' },
    { id: 'a4', label: 'Operations Lead', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=adminops&backgroundColor=c1f2dc' },
    { id: 'a5', label: 'Verified Staff', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff&backgroundColor=ffd5b8' },
    { id: 'a6', label: 'Architecture Chief', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chief&backgroundColor=b6e3f4' },
    { id: 'a7', label: 'Compliance Officer', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=compliance&backgroundColor=ffdfdf' },
    { id: 'a8', label: 'Core Guardian', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=guardian&backgroundColor=b6e3f4' },
]

const GENERATOR_STYLES = [
    { id: 'avataaars', label: 'Illustrated People' },
    { id: 'bottts', label: 'Modern Bots' },
    { id: 'lorelei', label: 'Artistic Line' },
    { id: 'notionists', label: 'Monochrome Notion' },
    { id: 'pixel-art', label: 'Retro 8-Bit' },
    { id: 'fun-emoji', label: 'Vibrant Emoji' },
] as const

const BG_COLORS = [
    { id: 'b6e3f4', label: 'Sky', hex: '#b6e3f4' },
    { id: 'd1d4f9', label: 'Lavender', hex: '#d1d4f9' },
    { id: 'c1f2dc', label: 'Mint', hex: '#c1f2dc' },
    { id: 'ffd5b8', label: 'Peach', hex: '#ffd5b8' },
    { id: 'ffdfdf', label: 'Rose', hex: '#ffdfdf' },
    { id: 'c0aede', label: 'Violet', hex: '#c0aede' },
    { id: '1e293b', label: 'Dark Slate', hex: '#1e293b' },
]

export function ProfilePhotoModal({
    isOpen,
    onClose,
    currentAvatar = '',
    userName = 'User',
    userRole = 'STUDENT',
    onSave,
}: ProfilePhotoModalProps) {
    const [selectedTab, setSelectedTab] = useState<TabType>('library')
    const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar)
    const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar)
    const [isSaving, setIsSaving] = useState(false)

    // Generator state
    const [style, setStyle] = useState<typeof GENERATOR_STYLES[number]['id']>('avataaars')
    const [seed, setSeed] = useState<string>(userName.toLowerCase().replace(/\s+/g, '') || 'learner')
    const [bgColor, setBgColor] = useState<string>('b6e3f4')

    // Web URL state
    const [customUrlInput, setCustomUrlInput] = useState<string>('')

    // Upload state
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedAvatar(currentAvatar)
            setPreviewUrl(currentAvatar)
            setSeed(userName.toLowerCase().replace(/\s+/g, '') || 'learner')
        }
    }, [isOpen, currentAvatar, userName])

    // Generate procedural avatar URL
    const generateUrl = (st: string, sd: string, bg: string) => {
        return `https://api.dicebear.com/7.x/${st}/svg?seed=${encodeURIComponent(sd)}&backgroundColor=${bg}`
    }

    const handleRandomizeSeed = () => {
        const randomSeed = Math.random().toString(36).substring(2, 8)
        setSeed(randomSeed)
        const newUrl = generateUrl(style, randomSeed, bgColor)
        setSelectedAvatar(newUrl)
        setPreviewUrl(newUrl)
    }

    const handleStyleChange = (newStyle: typeof style) => {
        setStyle(newStyle)
        const newUrl = generateUrl(newStyle, seed, bgColor)
        setSelectedAvatar(newUrl)
        setPreviewUrl(newUrl)
    }

    const handleBgColorChange = (newBg: string) => {
        setBgColor(newBg)
        const newUrl = generateUrl(style, seed, newBg)
        setSelectedAvatar(newUrl)
        setPreviewUrl(newUrl)
    }

    const handleSeedInputChange = (val: string) => {
        setSeed(val)
        const newUrl = generateUrl(style, val || 'learner', bgColor)
        setSelectedAvatar(newUrl)
        setPreviewUrl(newUrl)
    }

    // Client-side image compression & optimization to WebP/JPEG data URL
    const processImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose a valid image file (PNG, JPG, WEBP, SVG)')
            return
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error('File size exceeds 8MB. Please select a smaller image.')
            return
        }

        setIsUploading(true)
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                const size = 320 // 320x320 avatar
                canvas.width = size
                canvas.height = size

                if (ctx) {
                    // Draw centered crop
                    const minDim = Math.min(img.width, img.height)
                    const sx = (img.width - minDim) / 2
                    const sy = (img.height - minDim) / 2
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
                    const compressedDataUrl = canvas.toDataURL('image/webp', 0.85)
                    setSelectedAvatar(compressedDataUrl)
                    setPreviewUrl(compressedDataUrl)
                    setIsUploading(false)
                    toast.success('Photo ready for preview!')
                } else {
                    setSelectedAvatar(e.target?.result as string)
                    setPreviewUrl(e.target?.result as string)
                    setIsUploading(false)
                }
            }
            img.onerror = () => {
                setIsUploading(false)
                toast.error('Failed to load image.')
            }
            img.src = e.target?.result as string
        }
        reader.onerror = () => {
            setIsUploading(false)
            toast.error('Failed to read file.')
        }
        reader.readAsDataURL(file)
    }

    const handleApplyWebUrl = () => {
        if (!customUrlInput.trim()) {
            toast.error('Please enter an image URL')
            return
        }
        setSelectedAvatar(customUrlInput.trim())
        setPreviewUrl(customUrlInput.trim())
        toast.success('URL applied!')
    }

    const handleRemovePhoto = () => {
        setSelectedAvatar('')
        setPreviewUrl('')
        toast.info('Avatar will be reset to your initials')
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(selectedAvatar)
            toast.success('Profile photo updated successfully!')
            onClose()
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save profile photo')
        } finally {
            setIsSaving(false)
        }
    }

    // Role-tailored library presets
    const activePresets = userRole === 'ADMIN'
        ? ADMIN_PRESETS
        : userRole === 'TEACHER'
            ? TEACHER_PRESETS
            : STUDENT_PRESETS

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="relative w-full max-w-2xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
                >
                    {/* Header */}
                    <div className="px-6 py-4.5 border-b border-border dark:border-dark-border flex items-center justify-between bg-surface/50 dark:bg-dark-surface/50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-blue-400">
                                <Camera size={18} />
                            </div>
                            <div>
                                <h2 className="font-sora font-bold text-base sm:text-lg text-text-primary dark:text-dark-text leading-tight">
                                    Profile Photo Options
                                </h2>
                                <p className="text-xs text-text-muted">
                                    Personalize your avatar for {userRole === 'TEACHER' ? 'Instructor' : userRole === 'ADMIN' ? 'Administrator' : 'Student'} profile
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

                        {/* Top: Live Avatar Preview & Identity Badge */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-indigo-50/50 to-primary/5 dark:from-white/[0.02] dark:via-white/[0.04] dark:to-transparent border border-primary/15 dark:border-white/[0.08] flex items-center gap-4 flex-wrap sm:flex-nowrap">
                            <div className="relative flex-shrink-0">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 p-0.5 shadow-md">
                                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-surface dark:bg-dark-surface flex items-center justify-center">
                                        {previewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={previewUrl}
                                                alt={userName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-sora font-extrabold text-2xl text-primary dark:text-indigo-400">
                                                {getInitials(userName)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-surface dark:border-dark-surface flex items-center justify-center">
                                    <Check size={10} className="text-white stroke-[3]" />
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-sora font-bold text-base text-text-primary dark:text-dark-text truncate">
                                        {userName}
                                    </h3>
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                                        userRole === 'ADMIN'
                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                            : userRole === 'TEACHER'
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    )}>
                                        {userRole === 'ADMIN' ? '🛡️ Administrator' : userRole === 'TEACHER' ? '🎓 Instructor' : '📚 Student'}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted mb-2">
                                    {previewUrl
                                        ? (previewUrl.startsWith('data:') ? 'Custom uploaded image selected' : 'Selected avatar URL active')
                                        : 'Default monogram initials'}
                                </p>
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Trash2 size={12} /> Reset to monogram initials
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
                            {[
                                { id: 'library', label: 'Preset Library', icon: Layers },
                                { id: 'upload', label: 'Upload File', icon: Upload },
                                { id: 'generator', label: 'Avatar Studio', icon: Sparkles },
                                { id: 'url', label: 'Image URL', icon: LinkIcon },
                            ].map(tab => {
                                const Icon = tab.icon
                                const isActive = selectedTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id as TabType)}
                                        className={cn(
                                            'flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all select-none',
                                            isActive
                                                ? 'bg-white dark:bg-dark-surface text-primary dark:text-white shadow-xs'
                                                : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text'
                                        )}
                                    >
                                        <Icon size={13} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Tab Content 1: Preset Library */}
                        {selectedTab === 'library' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-xs text-text-muted uppercase tracking-wider">
                                        Tailored for {userRole === 'ADMIN' ? 'Administrators' : userRole === 'TEACHER' ? 'Teachers' : 'Students'}
                                    </h4>
                                    <span className="text-[11px] text-text-faint">{activePresets.length} presets available</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {activePresets.map(preset => {
                                        const isSelected = selectedAvatar === preset.url
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAvatar(preset.url)
                                                    setPreviewUrl(preset.url)
                                                }}
                                                className={cn(
                                                    'group relative p-3 rounded-2xl border transition-all text-left flex flex-col items-center gap-2',
                                                    isSelected
                                                        ? 'border-primary dark:border-indigo-400 bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/20'
                                                        : 'border-border dark:border-dark-border bg-background dark:bg-dark-bg/60 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                                                )}
                                            >
                                                {/* Selected check badge */}
                                                {isSelected && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                                                        <Check size={10} className="stroke-[3]" />
                                                    </span>
                                                )}

                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs group-hover:scale-105 transition-transform">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={preset.url}
                                                        alt={preset.label}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <span className="text-xs font-medium text-text-primary dark:text-dark-text text-center line-clamp-1">
                                                    {preset.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tab Content 2: Upload File */}
                        {selectedTab === 'upload' && (
                            <div className="space-y-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        const file = e.dataTransfer.files?.[0]
                                        if (file) processImageFile(file)
                                    }}
                                    className="border-2 border-dashed border-border dark:border-dark-border hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-background/50 dark:bg-dark-bg/50 hover:bg-primary/[0.02]"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) processImageFile(file)
                                        }}
                                    />
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
                                        <Upload size={22} />
                                    </div>
                                    <p className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1">
                                        Click to browse or drag & drop photo here
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        PNG, JPG, WEBP, or SVG — Automatically centered and optimized
                                    </p>
                                </div>

                                {isUploading && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium py-2">
                                        <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        Processing image...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content 3: Generative Style Studio */}
                        {selectedTab === 'generator' && (
                            <div className="space-y-5">
                                {/* Seed Input & Randomize */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                                            Avatar Persona / Seed
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleRandomizeSeed}
                                            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                        >
                                            <RefreshCw size={11} /> Shuffle 🎲
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            value={seed}
                                            onChange={(e) => handleSeedInputChange(e.target.value)}
                                            placeholder="e.g. alexander, professor, coder"
                                            className="flex-1 px-4 py-2 rounded-xl text-sm border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRandomizeSeed}
                                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-400 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                        >
                                            <RefreshCw size={13} /> Randomize
                                        </button>
                                    </div>
                                </div>

                                {/* Style Selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                        Art Style
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {GENERATOR_STYLES.map((st) => (
                                            <button
                                                key={st.id}
                                                type="button"
                                                onClick={() => handleStyleChange(st.id)}
                                                className={cn(
                                                    'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                                                    style === st.id
                                                        ? 'border-primary bg-primary/10 text-primary dark:text-white font-semibold'
                                                        : 'border-border dark:border-dark-border text-text-muted hover:text-text-primary hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                                                )}
                                            >
                                                {st.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Palette */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                        Background Shade
                                    </label>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        {BG_COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleBgColorChange(c.id)}
                                                style={{ backgroundColor: c.hex }}
                                                className={cn(
                                                    'w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center shadow-xs',
                                                    bgColor === c.id
                                                        ? 'border-primary ring-2 ring-primary/40 scale-110'
                                                        : 'border-black/10 hover:scale-105'
                                                )}
                                                title={c.label}
                                            >
                                                {bgColor === c.id && <Check size={12} className={c.id === '1e293b' ? 'text-white' : 'text-slate-800'} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content 4: Direct Web Image URL */}
                        {selectedTab === 'url' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                                        Direct Image URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={customUrlInput}
                                            onChange={(e) => setCustomUrlInput(e.target.value)}
                                            placeholder="https://example.com/avatar.jpg"
                                            className="flex-1 px-4 py-2 rounded-xl text-sm border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyWebUrl}
                                            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                                        >
                                            Preview
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-text-faint mt-1.5">
                                        You can paste a direct image URL from GitHub, Unsplash, Gravatar, or your website.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-border dark:border-dark-border bg-surface dark:bg-dark-surface flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-border dark:border-dark-border text-text-muted hover:text-text-primary dark:hover:text-dark-text text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>

                        <div className="flex items-center gap-2">
                            <motion.button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Check size={15} /> Save & Apply Photo
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
