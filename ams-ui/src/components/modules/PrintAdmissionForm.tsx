'use client'

import { Printer, X } from 'lucide-react'
import { printHTML } from '@/lib/printUtils'
import { getApplicableDocuments, groupByTier } from '@/lib/documentConfig'

interface PrintAdmissionFormProps {
  admission: any
  onClose: () => void
}

const v = (val: any) => (val && val !== '' ? String(val) : '—')

function row(label: string, value: any) {
  return `<tr><td style="padding:6px 10px;font-weight:600;font-size:11px;color:#374151;white-space:nowrap;border-bottom:1px solid #e5e7eb;background:#f9fafb;width:40%">${label}</td><td style="padding:6px 10px;font-size:11px;color:#111827;border-bottom:1px solid #e5e7eb;width:60%">${v(value)}</td></tr>`
}

function section(title: string, color: string) {
  return `<tr><td colspan="2" style="padding:10px 10px 6px;font-weight:800;font-size:12px;color:${color};text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid ${color};background:#fff">${title}</td></tr>`
}

function marksRow(subject: string, obtained: any, outOf: number) {
  return `<tr><td style="padding:5px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb;font-weight:600">${subject}</td><td style="padding:5px 10px;font-size:11px;color:#111827;border-bottom:1px solid #e5e7eb;text-align:center">${v(obtained)}</td><td style="padding:5px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;text-align:center">${outOf}</td></tr>`
}

