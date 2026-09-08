'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Zap, BookOpen, TrendingUp, Award, GraduationCap, Users, ShieldCheck, Star } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useAuthStore } from '@/store/use-auth-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [showPassword, setShowPassword] = React.useState(false)
    const [redirectUrl, setRedirectUrl] = React.useState<string | null>(null)
    const { login, isLoading } = useAuthStore()
    const router = useRouter()

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const redir = params.get('redirect')
            if (redir && redir.startsWith('/')) {
                setRedirectUrl(redir)
            }
        }
    }, [])

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginForm) => {
        const result = await login(data.email, data.password)
        if (result.success) {
            const role = result.role
            toast.success('Welcome back! 👋')
            if (redirectUrl && redirectUrl.startsWith('/')) {
                router.push(redirectUrl)
            } else if (role === 'TEACHER') {
                router.push('/teacher/dashboard')
            } else if (role === 'ADMIN') {
                router.push('/admin/dashboard')
            } else {
                router.push('/student/dashboard')
            }
        } else {
            toast.error(result.error || 'Login failed')
        }
    }

    const fillLogin = (role: 'student' | 'teacher' | 'admin') => {
        const creds = {
            student: { email: 'student@learnsphere.com', password: 'Student@123' },
            teacher: { email: 'teacher@learnsphere.com', password: 'Teacher@123' },
            admin:   { email: 'admin@learnsphere.com',   password: 'Admin@123'   },
        }
        setValue('email', creds[role].email)
        setValue('password', creds[role].password)
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding with website's premium cosmic/midnight theme */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 bg-[#0C0E1E]">
                {/* Layered rich ambient glow & subtle grid */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:36px_36px] opacity-50" />

                    {/* Radial gradients matching website brand colors */}
                    <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-accent/20 blur-[120px]" />
                    <div className="absolute top-1/3 -left-28 w-[440px] h-[440px] rounded-full bg-[#6366F1]/20 blur-[130px]" />
                    <div className="absolute -bottom-20 right-1/4 w-[380px] h-[380px] rounded-full bg-[#8B5CF6]/15 blur-[110px]" />
                </div>

                <div className="relative z-10 max-w-md text-center">
                    <div className="flex items-center justify-center mb-8">
                        <Logo size="lg" animate={true} />
                    </div>

                    <h2 className="font-sora font-bold text-4xl mb-4 leading-tight">
                        <span className="block text-white font-extrabold">Learn smarter.</span>
                        <span className="block font-extrabold bg-gradient-to-r from-violet-400 via-pink-400 to-accent text-transparent bg-clip-text drop-shadow-[0_4px_16px_rgba(255,107,74,0.3)]">
                            Grow faster.
                        </span>
                    </h2>
                    <p className="text-slate-300 text-base mb-10 leading-relaxed">
                        Join 50,000+ learners transforming their careers with world-class courses and an AI tutor that never sleeps.
                    </p>

                    {/* Glassmorphic Stats Grid */}
                    <div className="grid grid-cols-3 gap-3.5 mb-10">
                        {[
                            { label: 'Learners', value: '50K+', icon: <BookOpen size={18} className="text-blue-400" />, border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
                            { label: 'Courses', value: '500+', icon: <TrendingUp size={18} className="text-accent" />, border: 'border-accent/25', bg: 'bg-accent/10' },
                            { label: 'Completion', value: '95%', icon: <Award size={18} className="text-emerald-400" />, border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.12] transition-all hover:scale-[1.02] shadow-xl shadow-black/25">
                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2.5 border', stat.bg, stat.border)}>
                                    {stat.icon}
                                </div>
                                <div className="font-sora font-extrabold text-white text-xl">{stat.value}</div>
                                <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Social proof pill */}
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.12] shadow-lg shadow-black/20">
                        <div className="flex -space-x-2">
                            {['s1', 's2', 's3', 's4', 's5'].map((seed, i) => (
                                <div
                                    key={seed}
                                    className="w-7 h-7 rounded-full border-2 border-[#0C0E1E] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                                    style={{ zIndex: 5 - i }}
                                >
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                <Star size={12} className="fill-amber-400 text-amber-400" /> 4.9/5
                            </span>
                            <span className="text-slate-500">·</span>
                            <span>50,000+ enrolled</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel — login form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background dark:bg-dark-bg">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="mb-8 lg:hidden">
                        <Logo size="md" animate={true} />
                    </div>

                    <div className="mb-6">
                        <h1 className="font-sora font-bold text-3xl text-text-primary dark:text-dark-text mb-2">Welcome back</h1>
                        <p className="text-text-muted">Sign in to continue your learning journey</p>
                    </div>

                    {/* Quick Login Buttons */}
                    <div className="mb-5">
                        <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">Quick Login</p>
                        <div className="grid grid-cols-3 gap-2">
                            {/* Student Login */}
                            <button
                                type="button"
                                id="btn-student-login"
                                onClick={() => fillLogin('student')}
                                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <GraduationCap size={16} className="text-blue-600 dark:text-blue-300" />
                                </div>
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Student</span>
                                <span className="text-[10px] text-blue-500 dark:text-blue-400">Login</span>
                            </button>

                            {/* Teacher Login */}
                            <button
                                type="button"
                                id="btn-teacher-login"
                                onClick={() => fillLogin('teacher')}
                                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users size={16} className="text-emerald-600 dark:text-emerald-300" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Teacher</span>
                                <span className="text-[10px] text-emerald-500 dark:text-emerald-400">Login</span>
                            </button>

                            {/* Admin Login */}
                            <button
                                type="button"
                                id="btn-admin-login"
                                onClick={() => fillLogin('admin')}
                                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:border-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={16} className="text-purple-600 dark:text-purple-300" />
                                </div>
                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Admin</span>
                                <span className="text-[10px] text-purple-500 dark:text-purple-400">Login</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border dark:border-dark-border" />
                        </div>
                        <div className="relative flex justify-center text-xs text-text-faint">
                            <span className="bg-background dark:bg-dark-bg px-2">or sign in with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">
                                Email address
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                id="email"
                                placeholder="you@example.com"
                                className={cn(
                                    'w-full px-4 py-3 rounded-xl border bg-surface dark:bg-dark-surface2 text-text-primary dark:text-dark-text placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm',
                                    errors.email ? 'border-red-400 focus:ring-red-200' : 'border-border dark:border-dark-border'
                                )}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-text-primary dark:text-dark-text">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs text-primary dark:text-blue-400 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="Enter your password"
                                    className={cn(
                                        'w-full px-4 py-3 pr-11 rounded-xl border bg-surface dark:bg-dark-surface2 text-text-primary dark:text-dark-text placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm',
                                        errors.password ? 'border-red-400 focus:ring-red-200' : 'border-border dark:border-dark-border'
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                {...register('rememberMe')}
                                type="checkbox"
                                id="rememberMe"
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-text-muted">Remember me</label>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            id="btn-sign-in"
                            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm text-text-muted mt-6">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-primary dark:text-blue-400 font-semibold hover:underline">
                            Sign up for free
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
