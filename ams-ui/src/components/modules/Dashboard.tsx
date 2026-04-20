'use client'

import { useState, useEffect } from 'react'
import { Users, GraduationCap, Activity, TrendingUp, Clock, Inbox, ChevronRight } from 'lucide-react'
import { StatCard, Card, SectionHeader, Button, AnimatedNumber } from '@/components/ui'
import { studentsApi, admissionsApi, enquiriesApi, paymentsApi } from '@/lib/api'

export function DashboardModule() {
  const [stats, setStats] = useState({ students: 0, admissions: 0, enquiries: 0, admitted: 0, pending: 0, revenue: 0 })
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userContext, setUserContext] = useState<any>({})

  useEffect(() => {
    const usr = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ams_user') || '{}') : {}
    setUserContext(usr)

    const load = async () => {
      try {
        let [students, admissions, enquiries, payments] = await Promise.all([
          studentsApi.list(), admissionsApi.list(), enquiriesApi.list(), paymentsApi.list()
        ])

        if (!usr.is_superuser && usr.branch_id) {
          students = students.filter((s: any) => s.branch === usr.branch_id)
          admissions = admissions.filter((a: any) => a.branch === usr.branch_id)
          enquiries = enquiries.filter((e: any) => e.branch === usr.branch_id)

          const validAdmissions = new Set(admissions.map((a: any) => a.id))
          payments = payments.filter((p: any) => validAdmissions.has(p.admission))
        }

        const admitted = admissions.filter((a: any) => a.admission_status === 'Admitted').length
        const pending = admissions.filter((a: any) => a.admission_status === 'Documents Pending' || a.admission_status === 'Form Completed').length
        const revenue = payments.filter((p: any) => p.status === 'Paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
        setStats({ students: students.length, admissions: admissions.length, enquiries: enquiries.length, admitted, pending, revenue })
        setRecentAdmissions(admissions.slice(0, 5))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const rate = stats.admissions > 0 ? Math.round((stats.admitted / stats.admissions) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="h-[120px] bg-bg-surface border border-bg-border rounded-lg"></div>
            <div className="h-[120px] bg-bg-surface border border-bg-border rounded-lg"></div>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            <div className="h-[120px] bg-bg-surface border border-bg-border rounded-lg"></div>
            <div className="h-[120px] bg-bg-surface border border-bg-border rounded-lg"></div>
            <div className="h-[120px] bg-bg-surface border border-bg-border rounded-lg"></div>
            <div className="h-[120px] bg-bg-surface border border-bg-border rounded-lg"></div>
          </div>
        </div>
        <div className="h-48 bg-bg-surface border border-bg-border rounded-lg"></div>
        <div className="h-64 bg-bg-surface border border-bg-border rounded-lg"></div>
      </div>
    )
  }

  // Display unassigned warning if the user has no role and no branch (and is not superuser)
  if (!userContext.role && !userContext.branch_id && !userContext.is_superuser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Users size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-txt-primary mb-2">Account Inactive</h2>
        <p className="text-sm text-txt-secondary leading-relaxed mb-6">
          You have successfully logged in, but you haven&apos;t been assigned a specific <strong>Role</strong> or <strong>Branch</strong> yet. 
          Please contact your administrator to assign you to a branch so you can access the system.
        </p>
        <Card className="w-full p-5 text-left">
          <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-3">Your Account Status</div>
          <div className="flex justify-between py-1.5 border-b border-bg-border"><span className="text-xs text-txt-muted">Role</span><span className="text-xs text-txt-secondary">— Unassigned</span></div>
          <div className="flex justify-between py-1.5"><span className="text-xs text-txt-muted">Branch</span><span className="text-xs text-txt-secondary">— Unassigned</span></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Missing Role/Branch Banner (if partially unassigned) */}
      {(!userContext.role || !userContext.branch_id) && !userContext.is_superuser && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
          <Activity size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-500">Incomplete Profile Assignment</h4>
            <p className="text-xs text-amber-500/80 mt-0.5">
              {!userContext.role ? 'You have not been assigned a role yet.' : 'You have not been assigned to a branch yet.'} Contact your administrator.
            </p>
          </div>
        </div>
      )}

      {/* Hierarchical KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Primary Metrics (Large) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <StatCard label="Total Admissions" value={stats.admissions.toString()} icon={<GraduationCap size={16} />} delay={0} />
          <StatCard label="Registered Students" value={stats.students.toString()} icon={<Users size={16} />} delay={60} />
        </div>
        
        {/* Secondary Metrics (Grid) */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <StatCard label="Total Enquiries" value={stats.enquiries.toString()} icon={<Activity size={14} />} delay={120} />
          <StatCard label="Admitted" value={stats.admitted.toString()} icon={<GraduationCap size={14} />} delay={180} />
          <StatCard label="Pending Docs" value={stats.pending.toString()} sub="Action required" icon={<Clock size={14} />} delay={240} />
          <StatCard label="Success Rate" value={`${rate}%`} icon={<TrendingUp size={14} />} delay={300} />
        </div>
      </div>

      {/* Step-based Funnel */}
      <Card className="p-6">
        <SectionHeader title="Conversion Funnel" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          {[
            { label: 'Enquiries', value: stats.enquiries, color: 'text-accent-blue', bg: 'bg-accent-blue/10', icon: <Activity size={16} /> },
            { label: 'Admitted', value: stats.admitted, color: 'text-accent-green', bg: 'bg-accent-green/10', icon: <GraduationCap size={16} /> },
          ].map((f, i, arr) => (
            <div key={f.label} className="flex-1 flex items-center w-full">
              <div className="flex-1 flex flex-col items-center text-center p-5 rounded-lg bg-bg-surface border border-bg-border hover:border-bg-border/70 transition-colors shadow-sm">
                <div className={`w-8 h-8 rounded-full ${f.bg} ${f.color} flex items-center justify-center mb-3`}>
                  {f.icon}
                </div>
                <div className="text-3xl font-semibold text-txt-primary font-mono tracking-tight mb-1">
                  <AnimatedNumber value={f.value} />
                </div>
                <div className="text-[11px] font-medium text-txt-muted uppercase tracking-widest">{f.label}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="hidden sm:flex items-center justify-center px-3">
                  <ChevronRight size={24} className="text-txt-muted/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Admissions */}
      <Card className="p-6">
        <SectionHeader title="Recent Admissions" action={<Button variant="ghost" size="sm">View all</Button>} />
        {recentAdmissions.length > 0 ? (
          <div className="mt-2 bg-bg-surface border border-bg-border rounded-lg overflow-hidden">
            <div className="divide-y divide-bg-border/50">
              {recentAdmissions.map((a: any) => (
                <div key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-bg-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-semibold text-xs">
                      {a.student_name ? a.student_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-txt-primary">{a.student_name || `Admission #${a.id}`}</div>
                      <div className="text-[11px] text-txt-muted">{a.course_name || 'Entrance Guidance'}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${a.admission_status === 'Admitted' ? 'text-accent-green bg-accent-green/10 border-accent-green/20' : 'text-accent-blue bg-accent-blue/10 border-accent-blue/20'}`}>
                    {a.admission_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-bg-surface border border-bg-border rounded-lg mt-2">
            <Inbox size={24} className="text-txt-muted/50 mb-3" />
            <p className="text-sm font-medium text-txt-secondary">No admissions yet</p>
            <p className="text-xs text-txt-muted mt-1">Data will appear once admissions are processed.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
