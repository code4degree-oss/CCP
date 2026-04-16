'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { authApi } from '@/lib/api'
import { DashboardModule } from '@/components/modules/Dashboard'
import { StudentsModule } from '@/components/modules/Students'
import { AdmissionsModule } from '@/components/modules/Admissions'
import { EnquiriesModule } from '@/components/modules/Enquiries'
import { BranchesModule } from '@/components/modules/Branches'
import { UsersModule } from '@/components/modules/Users'
import { PlaceholderModule } from '@/components/modules/Placeholder'

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  dashboard:     { title: 'Dashboard', subtitle: 'Overview of your admission pipeline' },
  enquiries:     { title: 'Enquiries', subtitle: 'Track and manage student enquiries' },
  students:      { title: 'Students', subtitle: 'Registered student profiles' },
  admissions:    { title: 'Admissions', subtitle: 'Full admission lifecycle management' },
  payments:      { title: 'Payments', subtitle: 'Fee collection and payment tracking' },
  branches:      { title: 'Branches', subtitle: 'Manage your branch network' },
  users:         { title: 'Users & Roles', subtitle: 'Manage branch admins and employees' },
  settings:      { title: 'Settings', subtitle: 'System configuration and preferences' },
}

const PLACEHOLDER_META: Record<string, { title: string; description: string }> = {
  payments:   { title: 'Payments', description: 'View fee collection, payment history, and pending dues.' },
  settings:   { title: 'Settings', description: 'Configure organization, notification templates, and integrations.' },
}

export default function Home() {
  const [active, setActive] = useState('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    authApi.me()
      .then((user) => {
        localStorage.setItem('ams_user', JSON.stringify(user))
        setAuthChecked(true)
      })
      .catch(() => {
        localStorage.removeItem('ams_user')
        router.replace('/login')
      })
  }, [router])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
      </div>
    )
  }

  const meta = PAGE_META[active] ?? { title: active }

  function renderModule() {
    switch (active) {
      case 'dashboard':     return <DashboardModule />
      case 'enquiries':     return <EnquiriesModule />
      case 'students':      return <StudentsModule />
      case 'admissions':    return <AdmissionsModule />
      case 'branches':      return <BranchesModule />
      case 'users':         return <UsersModule />
      default: {
        const p = PLACEHOLDER_META[active]
        return p ? <PlaceholderModule title={p.title} description={p.description} /> : null
      }
    }
  }

  return (
    <div className="flex h-screen bg-bg-base grid-bg overflow-hidden">
      <Sidebar active={active} onChange={setActive} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px] transition-all duration-300">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div className="max-w-[1400px] mx-auto">{renderModule()}</div>
        </main>
      </div>
    </div>
  )
}
