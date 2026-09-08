'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
    Zap, Sparkles, Target, Compass, Users,
    ArrowRight, CheckCircle2
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'


const NAV_LINKS = [
    { label: 'Courses', href: '/student/courses' },
    { label: 'Live Classes', href: '/#live' },
    { label: 'About Us', href: '/about' },
    { label: 'For Teachers', href: '/register' },
]

// ── EXECUTIVE LEADERSHIP (CEO, CTO, 2 CMOs, Founding Member) ──
const EXECUTIVE_LEADERSHIP = [
    {
        name: 'Maithili Kune',
        position: 'CEO',
        role: 'Chief Executive Officer (CEO)',
        image: '/team/maithili-kune.jpg',
        imagePosition: 'object-top',
    },
    {
        name: 'Anuja Shetty',
        position: 'CTO',
        role: 'Chief Technology Officer (CTO)',
        image: '/team/anuja-shetty.jpg',
        imagePosition: 'object-top',
    },
    {
        name: 'Akanksha Gotarne',
        position: 'CMO',
        role: 'Chief Marketing Officer (CMO)',
        image: '/team/akanksha-gotarne-v3.jpg',
        imagePosition: 'object-center',
    },
    {
        name: 'Kruti Kahane',
        position: 'CMO',
        role: 'Chief Marketing Officer (CMO)',
        image: '/team/kruti-kahane.jpg',
        imagePosition: 'object-center',
    },
    {
        name: 'Prof. Mayur Raut',
        position: 'Founding Member',
        role: 'Founding Member & Chief Product Officer',
        image: '/team/founding-member.png',
        imagePosition: 'object-center',
    },
]

// ── OUR TEAM (7 Members) ──
const OUR_TEAM = [
    {
        name: 'Nikhil K.',
        role: 'UI/UX Designer',
        image: '/team/nikhil-k.jpg',
        imagePosition: 'object-top',
    },
    {
        name: 'Pooja D.',
        role: 'Frontend Developer',
        image: '/team/pooja-d.jpg',
        imagePosition: 'object-top',
    },
    {
        name: 'Monu R.',
        role: 'Backend Developer',
        image: '/team/monu-r.png',
        imagePosition: 'object-center',
    },
    {
        name: 'Pratik Khot',
        role: 'Full Stack Developer',
        image: '/team/pratik-khot.png',
        imagePosition: 'object-top',
    },
    {
        name: 'Shrawani Pawal',
        role: 'DevOps Engineer',
        image: '/team/shrawani-pawal.png',
        imagePosition: 'object-center',
    },
    {
        name: 'Vaishnavi Thakur',
        role: 'QA / Test Engineer',
        image: '/team/vaishnavi-thakur.jpg',
        imagePosition: 'object-top',
    },
    {
        name: 'Tushar Avhad',
        role: 'Web App & PWA Developer',
        image: '/team/tushar-avhad.png',
        imagePosition: 'object-center',
    },
]

