import clsx from 'clsx'
import { useState, useEffect } from 'react'
import type { AdmissionStatus, LeadStatus, PaymentStatus, Channel } from '@/types'

// ─── Badge ───────────────────────────────────────────────────────────────────

const statusMap: Record<string, string> = {
  admitted:      'status-admitted',
  paid:          'status-admitted',
  delivered:     'status-admitted',
  converted:     'status-converted',
  contacted:     'status-review',
  review:        'status-review',
  interested:    'status-review',
  new:           'status-lead',
  draft:         'status-lead',
  pending:       'status-pending',
  pending_docs:  'status-pending',
  not_interested:'status-rejected',
  lost:          'status-rejected',
  rejected:      'status-rejected',
  failed:        'status-rejected',
}

const channelMap: Record<string, string> = {
  whatsapp: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  sms:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  email:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

interface BadgeProps {
  status?: string
  channel?: Channel
  className?: string
}

export function Badge({ status, channel, className }: BadgeProps) {
  if (channel) {
    return (
      <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border uppercase', channelMap[channel], className)}>
        {channel}
      </span>
    )
  }
  const cls = status ? (statusMap[status] ?? 'status-pending') : 'status-pending'
  const label = status?.replace(/_/g, ' ') ?? '—'
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border capitalize', cls, className)}>
      {label}
    </span>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export function Button({ variant = 'secondary', size = 'md', className, children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent-blue/50'
  const sizes = { sm: 'text-xs px-2.5 py-1.5', md: 'text-sm px-3.5 py-2' }
  const variants = {
    primary:   'bg-accent-blue text-white hover:bg-accent-blue-dim shadow-glow/30 hover:shadow-glow',
    secondary: 'bg-bg-card border border-bg-border text-txt-secondary hover:text-txt-primary hover:border-bg-border/70',
    ghost:     'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover',
    danger:    'bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/20',
  }
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ children, className, glow, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-bg-card border border-bg-border rounded-lg hover:shadow-md transition-shadow duration-200',
        glow && 'shadow-glow/10 hover:shadow-glow/20',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: { value: string; up: boolean }
  accent?: string
  icon: React.ReactNode
  delay?: number
}

export function StatCard({ label, value, sub, trend, icon, delay = 0 }: StatCardProps) {
  // Extract number from string if needed (e.g. "100%")
  const numericMatch = String(value).match(/[\d,]+/)
  const isPercent = String(value).includes('%')
  const numValue = numericMatch ? parseInt(numericMatch[0].replace(/,/g, ''), 10) : 0

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between animate-slide-in h-full" style={{ animationDelay: `${delay}ms` } as React.CSSProperties}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-txt-muted uppercase tracking-widest">{label}</span>
        <span className="w-7 h-7 rounded bg-bg-hover flex items-center justify-center text-txt-secondary">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-semibold text-txt-primary font-mono tracking-tight">
          {typeof value === 'string' && !numericMatch ? value : <AnimatedNumber value={numValue} suffix={isPercent ? '%' : ''} />}
        </div>
        {sub && <div className="text-[11px] text-txt-muted mt-0.5">{sub}</div>}
        {trend && (
          <div className={clsx('text-[11px] mt-2 font-medium', trend.up ? 'text-accent-green' : 'text-accent-red')}>
            {trend.up ? '↑' : '↓'} {trend.value}
            <span className="text-txt-muted font-normal ml-1">vs last month</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Animated Number ─────────────────────────────────────────────────────────

export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (value === 0) return setCurrent(0)
    let start = 0
    const duration = 800 // ms
    const increment = value / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCurrent(value)
        clearInterval(timer)
      } else {
        setCurrent(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <>{current.toLocaleString('en-IN')}{suffix}</>
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (row: T) => void
}

export function Table<T>({ columns, data, keyField, onRowClick }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border">
            {columns.map(col => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-txt-muted',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.width
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr 
              key={String(row[keyField])} 
              className={clsx('tbl-row border-b border-bg-border/50 group', onRowClick && 'cursor-pointer hover:bg-bg-hover')}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-xs text-txt-secondary',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  )}
                >
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-txt-muted text-sm">
      <div className="text-3xl mb-2 opacity-30">∅</div>
      {message}
    </div>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-txt-primary tracking-tight">{title}</h2>
      {action}
    </div>
  )
}

// ─── Dot ─────────────────────────────────────────────────────────────────────

export function Dot({ color = 'bg-txt-muted' }: { color?: string }) {
  return <span className={clsx('inline-block w-1.5 h-1.5 rounded-full', color)} />
}
