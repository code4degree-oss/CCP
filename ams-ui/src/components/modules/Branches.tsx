'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, X, Loader2, Trash2, Pencil, GraduationCap, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { branchesApi, orgsApi, coursesApi } from '@/lib/api'

/* ── types ───────────────────────────────────────────── */

interface BranchCourse {
  id: number; course: number; course_name: string; stream_name: string; fee_amount: string; is_active: boolean
}

interface Branch {
  id: number; organization: number; name: string; email: string; address: string; is_active: boolean; branch_courses: BranchCourse[]; course_count: number
  manager: number | null; manager_name: string | null
}

interface Org { id: number; name: string }

interface Course { id: number; stream: number; stream_name: string; name: string; is_active: boolean }

interface CourseRow { course_id: string; fee_amount: string }

/* ── component ───────────────────────────────────────── */

export function BranchesModule() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ organization: '', name: '', email: '', address: '' })
  const [courseRows, setCourseRows] = useState<CourseRow[]>([])
  const [error, setError] = useState('')
  const [expandedBranch, setExpandedBranch] = useState<number | null>(null)
  const [userRole, setUserRole] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [b, o, c] = await Promise.all([branchesApi.list(), orgsApi.list(), coursesApi.list()])
      setBranches(b)
      setOrgs(o)
      setCourses(c)
    } catch { setError('Failed to load data') }
    setLoading(false)
  }

  useEffect(() => {
    load()
    try {
      const u = JSON.parse(localStorage.getItem('ams_user') || '{}')
      setUserRole(u.role_name || (u.is_superuser ? 'Super Admin' : ''))
    } catch {}
  }, [])

  /* ── form handlers ── */

  const openNew = () => {
    setEditId(null)
    setForm({ organization: orgs[0]?.id?.toString() || '', name: '', email: '', address: '' })
    setCourseRows([{ course_id: '', fee_amount: '' }])
    setShowForm(true)
    setError('')
  }

  const openEdit = (b: Branch) => {
    setEditId(b.id)
    setForm({ organization: b.organization.toString(), name: b.name, email: b.email || '', address: b.address || '' })
    setCourseRows(
      b.branch_courses?.length
        ? b.branch_courses.map(bc => ({ course_id: bc.course.toString(), fee_amount: bc.fee_amount }))
        : [{ course_id: '', fee_amount: '' }]
    )
    setShowForm(true)
    setError('')
  }

  const addCourseRow = () => setCourseRows(r => [...r, { course_id: '', fee_amount: '' }])
  const removeCourseRow = (i: number) => setCourseRows(r => r.filter((_, idx) => idx !== i))
  const updateCourseRow = (i: number, field: keyof CourseRow, val: string) =>
    setCourseRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const handleSave = async () => {
    if (!form.name) { setError('Name is required'); return }
    if (!form.organization) { setError('An organization is required. Please ensure an Organization exists in the system.'); return }
    // Validate course rows — at least one valid course needed for new branches
    const validCourses = courseRows.filter(r => r.course_id && r.fee_amount)
    if (!editId && validCourses.length === 0) {
      setError('Add at least one course with a fee amount')
      return
    }

    setSaving(true); setError('')
    try {
      const payload: any = { ...form, organization: Number(form.organization), email: form.email || null }
      if (!editId) {
        payload.courses = validCourses.map(r => ({
          course_id: Number(r.course_id),
          fee_amount: r.fee_amount,
        }))
      }

      if (editId) {
        await branchesApi.update(editId, payload)
      } else {
        await branchesApi.create(payload)
      }
      setShowForm(false)
      await load()
    } catch (e: any) { setError(e.message || 'Failed to save') }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this branch?')) return
    try { await branchesApi.remove(id); await load() } catch { setError('Delete failed') }
  }

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  // Group courses by stream for the dropdown
  const coursesByStream = courses.reduce<Record<string, Course[]>>((acc, c) => {
    const stream = c.stream_name || 'Other'
    if (!acc[stream]) acc[stream] = []
    acc[stream].push(c)
    return acc
  }, {})

  // Already-selected course IDs (to prevent duplicates)
  const selectedCourseIds = new Set(courseRows.map(r => r.course_id).filter(Boolean))

  /* ── input class ── */
  const inputCls = 'w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40 transition-colors'
  const labelCls = 'text-[11px] text-txt-muted block mb-1 font-medium'

  const isSuperAdmin = userRole?.toLowerCase() === 'super admin'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-txt-primary">Branches</h2>
          <p className="text-[11px] text-txt-muted mt-0.5">{branches.length} branches configured</p>
        </div>
        {isSuperAdmin && (
          <Button variant="primary" size="sm" onClick={openNew}><Plus size={12} />Add Branch</Button>
        )}
      </div>

      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>
      ) : branches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={32} className="text-txt-muted mb-3 opacity-40" />
          <p className="text-sm text-txt-secondary">No branches yet</p>
          <p className="text-xs text-txt-muted mt-1">Add your first branch to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {branches.map(b => {
            const isExpanded = expandedBranch === b.id
            return (
              <Card key={b.id} className="p-0 hover:border-accent-blue/30 transition-colors overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-accent-blue" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-txt-primary">{b.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Course count badge */}
                    <span className="flex items-center gap-1 text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-full font-medium">
                      <GraduationCap size={10} />
                      {b.course_count || 0} courses
                    </span>
                    <button onClick={() => setExpandedBranch(isExpanded ? null : b.id)} className="p-1.5 rounded hover:bg-bg-hover transition-colors">
                      {isExpanded ? <ChevronUp size={12} className="text-txt-muted" /> : <ChevronDown size={12} className="text-txt-muted" />}
                    </button>
                    {isSuperAdmin && (
                      <>
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-bg-hover transition-colors"><Pencil size={12} className="text-txt-muted" /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors"><Trash2 size={12} className="text-red-400" /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Info row */}
                <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px]">
                  <div className="flex justify-between sm:flex-col"><span className="text-txt-muted">Login ID</span><span className="text-txt-secondary">{b.email || '—'}</span></div>
                  <div className="flex justify-between sm:flex-col"><span className="text-txt-muted">Branch Admin</span><span className="text-txt-secondary">{b.manager_name || 'Not assigned'}</span></div>
                  {b.address && <div className="flex justify-between sm:flex-col col-span-2"><span className="text-txt-muted">Address</span><span className="text-txt-secondary">{b.address}</span></div>}
                </div>

                {/* Expandable courses */}
                {isExpanded && b.branch_courses && b.branch_courses.length > 0 && (
                  <div className="border-t border-bg-border">
                    <div className="px-4 py-2.5 bg-bg-base/50">
                      <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-2">Courses &amp; Fee Structure</div>
                      <div className="space-y-1.5">
                        {b.branch_courses.map(bc => (
                          <div key={bc.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-bg-surface border border-bg-border">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple font-semibold">{bc.stream_name}</span>
                              <span className="text-xs text-txt-primary">{bc.course_name}</span>
                            </div>
                            <span className="text-xs font-semibold text-emerald-400 font-mono flex items-center gap-0.5">
                              <IndianRupee size={10} />
                              {Number(bc.fee_amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ═══════════ CREATE/EDIT MODAL ═══════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="bg-bg-surface border border-bg-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-txt-primary">{editId ? 'Edit Branch' : 'Add New Branch'}</h3>
              <button onClick={() => setShowForm(false)} className="text-txt-muted hover:text-txt-primary transition-colors"><X size={16} /></button>
            </div>

            {/* Branch Info Section */}
            <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-3">Branch Information</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {orgs.length > 0 && (
                <div className="col-span-2">
                  <label className={labelCls}>Organization</label>
                  <select value={form.organization} onChange={e => set('organization', e.target.value)} className={inputCls}>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2"><label className={labelCls}>Branch Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Latur Branch" /></div>
              <div className="col-span-2"><label className={labelCls}>Branch Address (for receipts)</label><textarea value={form.address} onChange={e => set('address', e.target.value)} className={inputCls + ' min-h-[60px]'} placeholder="Full address that will appear on fee receipts" rows={2} /></div>
              {editId && <div><label className={labelCls}>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="branch@CCP.com" /></div>}
            </div>

            {/* Courses & Fees Section */}
            <div className="border-t border-bg-border pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider">Courses &amp; Fee Structure</div>
                  <div className="text-[10px] text-txt-muted mt-0.5">Select courses and set fees specific to this branch</div>
                </div>
                <button onClick={addCourseRow} className="flex items-center gap-1 text-[11px] text-accent-blue hover:text-accent-blue/80 font-medium transition-colors">
                  <Plus size={12} /> Add Course
                </button>
              </div>

              <div className="space-y-2">
                {courseRows.map((row, i) => (
                  <div key={i} className="flex items-end gap-2">
                    {/* Course select */}
                    <div className="flex-1">
                      {i === 0 && <label className={labelCls}>Course</label>}
                      <select
                        value={row.course_id}
                        onChange={e => updateCourseRow(i, 'course_id', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select a course...</option>
                        {Object.entries(coursesByStream).map(([stream, streamCourses]) => (
                          <optgroup key={stream} label={stream}>
                            {streamCourses.map(c => (
                              <option key={c.id} value={c.id} disabled={selectedCourseIds.has(c.id.toString()) && row.course_id !== c.id.toString()}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    {/* Fee input */}
                    <div className="w-[140px]">
                      {i === 0 && <label className={labelCls}>Fee Amount (₹)</label>}
                      <input
                        type="number"
                        value={row.fee_amount}
                        onChange={e => updateCourseRow(i, 'fee_amount', e.target.value)}
                        className={inputCls}
                        placeholder="50000"
                        min="0"
                      />
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeCourseRow(i)}
                      className="p-2 rounded hover:bg-red-500/10 transition-colors mb-[1px]"
                      disabled={courseRows.length === 1}
                    >
                      <Trash2 size={13} className={courseRows.length === 1 ? 'text-txt-muted/30' : 'text-red-400'} />
                    </button>
                  </div>
                ))}
              </div>
            </div>


            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                {editId ? 'Update' : 'Create Branch'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
