'use client'

import { Search, Bell, Command } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="h-14 border-b border-bg-border bg-bg-surface/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="flex-1">
        <h1 className="text-[15.5px] font-bold text-black dark:text-white">{title}</h1>
        {subtitle && <p className="text-[12.5px] font-medium text-gray-800 dark:text-gray-300">{subtitle}</p>}
      </div>

      {/* Notifications */}
      <button className="relative w-8 h-8 rounded bg-bg-card border border-bg-border flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:border-bg-border/80 transition-colors">
        <Bell size={14} />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse-dot" />
      </button>

      {/* Date */}
      <div className="hidden lg:block text-[11px] text-txt-muted font-mono border-l border-bg-border pl-4">
        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </header>
  )
}
