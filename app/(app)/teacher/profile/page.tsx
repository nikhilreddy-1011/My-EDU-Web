'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Bell, Palette, Shield, Camera, Check, LogOut } from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { useAuthStore } from '@/store/use-auth-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function TeacherProfilePage() {
    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('profile')
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [name, setName] = useState(user?.name || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [title, setTitle] = useState(user?.title || '')

    const handleSave = async () => {
        await new Promise(r => setTimeout(r, 600))
        toast.success('Profile updated successfully')
    }

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <AppLayout title="Profile & Settings">
            <div className="max-w-3xl mx-auto space-y-5">
                {/* Profile card */}
                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center text-2xl font-bold text-primary dark:text-blue-300 border-2 border-primary/20">
                            {(user?.name || 'T').charAt(0)}
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-card hover:bg-primary-dark transition-colors"><Camera size={13} /></button>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h2 className="font-sora font-bold text-xl text-text-primary dark:text-dark-text">{user?.name}</h2>
                        <p className="text-text-muted text-sm">{user?.email}</p>
                        <p className="text-xs text-text-faint mt-1">{user?.title || 'Instructor at LearnSphere'}</p>
                    </div>
                    <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 px-4 py-2 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-background dark:bg-dark-bg rounded-xl p-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                                activeTab === tab.id ? 'bg-surface dark:bg-dark-surface text-text-primary dark:text-dark-text shadow-card' : 'text-text-muted hover:text-text-primary'
                            )}>
                            <tab.icon size={14} />{tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6">
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-text-primary dark:text-dark-text">Personal Information</h3>
                            {[
                                { label: 'Full Name', value: name, setter: setName, placeholder: 'Your full name' },
                                { label: 'Title / Role', value: title, setter: setTitle, placeholder: 'e.g. Senior Software Engineer' },
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">{f.label}</label>
                                    <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Bio</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell students about yourself..." className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Email</label>
                                <input defaultValue={user?.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-border/30 dark:bg-dark-border/30 text-text-muted text-sm cursor-not-allowed" />
                            </div>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">Save Changes</button>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-text-primary dark:text-dark-text">Change Password</h3>
                            {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                                <div key={label}>
                                    <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">{label}</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                            ))}
                            <button onClick={() => toast.success('Password updated successfully')} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">Update Password</button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-text-primary dark:text-dark-text">Notification Preferences</h3>
                            {[
                                { label: 'New Student Enrollment', sub: 'Get notified when a student enrolls in your course' },
                                { label: 'Course Reviews', sub: 'Alert me when students leave reviews' },
                                { label: 'Live Class Reminders', sub: '15 minutes before your scheduled class' },
                                { label: 'Quiz Attempts', sub: 'When students complete your quizzes' },
                                { label: 'Weekly Analytics Report', sub: 'Revenue and engagement summary every Monday' },
                            ].map((item, i) => (
                                <div key={item.label} className="flex items-center justify-between py-3 border-b border-border dark:border-dark-border last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary dark:text-dark-text">{item.label}</p>
                                        <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
                                    </div>
                                    <ToggleSwitch defaultOn={i < 3} />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-text-primary dark:text-dark-text">Theme</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Light', value: 'light', bg: 'bg-white', border: 'border-gray-200' },
                                    { label: 'Dark', value: 'dark', bg: 'bg-gray-900', border: 'border-gray-700' },
                                    { label: 'System', value: 'system', bg: 'bg-gradient-to-br from-white to-gray-900', border: 'border-gray-400' },
                                ].map(opt => (
                                    <button key={opt.value} onClick={() => setTheme(opt.value)}
                                        className={cn('relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                            theme === opt.value ? 'border-primary' : `${opt.border} hover:border-primary/30`
                                        )}>
                                        <div className={cn('w-12 h-8 rounded-lg border', opt.bg, opt.border)} />
                                        <span className="text-sm font-medium text-text-primary dark:text-dark-text">{opt.label}</span>
                                        {theme === opt.value && <Check size={13} className="absolute top-2 right-2 text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Logout modal */}
                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 max-w-sm w-full shadow-modal">
                            <h3 className="font-sora font-bold text-lg text-text-primary dark:text-dark-text mb-2">Sign out?</h3>
                            <p className="text-text-muted text-sm mb-5">You&apos;ll be redirected to the login page.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 border border-border dark:border-dark-border rounded-xl text-sm font-medium text-text-muted hover:border-primary/30 transition-colors">Cancel</button>
                                <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">Sign Out</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}

function ToggleSwitch({ defaultOn }: { defaultOn: boolean }) {
    const [on, setOn] = useState(defaultOn)
    return (
        <button onClick={() => setOn(!on)} className={cn('w-10 h-5.5 rounded-full relative transition-colors flex-shrink-0', on ? 'bg-primary' : 'bg-border dark:bg-dark-border')}>
            <span className={cn('absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform', on ? 'right-0.5' : 'left-0.5')} />
        </button>
    )
}
