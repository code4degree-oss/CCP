'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { enquiriesApi, branchesApi } from '@/lib/api'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import clsx from 'clsx'

function Field({ label, value, mono, accent }: { label: string; value?: string | number | boolean | null; mono?: boolean; accent?: string }) {
  const display = value === undefined || value === null || value === ''
    ? '—'
    : typeof value === 'boolean'
      ? value ? 'Yes' : 'No'
      : String(value)

  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-widest text-txt-muted font-medium">{label}</div>
      <div className={clsx(
        'text-sm',
        display === '—' ? 'text-txt-muted' : accent ? accent : 'text-txt-primary',
        mono && 'font-mono',
      )}>
        {display}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-6 shadow-sm mb-6 print:shadow-none print:border-gray-200">
      <h3 className="text-sm uppercase tracking-widest text-txt-muted font-bold mb-4 border-b border-bg-border pb-2 print:border-gray-200">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  )
}

export default function EnquiryDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [enquiry, setEnquiry] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        const [eRes, bRes] = await Promise.all([
          enquiriesApi.get(id),
          branchesApi.list()
        ])
        setEnquiry(eRes)
        setBranches(bRes)
      } catch (err: any) {
        setError(err.message || 'Failed to load enquiry details')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const branchName = (branchId: number) => {
    const branch = branches.find((b: any) => b.id === branchId)
    return branch ? branch.name : '—'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <Loader2 size={32} className="animate-spin text-accent-blue" />
      </div>
    )
  }

  if (error || !enquiry) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-txt-secondary">{error || 'Enquiry not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => window.close()}>
            <ArrowLeft size={16} /> Close Tab
          </Button>
        </div>

        {/* Page Title */}
        <div className="bg-gradient-to-r from-accent-blue/10 to-accent-green/10 border border-bg-border rounded-xl p-8 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary mb-1">Enquiry Details</h1>
            <p className="text-txt-secondary">Detailed view for {enquiry.full_name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-txt-muted uppercase tracking-widest">Enquiry ID</div>
            <div className="text-2xl font-mono text-accent-blue font-bold">#{enquiry.id}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Section title="Basic Information">
            <Field label="Full Name" value={enquiry.full_name} />
            <Field label="Mobile" value={enquiry.mobile} mono />
            <Field label="Parent Mobile" value={enquiry.parent_mobile} mono />
            <Field label="Mother Name" value={enquiry.mother_name} />
            <Field label="Gender" value={enquiry.gender} />
            <Field label="Date of Birth" value={enquiry.dob} mono />
            <Field label="Category" value={enquiry.category} />
            <Field label="Candidate Type" value={enquiry.candidate_type} />
          </Section>

          <Section title="Enquiry Details">
            <Field label="Branch" value={branchName(enquiry.branch)} />
            <Field label="Course Interest" value={enquiry.course_interest} />
            <Field label="Filled By" value={enquiry.counselor_name || '—'} />
            <Field label="Date" value={enquiry.created_at ? new Date(enquiry.created_at).toLocaleDateString() : ''} mono />
            <Field label="Source" value={enquiry.source} />
          </Section>

          <Section title="Academic & NEET Details">
            <Field label="HSC Percentage" value={enquiry.hsc_percentage ? `${enquiry.hsc_percentage}%` : ''} mono />
            <Field label="Expected NEET Marks" value={enquiry.neet_expected_marks} mono accent="text-accent-green" />
            <Field label="NEET Application No" value={enquiry.neet_application_no} mono />
            <Field label="NEET Roll No" value={enquiry.neet_roll_no} mono />
          </Section>

          <Section title="Additional Information">
            <Field label="Tuition Name" value={enquiry.tuition_name} />
            <Field label="Reference Name" value={enquiry.reference_name} />
          </Section>
        </div>
      </div>
    </div>
  )
}
