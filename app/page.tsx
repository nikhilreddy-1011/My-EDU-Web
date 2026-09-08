'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  BookOpen, Video, Brain, BarChart3, Award, TrendingUp, Star,
  ChevronRight, Play, Users, Clock, Zap, Check, ArrowRight,
  Globe, Shield, Sparkles, Target, MessageSquare, Mail,
  ExternalLink, Share2, Music2, GraduationCap
} from 'lucide-react'
import { courses } from '@/data/mock-data'
import { formatPrice, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ALL_COMPANIES } from '@/components/ui/company-logos'
import { Logo } from '@/components/ui/logo'

// Animated counter hook
function useCounter(end: number, duration = 2000, startWhen = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!startWhen) return
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration, startWhen])
  return count
}

// ============================================================
const NAV_LINKS = [
  { label: 'Courses', href: '/student/courses' },
  { label: 'Live Classes', href: '#live' },
  { label: 'About Us', href: '/about' },
  { label: 'For Teachers', href: '/register' },
  { label: 'Pricing', href: '#pricing' },
]

const FEATURES = [
  { icon: <BookOpen size={22} />, title: 'Interactive Courses', desc: 'Curated courses with video lessons, articles, and hands-on projects.' },
  { icon: <Video size={22} />, title: 'Live Classes', desc: 'Real-time learning sessions with expert instructors and Q&A.' },
  { icon: <Brain size={22} />, title: 'AI Tutor', desc: 'Your personal AI assistant to answer questions and explain concepts.' },
  { icon: <Target size={22} />, title: 'Smart Quizzes', desc: 'Adaptive assessments that track your understanding and growth.' },
  { icon: <BarChart3 size={22} />, title: 'Learning Analytics', desc: 'Deep insights into your learning patterns and progress trends.' },
  { icon: <Award size={22} />, title: 'Achievement Badges', desc: 'Earn badges and certificates as you hit key learning milestones.' },
]

const STEPS = [
  { step: '01', icon: <Globe size={24} />, title: 'Discover', desc: 'Browse hundreds of courses across all disciplines and skill levels.' },
  { step: '02', icon: <BookOpen size={24} />, title: 'Learn', desc: 'Progress through video lessons, readings, and interactive content.' },
  { step: '03', icon: <Brain size={24} />, title: 'Practice', desc: 'Reinforce your knowledge with quizzes and live class exercises.' },
  { step: '04', icon: <Award size={24} />, title: 'Achieve', desc: 'Earn certificates and badges to showcase your new skills.' },
]

const TESTIMONIALS = [
  {
    name: 'Sneha Iyer',
    role: 'Frontend Developer at Razorpay',
    avatar: 'SI',
    color: '#EEF0FB',
    text: 'LearnSphere completely changed how I upskill. The React bootcamp landed me my dream job in just three months. The AI tutor feature is genuinely incredible — it felt like having a personal mentor 24/7.',
    rating: 5,
    course: 'React & Next.js Bootcamp',
  },
  {
    name: 'Aryan Kapoor',
    role: 'Data Scientist at Swiggy',
    avatar: 'AK',
    color: '#FFF1EE',
    text: 'The data science course quality is world-class. Live classes with Vikram sir are incredibly valuable — he brings real industry problems. Best investment in my career so far.',
    rating: 5,
    course: 'Data Science & ML with Python',
  },
  {
    name: 'Fatima Shaikh',
    role: 'UX Designer at Zomato',
    avatar: 'FS',
    color: '#F0FBF7',
    text: 'I transitioned from marketing to UX design using LearnSphere. Priya ma\'am\'s design critique sessions were exactly what my portfolio needed. Got hired within 6 weeks of completing the course!',
    rating: 5,
    course: 'UI/UX Design Masterclass',
  },
]

const STATS = [
  { end: 50000, suffix: '+', label: 'Happy Learners', icon: <Users size={24} /> },
  { end: 500, suffix: '+', label: 'Expert Courses', icon: <BookOpen size={24} /> },
  { end: 1200, suffix: '+', label: 'Live Classes', icon: <Video size={24} /> },
  { end: 95, suffix: '%', label: 'Satisfaction Rate', icon: <Star size={24} /> },
]

