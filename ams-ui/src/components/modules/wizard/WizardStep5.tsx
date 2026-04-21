'use client'
import { ArrowLeft, Printer, Download, CheckCircle } from 'lucide-react'

const v = (val: any) => (val && val !== '' ? String(val) : '—')

function PrintRow({ label, value }: { label: string; value: any }) {
  return (
    <tr>
      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 11, color: '#374151', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', width: '40%' }}>{label}</td>
      <td style={{ padding: '6px 10px', fontSize: 11, color: '#111827', borderBottom: '1px solid #e5e7eb', width: '60%' }}>{v(value)}</td>
    </tr>
  )
}
function SectionTitle({ title, color = '#1d4ed8' }: { title: string; color?: string }) {
  return (
    <tr><td colSpan={2} style={{ padding: '10px 10px 6px', fontWeight: 800, fontSize: 12, color, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid ' + color, background: '#fff' }}>{title}</td></tr>
  )
}

export function WizardStep5({ admission, onBack, onEdit }: { admission: any; onBack: () => void; onEdit?: () => void }) {
  const student = admission?.student_detail || {}
  const academic = student?.academic_details || {}
  const demo = student?.demographic_details || {}
  const payments = admission?.payments || []

  const handlePrint = () => window.print()

  return (
    <div className="animate-fade-in">
      {/* Screen toolbar */}
      <div className="no-print mb-6 max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admission Complete!</h2>
              <p className="text-emerald-100 text-xs mt-0.5">Final preview — print or download the admission form</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <ArrowLeft size={14} /> Back to Admissions
          </button>
          {onEdit && (
            <button onClick={onEdit} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
              Edit Admission
            </button>
          )}
          <div className="flex-1" />
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            <Printer size={14} /> Print Form
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Printable form */}
      <div className="print-admission-form max-w-3xl mx-auto" id="print-admission-form">
        <div style={{ textAlign: 'center', borderBottom: '3px double #1e40af', paddingBottom: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO CCP.png" alt="CCP" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e3a5f', letterSpacing: '0.02em' }}>ADMISSION APPLICATION FORM</h1>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>Chanakya Career Point (CCP)</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Admission Number</span>
            <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#1e40af' }}>{admission?.admission_number || '—'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Status</span>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#059669' }}>✓ Finalized</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Date</span>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#374151' }}>
              {admission?.created_at ? new Date(admission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Exam Details */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
          <SectionTitle title="Exam Details" color="#1d4ed8" />
          <PrintRow label="NEET Roll No." value={academic.neet_roll_no} />
          <PrintRow label="NEET Application No." value={academic.neet_application_no} />
          <PrintRow label="Date of Birth" value={student.dob} />
          <PrintRow label="NEET Rank" value={student.neet_rank} />
          <PrintRow label="NEET Marks" value={student.neet_marks} />
          <PrintRow label="JEE Roll No." value={academic.jee_roll_no} />
          <PrintRow label="JEE Rank" value={academic.jee_rank} />
        </tbody></table>

        {/* Personal */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
          <SectionTitle title="Personal Information" color="#7c3aed" />
          <PrintRow label="Full Name" value={student.full_name} />
          <PrintRow label="Father's Name" value={student.father_name} />
          <PrintRow label="Mother's Name" value={demo.mother_name} />
          <PrintRow label="Gender" value={student.gender} />
          <PrintRow label="Mobile" value={student.mobile} />
          <PrintRow label="Email" value={student.email} />
          <PrintRow label="Aadhaar No." value={student.aadhaar_no} />
          <PrintRow label="Religion" value={demo.religion} />
        </tbody></table>

        {/* Address */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
          <SectionTitle title="Permanent Address" color="#059669" />
          <PrintRow label="Address" value={[demo.address_line1, demo.address_line2, demo.address_line3].filter(Boolean).join(', ')} />
          <PrintRow label="City" value={demo.city} />
          <PrintRow label="State" value={demo.state} />
          <PrintRow label="District" value={demo.district} />
          <PrintRow label="Taluka" value={demo.taluka} />
          <PrintRow label="Pin Code" value={demo.pincode} />
        </tbody></table>

        {/* Reservation */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
          <SectionTitle title="Reservation Details" color="#e11d48" />
          <PrintRow label="Category" value={demo.category_of_candidate} />
          <PrintRow label="Sub Category" value={demo.sub_category} />
          <PrintRow label="Nationality" value={demo.nationality} />
          <PrintRow label="Domicile Maharashtra" value={demo.domicile_maharashtra} />
          <PrintRow label="PWD" value={demo.is_pwd} />
          <PrintRow label="Quota" value={demo.quota_apply_for} />
        </tbody></table>

        {/* Academic Marks */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
          <SectionTitle title="Subject Marks (12th)" color="#1d4ed8" />
          {['Physics', 'Chemistry', 'Biology', 'Maths', 'English'].map(s => {
            const key = s.toLowerCase()
            const val = academic[`${key}_obtained`]
            return val ? <PrintRow key={s} label={s} value={`${val} / 100`} /> : null
          })}
          <PrintRow label="PCB Total" value={academic.pcb_obtained ? `${academic.pcb_obtained} / 300` : null} />
          <PrintRow label="PCM Total" value={academic.pcm_obtained ? `${academic.pcm_obtained} / 300` : null} />
        </tbody></table>

        {/* SSC / HSC */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
          <SectionTitle title="SSC / HSC Qualification" color="#d97706" />
          <PrintRow label="SSC Year" value={academic.ssc_year} />
          <PrintRow label="SSC School" value={academic.ssc_school_name} />
          <PrintRow label="SSC State" value={academic.ssc_state} />
          <PrintRow label="HSC Exam" value={academic.hsc_exam} />
          <PrintRow label="HSC Year" value={academic.hsc_passing_year} />
          <PrintRow label="HSC State" value={academic.hsc_state} />
        </tbody></table>

        {/* Payment */}
        {payments.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}><tbody>
            <SectionTitle title="Payment Information" color="#059669" />
            {payments.map((p: any, i: number) => (
              <PrintRow key={i} label={`Payment ${i + 1}`} value={`₹${Number(p.amount).toLocaleString()} — ${p.payment_mode} (${p.status})`} />
            ))}
          </tbody></table>
        )}

        {/* Signatures */}
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', paddingTop: 16 }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 6, fontSize: 10, fontWeight: 600, color: '#374151' }}>Student&apos;s Signature</div>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 6, fontSize: 10, fontWeight: 600, color: '#374151' }}>Authorized Signature &amp; Stamp</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 10, borderTop: '1px solid #e5e7eb', fontSize: 9, color: '#9ca3af' }}>
          Filled by: {admission?.manager_name || '—'} &nbsp;|&nbsp; Printed on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
