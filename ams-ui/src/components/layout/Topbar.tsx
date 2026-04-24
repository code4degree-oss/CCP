'use client'

import { Search, Command } from 'lucide-react'

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

      {/* Date */}
      <div className="hidden lg:block text-[11px] text-txt-muted font-mono border-l border-bg-border pl-4">
        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </header>
  )
}
