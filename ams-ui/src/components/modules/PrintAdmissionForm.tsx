'use client'

import { useRef } from 'react'
import { Printer, X } from 'lucide-react'

/* ─── Types ─── */
interface PrintAdmissionFormProps {
  admission: any
  onClose: () => void
}

/* ─── Helper: render a value or dash ─── */
const v = (val: any) => (val && val !== '' ? String(val) : '—')

/* ─── Print Row ─── */
function PrintRow({ label, value }: { label: string; value: any }) {
  return (
    <tr>
      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 11, color: '#374151', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', width: '40%' }}>
        {label}
      </td>
      <td style={{ padding: '6px 10px', fontSize: 11, color: '#111827', borderBottom: '1px solid #e5e7eb', width: '60%' }}>
        {v(value)}
      </td>
    </tr>
  )
}

/* ─── Section Title ─── */
function SectionTitle({ title, color = '#1d4ed8' }: { title: string; color?: string }) {
  return (
    <tr>
      <td colSpan={2} style={{ padding: '10px 10px 6px', fontWeight: 800, fontSize: 12, color, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid ' + color, background: '#fff' }}>
        {title}
      </td>
    </tr>
  )
}

/* ─── Two-Column Row (for marks table) ─── */
function MarksRow({ subject, obtained, outOf }: { subject: string; obtained: any; outOf: number }) {
  return (
    <tr>
      <td style={{ padding: '5px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
        {subject}
      </td>
      <td style={{ padding: '5px 10px', fontSize: 11, color: '#111827', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
        {v(obtained)}
      </td>
      <td style={{ padding: '5px 10px', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
        {outOf}
      </td>
    </tr>
  )
}

export function PrintAdmissionForm({ admission, onClose }: PrintAdmissionFormProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const student = admission?.student_detail || {}
  const academic = student?.academic_details || {}
  const demo = student?.demographic_details || {}
  const payments = admission?.payments || []

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="print-overlay">
      {/* Screen-only toolbar */}
      <div className="print-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <X size={14} /> Close
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={14} /> Print Form
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Preview below · Click "Print Form" to print or save as PDF</p>
      </div>

      {/* ─── PRINTABLE CONTENT ─── */}
      <div ref={printRef} className="print-admission-form" id="print-admission-form">
        {/* ══════ HEADER ══════ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '3px double #1e40af', paddingBottom: 12, marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO CCP.png" alt="CCP Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e3a5f', letterSpacing: '0.02em' }}>
              ADMISSION APPLICATION FORM
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
              Chanakya Career Point (CCP)
            </p>
          </div>
        </div>

        {/* Admission number badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admission Number</span>
            <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#1e40af' }}>{admission?.admission_number || '—'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: admission?.is_finalized ? '#059669' : '#d97706' }}>
              {admission?.is_finalized ? '✓ Finalized' : '⏳ Draft'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</span>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#374151' }}>
              {admission?.created_at ? new Date(admission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* ══════ NEET-UG DETAILS ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="NEET-UG Details" color="#1d4ed8" />
            <PrintRow label="NEET Roll No." value={academic.neet_roll_no} />
            <PrintRow label="NEET Application No." value={academic.neet_application_no} />
            <PrintRow label="Date of Birth" value={student.dob} />
            <PrintRow label="NEET Rank" value={student.neet_rank} />
            <PrintRow label="NEET Marks" value={student.neet_marks} />
          </tbody>
        </table>

        {/* ══════ PERSONAL INFORMATION ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="Personal Information" color="#7c3aed" />
            <PrintRow label="Full Name (as per NEET Score Card)" value={student.full_name} />
            <PrintRow label="Name Changed after 10th?" value={demo.name_changed} />
            <PrintRow label="Father's Name" value={student.father_name} />
            <PrintRow label="Mother's Name" value={demo.mother_name} />
            <PrintRow label="Gender" value={student.gender} />
            <PrintRow label="Date of Birth" value={student.dob} />
            <PrintRow label="Mobile" value={student.mobile} />
            <PrintRow label="Email ID" value={student.email} />
            <PrintRow label="Alternate Contact No." value={demo.alternate_mobile} />
            <PrintRow label="Aadhaar Card No." value={student.aadhaar_no} />
            <PrintRow label="Religion" value={demo.religion} />
          </tbody>
        </table>

        {/* ══════ PERMANENT ADDRESS ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="Permanent Address" color="#059669" />
            <PrintRow label="Address Line 1" value={demo.address_line1} />
            <PrintRow label="Address Line 2" value={demo.address_line2} />
            <PrintRow label="Address Line 3" value={demo.address_line3} />
            <PrintRow label="City" value={demo.city} />
            <PrintRow label="State" value={demo.state} />
            <PrintRow label="District" value={demo.district} />
            <PrintRow label="Taluka" value={demo.taluka} />
            <PrintRow label="Pin Code" value={demo.pincode} />
          </tbody>
        </table>

        {/* ══════ RESERVATION ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="Reservation Details" color="#e11d48" />
            <PrintRow label="Apply for NRI?" value={demo.apply_nri} />
            <PrintRow label="OCI/PIO Card Holder?" value={demo.oci_pio} />
            <PrintRow label="Nationality" value={demo.nationality} />
            <PrintRow label="Domicile of Maharashtra?" value={demo.domicile_maharashtra} />
            <PrintRow label="Is the Candidate an Orphan?" value={demo.is_orphan} />
            <PrintRow label="Annual Family Income" value={demo.annual_income} />
            <PrintRow label="Region of Residence" value={demo.region_of_residence} />
            <PrintRow label="Person With Disability (PWD)?" value={demo.is_pwd} />
            <PrintRow label="Category of Candidate" value={demo.category_of_candidate} />
            <PrintRow label="Sub Category" value={demo.sub_category} />
            <PrintRow label="Claim Minority Quota?" value={demo.claim_minority_quota} />
            <PrintRow label="Claim Linguistic Minority?" value={demo.claim_linguistic_minority} />
          </tbody>
        </table>

        {/* ══════ SSC / 10TH QUALIFICATION ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="SSC / 10th Qualification" color="#d97706" />
            <PrintRow label="Year of Passing" value={academic.ssc_year} />
            <PrintRow label="Language / Medium" value={academic.ssc_language} />
            <PrintRow label="State of SSC Passing" value={academic.ssc_state} />
            <PrintRow label="District of SSC Passing" value={academic.ssc_district} />
            <PrintRow label="Taluka of SSC Passing" value={academic.ssc_taluka} />
            <PrintRow label="School Name" value={academic.ssc_school_name} />
            <PrintRow label="SSC Roll / Seat No." value={academic.ssc_roll_no} />
          </tbody>
        </table>

        {/* ══════ HSC / 12TH QUALIFICATION ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="HSC / 12th Qualification" color="#d97706" />
            <PrintRow label="Name as per HSC Marksheet" value={academic.hsc_name} />
            <PrintRow label="HSC Equivalent Examination" value={academic.hsc_exam} />
            <PrintRow label="Passing Year" value={academic.hsc_passing_year} />
            <PrintRow label="Roll No. / Seat No." value={academic.hsc_roll_no} />
            <PrintRow label="State of HSC Passing" value={academic.hsc_state} />
            <PrintRow label="District of HSC Passing" value={academic.hsc_district} />
            <PrintRow label="Taluka of HSC Passing" value={academic.hsc_taluka} />
            <PrintRow label="Exam Session" value={academic.hsc_exam_session} />
          </tbody>
        </table>

        {/* ══════ SUBJECT MARKS (12TH) ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <tr>
              <td colSpan={3} style={{ padding: '10px 10px 6px', fontWeight: 800, fontSize: 12, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1d4ed8', background: '#fff' }}>
                Subject Details (12th Marks)
              </td>
            </tr>
            <tr style={{ background: '#f3f4f6' }}>
              <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db' }}>Subject</td>
              <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Marks Obtained</td>
              <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Out of</td>
            </tr>
            <MarksRow subject="Physics" obtained={academic.physics_obtained} outOf={100} />
            <MarksRow subject="Chemistry" obtained={academic.chemistry_obtained} outOf={100} />
            <MarksRow subject="Biology" obtained={academic.biology_obtained} outOf={100} />
            <MarksRow subject="English" obtained={academic.english_obtained} outOf={100} />
            <MarksRow subject="PCB Total" obtained={academic.pcb_obtained} outOf={300} />
            <MarksRow subject="PCBE Total" obtained={academic.pcbe_obtained} outOf={400} />
            <MarksRow subject="PCB Percentage" obtained={academic.pcb_percentage_obtained} outOf={100} />
            <MarksRow subject="PCBE Percentage" obtained={academic.pcbe_percentage_obtained} outOf={100} />
          </tbody>
        </table>

        {/* ══════ PARALLEL RESERVATION & APPLICATION ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
          <tbody>
            <SectionTitle title="Parallel Reservation & Application" color="#e11d48" />
            <PrintRow label="Claim Exception?" value={demo.claim_exception} />
            <PrintRow label="Specified Reservation" value={demo.specified_reservation} />
            <PrintRow label="Apply For (Quota)" value={demo.quota_apply_for} />
            <PrintRow label="All Documents Received?" value={demo.documents_received} />
          </tbody>
        </table>

        {/* ══════ PAYMENT INFORMATION ══════ */}
        {payments.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
            <tbody>
              <SectionTitle title="Payment Information" color="#059669" />
              <tr style={{ background: '#f3f4f6' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db' }}>Amount (₹)</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db' }}>Mode</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db' }}>Reference</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db' }}>Status</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #d1d5db' }}>Date</td>
              </tr>
              {payments.map((p: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: '5px 10px', fontSize: 11, color: '#111827', borderBottom: '1px solid #e5e7eb', fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '5px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{p.payment_mode}</td>
                  <td style={{ padding: '5px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace' }}>{p.reference_no || '—'}</td>
                  <td style={{ padding: '5px 10px', fontSize: 11, color: p.status === 'Paid' ? '#059669' : '#d97706', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{p.status}</td>
                  <td style={{ padding: '5px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ══════ ADMISSION NOTES ══════ */}
        {admission?.notes && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 12 }}>
            <tbody>
              <SectionTitle title="Remarks / Notes" color="#6b7280" />
              <tr>
                <td colSpan={2} style={{ padding: '8px 10px', fontSize: 11, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {admission.notes}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* ══════ FOOTER ══════ */}
        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', paddingTop: 16 }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 6, fontSize: 10, fontWeight: 600, color: '#374151' }}>
              Student&apos;s Signature
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 6, fontSize: 10, fontWeight: 600, color: '#374151' }}>
              Authorized Signature &amp; Stamp
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 10, borderTop: '1px solid #e5e7eb', fontSize: 9, color: '#9ca3af' }}>
          Filled by: {admission?.manager_name || '—'} &nbsp;|&nbsp; Printed on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
