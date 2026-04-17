'use client'

import { Printer, X, ArrowRight } from 'lucide-react'

interface PrintFeeReceiptProps {
  data: {
    admission_number: string
    student_name: string
    student_mobile: string
    parent_mobile: string
    course_name: string
    course_fee: number
    amount_paid: number
    payment_mode: string
    transaction_id: string
    branch_name: string
    branch_address: string
    date: string
    filled_by: string
    isEntranceOnly?: boolean
  }
  onPrint: () => void
  onContinue: () => void
  onBack: () => void
}

const v = (val: any) => (val && val !== '' ? String(val) : '—')

export function PrintFeeReceipt({ data, onPrint, onContinue, onBack }: PrintFeeReceiptProps) {
  const balance = Math.max(0, (data.course_fee || 0) - (data.amount_paid || 0))

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="print-overlay">
      {/* Screen-only toolbar */}
      <div className="print-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <X size={14} /> Back to List
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={14} /> Print Receipt
          </button>
          {!data.isEntranceOnly && (
            <button onClick={onContinue} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <ArrowRight size={14} /> Continue to Complete Profile
            </button>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          {data.isEntranceOnly 
            ? 'Print the receipt for the student. This entrance guidance admission is now complete.'
            : 'Print the receipt for the student, then continue to fill the detailed profile.'}
        </p>
      </div>

      {/* ─── PRINTABLE RECEIPT ─── */}
      <div className="print-admission-form" id="print-fee-receipt">
        {/* ══════ HEADER ══════ */}
        <div style={{ textAlign: 'center', paddingBottom: 10, marginBottom: 4 }}>
          {/* Logo + Title Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO SVG.svg" alt="CCP" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e3a5f', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                Center for Career Planning | Fees Receipt
              </h1>
            </div>
          </div>

          {/* Branch Address */}
          {data.branch_address && (
            <div style={{ borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', padding: '6px 0', marginTop: 4 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1e3a5f' }}>
                <span style={{ fontWeight: 800 }}>{data.branch_name || 'CCP'} Branch : </span>
                {data.branch_address}
              </p>
            </div>
          )}
        </div>

        {/* ══════ RECEIPT INFO ══════ */}
        <div style={{ borderTop: '2px solid #1e3a5f', paddingTop: 12, marginBottom: 8 }}>
          {/* Receipt Number */}
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#111827' }}>
            <span style={{ fontWeight: 800 }}>Receipt No : </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{data.admission_number}</span>
          </p>

          {/* Student Name */}
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#111827' }}>
            <span style={{ fontWeight: 800 }}>Name : </span>
            <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{data.student_name}</span>
          </p>

          {/* Course + Student Mobile */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
              <span style={{ fontWeight: 800 }}>Course: </span>
              <span style={{ fontWeight: 600 }}>{data.course_name}</span>
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
              <span style={{ fontWeight: 800 }}>Student Mo: </span>
              <span style={{ fontWeight: 600 }}>{data.student_mobile}</span>
            </p>
          </div>

          {/* Parent Mobile + Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
              <span style={{ fontWeight: 800 }}>Parent&apos;s Mo: </span>
              <span style={{ fontWeight: 600 }}>{v(data.parent_mobile)}</span>
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
              <span style={{ fontWeight: 800 }}>Date : </span>
              <span style={{ fontWeight: 600 }}>{data.date}</span>
            </p>
          </div>
        </div>

        {/* ══════ FEE TABLE ══════ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #374151', margin: '14px 0 18px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 800, color: '#111827', border: '1px solid #374151', textAlign: 'center', width: '15%' }}>Sr No.</th>
              <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 800, color: '#111827', border: '1px solid #374151', textAlign: 'center', width: '55%' }}>Particulars</th>
              <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 800, color: '#111827', border: '1px solid #374151', textAlign: 'center', width: '30%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>1</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>Admission Fees</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center', fontWeight: 600 }}>
                ₹{Number(data.course_fee || 0).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>2</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>Received Fees</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>
                ₹{Number(data.amount_paid || 0).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>3</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>Balance Fees</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: balance > 0 ? '#dc2626' : '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>
                ₹{Number(balance).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══════ DECLARATION (Marathi + English) ══════ */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Declaration by the Student / विद्यार्थ्यांची घोषणा
          </h3>
          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 11, lineHeight: 1.8, color: '#374151' }}>
            <li style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>एकदा भरलेली फी कोणत्याही कारणास्तव वापस भेटली जाणार नाही.</span>
              <br /><span style={{ fontSize: 10, color: '#6b7280' }}>Fees once paid are non-refundable under any circumstances.</span>
            </li>
            <li style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>विद्यार्थ्याने दिलेली माहिती चुकीची असल्यास, फॉर्म मध्ये चुका झाल्यास त्यासाठी Center for Career Planning जबाबदार नाही.</span>
              <br /><span style={{ fontSize: 10, color: '#6b7280' }}>Center for Career Planning is not responsible for any errors in the form caused by incorrect information provided by the student.</span>
            </li>
            <li style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>सर्व विद्यार्थ्यांने अचूक माहिती देणे गरजेचे आहे व दिलेल्या माहितीनुसार भरलेला फॉर्म काळजीपूर्वक पाहणे अनिवार्य आहे.</span>
              <br /><span style={{ fontSize: 10, color: '#6b7280' }}>All students must provide accurate information and must carefully review the filled form.</span>
            </li>
            <li style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>Whatsapp Group मध्ये व SMS द्वारे कळवण्यात आलेली माहिती विद्यार्थ्याने व पालकाने काळजीपूर्वक वाचावी व समजले नसेल तर Center for Career Planning ला संपर्क साधावा.</span>
              <br /><span style={{ fontSize: 10, color: '#6b7280' }}>Information shared via WhatsApp Group and SMS should be read carefully by the student and parent. Contact Center for Career Planning if unclear.</span>
            </li>
          </ul>
        </div>

        {/* ══════ SIGNATURES (Student + Coordinator) ══════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40, paddingTop: 10 }}>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#111827' }}>Student Sign</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
              <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 800, color: '#111827' }}>{data.filled_by || 'Coordinator'}</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#6b7280' }}>Coordinator</p>
            </div>
          </div>
        </div>

        {/* Printed timestamp */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 8, borderTop: '1px solid #e5e7eb', fontSize: 8, color: '#9ca3af' }}>
          Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          &nbsp;|&nbsp; This is a computer-generated receipt.
        </div>
      </div>
    </div>
  )
}
