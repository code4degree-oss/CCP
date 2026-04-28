'use client'

import { useState, useEffect } from 'react'
import { Search, Inbox, Loader2, Trash2 } from 'lucide-react'
import { Card, Button, Table } from '@/components/ui'
import { studentsApi, branchesApi } from '@/lib/api'

interface StudentRow {
  id: number; enrollment_no: string; full_name: string; mobile: string; email: string; branch: number; branch_name?: string; category: string; gender: string; neet_rank: number | null; neet_marks: number | null; academic_details: any; created_at: string; is_entrance_only?: boolean; course_names?: string[];
}

export function StudentsModule() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [error, setError] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ams_user') || '{}') : {}
  const canDeleteStudents = currentUser.is_superuser || currentUser.role?.toLowerCase().includes('admin')


  const load = async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([studentsApi.list(), branchesApi.list()])
      setStudents(s)
      setBranches(b)
    } catch { setError('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const confirmDelete = (id: number) => {
    setDeleteDialog(id)
    setDeleteConfirmText('')
  }

  const executeDelete = async () => {
    if (deleteDialog && deleteConfirmText === 'delete') {
      try {
        await studentsApi.remove(deleteDialog)
        setDeleteDialog(null)
        setDeleteConfirmText('')
        await load()
      } catch(e) { setError('Failed to delete student') }
    }
  }


  const branchName = (id: number) => branches.find((b: any) => b.id === id)?.name || '—'

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_no?.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile?.includes(search);
    const matchBranch = branchFilter === 'all' || s.branch?.toString() === branchFilter;
    const matchCourse = courseFilter === 'all' || (s.course_names && s.course_names.includes(courseFilter));
    return matchSearch && matchBranch && matchCourse;
  })

  const uniqueCourses = Array.from(new Set(students.flatMap(s => s.course_names || [])))

  const columns = [
    { key: 'full_name', label: 'Student', render: (r: StudentRow) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-green/20 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-blue-100">
          {r.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <div className="font-semibold text-txt-primary text-xs">{r.full_name}</div>
          <div className="text-[10px] text-txt-muted">{r.mobile} {r.email ? `• ${r.email}` : ''}</div>
        </div>
      </div>
    )},
    { key: 'branch', label: 'Branch', render: (r: StudentRow) => <span className="text-xs text-txt-secondary">{branchName(r.branch)}</span> },
    { key: 'demographics', label: 'Profile', render: (r: StudentRow) => {
      if (r.is_entrance_only) return <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">Completed</span>
      if (!r.category && !r.gender) return <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md font-medium">Incomplete</span>
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.gender && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r.gender}</span>}
          {r.category && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">{r.category}</span>}
        </div>
      )
    }},
    { key: 'academic', label: 'Exams', render: (r: StudentRow) => {
      const acad = r.academic_details || {}
      const hasNeet = r.neet_marks || acad.neet_marks
      const hasJee = acad.jee_percentile || acad.jee_rank
      
      if (!hasNeet && !hasJee) return <span className="text-[10px] text-txt-muted italic">Not updated</span>
      
      return (
        <div className="flex flex-col gap-1">
          {hasNeet ? <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 inline-block w-fit">NEET: {r.neet_marks || acad.neet_marks}</span> : null}
          {hasJee ? <span className="text-[10px] font-medium text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 inline-block w-fit">JEE: {acad.jee_percentile ? `${acad.jee_percentile}%ile` : `Rank ${acad.jee_rank}`}</span> : null}
        </div>
      )
    }},
    { key: 'registered', label: 'Registered', render: (r: StudentRow) => <span className="text-[11px] font-mono text-txt-muted">{new Date(r.created_at).toLocaleDateString('en-IN')}</span> },
    { key: 'actions', label: '', render: (r: StudentRow) => (
      <div className="flex justify-end gap-2">
         {canDeleteStudents && (
           <button onClick={(e) => { e.stopPropagation(); confirmDelete(r.id) }} className="p-1.5 rounded hover:bg-bg-hover text-red-500 transition-colors" title="Delete"><Trash2 size={12} /></button>
         )}
      </div>
    )}
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-txt-primary">Student Registry</h2>
          <p className="text-[11px] text-txt-muted mt-0.5">{students.length} registered students</p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, mobile, enrollment #..." className="w-full bg-bg-card border border-bg-border rounded pl-8 pr-4 py-1.5 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-blue/40 transition-colors" />
        </div>
        <div className="flex items-center gap-3">
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="bg-bg-card border border-bg-border rounded px-3 py-1.5 text-xs text-txt-primary outline-none focus:border-accent-blue/40">
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id.toString()}>{b.name}</option>)}
          </select>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="bg-bg-card border border-bg-border rounded px-3 py-1.5 text-xs text-txt-primary outline-none focus:border-accent-blue/40 max-w-xs truncate">
            <option value="all">All Courses</option>
            {uniqueCourses.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
          </select>
        </div>
      </div>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>
      ) : (
        <Card>
          {students.length > 0 ? (
            <Table columns={columns} data={filtered} keyField="id" />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox size={24} className="text-txt-muted mb-3" />
              <h4 className="text-sm font-medium text-txt-secondary">No students registered</h4>
              <p className="text-xs text-txt-muted mt-1">Students will appear here once their admissions are complete.</p>
            </div>
          )}
        </Card>
      )}

      {deleteDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-bg-card rounded-lg border border-bg-border w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2"><Trash2 size={18} /> Delete Student</h3>
            <p className="text-xs text-txt-secondary mb-4">This action cannot be undone. All data regarding this student and their admissions will be lost. To confirm, type <strong className="text-txt-primary select-none font-mono">delete</strong> below.</p>
            <input 
              value={deleteConfirmText} 
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-sm text-txt-primary mb-5 outline-none focus:border-red-500/50"
              placeholder="Type delete"
              autoComplete="off"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setDeleteDialog(null); setDeleteConfirmText('') }}>Cancel</Button>
              <Button variant="primary" className="bg-red-500 border-red-600 text-white hover:bg-red-600 outline-none hover:shadow-lg shadow-red-500/30" disabled={deleteConfirmText !== 'delete'} onClick={executeDelete}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
