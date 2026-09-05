'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, BookOpen, TrendingUp, ShieldCheck, BarChart3,
    GraduationCap, Pencil, Trash2, Plus, Search, X,
    Check, Eye, MoreVertical, Activity, Database,
    UserCog, Layers, ChevronDown, Bell, LogOut, Zap,
    AlertTriangle, Star, Clock
} from 'lucide-react'
import { AppLayout } from '@/components/layouts/app-layout'
import { students, teachers, courses } from '@/data/mock-data'
import { useAuthStore } from '@/store/use-auth-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

type Tab = 'overview' | 'students' | 'teachers' | 'courses'

interface EditModal {
    type: 'student' | 'teacher' | 'course' | null
    id: string | null
    data: Record<string, string>
}

interface DeleteModal {
    type: 'student' | 'teacher' | 'course' | null
    id: string | null
    name: string
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [searchQuery, setSearchQuery] = useState('')
    const [editModal, setEditModal] = useState<EditModal>({ type: null, id: null, data: {} })
    const [deleteModal, setDeleteModal] = useState<DeleteModal>({ type: null, id: null, name: '' })
    const [addModal, setAddModal] = useState<'student' | 'teacher' | 'course' | null>(null)
    const [addForm, setAddForm] = useState<Record<string, string>>({})

    // Local state copies for CRUD simulation
    const [studentList, setStudentList] = useState(students.map(s => ({ ...s })))
    const [teacherList, setTeacherList] = useState(teachers.map(t => ({ ...t })))
    const [courseList, setCourseList] = useState(courses.map(c => ({ ...c })))

    const { logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push('/login')
        toast.success('Logged out successfully')
    }

    // ── Overview Stats ────────────────────────────────────────────
    const statCards = [
        {
            label: 'Total Students', value: studentList.length,
            icon: <GraduationCap size={20} />, color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400',
            delta: '+12% this month'
        },
        {
            label: 'Total Teachers', value: teacherList.length,
            icon: <UserCog size={20} />, color: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400',
            delta: '+3 this month'
        },
        {
            label: 'Active Courses', value: courseList.filter(c => c.status === 'PUBLISHED').length,
            icon: <BookOpen size={20} />, color: 'from-violet-500 to-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400',
            delta: `${courseList.filter(c => c.status === 'DRAFT').length} in draft`
        },
        {
            label: 'Avg Rating', value: (courseList.reduce((a, c) => a + c.rating, 0) / courseList.length).toFixed(1) + '★',
            icon: <Star size={20} />, color: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400',
            delta: 'Top tier platform'
        },
    ]

    // ── Filtering ─────────────────────────────────────────────────
    const filteredStudents = studentList.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const filteredTeachers = teacherList.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const filteredCourses = courseList.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ── CRUD Handlers ─────────────────────────────────────────────
    const openEdit = (type: 'student' | 'teacher' | 'course', id: string) => {
        if (type === 'student') {
            const s = studentList.find(x => x.id === id)
            if (s) setEditModal({ type, id, data: { name: s.name, email: s.email } })
        } else if (type === 'teacher') {
            const t = teacherList.find(x => x.id === id)
            if (t) setEditModal({ type, id, data: { name: t.name, email: t.email, title: t.title ?? '' } })
        } else {
            const c = courseList.find(x => x.id === id)
            if (c) setEditModal({ type, id, data: { title: c.title, category: c.category, status: c.status } })
        }
    }

