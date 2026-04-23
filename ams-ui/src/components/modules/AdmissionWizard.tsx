'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Printer, ArrowRight } from 'lucide-react'
import { admissionsApi, branchesApi } from '@/lib/api'
import { printHTML } from '@/lib/printUtils'
import { buildSingleReceiptHTML, PrintFeeReceipt } from './PrintFeeReceipt'
import { StepProgress } from './wizard/StepProgress'
import { WizardStep1 } from './wizard/WizardStep1'
import { WizardStep2 } from './wizard/WizardStep2'
import { WizardStep3 } from './wizard/WizardStep3'
import { WizardStep4 } from './wizard/WizardStep4'
import { WizardStep5 } from './wizard/WizardStep5'

/* ═══════════════════════════════════════════════════════════════
   MAIN WIZARD ORCHESTRATOR — 5-Step Admission Flow
   Step 1 → Receipt Modal → Step 2 → Step 3 → Step 4 → Step 5
   ═══════════════════════════════════════════════════════════════ */
export function AdmissionWizard({ onBack, editAdmission }: { onBack: () => void; editAdmission?: any }) {
  // Determine starting step based on editing state
  const getInitialStep = () => {
    if (!editAdmission) return 1
    if (editAdmission.is_finalized) return 5
    return 2
  }

  const [step, setStep] = useState(getInitialStep())
  const [completed, setCompleted] = useState<number[]>(editAdmission ? [1] : [])
  const [showReceipt, setShowReceipt] = useState(false)
  const [admissionData, setAdmissionData] = useState<any>(editAdmission || null)
  const [branches, setBranches] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receiptData, setReceiptData] = useState<any>(null)
  const [courseName, setCourseName] = useState(editAdmission?.course_name || '')
  const [documents, setDocuments] = useState<any[]>([])
  const [fullAdmission, setFullAdmission] = useState<any>(null)

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('ams_user') : null
  const user = userStr ? JSON.parse(userStr) : {}

  /* Phase 2 form state */
  const [p2, setP2] = useState<Record<string, any>>({
    neet_roll_no: '', neet_application_no: '', dob: '', neet_rank: '', neet_marks: '',
    jee_roll_no: '', jee_application_no: '', jee_rank: '', jee_percentile: '',
    full_name: '', name_changed: '', father_name: '', mother_name: '',
    gender: '', mobile: '', email: '', alternate_mobile: '', aadhaar_no: '', religion: '',
    address_line1: '', address_line2: '', address_line3: '', city: '',
    state: '', district: '', taluka: '', pincode: '',
    apply_nri: '', oci_pio: '', nationality: '', domicile_maharashtra: '',
    is_orphan: '', annual_income: '', region_of_residence: '', is_pwd: '',
    category_of_candidate: '', sub_category: '',
    claim_minority_quota: '', claim_linguistic_minority: '',
    selected_minority: '', selected_linguistic_minority: '',
    ssc_year: '', ssc_language: '', ssc_state: '', ssc_district: '', ssc_taluka: '', ssc_school_name: '', ssc_roll_no: '',
    hsc_name: '', hsc_exam: '', hsc_passing_year: '', hsc_roll_no: '',
    hsc_state: '', hsc_district: '', hsc_taluka: '', hsc_exam_session: '',
    physics_obtained: '', chemistry_obtained: '', maths_obtained: '', biology_obtained: '', english_obtained: '',
    pcb_obtained: '', pcm_obtained: '', pcbe_obtained: '', pcme_obtained: '',
    pcb_percentage_obtained: '', pcm_percentage_obtained: '', pcbe_percentage_obtained: '', pcme_percentage_obtained: '',
    claim_exception: '', specified_reservation: '',
    quota_apply_for: '', documents_received: '',
  })

  useEffect(() => { branchesApi.list().then(setBranches).catch(() => {}) }, [])

  // Pre-fill from edit data
  useEffect(() => {
    if (!editAdmission) return

    const loadEditData = async () => {
      try {
        const full = await admissionsApi.get(editAdmission.id)
        setAdmissionData(full)
        setCourseName(full.course_name || editAdmission.course_name || '')

        // Load documents
        if (full.documents?.length) setDocuments(full.documents)
        else admissionsApi.listDocuments(editAdmission.id).then(setDocuments).catch(() => {})

        // If finalized, store for preview
        if (full.is_finalized) setFullAdmission(full)

        // Pre-fill p2 from student_detail
        const s = full.student_detail || {}
        const acad = s.academic_details || {}
        const demo = s.demographic_details || {}

        setP2(prev => ({
          ...prev,
          // Personal
          full_name: s.full_name || full.student_name || '',
          mobile: s.mobile || full.student_mobile || '',
          email: s.email || '', gender: s.gender || '',
          dob: s.dob || '', aadhaar_no: s.aadhaar_no || '',
          father_name: s.father_name || '',
          alternate_mobile: s.alternate_mobile || '',
          // Academic / Exam
          neet_roll_no: acad.neet_roll_no || s.neet_roll_no || '',
          neet_application_no: acad.neet_application_no || '',
          neet_rank: s.neet_rank || acad.neet_rank || '',
          neet_marks: s.neet_marks || acad.neet_marks || '',
          jee_roll_no: acad.jee_roll_no || '', jee_application_no: acad.jee_application_no || '',
          jee_rank: acad.jee_rank || '', jee_percentile: acad.jee_percentile || '',
          // Demographic
          name_changed: demo.name_changed || '', mother_name: demo.mother_name || '',
          religion: demo.religion || '',
          address_line1: demo.address_line1 || '', address_line2: demo.address_line2 || '',
          address_line3: demo.address_line3 || '', city: demo.city || '',
          state: demo.state || '', district: demo.district || '',
          taluka: demo.taluka || '', pincode: demo.pincode || '',
          apply_nri: demo.apply_nri || '', oci_pio: demo.oci_pio || '',
          nationality: demo.nationality || '', domicile_maharashtra: demo.domicile_maharashtra || '',
          is_orphan: demo.is_orphan || '', annual_income: demo.annual_income || '',
          region_of_residence: demo.region_of_residence || '', is_pwd: demo.is_pwd || '',
          category_of_candidate: demo.category_of_candidate || '', sub_category: demo.sub_category || '',
          claim_minority_quota: demo.claim_minority_quota || '', claim_linguistic_minority: demo.claim_linguistic_minority || '',
          selected_minority: demo.selected_minority || '', selected_linguistic_minority: demo.selected_linguistic_minority || '',
          // SSC
          ssc_year: acad.ssc_year || '', ssc_language: acad.ssc_language || '',
          ssc_state: acad.ssc_state || '', ssc_district: acad.ssc_district || '',
          ssc_taluka: acad.ssc_taluka || '', ssc_school_name: acad.ssc_school_name || '',
          ssc_roll_no: acad.ssc_roll_no || '',
          // HSC
          hsc_name: acad.hsc_name || '', hsc_exam: acad.hsc_exam || '',
          hsc_passing_year: acad.hsc_passing_year || '', hsc_roll_no: acad.hsc_roll_no || '',
          hsc_state: acad.hsc_state || '', hsc_district: acad.hsc_district || '',
          hsc_taluka: acad.hsc_taluka || '', hsc_exam_session: acad.hsc_exam_session || '',
          // Marks
          physics_obtained: acad.physics_obtained || '', chemistry_obtained: acad.chemistry_obtained || '',
          maths_obtained: acad.maths_obtained || '', biology_obtained: acad.biology_obtained || '',
          english_obtained: acad.english_obtained || '',
          pcb_obtained: acad.pcb_obtained || '', pcm_obtained: acad.pcm_obtained || '',
          pcbe_obtained: acad.pcbe_obtained || '', pcme_obtained: acad.pcme_obtained || '',
          pcb_percentage_obtained: acad.pcb_percentage_obtained || '', pcm_percentage_obtained: acad.pcm_percentage_obtained || '',
          pcbe_percentage_obtained: acad.pcbe_percentage_obtained || '', pcme_percentage_obtained: acad.pcme_percentage_obtained || '',
          // Reservation / Application
          claim_exception: demo.claim_exception || '', specified_reservation: demo.specified_reservation || '',
          quota_apply_for: demo.quota_apply_for || '', documents_received: demo.documents_received || '',
        }))
      } catch {
        // Fallback: minimal pre-fill
        setP2(prev => ({ ...prev, full_name: editAdmission.student_name || '', mobile: editAdmission.student_mobile || '' }))
      }
    }

    loadEditData()
  }, [editAdmission])

  /* ── Step 1 Submit ── */
  const handleStep1 = async (p1: any, branchCourses: any[]) => {
    setSaving(true); setError('')
    try {
      const res = await admissionsApi.initiate({
        student_name: p1.student_name, student_mobile: p1.student_mobile,
        branch_id: p1.branch ? Number(p1.branch) : null, course_id: Number(p1.course_id),
        amount: p1.amount, payment_mode: p1.payment_mode, transaction_id: p1.transaction_id, notes: p1.notes,
      })
      setAdmissionData(res)
      setP2(prev => ({ ...prev, full_name: p1.student_name, mobile: p1.student_mobile }))

      const selectedCourse = branchCourses.find((c: any) => c.course.toString() === p1.course_id)
      const cName = selectedCourse?.course_name || ''
      setCourseName(cName)
      const branchId = p1.branch || user.branch_id?.toString()
      const branchObj = branches.find((b: any) => b.id.toString() === branchId)
      const isEntrance = cName.toLowerCase().includes('entrance') && cName.toLowerCase().includes('guidance')

      setReceiptData({
        admission_number: res.admission_number, student_name: p1.student_name,
        student_mobile: p1.student_mobile, parent_mobile: p1.parent_mobile,
        course_name: cName || '—', course_fee: Number(selectedCourse?.fee_amount || 0),
        amount_paid: Number(p1.amount), payment_mode: p1.payment_mode, transaction_id: p1.transaction_id,
        branch_name: branchObj?.name || user.branch_name || 'CCP', branch_address: branchObj?.address || '',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        filled_by: user.full_name || '—', isEntranceOnly: isEntrance,
      })
      setCompleted(prev => prev.includes(1) ? prev : [...prev, 1])

      // If entrance-only course, skip to final
      if (isEntrance) { setShowReceipt(true); }
      else { setShowReceipt(true) }
    } catch (e: any) { setError(e.message || 'Failed to create admission') }
    setSaving(false)
  }

  /* ── Step 2 Save Draft ── */
  const handleSaveDraft = async () => {
    if (!admissionData?.id) return
    setSaving(true); setError('')
    try {
      await admissionsApi.completeProfile(admissionData.id, { ...p2, finalize: false })
    } catch (e: any) { setError(e.message || 'Failed to save') }
    setSaving(false)
  }

  /* ── Step 2 Next ── */
  const handleStep2Next = async () => {
    if (!admissionData?.id) return
    setSaving(true); setError('')
    try {
      await admissionsApi.completeProfile(admissionData.id, { ...p2, finalize: false })
      setCompleted(prev => prev.includes(2) ? prev : [...prev, 2])
      setStep(3)
    } catch (e: any) { setError(e.message || 'Failed to save') }
    setSaving(false)
  }

  /* ── Step 4 Submit (Finalize) ── */
  const handleFinalize = async () => {
    if (!admissionData?.id) return
    setSaving(true); setError('')
    try {
      await admissionsApi.completeProfile(admissionData.id, { ...p2, finalize: true })
      const full = await admissionsApi.get(admissionData.id)
      setFullAdmission(full)
      setCompleted(prev => prev.includes(4) ? prev : [...prev, 4])
      setStep(5)
    } catch (e: any) { setError(e.message || 'Failed to finalize') }
    setSaving(false)
  }

  /* ── Navigate to step (from Step 4 edit buttons) ── */
  const goToStep = (s: number) => { setError(''); setStep(s) }

  /* ═══ RECEIPT MODAL ═══ */
  if (showReceipt && receiptData) {
    const receiptItem = {
      ...receiptData,
      cumulative_paid: receiptData.amount_paid,
      balance: Math.max(0, (receiptData.course_fee || 0) - (receiptData.amount_paid || 0)),
      receipt_label: receiptData.admission_number,
      payment_index: 1,
      total_payments: 1,
    }

    return (
      <PrintFeeReceipt
        receipts={[receiptItem]}
        onPrint={() => printHTML(buildSingleReceiptHTML(receiptItem))}
        onBack={() => setShowReceipt(false)}
        wizardActions={
          <div className="flex items-center gap-3">
            {!receiptData.isEntranceOnly && (
              <button onClick={() => { setShowReceipt(false); setStep(2) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                Continue to Step 2 <ArrowRight size={14} />
              </button>
            )}
            {receiptData.isEntranceOnly && (
              <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                Done — Back to Admissions
              </button>
            )}
          </div>
        }
      />
    )
  }

  /* ═══ STEP 5: Final Preview ═══ */
  if (step === 5 && fullAdmission) {
    return <WizardStep5 admission={fullAdmission} onBack={onBack} onEdit={() => setStep(4)} />
  }
  if (step === 5 && editAdmission?.is_finalized) {
    // Load full admission data
    if (!fullAdmission) {
      admissionsApi.get(editAdmission.id).then(setFullAdmission).catch(() => {})
      return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
    }
  }

  /* ═══ MAIN RENDER ═══ */
  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Admissions
      </button>

      {/* Progress bar (hide on step 1 for new admissions) */}
      {(step > 1 || completed.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl mb-6 shadow-sm">
          <StepProgress current={step} completed={completed} />
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && <WizardStep1 onSubmit={handleStep1} branches={branches} user={user} saving={saving} error={error} />}

      {/* Step 2 */}
      {step === 2 && (
        <WizardStep2
          p2={p2} setP2={setP2} courseName={courseName}
          admissionNumber={admissionData?.admission_number || editAdmission?.admission_number || ''}
          saving={saving} error={error}
          onSaveDraft={handleSaveDraft}
          onNext={handleStep2Next}
          onBack={() => setStep(1)}
        />
      )}

      {/* Step 3 */}
      {step === 3 && admissionData?.id && (
        <WizardStep3
          admissionId={admissionData.id}
          existingDocs={documents}
          courseName={courseName}
          formData={p2}
          onNext={() => {
            setCompleted(prev => prev.includes(3) ? prev : [...prev, 3])
            // Refresh documents list
            admissionsApi.listDocuments(admissionData.id).then(setDocuments).catch(() => {})
            setStep(4)
          }}
          onBack={() => setStep(2)}
        />
      )}

      {/* Step 4 */}
      {step === 4 && (
        <WizardStep4
          admissionData={admissionData || editAdmission}
          p2={p2} receiptData={receiptData} documents={documents}
          onEdit={goToStep} onSubmit={handleFinalize} saving={saving}
        />
      )}
    </div>
  )
}
