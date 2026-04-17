'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ArrowLeft, Check, Loader2, Search, ChevronDown, CreditCard, User, GraduationCap, MapPin, Shield, BookOpen, ClipboardList, Printer } from 'lucide-react'
import { admissionsApi, branchesApi } from '@/lib/api'
import { STATES, getDistricts, getTalukas } from '@/lib/locationData'
import { PrintFeeReceipt } from './PrintFeeReceipt'

/* ─── Searchable Select Component ─── */
function SearchSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => options.filter(o => o.toLowerCase().includes(q.toLowerCase())), [options, q])

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(!open)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
                className="bg-transparent text-sm w-full outline-none placeholder:text-gray-400" />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No results</div>}
            {filtered.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); setQ('') }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${o === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
              >{o}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section Header ─── */
function SectionHeader({ icon: Icon, title, color = 'text-blue-700' }: { icon: any; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-gray-100">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'text-blue-700' ? 'bg-blue-50' : color === 'text-amber-700' ? 'bg-amber-50' : color === 'text-emerald-700' ? 'bg-emerald-50' : color === 'text-purple-700' ? 'bg-purple-50' : color === 'text-rose-700' ? 'bg-rose-50' : 'bg-gray-50'}`}>
        <Icon size={16} className={color} />
      </div>
      <h3 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h3>
    </div>
  )
}

/* ─── Field ─── */
function Field({ label, children, required, half }: { label: string; children: React.ReactNode; required?: boolean; half?: boolean }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="text-xs font-medium text-gray-500 block mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
const selectClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
const readonlyClass = "w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"

/* ═══════════════════════════════════════════════════════════════════
   MAIN WIZARD COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export function AdmissionWizard({ onBack, editAdmission }: { onBack: () => void; editAdmission?: any }) {
  const [phase, setPhase] = useState<1 | 'receipt' | 2>(editAdmission ? 2 : 1)
  const [admissionData, setAdmissionData] = useState<any>(editAdmission || null)
  const [branches, setBranches] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPrintBtn, setShowPrintBtn] = useState(false)
  const [printData, setPrintData] = useState<any>(null)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [selectedCourseName, setSelectedCourseName] = useState(editAdmission?.course_name || '')

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('ams_user') : null
  const user = userStr ? JSON.parse(userStr) : {}
  const isSuper = user.is_superuser || (user.role && user.role.toLowerCase().includes('super'))

  /* ── Phase 1 Form State ── */
  const [p1, setP1] = useState({
    student_name: '', student_mobile: '', parent_mobile: '',
    course_id: '', branch: isSuper ? '' : (user.branch_id?.toString() || ''),
    amount: '', payment_mode: 'Cash', transaction_id: '', notes: ''
  })

  /* ── Phase 2 Form State ── */
  const [p2, setP2] = useState<Record<string, any>>({
    // NEET-UG
    neet_roll_no: '', neet_application_no: '', dob: '', neet_rank: '', neet_marks: '',
    // JEE
    jee_roll_no: '', jee_application_no: '', jee_rank: '', jee_percentile: '',
    // Personal
    full_name: '', name_changed: '', father_name: '', mother_name: '',
    gender: '', mobile: '', email: '', alternate_mobile: '', aadhaar_no: '', religion: '',
    // Address
    address_line1: '', address_line2: '', address_line3: '', city: '',
    state: '', district: '', taluka: '', pincode: '',
    // Reservation
    apply_nri: '', oci_pio: '', nationality: '', domicile_maharashtra: '',
    is_orphan: '', annual_income: '', region_of_residence: '', is_pwd: '',
    category_of_candidate: '', sub_category: '',
    claim_minority_quota: '', claim_linguistic_minority: '',
    // SSC
    ssc_year: '', ssc_language: '', ssc_state: '', ssc_district: '', ssc_taluka: '', ssc_school_name: '', ssc_roll_no: '',
    // HSC
    hsc_name: '', hsc_exam: '', hsc_passing_year: '', hsc_roll_no: '',
    hsc_state: '', hsc_district: '', hsc_taluka: '', hsc_exam_session: '',
    // Marks
    physics_obtained: '', chemistry_obtained: '', maths_obtained: '', biology_obtained: '', english_obtained: '',
    pcb_obtained: '', pcm_obtained: '', pcbe_obtained: '', pcme_obtained: '',
    pcb_percentage_obtained: '', pcm_percentage_obtained: '', pcbe_percentage_obtained: '', pcme_percentage_obtained: '',
    // Parallel Reservation
    claim_exception: '', specified_reservation: '',
    // Application
    quota_apply_for: '', documents_received: '',
  })

  useEffect(() => { branchesApi.list().then(setBranches).catch(() => {}) }, [])

  // Pre-fill Phase 2 from existing admission data
  useEffect(() => {
    if (editAdmission) {
      setP2(prev => ({
        ...prev,
        full_name: editAdmission.student_name || '',
        mobile: editAdmission.student_mobile || '',
      }))
    }
  }, [editAdmission])

  const s1 = (k: string, v: any) => setP1(f => ({ ...f, [k]: v }))
  const s2 = (k: string, v: any) => setP2(f => ({ ...f, [k]: v }))

  // ── Course-type detection ──
  const cn = selectedCourseName.toLowerCase()
  const isEntranceOnly = cn.includes('entrance') && cn.includes('guidance')
  const isEngineering = cn.includes('engineering') && cn.includes('admission')
  const isMedical = ['medical', 'pharmacy', 'nursing'].some(t => cn.includes(t))

  // Dynamic courses from selected branch
  const branchCourses = useMemo(() => {
    const branchId = p1.branch || user.branch_id?.toString()
    const b = branches.find((br: any) => br.id.toString() === branchId)
    return b?.branch_courses || []
  }, [branches, p1.branch, user.branch_id])

  /* ── Phase 1 Submit ── */
  const handlePhase1 = async () => {
    if (!p1.student_name || !p1.student_mobile || !p1.course_id || !p1.amount) {
      setError('Please fill all required fields'); return
    }
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await admissionsApi.initiate({
        student_name: p1.student_name,
        student_mobile: p1.student_mobile,
        branch_id: p1.branch ? Number(p1.branch) : null,
        course_id: Number(p1.course_id),
        amount: p1.amount,
        payment_mode: p1.payment_mode,
        transaction_id: p1.transaction_id,
        notes: p1.notes,
      })
      setAdmissionData(res)
      setSuccess(`Admission ${res.admission_number} created! Fee of ₹${Number(p1.amount).toLocaleString()} recorded.`)
      // Pre-fill phase 2
      setP2(prev => ({ ...prev, full_name: p1.student_name, mobile: p1.student_mobile }))

      // Build receipt data
      const selectedCourse = branchCourses.find((c: any) => c.course.toString() === p1.course_id)
      const courseName = selectedCourse?.course_name || ''
      setSelectedCourseName(courseName)
      const branchId = p1.branch || user.branch_id?.toString()
      const branchObj = branches.find((b: any) => b.id.toString() === branchId)
      const isEntrance = courseName.toLowerCase().includes('entrance') && courseName.toLowerCase().includes('guidance')
      setReceiptData({
        admission_number: res.admission_number,
        student_name: p1.student_name,
        student_mobile: p1.student_mobile,
        parent_mobile: p1.parent_mobile,
        course_name: courseName || '—',
        course_fee: Number(selectedCourse?.fee_amount || 0),
        amount_paid: Number(p1.amount),
        payment_mode: p1.payment_mode,
        transaction_id: p1.transaction_id,
        branch_name: branchObj?.name || user.branch_name || 'CCP',
        branch_address: branchObj?.address || '',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        filled_by: user.full_name || '—',
        isEntranceOnly: isEntrance,
      })
      // Go to receipt view instead of Phase 2
      setPhase('receipt')
    } catch (e: any) { setError(e.message || 'Failed to create admission') }
    setSaving(false)
  }

  /* ── Phase 2 Submit ── */
  const handlePhase2 = async (finalize = false) => {
    if (!admissionData?.id) { setError('No admission to update'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await admissionsApi.completeProfile(admissionData.id, { ...p2, finalize })
      setSuccess(finalize ? 'Admission finalized and submitted!' : 'Profile saved as draft.')
      if (finalize) {
        // Fetch full admission detail for printing
        try {
          const fullData = await admissionsApi.get(admissionData.id)
          setPrintData(fullData)
          setShowPrintBtn(true)
        } catch { /* ignore print data fetch error */ }
      }
    } catch (e: any) { setError(e.message || 'Failed to save profile') }
    setSaving(false)
  }

  /* ── Print handler ── */
  const handlePrint = () => {
    if (!printData) return
    // Navigate to print view via parent callback
    // We store print data in sessionStorage and use the onPrint callback
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ams_print_admission', JSON.stringify(printData))
      window.dispatchEvent(new CustomEvent('ams-print-admission'))
    }
  }

  /* ─── PHASE 1: Initial Fee Payment ─── */
  const renderPhase1 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Admission – Fee Collection</h2>
              <p className="text-blue-100 text-xs mt-0.5">Step 1 of 2 · Record initial payment to generate admission number</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Info */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Student Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Student Name" required half>
                <input value={p1.student_name} onChange={e => s1('student_name', e.target.value)} placeholder="Full name" className={inputClass} />
              </Field>
              <Field label="Student Mobile No." required half>
                <input value={p1.student_mobile} onChange={e => s1('student_mobile', e.target.value)} placeholder="10-digit number" className={inputClass} />
              </Field>
              <Field label="Parent's Mobile No." half>
                <input value={p1.parent_mobile} onChange={e => s1('parent_mobile', e.target.value)} placeholder="Parent / Guardian mobile" className={inputClass} />
              </Field>
            </div>
          </div>

          {/* Branch (Super Admin only) */}
          {isSuper && (
            <div>
              <Field label="Branch" required>
                <select value={p1.branch} onChange={e => s1('branch', e.target.value)} className={selectClass}>
                  <option value="">Select branch</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* Course */}
          <Field label="Course" required>
            <select value={p1.course_id} onChange={e => s1('course_id', e.target.value)} className={selectClass}>
              <option value="">Select a course</option>
              {branchCourses.map((c: any) => (
                <option key={c.course} value={c.course}>{c.course_name} (₹{Number(c.fee_amount).toLocaleString()})</option>
              ))}
            </select>
          </Field>

          {/* Payment */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard size={13} /> Application Fee Payment
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount Paid (₹)" required half>
                <input type="number" min="0" value={p1.amount} onChange={e => s1('amount', e.target.value)} placeholder="0" className={inputClass} />
              </Field>
              <Field label="Payment Mode" required half>
                <select value={p1.payment_mode} onChange={e => s1('payment_mode', e.target.value)} className={selectClass}>
                  <option>Cash</option><option>Online</option><option>Cheque</option><option>NEFT/RTGS</option>
                </select>
              </Field>
              <Field label="Reference / TXN ID" half>
                <input value={p1.transaction_id} onChange={e => s1('transaction_id', e.target.value)} placeholder="Optional" className={inputClass} />
              </Field>
              <Field label="Remarks" half>
                <input value={p1.notes} onChange={e => s1('notes', e.target.value)} placeholder="Optional notes" className={inputClass} />
              </Field>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}

          <button onClick={handlePhase1} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Collect Fee & Generate Admission Number
          </button>
        </div>
      </div>
    </div>
  )

  /* ─── PHASE 2: Complete Academic Profile ─── */
  const renderPhase2 = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"><Check size={16} className="text-emerald-600" /></div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">{success}</p>
            {admissionData?.admission_number && <p className="text-xs text-emerald-600 mt-0.5">Admission ID: <span className="font-mono font-bold">{admissionData.admission_number}</span></p>}
          </div>
        </div>
      )}

      {/* Admission ID Badge */}
      {admissionData?.admission_number && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-widest">Admission Number</p>
            <p className="text-white text-2xl font-bold font-mono mt-1">{admissionData.admission_number}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-xs">Status</p>
            <p className="text-amber-300 text-sm font-semibold mt-1">Documents Pending</p>
          </div>
        </div>
      )}

      {/* ── Exam Details (JEE or NEET) ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {isEngineering ? (
          <>
            <SectionHeader icon={GraduationCap} title="JEE Details" color="text-blue-700" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="JEE Roll No." half><input value={p2.jee_roll_no} onChange={e => s2('jee_roll_no', e.target.value)} className={inputClass} /></Field>
              <Field label="JEE Application No." half><input value={p2.jee_application_no} onChange={e => s2('jee_application_no', e.target.value)} className={inputClass} /></Field>
              <Field label="Date of Birth" half><input type="date" value={p2.dob} onChange={e => s2('dob', e.target.value)} className={inputClass} /></Field>
              <Field label="JEE Rank" half><input type="number" value={p2.jee_rank} onChange={e => s2('jee_rank', e.target.value)} className={inputClass} /></Field>
              <Field label="JEE Percentile" half><input type="number" step="0.01" value={p2.jee_percentile} onChange={e => s2('jee_percentile', e.target.value)} className={inputClass} /></Field>
            </div>
          </>
        ) : (
          <>
            <SectionHeader icon={GraduationCap} title="NEET-UG Details" color="text-blue-700" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="NEET Roll No." half><input value={p2.neet_roll_no} onChange={e => s2('neet_roll_no', e.target.value)} className={inputClass} /></Field>
              <Field label="NEET Application No." half><input value={p2.neet_application_no} onChange={e => s2('neet_application_no', e.target.value)} className={inputClass} /></Field>
              <Field label="Date of Birth" half><input type="date" value={p2.dob} onChange={e => s2('dob', e.target.value)} className={inputClass} /></Field>
              <Field label="NEET Rank" half><input type="number" value={p2.neet_rank} onChange={e => s2('neet_rank', e.target.value)} className={inputClass} /></Field>
              <Field label="NEET Marks" half><input type="number" value={p2.neet_marks} onChange={e => s2('neet_marks', e.target.value)} className={inputClass} /></Field>
            </div>
          </>
        )}
      </div>

      {/* ── Personal Information ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={User} title="Personal Information" color="text-purple-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Full Name (As per ${isEngineering ? 'JEE' : 'NEET'} Score Card)`} required half>
            <input value={p2.full_name} onChange={e => s2('full_name', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Name changed after 10th?" half>
            <select value={p2.name_changed} onChange={e => s2('name_changed', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Father's Name" half><input value={p2.father_name} onChange={e => s2('father_name', e.target.value)} className={inputClass} /></Field>
          <Field label="Mother's Name" half><input value={p2.mother_name} onChange={e => s2('mother_name', e.target.value)} className={inputClass} /></Field>
          <Field label="Gender" half>
            <select value={p2.gender} onChange={e => s2('gender', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Date of Birth" half><input type="date" value={p2.dob} onChange={e => s2('dob', e.target.value)} className={inputClass} /></Field>
          <Field label="Mobile" half><input value={p2.mobile} onChange={e => s2('mobile', e.target.value)} className={inputClass} /></Field>
          <Field label="Email ID" half><input type="email" value={p2.email} onChange={e => s2('email', e.target.value)} className={inputClass} /></Field>
          <Field label="Alternate Contact No." half><input value={p2.alternate_mobile} onChange={e => s2('alternate_mobile', e.target.value)} className={inputClass} /></Field>
          <Field label="Aadhaar Card No." half><input value={p2.aadhaar_no} onChange={e => s2('aadhaar_no', e.target.value)} className={inputClass} /></Field>
          <Field label="Religion" half>
            <select value={p2.religion} onChange={e => s2('religion', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Buddhist</option><option>Sikh</option><option>Jain</option><option>Other</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Permanent Address ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={MapPin} title="Permanent Address" color="text-emerald-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address Line 1" half><input value={p2.address_line1} onChange={e => s2('address_line1', e.target.value)} className={inputClass} /></Field>
          <Field label="Address Line 2" half><input value={p2.address_line2} onChange={e => s2('address_line2', e.target.value)} className={inputClass} /></Field>
          <Field label="Address Line 3" half><input value={p2.address_line3} onChange={e => s2('address_line3', e.target.value)} className={inputClass} /></Field>
          <Field label="City" half><input value={p2.city} onChange={e => s2('city', e.target.value)} className={inputClass} /></Field>
          <Field label="State" half>
            <SearchSelect value={p2.state} onChange={v => { s2('state', v); s2('district', ''); s2('taluka', '') }} options={[...STATES]} placeholder="Select State" />
          </Field>
          <Field label="District" half>
            {p2.state === 'Other' ? (
              <input value={p2.district} onChange={e => { s2('district', e.target.value); s2('taluka', '') }} placeholder="Enter District" className={inputClass} />
            ) : (
              <SearchSelect value={p2.district} onChange={v => { s2('district', v); s2('taluka', '') }} options={getDistricts(p2.state)} placeholder="Select District" disabled={!p2.state} />
            )}
          </Field>
          <Field label="Taluka" half>
            {p2.state === 'Other' ? (
              <input value={p2.taluka} onChange={e => s2('taluka', e.target.value)} placeholder="Enter Taluka" className={inputClass} />
            ) : (
              <SearchSelect value={p2.taluka} onChange={v => s2('taluka', v)} options={getTalukas(p2.state, p2.district)} placeholder="Select Taluka" disabled={!p2.district} />
            )}
          </Field>
          <Field label="Pin Code" half><input value={p2.pincode} onChange={e => s2('pincode', e.target.value)} className={inputClass} /></Field>
        </div>
      </div>

      {/* ── Reservation ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={Shield} title="Reservation" color="text-rose-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Apply for NRI?" half>
            <select value={p2.apply_nri} onChange={e => s2('apply_nri', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="OCI/PIO card holder?" half>
            <select value={p2.oci_pio} onChange={e => s2('oci_pio', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Nationality" half>
            <select value={p2.nationality} onChange={e => s2('nationality', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>Indian</option><option>NRI</option><option>Foreign</option>
            </select>
          </Field>
          <Field label="Domicile of Maharashtra?" half>
            <select value={p2.domicile_maharashtra} onChange={e => s2('domicile_maharashtra', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Is the candidate an orphan?" half>
            <select value={p2.is_orphan} onChange={e => s2('is_orphan', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Annual Family Income" half>
            <select value={p2.annual_income} onChange={e => s2('annual_income', e.target.value)} className={selectClass}>
              <option value="">Select</option>
              <option>Below 1 Lakh</option><option>1-2.5 Lakh</option><option>2.5-5 Lakh</option>
              <option>5-8 Lakh</option><option>8-10 Lakh</option><option>Above 10 Lakh</option>
            </select>
          </Field>
          <Field label="Region of Residence" half>
            <select value={p2.region_of_residence} onChange={e => s2('region_of_residence', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>Vidarbha</option><option>Marathwada</option><option>Rest of Maharashtra</option><option>Outside Maharashtra</option>
            </select>
          </Field>
          <Field label="Person With Disability (PWD)?" half>
            <select value={p2.is_pwd} onChange={e => s2('is_pwd', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Category of Candidate" half>
            <select value={p2.category_of_candidate} onChange={e => s2('category_of_candidate', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>General / Open</option><option>OBC</option><option>SC</option><option>ST</option><option>VJ-A</option><option>NT-B</option><option>NT-C</option><option>NT-D</option><option>SBC</option><option>EWS</option>
            </select>
          </Field>
          <Field label="Sub Category" half><input value={p2.sub_category} onChange={e => s2('sub_category', e.target.value)} className={inputClass} /></Field>
          <Field label="Claim Minority Quota?" half>
            <select value={p2.claim_minority_quota} onChange={e => s2('claim_minority_quota', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Claim Linguistic Minority?" half>
            <select value={p2.claim_linguistic_minority} onChange={e => s2('claim_linguistic_minority', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── SSC Qualification ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={BookOpen} title="SSC / 10th Qualification" color="text-amber-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Year of Passing" half><input value={p2.ssc_year} onChange={e => s2('ssc_year', e.target.value)} placeholder="e.g. 2022" className={inputClass} /></Field>
          <Field label="Language / Medium" half>
            <select value={p2.ssc_language} onChange={e => s2('ssc_language', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>Marathi</option><option>English</option><option>Hindi</option><option>Urdu</option><option>Kannada</option><option>Other</option>
            </select>
          </Field>
          <Field label="State of SSC Passing" half>
            <SearchSelect value={p2.ssc_state} onChange={v => { s2('ssc_state', v); s2('ssc_district', ''); s2('ssc_taluka', '') }} options={[...STATES]} placeholder="Select State" />
          </Field>
          <Field label="District of SSC Passing" half>
            {p2.ssc_state === 'Other' ? (
              <input value={p2.ssc_district} onChange={e => { s2('ssc_district', e.target.value); s2('ssc_taluka', '') }} placeholder="Enter District" className={inputClass} />
            ) : (
              <SearchSelect value={p2.ssc_district} onChange={v => { s2('ssc_district', v); s2('ssc_taluka', '') }} options={getDistricts(p2.ssc_state)} placeholder="Select District" disabled={!p2.ssc_state} />
            )}
          </Field>
          <Field label="Taluka of SSC Passing" half>
            {p2.ssc_state === 'Other' ? (
              <input value={p2.ssc_taluka} onChange={e => s2('ssc_taluka', e.target.value)} placeholder="Enter Taluka" className={inputClass} />
            ) : (
              <SearchSelect value={p2.ssc_taluka} onChange={v => s2('ssc_taluka', v)} options={getTalukas(p2.ssc_state, p2.ssc_district)} placeholder="Select Taluka" disabled={!p2.ssc_district} />
            )}
          </Field>
          <Field label="School Name" half><input value={p2.ssc_school_name} onChange={e => s2('ssc_school_name', e.target.value)} className={inputClass} /></Field>
          <Field label="SSC Roll / Seat No." half><input value={p2.ssc_roll_no} onChange={e => s2('ssc_roll_no', e.target.value)} className={inputClass} /></Field>
        </div>
      </div>

      {/* ── HSC Qualification ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={BookOpen} title="HSC / 12th Qualification" color="text-amber-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name as per HSC Marksheet" half><input value={p2.hsc_name} onChange={e => s2('hsc_name', e.target.value)} className={inputClass} /></Field>
          <Field label="HSC Equivalent Examination" half>
            <select value={p2.hsc_exam} onChange={e => s2('hsc_exam', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>HSC</option><option>CBSE</option><option>ICSE</option><option>IB</option><option>NIOS</option><option>Other</option>
            </select>
          </Field>
          <Field label="Passing Year" half>
            <select value={p2.hsc_passing_year} onChange={e => s2('hsc_passing_year', e.target.value)} className={selectClass}>
              <option value="">Select</option>
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Roll No. / Seat No." half><input value={p2.hsc_roll_no} onChange={e => s2('hsc_roll_no', e.target.value)} className={inputClass} /></Field>
          <Field label="State of HSC Passing" half>
            <SearchSelect value={p2.hsc_state} onChange={v => { s2('hsc_state', v); s2('hsc_district', ''); s2('hsc_taluka', '') }} options={[...STATES]} placeholder="Select State" />
          </Field>
          <Field label="District of HSC Passing" half>
            {p2.hsc_state === 'Other' ? (
              <input value={p2.hsc_district} onChange={e => { s2('hsc_district', e.target.value); s2('hsc_taluka', '') }} placeholder="Enter District" className={inputClass} />
            ) : (
              <SearchSelect value={p2.hsc_district} onChange={v => { s2('hsc_district', v); s2('hsc_taluka', '') }} options={getDistricts(p2.hsc_state)} placeholder="Select District" disabled={!p2.hsc_state} />
            )}
          </Field>
          <Field label="Taluka of HSC Passing" half>
            {p2.hsc_state === 'Other' ? (
              <input value={p2.hsc_taluka} onChange={e => s2('hsc_taluka', e.target.value)} placeholder="Enter Taluka" className={inputClass} />
            ) : (
              <SearchSelect value={p2.hsc_taluka} onChange={v => s2('hsc_taluka', v)} options={getTalukas(p2.hsc_state, p2.hsc_district)} placeholder="Select Taluka" disabled={!p2.hsc_district} />
            )}
          </Field>
          <Field label="Exam Session" half>
            <select value={p2.hsc_exam_session} onChange={e => s2('hsc_exam_session', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>February</option><option>March</option><option>October</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Subject Marks ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={ClipboardList} title="Subject Details (12th Marks)" color="text-blue-700" />
        <div className="space-y-4">
          {(() => {
            // Build subject list based on course type
            const subjects = [
              { label: 'Physics', key: 'physics', outOf: 100 },
              { label: 'Chemistry', key: 'chemistry', outOf: 100 },
            ]
            if (isEngineering) {
              subjects.push({ label: 'Mathematics', key: 'maths', outOf: 100 })
            } else {
              subjects.push({ label: 'Biology', key: 'biology', outOf: 100 })
            }
            subjects.push({ label: 'English', key: 'english', outOf: 100 })
            return subjects
          })().map(sub => (
            <div key={sub.key} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-end">
              <div>
                <p className="text-sm font-semibold text-gray-800">{sub.label}</p>
                <p className="text-[10px] text-blue-600 font-medium">Marks obtained</p>
              </div>
              <input 
                type="number" 
                value={p2[`${sub.key}_obtained`] || ''} 
                onChange={e => {
                  const val = e.target.value
                  const n = { ...p2, [`${sub.key}_obtained`]: val }
                  
                  const p = parseFloat(n.physics_obtained) || 0
                  const c = parseFloat(n.chemistry_obtained) || 0
                  const m = parseFloat(n.maths_obtained) || 0
                  const b = parseFloat(n.biology_obtained) || 0
                  const eng = parseFloat(n.english_obtained) || 0

                  // PCB (Medical)
                  n.pcb_obtained = (p + c + b).toString()
                  n.pcb_percentage_obtained = b > 0 ? ((p + c + b) / 3).toFixed(2) : '0'
                  n.pcbe_obtained = (p + c + b + eng).toString()
                  n.pcbe_percentage_obtained = b > 0 ? ((p + c + b + eng) / 4).toFixed(2) : '0'

                  // PCM (Engineering)
                  n.pcm_obtained = (p + c + m).toString()
                  n.pcm_percentage_obtained = m > 0 ? ((p + c + m) / 3).toFixed(2) : '0'
                  n.pcme_obtained = (p + c + m + eng).toString()
                  n.pcme_percentage_obtained = m > 0 ? ((p + c + m + eng) / 4).toFixed(2) : '0'

                  setP2(n)
                }} 
                placeholder="0" 
                className={inputClass} 
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Marks out of</span>
                <input value={sub.outOf} readOnly className={readonlyClass} />
              </div>
            </div>
          ))}

          <hr className="my-4 border-gray-200" />
          
          {/* Show relevant calculated totals based on course type */}
          {(isEngineering ? [
            { label: 'PCM Total', key: 'pcm', outOf: 300 },
            { label: 'PCM Percentage', key: 'pcm_percentage', outOf: 100 },
            { label: 'PCME Total', key: 'pcme', outOf: 400 },
            { label: 'PCME Percentage', key: 'pcme_percentage', outOf: 100 },
          ] : [
            { label: 'PCB Total', key: 'pcb', outOf: 300 },
            { label: 'PCB Percentage', key: 'pcb_percentage', outOf: 100 },
            { label: 'PCBE Total', key: 'pcbe', outOf: 400 },
            { label: 'PCBE Percentage', key: 'pcbe_percentage', outOf: 100 },
          ]).map(sub => (
            <div key={sub.key} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-end">
              <div>
                <p className="text-sm font-semibold text-gray-800">{sub.label}</p>
                <p className="text-[10px] text-emerald-600 font-medium">Auto-calculated</p>
              </div>
              <input type="text" value={p2[`${sub.key}_obtained`] || '0'} readOnly className={readonlyClass} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Marks out of</span>
                <input value={sub.outOf} readOnly className={readonlyClass} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Parallel Reservation & Application ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={Shield} title="Parallel Reservation & Application" color="text-rose-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Claim Exception?" half>
            <select value={p2.claim_exception} onChange={e => s2('claim_exception', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
          <Field label="Specified Reservation" half>
            <div className="space-y-2 pt-1">
              {['Hilly Area', 'Defence Quota', 'MKB'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="specified_reservation" value={opt} checked={p2.specified_reservation === opt} onChange={e => s2('specified_reservation', e.target.value)}
                    className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="I want to apply for" half>
            <select value={p2.quota_apply_for} onChange={e => s2('quota_apply_for', e.target.value)} className={selectClass}>
              <option value="">Select</option>
              <option>ONLY STATE QUOTA</option>
              <option>ONLY INSTITUTE QUOTA (FOR ALL COURSES)</option>
              <option>BOTH STATE AND INSTITUTE QUOTA</option>
              <option>ONLY ALLIED COURSES STATE AND INSTITUTE QUOTA</option>
            </select>
          </Field>
          <Field label="All documents received?" half>
            <select value={p2.documents_received} onChange={e => s2('documents_received', e.target.value)} className={selectClass}>
              <option value="">Select</option><option>YES</option><option>NO</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}
      {success && !success.includes('created') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-emerald-800">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pb-8">
        {showPrintBtn ? (
          /* ── After finalization: Show Print + Back buttons ── */
          <>
            <button onClick={onBack}
              className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Admissions
            </button>
            <button onClick={handlePrint}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Print Admission Form
            </button>
          </>
        ) : (
          /* ── Normal: Draft + Submit buttons ── */
          <>
            <button onClick={() => handlePhase2(false)} disabled={saving}
              className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save as Draft
            </button>
            <button onClick={() => handlePhase2(true)} disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Submit Form
            </button>
          </>
        )}
      </div>
    </div>
  )

  /* ─── Receipt View ─── */
  if (phase === 'receipt' && receiptData) {
    return (
      <PrintFeeReceipt
        data={receiptData}
        onPrint={() => window.print()}
        onContinue={() => setPhase(2)}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Top Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Admissions
      </button>
      {phase === 1 ? renderPhase1() : renderPhase2()}
    </div>
  )
}
