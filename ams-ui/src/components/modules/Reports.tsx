'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, FileSpreadsheet, Calendar, BookOpen } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { admissionsApi, branchesApi, branchCoursesApi, coursesApi } from '@/lib/api'
import * as XLSX from 'xlsx'

export function ReportsModule() {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [filterCourse, setFilterCourse] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [error, setError] = useState('')

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
      if (filterCourse) qs += `course=${filterCourse}&`
      if (filterDateFrom) qs += `date_from=${filterDateFrom}&`
      if (filterDateTo) qs += `date_to=${filterDateTo}&`
      
      const list = await admissionsApi.list(qs !== '?' ? qs : undefined)
      if (!list || list.length === 0) {
        setError('No admissions found for the selected filters.')
        setLoading(false)
        return
      }

      // Fetch full details for each admission to get marks, caste, state etc.
      // We do this in chunks to avoid overwhelming the server
      const fullData = []
      for (let i = 0; i < list.length; i += 5) {
        const chunk = list.slice(i, i + 5)
        const res = await Promise.all(chunk.map((a: any) => admissionsApi.get(a.id).catch(() => a)))
        fullData.push(...res)
      }

      // Flatten data for Excel
      const excelData = fullData.map((a: any) => {
        const details = a.student_detail || {}
        const acad = details.academic_details || {}
        const demo = details.demographic_details || {}
        
        const displayStatus = a.admission_status === 'Under Review' ? 'Form Completed' : (a.admission_status || '-')

        return {
          'Admission Number': a.admission_number || '-',
          'Student Name': a.student_name || details.full_name || '-',
          'Mobile': a.student_mobile || details.mobile || '-',
          'Email': details.email || '-',
          'Gender': details.gender || '-',
          'DOB': details.dob || '-',
          'Branch': a.branch_name || '-',
          'Course': a.course_name || '-',
          'Admission Status': displayStatus,
          'Admitted At': a.admitted_at ? new Date(a.admitted_at).toLocaleDateString() : '-',
          
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
          'SSC Year': acad.ssc_year || '-',
          'SSC %': acad.ssc_percentage || '-',
          'SSC Language': acad.ssc_language || '-',
          'SSC State': acad.ssc_state || '-',
          'SSC District': acad.ssc_district || '-',
          'SSC Taluka': acad.ssc_taluka || '-',
          'SSC School Name': acad.ssc_school_name || '-',
          'SSC Roll No': acad.ssc_roll_no || '-',

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Button 
          variant="primary" 
          className="w-full md:w-auto px-8 py-2.5 flex items-center justify-center gap-2"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {loading ? 'Generating Excel File...' : 'Download Excel Report'}
        </Button>
      </Card>
    </div>
  )
}
