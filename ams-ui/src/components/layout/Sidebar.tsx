'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Users, UserCheck, GraduationCap, CreditCard,
  Building2, BookOpen, Settings, ChevronRight,
  LogOut, Menu, X, FileSpreadsheet
} from 'lucide-react'
import clsx from 'clsx'
import { authApi } from '@/lib/api'

interface NavItem {
  label: string
  icon: React.ElementType
  id: string
  badge?: number
  children?: { label: string; id: string }[]
}

const BASE_NAV: NavItem[] = [
  { label: 'Dashboard',   icon: LayoutDashboard, id: 'dashboard' },
  { label: 'Enquiries',   icon: BookOpen,         id: 'enquiries' },
  { label: 'Students',    icon: Users,            id: 'students' },
  { label: 'Admissions',  icon: GraduationCap,    id: 'admissions' },
  { label: 'Payments',    icon: CreditCard,       id: 'payments' },
  { label: 'Reports',     icon: FileSpreadsheet,  id: 'reports' },
]

const ADMIN_NAV: NavItem[] = [
  ...BASE_NAV,
  { label: 'Branches',    icon: Building2,        id: 'branches' },
  { label: 'Users / Employees', icon: UserCheck, id: 'users' },
  { label: 'Settings',    icon: Settings,         id: 'settings' },
]

interface SidebarProps {
  active: string
  onChange: (id: string) => void
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-bg-card border border-bg-border rounded p-2 text-txt-secondary hover:text-txt-primary transition-colors"
        onClick={() => setMobileOpen(v => !v)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen z-40 flex flex-col bg-bg-surface border-r border-bg-border transition-all duration-300 ease-in-out',
          collapsed ? 'w-[60px]' : 'w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx('flex items-center h-14 px-4 border-b border-bg-border shrink-0 justify-center overflow-hidden')}>
          <span className="font-bold text-[17px] tracking-wide text-txt-primary truncate">
            {collapsed ? 'CCP' : 'Chanakya Career Point'}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {(() => {
             const userStr = typeof window !== 'undefined' ? localStorage.getItem('ams_user') : null
             const user = userStr ? JSON.parse(userStr) : {}
             const isEmployee = user.role && user.role.toLowerCase().includes('employee')
             const navItems = isEmployee ? BASE_NAV : ADMIN_NAV
             return navItems.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onChange(item.id); setMobileOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 group relative',
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue font-medium border-r-2 border-accent-blue rounded-r-none'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className={clsx('shrink-0', isActive ? 'text-accent-blue' : 'text-txt-muted group-hover:text-txt-secondary')} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge != null && (
                      <span className="text-[10px] bg-accent-blue/15 text-accent-blue px-1.5 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge != null && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-blue" />
                )}
              </button>
            )
          })})()}
        </nav>

        {/* Bottom */}
        <div className={clsx('border-t border-bg-border px-2 py-3 space-y-1 shrink-0')}>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded text-xs text-txt-muted hover:text-txt-secondary hover:bg-bg-hover transition-colors"
          >
            <ChevronRight size={14} className={clsx('transition-transform duration-300', collapsed ? 'rotate-0' : 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* User */}
          <div className={clsx('flex items-center gap-2.5 px-2 py-2 rounded', collapsed && 'justify-center')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
              {(() => { try { const u = JSON.parse(localStorage.getItem('ams_user') || '{}'); return u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U' } catch { return 'U' } })()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-txt-primary truncate">{(() => { try { return JSON.parse(localStorage.getItem('ams_user') || '{}').full_name || 'User' } catch { return 'User' } })()}</div>
                <div className="text-[10px] text-txt-muted truncate">{(() => { try { const u = JSON.parse(localStorage.getItem('ams_user') || '{}'); return u.role || u.role_name || (u.is_superuser ? 'Super Admin' : 'Staff') } catch { return 'Staff' } })()}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={async () => {
                try {
                  await authApi.logout()
                } catch (err) {
                  console.error('Logout failed', err)
                }
                localStorage.removeItem('ams_user')
                document.cookie = 'sessionid=; Max-Age=0; path=/;'
                document.cookie = 'csrftoken=; Max-Age=0; path=/;'
                window.location.replace('/login')
              }} className="text-txt-muted hover:text-txt-secondary transition-colors" title="Logout">
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
