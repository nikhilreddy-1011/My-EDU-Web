'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, User, Lock, Bell as BellIcon, Palette, Shield, LogOut, X } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { useTheme } from 'next-themes'
import { userBadges, studentStats } from '@/data/mock-data'
import { getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const SETTINGS_TABS = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'password', label: 'Password', icon: <Lock size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={16} /> },
]

export default function ProfilePage() {
    const user = useAuthStore(state => state.user)
    const updateUser = useAuthStore(state => state.updateUser)
    const logout = useAuthStore(state => state.logout)
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('profile')
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [name, setName] = useState(user?.name || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        await new Promise(r => setTimeout(r, 800))
        updateUser({ name, bio })
        toast.success('Profile updated successfully!')
        setIsSaving(false)
    }

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    return (
        <AppLayout title="Profile">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile header */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6">
                    <div className="flex items-start gap-5 flex-wrap">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-primary-tint dark:bg-dark-surface2 border-2 border-border dark:border-dark-border flex items-center justify-center">
                                <span className="font-sora font-bold text-2xl text-primary">{getInitials(user?.name || 'U')}</span>
                            </div>
                            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors">
                                <Camera size={12} />
                            </button>
                        </div>
                        <div className="flex-1">
                            <h1 className="font-sora font-bold text-xl text-text-primary dark:text-dark-text">{user?.name}</h1>
                            <p className="text-text-muted text-sm">{user?.email}</p>
                            <div className="flex gap-4 mt-3 text-sm">
                                <div className="text-center"><div className="font-semibold text-text-primary dark:text-dark-text">{studentStats.coursesCompleted}</div><div className="text-text-faint text-xs">Completed</div></div>
                                <div className="text-center"><div className="font-semibold text-text-primary dark:text-dark-text">{studentStats.learningHours}h</div><div className="text-text-faint text-xs">Learned</div></div>
                                <div className="text-center"><div className="font-semibold text-text-primary dark:text-dark-text">{userBadges.length}</div><div className="text-text-faint text-xs">Badges</div></div>
                                <div className="text-center"><div className="font-semibold text-text-primary dark:text-dark-text">🔥 {studentStats.currentStreak}d</div><div className="text-text-faint text-xs">Streak</div></div>
                            </div>
                        </div>
                        <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 border border-red-200 dark:border-red-900 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                            <LogOut size={14} /> Log Out
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Settings tabs */}
                    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-2">
                        {SETTINGS_TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                                    activeTab === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary dark:hover:text-dark-text hover:bg-background dark:hover:bg-dark-bg'
                                )}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Settings content */}
                    <div className="md:col-span-3 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-4">
                                <h2 className="font-sora font-semibold text-text-primary dark:text-dark-text mb-4">Profile Information</h2>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Full Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Email</label>
                                    <input value={user?.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-border/30 dark:bg-dark-border/30 text-text-muted text-sm cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Bio</label>
                                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Tell us about yourself..." />
                                </div>
                                <motion.button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2" whileTap={{ scale: 0.97 }}>
                                    {isSaving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
                                </motion.button>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="space-y-4">
                                <h2 className="font-sora font-semibold text-text-primary dark:text-dark-text mb-4">Change Password</h2>
                                {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                                    <div key={label}>
                                        <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">{label}</label>
                                        <input type="password" className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="••••••••" />
                                    </div>
                                ))}
                                <button onClick={() => toast.success('Password updated!')} className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                                    Update Password
                                </button>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-4">
                                <h2 className="font-sora font-semibold text-text-primary dark:text-dark-text mb-4">Appearance</h2>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-3">Theme</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[['light', '☀️', 'Light'], ['dark', '🌙', 'Dark'], ['system', '💻', 'System']].map(([val, emoji, label]) => (
                                            <button key={val} onClick={() => { setTheme(val); toast.success(`Theme set to ${label}`) }}
                                                className={cn('flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                                                    theme === val ? 'border-primary bg-primary-tint dark:bg-dark-surface2' : 'border-border dark:border-dark-border hover:border-primary/30'
                                                )}>
                                                <span className="text-2xl">{emoji}</span>
                                                <span className="text-sm font-medium text-text-primary dark:text-dark-text">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-4">
                                <h2 className="font-sora font-semibold text-text-primary dark:text-dark-text mb-4">Notification Preferences</h2>
                                {[['Email notifications', 'Receive updates via email', true], ['Push notifications', 'Browser push notifications', true], ['Live class reminders', 'Get reminded 30 min before class', true], ['Quiz deadlines', 'Alerts for upcoming quiz due dates', true], ['Achievement alerts', 'Celebrate your milestones', false]].map(([label, desc, def]) => (
                                    <div key={label as string} className="flex items-center justify-between py-3 border-b border-border dark:border-dark-border last:border-0">
                                        <div><p className="text-sm font-medium text-text-primary dark:text-dark-text">{label as string}</p><p className="text-xs text-text-muted">{desc as string}</p></div>
                                        <button onClick={() => toast.success('Preference saved')} className={cn('w-11 h-6 rounded-full transition-colors relative', def ? 'bg-primary' : 'bg-border dark:bg-dark-border')}>
                                            <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', def ? 'right-0.5' : 'left-0.5')} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-4">
                                <h2 className="font-sora font-semibold text-text-primary dark:text-dark-text mb-4">Privacy Settings</h2>
                                <div className="p-4 bg-background dark:bg-dark-bg rounded-xl border border-border dark:border-dark-border">
                                    <p className="text-sm text-text-muted">Your personal data is protected. We never share your information with third parties without your explicit consent.</p>
                                </div>
                                <button onClick={() => toast.error('Account deletion requires contacting support')} className="px-6 py-2.5 border border-red-200 dark:border-red-900 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                    Delete Account
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logout modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogoutModal(false)} />
                        <motion.div className="relative bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 w-full max-w-sm shadow-modal text-center"
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <LogOut size={32} className="text-red-500 mx-auto mb-3" />
                            <h3 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text mb-1">Log out?</h3>
                            <p className="text-text-muted text-sm mb-5">You&apos;ll need to sign in again to access your account.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-text-muted text-sm hover:border-primary/30 transition-colors">Cancel</button>
                                <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">Log Out</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    )
}
