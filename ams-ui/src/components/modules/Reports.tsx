'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, FileSpreadsheet, Calendar, BookOpen } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { admissionsApi, branchesApi, branchCoursesApi, coursesApi, enquiriesApi, paymentsApi } from '@/lib/api'
import * as XLSX from 'xlsx-js-style'

export function ReportsModule() {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [filterBranch, setFilterBranch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [error, setError] = useState('')

  const [filterEnqBranch, setFilterEnqBranch] = useState('')
  const [filterEnqCourseType, setFilterEnqCourseType] = useState('')
  const [filterEnqDateFrom, setFilterEnqDateFrom] = useState('')
  const [filterEnqDateTo, setFilterEnqDateTo] = useState('')
  const [enqLoading, setEnqLoading] = useState(false)
  const [enqError, setEnqError] = useState('')

  const [filterPayBranch, setFilterPayBranch] = useState('')
  const [filterPayCourse, setFilterPayCourse] = useState('')
  const [filterPayDateFrom, setFilterPayDateFrom] = useState('')
  const [filterPayDateTo, setFilterPayDateTo] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ams_user') || '{}') : {}
  const isSuper = currentUser.is_superuser || currentUser.role === 'Super Admin'

  useEffect(() => {
    Promise.all([coursesApi.list(), branchesApi.list()]).then(([c, b]) => {
      setCourses(c)
      setBranches(b)
    }).catch(console.error)
  }, [])

  const handleExport = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch base admissions list
      let qs = '?'
      if (filterBranch) qs += `branch=${filterBranch}&`
      if (filterCourse) qs += `course=${filterCourse}&`
      if (filterDateFrom) qs += `date_from=${filterDateFrom}&`
      if (filterDateTo) qs += `date_to=${filterDateTo}&`
      
      let list = await admissionsApi.list(qs !== '?' ? qs : undefined)
      if (!list || list.length === 0) {
        setError('No admissions found for the selected filters.')
        setLoading(false)
        return
      }

      // Client-side filtering as safety net (in case backend doesn't support query params yet)
      if (filterBranch) list = list.filter((a: any) => String(a.branch) === filterBranch || String(a.student_detail?.branch) === filterBranch)
      if (filterCourse) list = list.filter((a: any) => String(a.course) === filterCourse)
      if (filterDateFrom) list = list.filter((a: any) => a.created_at && a.created_at.slice(0, 10) >= filterDateFrom)
      if (filterDateTo) list = list.filter((a: any) => a.created_at && a.created_at.slice(0, 10) <= filterDateTo)

      if (list.length === 0) {
        setError('No admissions found for the selected filters.')
        setLoading(false)
        return
      }

      const fullData = list

      // Flatten data for Excel
      const excelData = fullData.map((a: any) => {
        const details = a.student_detail || {}
        const acad = details.academic_details || {}
        const demo = details.demographic_details || {}
        
        const displayStatus = a.admission_status || '-'

        return {
          'Admission Number': a.admission_number || '-',
          'Date of Admission': a.created_at ? new Date(a.created_at).toLocaleDateString() : '-',
          'Student Name': a.student_name || details.full_name || '-',
          'Mobile': a.student_mobile || details.mobile || '-',
          'Email': details.email || '-',
          'Gender': details.gender || '-',
          'DOB': details.dob || '-',
          'Branch': a.branch_name || '-',
          'Course': a.course_name || '-',
          'Admission Status': displayStatus,
          'Counselling Type': a.counselling_type || '-',
          
          // Address & Demographic
          'City': demo.city || '-',
          'Taluka': demo.taluka || '-',
          'District': demo.district || '-',
          'State': demo.state || '-',
          'Pincode': demo.pincode || '-',
          'Father Name': details.father_name || '-',
          'Mother Name': demo.mother_name || '-',
          'Name Changed': demo.name_changed || '-',

          // Academic SSC
          'SSC Board': acad.ssc_board || '-',
          'SSC Year': acad.ssc_year || '-',
          'SSC %': acad.ssc_percentage || '-',
          'SSC Language': acad.ssc_language || '-',
          'SSC State': acad.ssc_state || '-',
          'SSC District': acad.ssc_district || '-',
          'SSC Taluka': acad.ssc_taluka || '-',
          'SSC School Name': acad.ssc_school_name || '-',

          // Academic HSC
          'HSC Year': acad.hsc_passing_year || '-',
          'HSC Name': acad.hsc_name || '-',
          'HSC Exam': acad.hsc_exam || '-',
          'HSC Roll No': acad.hsc_roll_no || '-',
          'HSC State': acad.hsc_state || '-',
          'HSC District': acad.hsc_district || '-',
          'HSC Taluka': acad.hsc_taluka || '-',
          'HSC Exam Session': acad.hsc_exam_session || '-',

          // Marks & Competitive Exams
          'Physics Marks': acad.physics_obtained || '-',
          'Chemistry Marks': acad.chemistry_obtained || '-',
          'Maths Marks': acad.maths_obtained || '-',
          'Biology Marks': acad.biology_obtained || '-',
          'English Marks': acad.english_obtained || '-',
          'PCB Total': acad.pcb_obtained || '-',
          'PCM Total': acad.pcm_obtained || '-',
          'PCBE Total': acad.pcbe_obtained || '-',
          'PCME Total': acad.pcme_obtained || '-',
          'PCB %': acad.pcb_percentage_obtained || '-',
          'PCM %': acad.pcm_percentage_obtained || '-',
          'PCBE %': acad.pcbe_percentage_obtained || '-',
          'PCME %': acad.pcme_percentage_obtained || '-',
          'NEET Marks': acad.neet_marks || details.neet_marks || '-',
          'NEET Roll No': acad.neet_roll_no || details.neet_roll_no || '-',
          'NEET Application No': acad.neet_application_no || '-',
          'NEET Rank': acad.neet_rank || details.neet_rank || '-',
          'JEE Percentile': acad.jee_percentile || '-',
          'JEE Roll No': acad.jee_roll_no || '-',
          'JEE Application No': acad.jee_application_no || '-',
          'JEE Rank': acad.jee_rank || '-',
          
          // Reservation & Status
          'Category': demo.category_of_candidate || '-',
          'Sub Category': demo.sub_category || '-',
          'Religion': demo.religion || '-',
          'Aadhaar': details.aadhaar_no || '-',
          'Parent Mobile': details.alternate_mobile || '-',
          'Apply NRI': demo.apply_nri || '-',
          'OCI/PIO': demo.oci_pio || '-',
          'Nationality': demo.nationality || '-',
          'Domicile Maharashtra': demo.domicile_maharashtra || '-',
          'Is Orphan': demo.is_orphan || '-',
          'Annual Income': demo.annual_income || '-',
          'Region of Residence': demo.region_of_residence || '-',
          'Is PWD': demo.is_pwd || '-',
          'Claim Minority Quota': demo.claim_minority_quota || '-',
          'Claim Linguistic Minority': demo.claim_linguistic_minority || '-',
          'Claim Exception': demo.claim_exception || '-',
          'Specified Reservation': demo.specified_reservation || '-',
          'Quota Apply For': demo.quota_apply_for || '-',
          'Documents Received': demo.documents_received || '-',
        }
      })

      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Admissions')
      XLSX.writeFile(workbook, `Admissions_Report_${new Date().getTime()}.xlsx`)

    } catch (err: any) {
      console.error(err)
      setError('Failed to generate report. Please try again.')
    }
    setLoading(false)
  }

  const handleEnquiryExport = async () => {
    setEnqLoading(true)
    setEnqError('')
    try {
      let qs = '?'
      if (filterEnqBranch) qs += `branch=${filterEnqBranch}&`
      if (filterEnqCourseType) qs += `course_type=${filterEnqCourseType}&`
      if (filterEnqDateFrom) qs += `date_from=${filterEnqDateFrom}&`
      if (filterEnqDateTo) qs += `date_to=${filterEnqDateTo}&`
      
      let list = await enquiriesApi.list(qs !== '?' ? qs : undefined)
      if (!list || list.length === 0) {
        setEnqError('No enquiries found for the selected filters.')
        setEnqLoading(false)
        return
      }

      // Client-side filtering as safety net
      if (filterEnqBranch) list = list.filter((e: any) => String(e.branch) === filterEnqBranch)
      if (filterEnqCourseType) list = list.filter((e: any) => e.course_type && e.course_type.toLowerCase() === filterEnqCourseType.toLowerCase())
      if (filterEnqDateFrom) list = list.filter((e: any) => e.created_at && e.created_at.slice(0, 10) >= filterEnqDateFrom)
      if (filterEnqDateTo) list = list.filter((e: any) => e.created_at && e.created_at.slice(0, 10) <= filterEnqDateTo)

      if (list.length === 0) {
        setEnqError('No enquiries found for the selected filters.')
        setEnqLoading(false)
        return
      }

      const excelData = list.map((e: any) => ({
        'ID': e.id,
        'Date': e.created_at ? new Date(e.created_at).toLocaleDateString() : '-',
        'Full Name': e.full_name || '-',
        'Mobile': e.mobile || '-',
        'Parent Mobile': e.parent_mobile || '-',
        'Mother Name': e.mother_name || '-',
        'Gender': e.gender || '-',
        'DOB': e.dob || '-',
        'Branch': branches.find((b:any) => b.id === e.branch)?.name || '-',
        'Category': e.category || '-',
        'Candidate Type': e.candidate_type || '-',
        'HSC %': e.hsc_percentage || '-',
        'Course Type': e.course_type || '-',
        'Course Interest': e.course_interest || '-',
        'Source': e.source || '-',
        'Tuition Name': e.tuition_name || '-',
        'Reference Name': e.reference_name || '-',
        'Filled By': e.counselor_name || '-',
        
        // Engineering
        'JEE Application No': e.jee_application_no || '-',
        'JEE Expected Marks': e.jee_expected_marks || '-',
        'MHT CET (PCM) App No': e.mht_cet_pcm_application_no || '-',
        'MHT CET (PCM) Marks': e.mht_cet_pcm_expected_marks || '-',
        
        // Medical
        'NEET Application No': e.neet_application_no || '-',
        'NEET Expected Marks': e.neet_expected_marks || '-',
        'NEET Roll No': e.neet_roll_no || '-',
        'MHT CET (PCB) App No': e.mht_cet_pcb_application_no || '-',
        'MHT CET (PCB) Marks': e.mht_cet_pcb_expected_marks || '-',
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries')
      XLSX.writeFile(workbook, `Enquiries_Report_${new Date().getTime()}.xlsx`)

    } catch (err: any) {
      console.error(err)
      setEnqError('Failed to generate report. Please try again.')
    }
    setEnqLoading(false)
  }

  const handlePaymentExport = async () => {
    setPayLoading(true)
    setPayError('')
    try {
      let qs = '?'
      if (filterPayBranch) qs += `branch=${filterPayBranch}&`
      if (filterPayCourse) qs += `course=${filterPayCourse}&`
      if (filterPayDateFrom) qs += `date_from=${filterPayDateFrom}&`
      if (filterPayDateTo) qs += `date_to=${filterPayDateTo}&`
      
      let list = await paymentsApi.list(qs !== '?' ? qs : undefined)
      if (!list || list.length === 0) {
        setPayError('No payments found for the selected filters.')
        setPayLoading(false)
        return
      }

      // Client-side filtering as safety net
      if (filterPayBranch) list = list.filter((p: any) => String(p.branch_id) === filterPayBranch)
      if (filterPayCourse) list = list.filter((p: any) => String(p.admission?.course) === filterPayCourse)
      if (filterPayDateFrom) list = list.filter((p: any) => p.paid_at && p.paid_at.slice(0, 10) >= filterPayDateFrom)
      if (filterPayDateTo) list = list.filter((p: any) => p.paid_at && p.paid_at.slice(0, 10) <= filterPayDateTo)

      if (list.length === 0) {
        setPayError('No payments found for the selected filters.')
        setPayLoading(false)
        return
      }

      // Fetch branch-course fees to compute total course fee per payment
      let bcList: any[] = []
      try {
        bcList = await branchCoursesApi.list()
      } catch { /* ignore */ }

      // Build a lookup: (branch_id, course_name) -> fee info
      const bcLookup: Record<string, any> = {}
      for (const bc of bcList) {
        bcLookup[`${bc.branch}_${bc.course_name}`] = bc
        bcLookup[`${bc.branch}_${bc.course}`] = bc
      }

      // Helper: resolve the correct course fee based on counselling_type
      // Mirrors the backend payment_summary logic exactly
      const resolveCourseFee = (branchId: any, courseName: string, courseId: any, counsellingType: string): number => {
        let bc = bcLookup[`${branchId}_${courseName}`]
        if (!bc) bc = bcLookup[`${branchId}_${courseId || ''}`]
        if (!bc) return 0

        const ct = (counsellingType || '').trim().toLowerCase()
        if (bc.counselling_fees && bc.counselling_fees.length > 0 && ct) {
          // Map counselling_type to the correct key (same logic as backend)
          let ctKey: string | null = null
          if (ct.includes('both')) ctKey = 'Both'
          else if (ct.includes('combo')) ctKey = 'Combo_Medical'
          else if (ct.includes('josaa')) ctKey = 'JoSAA'
          else if (ct.includes('cet') && !ct.includes('combo')) ctKey = 'CET'
          else if (ct.includes('maharashtra')) ctKey = 'MH_Medical'
          else if (ct.includes('other state')) ctKey = 'Other_Medical'

          if (ctKey) {
            const cf = bc.counselling_fees.find((f: any) => f.counselling_type === ctKey)
            if (cf) return Number(cf.fee_amount)
          }
        }
        return Number(bc.fee_amount || 0)
      }

      // Group payments by admission to calculate per-admission totals correctly
      // This avoids double-counting fees when a student has multiple payments
      const admissionGroups: Record<string, { payments: any[], courseFee: number, totalPaid: number }> = {}
      for (const p of list) {
        const admId = p.admission_number || p.admission?.id || p.id
        if (!admissionGroups[admId]) {
          const courseFee = resolveCourseFee(
            p.branch_id,
            p.course_name || '',
            p.admission?.course || '',
            p.counselling_type || p.admission?.counselling_type || ''
          )
          admissionGroups[admId] = { payments: [], courseFee, totalPaid: 0 }
        }
        admissionGroups[admId].payments.push(p)
        admissionGroups[admId].totalPaid += Number(p.amount || 0)
      }

      let totalAmountPaid = 0
      let totalCourseFee = 0
      let totalDuePayment = 0
      // Track unique admissions for Total Fees (count each admission's fee only once)
      const seenAdmissions = new Set<string>()

      const excelData = list.map((p: any) => {
        const admId = p.admission_number || p.admission?.id || p.id
        const group = admissionGroups[admId]
        const courseFee = group?.courseFee || 0
        const paidAmount = Number(p.amount || 0)
        // Due is per-admission: total course fee minus ALL payments for this admission
        const admissionDue = Math.max(0, courseFee - (group?.totalPaid || 0))

        totalAmountPaid += paidAmount

        // Only count course fee and due once per admission (avoid double-counting)
        if (!seenAdmissions.has(admId)) {
          seenAdmissions.add(admId)
          totalCourseFee += courseFee
          totalDuePayment += admissionDue
        }

        return {
          'Payment ID': p.id,
          'Student Name': p.student_name || '-',
          'Course Name': p.course_name || '-',
          'Branch': p.branch_name || '-',
          'Payment Date': p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-',
          'Payment Mode': p.payment_mode || '-',
          'Paid Fees': paidAmount,
          'Total Fees': courseFee,
          'Due Payment': admissionDue,
          'Status': p.status || '-',
          'Student Contact': p.student_mobile || '-',
          'Collected By': p.collected_by_name || '-',
          'Reference No': p.reference_no || '-',
          'Notes': p.notes || '-'
        }
      })

      // Add total row
      excelData.push({
        'Payment ID': 'TOTAL',
        'Student Name': '',
        'Course Name': '',
        'Branch': '',
        'Payment Date': '',
        'Payment Mode': '',
        'Paid Fees': totalAmountPaid,
        'Total Fees': totalCourseFee,
        'Due Payment': totalDuePayment,
        'Status': '',
        'Student Contact': '',
        'Collected By': '',
        'Reference No': '',
        'Notes': ''
      })

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // Add styles
      for (const cellAddress in worksheet) {
        if (cellAddress[0] === '!') continue
        const cell = worksheet[cellAddress]
        if (cell.v === 'Pending') {
          cell.s = { font: { color: { rgb: 'FF0000' }, bold: true } }
        } else if (cell.v === 'TOTAL') {
          cell.s = { font: { bold: true } }
        }
      }

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments')
      XLSX.writeFile(workbook, `Payments_Report_${new Date().getTime()}.xlsx`)

    } catch (err: any) {
      console.error(err)
      setPayError('Failed to generate report. Please try again.')
    }
    setPayLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Reports & Data Export</h2>
        <p className="text-sm text-gray-500 mt-1">Download comprehensive admission data including marks, categories, and demographic details.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Export Admissions Data</h3>
            <p className="text-xs text-gray-500">Select filters to download specific records, or leave empty for all.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Branch Filter */}
          {isSuper && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                Branch
              </label>
              <select 
                value={filterBranch} 
                onChange={e => setFilterBranch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Course Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <BookOpen size={14} /> Course
            </label>
            <select 
              value={filterCourse} 
              onChange={e => setFilterCourse(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Calendar size={14} /> From Date
            </label>
            <input 
              type="date" 
              value={filterDateFrom} 
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Calendar size={14} /> To Date
            </label>
            <input 
              type="date" 
              value={filterDateTo} 
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="primary" 
            className="px-8 py-2.5 flex items-center justify-center gap-2"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Generating Excel File...' : 'Download Excel Report'}
          </Button>
          {(filterBranch || filterCourse || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterBranch(''); setFilterCourse(''); setFilterDateFrom(''); setFilterDateTo('') }}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Export Enquiries Data</h3>
            <p className="text-xs text-gray-500">Select filters to download specific enquiries, or leave empty for all.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Branch Filter */}
          {isSuper && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                Branch
              </label>
              <select 
                value={filterEnqBranch} 
                onChange={e => setFilterEnqBranch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Course Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              Stream / Course
            </label>
            <select 
              value={filterEnqCourseType} 
              onChange={e => setFilterEnqCourseType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="">All Streams</option>
              <option value="Engineering">Engineering</option>
              <option value="Medical">Medical</option>
            </select>
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Calendar size={14} /> From Date
            </label>
            <input 
              type="date" 
              value={filterEnqDateFrom} 
              onChange={e => setFilterEnqDateFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Calendar size={14} /> To Date
            </label>
            <input 
              type="date" 
              value={filterEnqDateTo} 
              onChange={e => setFilterEnqDateTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
        </div>

        {enqError && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{enqError}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="primary" 
            className="px-8 py-2.5 flex items-center justify-center gap-2 !bg-green-600 hover:!bg-green-700"
            onClick={handleEnquiryExport}
            disabled={enqLoading}
          >
            {enqLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {enqLoading ? 'Generating Excel File...' : 'Download Excel Report'}
          </Button>
          {(filterEnqBranch || filterEnqCourseType || filterEnqDateFrom || filterEnqDateTo) && (
            <button
              onClick={() => { setFilterEnqBranch(''); setFilterEnqCourseType(''); setFilterEnqDateFrom(''); setFilterEnqDateTo('') }}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Export Payments Data</h3>
            <p className="text-xs text-gray-500">Download transaction records, paid amounts, and fee balances.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Branch Filter */}
          {isSuper && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                Branch
              </label>
              <select 
                value={filterPayBranch} 
                onChange={e => setFilterPayBranch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Course Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              Course
            </label>
            <select 
              value={filterPayCourse} 
              onChange={e => setFilterPayCourse(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Calendar size={14} /> From Date
            </label>
            <input 
              type="date" 
              value={filterPayDateFrom} 
              onChange={e => setFilterPayDateFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Calendar size={14} /> To Date
            </label>
            <input 
              type="date" 
              value={filterPayDateTo} 
              onChange={e => setFilterPayDateTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {payError && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{payError}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="primary" 
            className="px-8 py-2.5 flex items-center justify-center gap-2 !bg-purple-600 hover:!bg-purple-700"
            onClick={handlePaymentExport}
            disabled={payLoading}
          >
            {payLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {payLoading ? 'Generating Excel File...' : 'Download Excel Report'}
          </Button>
          {(filterPayBranch || filterPayCourse || filterPayDateFrom || filterPayDateTo) && (
            <button
              onClick={() => { setFilterPayBranch(''); setFilterPayCourse(''); setFilterPayDateFrom(''); setFilterPayDateTo('') }}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
