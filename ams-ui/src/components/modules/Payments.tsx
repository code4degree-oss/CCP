'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2, Inbox, X, Check, AlertCircle, ChevronRight, FileText, Printer } from 'lucide-react'
import { Card, Table } from '@/components/ui'
import { admissionsApi, paymentsApi } from '@/lib/api'
import { PrintFeeReceipt } from './PrintFeeReceipt'
import clsx from 'clsx'

interface PaymentSummary {
  admission_id: number
  admission_number: string
  student_name: string
  student_mobile: string
  course_name: string
  branch_name: string
  branch_id: number
  manager_name: string
  course_fee: number
  total_paid: number
  balance: number
  payment_status: string
  created_at: string
  admission_status: string
}

const TAB_ITEMS = [
  { label: 'Pending Payments', value: 'Pending', icon: AlertCircle, color: 'text-amber-600' },
  { label: 'Fully Paid', value: 'Fully Paid', icon: Check, color: 'text-emerald-600' },
]

export function PaymentsModule() {
  const [summaries, setSummaries] = useState<PaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Pending')

  // Record payment modal
  const [recordModal, setRecordModal] = useState<PaymentSummary | null>(null)
  const [rpForm, setRpForm] = useState({ amount: '', payment_mode: 'Cash', reference_no: '', notes: '' })
  const [rpSaving, setRpSaving] = useState(false)
  const [rpError, setRpError] = useState('')
  const [rpSuccess, setRpSuccess] = useState('')

  // Receipt view
  const [receiptView, setReceiptView] = useState<any[] | null>(null)

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('ams_user') : null
  const user = userStr ? JSON.parse(userStr) : {}

  const load = async () => {
    setLoading(true)
    try {
      const data = await admissionsApi.paymentSummary()
      setSummaries(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load payment summary')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = summaries.filter(s => s.payment_status === tab)

  const pendingCount = summaries.filter(s => s.payment_status === 'Pending').length
  const paidCount = summaries.filter(s => s.payment_status === 'Fully Paid').length
  const totalRevenue = summaries.reduce((s, p) => s + p.total_paid, 0)
  const totalPending = summaries.filter(s => s.payment_status === 'Pending').reduce((s, p) => s + p.balance, 0)

  const openRecordModal = (s: PaymentSummary) => {
    setRecordModal(s)
    setRpForm({ amount: s.balance.toString(), payment_mode: 'Cash', reference_no: '', notes: '' })
    setRpError('')
    setRpSuccess('')
  }

  const handleRecordPayment = async () => {
    if (!recordModal) return
    const amount = Number(rpForm.amount)
    if (!amount || amount <= 0) { setRpError('Enter a valid amount'); return }
    if (amount > recordModal.balance) { setRpError(`Amount cannot exceed balance ₹${recordModal.balance.toLocaleString('en-IN')}`); return }

    setRpSaving(true); setRpError('')
    try {
      await admissionsApi.recordPayment(recordModal.admission_id, {
        amount: rpForm.amount,
        payment_mode: rpForm.payment_mode,
        reference_no: rpForm.reference_no,
        notes: rpForm.notes,
      })
      setRpSuccess('Payment recorded successfully!')
      setTimeout(() => {
        setRecordModal(null)
        setRpSuccess('')
        load()
      }, 1200)
    } catch (e: any) {
      setRpError(e.message || 'Failed to record payment')
    }
    setRpSaving(false)
  }

  const openReceiptView = async (s: PaymentSummary) => {
    try {
      const fullData = await admissionsApi.get(s.admission_id)
      const payments = fullData.payments || []

      const receipts = payments.map((p: any, idx: number) => {
        const cumulativePaid = payments.slice(0, idx + 1).reduce((sum: number, pp: any) => sum + Number(pp.amount || 0), 0)
        return {
          admission_number: s.admission_number,
          receipt_label: payments.length > 1 ? `${s.admission_number}-${idx + 1}` : s.admission_number,
          student_name: s.student_name,
          student_mobile: s.student_mobile,
          parent_mobile: fullData.student_detail?.demographic_details?.alternate_mobile || '',
          course_name: s.course_name || '—',
          course_fee: s.course_fee,
          amount_paid: Number(p.amount || 0),
          cumulative_paid: cumulativePaid,
          balance: Math.max(0, s.course_fee - cumulativePaid),
          payment_mode: p.payment_mode || 'Cash',
          transaction_id: p.reference_no || '',
          branch_name: s.branch_name || 'CCP',
          branch_address: fullData.branch_address || '',
          date: new Date(p.paid_at || p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          filled_by: p.collected_by_name || s.manager_name || '—',
          payment_index: idx + 1,
          total_payments: payments.length,
        }
      })

      setReceiptView(receipts.length > 0 ? receipts : [{
        admission_number: s.admission_number,
        receipt_label: s.admission_number,
        student_name: s.student_name,
        student_mobile: s.student_mobile,
        parent_mobile: '',
        course_name: s.course_name || '—',
        course_fee: s.course_fee,
        amount_paid: 0, cumulative_paid: 0, balance: s.course_fee,
        payment_mode: '—', transaction_id: '',
        branch_name: s.branch_name || 'CCP', branch_address: '',
        date: new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        filled_by: s.manager_name || '—',
        payment_index: 1, total_payments: 1,
      }])
    } catch {
      setError('Failed to load receipts')
    }
  }

  // Receipt view
  if (receiptView) {
    return <PrintFeeReceipt receipts={receiptView} onPrint={() => window.print()} onBack={() => { setReceiptView(null) }} />
  }

  const columns = [
    {
      key: 'admission_number', label: 'Admission #',
      render: (r: PaymentSummary) => <span className="font-mono text-[11px] font-semibold text-blue-600">{r.admission_number || `#${r.admission_id}`}</span>
    },
    {
      key: 'student_name', label: 'Student',
      render: (r: PaymentSummary) => (
        <div>
          <p className="text-xs font-medium text-txt-primary">{r.student_name}</p>
          <p className="text-[10px] text-txt-muted">{r.student_mobile}</p>
        </div>
      )
    },
    {
      key: 'course_name', label: 'Course',
      render: (r: PaymentSummary) => <span className="text-[11px] text-txt-secondary">{r.course_name || '—'}</span>
    },
    {
      key: 'branch_name', label: 'Branch',
      render: (r: PaymentSummary) => <span className="text-[11px] text-txt-secondary">{r.branch_name || '—'}</span>
    },
    {
      key: 'course_fee', label: 'Total Fee',
      render: (r: PaymentSummary) => <span className="text-xs font-semibold text-gray-800">₹{r.course_fee.toLocaleString('en-IN')}</span>
    },
    {
      key: 'total_paid', label: 'Paid',
      render: (r: PaymentSummary) => <span className="text-xs font-bold text-emerald-600">₹{r.total_paid.toLocaleString('en-IN')}</span>
    },
    {
      key: 'balance', label: 'Balance',
      render: (r: PaymentSummary) => (
        <span className={clsx('text-xs font-bold', r.balance > 0 ? 'text-red-500' : 'text-emerald-600')}>
          ₹{r.balance.toLocaleString('en-IN')}
          {r.balance === 0 && <span className="ml-1 text-[9px] text-emerald-500">✓</span>}
        </span>
      )
    },
    {
      key: 'actions', label: '',
      render: (r: PaymentSummary) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openReceiptView(r) }}
            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 border border-emerald-200 bg-emerald-50/50 transition-colors flex items-center gap-1 text-[10px] font-medium"
            title="View Receipts"
          >
            <FileText size={12} /> Receipt
          </button>
          {r.balance > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); openRecordModal(r) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <CreditCard size={12} /> Record Payment
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-txt-primary">Payments</h2>
          <p className="text-[11px] text-txt-muted mt-0.5">
            {summaries.length} admissions · ₹{totalRevenue.toLocaleString('en-IN')} collected · ₹{totalPending.toLocaleString('en-IN')} pending
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-lg font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pending Amount</p>
          <p className="text-lg font-bold text-red-600 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fully Paid</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{paidCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-lg font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {TAB_ITEMS.map(t => {
          const Icon = t.icon
          const count = t.value === 'Pending' ? pendingCount : paidCount
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border',
                tab === t.value
                  ? 'bg-accent-blue text-white border-accent-blue shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon size={13} />
              {t.label}
              <span className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                tab === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-txt-muted" /></div>
      ) : (
        <Card>
          {filtered.length > 0 ? (
            <Table columns={columns} data={filtered} keyField="admission_id" />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox size={24} className="text-txt-muted mb-3" />
              <h4 className="text-sm font-medium text-txt-secondary">
                {tab === 'Pending' ? 'No pending payments' : 'No fully paid admissions'}
              </h4>
              <p className="text-xs text-txt-muted mt-1">
                {tab === 'Pending' ? 'All fees are collected! 🎉' : 'Payments will appear here once fully collected.'}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ══════ RECORD PAYMENT MODAL ══════ */}
      {recordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Record Payment</h3>
                    <p className="text-[11px] text-blue-100 mt-0.5">{recordModal.admission_number} — {recordModal.student_name}</p>
                  </div>
                </div>
                <button onClick={() => setRecordModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Course:</span>{' '}
                  <span className="font-semibold text-gray-800">{recordModal.course_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Branch:</span>{' '}
                  <span className="font-semibold text-gray-800">{recordModal.branch_name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Total Fee</p>
                    <p className="text-sm font-bold text-gray-800">₹{recordModal.course_fee.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Paid</p>
                    <p className="text-sm font-bold text-emerald-600">₹{recordModal.total_paid.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">Balance Due</p>
                  <p className="text-sm font-bold text-red-600">₹{recordModal.balance.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number" min="1" max={recordModal.balance}
                  value={rpForm.amount}
                  onChange={e => setRpForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder={`Max ₹${recordModal.balance.toLocaleString('en-IN')}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Mode <span className="text-red-500">*</span></label>
                  <select
                    value={rpForm.payment_mode}
                    onChange={e => setRpForm(f => ({ ...f, payment_mode: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white"
                  >
                    <option>Cash</option><option>Online</option><option>Cheque</option><option>NEFT/RTGS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reference / TXN ID</label>
                  <input
                    value={rpForm.reference_no}
                    onChange={e => setRpForm(f => ({ ...f, reference_no: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
                <input
                  value={rpForm.notes}
                  onChange={e => setRpForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="Optional remarks"
                />
              </div>

              {/* Balance preview */}
              {rpForm.amount && (() => {
                const paying = Number(rpForm.amount) || 0
                const newBalance = Math.max(0, recordModal.balance - paying)
                return (
                  <div className={clsx('flex items-center justify-between px-3 py-2 rounded-lg border', newBalance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200')}>
                    <span className="text-xs font-medium text-gray-600">After this payment:</span>
                    <span className={clsx('text-xs font-bold', newBalance > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                      Balance ₹{newBalance.toLocaleString('en-IN')} {newBalance === 0 && '✓ Fully Paid'}
                    </span>
                  </div>
                )
              })()}

              {rpError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">{rpError}</p>}
              {rpSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2"><Check size={14} /> {rpSuccess}</p>}

              <button
                onClick={handleRecordPayment}
                disabled={rpSaving || !rpForm.amount || Number(rpForm.amount) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {rpSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Record Payment — ₹{Number(rpForm.amount || 0).toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
