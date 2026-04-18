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
        return {
          'Admission Number': a.admission_number || '-',
          'Student Name': a.student_name || details.full_name || '-',
          'Mobile': a.student_mobile || details.mobile || '-',
          'Email': details.email || '-',
          'Gender': details.gender || '-',
          'DOB': details.dob || '-',
          'Branch': a.branch_name || '-',
          'Course': a.course_name || '-',
          'Admission Status': a.admission_status || '-',
          'Admitted At': a.admitted_at ? new Date(a.admitted_at).toLocaleDateString() : '-',
          
          // Address
          'City': details.city || '-',
          'Taluka': details.taluka || '-',
          'District': details.district || '-',
          'State': details.state || '-',
          'Pincode': details.pincode || '-',

          // Academic
          'SSC Year': details.ssc_year || '-',
          'SSC %': details.ssc_percentage || '-',
          'HSC Year': details.hsc_passing_year || '-',
          'Physics Marks': details.physics_obtained || '-',
          'Chemistry Marks': details.chemistry_obtained || '-',
          'Maths Marks': details.maths_obtained || '-',
          'Biology Marks': details.biology_obtained || '-',
          'English Marks': details.english_obtained || '-',
          'PCB Total': details.pcb_obtained || '-',
          'PCM Total': details.pcm_obtained || '-',
          'NEET Marks': details.neet_marks || '-',
          'JEE Percentile': details.jee_percentile || '-',
          
          // Reservation
          'Category': details.category_of_candidate || '-',
          'Sub Category': details.sub_category || '-',
          'Religion': details.religion || '-',
          'Aadhaar': details.aadhaar_no || '-',
          'Parent Mobile': details.alternate_mobile || '-',
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
