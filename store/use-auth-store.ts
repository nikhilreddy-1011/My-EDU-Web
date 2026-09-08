import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '@/types'
import { loginUser, registerUser, getCurrentUser } from '@/lib/api/auth'

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>
    register: (name: string, email: string, password: string, role?: 'STUDENT' | 'TEACHER') => Promise<{ success: boolean; error?: string; role?: UserRole }>
    logout: () => void
    updateUser: (updates: Partial<User>) => void
    refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true })
                try {
                    const data = await loginUser(email, password)
                    // Persist token in localStorage for apiClient
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('ls_token', data.token)
                    }
                    const user: User = {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role,
                        avatar: data.user.avatar || '',
                        bio: data.user.bio || '',
                        createdAt: data.user.createdAt || new Date().toISOString(),
                    }
                    set({ user, token: data.token, isAuthenticated: true, isLoading: false })
                    return { success: true, role: data.user.role as UserRole }
                } catch (error: unknown) {
                    set({ isLoading: false })
                    const message = error instanceof Error ? error.message : 'Login failed'
                    return { success: false, error: message }
                }
            },

            register: async (name: string, email: string, password: string, role = 'STUDENT') => {
                set({ isLoading: true })
                try {
                    const data = await registerUser(name, email, password, role)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('ls_token', data.token)
                    }
                    const user: User = {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role,
                        avatar: data.user.avatar || '',
                        bio: data.user.bio || '',
                        createdAt: data.user.createdAt || new Date().toISOString(),
                    }
                    set({ user, token: data.token, isAuthenticated: true, isLoading: false })
                    return { success: true, role: data.user.role as UserRole }
                } catch (error: unknown) {
                    set({ isLoading: false })
                    const message = error instanceof Error ? error.message : 'Registration failed'
                    return { success: false, error: message }
                }
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('ls_token')
                    localStorage.removeItem('learnsphere-auth')
                }
                set({ user: null, token: null, isAuthenticated: false })
            },

            updateUser: (updates: Partial<User>) => {
                const currentUser = get().user
                if (currentUser) {
                    set({ user: { ...currentUser, ...updates } })
                }
            },

            refreshUser: async () => {
                try {
                    const data = await getCurrentUser()
                    const user: User = {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role,
                        avatar: data.user.avatar || '',
                        bio: data.user.bio || '',
                        createdAt: data.user.createdAt || new Date().toISOString(),
                    }
                    set({ user })
                } catch {
                    // Token expired or invalid — log out
                    get().logout()
                }
            },
        }),
        {
            name: 'learnsphere-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: !!state.token && !!state.user,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Stale / mock session without a real JWT token must NOT be authenticated
                    if (!state.token || !state.user) {
                        state.user = null
                        state.token = null
                        state.isAuthenticated = false
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('ls_token')
                        }
                    } else {
                        state.isAuthenticated = true
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('ls_token', state.token)
                        }
                    }
                }
            },
        }
    )
)

// Helper hooks
export const useCurrentUser = () => useAuthStore(state => state.user)
export const useIsAuthenticated = () => useAuthStore(state => !!state.token && state.isAuthenticated)
export const useUserRole = (): UserRole | null => useAuthStore(state => state.user?.role ?? null)
export const useIsStudent = () => useAuthStore(state => state.user?.role === 'STUDENT')
export const useIsTeacher = () => useAuthStore(state => state.user?.role === 'TEACHER')
export const useIsAdmin = () => useAuthStore(state => state.user?.role === 'ADMIN')
