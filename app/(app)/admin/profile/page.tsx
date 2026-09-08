'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, User, Lock, Bell, Palette, Camera, Check, LogOut,
    Key, ShieldCheck, Activity, Database, Server, UserCheck,
    Cpu, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { cn, getInitials } from '@/lib/utils'
import { ProfilePhotoModal } from '@/components/profile/profile-photo-modal'
import { updateUserProfile } from '@/lib/api/user'

const ADMIN_TABS = [
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
    { id: 'permissions', label: 'System Permissions', icon: Key },
    { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function AdminProfilePage() {
    const user = useAuthStore(state => state.user)
    const updateUser = useAuthStore(state => state.updateUser)
    const logout = useAuthStore(state => state.logout)
    const router = useRouter()
    const { theme, setTheme } = useTheme()

    const [activeTab, setActiveTab] = useState('profile')
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showPhotoModal, setShowPhotoModal] = useState(false)

    const [name, setName] = useState(user?.name || 'Administrator')
    const [bio, setBio] = useState(user?.bio || 'Core LearnSphere platform administrator.')
    const [title, setTitle] = useState(user?.title || 'System Operations & Platform Director')
    const [department, setDepartment] = useState('Platform Infrastructure')
    const [isSaving, setIsSaving] = useState(false)

    // Security state toggles
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
    const [sessionAlerts, setSessionAlerts] = useState(true)
    const [apiAuditLogs, setApiAuditLogs] = useState(true)

    const handleSave = async () => {
        setIsSaving(true)
        updateUser({ name, bio, title })
        try {
            await updateUserProfile({ name, bio, title })
        } catch {}
        toast.success('Admin profile saved successfully!')
        setIsSaving(false)
    }

    const handleAvatarSave = async (newUrl: string) => {
        updateUser({ avatar: newUrl })
        try {
            await updateUserProfile({ avatar: newUrl })
        } catch {}
    }

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <AppLayout title="Admin Profile & Settings">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Admin Header Banner ─────────────────────────────── */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-3xl p-6 relative overflow-hidden shadow-xs">
                    <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-red-500/10 via-primary/5 to-transparent pointer-events-none rounded-tr-3xl" />

                    <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap relative z-10">
                        {/* Avatar with Camera Trigger */}
                        <div
                            className="relative group cursor-pointer flex-shrink-0"
                            onClick={() => setShowPhotoModal(true)}
                        >
                            <div className="w-22 h-22 rounded-2xl bg-gradient-to-tr from-red-500 via-primary to-indigo-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-[14px] overflow-hidden bg-surface dark:bg-dark-surface flex items-center justify-center">
                                    {user?.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={user.avatar}
                                            alt={user?.name || 'Admin'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="font-sora font-extrabold text-2xl text-red-500 dark:text-red-400">
                                            {getInitials(user?.name || 'A')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                title="Change Admin Photo"
                                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md ring-2 ring-surface dark:ring-dark-surface transition-colors"
                            >
                                <Camera size={14} />
                            </button>
                        </div>

                        {/* Admin Information */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h1 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text truncate">
                                    {user?.name || 'Administrator'}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                                    <Shield size={11} className="fill-current" /> Super Admin
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Clearance
                                </span>
                            </div>

                            <p className="text-sm text-text-muted">{user?.email || 'admin@learnsphere.com'}</p>
                            <p className="text-xs text-text-faint mt-0.5">{title}</p>

                            <div className="flex items-center gap-3 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPhotoModal(true)}
                                    className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-200 dark:border-red-900/40"
                                >
                                    <Camera size={12} /> Change Profile Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin/dashboard')}
                                    className="px-3 py-1.5 border border-border dark:border-dark-border text-text-muted hover:text-text-primary text-xs font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                                >
                                    Admin Dashboard
                                </button>
                            </div>
                        </div>

                        {/* Sign Out Trigger */}
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-600 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"
                        >
                            <LogOut size={14} /> Log Out
                        </button>
                    </div>
                </div>

                {/* ── Metric Snapshot Cards ──────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Security Level', value: 'Level 4 Root', icon: ShieldCheck, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
                        { label: 'Cluster Uptime', value: '99.98%', icon: Server, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Active Sessions', value: '1 Active', icon: Activity, color: 'text-primary bg-primary/10' },
                        { label: 'Database Sync', value: 'Online', icon: Database, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
                    ].map(card => {
                        const Icon = card.icon
                        return (
                            <div key={card.label} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-4">
                                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', card.color)}>
                                    <Icon size={16} />
                                </div>
                                <div className="font-sora font-bold text-lg text-text-primary dark:text-dark-text">{card.value}</div>
                                <div className="text-xs text-text-muted">{card.label}</div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Main Settings Section ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Tabs sidebar */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-2 space-y-1 h-fit">
                        {ADMIN_TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                                        isActive
                                            ? 'bg-red-500 text-white shadow-xs font-semibold'
                                            : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text hover:bg-background dark:hover:bg-dark-bg'
                                    )}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Tab Content Panels */}
                    <div className="md:col-span-3 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-3xl p-6">

                        {/* Profile Info Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-4">
                                <h3 className="font-sora font-semibold text-text-primary dark:text-dark-text text-base mb-3">
                                    Administrator Identity Details
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                                            Admin Full Name
                                        </label>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                                            Administrator Title
                                        </label>
                                        <input
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                                            Super Admin Email
                                        </label>
                                        <input
                                            value={user?.email || 'admin@learnsphere.com'}
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-border/30 dark:bg-dark-border/30 text-text-muted text-sm cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                                            Department
                                        </label>
                                        <input
                                            value={department}
                                            onChange={e => setDepartment(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                                        Administrative Scope & Bio
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                                    />
                                </div>

                                <div className="pt-2">
                                    <motion.button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 shadow-xs"
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} /> Save Admin Changes
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-5">
                                <h3 className="font-sora font-semibold text-text-primary dark:text-dark-text text-base">
                                    Security & Master Access Controls
                                </h3>

                                <div className="divide-y divide-border dark:divide-dark-border">
                                    <div className="py-3.5 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary dark:text-dark-text">
                                                Two-Factor Authentication (2FA)
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                Enforce hardware security key or TOTP token on administrative sign-in.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                            className={cn(
                                                'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                                                twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                            )}
                                        >
                                            <span className={cn(
                                                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                                                twoFactorEnabled ? 'right-0.5' : 'left-0.5'
                                            )} />
                                        </button>
                                    </div>

                                    <div className="py-3.5 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary dark:text-dark-text">
                                                Immediate Session Hijack Alerts
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                Instant security notification if login IP location changes.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSessionAlerts(!sessionAlerts)}
                                            className={cn(
                                                'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                                                sessionAlerts ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                            )}
                                        >
                                            <span className={cn(
                                                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                                                sessionAlerts ? 'right-0.5' : 'left-0.5'
                                            )} />
                                        </button>
                                    </div>

                                    <div className="py-3.5 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary dark:text-dark-text">
                                                Audit Logging
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                Write every course modification and user deletion to tamper-evident audit logs.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setApiAuditLogs(!apiAuditLogs)}
                                            className={cn(
                                                'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                                                apiAuditLogs ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                            )}
                                        >
                                            <span className={cn(
                                                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                                                apiAuditLogs ? 'right-0.5' : 'left-0.5'
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                    <span>
                                        Root security policies are active. Password alterations require root authorization key confirmation.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Permissions Tab */}
                        {activeTab === 'permissions' && (
                            <div className="space-y-4">
                                <h3 className="font-sora font-semibold text-text-primary dark:text-dark-text text-base">
                                    Active Administrative Capabilities
                                </h3>

                                <div className="space-y-2">
                                    {[
                                        { title: 'User Administration', desc: 'Can suspend, invite, or assign roles to students and teachers', active: true },
                                        { title: 'Course Publication Oversight', desc: 'Can approve, reject, feature, or archive course catalogs', active: true },
                                        { title: 'Live Streaming Orchestration', desc: 'Can supervise live class rooms and broadcast platform notices', active: true },
                                        { title: 'Financial & Razorpay Management', desc: 'Can inspect transaction logs, verify orders, and review payouts', active: true },
                                        { title: 'Database & Socket Cluster Control', desc: 'Full read/write authority across MongoDB and WebSocket servers', active: true },
                                    ].map(perm => (
                                        <div
                                            key={perm.title}
                                            className="p-3.5 rounded-2xl border border-border dark:border-dark-border bg-background/60 dark:bg-dark-bg/60 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary dark:text-dark-text">
                                                    {perm.title}
                                                </p>
                                                <p className="text-xs text-text-muted">{perm.desc}</p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Granted
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-4">
                                <h3 className="font-sora font-semibold text-text-primary dark:text-dark-text text-base">
                                    Platform Interface Theme
                                </h3>

                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Light Mode', value: 'light', icon: '☀️' },
                                        { label: 'Dark Mode', value: 'dark', icon: '🌙' },
                                        { label: 'System Theme', value: 'system', icon: '💻' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTheme(opt.value)}
                                            className={cn(
                                                'p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2',
                                                theme === opt.value
                                                    ? 'border-red-500 bg-red-500/5 ring-2 ring-red-500/20'
                                                    : 'border-border dark:border-dark-border hover:border-border'
                                            )}
                                        >
                                            <span className="text-2xl">{opt.icon}</span>
                                            <span className="text-xs font-semibold text-text-primary dark:text-dark-text">
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Logout Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                        />
                        <motion.div
                            className="relative bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 w-full max-w-sm shadow-modal text-center"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <LogOut size={32} className="text-red-500 mx-auto mb-3" />
                            <h3 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text mb-1">
                                Terminate Admin Session?
                            </h3>
                            <p className="text-text-muted text-sm mb-5">
                                You will need administrative credentials to re-authenticate.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm hover:border-primary/30 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Profile Photo Options Modal */}
            <ProfilePhotoModal
                isOpen={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                currentAvatar={user?.avatar}
                userName={user?.name || 'Administrator'}
                userRole="ADMIN"
                onSave={handleAvatarSave}
            />
        </AppLayout>
    )
}
