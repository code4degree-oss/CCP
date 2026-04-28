'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { authApi } from '@/lib/api'

// ── Lazy-loaded modules (code-split per route) ──────────────
const LoadingSkeleton = () => <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>

const DashboardModule = dynamic(() => import('@/components/modules/Dashboard').then(m => ({ default: m.DashboardModule })), { loading: LoadingSkeleton })
const StudentsModule = dynamic(() => import('@/components/modules/Students').then(m => ({ default: m.StudentsModule })), { loading: LoadingSkeleton })
const AdmissionsModule = dynamic(() => import('@/components/modules/Admissions').then(m => ({ default: m.AdmissionsModule })), { loading: LoadingSkeleton })
const EnquiriesModule = dynamic(() => import('@/components/modules/Enquiries').then(m => ({ default: m.EnquiriesModule })), { loading: LoadingSkeleton })
const BranchesModule = dynamic(() => import('@/components/modules/Branches').then(m => ({ default: m.BranchesModule })), { loading: LoadingSkeleton })
const UsersModule = dynamic(() => import('@/components/modules/Users').then(m => ({ default: m.UsersModule })), { loading: LoadingSkeleton })
const ReportsModule = dynamic(() => import('@/components/modules/Reports').then(m => ({ default: m.ReportsModule })), { loading: LoadingSkeleton })
const PaymentsModule = dynamic(() => import('@/components/modules/Payments').then(m => ({ default: m.PaymentsModule })), { loading: LoadingSkeleton })
const PlaceholderModule = dynamic(() => import('@/components/modules/Placeholder').then(m => ({ default: m.PlaceholderModule })), { loading: LoadingSkeleton })

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard:     { title: 'Dashboard', subtitle: 'Overview of your admission pipeline' },
  enquiries:     { title: 'Enquiries', subtitle: 'Track and manage student enquiries' },
  students:      { title: 'Students', subtitle: 'Registered student profiles' },
  admissions:    { title: 'Admissions', subtitle: 'Full admission lifecycle management' },
  payments:      { title: 'Payments', subtitle: 'Fee collection and payment tracking' },
  branches:      { title: 'Branches', subtitle: 'Manage your branch network' },
  users:         { title: 'Users & Roles', subtitle: 'Manage branch admins and employees' },
  reports:       { title: 'Reports', subtitle: 'Download comprehensive reports and data' },
  settings:      { title: 'Settings', subtitle: 'System configuration and preferences' },
}

const VALID_PAGES = Object.keys(PAGE_META)

const PLACEHOLDER_META: Record<string, { title: string; description: string }> = {
  settings:   { title: 'Settings', description: 'Configure organization, notification templates, and integrations.' },
}

/* Read active page from URL hash, e.g. /#admissions → 'admissions' */
function getHashPage(): string {
  if (typeof window === 'undefined') return 'dashboard'
  const hash = window.location.hash.replace('#', '')
  return VALID_PAGES.includes(hash) ? hash : 'dashboard'
}

export default function Home() {
  const [active, setActive] = useState(getHashPage)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    authApi.me()
      .then((user) => {
        // If the user must change their password, redirect to login for force-change
        if (user.must_change_password) {
          localStorage.setItem('ams_user', JSON.stringify(user))
          router.replace('/login')
          return
        }
        localStorage.setItem('ams_user', JSON.stringify(user))
        setAuthChecked(true)
      })
      .catch(() => {
        localStorage.removeItem('ams_user')
        router.replace('/login')
      })
  }, [router])

  /* When user clicks sidebar → update hash (creates browser history entry) */
  const handleNavigate = useCallback((page: string) => {
    setActive(page)
    window.location.hash = page
  }, [])

  /* When user clicks browser Back/Forward → update active state */
  useEffect(() => {
    const onHashChange = () => setActive(getHashPage())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
      </div>
    )
  }

  const meta = PAGE_META[active] ?? { title: active }

  // Memoize user context to avoid repeated localStorage parsing on every render
  const userContext = useMemo(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('ams_user') : null
    return userStr ? JSON.parse(userStr) : {}
  }, [authChecked])

  const isEmployee = userContext.role && userContext.role.toLowerCase().includes('employee')

  const renderModule = useCallback(() => {
    if (isEmployee && ['branches', 'users', 'settings'].includes(active)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <Shield size={48} className="text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">You do not have permission to view this module.</p>
        </div>
      )
    }

    switch (active) {
      case 'dashboard':     return <DashboardModule />
      case 'enquiries':     return <EnquiriesModule />
      case 'students':      return <StudentsModule />
      case 'admissions':    return <AdmissionsModule />
      case 'branches':      return <BranchesModule />
      case 'users':         return <UsersModule />
      case 'reports':       return <ReportsModule />
      case 'payments':      return <PaymentsModule />
      default: {
        const p = PLACEHOLDER_META[active]
        return p ? <PlaceholderModule title={p.title} description={p.description} /> : null
      }
    }
  }, [active, isEmployee])

  return (
    <div className="flex h-screen bg-bg-base grid-bg overflow-hidden">
      <Sidebar active={active} onChange={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px] transition-all duration-300">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div className="max-w-[1400px] mx-auto">{renderModule()}</div>
        </main>
      </div>
    </div>
  )
}
