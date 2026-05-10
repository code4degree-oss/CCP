'use client'
import { useState, useMemo } from 'react'
import { CreditCard, Check, Loader2, ArrowRight } from 'lucide-react'
import { Field, inputClass, selectClass } from './FormComponents'

export function WizardStep1({ onSubmit, onNext, branches, user, saving, error, admissionData }: {
  onSubmit: (data: any, branchCourses: any[]) => void
  onNext?: () => void
  branches: any[]; user: any; saving: boolean; error: string
  admissionData?: any
}) {
  const isSuper = user.is_superuser || (user.role && user.role.toLowerCase().includes('super'))
  const [p1, setP1] = useState({
    student_name: '', student_mobile: '', parent_mobile: '',
    course_id: '', branch: isSuper ? '' : (user.branch_id?.toString() || ''),
    amount: '', payment_mode: 'Cash', transaction_id: '', notes: '',
    counselling_type: ''
  })
  const s = (k: string, v: any) => setP1(f => ({ ...f, [k]: v }))

  const branchCourses = useMemo(() => {
    const bid = p1.branch || user.branch_id?.toString()
    const b = branches.find((br: any) => br.id.toString() === bid)
    return b?.branch_courses || []
  }, [branches, p1.branch, user.branch_id])

  // Check if selected course is Engineering Admission Guidance
  const selectedCourse = branchCourses.find((c: any) => c.course.toString() === p1.course_id)
  const isEngAdmission = selectedCourse?.course_name?.toLowerCase().includes('engineering') && selectedCourse?.course_name?.toLowerCase().includes('admission')
  const isMedAdmission = selectedCourse?.course_name?.toLowerCase().includes('medical') && selectedCourse?.course_name?.toLowerCase().includes('admission')
  const hasCounsellingDropdown = isEngAdmission || isMedAdmission

  // Resolve the correct fee based on counselling type
  const resolvedFee = useMemo(() => {
    if (!selectedCourse) return 0
    if (!hasCounsellingDropdown || !p1.counselling_type) return Number(selectedCourse.fee_amount) || 0

    // Map counselling type display value to DB key
    const counsellingFees = selectedCourse.counselling_fees || []
    let ctKey = ''
    // Engineering keys
    if (p1.counselling_type.toLowerCase().includes('both')) ctKey = 'Both'
    else if (p1.counselling_type.toLowerCase().includes('josaa')) ctKey = 'JoSAA'
    else if (p1.counselling_type.toLowerCase().includes('mht-cet') || p1.counselling_type.toLowerCase().includes('state cap')) ctKey = 'CET'
    // Medical keys
    else if (p1.counselling_type.toLowerCase().includes('two state') || p1.counselling_type.toLowerCase().includes('combo')) ctKey = 'Combo_Medical'
    else if (p1.counselling_type.toLowerCase().includes('maharashtra')) ctKey = 'MH_Medical'
    else if (p1.counselling_type.toLowerCase().includes('other state')) ctKey = 'Other_Medical'

    const match = counsellingFees.find((cf: any) => cf.counselling_type === ctKey)
    return match ? Number(match.fee_amount) : Number(selectedCourse.fee_amount) || 0
  }, [selectedCourse, hasCounsellingDropdown, p1.counselling_type])

  const handle = () => {
    if (!p1.student_name || !p1.student_mobile || !p1.course_id || !p1.amount) return
    onSubmit(p1, branchCourses)
  }

  if (admissionData) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Check size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Initial Admission Completed</h2>
                <p className="text-emerald-100 text-xs mt-0.5">Step 1 is locked for existing admissions</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Admission Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{admissionData.admission_number || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Student Name</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{admissionData.student_name || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Mobile Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{admissionData.student_mobile || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Course</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{admissionData.course_name || '—'}</p>
              </div>
            </div>

            <button onClick={onNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4">
              Continue to Step 2 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Admission – Fee Collection</h2>
              <p className="text-blue-100 text-xs mt-0.5">Step 1 · Record initial payment to generate admission number</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Student Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Student Name" required half><input value={p1.student_name} onChange={e => s('student_name', e.target.value)} placeholder="Full name" className={inputClass} /></Field>
              <Field label="Student Mobile No." required half><input value={p1.student_mobile} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) s('student_mobile', v); }} placeholder="10-digit number" className={inputClass} /></Field>
              <Field label="Parent's Mobile No." half><input value={p1.parent_mobile} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) s('parent_mobile', v); }} placeholder="Parent / Guardian mobile" className={inputClass} /></Field>
            </div>
          </div>
          {isSuper && (
            <Field label="Branch" required>
              <select value={p1.branch} onChange={e => s('branch', e.target.value)} className={selectClass}>
                <option value="">Select branch</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Course" required>
            <select value={p1.course_id} onChange={e => { s('course_id', e.target.value); s('counselling_type', '') }} className={selectClass}>
              <option value="">Select a course</option>
              {branchCourses.map((c: any) => {
                const isEng = c.course_name?.toLowerCase().includes('engineering') && c.course_name?.toLowerCase().includes('admission')
                const isMed = c.course_name?.toLowerCase().includes('medical') && c.course_name?.toLowerCase().includes('admission')
                return <option key={c.course} value={c.course}>{c.course_name}{!isEng && !isMed && Number(c.fee_amount) > 0 ? ` (₹${Number(c.fee_amount).toLocaleString()})` : ''}</option>
              })}
            </select>
          </Field>
          {/* Counselling Type - Engineering Admission only */}
          {isEngAdmission && (
            <Field label="Counselling Type" required>
              <select value={p1.counselling_type} onChange={e => s('counselling_type', e.target.value)} className={selectClass}>
                <option value="">Select Counselling Type</option>
                <option>JoSAA (Central - IITs, NITs, IIITs)</option>
                <option>MHT-CET (State CAP)</option>
                <option>Both (JoSAA + MHT-CET)</option>
              </select>
            </Field>
          )}
          {/* Counselling Type - Medical Admission only */}
          {isMedAdmission && (
            <Field label="Counselling Type" required>
              <select value={p1.counselling_type} onChange={e => s('counselling_type', e.target.value)} className={selectClass}>
                <option value="">Select Counselling Type</option>
                <option>Maharashtra State Medical Counseling</option>
                <option>Other State Medical Counseling</option>
                <option>Two State Medical Counseling (Combo)</option>
              </select>
            </Field>
          )}
          {/* Total Fee indicator — only show when fee is resolved */}
          {p1.course_id && (() => {
            // For engineering/medical admission: only show fee after counselling type is selected
            if (hasCounsellingDropdown && !p1.counselling_type) return null
            const totalFee = resolvedFee
            return totalFee > 0 ? (
              <div className="flex items-center gap-2 -mt-2 ml-1">
                <span className="text-xs font-semibold text-gray-600">
                  {hasCounsellingDropdown && p1.counselling_type ? `Fee (${p1.counselling_type.split('(')[0].trim()}):` : 'Total Course Fee:'}
                </span>
                <span className="text-sm font-bold text-blue-700">₹{totalFee.toLocaleString('en-IN')}</span>
              </div>
            ) : null
          })()}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2"><CreditCard size={13} />Application Fee Payment</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount Paid (₹)" required half><input type="number" min="0" value={p1.amount} onChange={e => s('amount', e.target.value)} placeholder="0" className={inputClass} /></Field>
              <Field label="Payment Mode" required half>
                <select value={p1.payment_mode} onChange={e => s('payment_mode', e.target.value)} className={selectClass}>
                  <option>Cash</option><option>Online</option><option>Cheque</option><option>NEFT/RTGS</option>
                </select>
              </Field>
              <Field label="Reference / TXN ID" half><input value={p1.transaction_id} onChange={e => s('transaction_id', e.target.value)} placeholder="Optional" className={inputClass} /></Field>
              <Field label="Remarks" half><input value={p1.notes} onChange={e => s('notes', e.target.value)} placeholder="Optional notes" className={inputClass} /></Field>
            </div>
            {/* Balance indicator — uses counselling-type fee */}
            {p1.course_id && p1.amount && (() => {
              const totalFee = resolvedFee
              const paid = Number(p1.amount) || 0
              const balance = Math.max(0, totalFee - paid)
              if (totalFee <= 0) return null
              return (
                <div className={`flex items-center justify-between mt-3 px-3 py-2 rounded-lg border ${balance > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Total Fee</span>
                      <p className="text-sm font-bold text-gray-800">₹{totalFee.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">Paying Now</span>
                      <p className="text-sm font-bold text-emerald-700">₹{paid.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">Balance</span>
                    <p className={`text-sm font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{balance.toLocaleString('en-IN')}
                      {balance === 0 && <span className="ml-1 text-[10px]">✓ Fully Paid</span>}
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}
          <button onClick={handle} disabled={saving || !p1.student_name || !p1.student_mobile || !p1.course_id || !p1.amount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Collect Fee & Generate Admission Number
          </button>
        </div>
      </div>
    </div>
  )
}
