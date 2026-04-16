'use client'

import { useState, useEffect } from 'react'
import { Users, GraduationCap, Activity, TrendingUp, Clock, Inbox, Loader2 } from 'lucide-react'
import { StatCard, Card, SectionHeader, Button } from '@/components/ui'
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
        const pending = admissions.filter((a: any) => a.admission_status === 'Documents Pending' || a.admission_status === 'Under Review').length
        const revenue = payments.filter((p: any) => p.status === 'Paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
        setStats({ students: students.length, admissions: admissions.length, enquiries: enquiries.length, admitted, pending, revenue })
        setRecentAdmissions(admissions.slice(0, 5))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const rate = stats.admissions > 0 ? Math.round((stats.admitted / stats.admissions) * 100) : 0

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-txt-muted" /></div>

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
        <Card className="w-full bg-bg-surface border-bg-border p-4 text-left">
          <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-3">Your Account Status</div>
          <div className="flex justify-between py-1.5 border-b border-bg-border"><span className="text-xs text-txt-muted">Role</span><span className="text-xs text-txt-secondary">— Unassigned</span></div>
          <div className="flex justify-between py-1.5"><span className="text-xs text-txt-muted">Branch</span><span className="text-xs text-txt-secondary">— Unassigned</span></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Missing Role/Branch Banner (if partially unassigned) */}
      {(!userContext.role || !userContext.branch_id) && !userContext.is_superuser && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
          <Activity size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-500">Incomplete Profile Assignment</h4>
            <p className="text-xs text-amber-500/80 mt-0.5">
              {!userContext.role ? 'You have not been assigned a role yet.' : 'You have not been assigned to a branch yet.'} Contact your administrator.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Enquiries" value={stats.enquiries.toLocaleString('en-IN')} icon={<Activity size={14} />} delay={0} />
        <StatCard label="Registered Students" value={stats.students.toLocaleString('en-IN')} icon={<Users size={14} />} delay={60} />
        <StatCard label="Total Admissions" value={stats.admissions.toLocaleString('en-IN')} icon={<GraduationCap size={14} />} delay={120} />
        <StatCard label="Admitted" value={stats.admitted.toString()} icon={<GraduationCap size={14} />} delay={180} />
        <StatCard label="Pending" value={stats.pending.toString()} sub="Need action" icon={<Clock size={14} />} delay={240} />
        <StatCard label="Success Rate" value={`${rate}%`} icon={<TrendingUp size={14} />} delay={300} />
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <SectionHeader title="Conversion Funnel" />
        <div className="space-y-3 mt-2">
          {[
            { label: 'Enquiries', value: stats.enquiries, color: 'bg-accent-blue', pct: 100 },
            { label: 'Registered Students', value: stats.students, color: 'bg-accent-cyan', pct: stats.enquiries > 0 ? Math.round((stats.students / stats.enquiries) * 100) : 0 },
            { label: 'Admitted', value: stats.admitted, color: 'bg-accent-green', pct: stats.enquiries > 0 ? Math.round((stats.admitted / stats.enquiries) * 100) : 0 },
          ].map(f => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-txt-secondary">{f.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-txt-primary">{f.value}</span>
                  <span className="text-[10px] text-txt-muted">{f.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                <div className={`h-full rounded-full ${f.color} transition-all duration-700`} style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Admissions */}
      <Card>
        <div className="p-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-txt-primary">Recent Admissions</h3>
          <Button variant="ghost" size="sm">View all</Button>
        </div>
        {recentAdmissions.length > 0 ? (
          <div className="divide-y divide-bg-border/50">
            {recentAdmissions.map((a: any) => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-bg-hover transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-txt-primary">Admission #{a.id}</div>
                  <div className="text-[10px] text-txt-muted font-mono">{a.admission_status}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${a.admission_status === 'Admitted' ? 'text-accent-green bg-accent-green/10 border-accent-green/20' : 'text-accent-blue bg-accent-blue/10 border-accent-blue/20'}`}>{a.admission_status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox size={20} className="text-txt-muted mb-3" />
            <p className="text-sm text-txt-secondary">No admissions yet</p>
            <p className="text-xs text-txt-muted mt-1">Data will appear once admissions are processed.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
