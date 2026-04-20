'use client'

import { useState } from 'react'
import { Printer, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ReceiptItem {
  admission_number: string
  receipt_label?: string
  student_name: string
  student_mobile: string
  parent_mobile: string
  course_name: string
  course_fee: number
  amount_paid: number
  cumulative_paid?: number
  balance?: number
  payment_mode: string
  transaction_id: string
  branch_name: string
  branch_address: string
  date: string
  filled_by: string
  isEntranceOnly?: boolean
  payment_index?: number
  total_payments?: number
}

interface PrintFeeReceiptProps {
  receipts: ReceiptItem[]
  onPrint: () => void
  onBack: () => void
}

const v = (val: any) => (val && val !== '' ? String(val) : '—')

export function PrintFeeReceipt({ receipts, onPrint, onBack }: PrintFeeReceiptProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const total = receipts.length
  const data = receipts[currentPage]

  if (!data) return null

  const balance = data.balance != null ? data.balance : Math.max(0, (data.course_fee || 0) - (data.cumulative_paid || data.amount_paid || 0))
  const receiptNo = data.receipt_label || data.admission_number

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
            <Printer size={14} /> {total > 1 ? `Print All ${total} Receipts` : 'Print Receipt'}
          </button>
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, padding: '4px 12px', background: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ padding: 4, borderRadius: 6, border: 'none', background: currentPage === 0 ? '#e5e7eb' : '#2563eb', color: currentPage === 0 ? '#9ca3af' : '#fff', cursor: currentPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 60, textAlign: 'center' }}>
                Receipt {currentPage + 1} / {total}
              </span>
              <button onClick={() => setCurrentPage(p => Math.min(total - 1, p + 1))} disabled={currentPage === total - 1} style={{ padding: 4, borderRadius: 6, border: 'none', background: currentPage === total - 1 ? '#e5e7eb' : '#2563eb', color: currentPage === total - 1 ? '#9ca3af' : '#fff', cursor: currentPage === total - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
          {total > 1 ? `This admission has ${total} payment receipts. Use arrows to navigate. Print will output all receipts on separate pages.` : 'Print the receipt for the student.'}
        </p>
      </div>

      {/* ─── PRINTABLE RECEIPTS ─── */}
      {/* On screen: show only current page. On print: show all pages */}
      {receipts.map((r, idx) => {
        const rBalance = r.balance != null ? r.balance : Math.max(0, (r.course_fee || 0) - (r.cumulative_paid || r.amount_paid || 0))
        const rReceiptNo = r.receipt_label || r.admission_number
        const isScreenVisible = idx === currentPage

        return (
          <div
            key={idx}
            className="print-admission-form"
            id={`print-fee-receipt-${idx}`}
            style={!isScreenVisible ? { display: 'none' } : undefined}
          >
            {/* ══════ HEADER ══════ */}
            <div style={{ textAlign: 'center', paddingBottom: 10, marginBottom: 4 }}>
              {/* Logo + Title Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/LOGO CCP.png" alt="CCP" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e3a5f', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                    Chanakya Career Point | Fees Receipt
                  </h1>
                </div>
              </div>

              {/* Branch Address */}
              {r.branch_address && (
                <div style={{ borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', padding: '6px 0', marginTop: 4 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1e3a5f' }}>
                    <span style={{ fontWeight: 800 }}>{r.branch_name || 'CCP'} Branch : </span>
                    {r.branch_address}
                  </p>
                </div>
              )}
            </div>

            {/* ══════ RECEIPT INFO ══════ */}
            <div style={{ borderTop: '2px solid #1e3a5f', paddingTop: 12, marginBottom: 8 }}>
              {/* Receipt Number + Payment badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                  <span style={{ fontWeight: 800 }}>Receipt No : </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{rReceiptNo}</span>
                </p>
                {(r.total_payments || 0) > 1 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                    Payment {r.payment_index} of {r.total_payments}
                  </span>
                )}
              </div>

              {/* Student Name */}
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#111827' }}>
                <span style={{ fontWeight: 800 }}>Name : </span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{r.student_name}</span>
              </p>

              {/* Course + Student Mobile */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                  <span style={{ fontWeight: 800 }}>Course: </span>
                  <span style={{ fontWeight: 600 }}>{r.course_name}</span>
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                  <span style={{ fontWeight: 800 }}>Student Mo: </span>
                  <span style={{ fontWeight: 600 }}>{r.student_mobile}</span>
                </p>
              </div>

              {/* Parent Mobile + Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                  <span style={{ fontWeight: 800 }}>Parent&apos;s Mo: </span>
                  <span style={{ fontWeight: 600 }}>{v(r.parent_mobile)}</span>
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                  <span style={{ fontWeight: 800 }}>Date : </span>
                  <span style={{ fontWeight: 600 }}>{r.date}</span>
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
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>Total Course Fees</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center', fontWeight: 600 }}>
                    ₹{Number(r.course_fee || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>2</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>
                    {(r.total_payments || 0) > 1 ? `Received (Payment ${r.payment_index})` : 'Received Fees'}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>
                    ₹{Number(r.amount_paid || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {(r.total_payments || 0) > 1 && (r.cumulative_paid || 0) !== (r.amount_paid || 0) && (
                  <tr>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>3</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>Total Paid Till Date</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>
                      ₹{Number(r.cumulative_paid || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>{(r.total_payments || 0) > 1 && (r.cumulative_paid || 0) !== (r.amount_paid || 0) ? 4 : 3}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#374151', border: '1px solid #374151', textAlign: 'center' }}>Balance Fees</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: rBalance > 0 ? '#dc2626' : '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>
                    ₹{Number(rBalance).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ══════ PAYMENT MODE ══════ */}
            {r.payment_mode && r.payment_mode !== '—' && (
              <div style={{ display: 'flex', gap: 20, marginBottom: 10, fontSize: 12, color: '#374151' }}>
                <p style={{ margin: 0 }}><span style={{ fontWeight: 800 }}>Payment Mode:</span> {r.payment_mode}</p>
                {r.transaction_id && <p style={{ margin: 0 }}><span style={{ fontWeight: 800 }}>Ref/TXN:</span> {r.transaction_id}</p>}
              </div>
            )}

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
                  <span style={{ fontWeight: 600 }}>विद्यार्थ्याने दिलेली माहिती चुकीची असल्यास, फॉर्म मध्ये चुका झाल्यास त्यासाठी Chanakya Career Point जबाबदार नाही.</span>
                  <br /><span style={{ fontSize: 10, color: '#6b7280' }}>Chanakya Career Point is not responsible for any errors in the form caused by incorrect information provided by the student.</span>
                </li>
                <li style={{ marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>सर्व विद्यार्थ्यांने अचूक माहिती देणे गरजेचे आहे व दिलेल्या माहितीनुसार भरलेला फॉर्म काळजीपूर्वक पाहणे अनिवार्य आहे.</span>
                  <br /><span style={{ fontSize: 10, color: '#6b7280' }}>All students must provide accurate information and must carefully review the filled form.</span>
                </li>
                <li style={{ marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>WhatsApp Group मध्ये व SMS द्वारे कळवण्यात आलेली माहिती विद्यार्थ्याने व पालकाने काळजीपूर्वक वाचावी व समजले नसेल तर Chanakya Career Point ला संपर्क साधावा.</span>
                  <br /><span style={{ fontSize: 10, color: '#6b7280' }}>Information shared via WhatsApp Group and SMS should be read carefully by the student and parent. Contact Chanakya Career Point if unclear.</span>
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
                  <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 800, color: '#111827' }}>{r.filled_by || 'Coordinator'}</p>
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
        )
      })}

      {/* Print styles: show all receipts with page breaks */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-admission-form { display: block !important; page-break-after: always; }
          .print-admission-form:last-of-type { page-break-after: auto; }
        }
      `}</style>
    </div>
  )
}
