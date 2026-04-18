'use client'
import { useState } from 'react'
import { ClipboardCheck, Pencil, Loader2, Check } from 'lucide-react'

const v = (val: any) => (val && val !== '' ? String(val) : '—')

function ReviewSection({ title, data, color, onEdit }: { title: string; data: [string, any][]; color: string; onEdit?: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className={`px-5 py-3 flex items-center justify-between border-b border-gray-100`}
        style={{ background: color + '08' }}>
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{title}</h4>
        {onEdit && (
          <button onClick={onEdit} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {data.filter(([,v]) => v && v !== '' && v !== '—').map(([label, value]) => (
          <div key={label} className="px-5 py-2.5 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">{label}</span>
            <span className="text-xs text-gray-900 font-semibold text-right max-w-[60%]">{v(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WizardStep4({ admissionData, p2, receiptData, documents, onEdit, onSubmit, saving }: {
  admissionData: any
  p2: Record<string, any>
  receiptData: any
  documents: any[]
  onEdit: (step: number) => void
  onSubmit: () => void
  saving: boolean
}) {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <ClipboardCheck size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Review & Confirm</h2>
          <p className="text-amber-100 text-xs mt-0.5">Step 4 · Verify all details before final submission</p>
        </div>
      </div>

      {/* Admission & Fee */}
      <ReviewSection title="Admission & Fee" color="#2563eb" onEdit={() => onEdit(1)} data={[
        ['Admission Number', admissionData?.admission_number],
        ['Student Name', receiptData?.student_name],
        ['Mobile', receiptData?.student_mobile],
        ['Course', receiptData?.course_name],
        ['Amount Paid', receiptData?.amount_paid ? `₹${Number(receiptData.amount_paid).toLocaleString()}` : ''],
        ['Payment Mode', receiptData?.payment_mode],
        ['Branch', receiptData?.branch_name],
      ]} />

      {/* Personal Info */}
      <ReviewSection title="Personal Information" color="#7c3aed" onEdit={() => onEdit(2)} data={[
        ['Full Name', p2.full_name],
        ['Father\'s Name', p2.father_name],
        ['Mother\'s Name', p2.mother_name],
        ['Gender', p2.gender],
        ['Date of Birth', p2.dob],
        ['Email', p2.email],
        ['Mobile', p2.mobile],
        ['Aadhaar No.', p2.aadhaar_no],
        ['Religion', p2.religion],
      ]} />

      {/* Address */}
      <ReviewSection title="Address" color="#059669" onEdit={() => onEdit(2)} data={[
        ['Address', [p2.address_line1, p2.address_line2, p2.address_line3].filter(Boolean).join(', ')],
        ['City', p2.city],
        ['State', p2.state],
        ['District', p2.district],
        ['Taluka', p2.taluka],
        ['Pincode', p2.pincode],
      ]} />

      {/* Academic */}
      <ReviewSection title="Academic Details" color="#d97706" onEdit={() => onEdit(2)} data={[
        ['NEET Roll No.', p2.neet_roll_no],
        ['NEET Marks', p2.neet_marks],
        ['NEET Rank', p2.neet_rank],
        ['JEE Roll No.', p2.jee_roll_no],
        ['JEE Rank', p2.jee_rank],
        ['HSC Exam', p2.hsc_exam],
        ['HSC Year', p2.hsc_passing_year],
        ['Physics', p2.physics_obtained],
        ['Chemistry', p2.chemistry_obtained],
        ['Biology', p2.biology_obtained],
        ['Maths', p2.maths_obtained],
        ['English', p2.english_obtained],
      ]} />

      {/* Reservation */}
      <ReviewSection title="Reservation" color="#e11d48" onEdit={() => onEdit(2)} data={[
        ['Category', p2.category_of_candidate],
        ['Sub Category', p2.sub_category],
        ['Nationality', p2.nationality],
        ['Domicile Maharashtra', p2.domicile_maharashtra],
        ['PWD', p2.is_pwd],
        ['Quota Applied For', p2.quota_apply_for],
      ]} />

      {/* Documents */}
      <ReviewSection title="Documents" color="#8b5cf6" onEdit={() => onEdit(3)} data={
        documents.length > 0
          ? documents.map((d: any) => [d.document_type, '✓ Uploaded'])
          : [['Status', 'No documents uploaded yet']]
      } />

      {/* Confirmation Checkbox */}
      <div className="bg-white border-2 border-amber-200 rounded-xl p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-blue-600 rounded" />
          <div>
            <p className="text-sm font-semibold text-gray-800">I confirm that all information provided is correct</p>
            <p className="text-xs text-gray-500 mt-1">By checking this box, you verify that all entered data is accurate and complete.</p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pb-6">
        <button onClick={() => onEdit(3)}
          className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
          ← Back
        </button>
        <button onClick={onSubmit} disabled={!confirmed || saving}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Submit & Finalize
        </button>
      </div>
    </div>
  )
}
