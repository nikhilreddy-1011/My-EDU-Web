import React from 'react'
import { DashboardSkeleton } from '@/components/ui/skeleton'

export default function StudentDashboardLoading() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <DashboardSkeleton />
        </div>
    )
}