function buildHTML(admission: any): string {
  const student = admission?.student_detail || {}
  const academic = student?.academic_details || {}
  const demo = student?.demographic_details || {}
  const payments = admission?.payments || []
  const date = admission?.created_at ? new Date(admission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const tbl = (content: string) => `<table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:12px" class="avoid-break"><tbody>${content}</tbody></table>`

  let html = ''

  // Header
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:3px double #1e40af;padding-bottom:12px;margin-bottom:14px">
    <img src="/LOGO CCP.png" alt="CCP Logo" style="width:64px;height:64px;object-fit:contain" />
    <div style="text-align:center">
      <h1 style="margin:0;font-size:18px;font-weight:800;color:#1e3a5f;letter-spacing:0.02em">ADMISSION APPLICATION FORM</h1>
      <p style="margin:4px 0 0;font-size:11px;color:#6b7280">Chanakya Career Point (CCP)</p>
    </div>
  </div>`

  // Badge
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:8px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px">
    <div><span style="font-size:10px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.08em">Admission Number</span><p style="margin:2px 0 0;font-size:16px;font-weight:800;font-family:monospace;color:#1e40af">${admission?.admission_number || '—'}</p></div>
    <div style="text-align:right"><span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em">Status</span><p style="margin:2px 0 0;font-size:12px;font-weight:700;color:${admission?.is_finalized ? '#059669' : '#d97706'}">${admission?.is_finalized ? '✓ Finalized' : '⏳ Draft'}</p></div>
    <div style="text-align:right"><span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em">Date</span><p style="margin:2px 0 0;font-size:11px;font-weight:600;color:#374151">${date}</p></div>
  </div>`

  // Sections
  html += tbl(section('NEET-UG Details', '#1d4ed8') + row('NEET Roll No.', academic.neet_roll_no) + row('NEET Application No.', academic.neet_application_no) + row('Date of Birth', student.dob) + row('NEET Rank', student.neet_rank) + row('NEET Marks', student.neet_marks))

  html += tbl(section('Personal Information', '#7c3aed') + row('Full Name (as per NEET Score Card)', student.full_name) + row('Name Changed after 10th?', demo.name_changed) + row("Father's Name", student.father_name) + row("Mother's Name", demo.mother_name) + row('Gender', student.gender) + row('Date of Birth', student.dob) + row('Mobile', student.mobile) + row('Email ID', student.email) + row('Alternate Contact No.', demo.alternate_mobile) + row('Aadhaar Card No.', student.aadhaar_no) + row('Religion', demo.religion))

  html += tbl(section('Permanent Address', '#059669') + row('Address Line 1', demo.address_line1) + row('Address Line 2', demo.address_line2) + row('Address Line 3', demo.address_line3) + row('City', demo.city) + row('State', demo.state) + row('District', demo.district) + row('Taluka', demo.taluka) + row('Pin Code', demo.pincode))

  html += tbl(section('Reservation Details', '#e11d48') + row('Apply for NRI?', demo.apply_nri) + row('OCI/PIO Card Holder?', demo.oci_pio) + row('Nationality', demo.nationality) + row('Domicile of Maharashtra?', demo.domicile_maharashtra) + row('Is the Candidate an Orphan?', demo.is_orphan) + row('Annual Family Income', demo.annual_income) + row('Region of Residence', demo.region_of_residence) + row('Person With Disability (PWD)?', demo.is_pwd) + row('Category of Candidate', demo.category_of_candidate) + row('Sub Category', demo.sub_category) + row('Claim Minority Quota?', demo.claim_minority_quota) + (demo.selected_minority ? row('Selected Minority', demo.selected_minority) : '') + row('Claim Linguistic Minority?', demo.claim_linguistic_minority) + (demo.selected_linguistic_minority ? row('Selected Linguistic Minority', demo.selected_linguistic_minority) : ''))

  html += tbl(section('SSC / 10th Qualification', '#d97706') + row('SSC Board', academic.ssc_board) + row('Year of Passing', academic.ssc_year) + row('Language / Medium', academic.ssc_language) + row('State of SSC Passing', academic.ssc_state) + row('District of SSC Passing', academic.ssc_district) + row('Taluka of SSC Passing', academic.ssc_taluka) + row('School Name', academic.ssc_school_name))

  html += tbl(section('HSC / 12th Qualification', '#d97706') + row('Name as per HSC Marksheet', academic.hsc_name) + row('HSC Equivalent Examination', academic.hsc_exam) + row('Passing Year', academic.hsc_passing_year) + row('Roll No. / Seat No.', academic.hsc_roll_no) + row('State of HSC Passing', academic.hsc_state) + row('District of HSC Passing', academic.hsc_district) + row('Taluka of HSC Passing', academic.hsc_taluka) + row('Exam Session', academic.hsc_exam_session))

  // Marks table
  const marksHeader = `<tr><td colspan="3" style="padding:10px 10px 6px;font-weight:800;font-size:12px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #1d4ed8;background:#fff">Subject Details (12th Marks)</td></tr><tr style="background:#f3f4f6"><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Subject</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db;text-align:center">Marks Obtained</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db;text-align:center">Out of</td></tr>`
  let marksHtml = marksHeader
  marksHtml += marksRow('Physics', academic.physics_obtained, 100)
  marksHtml += marksRow('Chemistry', academic.chemistry_obtained, 100)
  if (academic.biology_obtained || academic.pcb_obtained) marksHtml += marksRow('Biology', academic.biology_obtained, 100)
  if (academic.maths_obtained || academic.pcm_obtained) marksHtml += marksRow('Mathematics', academic.maths_obtained, 100)
  marksHtml += marksRow('English', academic.english_obtained, 100)
  if (academic.pcm_obtained) {
    marksHtml += marksRow('PCM Total', academic.pcm_obtained, 300)
    marksHtml += marksRow('PCME Total', academic.pcme_obtained, 400)
    marksHtml += marksRow('PCM Percentage', academic.pcm_percentage_obtained, 100)
    marksHtml += marksRow('PCME Percentage', academic.pcme_percentage_obtained, 100)
  }
  if (academic.pcb_obtained) {
    marksHtml += marksRow('PCB Total', academic.pcb_obtained, 300)
    marksHtml += marksRow('PCBE Total', academic.pcbe_obtained, 400)
    marksHtml += marksRow('PCB Percentage', academic.pcb_percentage_obtained, 100)
    marksHtml += marksRow('PCBE Percentage', academic.pcbe_percentage_obtained, 100)
  }
  html += `<table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:12px" class="avoid-break"><tbody>${marksHtml}</tbody></table>`

  html += tbl(section('Parallel Reservation & Application', '#e11d48') + row('Claim Exception?', demo.claim_exception) + row('Specified Reservation', demo.specified_reservation) + row('Apply For (Quota)', demo.quota_apply_for) + row('All Documents Received?', demo.documents_received))

  // Payments
  if (payments.length > 0) {
    let payRows = ''
    for (const p of payments) {
      payRows += `<tr><td style="padding:5px 10px;font-size:11px;color:#111827;border-bottom:1px solid #e5e7eb;font-weight:700">₹${Number(p.amount).toLocaleString('en-IN')}</td><td style="padding:5px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb">${p.payment_mode}</td><td style="padding:5px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb;font-family:monospace">${p.reference_no || '—'}</td><td style="padding:5px 10px;font-size:11px;color:${p.status === 'Paid' ? '#059669' : '#d97706'};border-bottom:1px solid #e5e7eb;font-weight:600">${p.status}</td><td style="padding:5px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb">${p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN') : '—'}</td></tr>`
    }
    const payHeader = `<tr style="background:#f3f4f6"><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Amount (₹)</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Mode</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Reference</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Status</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Date</td></tr>`
    html += `<table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:12px" class="avoid-break"><tbody>${section('Payment Information', '#059669')}${payHeader}${payRows}</tbody></table>`
  }

  // Notes
  if (admission?.notes) {
    html += tbl(section('Remarks / Notes', '#6b7280') + `<tr><td colspan="2" style="padding:8px 10px;font-size:11px;color:#374151;white-space:pre-wrap">${admission.notes}</td></tr>`)
  }

  // ═══ DOCUMENT VERIFICATION CHECKLIST PAGE ═══
  const courseName = admission?.course_name || ''
  const applicableDocs = getApplicableDocuments(courseName, demo)
  const grouped = groupByTier(applicableDocs)

  html += `<div style="page-break-before:always"></div>`

  // Checklist header
  html += `<div style="display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:3px double #1e40af;padding-bottom:12px;margin-bottom:14px">
    <img src="/LOGO CCP.png" alt="CCP Logo" style="width:48px;height:48px;object-fit:contain" />
    <div style="text-align:center">
      <h1 style="margin:0;font-size:16px;font-weight:800;color:#1e3a5f;letter-spacing:0.02em">DOCUMENT VERIFICATION CHECKLIST</h1>
      <p style="margin:4px 0 0;font-size:10px;color:#6b7280">Chanakya Career Point (CCP)</p>
    </div>
  </div>`

  // Student info bar
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:11px">
    <div><span style="font-weight:700;color:#6b7280">Admission No:</span> <span style="font-weight:800;font-family:monospace;color:#1e40af">${admission?.admission_number || '—'}</span></div>
    <div><span style="font-weight:700;color:#6b7280">Student:</span> <span style="font-weight:700;color:#111827">${student.full_name || '—'}</span></div>
    <div><span style="font-weight:700;color:#6b7280">Category:</span> <span style="font-weight:700;color:#111827">${demo.category_of_candidate || '—'}</span></div>
  </div>`

  // Helper for checklist row
  const checkRow = (label: string) => `<tr><td style="padding:7px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb;width:85%"><span style="display:inline-block;width:16px;height:16px;border:2px solid #9ca3af;border-radius:3px;margin-right:10px;vertical-align:middle"></span>${label}</td><td style="padding:7px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;text-align:center;width:15%"></td></tr>`

  const checkSectionHeader = (title: string, color: string, count: number) => `<tr><td colspan="2" style="padding:10px 10px 6px;font-weight:800;font-size:11px;color:${color};text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid ${color};background:#fff">${title} <span style="font-weight:600;font-size:10px;color:#9ca3af">(${count} documents)</span></td></tr>`

  const checkTableHeader = `<tr style="background:#f3f4f6"><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db">Document</td><td style="padding:6px 10px;font-weight:700;font-size:10px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #d1d5db;text-align:center">Remarks</td></tr>`

  let checklistHtml = ''

  // Mandatory documents
  if (grouped.mandatory.length > 0) {
    checklistHtml += checkSectionHeader('Mandatory Documents', '#dc2626', grouped.mandatory.length)
    checklistHtml += checkTableHeader
    for (const doc of grouped.mandatory) {
      checklistHtml += checkRow(doc.label)
    }
  }

  // Conditional documents (only shown for reserved categories)
  if (grouped.conditional.length > 0) {
    checklistHtml += checkSectionHeader('Category / Reservation Documents', '#d97706', grouped.conditional.length)
    checklistHtml += checkTableHeader
    for (const doc of grouped.conditional) {
      checklistHtml += checkRow(doc.label)
    }
  }

  // Optional documents
  if (grouped.optional.length > 0) {
    checklistHtml += checkSectionHeader('Optional Documents', '#6b7280', grouped.optional.length)
    checklistHtml += checkTableHeader
    for (const doc of grouped.optional) {
      checklistHtml += checkRow(doc.label)
    }
  }

  html += `<table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:16px"><tbody>${checklistHtml}</tbody></table>`

  // Verification footer
  html += `<div style="margin-top:30px;display:flex;justify-content:space-between;padding-top:16px">
    <div style="width:45%"><div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:30px">Verified by (Counselor Name):</div><div style="border-top:1px solid #374151;padding-top:6px;font-size:10px;font-weight:600;color:#374151">Counselor's Signature</div></div>
    <div style="width:45%"><div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:30px">Date of Verification:</div><div style="border-top:1px solid #374151;padding-top:6px;font-size:10px;font-weight:600;color:#374151">Authorized Signature &amp; Stamp</div></div>
  </div>`

  // Footer signatures (application form)
  html += `<div style="page-break-before:always"></div>`
  html += `<div style="text-align:center;margin-bottom:14px;padding-bottom:12px;border-bottom:3px double #1e40af">
    <img src="/LOGO CCP.png" alt="CCP Logo" style="width:48px;height:48px;object-fit:contain;display:inline-block" />
    <p style="margin:6px 0 0;font-size:14px;font-weight:800;color:#1e3a5f">DECLARATION & SIGNATURES</p>
    <p style="margin:2px 0 0;font-size:10px;color:#6b7280">Chanakya Career Point (CCP) — Admission No: ${admission?.admission_number || '—'}</p>
  </div>`

  html += `<div style="padding:16px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:20px;background:#fafafa">
    <p style="font-size:11px;color:#374151;line-height:1.8">I hereby declare that all the information provided in this admission application form is true and correct to the best of my knowledge. I understand that any false or misleading information may result in the cancellation of my admission.</p>
  </div>`

  html += `<div style="margin-top:20px;display:flex;justify-content:space-between;gap:30px">
    <div style="width:45%">
      <div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:6px">Parent's / Guardian's Name:</div>
      <div style="border-bottom:1px dashed #9ca3af;height:24px;margin-bottom:16px"></div>
      <div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:30px">Parent's Contact No.:</div>
      <div style="border-top:1px solid #374151;padding-top:6px;font-size:10px;font-weight:600;color:#374151;text-align:center">Parent's / Guardian's Signature</div>
    </div>
    <div style="width:45%">
      <div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:6px">Student's Name:</div>
      <div style="border-bottom:1px dashed #9ca3af;height:24px;margin-bottom:16px"></div>
      <div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:30px">Date:</div>
      <div style="border-top:1px solid #374151;padding-top:6px;font-size:10px;font-weight:600;color:#374151;text-align:center">Student's Signature</div>
    </div>
  </div>`

  html += `<div style="margin-top:40px;padding-top:16px;border-top:2px solid #d1d5db">
    <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">For Office Use Only</div>
    <div style="display:flex;justify-content:space-between">
      <div style="width:45%"><div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:30px">Received by:</div><div style="border-top:1px solid #374151;padding-top:6px;font-size:10px;font-weight:600;color:#374151;text-align:center">Authorized Signature &amp; Stamp</div></div>
      <div style="width:45%"><div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:30px">Date:</div><div style="border-top:1px solid #374151;padding-top:6px;font-size:10px;font-weight:600;color:#374151;text-align:center">Manager's Signature</div></div>
    </div>
  </div>`

  html += `<div style="text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af">Filled by: ${admission?.manager_name || '—'} &nbsp;|&nbsp; Printed on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>`

  return html
}

export function PrintAdmissionForm({ admission, onClose }: PrintAdmissionFormProps) {
  const handlePrint = () => {
    printHTML(buildHTML(admission))
  }

  const student = admission?.student_detail || {}
  const date = admission?.created_at ? new Date(admission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#f3f4f6', overflowY: 'auto' }}>
      {/* Toolbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <X size={14} /> Close
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={14} /> Print Form
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Preview below · Click &quot;Print Form&quot; to print or save as PDF</p>
      </div>

      {/* Preview */}
      <div style={{ maxWidth: 800, margin: '20px auto 60px', background: '#fff', padding: '30px 36px', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,.08)', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#111827' }}>
        <div style={{ textAlign: 'center', borderBottom: '3px double #1e40af', paddingBottom: 12, marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO CCP.png" alt="CCP Logo" style={{ width: 64, height: 64, objectFit: 'contain', display: 'inline-block' }} />
          <h1 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800, color: '#1e3a5f' }}>ADMISSION APPLICATION FORM</h1>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>Chanakya Career Point (CCP)</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Admission #</span>
            <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#1e40af' }}>{admission?.admission_number || '—'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Student</span>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#111827' }}>{student.full_name || '—'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Date</span>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#374151' }}>{date}</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>Full form will appear in the print output. Click &quot;Print Form&quot; above.</p>
      </div>
    </div>
  )
}
