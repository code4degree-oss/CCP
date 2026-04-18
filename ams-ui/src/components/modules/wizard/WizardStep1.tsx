'use client'
import { useState, useMemo } from 'react'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { Field, inputClass, selectClass } from './FormComponents'

export function WizardStep1({ onSubmit, branches, user, saving, error }: {
  onSubmit: (data: any, branchCourses: any[]) => void
  branches: any[]; user: any; saving: boolean; error: string
}) {
  const isSuper = user.is_superuser || (user.role && user.role.toLowerCase().includes('super'))
  const [p1, setP1] = useState({
    student_name: '', student_mobile: '', parent_mobile: '',
    course_id: '', branch: isSuper ? '' : (user.branch_id?.toString() || ''),
    amount: '', payment_mode: 'Cash', transaction_id: '', notes: ''
  })
  const s = (k: string, v: any) => setP1(f => ({ ...f, [k]: v }))

  const branchCourses = useMemo(() => {
    const bid = p1.branch || user.branch_id?.toString()
    const b = branches.find((br: any) => br.id.toString() === bid)
    return b?.branch_courses || []
  }, [branches, p1.branch, user.branch_id])

  const handle = () => {
    if (!p1.student_name || !p1.student_mobile || !p1.course_id || !p1.amount) return
    onSubmit(p1, branchCourses)
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
            <select value={p1.course_id} onChange={e => s('course_id', e.target.value)} className={selectClass}>
              <option value="">Select a course</option>
              {branchCourses.map((c: any) => <option key={c.course} value={c.course}>{c.course_name} (₹{Number(c.fee_amount).toLocaleString()})</option>)}
            </select>
          </Field>
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
