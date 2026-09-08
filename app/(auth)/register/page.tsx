'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Zap, GraduationCap, BookOpen } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useAuthStore } from '@/store/use-auth-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'TEACHER']),
    title: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
    const [showPassword, setShowPassword] = React.useState(false)
    const router = useRouter()
    const { register: registerUser, isLoading } = useAuthStore()

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(schema),
        defaultValues: { role: 'STUDENT' },
    })

    const selectedRole = watch('role')

    const onSubmit = async (data: RegisterForm) => {
        const result = await registerUser(data.name, data.email, data.password, data.role)
        if (result.success) {
            toast.success('Account created! Welcome to LearnSphere 🎉')
            router.push(result.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')
        } else {
            toast.error(result.error || 'Registration failed')
        }
    }

    const inputCls = (hasError: boolean) => cn(
        'w-full px-4 py-3 rounded-xl border bg-surface dark:bg-dark-surface2 text-text-primary dark:text-dark-text placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm',
        hasError ? 'border-red-400 focus:ring-red-200' : 'border-border dark:border-dark-border'
    )

    return (
        <div className="min-h-screen flex bg-background dark:bg-dark-bg">
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                    <div className="mb-8">
                        <Logo size="md" animate={true} />
                    </div>

                    <div className="mb-8">
                        <h1 className="font-sora font-bold text-3xl text-text-primary dark:text-dark-text mb-2">Create your account</h1>
                        <p className="text-text-muted">Start your learning journey today — it&apos;s free.</p>
                    </div>

                    {/* Role selector */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {(['STUDENT', 'TEACHER'] as const).map(role => {
                            const active = selectedRole === role
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setValue('role', role)}
                                    className={cn(
                                        'flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                                        active
                                            ? 'border-primary bg-primary-tint dark:bg-dark-surface2 text-primary'
                                            : 'border-border dark:border-dark-border text-text-muted hover:border-primary/30'
                                    )}
                                >
                                    {role === 'STUDENT' ? <GraduationCap size={22} /> : <BookOpen size={22} />}
                                    <span className="text-sm font-semibold capitalize">{role.toLowerCase()}</span>
                                </button>
                            )
                        })}
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Full Name</label>
                            <input {...register('name')} id="name" placeholder="Your full name" className={inputCls(!!errors.name)} />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Email Address</label>
                            <input {...register('email')} type="email" id="email" placeholder="you@example.com" className={inputCls(!!errors.email)} />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {selectedRole === 'TEACHER' && (
                            <div>
                                <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Professional Title</label>
                                <input {...register('title')} id="title" placeholder="e.g. Senior Software Engineer" className={inputCls(false)} />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Password</label>
                            <div className="relative">
                                <input {...register('password')} type={showPassword ? 'text' : 'password'} id="password" placeholder="Create a strong password" className={cn(inputCls(!!errors.password), 'pr-11')} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1.5">Confirm Password</label>
                            <input {...register('confirmPassword')} type="password" id="confirmPassword" placeholder="Re-enter your password" className={inputCls(!!errors.confirmPassword)} />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {isLoading ? <><Loader2 size={16} className="animate-spin" />Creating account...</> : 'Create Account'}
                        </motion.button>
                    </form>

                    <p className="text-center text-xs text-text-faint mt-4">
                        By signing up you agree to our{' '}
                        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </p>

                    <p className="text-center text-sm text-text-muted mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
