'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  showText?: boolean
  animate?: boolean
  href?: string | null
  className?: string
  textClassName?: string
}

export function Logo({
  size = 'md',
  showTagline = false,
  showText = true,
  animate = true,
  href = '/',
  className,
  textClassName,
}: LogoProps) {
  const sizeConfig = {
    sm: {
      icon: 32,
      textSize: 'text-base sm:text-lg font-bold',
      taglineSize: 'text-[9px] tracking-wider',
      gap: 'gap-2',
    },
    md: {
      icon: 44,
      textSize: 'text-xl sm:text-2xl font-extrabold',
      taglineSize: 'text-[10px] tracking-widest',
      gap: 'gap-3',
    },
    lg: {
      icon: 54,
      textSize: 'text-2xl sm:text-[28px] font-extrabold',
      taglineSize: 'text-xs tracking-widest',
      gap: 'gap-3.5',
    },
    xl: {
      icon: 72,
      textSize: 'text-3xl sm:text-4xl font-extrabold',
      taglineSize: 'text-sm tracking-widest',
      gap: 'gap-4',
    },
  }[size]

  const content = (
    <div className={cn('inline-flex items-center group select-none', sizeConfig.gap, className)}>
      {/* 3D Cosmic Lightning Logo Icon */}
      <motion.div
        className="relative flex-shrink-0 flex items-center justify-center"
        whileHover={{ scale: 1.06, rotate: 2 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      >
        <Image
          src="/logo-icon-clean.png"
          alt="LearnSphere Logo"
          width={sizeConfig.icon}
          height={sizeConfig.icon}
          className="object-contain drop-shadow-[0_4px_12px_rgba(236,72,153,0.3)] transition-transform duration-300"
          priority
        />
      </motion.div>

      {/* Brand Text + Tagline */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={cn(
              'font-sora tracking-tight font-extrabold transition-all duration-300',
              sizeConfig.textSize,
              animate ? 'animate-logo-gradient' : 'text-primary dark:text-white',
              textClassName
            )}
          >
            LearnSphere
          </span>

          {showTagline && (
            <span
              className={cn(
                'font-inter uppercase text-text-muted dark:text-dark-muted font-semibold mt-1 flex items-center gap-1.5',
                sizeConfig.taglineSize
              )}
            >
              <span>Learn Today</span>
              <span className="text-accent font-bold">|</span>
              <span>Grow Tomorrow</span>
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none" aria-label="LearnSphere Home">
        {content}
      </Link>
    )
  }

  return content
}

export default Logo
