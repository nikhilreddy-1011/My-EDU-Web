import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'LearnSphere — Learn Smarter. Grow Faster.',
  description: 'The modern EdTech platform for students and teachers. Discover courses, learn through interactive lessons, take quizzes, and attend live classes.',
  keywords: ['online learning', 'courses', 'education', 'e-learning', 'LearnSphere'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload Apple SF Pro High-Performance Local Web Fonts */}
        <link rel="preload" href="/fonts/SFProDisplay-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SFProDisplay-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SFProDisplay-Semibold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SFProDisplay-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased text-text-primary dark:text-dark-text selection:bg-primary/15 selection:text-primary" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
