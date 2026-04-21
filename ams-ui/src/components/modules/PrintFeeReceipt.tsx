'use client'

import { useState } from 'react'
import { Printer, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { printHTML } from '@/lib/printUtils'

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

function buildReceiptHTML(r: ReceiptItem): string {
  const balance = r.balance != null ? r.balance : Math.max(0, (r.course_fee || 0) - (r.cumulative_paid || r.amount_paid || 0))
  const receiptNo = r.receipt_label || r.admission_number
  const hasMultiple = (r.total_payments || 0) > 1
  const showCumulative = hasMultiple && (r.cumulative_paid || 0) !== (r.amount_paid || 0)

  let html = `<div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111827">`

  // Header
  html += `<div style="text-align:center;padding-bottom:10px;margin-bottom:4px">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:6px">
      <img src="/LOGO CCP.png" alt="CCP" style="width:56px;height:56px;object-fit:contain" />
      <div><h1 style="margin:0;font-size:22px;font-weight:900;color:#1e3a5f;font-style:italic;font-family:Georgia,serif">Chanakya Career Point | Fees Receipt</h1></div>
    </div>`
  if (r.branch_address) {
    html += `<div style="border-top:1px solid #d1d5db;border-bottom:1px solid #d1d5db;padding:6px 0;margin-top:4px">
      <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f"><span style="font-weight:800">${r.branch_name || 'CCP'} Branch : </span>${r.branch_address}</p>
    </div>`
  }
  html += `</div>`

  // Receipt info
  html += `<div style="border-top:2px solid #1e3a5f;padding-top:12px;margin-bottom:8px">`
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Receipt No : </span><span style="font-family:monospace;font-weight:700;color:#1e40af">${receiptNo}</span></p>`
  if (hasMultiple) {
    html += `<span style="font-size:10px;font-weight:700;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px;border:1px solid #e5e7eb">Payment ${r.payment_index} of ${r.total_payments}</span>`
  }
  html += `</div>`
  html += `<p style="margin:0 0 8px;font-size:13px;color:#111827"><span style="font-weight:800">Name : </span><span style="text-transform:uppercase;font-weight:600">${r.student_name}</span></p>`
  html += `<div style="display:flex;justify-content:space-between;margin-bottom:8px">
    <p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Course: </span><span style="font-weight:600">${r.course_name}</span></p>
    <p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Student Mo: </span><span style="font-weight:600">${r.student_mobile}</span></p>
  </div>`
  html += `<div style="display:flex;justify-content:space-between;margin-bottom:4px">
    <p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Parent's Mo: </span><span style="font-weight:600">${v(r.parent_mobile)}</span></p>
    <p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Date : </span><span style="font-weight:600">${r.date}</span></p>
  </div></div>`

  // Fee table
  const cellStyle = 'padding:8px 12px;font-size:12px;border:1px solid #374151;text-align:center'
  const thStyle = `${cellStyle};font-weight:800;color:#111827`
  let srNo = 1

  html += `<table style="width:100%;border-collapse:collapse;border:1.5px solid #374151;margin:14px 0 18px">
    <thead><tr style="background:#f3f4f6">
      <th style="${thStyle};width:15%">Sr No.</th><th style="${thStyle};width:55%">Particulars</th><th style="${thStyle};width:30%">Amount</th>
    </tr></thead><tbody>`
  html += `<tr><td style="${cellStyle};color:#374151">${srNo++}</td><td style="${cellStyle};color:#374151">Total Course Fees</td><td style="${cellStyle};color:#374151;font-weight:600">₹${Number(r.course_fee || 0).toLocaleString('en-IN')}</td></tr>`
  html += `<tr><td style="${cellStyle};color:#374151">${srNo++}</td><td style="${cellStyle};color:#374151">${hasMultiple ? `Received (Payment ${r.payment_index})` : 'Received Fees'}</td><td style="${cellStyle};color:#059669;font-weight:700">₹${Number(r.amount_paid || 0).toLocaleString('en-IN')}</td></tr>`
  if (showCumulative) {
    html += `<tr><td style="${cellStyle};color:#374151">${srNo++}</td><td style="${cellStyle};color:#374151">Total Paid Till Date</td><td style="${cellStyle};color:#059669;font-weight:700">₹${Number(r.cumulative_paid || 0).toLocaleString('en-IN')}</td></tr>`
  }
  html += `<tr><td style="${cellStyle};color:#374151">${srNo}</td><td style="${cellStyle};color:#374151">Balance Fees</td><td style="${cellStyle};color:${balance > 0 ? '#dc2626' : '#059669'};font-weight:700">₹${Number(balance).toLocaleString('en-IN')}</td></tr>`
  html += `</tbody></table>`

  // Payment mode
  if (r.payment_mode && r.payment_mode !== '—') {
    html += `<div style="display:flex;gap:20px;margin-bottom:10px;font-size:12px;color:#374151">
      <p style="margin:0"><span style="font-weight:800">Payment Mode:</span> ${r.payment_mode}</p>`
    if (r.transaction_id) html += `<p style="margin:0"><span style="font-weight:800">Ref/TXN:</span> ${r.transaction_id}</p>`
    html += `</div>`
  }

  // Declaration
  html += `<div style="margin-bottom:20px">
    <h3 style="font-size:13px;font-weight:800;color:#dc2626;text-align:center;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.03em">Declaration by the Student / विद्यार्थ्यांची घोषणा</h3>
    <ol style="padding-left:20px;margin:0;font-size:10px;line-height:1.6;color:#374151">
      <li style="margin-bottom:4px"><strong>Fees once paid are non-refundable under any circumstances.</strong></li>
      <li style="margin-bottom:4px"><strong>Chanakya Career Point is not responsible for any errors in the form caused by incorrect information provided by the student.</strong></li>
      <li style="margin-bottom:4px"><strong>All students must provide accurate information and must carefully review the filled form.</strong></li>
      <li style="margin-bottom:12px"><strong>Information shared via WhatsApp Group and SMS should be read carefully by the student and parent. Contact Chanakya Career Point if unclear.</strong></li>
    </ol>
    <ol style="padding-left:20px;margin:0;font-size:11px;line-height:1.6;color:#374151">
      <li style="margin-bottom:4px"><strong>एकदा भरलेली फी कोणत्याही कारणास्तव वापस भेटली जाणार नाही.</strong></li>
      <li style="margin-bottom:4px"><strong>विद्यार्थ्याने दिलेली माहिती चुकीची असल्यास, फॉर्म मध्ये चुका झाल्यास त्यासाठी Chanakya Career Point जबाबदार नाही.</strong></li>
      <li style="margin-bottom:4px"><strong>सर्व विद्यार्थ्यांने अचूक माहिती देणे गरजेचे आहे व दिलेल्या माहितीनुसार भरलेला फॉर्म काळजीपूर्वक पाहणे अनिवार्य आहे.</strong></li>
      <li style="margin-bottom:5px"><strong>WhatsApp Group मध्ये व SMS द्वारे कळवण्यात आलेली माहिती विद्यार्थ्याने व पालकाने काळजीपूर्वक वाचावी व समजले नसेल तर Chanakya Career Point ला संपर्क साधावा.</strong></li>
    </ol>
  </div>`

  // Signatures
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:10px">
    <div style="text-align:center;width:40%"><div style="border-top:1px solid #374151;padding-top:6px"><p style="margin:0;font-size:12px;font-weight:800;color:#111827">Student Sign</p></div></div>
    <div style="text-align:center;width:40%"><div style="border-top:1px solid #374151;padding-top:6px"><p style="margin:0 0 1px;font-size:12px;font-weight:800;color:#111827">${r.filled_by || 'Coordinator'}</p><p style="margin:0;font-size:10px;font-weight:600;color:#6b7280">Coordinator</p></div></div>
  </div>`

  html += `<div style="text-align:center;margin-top:24px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:8px;color:#9ca3af">Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &nbsp;|&nbsp; This is a computer-generated receipt.</div>`

  html += `</div>`
  return html
}

export function PrintFeeReceipt({ receipts, onPrint, onBack }: PrintFeeReceiptProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const total = receipts.length
  const data = receipts[currentPage]

  if (!data) return null

  const handlePrint = () => {
    // Build all receipts with page breaks between them
    const allHTML = receipts.map((r, i) => {
      const pageClass = i < receipts.length - 1 ? 'page-break' : ''
      return `<div class="${pageClass}">${buildReceiptHTML(r)}</div>`
    }).join('')
    printHTML(allHTML)
  }

  const balance = data.balance != null ? data.balance : Math.max(0, (data.course_fee || 0) - (data.cumulative_paid || data.amount_paid || 0))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#f3f4f6', overflowY: 'auto' }}>
      {/* Toolbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
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
          {total > 1 ? `This admission has ${total} payment receipts. Use arrows to preview. Print will output all receipts on separate pages.` : 'Print the receipt for the student.'}
        </p>
      </div>

      {/* Preview - current receipt */}
      <div style={{ maxWidth: 800, margin: '20px auto 60px', background: '#fff', padding: '30px 36px', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,.08)', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#111827' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: 10, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO CCP.png" alt="CCP" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e3a5f', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Chanakya Career Point | Fees Receipt</h1>
          </div>
          {data.branch_address && (
            <div style={{ borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', padding: '6px 0', marginTop: 4 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1e3a5f' }}>
                <span style={{ fontWeight: 800 }}>{data.branch_name || 'CCP'} Branch : </span>{data.branch_address}
              </p>
            </div>
          )}
        </div>

        {/* Receipt info */}
        <div style={{ borderTop: '2px solid #1e3a5f', paddingTop: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
              <span style={{ fontWeight: 800 }}>Receipt No : </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{data.receipt_label || data.admission_number}</span>
            </p>
            {(data.total_payments || 0) > 1 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                Payment {data.payment_index} of {data.total_payments}
              </span>
            )}
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13 }}><span style={{ fontWeight: 800 }}>Name : </span><span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{data.student_name}</span></p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 13 }}><span style={{ fontWeight: 800 }}>Course: </span>{data.course_name}</p>
            <p style={{ margin: 0, fontSize: 13 }}><span style={{ fontWeight: 800 }}>Student Mo: </span>{data.student_mobile}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 13 }}><span style={{ fontWeight: 800 }}>Parent&apos;s Mo: </span>{v(data.parent_mobile)}</p>
            <p style={{ margin: 0, fontSize: 13 }}><span style={{ fontWeight: 800 }}>Date : </span>{data.date}</p>
          </div>
        </div>

        {/* Fee summary */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #374151', margin: '14px 0 18px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 800, border: '1px solid #374151', textAlign: 'center', width: '15%' }}>Sr No.</th>
              <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 800, border: '1px solid #374151', textAlign: 'center', width: '55%' }}>Particulars</th>
              <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 800, border: '1px solid #374151', textAlign: 'center', width: '30%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center' }}>1</td>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center' }}>Total Course Fees</td>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center', fontWeight: 600 }}>₹{Number(data.course_fee || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center' }}>2</td>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center' }}>
                {(data.total_payments || 0) > 1 ? `Received (Payment ${data.payment_index})` : 'Received Fees'}
              </td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>₹{Number(data.amount_paid || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center' }}>3</td>
              <td style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #374151', textAlign: 'center' }}>Balance Fees</td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: balance > 0 ? '#dc2626' : '#059669', border: '1px solid #374151', textAlign: 'center', fontWeight: 700 }}>₹{Number(balance).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: '#9ca3af' }}>
          This is a preview. Click &quot;Print Receipt&quot; above for the full output with declaration &amp; signatures.
        </div>
      </div>
    </div>
  )
}