    const saveEdit = () => {
        const { type, id, data } = editModal
        if (!type || !id) return
        if (type === 'student') {
            setStudentList(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
            toast.success('Student updated successfully')
        } else if (type === 'teacher') {
            setTeacherList(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
            toast.success('Teacher updated successfully')
        } else {
            setCourseList(prev => prev.map(c => c.id === id ? { ...c, ...data, status: data.status as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' } : c))
            toast.success('Course updated successfully')
        }
        setEditModal({ type: null, id: null, data: {} })
    }

    const openDelete = (type: 'student' | 'teacher' | 'course', id: string, name: string) => {
        setDeleteModal({ type, id, name })
    }

    const confirmDelete = () => {
        const { type, id } = deleteModal
        if (!type || !id) return
        if (type === 'student') { setStudentList(prev => prev.filter(s => s.id !== id)); toast.success('Student removed') }
        else if (type === 'teacher') { setTeacherList(prev => prev.filter(t => t.id !== id)); toast.success('Teacher removed') }
        else { setCourseList(prev => prev.filter(c => c.id !== id)); toast.success('Course removed') }
        setDeleteModal({ type: null, id: null, name: '' })
    }

    const openAdd = (type: 'student' | 'teacher' | 'course') => {
        setAddForm({})
        setAddModal(type)
    }

    const saveAdd = () => {
        if (addModal === 'student') {
            const newStudent = {
                id: `s${Date.now()}`, name: addForm.name || 'New Student',
                email: addForm.email || 'student@example.com', role: 'STUDENT' as const,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${addForm.name}`,
                createdAt: new Date().toISOString(), learningStreak: 0, totalHours: 0,
            }
            setStudentList(prev => [...prev, newStudent])
            toast.success('Student added successfully')
        } else if (addModal === 'teacher') {
            const newTeacher = {
                id: `t${Date.now()}`, name: addForm.name || 'New Teacher',
                email: addForm.email || 'teacher@example.com', role: 'TEACHER' as const,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${addForm.name}`,
                title: addForm.title || 'Educator', expertise: [],
                createdAt: new Date().toISOString(),
            }
            setTeacherList(prev => [...prev, newTeacher])
            toast.success('Teacher added successfully')
        } else if (addModal === 'course') {
            const t = teacherList[0]
            const newCourse = {
                id: `c${Date.now()}`, title: addForm.title || 'New Course',
                description: addForm.description || '', thumbnail: '',
                category: addForm.category || 'General', difficulty: 'BEGINNER' as const,
                instructorId: t.id, instructor: t, status: 'DRAFT' as const,
                price: 0, rating: 0, reviewCount: 0, studentCount: 0,
                duration: '0h 0m', totalLessons: 0, tags: [],
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                language: 'English', certificate: false,
            }
            setCourseList(prev => [...prev, newCourse])
            toast.success('Course added successfully')
        }
        setAddModal(null)
        setAddForm({})
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'students', label: 'Students', icon: <GraduationCap size={16} /> },
        { id: 'teachers', label: 'Teachers', icon: <UserCog size={16} /> },
        { id: 'courses', label: 'Courses', icon: <BookOpen size={16} /> },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Admin Top Bar */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                            <ShieldCheck size={18} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 dark:text-white text-base">LearnSphere</span>
                            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                            <Bell size={15} className="text-purple-600 dark:text-purple-300" />
                        </div>
                        <button
                            id="admin-logout-btn"
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
                        >
                            <LogOut size={15} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

                    {/* Page Header */}
                    <motion.div variants={item}>
                        <h1 className="font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">
                            Admin Dashboard 🛡️
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Full platform control — manage users, courses, and data.
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((s) => (
                            <div key={s.label} className={cn('rounded-2xl p-5 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm')}>
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                                    <span className={s.text}>{s.icon}</span>
                                </div>
                                <div className="font-bold text-2xl text-gray-900 dark:text-white">{s.value}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.delta}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Tab Navigation */}
                    <motion.div variants={item} className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-2xl p-1.5 border border-gray-100 dark:border-gray-800 shadow-sm w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                id={`admin-tab-${tab.id}`}
                                onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                    activeTab === tab.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                )}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </motion.div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    studentCount={studentList.length}
                                    teacherCount={teacherList.length}
                                    courseCount={courseList.length}
                                    publishedCount={courseList.filter(c => c.status === 'PUBLISHED').length}
                                />
                            )}
                            {activeTab === 'students' && (
                                <ManageTable
                                    title="Students"
                                    icon={<GraduationCap size={18} />}
                                    color="blue"
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    onAdd={() => openAdd('student')}
                                    columns={['Name', 'Email', 'Joined', 'Actions']}
                                    rows={filteredStudents.map(s => ({
                                        id: s.id,
                                        cells: [
                                            <UserCell key="name" name={s.name} avatar={s.avatar} />,
                                            <span key="email" className="text-gray-500 dark:text-gray-400 text-sm">{s.email}</span>,
                                            <span key="date" className="text-gray-400 text-sm">{new Date(s.createdAt).toLocaleDateString()}</span>,
                                        ],
                                        onEdit: () => openEdit('student', s.id),
                                        onDelete: () => openDelete('student', s.id, s.name),
                                    }))}
                                />
                            )}
                            {activeTab === 'teachers' && (
                                <ManageTable
                                    title="Teachers"
                                    icon={<UserCog size={18} />}
                                    color="emerald"
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    onAdd={() => openAdd('teacher')}
                                    columns={['Name', 'Email', 'Title', 'Actions']}
                                    rows={filteredTeachers.map(t => ({
                                        id: t.id,
                                        cells: [
                                            <UserCell key="name" name={t.name} avatar={t.avatar} />,
                                            <span key="email" className="text-gray-500 dark:text-gray-400 text-sm">{t.email}</span>,
                                            <span key="title" className="text-gray-400 text-sm">{t.title ?? '—'}</span>,
                                        ],
                                        onEdit: () => openEdit('teacher', t.id),
                                        onDelete: () => openDelete('teacher', t.id, t.name),
                                    }))}
                                />
                            )}
                            {activeTab === 'courses' && (
                                <ManageTable
                                    title="Courses"
                                    icon={<BookOpen size={18} />}
                                    color="violet"
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    onAdd={() => openAdd('course')}
                                    columns={['Title', 'Category', 'Status', 'Actions']}
                                    rows={filteredCourses.map(c => ({
                                        id: c.id,
                                        cells: [
                                            <span key="title" className="font-medium text-gray-900 dark:text-white text-sm">{c.title}</span>,
                                            <span key="cat" className="text-gray-500 dark:text-gray-400 text-sm">{c.category}</span>,
                                            <StatusBadge key="status" status={c.status} />,
                                        ],
                                        onEdit: () => openEdit('course', c.id),
                                        onDelete: () => openDelete('course', c.id, c.title),
                                    }))}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── Edit Modal ───────────────────────────────── */}
            <AnimatePresence>
                {editModal.type && (
                    <Modal title={`Edit ${editModal.type}`} onClose={() => setEditModal({ type: null, id: null, data: {} })} onConfirm={saveEdit} confirmLabel="Save Changes" confirmColor="bg-purple-600 hover:bg-purple-700">
                        {editModal.type !== 'course' ? (
                            <>
                                <FormField label="Name" value={editModal.data.name ?? ''} onChange={v => setEditModal(p => ({ ...p, data: { ...p.data, name: v } }))} />
                                <FormField label="Email" type="email" value={editModal.data.email ?? ''} onChange={v => setEditModal(p => ({ ...p, data: { ...p.data, email: v } }))} />
                                {editModal.type === 'teacher' && (
                                    <FormField label="Title" value={editModal.data.title ?? ''} onChange={v => setEditModal(p => ({ ...p, data: { ...p.data, title: v } }))} />
                                )}
                            </>
                        ) : (
                            <>
                                <FormField label="Title" value={editModal.data.title ?? ''} onChange={v => setEditModal(p => ({ ...p, data: { ...p.data, title: v } }))} />
                                <FormField label="Category" value={editModal.data.category ?? ''} onChange={v => setEditModal(p => ({ ...p, data: { ...p.data, category: v } }))} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={editModal.data.status ?? 'DRAFT'}
                                        onChange={e => setEditModal(p => ({ ...p, data: { ...p.data, status: e.target.value } }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm Modal ─────────────────────── */}
            <AnimatePresence>
                {deleteModal.type && (
                    <Modal title="Confirm Delete" onClose={() => setDeleteModal({ type: null, id: null, name: '' })} onConfirm={confirmDelete} confirmLabel="Delete" confirmColor="bg-red-600 hover:bg-red-700">
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                            <AlertTriangle size={20} className="text-red-500 shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">&quot;{deleteModal.name}&quot;</span>? This action cannot be undone.
                            </p>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Add Modal ────────────────────────────────── */}
            <AnimatePresence>
                {addModal && (
                    <Modal title={`Add New ${addModal}`} onClose={() => setAddModal(null)} onConfirm={saveAdd} confirmLabel="Add" confirmColor="bg-purple-600 hover:bg-purple-700">
                        {(addModal === 'student' || addModal === 'teacher') && (
                            <>
                                <FormField label="Name" value={addForm.name ?? ''} onChange={v => setAddForm(p => ({ ...p, name: v }))} placeholder="Full name" />
                                <FormField label="Email" type="email" value={addForm.email ?? ''} onChange={v => setAddForm(p => ({ ...p, email: v }))} placeholder="email@example.com" />
                                {addModal === 'teacher' && (
                                    <FormField label="Title" value={addForm.title ?? ''} onChange={v => setAddForm(p => ({ ...p, title: v }))} placeholder="e.g. Senior Instructor" />
                                )}
                            </>
                        )}
                        {addModal === 'course' && (
                            <>
                                <FormField label="Title" value={addForm.title ?? ''} onChange={v => setAddForm(p => ({ ...p, title: v }))} placeholder="Course title" />
                                <FormField label="Category" value={addForm.category ?? ''} onChange={v => setAddForm(p => ({ ...p, category: v }))} placeholder="e.g. Web Development" />
                                <FormField label="Description" value={addForm.description ?? ''} onChange={v => setAddForm(p => ({ ...p, description: v }))} placeholder="Brief description" />
                            </>
                        )}
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OverviewTab({ studentCount, teacherCount, courseCount, publishedCount }: {
    studentCount: number; teacherCount: number; courseCount: number; publishedCount: number
}) {
    const recentActivity = [
        { icon: <GraduationCap size={14} />, text: 'New student enrolled in React Masterclass', time: '2 min ago', color: 'text-blue-500' },
        { icon: <BookOpen size={14} />, text: 'Course "Node.js Bootcamp" published', time: '15 min ago', color: 'text-violet-500' },
        { icon: <UserCog size={14} />, text: 'Teacher Priya Sharma updated profile', time: '1 hr ago', color: 'text-emerald-500' },
        { icon: <Activity size={14} />, text: 'System backup completed successfully', time: '3 hrs ago', color: 'text-gray-500' },
        { icon: <Star size={14} />, text: 'New 5-star review on "UI/UX Fundamentals"', time: '5 hrs ago', color: 'text-amber-500' },
    ]

    const systemInfo = [
        { label: 'Platform Status', value: '✅ Operational' },
        { label: 'Total Users', value: (studentCount + teacherCount + 1).toString() },
        { label: 'Published Courses', value: publishedCount.toString() },
        { label: 'Total Courses', value: courseCount.toString() },
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                    {recentActivity.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <div className={cn('mt-0.5', a.color)}>{a.icon}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{a.text}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Info */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Database size={18} className="text-purple-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Platform Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {systemInfo.map((info, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{info.label}</div>
                                <div className="font-semibold text-gray-900 dark:text-white text-sm">{info.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={18} />
                        <span className="font-semibold">Admin Access</span>
                    </div>
                    <p className="text-purple-100 text-sm">
                        You have full access to manage all platform data including users, courses, analytics, and settings.
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                        {['Users', 'Courses', 'Analytics', 'Settings'].map(tag => (
                            <span key={tag} className="text-xs bg-white/20 rounded-full px-3 py-1">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

interface ManageTableProps {
    title: string
    icon: React.ReactNode
    color: 'blue' | 'emerald' | 'violet'
    searchQuery: string
    setSearchQuery: (q: string) => void
    onAdd: () => void
    columns: string[]
    rows: { id: string; cells: React.ReactNode[]; onEdit: () => void; onDelete: () => void }[]
}

function ManageTable({ title, icon, color, searchQuery, setSearchQuery, onAdd, columns, rows }: ManageTableProps) {
    const colorMap = {
        blue: { btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-300' },
        emerald: { btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-300' },
        violet: { btn: 'bg-violet-600 hover:bg-violet-700', ring: 'focus:ring-violet-300' },
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-300">{icon}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Manage {title}</h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5 rounded-full">{rows.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300 w-48"
                        />
                    </div>
                    <button
                        id={`btn-add-${title.toLowerCase()}`}
                        onClick={onAdd}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors', colorMap[color].btn)}
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                            {columns.map((col, i) => (
                                <th key={i} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-10 text-gray-400">
                                    No {title.toLowerCase()} found
                                </td>
                            </tr>
                        ) : rows.map(row => (
                            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                {row.cells.map((cell, i) => (
                                    <td key={i} className="px-5 py-3">{cell}</td>
                                ))}
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={row.onEdit}
                                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-gray-500"
                                            title="Edit"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={row.onDelete}
                                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-500"
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function UserCell({ name, avatar }: { name: string; avatar?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                        {name.charAt(0)}
                    </div>
                )}
            </div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">{name}</span>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PUBLISHED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        DRAFT: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        ARCHIVED: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    }
    return (
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', map[status] ?? map.DRAFT)}>
            {status}
        </span>
    )
}

function Modal({ title, children, onClose, onConfirm, confirmLabel, confirmColor }: {
    title: string
    children: React.ReactNode
    onClose: () => void
    onConfirm: () => void
    confirmLabel: string
    confirmColor: string
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{title}</h3>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-5 space-y-4">{children}</div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={cn('px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors', confirmColor)}>
                        {confirmLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function FormField({ label, value, onChange, type = 'text', placeholder }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
        </div>
    )
}
