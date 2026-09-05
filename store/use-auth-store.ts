import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole } from '@/types'
import { demoCredentials } from '@/data/mock-data'

interface AuthState {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>
    logout: () => void
    updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true })
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000))

                const studentCred = demoCredentials.student
                const teacherCred = demoCredentials.teacher
                const adminCred = demoCredentials.admin

                if (email === studentCred.email && password === studentCred.password) {
                    set({ user: studentCred.user, isAuthenticated: true, isLoading: false })
                    return { success: true, role: 'STUDENT' }
                }
                if (email === teacherCred.email && password === teacherCred.password) {
                    set({ user: teacherCred.user as User, isAuthenticated: true, isLoading: false })
                    return { success: true, role: 'TEACHER' }
                }
                if (email === adminCred.email && password === adminCred.password) {
                    set({ user: adminCred.user as User, isAuthenticated: true, isLoading: false })
                    return { success: true, role: 'ADMIN' }
                }

                set({ isLoading: false })
                return { success: false, error: 'Invalid email or password' }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false })
            },

            updateUser: (updates: Partial<User>) => {
                const currentUser = get().user
                if (currentUser) {
                    set({ user: { ...currentUser, ...updates } })
                }
            },
        }),
        {
            name: 'learnsphere-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
)

// Helper hooks
export const useCurrentUser = () => useAuthStore(state => state.user)
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useUserRole = (): UserRole | null => useAuthStore(state => state.user?.role ?? null)
export const useIsStudent = () => useAuthStore(state => state.user?.role === 'STUDENT')
export const useIsTeacher = () => useAuthStore(state => state.user?.role === 'TEACHER')
export const useIsAdmin = () => useAuthStore(state => state.user?.role === 'ADMIN')