const STATS = [
    { label: 'Active Learners', value: '50,000+' },
    { label: 'Expert Courses', value: '500+' },
    { label: 'Course Completion Rate', value: '94%' },
    { label: 'Global Hiring Partners', value: '120+' },
]

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text font-inter overflow-x-hidden">
            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/85 dark:bg-dark-surface/85 backdrop-blur-md border-b border-border dark:border-dark-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-[88px] flex items-center justify-between">
                    <Logo size="lg" animate={true} />

                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map(l => (
                            <Link key={l.label} href={l.href} className={`text-[15px] font-medium transition-colors ${l.href === '/about' ? 'text-primary dark:text-blue-400 font-semibold' : 'text-text-muted hover:text-primary dark:hover:text-blue-400'}`}>
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

            {/* ── HERO SECTION ── */}
            <section className="relative pt-36 sm:pt-40 pb-20 overflow-hidden border-b border-border dark:border-dark-border">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, #2E3A8C 0%, transparent 70%)' }} />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-tint dark:bg-dark-surface2 border border-primary/20 text-primary dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6"
                        >
                            <Sparkles size={14} />
                            Our Story & Executive Team
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="font-sora font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-6"
                        >
                            Transforming how the world <span className="bg-gradient-to-r from-primary via-accent to-purple-600 bg-clip-text text-transparent">learns and grows.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-text-muted dark:text-dark-muted leading-relaxed max-w-2xl mx-auto mb-10"
                        >
                            LearnSphere was built on a simple conviction: high-quality, industry-relevant education should be accessible, engaging, and empowered by cutting-edge technology for everyone, everywhere.
                        </motion.p>
                    </div>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8"
                    >
                        {STATS.map((s, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border text-center shadow-xs">
                                <div className="font-sora font-bold text-3xl text-primary dark:text-blue-400 mb-1">{s.value}</div>
                                <div className="text-xs font-medium text-text-muted dark:text-dark-muted">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── 1. EXECUTIVE LEADERSHIP SECTION ── */}
            <section className="py-20 bg-surface/40 dark:bg-dark-surface/40 border-b border-border dark:border-dark-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-tint dark:bg-dark-surface2 text-primary dark:text-blue-400 text-xs font-semibold uppercase mb-3">
                            C-SUITE & EXECUTIVE LEADERSHIP
                        </div>
                        <h2 className="font-sora font-bold text-3xl sm:text-4xl text-text-primary dark:text-dark-text mb-3">
                            Executive Leadership
                        </h2>
                        <p className="text-sm text-text-muted dark:text-dark-muted">
                            Meet our CEO, CTO, 2 CMOs, and Founding Member steering LearnSphere's global vision.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                        {EXECUTIVE_LEADERSHIP.map((exec, idx) => (
                            <motion.div
                                key={exec.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -6 }}
                                className="p-6 rounded-3xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border shadow-xs hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center"
                            >
                                <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-38 lg:h-38 xl:w-44 xl:h-44 rounded-full overflow-hidden border-4 border-primary/25 shadow-md ring-4 ring-primary/10 group-hover:border-primary/60 group-hover:ring-primary/25 transition-all duration-300 aspect-square shrink-0">
                                    <Image
                                        src={exec.image}
                                        alt={exec.name}
                                        fill
                                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${exec.imagePosition || 'object-center'}`}
                                        unoptimized
                                    />
                                </div>
                                <h3 className="font-sora font-bold text-lg sm:text-xl text-text-primary dark:text-dark-text mt-4 group-hover:text-primary transition-colors">
                                    {exec.name}
                                </h3>
                                <span className="mt-2 inline-flex items-center px-3 py-0.5 rounded-full bg-primary-tint dark:bg-dark-surface2 text-primary dark:text-blue-400 text-xs font-semibold border border-primary/20 tracking-wider">
                                    {exec.position}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 2 & 3. VISION & MISSION SECTION ── */}
            <section className="py-20 border-b border-border dark:border-dark-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-tint dark:bg-dark-surface2 text-primary dark:text-blue-400 text-xs font-semibold mb-4">
                            GUIDING PRINCIPLES
                        </div>
                        <h2 className="font-sora font-bold text-3xl sm:text-4xl text-text-primary dark:text-dark-text mb-4">
                            Our Vision & Mission
                        </h2>
                        <p className="text-text-muted dark:text-dark-muted text-lg">
                            The core pillars driving every decision, feature, and curriculum we design.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 2. VISION CARD */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-3xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border hover:border-primary/40 transition-all duration-200 shadow-md relative overflow-hidden group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary dark:text-blue-400 flex items-center justify-center mb-6">
                                <Compass size={24} />
                            </div>
                            <span className="text-xs font-semibold text-primary dark:text-blue-400 uppercase tracking-widest block mb-2">
                                WHAT WE AIM TO ACHIEVE
                            </span>
                            <h3 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-4">
                                Our Vision
                            </h3>
                            <p className="text-text-muted dark:text-dark-muted text-base leading-relaxed mb-6">
                                To become the world's premier AI-powered learning platform, empowering 10+ million learners across the globe to achieve mastery in technology, design, and business skills.
                            </p>
                            <ul className="space-y-3 pt-4 border-t border-border dark:border-dark-border">
                                {[
                                    'Democratizing access to elite STEM & Design education globally.',
                                    'Pioneering personalized AI learning paths tailored to each student.',
                                    'Fostering a global community of ambitious lifelong learners.'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-xs text-text-primary dark:text-dark-text font-medium">
                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* 3. MISSION CARD */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-8 rounded-3xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border hover:border-accent/40 transition-all duration-200 shadow-md relative overflow-hidden group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                                <Target size={24} />
                            </div>
                            <span className="text-xs font-semibold text-accent uppercase tracking-widest block mb-2">
                                HOW WE PLAN TO ACHIEVE IT
                            </span>
                            <h3 className="font-sora font-bold text-2xl text-text-primary dark:text-dark-text mb-4">
                                Our Mission
                            </h3>
                            <p className="text-text-muted dark:text-dark-muted text-base leading-relaxed mb-6">
                                We combine industry-aligned hands-on courses, interactive real-time live classes with expert educators, and instant 24/7 AI tutoring—delivering affordable, outcome-focused education.
                            </p>
                            <ul className="space-y-3 pt-4 border-t border-border dark:border-dark-border">
                                {[
                                    'Real-time live classes with interactive Q&A and code reviews.',
                                    'Project-based learning producing job-ready portfolio projects.',
                                    'Continuous performance analytics and skill mastery tracking.'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-xs text-text-primary dark:text-dark-text font-medium">
                                        <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── 4. OUR TEAM SECTION ── */}
            <section className="py-20 bg-surface/40 dark:bg-dark-surface/40 border-b border-border dark:border-dark-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-tint dark:bg-dark-surface2 text-primary dark:text-blue-400 text-xs font-semibold mb-4">
                            <Users size={14} />
                            OUR TEAM
                        </div>
                        <h2 className="font-sora font-bold text-3xl sm:text-4xl text-text-primary dark:text-dark-text mb-4">
                            Our Team
                        </h2>
                        <p className="text-text-muted dark:text-dark-muted text-base sm:text-lg">
                            The talented professionals who design, engineer, test, and power the LearnSphere learning platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                        {OUR_TEAM.map((member, idx) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.04 }}
                                whileHover={{ y: -4 }}
                                className="p-5 rounded-3xl bg-surface dark:bg-dark-surface border border-border dark:border-dark-border hover:shadow-card hover:border-primary/40 transition-all duration-200 group flex flex-col items-center text-center"
                            >
                                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-primary/20 shadow-xs mb-3 aspect-square shrink-0">
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        fill
                                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${(member as any).imagePosition || 'object-center'}`}
                                        unoptimized
                                    />
                                </div>
                                <h3 className="font-sora font-semibold text-base sm:text-lg text-text-primary dark:text-dark-text group-hover:text-primary transition-colors">
                                    {member.name}
                                </h3>
                                <p className="text-xs font-medium text-text-muted dark:text-dark-muted mt-1">
                                    {member.role}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER CTA ── */}
            <section className="py-20 bg-primary text-white text-center relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
                    <h2 className="font-sora font-bold text-3xl sm:text-4xl mb-4">
                        Ready to Start Your Learning Journey?
                    </h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                        Join 50,000+ students mastering in-demand tech and design skills on LearnSphere today.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link href="/register">
                            <motion.button
                                className="px-8 py-4 bg-accent text-white font-semibold rounded-2xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/25 flex items-center gap-2 cursor-pointer text-base"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Start Learning Free
                                <ArrowRight size={18} />
                            </motion.button>
                        </Link>
                        <Link href="/student/courses">
                            <motion.button
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl transition-colors cursor-pointer text-base"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Explore All Courses
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
