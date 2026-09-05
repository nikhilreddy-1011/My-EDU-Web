'use client'

import { Sidebar } from '@/components/navigation/sidebar'
import { Topbar } from '@/components/navigation/topbar'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { GlobalSearch } from '@/components/global-search'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
    children: React.ReactNode
    title?: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
    const isSidebarCollapsed = useAppStore(state => state.isSidebarCollapsed)

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main content area */}
            <div
                className={cn(
                    'transition-all duration-300 min-h-screen',
                    'md:ml-[240px]',
                    isSidebarCollapsed && 'md:ml-[64px]'
                )}
            >
                <Topbar title={title} />
                <main className="p-4 md:p-6 pb-20 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <BottomNav />

            {/* Global search overlay */}
            <GlobalSearch />
        </div>
    )
}