// ============================================================
export default function LandingPage() {
  const statsRef = useRef<HTMLDivElement>(null)
  const isStatsInView = useInView(statsRef, { once: true, margin: '-100px' })
  const heroHeadingRef = useRef<HTMLHeadingElement>(null)
  const isHeroHeadingInView = useInView(heroHeadingRef, { amount: 0.25, once: false })
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg font-inter overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/85 dark:bg-dark-surface/85 backdrop-blur-md border-b border-border dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-[88px] flex items-center justify-between">
          <Logo size="lg" animate={true} />

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="text-[15px] text-text-muted hover:text-primary dark:hover:text-blue-400 transition-colors font-medium">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="text-[15px] text-text-muted dark:text-dark-muted hover:text-primary transition-colors duration-100 font-medium hidden sm:block cursor-pointer px-3 py-2">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <motion.button
                className="px-6 py-2.5 bg-primary text-white text-[15px] font-semibold rounded-xl hover:bg-primary-dark transition-colors duration-100 shadow-md shadow-primary/20 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 sm:pt-40 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #2E3A8C 0%, transparent 70%)' }} />
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute bottom-0 left-10 w-96 h-96 rounded-full bg-primary/6 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-tint dark:bg-dark-surface2 border border-primary/20 text-primary dark:text-blue-400 text-sm font-medium mb-6"
            >
              <Sparkles size={14} />
              Introducing AI Tutor — Available 24/7
            </motion.div>

            <h1
              ref={heroHeadingRef}
              className="font-sora font-bold text-5xl sm:text-6xl md:text-7xl leading-tight mb-6 overflow-hidden"
              style={{ color: 'var(--text-primary)' }}
            >
              <motion.span
                className="block"
                initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1, x: 0 }
                    : isHeroHeadingInView
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -60 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: isHeroHeadingInView ? 0.8 : 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
              >
                Learn smarter.
              </motion.span>
              <motion.span
                className="block gradient-text"
                initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1, x: 0 }
                    : isHeroHeadingInView
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: 60 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: isHeroHeadingInView ? 0.8 : 0.2,
                        delay: isHeroHeadingInView ? 0.12 : 0,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
              >
                Grow faster.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-text-muted dark:text-dark-muted leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              The most advanced online learning platform. Expert courses, interactive live classes, AI-powered assistance — everything you need to master any skill.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <Link href="/register">
                <motion.button
                  className="px-8 py-4 bg-accent text-white text-base font-semibold rounded-2xl hover:bg-accent-hover transition-colors duration-100 shadow-lg shadow-accent/25 flex items-center gap-2 cursor-pointer"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  Start Learning Free
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/student/courses">
                <motion.button
                  className="px-8 py-4 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-dark-text text-base font-semibold rounded-2xl hover:border-primary/40 hover:shadow-card transition-colors duration-100 flex items-center gap-2 cursor-pointer"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  <Play size={16} className="text-primary" />
                  Explore Courses
                </motion.button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-3 mt-8"
            >
              <div className="flex -space-x-2">
                {['A', 'B', 'C', 'D', 'E'].map((l, i) => (
                  <div key={l} className="w-8 h-8 rounded-full border-2 border-surface dark:border-dark-surface bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center text-primary text-xs font-bold" style={{ zIndex: 5 - i }}>
                    {l}
                  </div>
                ))}
              </div>
              <div className="text-sm text-text-muted">
                <span className="font-semibold text-text-primary dark:text-dark-text">50,000+</span> learners already enrolled
              </div>
              <div className="flex items-center gap-0.5">
                {Array(5).fill(0).map((_, i) => <Star key={i} size={12} className="fill-warning text-warning" />)}
                <span className="text-xs text-text-muted ml-1">4.9/5</span>
              </div>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
              style={{ boxShadow: '0 40px 80px rgba(46,58,140,0.15)' }}>
              {/* Fake browser bar */}
              <div className="h-10 bg-dark-surface2 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4 h-5 bg-dark-bg/50 rounded-md" />
              </div>
              {/* Dashboard mockup */}
              <div className="p-6 bg-background dark:bg-dark-bg">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {['72%\nProgress', '4\nIn Progress', '12\nCompleted', '84h\nLearned'].map((stat, i) => {
                    const [v, l] = stat.split('\n')
                    const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning']
                    return (
                      <div key={i} className="bg-surface dark:bg-dark-surface rounded-xl p-3 border border-border dark:border-dark-border">
                        <div className={`w-8 h-8 ${colors[i]} rounded-lg mb-2 opacity-15`} />
                        <div className="font-sora font-bold text-xl text-text-primary dark:text-dark-text">{v}</div>
                        <div className="text-xs text-text-faint">{l}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['React & Next.js', 'UI/UX Design', 'Data Science'].map((course, i) => (
                    <div key={i} className="bg-surface dark:bg-dark-surface rounded-xl p-3 border border-border dark:border-dark-border">
                      <div className="h-20 rounded-lg mb-2 opacity-80" style={{ background: ['linear-gradient(135deg,#2E3A8C,#3D4FA8)', 'linear-gradient(135deg,#FF6B4A,#ff9478)', 'linear-gradient(135deg,#1FA97D,#2dd4a0)'][i] }} />
                      <div className="text-xs font-semibold text-text-primary dark:text-dark-text mb-1 truncate">{course}</div>
                      <div className="h-1.5 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${[18, 65, 42][i]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST LOGOS ── */}
      <section className="py-20 border-y border-border dark:border-dark-border bg-surface/50 dark:bg-dark-surface/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-text-faint text-xs uppercase tracking-widest font-bold mb-3">
              TRUSTED BY LEARNERS FROM
            </p>
            <h2 className="font-sora font-bold text-3xl sm:text-4xl text-text-primary dark:text-dark-text mb-4 tracking-tight">
              Top Companies <span className="bg-gradient-to-r from-primary via-accent to-purple-600 bg-clip-text text-transparent">Worldwide</span>
            </h2>
            <p className="text-text-muted dark:text-dark-muted text-base sm:text-lg">
              Join millions of learners building their skills with the world&apos;s leading companies.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4 sm:gap-5 max-w-7xl mx-auto">
            {ALL_COMPANIES.map((company) => (
              <div
                key={company.name}
                className="flex flex-col items-center justify-center group cursor-pointer"
              >
                <div className="w-full h-16 rounded-2xl bg-surface dark:bg-dark-surface border border-border/80 dark:border-dark-border p-3 flex items-center justify-center group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-card transition-all duration-200">
                  {company.logo}
                </div>
                <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary dark:group-hover:text-dark-text transition-colors mt-2 text-center leading-tight px-1 max-w-full">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-tint dark:bg-dark-surface2 text-primary text-xs font-semibold mb-4"
            >
              EVERYTHING YOU NEED
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-sora font-bold text-4xl text-text-primary dark:text-dark-text mb-4"
            >
              Built for serious learners
            </motion.h2>
            <p className="text-text-muted dark:text-dark-muted max-w-xl mx-auto text-lg">
              Every feature is designed to help you learn faster, stay motivated, and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                className="group bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-6 hover:shadow-card-hover transition-shadow duration-100 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-100">
                  {f.icon}
                </div>
                <h3 className="font-sora font-semibold text-lg text-text-primary dark:text-dark-text mb-2">{f.title}</h3>
                <p className="text-text-muted dark:text-dark-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR COURSES ── */}
      <section className="py-20 bg-surface dark:bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs font-semibold text-primary mb-2 tracking-wide">POPULAR COURSES</div>
              <h2 className="font-sora font-bold text-4xl text-text-primary dark:text-dark-text">
                Top-rated courses
              </h2>
            </div>
            <Link href="/student/courses">
              <button className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                View all <ChevronRight size={16} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.filter(c => c.status === 'PUBLISHED').slice(0, 8).map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/student/courses/${course.id}`}>
                  <div className="group bg-background dark:bg-dark-bg border border-border dark:border-dark-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all cursor-pointer">
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden h-40 bg-dark-surface2">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <BookOpen size={40} className="text-primary opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-1 text-xs font-semibold rounded-lg" style={{ background: 'rgba(46,58,140,0.9)', color: '#fff' }}>
                          {course.category}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={cn(
                          'px-2 py-1 text-xs font-bold rounded-lg',
                          course.price === 0 ? 'bg-success text-white' : 'bg-surface text-text-primary'
                        )}>
                          {course.price === 0 ? 'FREE' : formatPrice(course.price)}
                        </span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-text-primary dark:text-dark-text mb-1 line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-text-faint text-xs mb-3">{course.instructor.name}</p>
                      <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                        <span className="flex items-center gap-1">
                          <Star size={11} className="fill-warning text-warning" />
                          {course.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {formatNumber(course.studentCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {course.duration}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-md font-medium',
                          course.difficulty === 'BEGINNER' && 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                          course.difficulty === 'INTERMEDIATE' && 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
                          course.difficulty === 'ADVANCED' && 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                        )}>
                          {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
                        </span>
                        {course.certificate && (
                          <span className="flex items-center gap-1 text-xs text-text-faint">
                            <Award size={11} /> Certificate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-primary mb-2 tracking-wide">HOW IT WORKS</div>
            <h2 className="font-sora font-bold text-4xl text-text-primary dark:text-dark-text mb-4">Your learning journey</h2>
            <p className="text-text-muted max-w-lg mx-auto">From discovery to achievement — a clear path to mastery.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px border-t-2 border-dashed border-border dark:border-dark-border" />
                )}
                <div className="relative inline-flex">
                  <div className="w-24 h-24 rounded-2xl bg-primary-tint dark:bg-dark-surface2 border-2 border-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{step.step}</span>
                </div>
                <h3 className="font-sora font-semibold text-lg text-text-primary dark:text-dark-text mb-2">{step.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="py-20" style={{ background: 'linear-gradient(135deg, #1F2861 0%, #2E3A8C 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const count = useCounter(stat.end, 2000, isStatsInView)
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-white mb-4">
                    {stat.icon}
                  </div>
                  <div className="font-sora font-bold text-5xl text-white mb-1">
                    {formatNumber(count)}{stat.suffix}
                  </div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-surface dark:bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-primary mb-2 tracking-wide">TESTIMONIALS</div>
            <h2 className="font-sora font-bold text-4xl text-text-primary dark:text-dark-text">Loved by learners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background dark:bg-dark-bg border border-border dark:border-dark-border rounded-2xl p-6 hover:shadow-card transition-all"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} size={14} className="fill-warning text-warning" />)}
                </div>
                <p className="text-text-muted dark:text-dark-muted text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border dark:border-dark-border">
                  <div className="w-10 h-10 rounded-full bg-primary-tint dark:bg-dark-surface2 flex items-center justify-center font-bold text-primary text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary dark:text-dark-text">{t.name}</p>
                    <p className="text-xs text-text-faint">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/6 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-sora font-bold text-5xl text-text-primary dark:text-dark-text mb-6 leading-tight">
              Ready to transform
              <br />
              <span className="gradient-text">the way you learn?</span>
            </h2>
            <p className="text-text-muted dark:text-dark-muted text-xl mb-10">
              Join 50,000+ learners who are already building their future with LearnSphere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <motion.button
                  className="px-10 py-4 bg-accent text-white text-base font-semibold rounded-2xl hover:bg-accent-hover transition-colors duration-100 shadow-lg shadow-accent/25 flex items-center gap-2 justify-center cursor-pointer"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  Start for Free <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button
                  className="px-10 py-4 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-dark-text text-base font-semibold rounded-2xl hover:border-primary/40 transition-colors duration-100 flex items-center gap-2 justify-center cursor-pointer"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap text-sm text-text-muted">
              {['No credit card required', 'Free courses available', 'Cancel anytime'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check size={14} className="text-success" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-dark-bg py-16 text-dark-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="mb-4">
                <Logo size="md" showTagline={true} animate={true} />
              </div>
              <p className="text-sm leading-relaxed text-dark-muted mb-4">
                Learn smarter. Grow faster. The modern platform for ambitious learners.
              </p>
              <div className="flex gap-3">
                {[Share2, ExternalLink, Mail, Music2].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-dark-surface2 flex items-center justify-center text-dark-muted hover:text-white hover:bg-dark-surface transition-colors">
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Courses', 'Live Classes', 'AI Tutor', 'Analytics', 'Certificates'] },
              { title: 'Resources', links: ['Blog', 'Documentation', 'Community', 'Help Center', 'API'] },
              { title: 'Company', links: ['About', 'Careers', 'Press', 'Partners', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-dark-muted hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-dark-muted">
            <p>© 2026 LearnSphere. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
