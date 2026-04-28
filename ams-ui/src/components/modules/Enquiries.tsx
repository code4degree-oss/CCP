'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Inbox, Loader2, X, Phone } from 'lucide-react'
import { Card, Button, Table } from '@/components/ui'
import { enquiriesApi, branchesApi } from '@/lib/api'

interface EnqRow {
  id: number; full_name: string; mobile: string; parent_mobile: string; branch: number; counselor: number; counselor_name: string | null; course_interest: string; source: string; category: string; neet_expected_marks: number | null; created_at: string
}

export function EnquiriesModule() {
  const [enquiries, setEnquiries] = useState<EnqRow[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', mobile: '', parent_mobile: '', mother_name: '', gender: '', dob: '', branch: '', category: '', candidate_type: '', hsc_percentage: '', neet_application_no: '', neet_roll_no: '', neet_expected_marks: '', course_interest: '', tuition_name: '', reference_name: '', source: '' })

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ams_user') || '{}') : {}
  const isSuper = currentUser.is_superuser || currentUser.role === 'Super Admin'

  const load = async () => {
    setLoading(true)
    try {
      const [e, b] = await Promise.all([enquiriesApi.list(), branchesApi.list()])
      setEnquiries(e); setBranches(b)
    } catch { setError('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const branchName = (id: number) => branches.find((b: any) => b.id === id)?.name || '—'

  const handleSave = async () => {
    if (!form.full_name || !form.mobile || !form.branch) { setError('Name, Mobile, and Branch are required'); return }
    setSaving(true); setError('')
    try {
      await enquiriesApi.create({
        ...form,
        branch: Number(form.branch),
        hsc_percentage: form.hsc_percentage ? Number(form.hsc_percentage) : null,
        neet_expected_marks: form.neet_expected_marks ? Number(form.neet_expected_marks) : null,
      })
      setShowForm(false)
      setForm({ full_name: '', mobile: '', parent_mobile: '', mother_name: '', gender: '', dob: '', branch: !isSuper && currentUser.branch_id ? currentUser.branch_id.toString() : '', category: '', candidate_type: '', hsc_percentage: '', neet_application_no: '', neet_roll_no: '', neet_expected_marks: '', course_interest: '', tuition_name: '', reference_name: '', source: '' })
      await load()
    } catch (e: any) { setError(e.message || 'Save failed') }
    setSaving(false)
  }

  const filtered = enquiries.filter(e =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.mobile?.includes(search)
  )

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const columns = [
    { key: 'id', label: '#', render: (r: EnqRow) => <span className="font-mono text-[11px] text-txt-muted">{r.id}</span> },
    { key: 'full_name', label: 'Name', render: (r: EnqRow) => <span className="text-xs font-medium text-txt-primary">{r.full_name}</span> },
    { key: 'mobile', label: 'Mobile', render: (r: EnqRow) => <span className="font-mono text-[11px] text-txt-secondary">{r.mobile}</span> },
    { key: 'branch', label: 'Branch', render: (r: EnqRow) => <span className="text-xs text-txt-secondary">{branchName(r.branch)}</span> },
    { key: 'filled_by', label: 'Filled By', render: (r: EnqRow) => <span className="text-[11px] text-txt-secondary">{r.counselor_name || '—'}</span> },
    { key: 'course_interest', label: 'Course Interest', render: (r: EnqRow) => <span className="text-xs text-txt-secondary">{r.course_interest || '—'}</span> },
    { key: 'source', label: 'Source', render: (r: EnqRow) => r.source ? <span className="text-[11px] bg-bg-hover border border-bg-border text-txt-secondary px-2 py-0.5 rounded">{r.source}</span> : <span className="text-txt-muted">—</span> },
    { key: 'neet', label: 'Expected NEET', render: (r: EnqRow) => r.neet_expected_marks ? <span className="font-mono text-[11px] text-txt-primary">{r.neet_expected_marks}</span> : <span className="text-txt-muted">—</span> },
    { key: 'created_at', label: 'Date', render: (r: EnqRow) => <span className="text-[11px] font-mono text-txt-muted">{new Date(r.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-txt-primary">Enquiries</h2>
          <p className="text-[11px] text-txt-muted mt-0.5">{enquiries.length} total enquiries</p>
        </div>
        {!isSuper && <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setError(''); setForm(f => ({ ...f, branch: currentUser.branch_id ? currentUser.branch_id.toString() : '' })) }}><Plus size={12} />New Enquiry</Button>}
      </div>

      <div className="relative w-72">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or mobile…" className="w-full bg-bg-card border border-bg-border rounded pl-8 pr-4 py-1.5 text-xs text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-blue/40 transition-colors" />
      </div>

      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>
      ) : (
        <Card>
          {enquiries.length > 0 ? (
            <Table columns={columns} data={filtered} keyField="id" onRowClick={(row) => window.open(`/enquiries/${row.id}`, '_blank')} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Phone size={24} className="text-txt-muted mb-3" />
              <h4 className="text-sm font-medium text-txt-secondary">No enquiries yet</h4>
              <p className="text-xs text-txt-muted mt-1">Click &quot;New Enquiry&quot; to log a student enquiry.</p>
            </div>
          )}
        </Card>
      )}

      {/* ADD ENQUIRY MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="bg-bg-surface border border-bg-border rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-txt-primary">New Enquiry</h3>
              <button onClick={() => setShowForm(false)} className="text-txt-muted hover:text-txt-primary"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-[11px] text-txt-muted block mb-1">Full Name *</label><input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Mobile *</label><input value={form.mobile} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); set('mobile', v) }} inputMode="numeric" maxLength={10} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Parent Mobile</label><input value={form.parent_mobile} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); set('parent_mobile', v) }} inputMode="numeric" maxLength={10} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Mother Name</label><input value={form.mother_name} onChange={e => set('mother_name', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div>
                <label className="text-[11px] text-txt-muted block mb-1">Branch *</label>
                <select value={form.branch} onChange={e => set('branch', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40">
                  <option value="">Select branch</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-txt-muted block mb-1">Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40">
                  <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Date of Birth</label><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div>
                <label className="text-[11px] text-txt-muted block mb-1">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40">
                  <option value="">Select</option><option value="General">General</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option>
                </select>
              </div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Course Interest</label><input value={form.course_interest} onChange={e => set('course_interest', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" placeholder="e.g. MBBS, BDS" /></div>
              <div>
                <label className="text-[11px] text-txt-muted block mb-1">Source</label>
                <select value={form.source} onChange={e => set('source', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40">
                  <option value="">Select</option><option value="Walk-in">Walk-in</option><option value="Facebook">Facebook</option><option value="Instagram">Instagram</option><option value="WhatsApp">WhatsApp</option><option value="Google">Google</option><option value="Referral">Referral</option><option value="Website">Website</option>
                </select>
              </div>
              <div><label className="text-[11px] text-txt-muted block mb-1">HSC %</label><input value={form.hsc_percentage} onChange={e => set('hsc_percentage', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Expected NEET Marks</label><input value={form.neet_expected_marks} onChange={e => set('neet_expected_marks', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">NEET Application No</label><input value={form.neet_application_no} onChange={e => set('neet_application_no', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Reference Name</label><input value={form.reference_name} onChange={e => set('reference_name', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div><label className="text-[11px] text-txt-muted block mb-1">Tuition Name</label><input value={form.tuition_name} onChange={e => set('tuition_name', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40" /></div>
              <div>
                <label className="text-[11px] text-txt-muted block mb-1">Candidate Type</label>
                <select value={form.candidate_type} onChange={e => set('candidate_type', e.target.value)} className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-blue/40">
                  <option value="">Select</option><option value="Fresher">Fresher</option><option value="Repeater">Repeater</option>
                </select>
              </div>
            </div>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={12} className="animate-spin" /> : null}Create Enquiry</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
