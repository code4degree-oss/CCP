'use client'

import { useState, useEffect } from 'react'
import { Plus, Download, Inbox, Loader2, Pencil, FileText, Printer } from 'lucide-react'
import { Card, Button, Table } from '@/components/ui'
import { admissionsApi, studentsApi, branchesApi, streamsApi } from '@/lib/api'
import { AdmissionWizard } from './AdmissionWizard'
import { PrintAdmissionForm } from './PrintAdmissionForm'
import clsx from 'clsx'

interface AdmRow {
  id: number; admission_number?: string; student: number; student_name?: string; branch: number; branch_name?: string; stream: number; stream_name?: string; admission_status: string; manager: number; manager_name?: string; admitted_at: string | null; created_at: string; info_verified?: boolean; consent_given?: boolean; is_finalized?: boolean
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Documents Pending', value: 'Documents Pending' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Admitted', value: 'Admitted' },
  { label: 'Rejected', value: 'Rejected' },
]

export function AdmissionsModule() {
  const [admissions, setAdmissions] = useState<AdmRow[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [streams, setStreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')

  // View management: 'list' | 'new' | 'edit' | 'print'
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'print'>('list')
  const [editAdmission, setEditAdmission] = useState<any>(null)
  const [printAdmission, setPrintAdmission] = useState<any>(null)
  const [printLoading, setPrintLoading] = useState(false)

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('ams_user') : null
  const user = userStr ? JSON.parse(userStr) : {}
  const isEmployee = user.role && user.role.toLowerCase().includes('employee')
  const isSuper = user.is_superuser || (user.role && user.role.toLowerCase().includes('super'))

  const load = async () => {
    setLoading(true)
    try {
      const [a, s, b, st] = await Promise.all([
        admissionsApi.list(), 
        studentsApi.list(), branchesApi.list(), streamsApi.list()
      ])
      setAdmissions(a); setStudents(s); setBranches(b); setStreams(st)
    } catch { setError('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Listen for print event from AdmissionWizard
  useEffect(() => {
    const handlePrintEvent = () => {
      const data = sessionStorage.getItem('ams_print_admission')
      if (data) {
        setPrintAdmission(JSON.parse(data))
        sessionStorage.removeItem('ams_print_admission')
        setView('print')
      }
    }
    window.addEventListener('ams-print-admission', handlePrintEvent)
    return () => window.removeEventListener('ams-print-admission', handlePrintEvent)
  }, [])

  const getName = (list: any[], id: number, key = 'name') => list.find(i => i.id === id)?.[key] || '—'

  const filtered = admissions.filter(a => statusFilter === 'all' || a.admission_status === statusFilter)

  const openNew = () => {
    setEditAdmission(null)
    setView('new')
  }

  const openEdit = (a: any) => {
    setEditAdmission(a)
    setView('edit')
  }

  const openPrint = async (a: any) => {
    setPrintLoading(true)
    try {
      // Fetch full admission detail (includes student_detail with academic/demographic JSON + payments)
      const fullData = await admissionsApi.get(a.id)
      setPrintAdmission(fullData)
      setView('print')
    } catch (e) {
      setError('Failed to load admission details for print')
    }
    setPrintLoading(false)
  }

  const handleBack = () => {
    setView('list')
    setEditAdmission(null)
    setPrintAdmission(null)
    load() // reload list
  }

  const statusColor = (s: string) => {
    if (s === 'Admitted') return 'text-accent-green bg-accent-green/10 border-accent-green/20'
    if (s === 'Rejected') return 'text-red-400 bg-red-400/10 border-red-400/20'
    if (s === 'Under Review') return 'text-accent-amber bg-accent-amber/10 border-accent-amber/20'
    return 'text-accent-blue bg-accent-blue/10 border-accent-blue/20'
  }

  const columns = [
    { key: 'admission_number', label: 'Admission #', render: (r: AdmRow) => <span className="font-mono text-[11px] font-semibold text-blue-600">{r.admission_number || `#${r.id}`}</span> },
    { key: 'student', label: 'Student', render: (r: AdmRow) => <span className="text-xs font-medium text-txt-primary">{r.student_name || getName(students, r.student, 'full_name')}</span> },
    { key: 'branch', label: 'Branch', render: (r: AdmRow) => <span className="text-xs text-txt-secondary">{getName(branches, r.branch)}</span> },
    { key: 'stream', label: 'Stream', render: (r: AdmRow) => <span className="text-xs text-txt-secondary">{r.stream ? getName(streams, r.stream) : '—'}</span> },
    { key: 'filled_by', label: 'Filled By', render: (r: AdmRow) => (
      <span className="text-[11px] text-txt-secondary">{r.manager_name || '—'}</span>
    )},
    { key: 'status', label: 'Status', render: (r: AdmRow) => <span className={clsx('text-[11px] px-2 py-0.5 rounded border font-medium', statusColor(r.admission_status))}>{r.admission_status}</span> },
    { key: 'finalized', label: '', render: (r: AdmRow) => r.is_finalized 
      ? <span className="text-[10px] bg-accent-green/10 text-accent-green border border-accent-green/20 px-1.5 py-0.5 rounded font-medium">Final</span>
      : <span className="text-[10px] bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-1.5 py-0.5 rounded font-medium">Draft</span>
    },
    { key: 'actions', label: '', render: (r: AdmRow) => {
      const lockEdit = r.is_finalized && isEmployee;
      return (
        <div className="flex justify-end gap-2">
          {r.is_finalized && (
            <button onClick={(e) => { e.stopPropagation(); openPrint(r) }} className="p-1.5 rounded hover:bg-bg-hover text-accent-blue border border-accent-blue/20 bg-accent-blue/5 transition-colors flex items-center gap-1 text-[10px] font-medium" title="Print Full Form">
              <Printer size={12} /> Print
            </button>
          )}
          {!lockEdit && (
            <button onClick={(e) => { e.stopPropagation(); openEdit(r) }} className="p-1.5 rounded hover:bg-bg-hover text-txt-muted transition-colors flex items-center gap-1 text-[10px]" title="Complete Profile">
              <FileText size={12} /> {r.is_finalized ? '' : 'Complete'}
            </button>
          )}
        </div>
      )
    }},
  ]

  // ── PRINT VIEW ──
  if (view === 'print' && printAdmission) {
    return <PrintAdmissionForm admission={printAdmission} onClose={handleBack} />
  }

  // ── WIZARD VIEW ──
  if (view === 'new' || view === 'edit') {
    return <AdmissionWizard onBack={handleBack} editAdmission={editAdmission} />
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-txt-primary">Admissions</h2>
          <p className="text-[11px] text-txt-muted mt-0.5">{admissions.length} total · {admissions.filter(a => a.admission_status === 'Admitted').length} admitted</p>
        </div>
        {!isSuper && <Button variant="primary" size="sm" onClick={openNew}><Plus size={12} />New Admission</Button>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)} className={clsx('px-3 py-1.5 rounded text-xs font-medium transition-colors border', statusFilter === f.value ? 'bg-accent-blue text-white border-accent-blue' : 'bg-bg-card border-bg-border text-txt-secondary hover:text-txt-primary')}>{f.label}</button>
        ))}
      </div>

      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</div>}

      {/* Print loading overlay */}
      {printLoading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-xl">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Loading admission details...</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>
      ) : (
        <Card>
          {admissions.length > 0 ? (
            <Table columns={columns} data={filtered} keyField="id" />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox size={24} className="text-txt-muted mb-3" />
              <h4 className="text-sm font-medium text-txt-secondary">No admissions recorded</h4>
              <p className="text-xs text-txt-muted mt-1">Click &quot;New Admission&quot; to process a student.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
