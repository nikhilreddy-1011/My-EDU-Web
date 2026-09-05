import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const STUDENT_PATHS = ['/student']
const TEACHER_PATHS = ['/teacher']
const ADMIN_PATHS = ['/admin']


export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public paths always
    if (PUBLIC_PATHS.some(p => pathname === p) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    // Check for auth cookie/session (we use localStorage in mock, so middleware just passes through)
    // In production, you'd validate a JWT cookie here
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
